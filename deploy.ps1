<#
.SYNOPSIS
    NetworkWeaver One-Click Deployment Script (Windows)
.DESCRIPTION
    Automates the checking of prerequisites, building of Docker images, and starting of the NetworkWeaver stack.
.NOTES
    Run as Administrator for best results if port binding issues occur.
#>

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host -ForegroundColor Cyan "`n➜ $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host -ForegroundColor Green "✔ $Message"
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host -ForegroundColor Red "✖ $Message"
}

# --- 1. Pre-flight Checks ---
Write-Step "Checking Prerequisites..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-ErrorMsg "Docker is not installed or not in PATH."
    Write-Host "Please install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop"
    exit 1
}

if (-not (docker info 2>&1 | Select-String "Server Version")) {
    Write-ErrorMsg "Docker daemon is not running."
    Write-Host "Please start Docker Desktop and try again."
    exit 1
}

Write-Success "Prerequisites Met."

# --- 2. Build & Deploy ---
Write-Step "Building NetworkWeaver Containers..."
try {
    docker-compose up -d --build --remove-orphans
}
catch {
    Write-ErrorMsg "Docker Build Failed."
    Write-Host $_
    exit 1
}

# --- 3. Health Check ---
Write-Step "Verifying Deployment..."
Start-Sleep -Seconds 10 

$backend = docker ps -q -f name=networkweaver-backend
$frontend = docker ps -q -f name=networkweaver-frontend

if ($backend -and $frontend) {
    Write-Success "NetworkWeaver is running!"
    Write-Host "`n📱 Access the Dashboard: http://localhost:5173"
    Write-Host "🔌 API Documentation:   http://localhost:8000/docs"
    Write-Host "📊 Grafana Monitoring: http://localhost:3000 (admin/admin)"
}
else {
    Write-ErrorMsg "Deployment seemed to start, but containers are not running."
    docker ps -a
}
