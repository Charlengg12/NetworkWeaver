from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ... import models
from ...database import get_db
from .connection import get_routeros_connection

router = APIRouter(
    prefix="/metrics",
    tags=["RouterOS Metrics"]
)

@router.get("/resources/{device_id}")
def get_device_resources(device_id: int, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    connection, api = get_routeros_connection(device)
    try:
        resources = api.get_resource('/system/resource').get()
        return resources[0] if resources else {}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.disconnect()
