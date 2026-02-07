# 🖥️ VMware MikroTik CHR Setup Guide

## 🎯 Goal
Run a MikroTik Cloud Hosted Router (CHR) directly in VMware Workstation (Player or Pro) and connect it to the NetworkWeaver monitoring stack.

## 📋 Prerequisites
1.  **VMware Workstation Player** (Free) or **Pro**.
2.  **MikroTik CHR VMDK Image** (Download "Raw disk image" from MikroTik download page).
3.  **NetworkWeaver** stack running on Host.

---

## Part 1: VMware Network Configuration

### 1. Verify VMnet8 (NAT)
The "NAT" adapter allows the VM to share the Host's IP for internet access while creating a private network for Host-to-VM communication.

1.  Open Command Prompt (cmd) on Windows.
2.  Run: `ipconfig`
3.  Look for **Ethernet adapter VMware Network Adapter VMnet8**.
4.  Note the **IPv4 Address**. (Default is often `192.168.40.1` or `192.168.247.1`).
    *   *We will assume `192.168.247.1` for this guide. Replace with YOUR IP.*

### 2. Configure VM Settings
1.  Create a **New Virtual Machine**.
    *   Select "I will install the operating system later".
    *   Guest OS: **Linux** -> **Other Linux 5.x kernel 64-bit**.
2.  **Hardware**:
    *   **Hard Disk**: Remove default, add existing VMDK (the CHR image).
    *   **Network Adapter**: Select **NAT**.
3.  Start the VM.

---

## Part 2: RouterOS Configuration

Login with default user `admin` (no password).

### 1. Reset Configuration (Optional but Recommended)
Ensure a clean slate without default firewall rules that might block us.
```bash
/system reset-configuration no-defaults=yes skip-backup=yes
```
*After reboot, log in again.*

### 2. Configure IP Address
Assign a **Static IP** in the same subnet as your Host's VMnet8 adapter.
*   Host: `192.168.247.1`
*   Target (Router): `192.168.247.2`

```bash
/ip address add address=192.168.247.2/24 interface=ether1
```

### 3. Configure Gateway (For Internet)
Point to the Host's IP (or the VMware NAT Gateway, usually .2, but often .1 works for host reachability). **VMware NAT Gateway is strictly usually x.x.x.2**.
*   *Correction/Refinement*: In VMware NAT, the Gateway is usually at `.2`. The Host PC is at `.1`.

```bash
/ip route add dst-address=0.0.0.0/0 gateway=192.168.247.2
```
*(Try pinging 8.8.8.8. If fail, check Virtual Network Editor for NAT Gateway IP).*

### 4. Enable SNMP
Required for NetworkWeaver to "see" the router.
```bash
/snmp set enabled=yes
/snmp community add name=public addresses=0.0.0.0/0
```

---

## Part 3: Verification

### From Windows Host
```powershell
ping 192.168.247.2
```

### From Docker (NetworkWeaver)
```bash
docker exec networkweaver-snmp-exporter ping -c 4 192.168.247.2
```

## 🚨 Troubleshooting
*   **"Request timed out"**: Check Windows Firewall on the Host. You may need to allow traffic on the `VMnet8` interface.
*   **DHCP Conflict**: If you didn't set a static IP, VMware might have assigned a random one. Run `/ip address print` in the VM console to see what it has.
