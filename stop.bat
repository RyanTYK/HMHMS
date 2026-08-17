@echo off
REM ===========================================================================
REM  HMHMS - stop the Docker stack (data is preserved).
REM  Use "stop.bat -Wipe" to also erase the database.
REM ===========================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
