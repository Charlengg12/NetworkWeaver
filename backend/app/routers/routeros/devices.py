from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ... import models, schemas
from ...database import get_db
from .connection import get_routeros_connection

router = APIRouter(
    prefix="/devices",
    tags=["RouterOS Devices"]
)

@router.post("/{device_id}/test_connection")
def test_connection(device_id: int, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    connection, api = get_routeros_connection(device)
    try:
        # Try to fetch identity to verify connection
        identity = api.get_resource('/system/identity').get()
        return {"status": "success", "message": "Connection successful", "identity": identity}
    except Exception as e:
        return {"status": "error", "message": f"Connection failed: {str(e)}"}
    finally:
        connection.disconnect()
