# 🚀 NetworkWeaver Deployment Guide

This guide covers how to deploy NetworkWeaver on a local machine and connect it to a GNS3 simulation environment.

## 📋 Prerequisites

-   **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
-   **GNS3** (for network simulation)
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

## 🌐 GNS3 Integration Guide

### 1. The "Split Network" Challenge
Docker containers run in an isolated network (`172.x.x.x`). GNS3 devices typically live on a host adapter (e.g., VMnet8 or Loopback `192.168.137.x`). By default, they **cannot** see each other.

### 2. Configuring the Bridge
To allow the NetworkWeaver container (SNMP Collector) to reach your GNS3 router:

1.  **Identify your Host Adapter**:
    -   Run `ipconfig` (Windows) or `ip addr` (Linux).
    -   Find the adapter hosting your GNS3 subnet (e.g., `Ethernet 2` or `VMware Network Adapter VMnet8`).
    -   Note its IP (e.g., `192.168.137.205`).

2.  **Configure GNS3 Cloud Node**:
    -   In GNS3, drag a **Cloud** node into your workspace.
    -   Right-click -> **Configure**.
    -   Check **"Show special Ethernet interfaces"**.
    -   Select your adapter (e.g., `Ethernet 2`) and click **Add**.
    -   Connect this Cloud node to your Router's interface (e.g., `ether1`).

3.  **Configure Router Gateway**:
    -   Your router needs to know how to reply to the Docker container.
    -   Set the router's default gateway to your **Host Adapter IP** (`.205`) or the subnet gateway (`.1`).
    ```bash
    /ip route add dst-address=0.0.0.0/0 gateway=192.168.137.1
    ```

4.  **Firewall (Windows Only)**:
    -   You may need to allow traffic on that specific interface.
    -   Run as Admin:
    ```powershell
    New-NetFirewallRule -DisplayName "Allow-GNS3-Traffic" -Direction Inbound -InterfaceAlias "Ethernet 2" -Action Allow
    ```

---

## 🔧 Troubleshooting

### "Context Deadline Exceeded"
-   **Cause**: The SNMP Collector cannot reach the target device.
-   **Fix**: Follow the [GNS3 Integration Guide](#gns3-integration-guide) above. Ensure Ping works.

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
