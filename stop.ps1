<#
    HMHMS - stop the Docker stack.

    By default containers are removed but your data is kept (the db_data
    volume survives). Use -Wipe to delete the database as well.
#>

[CmdletBinding()]
param(
    # Also delete the database volume. THIS ERASES ALL MONITORS AND USERS.
    [switch]$Wipe
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Docker is not installed or not on PATH.' -ForegroundColor Red
    exit 1
}

docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker engine is not running - nothing to stop.' -ForegroundColor Yellow
    exit 0
}

if ($Wipe) {
    Write-Host 'WARNING: this deletes the database volume (all monitors and users).' -ForegroundColor Red
    $answer = Read-Host "Type DELETE to confirm"
    if ($answer -ne 'DELETE') {
        Write-Host 'Aborted.' -ForegroundColor Yellow
        exit 0
    }
    docker compose down -v
} else {
    docker compose down
}

Write-Host 'HMHMS stopped.' -ForegroundColor Green
