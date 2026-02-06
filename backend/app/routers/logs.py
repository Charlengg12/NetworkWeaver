from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/logs",
    tags=["logs"]
)

@router.get("/")
def get_logs(limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetch configuration logs joined with device names.
    Maps database status to frontend levels (success, error, warning, info).
    """
    logs = db.query(models.ConfigurationLog).outerjoin(models.Device).order_by(models.ConfigurationLog.timestamp.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        # Map backend status to frontend level
        level = "info"
        status_lower = log.status.lower() if log.status else "info"
        
        if status_lower == "success":
            level = "success"
        elif status_lower == "failed" or status_lower == "error":
            level = "error"
        elif "warning" in status_lower:
            level = "warning"
            
        result.append({
            "id": log.log_id,
            "timestamp": log.timestamp.isoformat(),
            "level": level,
            "device": log.device.name if log.device else "System",
            "action": log.action_type,
            "message": log.details
        })
        
    return result
