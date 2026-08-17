# Stops all HMHMS dev runners (backend API, worker, frontend Vite).
# Only targets processes whose command line or working port belongs to this project.

$ErrorActionPreference = 'SilentlyContinue'
$projectRoot = $PSScriptRoot
$ports = @(3001, 5173)
$targets = [System.Collections.Generic.HashSet[int]]::new()

# 1) Match node/npm processes whose command line references this project folder
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='npm.cmd'" | ForEach-Object {
    if ($_.CommandLine -and $_.CommandLine -like "*$projectRoot*") {
        [void]$targets.Add([int]$_.ProcessId)
    }
}

# 2) Match anything still listening on the dev ports
foreach ($port in $ports) {
    Get-NetTCPConnection -LocalPort $port -State Listen | ForEach-Object {
        [void]$targets.Add([int]$_.OwningProcess)
    }
}

# 3) Include child processes of the targets (npm -> node wrappers)
$all = Get-CimInstance Win32_Process
$changed = $true
while ($changed) {
    $changed = $false
    foreach ($p in $all) {
        if ($targets.Contains([int]$p.ParentProcessId) -and -not $targets.Contains([int]$p.ProcessId)) {
            if ($p.Name -in @('node.exe', 'cmd.exe', 'npm.cmd', 'conhost.exe')) {
                [void]$targets.Add([int]$p.ProcessId)
                $changed = $true
            }
        }
    }
}

# Never kill ourselves or our own parent shell
[void]$targets.Remove($PID)

if ($targets.Count -eq 0) {
    Write-Host "No HMHMS dev runners found." -ForegroundColor Yellow
} else {
    foreach ($id in $targets) {
        $proc = Get-Process -Id $id
        if ($proc) {
            Write-Host ("Stopping PID {0} ({1})" -f $id, $proc.Name) -ForegroundColor Cyan
            Stop-Process -Id $id -Force
        }
    }
    Write-Host "All HMHMS dev runners stopped." -ForegroundColor Green
}

# Clear the worker lock so the next run starts cleanly
$lock = Join-Path $projectRoot 'backend\worker.lock'
if (Test-Path $lock) {
    Remove-Item $lock -Force
    Write-Host "Removed stale backend\worker.lock" -ForegroundColor Green
}
