from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ... import database, models
from .connection import get_routeros_connection
import os
import uuid
import time

router = APIRouter(
    prefix="",  # Main.py mounts this at /routeros/scripts already
    tags=["scripts"]
)

SCRIPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "scripts", "routeros")

@router.get("/")
def list_scripts():
    """List available RouterOS scripts."""
    scripts = []
    if os.path.exists(SCRIPTS_DIR):
        for f in os.listdir(SCRIPTS_DIR):
            if f.endswith(".rsc"):
                with open(os.path.join(SCRIPTS_DIR, f), "r") as file:
                    content = file.read()
                scripts.append({
                    "name": f,
                    "description": f.replace("_", " ").replace(".rsc", "").title(),
                    "content": content
                })
    return scripts

@router.post("/execute/{device_id}")
def execute_script(device_id: int, script_name: str, db: Session = Depends(database.get_db)):
    """
    Execute a script on a specific device using /system/script/add and /run.
    This works by uploading the script content to the router's script repository, running it, and removing it.
    """
    
    # 1. Get Script Content
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="Script not found")
    
    with open(script_path, "r") as f:
        script_content = f.read()

    # 2. Get Device & Connection
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    connection = None
    temp_script_name = f"networkweaver_{uuid.uuid4().hex[:8]}"

    try:
        logger.info(f"Connecting to {device.name} to execute {script_name}")
        connection, api = get_routeros_connection(device)
        
        system_script = api.get_resource('/system/script')
        
        # 3. Add script to router (overwrite if exists)
        try:
            logger.info(f"Adding temporary script: {temp_script_name}")
            system_script.add(name=temp_script_name, source=script_content)
        except Exception as e:
            # If it exists, remove and try again
            try:
                existing = system_script.get(name=temp_script_name)
                if existing:
                    system_script.remove(id=existing[0]['id'])
                    system_script.add(name=temp_script_name, source=script_content)
            except Exception as e2:
                raise Exception(f"Failed to upload script: {str(e2)}")

        # 4. Run the script
        logger.info(f"Running script: {temp_script_name}")
        try:
            system_script.run(id=temp_script_name)
            message = "Script executed successfully."
        except Exception as e:
            message = f"Script execution triggered error (might be expected): {str(e)}"
            logger.warning(message)

        # 5. Cleanup
        try:
            # Short delay to allow execution to start
            time.sleep(1)
            existing = system_script.get(name=temp_script_name)
            if existing:
                system_script.remove(id=existing[0]['id'])
        except Exception as e:
            logger.warning(f"Failed to cleanup temp script: {str(e)}")
        
        return {
            "status": "success", 
            "message": f"Script {script_name} executed on {device.name}", 
            "details": message
        }

    except Exception as e:
        logger.error(f"Execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")
    finally:
        if connection:
            connection.disconnect()

import logging
logger = logging.getLogger(__name__)
