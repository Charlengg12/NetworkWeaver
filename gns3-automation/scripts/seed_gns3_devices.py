#!/usr/bin/env python3
"""
GNS3 Device Seeding Script for NetworkWeaver
Automatically adds GNS3 MikroTik routers to the NetworkWeaver database
"""

import requests
import sys
import time
from typing import List, Dict

# Configuration
API_URL = "http://localhost:8000"
API_TIMEOUT = 10

# GNS3 Router Definitions
ROUTERS = [
    {
        "name": "Router1",
        "ip_address": "192.168.100.10",
        "username": "apiuser",
        "password": "apipass123",
        "location": "GNS3-Lab-Site1",
        "description": "MikroTik CHR - Primary Router",
        "snmp_community": "public",
        "snmp_version": "2c"
    },
    {
        "name": "Router2",
        "ip_address": "192.168.100.11",
        "username": "apiuser",
        "password": "apipass123",
        "location": "GNS3-Lab-Site2",
        "description": "MikroTik CHR - Secondary Router",
        "snmp_community": "public",
        "snmp_version": "2c"
    },
    {
        "name": "Router3",
        "ip_address": "192.168.100.12",
        "username": "apiuser",
        "password": "apipass123",
        "location": "GNS3-Lab-Site3",
        "description": "MikroTik CHR - Tertiary Router",
        "snmp_community": "public",
        "snmp_version": "2c"
    }
]


def check_api_health() -> bool:
    """Check if NetworkWeaver API is accessible"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=API_TIMEOUT)
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"❌ API health check failed: {e}")
        return False


def test_router_connectivity(ip_address: str) -> bool:
    """Test if router is reachable via ping"""
    import platform
    import subprocess
    
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', ip_address]
    
    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
        return result.returncode == 0
    except Exception as e:
        print(f"⚠️  Ping test failed for {ip_address}: {e}")
        return False


def add_device(device: Dict) -> bool:
    """Add a single device to NetworkWeaver"""
    try:
        # First, check if device already exists
        response = requests.get(f"{API_URL}/devices", timeout=API_TIMEOUT)
        if response.status_code == 200:
            existing_devices = response.json()
            for existing in existing_devices:
                if existing.get("ip_address") == device["ip_address"]:
                    print(f"ℹ️  Device {device['name']} ({device['ip_address']}) already exists, skipping...")
                    return True
        
        # Add new device
        response = requests.post(f"{API_URL}/devices", json=device, timeout=API_TIMEOUT)
        
        if response.status_code in [200, 201]:
            print(f"✅ Successfully added {device['name']} ({device['ip_address']})")
            return True
        else:
            print(f"❌ Failed to add {device['name']}: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error adding {device['name']}: {e}")
        return False


def verify_router_api(router: Dict) -> bool:
    """Verify RouterOS API connectivity"""
    try:
        import routeros_api
        
        connection = routeros_api.RouterOsApiPool(
            router['ip_address'],
            username=router['username'],
            password=router['password'],
            plaintext_login=True,
            port=8728
        )
        api = connection.get_api()
        resource = api.get_resource('/system/identity')
        identity = resource.get()
        
        print(f"✅ API verified for {router['name']}: {identity[0]['name']}")
        connection.disconnect()
        return True
        
    except ImportError:
        print("⚠️  routeros-api library not installed. Run: pip install routeros-api")
        return False
    except Exception as e:
        print(f"❌ API verification failed for {router['name']}: {e}")
        return False


def main():
    """Main execution function"""
    print("=" * 60)
    print("GNS3 Device Seeding Script for NetworkWeaver")
    print("=" * 60)
    print()
    
    # Step 1: Check API health
    print("Step 1: Checking NetworkWeaver API health...")
    if not check_api_health():
        print("❌ NetworkWeaver API is not accessible. Please ensure Docker containers are running.")
        print("   Run: docker-compose up -d")
        sys.exit(1)
    print("✅ API is healthy\n")
    
    # Step 2: Test router connectivity
    print("Step 2: Testing router connectivity...")
    reachable_routers = []
    for router in ROUTERS:
        if test_router_connectivity(router['ip_address']):
            print(f"✅ {router['name']} ({router['ip_address']}) is reachable")
            reachable_routers.append(router)
        else:
            print(f"⚠️  {router['name']} ({router['ip_address']}) is not reachable")
    
    if not reachable_routers:
        print("\n❌ No routers are reachable. Please check your GNS3 topology.")
        sys.exit(1)
    print()
    
    # Step 3: Verify RouterOS API (optional)
    print("Step 3: Verifying RouterOS API connectivity...")
    for router in reachable_routers:
        verify_router_api(router)
    print()
    
    # Step 4: Add devices to NetworkWeaver
    print("Step 4: Adding devices to NetworkWeaver...")
    success_count = 0
    for router in reachable_routers:
        if add_device(router):
            success_count += 1
        time.sleep(0.5)  # Rate limiting
    
    print()
    print("=" * 60)
    print(f"Summary: {success_count}/{len(reachable_routers)} devices added successfully")
    print("=" * 60)
    
    if success_count == len(reachable_routers):
        print("\n✅ All devices added successfully!")
        print(f"\n🌐 Access NetworkWeaver at: http://localhost:5173")
        sys.exit(0)
    else:
        print("\n⚠️  Some devices could not be added. Check the logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
