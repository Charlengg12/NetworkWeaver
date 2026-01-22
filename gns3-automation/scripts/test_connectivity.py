#!/usr/bin/env python3
"""
GNS3 Network Connectivity Testing Script
Tests all aspects of the GNS3 simulation connectivity
"""

import subprocess
import sys
import socket
from typing import List, Tuple
import platform

# Test Configuration
ROUTERS = [
    ("Router1", "192.168.100.10"),
    ("Router2", "192.168.100.11"),
    ("Router3", "192.168.100.12"),
]

SERVICES = [
    ("Backend API", "localhost", 8000),
    ("Frontend", "localhost", 5173),
    ("Prometheus", "localhost", 9090),
    ("Grafana", "localhost", 3000),
    ("SNMP Exporter", "localhost", 9116),
]

ROUTER_SERVICES = [
    ("RouterOS API", 8728),
    ("SSH", 22),
    ("HTTP", 80),
    ("SNMP", 161),
]


def test_ping(host: str, name: str) -> bool:
    """Test ICMP connectivity"""
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', '-w', '1000', host]
    
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=3
        )
        if result.returncode == 0:
            print(f"  ✅ {name}: PING successful")
            return True
        else:
            print(f"  ❌ {name}: PING failed")
            return False
    except Exception as e:
        print(f"  ❌ {name}: PING error - {e}")
        return False


def test_tcp_port(host: str, port: int, name: str, timeout: int = 2) -> bool:
    """Test TCP port connectivity"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"  ✅ {name}:{port} is open")
            return True
        else:
            print(f"  ❌ {name}:{port} is closed")
            return False
    except Exception as e:
        print(f"  ❌ {name}:{port} error - {e}")
        return False


def test_routeros_api(host: str, username: str = "apiuser", password: str = "apipass123") -> bool:
    """Test RouterOS API connectivity"""
    try:
        import routeros_api
        
        connection = routeros_api.RouterOsApiPool(
            host,
            username=username,
            password=password,
            plaintext_login=True,
            port=8728
        )
        api = connection.get_api()
        resource = api.get_resource('/system/resource')
        info = resource.get()
        
        if info:
            print(f"  ✅ RouterOS API: Connected - {info[0].get('board-name', 'Unknown')}")
            connection.disconnect()
            return True
        else:
            print(f"  ❌ RouterOS API: No response")
            return False
            
    except ImportError:
        print(f"  ⚠️  RouterOS API: Library not installed (pip install routeros-api)")
        return False
    except Exception as e:
        print(f"  ❌ RouterOS API: {e}")
        return False


def test_snmp(host: str, community: str = "public") -> bool:
    """Test SNMP connectivity"""
    try:
        # Try using pysnmp if available
        from pysnmp.hlapi import *
        
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(community),
            UdpTransportTarget((host, 161), timeout=2, retries=1),
            ContextData(),
            ObjectType(ObjectIdentity('SNMPv2-MIB', 'sysDescr', 0))
        )
        
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        
        if errorIndication:
            print(f"  ❌ SNMP: {errorIndication}")
            return False
        elif errorStatus:
            print(f"  ❌ SNMP: {errorStatus.prettyPrint()}")
            return False
        else:
            for varBind in varBinds:
                print(f"  ✅ SNMP: {varBind[1]}")
            return True
            
    except ImportError:
        print(f"  ⚠️  SNMP: pysnmp library not installed (pip install pysnmp)")
        return False
    except Exception as e:
        print(f"  ❌ SNMP: {e}")
        return False


def test_http_endpoint(url: str, name: str) -> bool:
    """Test HTTP endpoint"""
    try:
        import requests
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            print(f"  ✅ {name}: HTTP 200 OK")
            return True
        else:
            print(f"  ⚠️  {name}: HTTP {response.status_code}")
            return True  # Still reachable
    except ImportError:
        print(f"  ⚠️  {name}: requests library not installed")
        return False
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        return False


def main():
    """Main test execution"""
    print("=" * 70)
    print("GNS3 Network Connectivity Test Suite")
    print("=" * 70)
    print()
    
    total_tests = 0
    passed_tests = 0
    
    # Test 1: Router Connectivity
    print("Test 1: Router ICMP Connectivity")
    print("-" * 70)
    for name, ip in ROUTERS:
        total_tests += 1
        if test_ping(ip, name):
            passed_tests += 1
    print()
    
    # Test 2: NetworkWeaver Services
    print("Test 2: NetworkWeaver Docker Services")
    print("-" * 70)
    for name, host, port in SERVICES:
        total_tests += 1
        if test_tcp_port(host, port, name):
            passed_tests += 1
    print()
    
    # Test 3: Router Services
    print("Test 3: Router Service Ports")
    print("-" * 70)
    for router_name, router_ip in ROUTERS:
        print(f"{router_name} ({router_ip}):")
        for service_name, port in ROUTER_SERVICES:
            total_tests += 1
            if test_tcp_port(router_ip, port, f"  {service_name}"):
                passed_tests += 1
        print()
    
    # Test 4: RouterOS API
    print("Test 4: RouterOS API Functionality")
    print("-" * 70)
    for name, ip in ROUTERS:
        print(f"{name} ({ip}):")
        total_tests += 1
        if test_routeros_api(ip):
            passed_tests += 1
        print()
    
    # Test 5: SNMP
    print("Test 5: SNMP Connectivity")
    print("-" * 70)
    for name, ip in ROUTERS:
        print(f"{name} ({ip}):")
        total_tests += 1
        if test_snmp(ip):
            passed_tests += 1
        print()
    
    # Test 6: HTTP Endpoints
    print("Test 6: HTTP Endpoints")
    print("-" * 70)
    endpoints = [
        ("http://localhost:8000/docs", "Backend API Docs"),
        ("http://localhost:5173", "Frontend"),
        ("http://localhost:9090", "Prometheus"),
        ("http://localhost:3000", "Grafana"),
    ]
    for url, name in endpoints:
        total_tests += 1
        if test_http_endpoint(url, name):
            passed_tests += 1
    print()
    
    # Summary
    print("=" * 70)
    print(f"Test Results: {passed_tests}/{total_tests} tests passed")
    print("=" * 70)
    
    percentage = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    if percentage == 100:
        print("\n✅ All tests passed! Your GNS3 simulation is fully operational.")
        sys.exit(0)
    elif percentage >= 80:
        print(f"\n⚠️  {percentage:.1f}% tests passed. Some services may need attention.")
        sys.exit(0)
    else:
        print(f"\n❌ Only {percentage:.1f}% tests passed. Please check your configuration.")
        sys.exit(1)


if __name__ == "__main__":
    main()
