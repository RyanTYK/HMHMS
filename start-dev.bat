@echo off
start cmd /k "cd backend && npm run dev"
REM Always start the worker; lock manager handles stale locks
start cmd /k "cd backend && npm run worker"
timeout /t 10 /nobreak
start cmd /k "cd frontend && npm run dev"