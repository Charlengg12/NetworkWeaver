from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
import platform
import subprocess
import logging

router = APIRouter(
    prefix="/monitoring",
    tags=["monitoring"]
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_ping(host: str) -> bool:
    """
    Returns True if host (str) responds to a ping request.
    """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    
    # 1 second timeout to keep it fast
    timeout_value = '1000' if platform.system().lower() == 'windows' else '1' 

    command = ['ping', param, '1', param_timeout, timeout_value, host]

    try:
        return subprocess.call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    except Exception as e:
        logger.error(f"Ping error for {host}: {e}")
        return False

@router.get("/status")
def get_device_status(db: Session = Depends(get_db)):
    """
    Returns a list of devices with their current Ping Status (UP/DOWN).
    Used for the Dashboard "Live Status" alerts.
    """
    devices = db.query(models.Device).all()
    results = []
    
    for device in devices:
        is_up = check_ping(device.ip_address)
        results.append({
            "id": device.id,
            "name": device.name,
            "ip_address": device.ip_address,
            "status": "UP" if is_up else "DOWN"
        })
    
    return results

@router.get("/targets")
def get_prometheus_targets(db: Session = Depends(get_db)):
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
    """
    devices = db.query(models.Device).all()
    targets = []
    
    for device in devices:
        targets.append({
            "targets": [device.ip_address],
            "labels": {
                "instance": device.ip_address,
                "hostname": device.name,
                "device_id": str(device.id)
            }
        })
        
    return targets
