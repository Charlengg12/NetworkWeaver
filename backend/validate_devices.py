"""
Device Validation Script

This script validates all devices in the database by checking:
- Ping connectivity
- SNMP port accessibility (port 161)
- RouterOS API port accessibility
- Optional RouterOS API authentication test

Usage:
    python validate_devices.py [--test-routeros] [--remove-unreachable] [--verbose]
    
Arguments:
    --test-routeros: Also test RouterOS API connectivity (slower)
    --remove-unreachable: Remove devices that fail all connectivity tests
    --verbose: Show detailed output for each test
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Device
from app.routers.devices import check_ping, check_port
from app.routers.routeros.connection import test_routeros_connection
import argparse
import logging
from typing import Dict, List, Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DeviceValidator:
    """Validates connectivity to all devices in the database"""
    
    def __init__(self, test_routeros: bool = False, verbose: bool = False):
        self.test_routeros = test_routeros
        self.verbose = verbose
        self.db = SessionLocal()
        self.results: List[Dict[str, Any]] = []
    
    def validate_device(self, device: Device) -> Dict[str, Any]:
        """
        Validate a single device's connectivity.
        
        Returns:
            Dictionary with validation results
        """
        result = {
            "device_id": device.id,
            "device_name": device.name,
            "ip_address": device.ip_address,
            "tests": {},
            "overall_status": "unknown"
        }
        
        if self.verbose:
            logger.info(f"\n{'='*60}")
            logger.info(f"Validating device: {device.name} ({device.ip_address})")
            logger.info(f"{'='*60}")
        
        # Test 1: Ping
        ping_ok, ping_msg = check_ping(device.ip_address, timeout=2)
        result["tests"]["ping"] = {"success": ping_ok, "message": ping_msg}
        
        if self.verbose:
            status = "✓" if ping_ok else "✗"
            logger.info(f"  {status} Ping: {ping_msg}")
        
        # Test 2: SNMP port (if SNMP is configured)
        if device.snmp_community:
            snmp_ok, snmp_msg = check_port(device.ip_address, 161, timeout=3)
            result["tests"]["snmp_port"] = {"success": snmp_ok, "message": snmp_msg}
            
            if self.verbose:
                status = "✓" if snmp_ok else "✗"
                logger.info(f"  {status} SNMP Port (161): {snmp_msg}")
        
        # Test 3: RouterOS API port (if API port is configured)
        if device.api_port:
            api_port_ok, api_port_msg = check_port(device.ip_address, device.api_port, timeout=3)
            result["tests"]["api_port"] = {"success": api_port_ok, "message": api_port_msg}
            
            if self.verbose:
                status = "✓" if api_port_ok else "✗"
                logger.info(f"  {status} API Port ({device.api_port}): {api_port_msg}")
            
            # Test 4: RouterOS API connection (if enabled and port is open)
            if self.test_routeros and api_port_ok:
                routeros_ok, routeros_msg = test_routeros_connection(device, timeout=5)
                result["tests"]["routeros_api"] = {"success": routeros_ok, "message": routeros_msg}
                
                if self.verbose:
                    status = "✓" if routeros_ok else "✗"
                    logger.info(f"  {status} RouterOS API: {routeros_msg}")
        
        # Determine overall status
        test_results = [test["success"] for test in result["tests"].values()]
        
        if all(test_results):
            result["overall_status"] = "healthy"
        elif any(test_results):
            result["overall_status"] = "degraded"
        else:
            result["overall_status"] = "unreachable"
        
        return result
    
    def validate_all(self) -> List[Dict[str, Any]]:
        """Validate all devices in the database"""
        devices = self.db.query(Device).all()
        
        if not devices:
            logger.warning("No devices found in database")
            return []
        
        logger.info(f"Found {len(devices)} device(s) to validate")
        logger.info(f"RouterOS API testing: {'enabled' if self.test_routeros else 'disabled'}")
        logger.info("")
        
        for device in devices:
            result = self.validate_device(device)
            self.results.append(result)
        
        return self.results
    
    def print_summary(self):
        """Print validation summary"""
        if not self.results:
            logger.info("\nNo devices to report")
            return
        
        healthy = sum(1 for r in self.results if r["overall_status"] == "healthy")
        degraded = sum(1 for r in self.results if r["overall_status"] == "degraded")
        unreachable = sum(1 for r in self.results if r["overall_status"] == "unreachable")
        total = len(self.results)
        
        print(f"\n{'='*60}")
        print("VALIDATION SUMMARY")
        print(f"{'='*60}")
        print(f"Total devices:      {total}")
        print(f"Healthy:            {healthy} ({healthy/total*100:.1f}%)")
        print(f"Degraded:           {degraded} ({degraded/total*100:.1f}%)")
        print(f"Unreachable:        {unreachable} ({unreachable/total*100:.1f}%)")
        print(f"{'='*60}\n")
        
        # List unreachable devices
        if unreachable > 0:
            print("UNREACHABLE DEVICES:")
            for r in self.results:
                if r["overall_status"] == "unreachable":
                    print(f"  - {r['device_name']} ({r['ip_address']}) [ID: {r['device_id']}]")
            print()
        
        # List degraded devices
        if degraded > 0:
            print("DEGRADED DEVICES:")
            for r in self.results:
                if r["overall_status"] == "degraded":
                    failed_tests = [name for name, test in r["tests"].items() if not test["success"]]
                    print(f"  - {r['device_name']} ({r['ip_address']}) [ID: {r['device_id']}]")
                    print(f"    Failed tests: {', '.join(failed_tests)}")
            print()
    
    def remove_unreachable_devices(self):
        """Remove devices that are completely unreachable"""
        unreachable = [r for r in self.results if r["overall_status"] == "unreachable"]
        
        if not unreachable:
            logger.info("No unreachable devices to remove")
            return
        
        logger.warning(f"\nRemoving {len(unreachable)} unreachable device(s)...")
        
        for result in unreachable:
            device = self.db.query(Device).filter(Device.id == result["device_id"]).first()
            if device:
                logger.info(f"  Removing: {device.name} ({device.ip_address})")
                self.db.delete(device)
        
        self.db.commit()
        logger.info(f"Successfully removed {len(unreachable)} device(s)")
    
    def close(self):
        """Close database connection"""
        self.db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Validate connectivity to all devices in the database"
    )
    parser.add_argument(
        "--test-routeros",
        action="store_true",
        help="Also test RouterOS API connectivity (slower)"
    )
    parser.add_argument(
        "--remove-unreachable",
        action="store_true",
        help="Remove devices that fail all connectivity tests"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed output for each test"
    )
    
    args = parser.parse_args()
    
    validator = DeviceValidator(
        test_routeros=args.test_routeros,
        verbose=args.verbose
    )
    
    try:
        # Run validation
        validator.validate_all()
        
        # Print summary
        validator.print_summary()
        
        # Remove unreachable devices if requested
        if args.remove_unreachable:
            validator.remove_unreachable_devices()
        
    except Exception as e:
        logger.error(f"Error during validation: {e}")
        return 1
    finally:
        validator.close()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
