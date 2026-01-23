from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ... import models
from ...database import get_db
from .connection import (
    get_routeros_connection, 
    RouterOSTimeoutError, 
    RouterOSAuthError, 
    RouterOSNetworkError, 
    RouterOSConnectionError
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/metrics",
    tags=["RouterOS Metrics"]
)

@router.get("/resources/{device_id}")
def get_device_resources(device_id: int, db: Session = Depends(get_db)):
    """
    Get RouterOS system resources for a specific device.
    
    Returns resource information including CPU, memory, uptime, etc.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
    
    connection = None
    try:
        connection, api = get_routeros_connection(device, timeout=10, retries=1)
        resources = api.get_resource('/system/resource').get()
        return resources[0] if resources else {}
        
    except RouterOSTimeoutError as e:
        logger.error(f"Timeout connecting to device {device.name}: {str(e)}")
        raise HTTPException(
            status_code=504, 
            detail=f"Timeout connecting to device {device.name} at {device.ip_address}"
        )
    
    except RouterOSAuthError as e:
        logger.error(f"Authentication error for device {device.name}: {str(e)}")
        raise HTTPException(
            status_code=401, 
            detail=f"Authentication failed for device {device.name}. Check credentials."
        )
    
    except RouterOSNetworkError as e:
        logger.error(f"Network error for device {device.name}: {str(e)}")
        raise HTTPException(
            status_code=503, 
            detail=f"Network error connecting to device {device.name}: {str(e)}"
        )
    
    except RouterOSConnectionError as e:
        logger.error(f"Connection error for device {device.name}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to connect to device {device.name}: {str(e)}"
        )
    
    except Exception as e:
        logger.error(f"Unexpected error getting resources from device {device.name}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        )
    
    finally:
        if connection:
            try:
                connection.disconnect()
            except Exception as e:
                logger.warning(f"Error disconnecting from device {device.name}: {str(e)}")
