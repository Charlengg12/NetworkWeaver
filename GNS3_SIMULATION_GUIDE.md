# GNS3 Simulation Guide for NetworkWeaver Monitoring

This guide walks you through simulating your MikroTik monitoring setup using GNS3 and VMware.

## Overview

You'll create a virtual network with:
- **MikroTik RouterOS** virtual machines (routers to monitor)
- **Ubuntu/Windows VM** running NetworkWeaver (Prometheus, Grafana, SNMP Exporter)
- **Network topology** connecting them together

## Prerequisites

### Software Requirements

1. **GNS3** (v2.2.x or later)
   - Download from: https://www.gns3.com/software/download
   - Install both GNS3 application and GNS3 VM

2. **VMware Workstation** (or VMware Player)
   - Already installed on your system
   - GNS3 can integrate with VMware VMs

3. **Virtual Machine Images**:
   - **MikroTik CHR** (Cloud Hosted Router) - Free license
   - **Ubuntu Server** (for NetworkWeaver) or use your Windows host

---

## Part 1: Download Required Images

### A. MikroTik CHR (Cloud Hosted Router)

1. Download MikroTik CHR:
   - Visit: https://mikrotik.com/download
   - Select **Cloud Hosted Router**
   - Download the **VMware** disk image (.vmdk file)
   - File: `chr-X.XX.vmdk` (e.g., `chr-7.13.vmdk`)

2. Alternative - Use QEMU image for GNS3:
   - Download `.img` file instead
   - This works better with GNS3's built-in QEMU

### B. Ubuntu Server (Optional - for NetworkWeaver)

If you want NetworkWeaver in a VM instead of your Windows host:
- Download Ubuntu Server 22.04 LTS ISO
- From: https://ubuntu.com/download/server

---

## Part 2: GNS3 Installation and Configuration

### Step 1: Install GNS3

1. Run the GNS3 installer
2. **Important selections** during installation:
   - ✅ Install GNS3
   - ✅ Install WinPCAP/Npcap (for packet capture)
   - ✅ Install Wireshark
   - ✅ Install Solar-PuTTY (optional)

3. Choose setup type:
   - Select **"Run appliances in a virtual machine"**
   - Or **"Run appliances on my computer"** if you have powerful hardware

### Step 2: Configure GNS3 with VMware

1. Open GNS3
2. Go to **Edit → Preferences**
3. Navigate to **VMware → VMware VMs**
4. GNS3 will scan for existing VMware VMs
5. Keep this window open for later

---

## Part 3: Create MikroTik Router VM

### Option A: Using VMware Workstation

1. **Create new Virtual Machine**:
   - Open VMware Workstation
   - File → New Virtual Machine
   - Select **"Custom"**
   
2. **Virtual Machine Configuration**:
   - Hardware compatibility: Workstation 16.x (or your version)
   - Guest OS: **Linux** → **Other Linux 5.x kernel 64-bit**
   - VM Name: `MikroTik-Router-1`
   - Location: Choose a path

3. **Hardware Settings**:
   - Processors: **1 CPU, 1 core**
   - Memory: **256 MB** (MikroTik is lightweight)
   - Network: **NAT** (for now, we'll change this)
   - Hard Disk: **Use existing disk** → Select the `.vmdk` file you downloaded
   
4. **Add Network Adapters**:
   - By default, 1 NIC is added
   - **Add 2-3 more network adapters**:
     - VM Settings → Add → Network Adapter
     - Add multiple adapters for different interfaces
     - Set them to **Custom (VMnet2, VMnet3, etc.)**

5. **Boot the VM**:
   - Power on
   - Default login: `admin` (no password)
   - You should see MikroTik RouterOS prompt

### Option B: Using GNS3 QEMU (Recommended)

1. **Add MikroTik to GNS3**:
   - In GNS3: Edit → Preferences
   - Go to **QEMU VMs**
   - Click **New**
   
2. **Configuration Wizard**:
   - Name: `MikroTik-CHR`
   - QEMU binary: Default
   - RAM: **256 MB**
   - Console Type: **telnet**

3. **Add Disk Image**:
   - Click **"Disk image"** tab
   - Browse to your `.img` file
   - Disk interface: **IDE** or **SATA**

4. **Network Adapters**:
   - Set adapter type: **e1000** or **virtio-net-pci**
   - Adapters: **4** (for multiple interfaces)

5. Click **Finish**

---

## Part 4: Create Network Topology in GNS3

### Step 1: Design Your Network

1. **Create a new project** in GNS3:
   - File → New blank project
   - Name: `NetworkWeaver-Monitoring-Lab`

2. **Add devices** to the workspace:
   - From left panel, find **"End Devices"**
   - Drag **VPCS** (Virtual PC Simulator) - for testing
   - From **"Routers"**, drag your **MikroTik-CHR** appliance
   - Add **Switch** from "Switches" section

### Step 2: Build the Topology

```
Example topology:

┌─────────────────┐
│   Your PC       │
│  (Windows +     │
│ NetworkWeaver)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ NAT/    │
    │ Cloud   │
    └────┬────┘
         │
    ┌────┴────────┐
    │   Switch    │
    └─┬─────────┬─┘
      │         │
  ┌───┴───┐ ┌──┴────┐
  │ R1    │ │  R2   │
  │MikroTik│ │MikroTik│
  └───────┘ └───────┘
```

### Step 3: Connect Devices

1. **Add Cloud node** (to connect to your host):
   - Drag **"Cloud"** from left panel
   - Right-click Cloud → Configure
   - Select your physical network adapter (Ethernet/WiFi)

2. **Connect everything**:
   - Use **"Add a link"** tool (cable icon)
   - Connect: Cloud → Switch
   - Connect: Switch → MikroTik ether1
   - Connect: Switch → MikroTik2 ether1 (if using multiple routers)

3. **Start all devices**:
   - Right-click each device → Start
   - Or click green Play button (starts all)

---

## Part 5: Configure MikroTik Routers

### Step 1: Access MikroTik Console

1. In GNS3, right-click **MikroTik-R1** → **Console**
2. Login: `admin` (press Enter, no password initially)

### Step 2: Basic Configuration

```routeros
# Set system identity
/system identity set name=MikroTik-R1

# Configure IP address on ether1 (management)
/ip address add address=10.244.222.81/24 interface=ether1

# Set default route (if needed)
/ip route add gateway=10.244.222.1

# Enable SNMP
/snmp set enabled=yes contact="admin" location="GNS3-Lab"

# Configure SNMP community
/snmp community
set [ find default=yes ] addresses=0.0.0.0/0 name=public

# Optional: Create admin user with password
/user add name=admin password=admin group=full
```

### Step 3: Configure Additional Router (R2)

Repeat for second MikroTik with different IP:
```routeros
/system identity set name=MikroTik-R2
/ip address add address=10.244.222.82/24 interface=ether1
/snmp set enabled=yes
```

---

## Part 6: Configure Network Connectivity

### Option A: Host-Only Network (Isolated Lab)

1. **In VMware**:
   - Edit → Virtual Network Editor
   - Add **VMnet8** (NAT) or **VMnet1** (Host-Only)
   - Subnet: `10.244.222.0/24`
   - Note the host IP (usually `.1`)

2. **In GNS3 Cloud**:
   - Configure to use `VMnet8` or `VMnet1`

### Option B: Bridge to Physical Network

1. **In GNS3 Cloud**:
   - Right-click Cloud → Configure
   - Select your physical adapter
   - This connects GNS3 to your real network

2. MikroTik routers will be on your actual network (e.g., `192.168.1.x`)

---

## Part 7: Integrate with NetworkWeaver

### Step 1: Test Connectivity from Host

```powershell
# Ping MikroTik from Windows
ping 10.244.222.81

# Test SNMP
docker run --rm --network=host alpine/snmpwalk -v2c -c public 10.244.222.81 system
```

### Step 2: Update NetworkWeaver Configuration

Edit `monitoring/snmp.yml`:

```yaml
modules:
  if_mib:
    walk:
      - 1.3.6.1.2.1.2
      - 1.3.6.1.2.1.31
    auth:
      community: public
```

Update your **Prometheus configuration** to scrape GNS3 routers:

```yaml
scrape_configs:
  - job_name: 'mikrotik-router-gns3'
    static_configs:
      - targets:
        - 10.244.222.81  # R1
        - 10.244.222.82  # R2
    metrics_path: /snmp
    params:
      module: [if_mib]
      auth: [public]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter:9116
```

### Step 3: Start NetworkWeaver

```bash
cd c:\Users\Ronald\Desktop\NetworkWeaver\ConfigWeaver
docker-compose up -d
```

### Step 4: Verify Monitoring

1. **Prometheus targets**: http://localhost:9090/targets
   - Should show `mikrotik-router-gns3` with state **UP**
   
2. **Grafana**: http://localhost:3000
   - Login: admin/admin
   - Check dashboards for interface metrics

---

## Part 8: Advanced Configuration

### A. Create Traffic Between Routers

1. **Configure second interface**:
   ```routeros
   # On R1
   /ip address add address=192.168.100.1/24 interface=ether2
   
   # On R2
   /ip address add address=192.168.100.2/24 interface=ether2
   ```

2. **Test connectivity**:
   ```routeros
   # From R1
   /ping 192.168.100.2
   ```

### B. Generate Network Traffic

Use **Traffic Generator**:
```routeros
# On MikroTik
/tool traffic-generator
```

Or add **VPCS** endpoints:
```bash
# In VPCS console
ip 192.168.100.10 255.255.255.0 192.168.100.1
ping 192.168.100.2 -t
```

### C. Simulate Link Failures

- In GNS3, right-click a link → **Stop**
- Watch alerts in Grafana/Prometheus
- Observe interface status changes

---

## Part 9: Save and Export

### Save GNS3 Project

1. File → Save Project As
2. Name: `NetworkWeaver-Monitoring-Lab`
3. GNS3 saves topology and settings

### Export Portable Project

1. File → Export portable project
2. Include all disk images
3. Share with team or backup

---

## Troubleshooting

### Issue: Can't ping MikroTik from Windows

**Solutions**:
- Check GNS3 Cloud configuration
- Verify VMnet adapter settings in VMware
- Ensure Windows firewall allows ICMP
- Check MikroTik IP address: `/ip address print`

### Issue: SNMP not responding

**Solutions**:
- Verify SNMP is enabled: `/snmp print`
- Check community string matches
- Ensure no firewall blocking UDP 161
- Test with: `docker run --rm --network=host alpine/snmpwalk -v2c -c public <IP> system`

### Issue: GNS3 VMs won't start

**Solutions**:
- Check GNS3 VM is running (if using GNS3 VM)
- Verify QEMU/VMware integration
- Check disk image paths
- Review GNS3 logs: Help → Show GNS3 Console

### Issue: Network performance is slow

**Solutions**:
- Reduce number of nodes
- Allocate more RAM to GNS3 VM
- Use GNS3 VM instead of local server
- Close unnecessary applications

---

## Performance Tips

1. **Use GNS3 VM**: Better performance than running on Windows directly
2. **Limit CPU usage**: Edit → Preferences → QEMU → CPU throttling
3. **Use lightweight routers**: MikroTik CHR is perfect (minimal resources)
4. **Snapshot VMs**: Save router configs as snapshots for quick reset
5. **Close GNS3 when not in use**: Stops all background VMs

---

## Network Diagram

Here's what your final setup should look like:

```
Internet/LAN
     │
┌────┴─────────────────────────────────────┐
│          VMware VMnet / GNS3 Cloud        │
│              10.244.222.0/24              │
└────┬──────────────────┬──────────────────┘
     │                  │
     │                  │
┌────┴────────┐   ┌─────┴─────────┐
│  Windows PC │   │ GNS3 Switch   │
│             │   └──┬─────────┬──┘
│ NetworkWeaver│     │         │
│  - Prometheus│  ┌──┴───┐  ┌──┴───┐
│  - Grafana   │  │ R1   │  │ R2   │
│  - SNMP Exp. │  │.81   │  │.82   │
└──────────────┘  └──────┘  └──────┘
   (Host)         (GNS3)   (GNS3)
```

---

## Next Steps

1. ✅ Set up GNS3 with VMware integration
2. ✅ Import MikroTik CHR images
3. ✅ Build network topology
4. ✅ Configure routers with SNMP
5. ✅ Connect NetworkWeaver to GNS3 network
6. ✅ Verify monitoring in Prometheus/Grafana
7. 🎯 Add more routers and complex topologies
8. 🎯 Test failover scenarios
9. 🎯 Create custom alert rules
10. 🎯 Simulate real-world network issues

---

## References

- [GNS3 Documentation](https://docs.gns3.com/)
- [MikroTik CHR Setup](https://wiki.mikrotik.com/wiki/Manual:CHR)
- [GNS3 + VMware Integration](https://docs.gns3.com/docs/emulators/vmware-vm)
- [SNMP on MikroTik](https://wiki.mikrotik.com/wiki/Manual:SNMP)

---

## Quick Start Checklist

- [ ] Install GNS3 and VMware Workstation
- [ ] Download MikroTik CHR image
- [ ] Create GNS3 project
- [ ] Add MikroTik VMs to GNS3
- [ ] Build network topology (Cloud → Switch → Routers)
- [ ] Configure MikroTik IPs (10.244.222.81, .82)
- [ ] Enable SNMP on all routers
- [ ] Test ping from Windows host
- [ ] Update NetworkWeaver Prometheus config
- [ ] Start docker-compose
- [ ] Verify targets in Prometheus
- [ ] View metrics in Grafana
- [ ] Test link failures and alerts

Good luck with your simulation! 🚀
