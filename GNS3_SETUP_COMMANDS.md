# GNS3 MikroTik Monitoring Setup - Complete Command Reference

## 🎯 Goal
Connect GNS3 MikroTik routers to NetworkWeaver monitoring stack (Prometheus + Grafana)

---

## Part 1: Windows Firewall Rules (Run as Administrator)

### Open PowerShell as Admin
1. Press `Win + X`
2. Select **Windows PowerShell (Admin)** or **Terminal (Admin)**

### Run These Commands

```powershell
# Allow ICMP (Ping) from GNS3 network
New-NetFirewallRule -DisplayName "GNS3 MikroTik ICMP" -Direction Inbound -Protocol ICMPv4 -RemoteAddress 192.168.137.0/24 -Action Allow

# Allow SNMP (Port 161) for Prometheus scraping
New-NetFirewallRule -DisplayName "GNS3 MikroTik SNMP" -Direction Inbound -Protocol UDP -LocalPort 161 -RemoteAddress 192.168.137.0/24 -Action Allow
```

---

## Part 2: GNS3 Topology Setup

### Cloud Node Configuration
1. Drag a **Cloud** node into your GNS3 topology
2. Right-click → **Configure**
3. Go to **Ethernet interfaces** tab
4. Check "Show special source addresses"
5. Add **Ethernet 2** (your ICS adapter)
6. Click **OK**

### Connect to MikroTik
1. Use the cable tool
2. Connect: **Cloud (Ethernet 2)** → **MikroTik (ether1)**

---

## Part 3: MikroTik Configuration (Run in RouterOS Console)

### Set Static IP Address
```bash
/ip address add address=192.168.137.60/24 interface=ether1
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
# Ping your Windows PC
ping 192.168.137.235 count=4

# Ping Gateway (Laptop)
ping 192.168.137.1 count=4

# Ping Internet
ping 8.8.8.8 count=4
```

### Check Interface Status
```bash
# Verify interfaces are up
/interface print

# Verify IP addresses
/ip address print

# Check ARP table (should see your PC)
/ip arp print
```

---

## Part 4: Docker Container Testing

### Test from SNMP Exporter Container
```bash
# Ping the GNS3 router
docker exec networkweaver-snmp-exporter ping -c 4 192.168.137.60
```

### Check Prometheus Targets
```bash
# Open browser to:
http://localhost:9090/targets

# Look for:
# - snmp/0 (192.168.137.60:161) - Should be UP
# - snmp/1 (192.168.137.61:161) - Should be UP
```

---

## Part 5: Verification Checklist

### ✅ Network Connectivity
- [ ] Windows Firewall rules created (ICMP + SNMP)
- [ ] GNS3 Cloud node configured with Ethernet 2
- [ ] Cable connected: Cloud → MikroTik ether1
- [ ] MikroTik has IP `192.168.137.60/24` on ether1
- [ ] MikroTik can ping Windows PC (`192.168.137.235`)
- [ ] MikroTik can ping Gateway (`192.168.137.1`)
- [ ] MikroTik can ping Internet (`8.8.8.8`)

### ✅ SNMP Configuration
- [ ] SNMP enabled on MikroTik
- [ ] Community `public` configured
- [ ] Docker container can ping MikroTik (`192.168.137.60`)

### ✅ Monitoring Stack
- [ ] Prometheus targets show UP status
- [ ] Grafana dashboard at `http://localhost:3000` shows data
- [ ] Frontend Monitoring tab displays dashboard

---

## 🚨 Troubleshooting Quick Reference

### Ping Timeouts from MikroTik → PC
**Problem**: `ping 192.168.137.235` times out  
**Solution**: Add Windows Firewall ICMP rule (see Part 1)

### "No route to host" Error
**Problem**: Ping shows "No route to host"  
**Solution**: Check subnet mask - must be `/24`, not `/32`

### GNS3 Bridge Not Working
**Problem**: ARP table empty, no connectivity  
**Solution**: 
1. Run GNS3 as Administrator
2. Delete Cloud node, recreate it
3. Ensure Ethernet 2 is selected (not NPF_...)
4. Restart MikroTik node after connecting cable

### Docker Cannot Reach Router
**Problem**: Container ping fails  
**Solution**: 
1. Verify host can ping router first
2. Check Docker network mode (should be `host` or bridge with proper routing)
3. Restart Docker: `docker compose restart`

---

## 📝 Current Network Setup

```
Laptop (Gateway)
192.168.137.1
    |
    | (ICS Bridge)
    |
Windows PC (Host)
192.168.137.235
Ethernet 2
    |
    | (GNS3 Cloud Bridge)
    |
MikroTik Router
192.168.137.60
ether1
    |
    | (Docker Monitoring Stack)
    |
Prometheus + Grafana
http://localhost:9090
http://localhost:3000
```

---

## 🎯 Success Criteria

When everything is working:
1. ✅ `ping 192.168.137.235` from MikroTik succeeds
2. ✅ `docker exec networkweaver-snmp-exporter ping -c 4 192.168.137.60` succeeds
3. ✅ Prometheus targets page shows both routers as **UP**
4. ✅ Grafana dashboard displays CPU, RAM, network metrics
5. ✅ Frontend Monitoring tab shows live data

---

## 📞 Notes

- Always check `/ip arp print` on MikroTik to verify Layer 2 connectivity
- If ARP shows the PC's MAC address, but ping fails → Firewall issue
- If ARP is empty → Bridge/Cable issue
- GNS3 must run as Administrator to access network adapters
