<#
.SYNOPSIS
    Cleans up development bloat (caches, logs) and Docker residue.
.DESCRIPTION
    Removes __pycache__, .pytest_cache, node_modules (optional), and log files.
    Optionally prunes Docker system to reclaim space.
.PARAMETER PruneDocker
    If set, runs 'docker system prune -a -f' to remove all unused images and stopped containers.
.PARAMETER DryRun
    If set, only lists files to be deleted without removing them.
#>
param (
    [Switch]$PruneDocker,
    [Switch]$DryRun
)

$RootPath = Resolve-Path "$PSScriptRoot\..\.."
Write-Host "🤖 Starting Cleanup in: $RootPath" -ForegroundColor Cyan

# 1. Clean File Artifacts
$Patterns = @(
    "__pycache__",
    ".pytest_cache",
    "*.log"
)

foreach ($Pattern in $Patterns) {
    Write-Host "🔍 Scanning for $Pattern..." -ForegroundColor Yellow
    $Items = Get-ChildItem -Path $RootPath -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { 
        $_.Name -like $Pattern -or $_.Name -match $Pattern 
    }

    if ($Items) {
        foreach ($Item in $Items) {
            if ($DryRun) {
                Write-Host "   [DRY RUN] Would delete: $($Item.FullName)" -ForegroundColor Gray
            }
            else {
                try {
                    Remove-Item -Path $Item.FullName -Recurse -Force -ErrorAction Stop
                    Write-Host "   ✅ Deleted: $($Item.FullName)" -ForegroundColor Green
                }
                catch {
                    Write-Host "   ❌ Failed to delete: $($Item.FullName) - $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
    else {
        Write-Host "   No items found." -ForegroundColor DarkGray
    }
}

# 2. Docker Prune
if ($PruneDocker) {
    if ($DryRun) {
        Write-Host "🐳 [DRY RUN] Would run 'docker system prune -a -f' - Removes all unused images/containers" -ForegroundColor Magenta
    }
    else {
        Write-Host "🐳 Pruning Docker System..." -ForegroundColor Magenta
        docker system prune -a -f
        Write-Host "✅ Docker Prune Complete." -ForegroundColor Green
    }
}
else {
    Write-Host "ℹ️  Skipping Docker Prune (Use -PruneDocker to enable)" -ForegroundColor Gray
}

Write-Host "✨ Cleanup Finished!" -ForegroundColor Cyan
