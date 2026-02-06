<#
.SYNOPSIS
    Updates .env configuration with the current Wi-Fi IP address for portability.
.DESCRIPTION
    Detects the active Wi-Fi IPv4 address, updates the HOST_IP in .env, 
    and optionally restarts containers to apply changes.
.PARAMETER RestartContainers
    If set, restarts Docker containers after updating config.
#>
param (
    [Switch]$RestartContainers
)

$RootPath = Resolve-Path "$PSScriptRoot\..\.."
$EnvPath = Join-Path $RootPath ".env"

Write-Host "📡 Detecting Network Configuration..." -ForegroundColor Cyan

# 1. Get Wi-Fi IP
try {
    $WifiIP = (Get-NetIPAddress -InterfaceAlias "Wi-Fi" -AddressFamily IPv4 -ErrorAction Stop).IPAddress
}
catch {
    Write-Host "⚠️  Could not find interface named 'Wi-Fi'. Trying to find any active wireless adapter..." -ForegroundColor Yellow
    $WifiAdapter = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.MediaType -eq "802.3" } | Select-Object -First 1
    if ($WifiAdapter) {
        $WifiIP = (Get-NetIPAddress -InterfaceIndex $WifiAdapter.ifIndex -AddressFamily IPv4).IPAddress
    }
}

if (-not $WifiIP) {
    Write-Host "❌ Could not detect a valid Wi-Fi IP address. Please check your connection." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Detected Wi-Fi IP: $WifiIP" -ForegroundColor Green

# 2. Update .env
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath
    $NewContent = $EnvContent -replace "^HOST_IP=.*$", "HOST_IP=$WifiIP"
    
    if ($EnvContent -ne $NewContent) {
        Set-Content -Path $EnvPath -Value $NewContent
        Write-Host "📝 Updated .env HOST_IP to $WifiIP" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  .env HOST_IP is already up to date." -ForegroundColor Gray
    }
}
else {
    Write-Host "❌ .env file not found at $EnvPath" -ForegroundColor Red
    exit 1
}

# 3. Restart Containers (Optional)
if ($RestartContainers) {
    Write-Host "🔄 Restarting Docker Containers..." -ForegroundColor Magenta
    Set-Location $RootPath
    docker-compose down
    docker-compose up -d
    Write-Host "✅ Containers Restarted." -ForegroundColor Green
}
else {
    Write-Host "ℹ️  Use -RestartContainers to apply changes immediately." -ForegroundColor Gray
}
