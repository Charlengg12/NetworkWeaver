Write-Host "🚀 Starting Network Repair for GNS3..." -ForegroundColor Cyan

# 1. Enable Loopback Adapter
$adapter = "Ethernet 8" # Microsoft KM-TEST Loopback Adapter
Write-Host "Enabling Adapter: $adapter"
Enable-NetAdapter -Name $adapter -Confirm:$false
Start-Sleep -Seconds 2

# 2. Set Static IP
Write-Host "Setting Static IP 192.168.100.1..."
New-NetIPAddress -InterfaceAlias $adapter -IPAddress 192.168.100.1 -PrefixLength 24 -DefaultGateway 192.168.100.1 -Confirm:$false -ErrorAction SilentlyContinue

# 3. Fix Firewall Rules
Write-Host "Updating Firewall Rules for 192.168.100.x..."
Set-NetFirewallRule -DisplayName "GNS3 MikroTik ICMP" -RemoteAddress "192.168.100.0/24"
Set-NetFirewallRule -DisplayName "GNS3 MikroTik SNMP" -RemoteAddress "192.168.100.0/24"

Write-Host "✅ Network Configuration Complete!" -ForegroundColor Green
Write-Host "You can now configure GNS3 to use 'Microsoft KM-TEST Loopback Adapter'"
Read-Host -Prompt "Press Enter to exit"
