# HMHMS — Host Machine Health Monitoring System

A web application that automatically checks if your websites, APIs, servers, and machines are up and running. It tests them regularly (e.g., every minute) by URL or IP address, saves the history, and shows you live updates instantly when something goes down or comes back up.


---

## Getting Started

**New to this project? Start here:**

### [**Complete Setup Guide**](COMPLETE-SETUP-GUIDE.md) ← Click to open full setup instructions

The complete guide walks you through:
- Installing all prerequisites
- Setting up the database
- Configuring backend and frontend
- Running the application
- Creating your first monitor
- Troubleshooting common issues

**Time to complete:** 15-30 minutes from scratch

---


## Features
- Authentication: JWT-based auth, protected API routes
- Monitor Management: CRUD, intervals/timeouts, expected status, headers/body, bulk import (CSV/JSON)
- Automated Checks: worker process, lock manager, response time + status validation
- Real‑Time Updates: SSE streams for dashboards and details
- Historical Data: check logs, uptime %, response-time sparklines
- Data Retention: scheduled cleanup with cron-like jobs
- Teams & Sharing: team dashboards, per‑monitor sharing, roles
- Notifications: email + in-app, with future browser notifications


## Tech Stack
- Backend: Node.js, TypeScript, Express, TypeORM, MySQL
- Frontend: Vue 3 (Vite, Pinia, Vue Router, Tailwind CSS)
- Realtime: Server‑Sent Events (SSE)


## Monorepo Structure
- `backend/`: Express API, workers, TypeORM models, migrations, scripts
- `frontend/`: Vue 3 SPA served by Vite in dev, static build for prod
- `docs/`: architecture, database design, local dev, deployment, API docs
- `start-dev.bat`: one‑click local dev starter (API, worker, frontend)


## Quick Reference

**One-click start:** `start-dev.bat` or press **F5** in VS Code

**Manual start:**
```cmd
cd backend && npm run dev     # Terminal 1 - API (port 3001)
cd backend && npm run worker  # Terminal 2 - Worker
cd frontend && npm run dev    # Terminal 3 - Frontend (port 5173)
```

**Access:** Frontend at http://localhost:5173 | API at http://localhost:3001

## Documentation
- Overview: `docs/00-PROJECT-OVERVIEW.md`
- Backend Arch: `docs/01-BACKEND-ARCHITECTURE.md`
- Frontend Arch: `docs/02-FRONTEND-ARCHITECTURE.md`
- Database Design: `docs/03-DATABASE-DESIGN.md`
- Auth System: `docs/04-AUTHENTICATION-SYSTEM.md`
- Health Checks: `docs/05-HEALTH-CHECK-SYSTEM.md`
- Real‑Time (SSE): `docs/06-REAL-TIME-UPDATES-SSE.md`
- Local Dev: `docs/07-LOCAL-DEVELOPMENT.md`
- Deployment: `docs/08-PRODUCTION-DEPLOYMENT.md`
- API Docs: `docs/09-API-DOCUMENTATION.md`
- New Features Plan: `docs/10-NEW-FEATURES-TO-IMPLEMENT.md`
- Monitor Scoping: `docs/14-MONITOR-SCOPING-IMPLEMENTATION.md`
 - Milestones: `docs/MILESTONES.md`


## Production Notes
- Reverse proxy and SSL recommended (see `docs/08-PRODUCTION-DEPLOYMENT.md`)


## License
No license specified.
