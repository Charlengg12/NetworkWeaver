# GNS3 Automation - Quick Start Guide

## Overview

This directory contains automation scripts and configuration files to quickly set up and test your GNS3 MikroTik simulation with NetworkWeaver.

## Directory Structure

```
gns3-automation/
├── router-configs/          # RouterOS configuration scripts
│   ├── router1.rsc
│   ├── router2.rsc
│   └── router3.rsc
├── scripts/                 # Python automation scripts
│   ├── seed_gns3_devices.py
│   ├── test_connectivity.py
│   └── test_snmp.py
├── configs/                 # Service configuration files
│   ├── prometheus-gns3.yml
│   ├── snmp-mikrotik.yml
│   └── wg0-gns3.conf
└── README.md               # This file
```

## Quick Start

### Step 1: Configure Routers in GNS3

1. **Start your GNS3 topology** with 3 MikroTik CHR routers
2. **Open console** for each router
3. **Copy and paste** the configuration from `router-configs/`:
   - Router1: `router-configs/router1.rsc`
   - Router2: `router-configs/router2.rsc`
   - Router3: `router-configs/router3.rsc`

**Alternative method (file import):**
```routeros
# On each router
/file print
# Upload .rsc file via FTP or drag-drop in GNS3
/import file-name=router1.rsc
```

### Step 2: Update Monitoring Configuration

1. **Copy Prometheus config:**
   ```bash
   cp configs/prometheus-gns3.yml monitoring/prometheus/prometheus.yml
   ```

2. **Copy SNMP config:**
   ```bash
   cp configs/snmp-mikrotik.yml monitoring/snmp.yml
   ```

3. **Restart monitoring services:**
   ```bash
   docker-compose restart prometheus snmp-exporter
   ```

### Step 3: Seed Devices into NetworkWeaver

```bash
cd gns3-automation/scripts
python seed_gns3_devices.py
```

This script will:
- ✅ Check NetworkWeaver API health
- ✅ Test router connectivity
- ✅ Verify RouterOS API access
- ✅ Add routers to the database

### Step 4: Verify Connectivity

```bash
python test_connectivity.py
```

This comprehensive test will verify:
- ICMP connectivity to routers
- NetworkWeaver Docker services
- Router service ports (API, SSH, HTTP, SNMP)
- RouterOS API functionality
- HTTP endpoints

### Step 5: Test SNMP Monitoring

```bash
python test_snmp.py
```

This will test:
- SNMP command-line tools
- Python SNMP library
- Interface statistics
- Prometheus SNMP exporter

## Configuration Files

### Prometheus Configuration

**File:** `configs/prometheus-gns3.yml`

- Scrapes 3 MikroTik routers via SNMP exporter
- 30-second scrape interval
- Proper labeling for GNS3 environment

**Usage:**
```bash
cp configs/prometheus-gns3.yml monitoring/prometheus/prometheus.yml
docker-compose restart prometheus
```

### SNMP Exporter Configuration

**File:** `configs/snmp-mikrotik.yml`

- MikroTik-specific OID mappings
- System, interface, and network statistics
- 64-bit counter support

**Usage:**
```bash
cp configs/snmp-mikrotik.yml monitoring/snmp.yml
docker-compose restart snmp-exporter
```

### WireGuard VPN Configuration

**File:** `configs/wg0-gns3.conf`

- Template for secure VPN connectivity
- Includes setup instructions
- Supports all 3 routers

**Setup:**
1. Generate keys: `wg genkey | tee privatekey | wg pubkey > publickey`
2. Update configuration file
3. Configure routers (instructions in file)
4. Copy to `wireguard-config/wg0.conf`
5. Restart: `docker-compose restart wireguard`

## Script Details

### seed_gns3_devices.py

**Purpose:** Automatically add GNS3 routers to NetworkWeaver database

**Features:**
- API health checking
- Connectivity testing
- RouterOS API verification
- Duplicate detection
- Detailed logging

**Requirements:**
```bash
pip install requests routeros-api
```

### test_connectivity.py

**Purpose:** Comprehensive connectivity testing

**Tests:**
- Router ICMP (ping)
- Docker service ports
- Router service ports
- RouterOS API
- SNMP connectivity
- HTTP endpoints

**Requirements:**
```bash
pip install requests routeros-api pysnmp
```

### test_snmp.py

**Purpose:** SNMP-specific testing and validation

**Tests:**
- Command-line snmpwalk
- Python SNMP library
- Interface statistics retrieval
- Prometheus SNMP exporter metrics

**Requirements:**
```bash
pip install pysnmp requests
# Also install snmpwalk command-line tool
```

## Troubleshooting

### Routers not reachable from host

**Check:**
1. GNS3 NAT Cloud is configured
2. Router management IPs are correct (192.168.100.10-12)
3. Windows Firewall allows traffic

**Fix:**
```bash
# Test connectivity
ping 192.168.100.10
```

### API connection fails

**Check:**
1. RouterOS API service is enabled
2. Correct credentials (apiuser/apipass123)
3. Firewall allows port 8728

**Fix on router:**
```routeros
/ip service print
/ip service set api disabled=no
/user print
```

### SNMP not working

**Check:**
1. SNMP is enabled on routers
2. Community string is correct (public)
3. Allowed addresses include host

**Fix on router:**
```routeros
/snmp print
/snmp set enabled=yes
/snmp community print
```

### Prometheus not scraping

**Check:**
1. SNMP exporter is running
2. Configuration files are correct
3. Routers are reachable from Docker network

**Fix:**
```bash
docker-compose logs snmp-exporter
docker-compose restart prometheus
```

## Advanced Usage

### Custom Router Configuration

Edit `.rsc` files to customize:
- IP addresses
- DHCP ranges
- Firewall rules
- Routing protocols (BGP, OSPF)

### Adding More Routers

1. Create new `.rsc` file (e.g., `router4.rsc`)
2. Add to `seed_gns3_devices.py` ROUTERS list
3. Update Prometheus targets
4. Run seeding script

### Monitoring Dashboards

Import Grafana dashboards:
1. Open http://localhost:3000
2. Go to Dashboards → Import
3. Use dashboard ID: 11147 (MikroTik SNMP)
4. Select Prometheus data source

## Next Steps

1. ✅ Configure routers
2. ✅ Update monitoring configs
3. ✅ Seed devices
4. ✅ Verify connectivity
5. ✅ Test SNMP
6. 🔄 Create Grafana dashboards
7. 🔄 Test configuration deployment via API
8. 🔄 Set up WireGuard VPN (optional)

## Support

For issues or questions:
- Check the main guide: `../gns3_simulation_guide.md`
- Review script output for detailed error messages
- Verify all prerequisites are installed
- Check Docker container logs

## License

Part of the NetworkWeaver/ConfigWeaver project.
