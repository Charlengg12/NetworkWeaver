# ConfigWeaver SNMP Monitoring Setup - Standard Operating Procedure

**Target Device**: `172.31.192.1` (Your Local Machine/Gateway)  
**Objective**: Deploy and validate ConfigWeaver's SNMP→Prometheus→Grafana monitoring stack using Docker on Windows.

**Prerequisites**  
- Windows 10/11 with Docker Desktop installed and running  
- VS Code or preferred IDE  
- ConfigWeaver project at: `C:\Users\Ronald\Desktop\NetworkWeaver\ConfigWeaver`

---

## Quick Start Checklist

- [ ] Phase 1: Setup project structure
- [ ] Phase 2: Configure all YAML files
- [ ] Phase 3: Deploy Docker stack
- [ ] Phase 4: Validate monitoring (Prometheus → Grafana)
- [ ] Phase 5: Access dashboards

---

## Phase 1: Project Preparation

### Step 1.1: Open Project in VS Code

1. Launch **VS Code**
2. **File** → **Open Folder** → Select: `C:\Users\Ronald\Desktop\NetworkWeaver\ConfigWeaver`
3. Open integrated terminal: **View** → **Terminal** (or `Ctrl+\``)

### Step 1.2: Create Required Directories

In VS Code terminal, run:

```powershell
# Create monitoring directory structure
New-Item -ItemType Directory -Force -Path "monitoring\prometheus"
New-Item -ItemType Directory -Force -Path "monitoring\grafana\provisioning\datasources"
New-Item -ItemType Directory -Force -Path "monitoring\grafana\provisioning\dashboards"
New-Item -ItemType Directory -Force -Path "monitoring\grafana\dashboards"
```

Expected structure:
```
ConfigWeaver/
├── backend/
├── frontend/
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml          ← Create this
│   ├── grafana/
│   │   ├── provisioning/
│   │   │   ├── datasources/
│   │   │   │   └── prometheus.yml  ← Create this
│   │   │   └── dashboards/
│   │   └── dashboards/
│   └── snmp.yml                     ← Create this
└── docker-compose.yml               ← Already exists
```

---

## Phase 2: Configuration Files

### Step 2.1: Create Prometheus Configuration

**File**: `monitoring/prometheus/prometheus.yml`

In VS Code, create the file and paste:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Your local machine SNMP monitoring
  - job_name: 'snmp-local'
    scrape_interval: 30s
    scrape_timeout: 10s
    static_configs:
      - targets:
        - 172.31.192.1    # Your machine IP
    metrics_path: /snmp
    params:
      module: [if_mib]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter:9116

  # Dynamic targets from backend API (optional)
  - job_name: 'snmp-dynamic'
    scrape_interval: 30s
    scrape_timeout: 10s
    http_sd_configs:
      - url: 'http://backend:8000/monitoring/targets'
        refresh_interval: 60s
    metrics_path: /snmp
    params:
      module: [if_mib]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter:9116
```

**Save**: `Ctrl+S`

---

### Step 2.2: Create SNMP Exporter Configuration

**File**: `monitoring/snmp.yml`

Create and paste:

```yaml
# SNMP Configuration for IF-MIB (Interface Monitoring)
if_mib:
  walk:
    - 1.3.6.1.2.1.1.1.0      # sysDescr
    - 1.3.6.1.2.1.1.3.0      # sysUpTime
    - 1.3.6.1.2.1.1.5.0      # sysName
    - 1.3.6.1.2.1.2.2.1.1    # ifIndex
    - 1.3.6.1.2.1.2.2.1.2    # ifDescr
    - 1.3.6.1.2.1.2.2.1.3    # ifType
    - 1.3.6.1.2.1.2.2.1.5    # ifSpeed
    - 1.3.6.1.2.1.2.2.1.7    # ifAdminStatus
    - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
    - 1.3.6.1.2.1.2.2.1.10   # ifInOctets
    - 1.3.6.1.2.1.2.2.1.16   # ifOutOctets
    - 1.3.6.1.2.1.2.2.1.13   # ifInDiscards
    - 1.3.6.1.2.1.2.2.1.14   # ifInErrors
    - 1.3.6.1.2.1.2.2.1.19   # ifOutDiscards
    - 1.3.6.1.2.1.2.2.1.20   # ifOutErrors

  metrics:
    - name: sysUpTime
      oid: 1.3.6.1.2.1.1.3.0
      type: gauge
      help: System uptime in hundredths of a second

    - name: ifOperStatus
      oid: 1.3.6.1.2.1.2.2.1.8
      type: gauge
      help: Interface operational status (1=up, 2=down)

    - name: ifAdminStatus
      oid: 1.3.6.1.2.1.2.2.1.7
      type: gauge
      help: Interface administrative status

    - name: ifInOctets
      oid: 1.3.6.1.2.1.2.2.1.10
      type: counter
      help: Total bytes received on interface

    - name: ifOutOctets
      oid: 1.3.6.1.2.1.2.2.1.16
      type: counter
      help: Total bytes sent on interface

    - name: ifInErrors
      oid: 1.3.6.1.2.1.2.2.1.14
      type: counter
      help: Inbound packets with errors

    - name: ifOutErrors
      oid: 1.3.6.1.2.1.2.2.1.20
      type: counter
      help: Outbound packets with errors

    - name: ifSpeed
      oid: 1.3.6.1.2.1.2.2.1.5
      type: gauge
      help: Interface speed in bits per second

  lookups:
    - source_indexes: [ifIndex]
      lookup: ifDescr
      drop_source_indexes: false
    - source_indexes: [ifIndex]
      lookup: ifType
```

**Save**: `Ctrl+S`

---

### Step 2.3: Create Grafana Data Source Provisioning

**File**: `monitoring/grafana/provisioning/datasources/prometheus.yml`

Create and paste:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
```

**Save**: `Ctrl+S`

---

### Step 2.4: Create Grafana Dashboard Provisioning (Optional)

**File**: `monitoring/grafana/provisioning/dashboards/default.yml`

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

**Save**: `Ctrl+S`

---

### Step 2.5: Update docker-compose.yml

**File**: `docker-compose.yml` (root directory)

Ensure your monitoring services match this configuration:

```yaml
services:
  # Backend API (FastAPI)
  backend:
    build:
      context: ./backend
    container_name: networkweaver-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/networkweaver
    depends_on:
      - db
    networks:
      - networkweaver-net
    volumes:
      - ./backend:/app

  # Frontend (React + Vite)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: networkweaver-frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    networks:
      - networkweaver-net
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # Database (PostgreSQL)
  db:
    image: postgres:15-alpine
    container_name: networkweaver-db
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=networkweaver
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - networkweaver-net
    ports:
      - "5432:5432"

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: networkweaver-prometheus
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - networkweaver-net
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: networkweaver-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SECURITY_ALLOW_EMBEDDING=true
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
      - GF_INSTALL_PLUGINS=
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - networkweaver-net
    restart: unless-stopped

  # SNMP Exporter
  snmp-exporter:
    image: prom/snmp-exporter:latest
    container_name: networkweaver-snmp-exporter
    ports:
      - "9116:9116"
    volumes:
      - ./monitoring/snmp.yml:/etc/snmp_exporter/snmp.yml:ro
    networks:
      - networkweaver-net
    restart: unless-stopped

networks:
  networkweaver-net:
    driver: bridge

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```

**Save**: `Ctrl+S`

---

## Phase 3: Deploy Docker Stack

### Step 3.1: Stop Any Running Containers

In VS Code terminal:

```powershell
docker-compose down
```

### Step 3.2: Build and Start Services

```powershell
docker-compose up -d --build
```

**Wait 30-60 seconds** for all containers to initialize.

### Step 3.3: Verify All Containers Are Running

```powershell
docker ps
```

**Expected output** (all should show "Up"):
```
CONTAINER ID   IMAGE                        STATUS
xxxxx          networkweaver-frontend       Up 30 seconds
xxxxx          networkweaver-backend        Up 31 seconds
xxxxx          networkweaver-grafana        Up 32 seconds
xxxxx          networkweaver-prometheus     Up 33 seconds
xxxxx          networkweaver-snmp-exporter  Up 33 seconds
xxxxx          networkweaver-db             Up 34 seconds
```

### Step 3.4: Check Logs (If Any Container Failed)

```powershell
# Check specific service logs
docker logs networkweaver-prometheus
docker logs networkweaver-snmp-exporter
docker logs networkweaver-grafana

# Or check all logs
docker-compose logs
```

---

## Phase 4: Validation & Testing

### Step 4.1: Test SNMP Exporter (Direct)

**Browser**: Open `http://localhost:9116`

You should see: **"SNMP Exporter"** landing page.

**Test your local IP directly**:  
`http://localhost:9116/snmp?target=172.31.192.1&module=if_mib`

**Expected**: Raw metrics in Prometheus format (if SNMP is enabled on 172.31.192.1)  
**If blank/error**: SNMP is not enabled or blocked on your target.

---

### Step 4.2: Verify Prometheus Targets

**Browser**: Open `http://localhost:9090/targets`

**Check Target Status**:

| Job Name | Endpoint | State | Last Scrape |
|----------|----------|-------|-------------|
| prometheus | localhost:9090 | **UP** ✅ | <15s |
| snmp-local | 172.31.192.1 | **UP** ✅ or **DOWN** ❌ | <30s |

**If 172.31.192.1 shows DOWN**:
- SNMP service not running on that device
- Firewall blocking UDP port 161
- Wrong IP address
- Device offline

**Troubleshooting DOWN status**:

```powershell
# Test SNMP from your Windows machine
# If you have snmp tools installed:
snmpwalk -v2c -c public 172.31.192.1 system

# OR test from inside Docker container:
docker exec -it networkweaver-snmp-exporter sh
apk add --no-cache net-snmp-tools
snmpwalk -v2c -c public 172.31.192.1 system
exit
```

If `snmpwalk` times out, SNMP is not reachable.

---

### Step 4.3: Query Metrics in Prometheus

**Browser**: `http://localhost:9090/graph`

**Test Queries**:

1. **Check if target is up**:
   ```promql
   up{job="snmp-local"}
   ```
   Should return `1` if working.

2. **View all SNMP metrics**:
   ```promql
   {job="snmp-local"}
   ```

3. **Interface status**:
   ```promql
   ifOperStatus
   ```

4. **Network traffic IN (bytes per second)**:
   ```promql
   rate(ifInOctets[5m])
   ```

5. **Network traffic OUT (bytes per second)**:
   ```promql
   rate(ifOutOctets[5m])
   ```

Click **Execute** → Switch to **Graph** tab → Should see data lines.

---

### Step 4.4: Login to Grafana

**Browser**: Open `http://localhost:3000`

**Login Credentials**:
- Username: `admin`
- Password: `admin`

**First login**: Grafana will prompt to change password (you can skip).

---

### Step 4.5: Verify Prometheus Data Source in Grafana

1. Click **⚙️ Configuration** (gear icon, left sidebar)
2. Click **Data sources**
3. Click **Prometheus**
4. Scroll down and click **Save & test**

**Expected**: Green checkmark **"Data source is working"** ✅

**If error**: Check that Prometheus container is running (`docker ps`).

---

### Step 4.6: Create Your First Dashboard

**In Grafana**:

1. Click **+ (Plus icon)** → **Dashboard**
2. Click **Add visualization**
3. Select data source: **Prometheus**
4. In the query editor, enter:
   ```promql
   rate(ifInOctets{job="snmp-local"}[5m])
   ```
5. In **Legend** field:
   ```
   {{instance}} - {{ifDescr}} IN
   ```
6. Click **Run queries** (top right)
7. You should see a graph with network traffic data
8. Panel title: Change to **"Network Traffic - Inbound"**
9. Click **Apply** (top right)

**Add another panel for outbound**:

1. Click **Add** → **Visualization**
2. Query:
   ```promql
   rate(ifOutOctets{job="snmp-local"}[5m])
   ```
3. Legend:
   ```
   {{instance}} - {{ifDescr}} OUT
   ```
4. Panel title: **"Network Traffic - Outbound"**
5. Click **Apply**

**Save Dashboard**:
1. Click **💾 Save dashboard** (top right)
2. Name: **"172.31.192.1 - Network Monitoring"**
3. Click **Save**

---

### Step 4.7: Access React Frontend

**Browser**: Open `http://localhost:5173`

Navigate to your monitoring/dashboard routes in the ConfigWeaver app. Embedded Grafana panels should display.

---

## Phase 5: Testing SNMP on Your Local Machine (172.31.192.1)

### Option A: Enable SNMP on Windows (If Available)

**Note**: Windows Home edition does NOT include SNMP service. Windows Pro/Enterprise do.

1. **Windows Settings** → **Apps** → **Optional Features** → **Add a feature**
2. Search: **SNMP**
3. Install **Simple Network Management Protocol (SNMP)**
4. After install, open **Services** app (`services.msc`)
5. Find **SNMP Service** → Right-click → **Properties**
6. **Security tab**:
   - Add community: `public` with **READ ONLY** rights
   - Add accepted host: `127.0.0.1` and `172.31.192.1`
7. **Start** the service
8. Click **OK**

**Test locally**:
```powershell
snmpwalk -v2c -c public 172.31.192.1 system
```

### Option B: Use Docker SNMP Simulator (Easiest)

Add this to your `docker-compose.yml`:

```yaml
  snmp-simulator:
    image: tandrup/snmpsim
    container_name: networkweaver-snmp-sim
    ports:
      - "161:161/udp"
    networks:
      - networkweaver-net
    restart: unless-stopped
```

Then update `prometheus.yml` target to:
```yaml
      - targets:
        - snmp-simulator:161
```

Restart:
```powershell
docker-compose up -d
docker-compose restart prometheus
```

### Option C: Test Against Your Router Instead

If `172.31.192.1` is a WSL/Docker gateway and doesn't support SNMP:

1. Find your **WiFi router IP**: Usually `192.168.1.1` or `192.168.0.1`
2. Login to router admin panel
3. Enable **SNMP** (usually under Advanced → Management)
4. Set community: `public`
5. Update `prometheus.yml`:
   ```yaml
       - targets:
         - 192.168.1.1
   ```
6. Restart Prometheus:
   ```powershell
   docker-compose restart prometheus
   ```

---

## Phase 6: Troubleshooting Guide

### Issue: SNMP Target Shows DOWN

**Cause**: Target device doesn't have SNMP enabled or is unreachable.

**Solution**:
```powershell
# Test from SNMP exporter container
docker exec -it networkweaver-snmp-exporter sh
apk add --no-cache net-snmp-tools
snmpwalk -v2c -c public 172.31.192.1 system
exit
```

If timeout → SNMP not working on target.

---

### Issue: Prometheus Container Won't Start

**Cause**: Config file syntax error.

**Solution**:
```powershell
# Validate config
docker run --rm -v ${PWD}/monitoring/prometheus:/etc/prometheus prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml
```

Fix any errors shown, then restart.

---

### Issue: Grafana Shows "No Data"

**Checklist**:
- [ ] Prometheus target is **UP** at `http://localhost:9090/targets`
- [ ] Prometheus has metrics: Query `up` at `http://localhost:9090/graph`
- [ ] Grafana data source is green (Configuration → Data sources → Prometheus → Test)
- [ ] Time range in Grafana panel includes recent data (check top-right time picker)
- [ ] Query syntax is correct

---

### Issue: Can't Access Containers from Browser

**Solution**:
```powershell
# Check if ports are listening
netstat -ano | findstr "9090"
netstat -ano | findstr "3000"
netstat -ano | findstr "9116"

# Restart Docker Desktop
# Right-click Docker Desktop icon → Restart
```

---

### Full Reset (Nuclear Option)

```powershell
# Stop everything
docker-compose down -v

# Remove all Docker resources
docker system prune -a -f

# Rebuild from scratch
docker-compose up -d --build
```

---

## Phase 7: Daily Operations

### Start the Stack

```powershell
cd C:\Users\Ronald\Desktop\NetworkWeaver\ConfigWeaver
docker-compose up -d
```

### Stop the Stack

```powershell
docker-compose down
```

### View Real-Time Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f prometheus
docker-compose logs -f grafana
docker-compose logs -f snmp-exporter
```

### Restart Single Service

```powershell
docker-compose restart prometheus
```

### Update Configuration

1. Edit config file in VS Code
2. Save changes (`Ctrl+S`)
3. Restart affected service:
   ```powershell
   docker-compose restart prometheus
   ```

### Check Service Health

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## Quick Reference

### Service URLs

| Service | URL | Login |
|---------|-----|-------|
| **React Frontend** | http://localhost:5173 | N/A |
| **FastAPI Backend** | http://localhost:8000/docs | N/A |
| **Prometheus** | http://localhost:9090 | N/A |
| **Grafana** | http://localhost:3000 | admin/admin |
| **SNMP Exporter** | http://localhost:9116 | N/A |

### Essential Docker Commands

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs <service-name>

# Follow logs real-time
docker-compose logs -f <service-name>

# Restart service
docker-compose restart <service-name>

# List containers
docker ps

# Shell into container
docker exec -it <container-name> sh

# Remove volumes (reset data)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

### Useful PromQL Queries

```promql
# Check if target is up
up{job="snmp-local"}

# All SNMP metrics
{job="snmp-local"}

# Interface operational status
ifOperStatus

# Inbound traffic rate (bytes/sec)
rate(ifInOctets[5m])

# Outbound traffic rate (bytes/sec)
rate(ifOutOctets[5m])

# Inbound traffic rate (Mbps)
rate(ifInOctets[5m]) * 8 / 1000000

# Interface errors
rate(ifInErrors[5m])
rate(ifOutErrors[5m])

# System uptime
sysUpTime / 100 / 86400
```

---

## Success Checklist

- [ ] All Docker containers running (`docker ps`)
- [ ] Prometheus shows target `172.31.192.1` as **UP**
- [ ] SNMP Exporter returns metrics for test target
- [ ] Grafana login successful (admin/admin)
- [ ] Grafana Prometheus data source is working (green checkmark)
- [ ] Created test dashboard with network traffic graphs
- [ ] React frontend accessible at http://localhost:5173
- [ ] Backend API accessible at http://localhost:8000/docs
- [ ] Can query SNMP metrics in Prometheus graph UI

---

## Next Steps

1. **Add More Devices**: Edit `prometheus.yml` to add more IPs under `targets`
2. **Create Advanced Dashboards**: Build comprehensive Grafana dashboards with multiple panels
3. **Configure Alerts**: Set up Prometheus alerting rules for down interfaces or high traffic
4. **Integrate GNS3**: Once GNS3 VM is working, add simulated routers to monitoring
5. **Backend Integration**: Implement device management API endpoints in FastAPI
6. **Frontend UI**: Build React components to display devices and metrics

---

## Support Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **SNMP Exporter**: https://github.com/prometheus/snmp_exporter
- **Docker Compose Reference**: https://docs.docker.com/compose/

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Target IP**: 172.31.192.1  
**Status**: Ready for Testing

