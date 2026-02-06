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

@router.get("/metrics")
def prometheus_metrics(db: Session = Depends(get_db)):
    """
    Prometheus metrics endpoint.
    Polls all RouterOS devices and returns metrics in Prometheus format.
    Uses a fresh registry per request to avoid reporting stale data.
    """
    # Create a fresh registry for this scrape
    registry = CollectorRegistry()
    
    # Define Gauges (re-registered each time to this temporary registry)
    labels = ['device_id', 'device_name', 'ip_address', 'instance']
    
    g_cpu = Gauge('routeros_cpu_load_percent', 'RouterOS CPU load percentage', labels, registry=registry)
    g_mem_total = Gauge('routeros_memory_total_bytes', 'RouterOS total memory in bytes', labels, registry=registry)
    g_mem_free = Gauge('routeros_memory_free_bytes', 'RouterOS free memory in bytes', labels, registry=registry)
    g_mem_used = Gauge('routeros_memory_used_bytes', 'RouterOS used memory in bytes', labels, registry=registry)
    g_hdd_total = Gauge('routeros_hdd_total_bytes', 'RouterOS total HDD space in bytes', labels, registry=registry)
    g_hdd_free = Gauge('routeros_hdd_free_bytes', 'RouterOS free HDD space in bytes', labels, registry=registry)
    g_uptime = Gauge('routeros_uptime_seconds', 'RouterOS uptime in seconds', labels, registry=registry)
    g_up = Gauge('routeros_device_up', 'RouterOS device reachability (1=up, 0=down)', labels, registry=registry)

    # Get devices
    devices = db.query(models.Device).all()
    
    threads = []
    
    def collect_for_device(device):
        device_labels = {
            'device_id': str(device.id),
            'device_name': device.name,
            'ip_address': device.ip_address,
            'instance': f"{device.ip_address}:161"  # Match SNMP Format for Dashboard compatibility
        }
        
        connection = None
        try:
            # Short timeout for synchronous scraping
            connection, api = get_routeros_connection(device, timeout=3, retries=0)
            resources = api.get_resource('/system/resource').get()
            
            if resources:
                res = resources[0]
                
                # CPU
                g_cpu.labels(**device_labels).set(int(res.get('cpu-load', 0)))
                
                # Memory
                total_mem = int(res.get('total-memory', 0))
                free_mem = int(res.get('free-memory', 0))
                g_mem_total.labels(**device_labels).set(total_mem)
                g_mem_free.labels(**device_labels).set(free_mem)
                g_mem_used.labels(**device_labels).set(total_mem - free_mem)
                
                # HDD
                total_hdd = int(res.get('total-hdd-space', 0))
                free_hdd = int(res.get('free-hdd-space', 0))
                g_hdd_total.labels(**device_labels).set(total_hdd)
                g_hdd_free.labels(**device_labels).set(free_hdd)
                
                # Uptime
                uptime_str = res.get('uptime', '0s')
                # Simple parsing or use helper if moved
                total_seconds = 0
                multipliers = {'w': 604800, 'd': 86400, 'h': 3600, 'm': 60, 's': 1}
                current_num = ''
                for char in uptime_str:
                    if char.isdigit():
                        current_num += char
                    elif char in multipliers and current_num:
                        total_seconds += int(current_num) * multipliers[char]
                        current_num = ''
                
                g_uptime.labels(**device_labels).set(total_seconds)
                g_up.labels(**device_labels).set(1)

            connection.disconnect()
            
        except Exception as e:
            # Log specific error but don't crash
            logger.debug(f"Device {device.ip_address} unreachable: {e}")
            # Mark as down explicitly
            g_up.labels(**device_labels).set(0)
            # Do NOT set other metrics -> Stale -> N/A in Grafana
            
            if connection:
                try: connection.disconnect()
                except: pass

    # Collect sequentially to avoid thread overhead complexity inside async context
    # (Or use threading if performance needed, but for <10 devices sequential is safer for connection lib)
    for device in devices:
        collect_for_device(device)
    
    return Response(
        content=generate_latest(registry),
        media_type=CONTENT_TYPE_LATEST
    )
