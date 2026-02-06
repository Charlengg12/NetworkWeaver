# GNS3 Monitoring - Windows Native Setup

## Problem
Docker Desktop on Windows uses WSL2, which has isolated networking that cannot access your GNS3 ICS bridge network (`192.168.137.0/24`).

## Solution
Run Prometheus and SNMP Exporter **natively on Windows** to access GNS3 directly.

---

## Installation Steps

### 1. Download Windows Binaries

**Prometheus:**
1. Go to: https://prometheus.io/download/
2. Download: `prometheus-X.X.X.windows-amd64.zip`
3. Extract to: `C:\prometheus`

**SNMP Exporter:**
1. Go to: https://github.com/prometheus/snmp_exporter/releases
2. Download: `snmp_exporter-X.X.X.windows-amd64.tar.gz`
3. Extract to: `C:\snmp_exporter`

---

### 2. Configure Prometheus

Create `C:\prometheus\prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'snmp'
    static_configs:
      - targets:
        - 192.168.137.60  # MikroTik-GNS3-1
        - 192.168.137.61  # MikroTik-GNS3-2 (if you have a second router)
    metrics_path: /snmp
    params:
      module: [mikrotik]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9116  # SNMP Exporter running on Windows
```

---

### 3. Copy SNMP Exporter Config

Copy your existing SNMP config:
```powershell
Copy-Item "C:\Users\Ronald\Desktop\NetworkWeaver\ConfigWeaver\monitoring\snmp_exporter\snmp.yml" "C:\snmp_exporter\snmp.yml"
```

---

### 4. Run as Windows Services (or Manual)

**Option A: Run Manually (for testing)**

Open two PowerShell windows:

**Window 1 - SNMP Exporter:**
```powershell
cd C:\snmp_exporter
.\snmp_exporter.exe --config.file=snmp.yml
```

**Window 2 - Prometheus:**
```powershell
cd C:\prometheus
.\prometheus.exe --config.file=prometheus.yml
```

**Option B: Install as Windows Services (permanent)**

Use NSSM (Non-Sucking Service Manager):
```powershell
# Download NSSM
# https://nssm.cc/download

# Install SNMP Exporter service
nssm install snmp_exporter "C:\snmp_exporter\snmp_exporter.exe"
nssm set snmp_exporter AppParameters "--config.file=C:\snmp_exporter\snmp.yml"
nssm start snmp_exporter

# Install Prometheus service
nssm install prometheus "C:\prometheus\prometheus.exe"
nssm set prometheus AppParameters "--config.file=C:\prometheus\prometheus.yml"
nssm start prometheus
```

---

### 5. Update Grafana to Use Windows Prometheus

Edit `docker-compose.yml`, change Grafana's datasource environment variable:

```yaml
environment:
  - GF_DATASOURCES_DEFAULT_URL=http://host.docker.internal:9090
```

Or manually update the datasource in Grafana:
1. Go to: http://localhost:3000
2. Configuration → Data Sources → Prometheus
3. Change URL to: `http://host.docker.internal:9090`

---

### 6. Restart Grafana

```powershell
docker compose restart grafana
```

---

## Verification

1. **SNMP Exporter**: http://localhost:9116
2. **Prometheus Targets**: http://localhost:9090/targets (should show UP)
3. **Grafana Dashboard**: http://localhost:3000/d/mikrotik-exporter/mikrotik-monitoring

---

## Architecture

```
GNS3 MikroTik (192.168.137.60)
    ↓ SNMP (UDP 161)
Windows SNMP Exporter (localhost:9116)
    ↓ HTTP metrics
Windows Prometheus (localhost:9090)
    ↓ via host.docker.internal
Docker Grafana Container (localhost:3000)
    ↓ Displays dashboard
Your Browser
```

This bypasses all Docker networking issues!
