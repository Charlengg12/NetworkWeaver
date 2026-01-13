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
            target_url = request.params.get("url")
            if not target_url:
                raise ValueError("Parameter 'url' is required for block_website")

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
                comment=f"Blocked by ConfigWeaver: {target_url}"
            )
            
            details = f"Blocked access to {target_url} (L7 + Filter Rule)"
        
        elif request.template_name == "basic_firewall":
            # Just an example implementation
            details = "Basic Firewall applied (Mock)"
        
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
