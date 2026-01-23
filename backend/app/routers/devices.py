from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from typing import List
import subprocess
import platform
import socket
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/devices",
    tags=["devices"]
)

def check_ping(host: str, timeout: int = 1) -> tuple[bool, str]:
    """
    Check if a host responds to ping.
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    timeout_value = str(timeout * 1000) if platform.system().lower() == 'windows' else str(timeout)
    
    command = ['ping', param, '1', param_timeout, timeout_value, host]
    
    try:
        result = subprocess.call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result == 0:
            return True, "Host is reachable"
        else:
            return False, "Host did not respond to ping"
    except Exception as e:
        return False, f"Ping failed: {str(e)}"

def check_port(host: str, port: int, timeout: int = 2) -> tuple[bool, str]:
    """
    Check if a specific port is open on a host.
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            return True, f"Port {port} is open"
        else:
            return False, f"Port {port} is closed or filtered"
    except socket.gaierror:
        return False, f"DNS resolution failed for {host}"
    except socket.timeout:
        return False, f"Connection to port {port} timed out"
    except Exception as e:
        return False, f"Port check failed: {str(e)}"

@router.get("/", response_model=List[schemas.Device])
def read_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    devices = db.query(models.Device).offset(skip).limit(limit).all()
    return devices

@router.post("/", response_model=schemas.Device)
def create_device(
    device: schemas.DeviceCreate, 
    db: Session = Depends(get_db),
    validate_connectivity: bool = Query(default=True, description="Validate device connectivity before creation")
):
    """
    Create a new device with optional connectivity validation.
    
    Args:
        device: Device creation schema
        validate_connectivity: If True, validates ping and API port connectivity before creating
    """
    # Validate connectivity if requested
    if validate_connectivity:
        validation_errors = []
        
        # Check ping
        ping_ok, ping_msg = check_ping(device.ip_address, timeout=2)
        if not ping_ok:
            validation_errors.append(f"Ping check failed: {ping_msg}")
            logger.warning(f"Device {device.name} at {device.ip_address} failed ping check")
        
        # Check API port if device has RouterOS credentials
        if device.api_port:
            port_ok, port_msg = check_port(device.ip_address, device.api_port, timeout=3)
            if not port_ok:
                validation_errors.append(f"API port check failed: {port_msg}")
                logger.warning(f"Device {device.name} API port {device.api_port} not accessible")
        
        # If validation failed, return error with details
        if validation_errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Device validation failed",
                    "errors": validation_errors,
                    "suggestion": "Check that the device is powered on, reachable on the network, and has the correct IP address. You can bypass validation by setting validate_connectivity=false."
                }
            )
    
    # Create device
    try:
        db_device = models.Device(**device.dict())
        db.add(db_device)
        db.commit()
        db.refresh(db_device)
        logger.info(f"Successfully created device {db_device.name} (ID: {db_device.id})")
        return db_device
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create device {device.name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create device: {str(e)}")

@router.get("/test/{device_id}")
def test_device_connectivity(device_id: int, db: Session = Depends(get_db)):
    """
    Test connectivity to a device without modifying it.
    
    Returns detailed connectivity status including ping and port checks.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
    
    results = {
        "device_id": device.id,
        "device_name": device.name,
        "ip_address": device.ip_address,
        "tests": {}
    }
    
    # Ping test
    ping_ok, ping_msg = check_ping(device.ip_address, timeout=2)
    results["tests"]["ping"] = {
        "success": ping_ok,
        "message": ping_msg
    }
    
    # API port test
    if device.api_port:
        port_ok, port_msg = check_port(device.ip_address, device.api_port, timeout=3)
        results["tests"]["api_port"] = {
            "port": device.api_port,
            "success": port_ok,
            "message": port_msg
        }
    
    # SNMP port test (if SNMP community is configured)
    if device.snmp_community:
        snmp_ok, snmp_msg = check_port(device.ip_address, 161, timeout=3)
        results["tests"]["snmp_port"] = {
            "port": 161,
            "success": snmp_ok,
            "message": snmp_msg
        }
    
    # Overall status
    all_tests = [test["success"] for test in results["tests"].values()]
    results["overall_status"] = "healthy" if all(all_tests) else "unhealthy"
    results["success_rate"] = f"{sum(all_tests)}/{len(all_tests)}"
    
    return results

@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    db_device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(db_device)
    db.commit()
    logger.info(f"Deleted device {db_device.name} (ID: {device_id})")
    return {"message": "Device deleted"}
