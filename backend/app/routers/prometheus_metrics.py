"""
Prometheus Metrics Exporter for RouterOS

Exposes RouterOS system metrics (CPU, RAM, Disk) in Prometheus format
so Grafana can query them as time-series data.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from prometheus_client import Gauge, CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
from .. import models
from ..database import get_db
from .routeros.connection import get_routeros_connection
import logging
import threading
import time

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Prometheus Metrics"])

# Create a custom registry to avoid conflicts
REGISTRY = CollectorRegistry()

# Define Gauges for RouterOS metrics
routeros_cpu_load = Gauge(
    'routeros_cpu_load_percent',
    'RouterOS CPU load percentage',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_memory_total = Gauge(
    'routeros_memory_total_bytes',
    'RouterOS total memory in bytes',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_memory_free = Gauge(
    'routeros_memory_free_bytes',
    'RouterOS free memory in bytes',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_memory_used = Gauge(
    'routeros_memory_used_bytes',
    'RouterOS used memory in bytes',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_hdd_total = Gauge(
    'routeros_hdd_total_bytes',
    'RouterOS total HDD space in bytes',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_hdd_free = Gauge(
    'routeros_hdd_free_bytes',
    'RouterOS free HDD space in bytes',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_uptime_seconds = Gauge(
    'routeros_uptime_seconds',
    'RouterOS uptime in seconds',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)

routeros_device_up = Gauge(
    'routeros_device_up',
    'RouterOS device reachability (1=up, 0=down)',
    ['device_id', 'device_name', 'ip_address'],
    registry=REGISTRY
)


def parse_uptime_to_seconds(uptime_str: str) -> int:
    """Convert RouterOS uptime string to seconds. E.g., '1w2d3h4m5s' -> seconds"""
    if not uptime_str:
        return 0
    
    total_seconds = 0
    multipliers = {'w': 604800, 'd': 86400, 'h': 3600, 'm': 60, 's': 1}
    
    current_num = ''
    for char in uptime_str:
        if char.isdigit():
            current_num += char
        elif char in multipliers and current_num:
            total_seconds += int(current_num) * multipliers[char]
            current_num = ''
    
    return total_seconds


def collect_device_metrics(device, db: Session):
    """Collect metrics from a single device via RouterOS API"""
    labels = {
        'device_id': str(device.id),
        'device_name': device.name,
        'ip_address': device.ip_address
    }
    
    connection = None
    try:
        connection, api = get_routeros_connection(device, timeout=5, retries=1)
        resources = api.get_resource('/system/resource').get()
        
        if resources:
            res = resources[0]
            
            # CPU
            cpu_load = int(res.get('cpu-load', 0))
            routeros_cpu_load.labels(**labels).set(cpu_load)
            
            # Memory
            total_mem = int(res.get('total-memory', 0))
            free_mem = int(res.get('free-memory', 0))
            used_mem = total_mem - free_mem
            
            routeros_memory_total.labels(**labels).set(total_mem)
            routeros_memory_free.labels(**labels).set(free_mem)
            routeros_memory_used.labels(**labels).set(used_mem)
            
            # HDD
            total_hdd = int(res.get('total-hdd-space', 0))
            free_hdd = int(res.get('free-hdd-space', 0))
            
            routeros_hdd_total.labels(**labels).set(total_hdd)
            routeros_hdd_free.labels(**labels).set(free_hdd)
            
            # Uptime
            uptime_str = res.get('uptime', '0s')
            uptime_seconds = parse_uptime_to_seconds(uptime_str)
            routeros_uptime_seconds.labels(**labels).set(uptime_seconds)
            
            # Device is up
            routeros_device_up.labels(**labels).set(1)
            
        connection.disconnect()
        
    except Exception as e:
        logger.warning(f"Failed to collect metrics from {device.name}: {str(e)}")
        # Mark device as down
        routeros_device_up.labels(**labels).set(0)
        
        if connection:
            try:
                connection.disconnect()
            except:
                pass


@router.get("/metrics")
def prometheus_metrics(db: Session = Depends(get_db)):
    """
    Prometheus metrics endpoint.
    
    Polls all RouterOS devices and returns metrics in Prometheus format.
    Configure Prometheus to scrape: http://backend:8000/metrics
    """
    # Get all devices
    devices = db.query(models.Device).all()
    
    # Collect metrics from each device
    for device in devices:
        collect_device_metrics(device, db)
    
    # Generate Prometheus format output
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST
    )
