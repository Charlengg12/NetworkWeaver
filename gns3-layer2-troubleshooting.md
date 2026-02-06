# 🚨 GNS3 Connectivity Issue - Layer 2 Bridge Failure

**Date**: 2026-02-06 04:33 UTC+8  
**Status**: ❌ MikroTik unreachable despite having IP

---

## 🔍 Problem Summary

**Symptom**: MikroTik shows IP `192.168.247.128/24` but is unreachable from Windows host.

**Evidence**:
```
MikroTik console:
✅ IP Address: 192.168.247.128/24 on ether1
✅ Network: 192.168.247.0

Windows host:
❌ Ping 192.168.247.128: 100% packet loss
❌ ARP table: No entry for .128
✅ Firewall rules: ICMP & SNMP allowed
```

**Root Cause**: **GNS3 Layer 2 bridging failure** - The Cloud node is not properly bridging traffic between MikroTik and Windows.

---

## 🔧 Troubleshooting Steps

### Step 1: Verify GNS3 Cloud Node Configuration ⭐ CRITICAL

1. **Stop the MikroTik device** in GNS3 (right-click → Stop)

2. **Right-click Cloud node → Configure**

3. **Check "Ethernet interfaces" tab**:
   - Should show: **VMware Network Adapter VMnet8** selected
   - ❌ NOT: NPF_{GUID} format
   - Should see: "Show special Ethernet interfaces" checked

4. **If wrong adapter selected**:
   - Remove current adapter
   - Add: VMware Network Adapter VMnet8
   - Click OK

5. **Verify cable connection**:
   - Cloud (VMnet8) ←→ MikroTik ether1
   - Should show solid line, not dotted

6. **Start the MikroTik device** again

---

### Step 2: Test from MikroTik → Windows

Open MikroTik console and run:
```bash
# Ping your Windows PC
ping 192.168.247.1 count=4

# Check if Windows PC appears in ARP
/ip arp print where interface=ether1
```

**Expected**:
- Ping should succeed (0% loss)
- ARP should show 192.168.247.1 with MAC address

**If this works**: Direction is MikroTik → Windows ✅  
**If this fails**: GNS3 bridge is not working ❌

---

### Step 3: Force ARP Discovery from Windows

If MikroTik can ping Windows but Windows can't ping MikroTik:

```powershell
# Try to force ARP entry
arp -s 192.168.247.128 <MIKROTIK_MAC_ADDRESS>

# Get MikroTik MAC from its console:
# /interface print detail
```

---

### Step 4: Check GNS3 is Running as Administrator

GNS3 **MUST** run as Administrator to access network adapters.

1. Close GNS3
2. Right-click GNS3 icon → "Run as Administrator"
3. Reopen your topology
4. Start devices again

---

### Step 5: Restart GNS3 Bridge (uBridge)

Sometimes the bridge gets stuck:

```powershell
# Find uBridge process
Get-Process | Where-Object {$_.Name -like "*ubridge*"}

# Kill it (GNS3 will restart it)
Stop-Process -Name "ubridge" -Force

# In GNS3: Stop and start the Cloud node
```

---

### Step 6: Alternative - Use TAP Adapter

If VMnet8 bridging continues to fail:

1. **Install TAP adapter** (comes with OpenVPN or create via GNS3)
2. **Bridge TAP adapter** to VMnet8 in Windows Network Connections
3. **Use TAP adapter** in GNS3 Cloud node instead of VMnet8

---

## 🎯 Quick Diagnostic Commands

### From MikroTik Console:
```bash
# Check interface status
/interface print

# Check IP configuration
/ip address print

# Ping Windows host
ping 192.168.247.1 count=4

# View ARP table
/ip arp print

# Check if packets are flowing
/interface monitor-traffic ether1 once
```

### From Windows:
```powershell
# Check ARP table for MikroTik
arp -a | Select-String "192.168.247.128"

# Try NetBIOS name resolution
nbtstat -A 192.168.247.128

# Check if VMnet8 is up
Get-NetAdapter | Where-Object {$_.Name -like "*VMnet8*"}
```

---

## 📊 Expected vs. Actual

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| MikroTik has IP | 192.168.247.x | 192.168.247.128 | ✅ |
| MikroTik → Windows ping | Success | ❓ Unknown | ⏳ |
| Windows → MikroTik ping | Success | 100% loss | ❌ |
| ARP entry exists | Yes | No | ❌ |
| Firewall allows ICMP | Yes | Yes | ✅ |
| GNS3 runs as Admin | Yes | ❓ Unknown | ⏳ |

---

## 🚀 Recommended Next Actions

### Immediate (Do Now):
1. **Check**: Is GNS3 running as Administrator?
2. **Verify**: Cloud node is using "VMware Network Adapter VMnet8" (not NPF_...)
3. **Test**: From MikroTik console: `ping 192.168.247.1 count=4`
4. **Report**: Does MikroTik → Windows ping work?

### If MikroTik → Windows Works:
- Issue is **asymmetric** - likely Windows firewall or routing
- Try disabling Windows Firewall temporarily
- Check Windows routing table

### If MikroTik → Windows Fails Too:
- Issue is **GNS3 bridging**
- Restart GNS3 as Administrator
- Recreate Cloud node from scratch
- Try different adapter (TAP instead of VMnet8)

---

## 💡 Common Gotchas

1. **NPF_* adapter selected** instead of friendly name → Won't bridge properly
2. **GNS3 not running as Admin** → Can't access network adapters
3. **VMnet8 disabled in Windows** → Check `Get-NetAdapter`
4. **Cable not properly connected** → Should be solid line in GNS3
5. **DHCP IP changed** → MikroTik got new IP after restart

---

## 📝 Information Needed from User

To proceed, please provide:

1. ✅ GNS3 running as Administrator? (Yes/No)
2. ✅ Cloud node adapter name? (VMware Network Adapter VMnet8 or NPF_...?)
3. ❓ Does `ping 192.168.247.1` work from MikroTik? (Run in console)
4. ❓ What does `/ip arp print` show in MikroTik? (Any entries?)

---

**Once we confirm bidirectional connectivity, we can proceed with database updates and Prometheus configuration.**

