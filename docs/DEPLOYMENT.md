# 🚀 NetworkWeaver Deployment Guide

This guide covers how to deploy NetworkWeaver on a local machine and connect it to a GNS3 simulation environment.

## 📋 Prerequisites

-   **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
-   **VMware Workstation** (Player or Pro) + **MikroTik CHR Image**
-   **Git**

---

## ⚡ Quick Start

### Windows
Right-click `deploy.ps1` and select **Run with PowerShell**.
*Or run in terminal:*
```powershell
.\deploy.ps1
```

### Linux / macOS
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🌐 VMware CHR Integration Guide

We now use a direct **VMware Cloud Hosted Router (CHR)** instead of GNS3 for better stability and simpler networking.

### 1. Setup the VM
Follow the detailed steps in **[VMWARE_CHR_SETUP.md](./VMWARE_CHR_SETUP.md)** to:
1.  Configure the `VMnet8` (NAT) adapter.
2.  Assign a Static IP (e.g., `192.168.247.2`) to the Router.

### 2. Verify Connectivity
Ensure your Host PC and Docker containers can reach the VM:
```bash
ping 192.168.247.2
```

### 3. Firewall (Windows Only)
You may need to allow traffic on the virtual adapter:
```powershell
New-NetFirewallRule -DisplayName "Allow-VMware-Traffic" -Direction Inbound -InterfaceAlias "VMware Network Adapter VMnet8" -Action Allow
```

---

## 🔧 Troubleshooting

### "Context Deadline Exceeded"
-   **Cause**: The SNMP Collector cannot reach the target device.
-   **Fix**: Follow the [VMware Integration Guide](#vmware-chr-integration-guide) above. Ensure the VM is running and the IP matches.

### "Connection Refused" (Backend)
-   **Cause**: Database is still starting up.
-   **Fix**: The app now auto-retries. Wait 10-15 seconds. Check logs: `docker logs networkweaver-backend`.

### "403 Forbidden" (Frontend)
-   **Cause**: Accessing via a hostname not whitelisted in Vite.
-   **Fix**: Update `allowedHosts` in `frontend/vite.config.js`.

---

## 📂 Project Structure

-   `/backend`: FastAPI Python Application (Port 8000)
-   `/frontend`: React + Vite Application (Port 5173)
-   `/monitoring`: Prometheus & Grafana Configuration
-   `docker-compose.yml`: Stack Orchestration
