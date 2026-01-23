# GNS3 Setup Error Solutions

## Error: "Cannot use a node on the GNS3 VM server with the GNS3 VM not configured"

![GNS3 VM Error](C:/Users/Ronald/.gemini/antigravity/brain/6012d7aa-91fb-481e-a914-b85987ee6267/uploaded_image_1769154464007.png)

This error occurs when GNS3 tries to use the GNS3 VM but it's not properly set up.

---

## Solution 1: Use Local Server (Recommended for Windows)

This is the **easiest solution** - run appliances directly on your Windows machine.

### Steps:

1. **During MikroTik Import**:
   - When you see the "Qemu settings" screen (before the error)
   - Look for **"Server"** dropdown at the top
   - Change from `GNS3 VM` to **`Local server`**
   
2. **Set as Default**:
   - Go to **Edit → Preferences**
   - Navigate to **Server** section
   - Under "Local server", ensure it's enabled
   - Set as default compute server

3. **Retry Installation**:
   - Delete the failed MikroTik appliance
   - File → New template
   - Install MikroTik CHR again
   - This time it will use your local machine

### Requirements for Local Server:
- ✅ Good RAM (8GB+ recommended)
- ✅ Modern CPU with virtualization enabled
- ✅ Windows with QEMU installed (comes with GNS3)

---

## Solution 2: Configure GNS3 VM (Advanced)

If you prefer using the GNS3 VM for better performance:

### Step 1: Download GNS3 VM

1. Go to: https://www.gns3.com/software/download
2. Download **GNS3 VM** for VMware Workstation
3. File: `GNS3.VM.VMware.Workstation.X.X.X.zip`

### Step 2: Import GNS3 VM to VMware

1. Extract the downloaded ZIP file
2. Open VMware Workstation
3. **File → Open** 
4. Browse to extracted folder
5. Select the `.ovf` or `.vmx` file
6. Import with default settings
7. **Power on** the GNS3 VM

### Step 3: Configure GNS3 to Use the VM

1. In GNS3 desktop application:
   - **Edit → Preferences**
   - Go to **GNS3 VM** section
   
2. **Enable the GNS3 VM**:
   - Check ☑ **"Enable the GNS3 VM"**
   - Virtualization engine: **VMware Workstation**
   - VM name: Select your imported GNS3 VM
   
3. **Allocate Resources**:
   - RAM: **2048 MB** or more
   - vCPUs: **2** or more
   
4. Click **OK**

5. **Restart GNS3**

### Step 4: Verify Connection

1. Restart GNS3 application
2. The GNS3 VM should start automatically
3. Check status bar - should show "Connected to GNS3 VM"
4. Now retry installing MikroTik CHR

---

## Solution 3: Quick Fix - Change Server During Import

If you're in the middle of importing:

1. **Don't click OK on the error yet**
2. Click **OK** to close error dialog
3. Click **< Back** button
4. Look for **"Run this Qemu VM on"** or **"Server"** option
5. Change to **Local server**
6. Click **Next >** to continue

---

## Which Solution Should You Use?

### Use **Local Server** if:
- ✅ You have a powerful Windows PC (8GB+ RAM)
- ✅ You want simple setup
- ✅ You're just testing/learning
- ✅ Running only 2-3 routers

### Use **GNS3 VM** if:
- ✅ Running many devices (5+ routers)
- ✅ Need better performance
- ✅ Want to isolate GNS3 from Windows
- ✅ Have VMware Workstation Pro

---

## Recommended: Local Server for NetworkWeaver Lab

For your MikroTik monitoring setup, I recommend **Local Server** because:

1. **Simpler setup** - No need to download GNS3 VM
2. **Direct network access** - Easier to connect to your Windows host
3. **Fewer VMs** - You're only running 1-2 MikroTik routers
4. **Less overhead** - No need for an extra VM running

---

## Step-by-Step: Installing MikroTik on Local Server

### 1. Enable Local Server

```
Edit → Preferences → Server → Local server
☑ Enable local server
```

### 2. Download MikroTik QEMU Image

- Go to: https://mikrotik.com/download
- Product: **Cloud Hosted Router**
- Download: **Raw disk image** (.img file)
- Example: `chr-7.13.img`

### 3. Import to GNS3

1. **File → New template**
2. Select **"Install an appliance from the GNS3 server"**
3. Click **Next**
4. Search for **"MikroTik"**
5. Select **"MikroTik Cloud Hosted Router"**
6. Click **Install**

7. **Important**: When asked "Run this Qemu VM on":
   - Select **"Run on my local computer"**
   - Click **Next**

8. **Install required files**:
   - Click **"Import"** next to the version you want
   - Browse to your downloaded `.img` file
   - Click **Next**

9. **Finish installation**

### 4. Use in Project

1. Create new project or open existing
2. From left panel: **Routers** section
3. Drag **MikroTik CHR** to workspace
4. Right-click → **Start**
5. Right-click → **Console**

---

## Verification

After fixing, you should be able to:

- ✅ Start MikroTik router in GNS3
- ✅ Open console (right-click → Console)
- ✅ See MikroTik login prompt
- ✅ Login with `admin` (no password)

---

## Still Having Issues?

### Error: "QEMU binary not found"

**Solution**:
1. Reinstall GNS3
2. During installation, ensure **"QEMU"** is selected
3. Or manually install QEMU from: https://www.qemu.org/download/#windows

### Error: "VT-x/AMD-V not enabled"

**Solution**:
1. Restart PC
2. Enter BIOS/UEFI (usually F2, Del, or F12)
3. Find **Virtualization Technology** or **VT-x**
4. Enable it
5. Save and exit

### Error: "Permission denied"

**Solution**:
1. Run GNS3 as Administrator
2. Right-click GNS3 icon → **Run as administrator**

---

## Alternative: Use VirtualBox Instead of GNS3 VM

If VMware GNS3 VM doesn't work:

1. Download **GNS3 VM for VirtualBox**
2. Import to VirtualBox
3. In GNS3 Preferences:
   - Virtualization engine: **VirtualBox**
   - Select imported VM

---

## Next Steps

Once you've resolved the error:

1. ✅ Import MikroTik CHR successfully
2. ✅ Create your network topology
3. ✅ Configure routers with IPs
4. ✅ Enable SNMP
5. ✅ Connect to NetworkWeaver

Return to the main guide: [`GNS3_SIMULATION_GUIDE.md`](file:///c:/Users/Ronald/Desktop/NetworkWeaver/ConfigWeaver/GNS3_SIMULATION_GUIDE.md)

---

## Quick Reference

| Problem | Solution |
|---------|----------|
| GNS3 VM not configured | Use Local Server instead |
| Want better performance | Install and configure GNS3 VM |
| Simple lab (1-3 routers) | Use Local Server |
| Complex lab (5+ devices) | Use GNS3 VM |
| QEMU not found | Reinstall GNS3 with QEMU |
| VT-x error | Enable virtualization in BIOS |

---

**TIP**: For the NetworkWeaver monitoring lab, **Local Server is perfectly fine** and much easier to set up! 🚀
