# NetworkWeaver - Useful Scripts Collection

This document contains ready-to-use scripts for setting up and managing NetworkWeaver monitoring.

---

## 1. MikroTik Router Setup Scripts

### Script 1.1: Enable SNMP on MikroTik
**Purpose**: Enable SNMP monitoring on any MikroTik router

**Run on router via terminal or WinBox:**
```routeros
# Enable SNMP service
/snmp set enabled=yes

# Set SNMP community (default: public)
/snmp community
set [ find default=yes ] name=public addresses=0.0.0.0/0

# Optional: Set system identity for easier identification
/system identity
set name=MyRouter-Name

# Verify SNMP is running
/snmp print
```

---

### Script 1.2: Allow SNMP Through Firewall (If Needed)
**Purpose**: Allow SNMP traffic from NetworkWeaver PC

**Run on router:**
```routeros
# Replace 192.168.68.107 with your NetworkWeaver PC IP
/ip firewall filter
add chain=input protocol=udp dst-port=161 src-address=192.168.68.107 action=accept comment="Allow SNMP from NetworkWeaver"

# Move rule to top of firewall list
/ip firewall filter
move [find comment="Allow SNMP from NetworkWeaver"] 0
```

---

### Script 1.3: Allow ICMP Ping Through Firewall
**Purpose**: Allow ping for connectivity checks

**Run on router:**
```routeros
/ip firewall filter
add chain=input protocol=icmp src-address=192.168.68.0/24 action=accept comment="Allow ping from LAN"
```

---

### Script 1.4: Block Specific URL (Configuration Template)
**Purpose**: Block access to specific website

**Run on router:**
```routeros
# Example: Block facebook.com
/ip firewall filter
add chain=forward dst-address-list=blocked-sites action=drop comment="Block facebook.com"

/ip dns static
add name=facebook.com address=0.0.0.0
add name=www.facebook.com address=0.0.0.0
```

---

## 2. Docker Management Scripts

### Script 2.1: Start NetworkWeaver (Development)
**Platform**: Windows PowerShell / Linux Bash

**Windows (PowerShell):**
```powershell
# Navigate to project directory
cd C:\Users\Admin\Desktop\NetworkWeaver\NetworkWeaver

# Start all services
docker compose up --build -d

# View logs
docker compose logs -f
```

**Linux/Mac (Bash):**
```bash
#!/bin/bash
cd ~/NetworkWeaver/NetworkWeaver
docker compose up --build -d
docker compose logs -f
```

---

### Script 2.2: Stop NetworkWeaver
```powershell
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v
```

---

### Script 2.3: Restart Specific Service
```powershell
# Restart Prometheus after config changes
docker compose restart prometheus

# Restart frontend after code changes
docker compose restart frontend

# Restart backend
docker compose restart backend
```

---

### Script 2.4: View Service Logs
```powershell
# View backend logs
docker logs networkweaver-backend --tail 100 -f

# View Prometheus logs
docker logs networkweaver-prometheus --tail 50

# View all services
docker compose logs --tail 20 -f
```

---

### Script 2.5: Database Backup
**Purpose**: Backup PostgreSQL database

```powershell
# Create backup
docker exec networkweaver-db pg_dump -U postgres networkweaver > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Restore from backup (example)
Get-Content backup_20260125_221200.sql | docker exec -i networkweaver-db psql -U postgres networkweaver
```

---

## 3. Windows Exporter Setup Scripts

### Script 3.1: Install Windows Exporter (PowerShell - Run as Admin)
**Purpose**: Install Prometheus Windows Exporter on any Windows PC

```powershell
# Download Windows Exporter
$version = "0.25.1"
$url = "https://github.com/prometheus-community/windows_exporter/releases/download/v$version/windows_exporter-$version-amd64.msi"
$output = "$env:TEMP\windows_exporter.msi"

Invoke-WebRequest -Uri $url -OutFile $output

# Install silently
Start-Process msiexec.exe -ArgumentList "/i $output /quiet /norestart" -Wait

# Verify service is running
Get-Service -Name "windows_exporter"

# Check if listening on port 9182
netstat -an | findstr :9182
```

---

### Script 3.2: Add Windows Device to Prometheus Config
**Purpose**: Manually add Windows device to Prometheus

**Edit file**: `monitoring/prometheus/prometheus.yml`

```yaml
# Add this job at the end of the file
  - job_name: 'windows-device-name'
    scrape_interval: 15s
    static_configs:
      - targets: ['192.168.68.XXX:9182']
        labels:
          hostname: 'Device-Name'
          device_type: 'windows'
```

**Then restart Prometheus:**
```powershell
docker compose restart prometheus
```

---

## 4. Linux Node Exporter Setup Scripts

### Script 4.1: Install Node Exporter (Linux)
**Purpose**: Install Prometheus Node Exporter on Linux server

```bash
#!/bin/bash
# Download and install Node Exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz
sudo mv node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Prometheus Node Exporter
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
sudo systemctl status node_exporter
```

---

## 5. Testing & Verification Scripts

### Script 5.1: Test SNMP Connectivity (PowerShell)
**Purpose**: Verify SNMP is working on a device

```powershell
# Install SNMP tools (one-time)
# On Windows: Install "SNMP Service" feature via Settings > Apps > Optional Features

# Test SNMP connectivity
# Note: Requires snmpwalk utility (install via Chocolatey or Net-SNMP)

# Example:
# snmpwalk -v2c -c public 192.168.88.1
```

---

### Script 5.2: Test Ping Connectivity
**Purpose**: Test if device is reachable

```powershell
# Ping single device
Test-Connection -ComputerName 192.168.68.107 -Count 4

# Ping multiple devices
$devices = @("192.168.68.107", "192.168.88.1", "192.168.68.50")
foreach ($device in $devices) {
    Write-Host "Testing $device..."
    Test-Connection -ComputerName $device -Count 2 -Quiet
}
```

---

### Script 5.3: Check Open Ports
**Purpose**: Verify service ports are accessible

```powershell
# Test if Windows Exporter is running
Test-NetConnection -ComputerName 192.168.68.107 -Port 9182

# Test SNMP port
Test-NetConnection -ComputerName 192.168.88.1 -Port 161

# Test MikroTik API port
Test-NetConnection -ComputerName 192.168.88.1 -Port 8728
```

---

## 6. Monitoring Health Check Scripts

### Script 6.1: Check All Services Status
```powershell
# Check Docker containers
docker compose ps

# Check if all services are healthy
docker compose ps --filter "status=running"

# Check Prometheus targets
Start-Process "http://localhost:9090/targets"

# Check Grafana
Start-Process "http://localhost:3000"
```

---

### Script 6.2: Quick Health Check (PowerShell)
```powershell
# Quick health check script
$services = @{
    "Frontend" = "http://localhost:5173"
    "Backend" = "http://localhost:8000/docs"
    "Prometheus" = "http://localhost:9090"
    "Grafana" = "http://localhost:3000"
}

foreach ($service in $services.GetEnumerator()) {
    try {
        $response = Invoke-WebRequest -Uri $service.Value -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ $($service.Key): OK" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($service.Key): DOWN" -ForegroundColor Red
    }
}
```

---

## 7. Automation Scripts

### Script 7.1: Auto-Update NetworkWeaver
```powershell
# Pull latest changes and rebuild
cd C:\Users\Ronald\Desktop\NetworkWeaver\ConfigWeaver
git pull origin main
docker compose down
docker compose up --build -d
docker compose ps
```

---

### Script 7.2: Daily Backup Script (Task Scheduler)
```powershell
# Save as: daily_backup.ps1
$backupDir = "C:\NetworkWeaver_Backups"
$date = Get-Date -Format "yyyyMMdd"

# Create backup directory
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Backup database
docker exec networkweaver-db pg_dump -U postgres networkweaver > "$backupDir\db_backup_$date.sql"

# Keep only last 7 days of backups
Get-ChildItem $backupDir -Filter "db_backup_*.sql" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item
```

**Schedule in Task Scheduler**:
- Run daily at 2 AM
- Action: `powershell.exe -File "C:\path\to\daily_backup.ps1"`

---

## 8. GNS3 Integration Scripts

### Script 8.1: Add GNS3 Router to Monitoring
**Run on GNS3 MikroTik console:**

```routeros
# Configure management interface
/interface ethernet
set [find name=ether1] comment="Management"

# Set IP address
/ip address
add address=192.168.122.10/24 interface=ether1

# Enable SNMP
/snmp set enabled=yes
/snmp community
set [ find default=yes ] name=public

# Set identity
/system identity
set name=GNS3-Router-1
```

Then add to NetworkWeaver via UI using IP `192.168.122.10`.

---

## Usage Instructions

1. **Copy the script** you need
2. **Modify IP addresses** and device names as needed
3. **Run on appropriate system** (router terminal, PowerShell, Linux, etc.)
4. **Verify** using verification scripts

---

**Document Version**: 1.0  
**Last Updated**: January 25, 2026
