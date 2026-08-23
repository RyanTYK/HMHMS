# HMHMS - Complete Setup Guide
## Host Machine Health Monitoring System - From Zero to Running

HMHMS runs entirely in Docker. This guide walks you through getting the full stack (database, API, background worker, web UI) running on a Windows machine or VM with a single command.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start — Prebuilt Images (No Source Checkout)](#quick-start--prebuilt-images-no-source-checkout)
3. [Getting the Code (Build From Source)](#getting-the-code-build-from-source)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Verification & Testing](#verification--testing)
7. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
8. [Optional Configuration](#optional-configuration)
9. [Day-to-Day Operations](#day-to-day-operations)
10. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

1. **Docker Desktop** (includes Docker Compose)
   - Download from: https://www.docker.com/products/docker-desktop/
   - On Windows, this requires WSL2 — the installer will prompt you to enable it if needed.
   - Verify installation:
     ```cmd
     docker --version
     docker compose version
     ```

That's it — Node.js, MySQL, and every other dependency run inside containers. You don't need them installed on the host.

### System Requirements
- Windows 10/11 (or any OS Docker Desktop supports), or a VM with Docker Desktop/Engine installed
- At least 4GB RAM available to Docker
- 2GB free disk space

---

## Quick Start — Prebuilt Images (No Source Checkout)

The backend and frontend images are published to GitHub Container Registry as [`ghcr.io/ryantyk/hmhms-backend`](https://github.com/RyanTYK/HMHMS/pkgs/container/hmhms-backend) and [`ghcr.io/ryantyk/hmhms-frontend`](https://github.com/RyanTYK/HMHMS/pkgs/container/hmhms-frontend), both public — no login required to pull. You don't need to clone this repository — just the compose file and a `.env` with a working mail server (see below).

### Step 1: Download the Compose File and Env Template

```cmd
mkdir HMHMS && cd HMHMS
curl -o docker-compose.yml https://raw.githubusercontent.com/RyanTYK/HMHMS/local-only/docker-compose.yml
curl -o .env.example https://raw.githubusercontent.com/RyanTYK/HMHMS/local-only/.env.example
copy .env.example .env
```

### Step 2: Configure `.env`

Open `.env` and set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` — see [Configuration](#configuration) below. This is the one thing you can't skip: new accounts must click a verification link before they can log in, and the stack refuses to start without a working mail config to send that link.

### Step 3: Pull and Run

```cmd
docker compose pull
docker compose up -d
```

This fetches the prebuilt images (skipping the multi-minute local build entirely) and starts the full stack — database, API, worker, and web UI. Database passwords default to working (if insecure) values, and the backend generates its own login-token secret on first boot and persists it in the database, so restarts don't log anyone out — SMTP is the only thing you have to set yourself. Continue at [Verification & Testing](#verification--testing).

If you want to modify the source code instead, follow [Getting the Code](#getting-the-code-build-from-source) below and use `docker compose up -d --build` — Compose builds locally whenever an image tag isn't already present, and `--build` forces a rebuild even if it is.

---

## Getting the Code (Build From Source)

```cmd
git clone https://github.com/RyanTYK/HMHMS.git
cd HMHMS
```

If you already have the repository, just make sure you're on the `local-only` branch:
```cmd
git checkout local-only
```

---

## Configuration

### Step 1: Create Your `.env` File

Copy the example file at the repo root:

```cmd
copy .env.example .env
```

This `.env` is read automatically by `docker compose` and is git-ignored, so your secrets stay local.

### Step 2: Set the Required Values

```env
# REQUIRED - new accounts must verify their email before they can log in.
# The stack refuses to start without these three set.
# For Gmail: enable 2FA, then generate an "App Password" at
# https://myaccount.google.com/apppasswords and use that as SMTP_PASS.
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 3: Adjust What You Need

Everything else has a working default and can be left as-is:

```env
# Port the web UI is published on (default 8080)
HTTP_PORT=8080

# The address people actually browse to. If other machines on your network
# need access, set this to the host's LAN IP, e.g. http://10.180.11.78:8080
PUBLIC_URL=http://localhost:8080

# Real database credentials instead of the built-in defaults
DB_USER=hmhms
DB_PASS=<pick a password>
DB_ROOT_PASSWORD=<pick a different password>

# Optional: pin the login-token signing secret instead of letting the
# backend generate and persist its own. Only needed if you're running
# multiple backend instances that must share one secret.
# Generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=
```

The rest of `.env` (worker tuning, Microsoft OAuth) has working defaults and can be left blank — see [Optional Configuration](#optional-configuration).

---

## Running the Application

If you followed the [Quick Start](#quick-start--prebuilt-images-no-source-checkout), you've already done this with `docker compose pull && docker compose up -d`. Building from a full source checkout instead:

```cmd
docker compose up -d --build
```

First run will:
1. Pull the `mariadb:10.11` image and build the `hmhms-backend`/`hmhms-frontend` images
2. Start the database and wait for it to become healthy
3. Initialize the schema from `backend/mysql-schema.sql` (only happens on an empty database)
4. Start the API, the background check worker, and the nginx-served web UI

This takes a few minutes on first run (mostly image builds — the prebuilt-image path above skips this). Watch progress with:

```cmd
docker compose logs -f
```

Once the `frontend` container reports healthy, the app is ready.

---

## Verification & Testing

### Step 1: Check Container Status

```cmd
docker compose ps
```

All four services (`db`, `backend`, `worker`, `frontend`) should show `running` (and `healthy` where applicable).

### Step 2: Open the Application

Browse to `http://localhost:8080` (or whatever `HTTP_PORT`/`PUBLIC_URL` you configured).

You should see the HMHMS login page.

### Step 3: Create Your First User

1. Click "Sign Up" / "Register"
2. Fill in username, email, and password
3. Register, then check your inbox for the verification link — you can't log in until you click it

### Step 4: Create Your First Monitor

1. Click "Add Monitor"
2. Fill in a name, type (HTTP/PING/etc.), and target — e.g. Type `HTTP`, Target `https://www.google.com`
3. Save

### Step 5: Watch Real-Time Updates

Within one check interval (default 60s, or as fast as `CHECK_INTERVAL_MS` polls), the worker will check the monitor and the dashboard will update live via SSE — green for up, red for down, with response time.

---

## Common Issues & Troubleshooting

### "Port 8080 is already in use"

Change `HTTP_PORT` in `.env` to a free port, then:
```cmd
docker compose up -d
```

### Containers won't start / `backend` keeps restarting

Check logs for the failing service:
```cmd
docker compose logs backend
docker compose logs worker
docker compose logs db
```
Most commonly this is a missing `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` in `.env` (the backend refuses to start without them). If those are set, check `docker compose logs db` next and confirm it reports healthy before the backend starts.

### Build fails with a TLS/registry error (`TLS_ALERT_HANDSHAKE_FAILURE`, "Exit handler never called")

Your network blocks `registry.npmjs.org`. Set `NPM_REGISTRY` in `.env` to your organization's npm mirror, then rebuild:
```cmd
docker compose build --no-cache
docker compose up -d
```

### Database won't come up healthy

```cmd
docker compose logs db
```
If this is a fresh setup and the schema seems wrong, you can reset the database volume (this deletes all data):
```cmd
docker compose down
docker volume rm hmhms_db_data
docker compose up -d --build
```

### Ping monitors always fail

The `worker` container is granted `NET_RAW` in `docker-compose.yml` specifically so ICMP ping monitors work across different Docker Desktop/WSL2 setups. If pings still fail, check `docker compose logs worker` for the underlying error.

### Frontend shows a blank page or can't reach the API

The frontend talks to the backend through nginx's `/api` reverse proxy on the same origin — there's no separate frontend URL/CORS to configure. Confirm `backend` is healthy (`docker compose ps`) and check the browser console (F12) for the actual failing request.

---

## Optional Configuration

All of the following are set in the root `.env` file and take effect on the next `docker compose up -d`. (SMTP is required, not optional — see [Configuration](#configuration).)

### Microsoft OAuth (SSO)

See [`docs/MICROSOFT-SSO-SETUP.md`](docs/MICROSOFT-SSO-SETUP.md) for the full Azure AD walkthrough, then set:
```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=http://localhost:8080/api/auth/microsoft/callback
```
Use your `PUBLIC_URL` in place of `localhost:8080` if this deployment is reachable by other machines.

### Worker & Retention Tuning

```env
CHECK_INTERVAL_MS=5000          # how often the worker polls for due monitors
MAX_CONCURRENT_CHECKS=60        # keep this above (active monitors / 2)
LOG_RETENTION_DAYS=7
```

---

## Day-to-Day Operations

```cmd
docker compose up -d --build     # start (or rebuild after pulling code changes)
docker compose down              # stop
docker compose logs -f           # tail logs from all services
docker compose logs -f backend   # tail logs from one service
docker compose ps                # check container status
docker compose restart worker    # restart a single service
```

Want to pick up a new release?
```cmd
# Prebuilt-image setup (no source checkout):
docker compose pull
docker compose up -d

# Source checkout:
git pull
docker compose up -d --build
```

---

## Next Steps

- Explore the docs in `docs/` — architecture, colour palette, milestones
- Configure Microsoft SSO if this deployment has multiple users on a shared VM
- Bulk-import existing monitors from CSV/JSON instead of adding them one by one

Happy monitoring!
