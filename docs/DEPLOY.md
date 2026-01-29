# 🚢 Deployment Guide

Since we are building the application from source (using `build: ./folder` in docker-compose), you cannot just copy the `docker-compose.yml`. You must copy the **entire project folder**.

## 📋 Prerequisites on Target Device
1. **Docker Installed**: Ensure Docker Engine or Docker Desktop is installed and running.
2. **Network Access**: The device must be able to reach your MikroTik router (e.g., `192.168.137.61`).

## 📦 Migration Steps

### 1. Copy Files
Copy the entire `ConfigWeaver` folder to the target machine.
> **Tip**: You can assume any path, e.g., `C:\NetworkWeaver\ConfigWeaver` or `/opt/ConfigWeaver`.

### 2. Verify Configurations
Check these files on the new machine:
- `monitoring/prometheus/prometheus.yml`: Ensure the MikroTik IP is reachable from this new machine.
- `docker-compose.yml`: No changes needed usually.

### 3. Start Application
Open a terminal in the `ConfigWeaver` folder and run:

```bash
docker-compose up -d --build
```
*The `--build` flag is crucial the first time to create the images on the new machine.*

### 4. Access
- **Dashboard**: `http://localhost:5173` (or the machine's IP address:5173)
- **Grafana**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`

## ❓ Troubleshooting
- **"Connection Refused"**: Check firewall settings on the new machine.
- **SNMP Fails**: Ensure the new machine's IP is allowed in the MikroTik SNMP settings.
