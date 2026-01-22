#!/usr/bin/env python3
"""
SNMP Testing Script for GNS3 MikroTik Routers
Tests SNMP connectivity and retrieves key metrics
"""

import sys
from typing import List, Tuple

# Router configuration
ROUTERS = [
    ("Router1", "192.168.100.10"),
    ("Router2", "192.168.100.11"),
    ("Router3", "192.168.100.12"),
]

COMMUNITY = "public"
SNMP_VERSION = 2

# Common OIDs to test
TEST_OIDS = [
    ("1.3.6.1.2.1.1.1.0", "System Description"),
    ("1.3.6.1.2.1.1.3.0", "System Uptime"),
    ("1.3.6.1.2.1.1.5.0", "System Name"),
    ("1.3.6.1.2.1.1.6.0", "System Location"),
    ("1.3.6.1.4.1.14988.1.1.1.2.0", "MikroTik Software Version"),
]


def test_snmpwalk_command(host: str, name: str) -> bool:
    """Test SNMP using snmpwalk command-line tool"""
    import subprocess
    import platform
    
    try:
        # Determine snmpwalk command based on OS
        if platform.system().lower() == 'windows':
            cmd = ['snmpwalk', '-v2c', '-c', COMMUNITY, host, '1.3.6.1.2.1.1.5.0']
        else:
            cmd = ['snmpwalk', '-v2c', '-c', COMMUNITY, host, '1.3.6.1.2.1.1.5.0']
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5,
            text=True
        )
        
        if result.returncode == 0 and result.stdout:
            print(f"  ✅ {name}: snmpwalk successful")
            print(f"     {result.stdout.strip()}")
            return True
        else:
            print(f"  ❌ {name}: snmpwalk failed")
            if result.stderr:
                print(f"     Error: {result.stderr.strip()}")
            return False
            
    except FileNotFoundError:
        print(f"  ⚠️  snmpwalk command not found. Please install SNMP tools.")
        return False
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        return False


def test_pysnmp(host: str, name: str) -> bool:
    """Test SNMP using pysnmp library"""
    try:
        from pysnmp.hlapi import *
        
        print(f"\n{name} ({host}) - SNMP Data:")
        print("-" * 60)
        
        success_count = 0
        for oid, description in TEST_OIDS:
            try:
                iterator = getCmd(
                    SnmpEngine(),
                    CommunityData(COMMUNITY, mpModel=1),  # SNMPv2c
                    UdpTransportTarget((host, 161), timeout=3, retries=1),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid))
                )
                
                errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
                
                if errorIndication:
                    print(f"  ❌ {description}: {errorIndication}")
                elif errorStatus:
                    print(f"  ❌ {description}: {errorStatus.prettyPrint()}")
                else:
                    for varBind in varBinds:
                        value = varBind[1].prettyPrint()
                        print(f"  ✅ {description}: {value}")
                        success_count += 1
                        
            except Exception as e:
                print(f"  ❌ {description}: {e}")
        
        print()
        return success_count > 0
        
    except ImportError:
        print(f"  ⚠️  pysnmp library not installed")
        print(f"     Install with: pip install pysnmp")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_interface_stats(host: str, name: str) -> bool:
    """Retrieve interface statistics via SNMP"""
    try:
        from pysnmp.hlapi import *
        
        print(f"\n{name} ({host}) - Interface Statistics:")
        print("-" * 60)
        
        # Walk interface table
        iterator = nextCmd(
            SnmpEngine(),
            CommunityData(COMMUNITY, mpModel=1),
            UdpTransportTarget((host, 161), timeout=3, retries=1),
            ContextData(),
            ObjectType(ObjectIdentity('1.3.6.1.2.1.2.2.1.2')),  # ifDescr
            ObjectType(ObjectIdentity('1.3.6.1.2.1.2.2.1.8')),  # ifOperStatus
            ObjectType(ObjectIdentity('1.3.6.1.2.1.2.2.1.10')), # ifInOctets
            ObjectType(ObjectIdentity('1.3.6.1.2.1.2.2.1.16')), # ifOutOctets
            lexicographicMode=False
        )
        
        interface_count = 0
        for errorIndication, errorStatus, errorIndex, varBinds in iterator:
            if errorIndication:
                print(f"  ❌ Error: {errorIndication}")
                break
            elif errorStatus:
                print(f"  ❌ Error: {errorStatus.prettyPrint()}")
                break
            else:
                interface_count += 1
                ifDescr = varBinds[0][1].prettyPrint()
                ifOperStatus = "UP" if varBinds[1][1] == 1 else "DOWN"
                ifInOctets = varBinds[2][1].prettyPrint()
                ifOutOctets = varBinds[3][1].prettyPrint()
                
                print(f"  Interface: {ifDescr}")
                print(f"    Status: {ifOperStatus}")
                print(f"    In Octets: {ifInOctets}")
                print(f"    Out Octets: {ifOutOctets}")
                print()
        
        if interface_count > 0:
            print(f"  ✅ Retrieved {interface_count} interfaces")
            return True
        else:
            print(f"  ❌ No interfaces found")
            return False
            
    except ImportError:
        print(f"  ⚠️  pysnmp library not installed")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_prometheus_snmp_exporter(host: str, name: str) -> bool:
    """Test SNMP exporter endpoint"""
    try:
        import requests
        
        # Test SNMP exporter
        url = f"http://localhost:9116/snmp?target={host}&module=mikrotik"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            metrics = response.text
            metric_count = len([line for line in metrics.split('\n') if line and not line.startswith('#')])
            print(f"  ✅ {name}: SNMP Exporter returned {metric_count} metrics")
            
            # Show sample metrics
            print(f"\n  Sample metrics:")
            for line in metrics.split('\n')[:10]:
                if line and not line.startswith('#'):
                    print(f"    {line[:80]}...")
            
            return True
        else:
            print(f"  ❌ {name}: SNMP Exporter returned HTTP {response.status_code}")
            return False
            
    except ImportError:
        print(f"  ⚠️  requests library not installed")
        return False
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        return False


def main():
    """Main execution"""
    print("=" * 70)
    print("SNMP Testing Script for GNS3 MikroTik Routers")
    print("=" * 70)
    print()
    
    total_tests = 0
    passed_tests = 0
    
    # Test 1: Command-line snmpwalk
    print("Test 1: SNMP Command-line Tools")
    print("-" * 70)
    for name, ip in ROUTERS:
        total_tests += 1
        if test_snmpwalk_command(ip, name):
            passed_tests += 1
    print()
    
    # Test 2: Python SNMP library
    print("Test 2: Python SNMP Library (pysnmp)")
    print("-" * 70)
    for name, ip in ROUTERS:
        total_tests += 1
        if test_pysnmp(ip, name):
            passed_tests += 1
    
    # Test 3: Interface statistics
    print("Test 3: Interface Statistics")
    print("-" * 70)
    for name, ip in ROUTERS:
        total_tests += 1
        if test_interface_stats(ip, name):
            passed_tests += 1
    
    # Test 4: Prometheus SNMP Exporter
    print("Test 4: Prometheus SNMP Exporter")
    print("-" * 70)
    for name, ip in ROUTERS:
        total_tests += 1
        if test_prometheus_snmp_exporter(ip, name):
            passed_tests += 1
    print()
    
    # Summary
    print("=" * 70)
    print(f"Test Results: {passed_tests}/{total_tests} tests passed")
    print("=" * 70)
    
    if passed_tests == total_tests:
        print("\n✅ All SNMP tests passed!")
        sys.exit(0)
    elif passed_tests > 0:
        print(f"\n⚠️  {passed_tests}/{total_tests} tests passed. Some tests failed.")
        sys.exit(0)
    else:
        print("\n❌ All SNMP tests failed. Please check your configuration.")
        sys.exit(1)


if __name__ == "__main__":
    main()
