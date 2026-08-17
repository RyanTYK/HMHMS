@echo off
REM ===========================================================================
REM  HMHMS - one-click start
REM  Starts the whole system (database, API, worker, web UI) in Docker.
REM  No XAMPP, no extra terminals.
REM ===========================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
