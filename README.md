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
- Authentication: JWT-based auth, protected API routes, optional Microsoft SSO
- Monitor Management: CRUD, intervals/timeouts, expected status, headers/body, bulk import (CSV/JSON)
- Automated Checks: worker process, lock manager, response time + status validation
- Real‑Time Updates: SSE streams for dashboards and details
- Historical Data: check logs, uptime %, response-time sparklines
- Data Retention: scheduled cleanup with cron-like jobs
- Notifications: email, in-app, and browser notifications


## Tech Stack
- Backend: Node.js, TypeScript, Express, TypeORM, MySQL
- Frontend: Vue 3 (Vite, Pinia, Vue Router, Tailwind CSS)
- Realtime: Server‑Sent Events (SSE)


## Monorepo Structure
- `backend/`: Express API, workers, TypeORM models, migrations, scripts
- `frontend/`: Vue 3 SPA served by Vite in dev, static build for prod
- `docs/`: setup guides, SSO setup, colour palette, milestones
- `docker-compose.yml`: single entry point to run the full stack locally


## Quick Reference

**Start (prebuilt images, no source checkout):** set up `.env` (SMTP is required — see the setup guide), then `docker compose pull && docker compose up -d`

**Start (build from source):** `docker compose up -d --build`

**Stop:** `docker compose down`

**Logs:** `docker compose logs -f`

**Access:** http://localhost:8080 (or your configured `HTTP_PORT`)

Images are published to GitHub Container Registry as `ghcr.io/ryantyk/hmhms-db`, [`ghcr.io/ryantyk/hmhms-backend`](https://github.com/RyanTYK/HMHMS/pkgs/container/hmhms-backend) and [`ghcr.io/ryantyk/hmhms-frontend`](https://github.com/RyanTYK/HMHMS/pkgs/container/hmhms-frontend) — see the [Quick Start](COMPLETE-SETUP-GUIDE.md#quick-start--prebuilt-images-no-source-checkout) section of the setup guide.

## Documentation
- Setup Guide: [`COMPLETE-SETUP-GUIDE.md`](COMPLETE-SETUP-GUIDE.md)
- Microsoft SSO Setup: [`docs/MICROSOFT-SSO-SETUP.md`](docs/MICROSOFT-SSO-SETUP.md)
- Colour Palette: [`docs/COLOUR-PALETTE.md`](docs/COLOUR-PALETTE.md)
- Milestones: [`docs/MILESTONE/MILESTONES.md`](docs/MILESTONE/MILESTONES.md)


## Production Notes
- This branch targets a single-VM, local-network deployment via Docker Compose (see `COMPLETE-SETUP-GUIDE.md`). For internet-facing deployments, put a reverse proxy with SSL in front of the published `HTTP_PORT`.


## License
No license specified.
