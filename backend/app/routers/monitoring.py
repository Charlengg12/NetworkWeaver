from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
import platform
import subprocess
import logging
from typing import List, Dict, Any

router = APIRouter(
    prefix="/monitoring",
    tags=["monitoring"]
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_ping(host: str, timeout: int = 1) -> bool:
    """
    Returns True if host (str) responds to a ping request.
    
    Args:
        host: IP address or hostname to ping
        timeout: Timeout in seconds (default: 1)
    """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    
    timeout_value = str(timeout * 1000) if platform.system().lower() == 'windows' else str(timeout)

    command = ['ping', param, '1', param_timeout, timeout_value, host]

    try:
        result = subprocess.call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
        if result:
            logger.debug(f"Ping successful for {host}")
        else:
            logger.debug(f"Ping failed for {host}")
        return result
    except Exception as e:
        logger.error(f"Ping error for {host}: {e}")
        return False

@router.get("/status")
def get_device_status(
    db: Session = Depends(get_db),
    include_unreachable: bool = Query(default=True, description="Include unreachable devices in results")
):
    """
    Returns a list of devices with their current Ping Status (UP/DOWN).
    Used for the Dashboard "Live Status" alerts.
    
    Args:
        include_unreachable: If False, filters out devices that are DOWN
    """
    devices = db.query(models.Device).all()
    results = []
    
    logger.info(f"Checking status for {len(devices)} devices")
    
    for device in devices:
        is_up = check_ping(device.ip_address, timeout=2)
        device_status = {
            "id": device.id,
            "name": device.name,
            "ip_address": device.ip_address,
            "status": "UP" if is_up else "DOWN"
        }
        
        if include_unreachable or is_up:
            results.append(device_status)
        else:
            logger.debug(f"Filtered out unreachable device: {device.name}")
    
    logger.info(f"Status check complete: {len(results)} devices returned")
    return results

@router.get("/targets")
def get_prometheus_targets(
    db: Session = Depends(get_db),
    filter_unreachable: bool = Query(default=False, description="Filter out unreachable devices")
):
    """
    Returns a JSON list formatted for Prometheus HTTP Service Discovery.
    Format:
    [
      {
        "targets": ["10.10.10.18"],
        "labels": {
          "instance": "10.10.10.18",
          "hostname": "Lab-Router-1"
        }
      }
    ]
    
    Args:
        filter_unreachable: If True, only returns reachable devices (requires ping check)
    """
    devices = db.query(models.Device).all()
    targets = []
    
    logger.info(f"Generating Prometheus targets for {len(devices)} devices (filter_unreachable={filter_unreachable})")
    
    for device in devices:
        # Skip unreachable devices if filtering is enabled
        if filter_unreachable:
            is_reachable = check_ping(device.ip_address, timeout=1)
            if not is_reachable:
                logger.debug(f"Skipping unreachable device: {device.name} ({device.ip_address})")
                continue
        
        targets.append({
            "targets": [device.ip_address],
            "labels": {
                "instance": device.ip_address,
                "hostname": device.name,
                "device_id": str(device.id)
            }
        })
    
    logger.info(f"Returning {len(targets)} targets to Prometheus")
    return targets

@router.get("/health")
def get_monitoring_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns overall health status of the monitoring system.
    
    Provides statistics about devices and their reachability.
    """
    devices = db.query(models.Device).all()
    
    if not devices:
        return {
            "status": "warning",
            "message": "No devices configured",
            "total_devices": 0,
            "reachable": 0,
            "unreachable": 0
        }
    
    reachable = 0
    unreachable = 0
    
    for device in devices:
        if check_ping(device.ip_address, timeout=2):
            reachable += 1
        else:
            unreachable += 1
    
    total = len(devices)
    health_percentage = (reachable / total * 100) if total > 0 else 0
    
    # Determine overall status
    if health_percentage == 100:
        status = "healthy"
    elif health_percentage >= 50:
        status = "degraded"
    else:
        status = "unhealthy"
    
    return {
        "status": status,
        "total_devices": total,
        "reachable": reachable,
        "unreachable": unreachable,
        "health_percentage": round(health_percentage, 2)
    }
