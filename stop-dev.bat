@echo off
REM Stops all HMHMS dev runners (backend, worker, frontend).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev.ps1"
pause
