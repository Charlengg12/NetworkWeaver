from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ... import models, schemas
from ...database import get_db
from .connection import get_routeros_connection
import datetime

router = APIRouter(
    prefix="/config",
    tags=["RouterOS Config"]
)

@router.post("/execute")
def execute_command(request: schemas.ConfigRequest, db: Session = Depends(get_db)):
    # Note: This is an example of executing a script/template
    device = db.query(models.Device).filter(models.Device.id == request.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    connection, api = get_routeros_connection(device)
    
    try:
        # Example: we might interpret templates here. For now, let's assume 'template_name' is a literal command for simplicity
        # OR we leave placeholder implementation
        
        # log start
        log_entry = models.ConfigurationLog(
            device_id=device.id,
            timestamp=datetime.datetime.utcnow(),
            action_type="execute_config",
            status="pending",
            details=f"Executing template: {request.template_name} with params: {request.params}"
        )
        db.add(log_entry)
        db.commit()

        # Execute logic (Placeholder - safely executing arbitrary commands is risky)
        # command = f"/system identity set name={request.params.get('name')}" 
        # api.get_binary_resource('/').call('run_script', {'name': '...'})
        
        # Determine success
        log_entry.status = "success"
        db.commit()
        
        return {"status": "success", "message": "Configuration executed (Mock)"}

    except Exception as e:
        log_entry.status = "failed"
        log_entry.details += f"\nError: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.disconnect()
