# GNS3 MikroTik Monitoring Setup - Complete Command Reference

## 🎯 Goal
Connect GNS3 MikroTik routers to NetworkWeaver monitoring stack (Prometheus + Grafana) using the **VMware VMnet8** NAT adapter.

---

## Part 1: Windows Firewall Rules (Run as Administrator)

### Open PowerShell as Admin
1. Press `Win + X`
2. Select **Windows PowerShell (Admin)** or **Terminal (Admin)**

### Run These Commands
> **Note**: Update the subnet `192.168.247.0/24` if your VMnet8 adapter uses a different range. Check with `ipconfig`.

```powershell
# Allow ICMP (Ping) from GNS3 network (VMnet8 Subnet)
New-NetFirewallRule -DisplayName "GNS3 MikroTik ICMP" -Direction Inbound -Protocol ICMPv4 -RemoteAddress 192.168.247.0/24 -Action Allow

# Allow SNMP (Port 161) for Prometheus scraping
New-NetFirewallRule -DisplayName "GNS3 MikroTik SNMP" -Direction Inbound -Protocol UDP -LocalPort 161 -RemoteAddress 192.168.247.0/24 -Action Allow
```

---

## Part 2: GNS3 Topology Setup

### Cloud Node Configuration
1. Drag a **Cloud** node into your GNS3 topology
2. Right-click → **Configure**
3. Go to **Ethernet interfaces** tab
4. Check "Show special source addresses"
5. Add **VMware Network Adapter VMnet8** (or the adapter with `192.168.247.1`)
6. Click **OK**

### Connect to MikroTik
1. Use the cable tool
2. Connect: **Cloud (VMnet8)** → **MikroTik (ether1)**

---

## Part 3: MikroTik Configuration (Run in RouterOS Console)

### Set Static IP Address
> **IP Rule**: Use an IP in the VMnet8 range (e.g., `192.168.247.2`)
```bash
/ip address add address=192.168.247.2/24 interface=ether1
```

### Configure Router Gateway
> **Gateway**: This is your Host PC's VMnet8 IP (usually `.1`)
```bash
/ip route add dst-address=0.0.0.0/0 gateway=192.168.247.1
```

### Configure SNMP
```bash
# Enable SNMP
/snmp set enabled=yes

# Set SNMP community (read-only)
/snmp community add name=public addresses=0.0.0.0/0
```

### Test Connectivity to Host PC
```bash
# Ping your Windows PC (Host Adapter IP)
ping 192.168.247.1 count=4

# Ping Internet (Google DNS)
ping 8.8.8.8 count=4
```

---

## Part 4: Docker Container Testing

### Test from SNMP Exporter Container
```bash
# Ping the GNS3 router
docker exec networkweaver-snmp-exporter ping -c 4 192.168.247.2
```

### Check Prometheus Targets
```bash
# Open browser to:
http://localhost:9090/targets
```

**What to look for:**
- Target `192.168.247.2:161` should be listed under `snmp` job
- Status should be **UP**
- If missing, ensure the device is added to NetworkWeaver Database with the correct IP.

---

## Part 5: Verification Checklist

### ✅ Network Connectivity
- [ ] Windows Firewall rules created (ICMP + SNMP) for `192.168.247.0/24`
- [ ] GNS3 Cloud node configured with **VMnet8** adapter
- [ ] Cable connected: Cloud → MikroTik ether1
- [ ] MikroTik has IP `192.168.247.2/24` on ether1
- [ ] MikroTik can ping Host (`192.168.247.1`)
- [ ] MikroTik can ping Internet (`8.8.8.8`)

### ✅ SNMP Configuration
- [ ] SNMP enabled on MikroTik
- [ ] Community `public` configured
- [ ] Docker container can ping MikroTik (`192.168.247.2`)

### ✅ Monitoring Stack
- [ ] Device added to NetworkWeaver App with IP `192.168.247.2`
- [ ] Prometheus targets show UP status
- [ ] Grafana dashboard at `http://localhost:3000` shows data

---

## 🚨 Troubleshooting Quick Reference

### Ping Timeouts from MikroTik → PC
**Problem**: `ping 192.168.247.1` times out  
**Solution**: 
1. Check Windows Firewall rules (Part 1).
2. Ensure you are pinging the **VMnet8 adapter IP** (`ipconfig` to verify).

### "No route to host" Error
**Problem**: Ping shows "No route to host"  
**Solution**: Check subnet mask - must be `/24`, not `/32`, and gateway must be set.

### Prometheus Target Missing
**Problem**: Device not showing in Prometheus  
**Solution**:
1. Check NetworkWeaver Database (Devices tab) has the correct IP `192.168.247.2`.
2. Ensure Prometheus is using HTTP Service Discovery (check `prometheus.yml`).

### Docker Cannot Reach Router
**Problem**: Container ping fails  
**Solution**: 
1. Verify host can ping router first.
2. Restart Docker: `docker compose restart`

---

## 📝 Current Network Setup

```
Windows Host (VMnet8 Adapter)
192.168.247.1
    |
    | (GNS3 Cloud Bridge)
    |
MikroTik Router
192.168.247.2
ether1
    |
    | (Docker Monitoring Stack)
    |
Prometheus + Grafana
http://localhost:9090
http://localhost:3000
```
