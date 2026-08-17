<#
    HMHMS - one-click start

    Brings the entire stack up in Docker:
      MariaDB  ->  API  ->  check worker  ->  web UI

    Nothing else needs to be installed or started: no XAMPP, no separate
    terminals, no manual "npm run dev". Just run start.bat.
#>

[CmdletBinding()]
param(
    # Force a rebuild of the images even if nothing changed.
    [switch]$Rebuild,
    # Bring the stack up but do not open the browser.
    [switch]$NoBrowser,
    # Follow the container logs after everything is healthy.
    [switch]$Logs
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok  ($msg) { Write-Host "    $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }
function Write-Err ($msg) { Write-Host "!!! $msg" -ForegroundColor Red }

function Exit-WithPause([int]$code) {
    if ($Host.Name -eq 'ConsoleHost') {
        Write-Host ''
        Read-Host 'Press Enter to close'
    }
    exit $code
}

# ---------------------------------------------------------------------------
# 1. Docker CLI present?
# ---------------------------------------------------------------------------
Write-Step 'Checking Docker...'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err 'Docker is not installed (or not on PATH).'
    Write-Host '    Install Docker Desktop: https://www.docker.com/products/docker-desktop/'
    Exit-WithPause 1
}

# ---------------------------------------------------------------------------
# 2. Docker engine running? If not, start Docker Desktop and wait for it.
# ---------------------------------------------------------------------------
function Test-DockerEngine {
    docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerEngine)) {
    Write-Warn 'Docker engine is not running. Starting Docker Desktop...'

    $desktop = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if (-not $desktop) {
        Write-Err 'Could not find Docker Desktop. Please start it manually and re-run.'
        Exit-WithPause 1
    }

    Start-Process -FilePath $desktop | Out-Null

    # Docker Desktop can take a while on a cold boot.
    $timeoutSec = 180
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
        Start-Sleep -Seconds 3
        if (Test-DockerEngine) { break }
        Write-Host '.' -NoNewline
    }
    Write-Host ''

    if (-not (Test-DockerEngine)) {
        Write-Err "Docker did not become ready within $timeoutSec seconds."
        Write-Host '    Open Docker Desktop, wait for it to say "Engine running", then re-run this script.'
        Exit-WithPause 1
    }
}
Write-Ok 'Docker engine is running.'

# ---------------------------------------------------------------------------
# 3. Configuration
# ---------------------------------------------------------------------------
$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) {
    Write-Step 'First run: creating .env from .env.example'
    Copy-Item (Join-Path $root '.env.example') $envFile

    # A blank JWT_SECRET stops compose dead (it is marked required), so fill it.
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''

    $content = Get-Content $envFile -Raw
    $content = $content -replace '(?m)^JWT_SECRET=.*$', "JWT_SECRET=$secret"

    # Corporate networks often block registry.npmjs.org. If this machine's npm
    # is pointed at an internal mirror, reuse it for the image builds too -
    # otherwise `npm ci` inside the container dies on a TLS handshake failure.
    try {
        $reg = (npm config get registry 2>$null)
        if ($reg) { $reg = $reg.Trim() }
        if ($reg -and $reg -notmatch 'registry\.npmjs\.org') {
            $content = $content -replace '(?m)^NPM_REGISTRY=.*$', "NPM_REGISTRY=$reg"
            Write-Ok "Detected internal npm registry: $reg"
        }
    } catch {
        # npm not installed on the host - the public registry default is fine.
    }

    [IO.File]::WriteAllText($envFile, $content, (New-Object Text.UTF8Encoding $false))

    Write-Ok 'Generated .env with a random JWT_SECRET.'
    Write-Warn 'Edit .env to add SMTP settings if you want verification/alert emails.'
}

# Read HTTP_PORT so we can report the right URL.
$httpPort = '8080'
foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*HTTP_PORT\s*=\s*(\d+)') { $httpPort = $Matches[1] }
}
$url = "http://localhost:$httpPort"

# Warn early instead of failing with an opaque compose "port is already allocated".
$inUse = Get-NetTCPConnection -LocalPort $httpPort -State Listen -ErrorAction SilentlyContinue
if ($inUse) {
    $owner = (Get-Process -Id $inUse[0].OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Write-Warn "Port $httpPort is already in use by '$owner'."
    Write-Warn "If startup fails, change HTTP_PORT in .env."
}

# ---------------------------------------------------------------------------
# 4. Build + start
# ---------------------------------------------------------------------------
Write-Step 'Building and starting containers (first run downloads images - be patient)...'

$composeArgs = @('compose', 'up', '-d', '--build')
if ($Rebuild) { $composeArgs += '--force-recreate' }

& docker @composeArgs
if ($LASTEXITCODE -ne 0) {
    Write-Err 'docker compose failed to start the stack.'
    Write-Host '    Inspect the error above, or run: docker compose logs'
    Exit-WithPause 1
}

# ---------------------------------------------------------------------------
# 5. Wait until the UI actually answers
# ---------------------------------------------------------------------------
Write-Step 'Waiting for the application to become ready...'
$ready = $false
$sw = [Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt 180) {
    try {
        $resp = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch {
        # Not up yet - keep waiting.
    }
    Start-Sleep -Seconds 3
    Write-Host '.' -NoNewline
}
Write-Host ''

if (-not $ready) {
    Write-Err 'The stack started but did not become healthy in time.'
    Write-Host '    Check what went wrong with:  docker compose logs'
    docker compose ps
    Exit-WithPause 1
}

Write-Ok 'HMHMS is up.'
Write-Host ''
docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'
Write-Host ''
Write-Host "  Dashboard : $url" -ForegroundColor Green
Write-Host "  Stop with : stop.bat" -ForegroundColor Gray
Write-Host "  Logs with : docker compose logs -f" -ForegroundColor Gray
Write-Host ''

if (-not $NoBrowser) { Start-Process $url }

if ($Logs) {
    Write-Step 'Following logs (Ctrl+C to stop - containers keep running)'
    docker compose logs -f
}
