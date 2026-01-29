from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
import routeros_api
import traceback

router = APIRouter(
    prefix="/config",
    tags=["configuration"]
)

@router.post("/deploy", response_model=schemas.ConfigResponse)
def deploy_configuration(request: schemas.ConfigRequest, db: Session = Depends(get_db)):
    # 1. Fetch device details
    device = db.query(models.Device).filter(models.Device.id == request.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # 2. Get Connection
    from .routeros.connection import get_routeros_connection
    
    status = "Failed"
    details = ""
    action_type = request.template_name

    try:
        connection, api = get_routeros_connection(device)
        
        # 3. Execute Sequence based on diagram
        if request.template_name == "block_website":
            target_url = request.params.get("url") or request.params.get("URL")
            if not target_url:
                raise ValueError("Parameter 'url' or 'URL' is required for block_website")

            # A. Add Layer 7 Protocol
            l7 = api.get_resource('/ip/firewall/layer7-protocol')
            # Check if exists to avoid error
            existing = l7.get(name=f"block_{target_url}")
            if not existing:
                l7.add(name=f"block_{target_url}", regexp=f"^{target_url}.*$")
            
            # B. Add Filter Rule
            filter_rules = api.get_resource('/ip/firewall/filter')
            # Simple check or just add (RouterOS allows duplicates usually, but good to be clean)
            filter_rules.add(
                chain="forward", 
                action="drop", 
                layer7_protocol=f"block_{target_url}",
                comment=f"Blocked by NetworkWeaver: {target_url}"
            )
            
            details = f"Blocked access to {target_url} (L7 + Filter Rule)"
        
        elif request.template_name == "bandwidth_limit":
            target_ip = request.params.get("target_ip") or request.params.get("Target IP")
            max_upload = request.params.get("max_upload") or request.params.get("Max Upload") or "10M"
            max_download = request.params.get("max_download") or request.params.get("Max Download") or "10M"
            
            if not target_ip:
                raise ValueError("Parameter 'target_ip' or 'Target IP' is required for bandwidth_limit")
            
            # Create Simple Queue for bandwidth limiting
            queue = api.get_resource('/queue/simple')
            queue.add(
                name=f"nw_limit_{target_ip.replace('.', '_')}",
                target=target_ip,
                max_limit=f"{max_upload}/{max_download}",
                comment="NetworkWeaver Bandwidth Limit"
            )
            details = f"Bandwidth limit set for {target_ip}: Upload={max_upload}, Download={max_download}"
        
        elif request.template_name == "basic_firewall":
            wan = request.params.get("wan_interface") or request.params.get("WAN Interface") or "ether1"
            lan = request.params.get("lan_interface") or request.params.get("LAN Interface") or "ether2"
            
            filter_rules = api.get_resource('/ip/firewall/filter')
            
            # Add basic protection rules
            filter_rules.add(
                chain="input",
                action="accept",
                connection_state="established,related",
                comment="NetworkWeaver: Accept established"
            )
            filter_rules.add(
                chain="input",
                action="drop",
                in_interface=wan,
                connection_state="new",
                comment="NetworkWeaver: Drop new from WAN"
            )
            filter_rules.add(
                chain="forward",
                action="accept",
                connection_state="established,related",
                comment="NetworkWeaver: Forward established"
            )
            details = f"Basic firewall applied (WAN={wan}, LAN={lan})"
        
        elif request.template_name == "guest_network":
            ssid = request.params.get("ssid") or request.params.get("SSID") or "Guest-Network"
            gateway_ip = request.params.get("gateway_ip") or request.params.get("Gateway IP") or "192.168.88.1"
            dhcp_range = request.params.get("dhcp_range") or request.params.get("DHCP Range") or "192.168.88.10-192.168.88.100"
            
            # Create bridge for guest network
            bridge = api.get_resource('/interface/bridge')
            bridge.add(name="bridge-guest", comment="NetworkWeaver Guest Network")
            
            # Add IP address to bridge
            ip_addr = api.get_resource('/ip/address')
            ip_addr.add(address=f"{gateway_ip}/24", interface="bridge-guest", comment="Guest Gateway")
            
            # Setup DHCP server
            pool = api.get_resource('/ip/pool')
            pool.add(name="guest-pool", ranges=dhcp_range)
            
            dhcp = api.get_resource('/ip/dhcp-server')
            dhcp.add(name="guest-dhcp", interface="bridge-guest", address_pool="guest-pool")
            
            details = f"Guest network created: SSID={ssid}, Gateway={gateway_ip}"
        
        elif request.template_name == "port_forwarding":
            protocol = request.params.get("protocol") or request.params.get("Protocol") or "tcp"
            ext_port = request.params.get("external_port") or request.params.get("External Port")
            int_ip = request.params.get("internal_ip") or request.params.get("Internal IP")
            int_port = request.params.get("internal_port") or request.params.get("Internal Port")
            
            if not all([ext_port, int_ip, int_port]):
                raise ValueError("External Port, Internal IP, and Internal Port are required")
            
            nat = api.get_resource('/ip/firewall/nat')
            nat.add(
                chain="dstnat",
                action="dst-nat",
                protocol=protocol,
                dst_port=ext_port,
                to_addresses=int_ip,
                to_ports=int_port,
                comment=f"NetworkWeaver Port Forward: {ext_port}->{int_ip}:{int_port}"
            )
            details = f"Port forwarding: {protocol.upper()} :{ext_port} -> {int_ip}:{int_port}"
        
        elif request.template_name == "vpn_setup":
            username = request.params.get("username") or request.params.get("Username")
            password = request.params.get("password") or request.params.get("Password")
            
            if not username or not password:
                raise ValueError("Username and Password are required for VPN setup")
            
            # Enable PPTP server
            pptp = api.get_resource('/interface/pptp-server/server')
            pptp.set(enabled="yes")
            
            # Add VPN user
            secrets = api.get_resource('/ppp/secret')
            secrets.add(
                name=username,
                password=password,
                service="pptp",
                profile="default",
                comment="NetworkWeaver VPN User"
            )
            details = f"VPN setup complete: PPTP enabled, user '{username}' created"
        
        elif request.template_name == "mac_filtering":
            mac_address = request.params.get("mac_address") or request.params.get("MAC Address")
            action = request.params.get("action") or request.params.get("Action") or "deny"
            
            if not mac_address:
                raise ValueError("MAC Address is required")
            
            # Add to wireless access list
            access_list = api.get_resource('/interface/wireless/access-list')
            access_list.add(
                mac_address=mac_address,
                action="accept" if action.lower() == "allow" else "reject",
                comment=f"NetworkWeaver MAC Filter: {action}"
            )
            details = f"MAC filtering: {mac_address} -> {action.upper()}"
        
        elif request.template_name == "auto_backup":
            backup_name = request.params.get("backup_name") or request.params.get("Backup Name") or "networkweaver-backup"
            
            # Create backup
            system = api.get_resource('/system/backup')
            system.call('save', {'name': backup_name})
            
            details = f"Backup created: {backup_name}.backup"
        
        else:
            raise ValueError(f"Unknown template: {request.template_name}")

        connection.disconnect()
        status = "Success"

    except Exception as e:
        status = "Failed"
        details = str(e)
        print(traceback.format_exc())

    # 4. Log the action (Step 7 in diagram)
    new_log = models.ConfigurationLog(
        device_id=device.id,
        action_type=action_type,
        status=status,
        details=details
    )
    db.add(new_log)
    db.commit()

    if status == "Failed":
        # Return 500 so frontend sees the error
        raise HTTPException(status_code=500, detail=f"Configuration failed: {details}")

    return {"status": "Success", "message": details}

@router.get("/history", response_model=list[schemas.ConfigLogResponse])
def get_config_history(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(models.ConfigurationLog).order_by(models.ConfigurationLog.timestamp.desc()).limit(limit).all()
    return logs
