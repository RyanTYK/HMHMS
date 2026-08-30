# Installing HMHMS on a New Device — Start to Finish

This is a hand-holding, top-to-bottom walkthrough for setting up HMHMS on a brand new
Windows machine or VM that has nothing on it yet — no Docker, no repo, nothing. If you
already know Docker and just want the commands, use
[`COMPLETE-SETUP-GUIDE.md`](../COMPLETE-SETUP-GUIDE.md) instead — this doc is the
slower, more explained version of the same "Quick Start" path.

You will **not** need to clone this repository. Everything HMHMS needs is published as
ready-to-run Docker images — you only need two small text files and Docker itself.

---

## Before you start: what you'll need

- A Windows 10/11 machine (or a VM) with admin rights to install software
- About 15 minutes
- A Gmail account you're willing to send verification emails from (or any other SMTP
  provider — Gmail is just the easiest to set up). This is required — new HMHMS accounts
  must click an email link before they can log in, so the app won't start without a
  working mail configuration.

---

## Step 1: Install Docker Desktop

Docker is the only thing you need to install on the machine itself — the database, the
backend, and everything else run inside containers, so you don't need Node.js, MySQL, or
anything else on the host.

1. Go to https://www.docker.com/products/docker-desktop/ and download Docker Desktop for
   Windows.
2. Run the installer. If it prompts you to enable **WSL2**, accept — Docker Desktop needs
   it on Windows.
3. After it installs, it may ask you to restart your machine. Do that if asked.
4. Open Docker Desktop once and let it finish starting (the whale icon in your system
   tray stops animating once it's ready).
5. Open a Command Prompt and confirm it's working:
   ```cmd
   docker --version
   docker compose version
   ```
   Both should print a version number. If either command isn't found, Docker Desktop
   probably isn't fully started yet, or the install needs that restart.

---

## Step 2: Get the Team's Shared SMTP Credentials

HMHMS sends verification emails through a **shared team mailbox**, not a personal
account — you don't need to create your own Gmail account or app password.

Ask your team lead (or whoever set up the mailbox) for the shared `SMTP_USER` and
`SMTP_PASS` values via a private message or your team's password manager. **Do not**
put these values in this file, a commit, or anywhere else that ends up in the GitHub
repo — it's public, and a leaked app password lets anyone send mail as that account.

If you're setting up the *first* device and there's no shared mailbox yet, see
[Setting Up a New Shared Mailbox](#setting-up-a-new-shared-mailbox) at the bottom of
this doc instead.

---

## Step 3: Download the Two Files You Need

You don't need to clone the GitHub repository. Open a Command Prompt and run:

```cmd
mkdir HMHMS
cd HMHMS
curl -o docker-compose.yml https://raw.githubusercontent.com/RyanTYK/HMHMS/local-only/docker-compose.yml
curl -o .env.example https://raw.githubusercontent.com/RyanTYK/HMHMS/local-only/.env.example
copy .env.example .env
```

You should now have two files in your `HMHMS` folder: `docker-compose.yml` and `.env`.

---

## Step 4: Fill In `.env`

Open `.env` in Notepad (or any text editor):

```cmd
notepad .env
```

Find this section near the bottom and fill in the three values using the shared
credentials from Step 2:

```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

Everything else in the file already has a sensible default and can be left alone for a
first install. A couple worth knowing about:

- `HTTP_PORT=8080` — this is the port you'll browse to. Only change it if something else
  on your machine already uses 8080.
- `PUBLIC_URL=http://localhost:8080` — only change this if other people on your network
  need to reach this deployment (e.g. from their own laptops). In that case, set it to
  this machine's LAN IP instead of `localhost`, e.g. `http://10.180.11.78:8080`.

Save the file and close Notepad.

---

## Step 5: Start It Up

Back in the Command Prompt, still inside the `HMHMS` folder:

```cmd
docker compose pull
docker compose up -d
```

The first command downloads the prebuilt images (a couple hundred MB, takes a minute or
two depending on your connection). The second starts everything: the database, the API,
the background monitor-checking worker, and the web UI.

Check that all four came up cleanly:

```cmd
docker compose ps
```

You should see four services — `db`, `backend`, `worker`, `frontend` — all showing
`running`, with `db` and `backend` also showing `healthy`.

---

## Step 6: Open It and Create Your Account

1. Open a browser and go to `http://localhost:8080` (or whatever `PUBLIC_URL` you set).
2. You should land on the HMHMS login page.
3. Click **Sign Up**, fill in a name, email, and password, and register.
4. You'll see a "check your email" message, not an immediate login — check the inbox for
   the address you registered with. A verification email should arrive within a few
   seconds.
5. Click the link in that email. You can now log in.

If you try to log in before clicking the link, you'll get an error telling you to verify
first — that's expected, it's what stops the system from being used to spam alerts to
email addresses that haven't actually confirmed they want them.

---

## Step 7: Add Your First Monitor

1. Click **Add Monitor**.
2. Give it a name, pick a type (e.g. `HTTP`), and set a target (e.g.
   `https://www.google.com`).
3. Save it.
4. Within about a minute, the background worker will check it and the dashboard card
   will turn green (or red, if it's actually down) with a response time shown.

If that worked, your install is fully functional.

---

## Troubleshooting

**"Port 8080 is already in use"** — something else on the machine is using that port.
Change `HTTP_PORT` in `.env` to something else (e.g. `8081`), then run
`docker compose up -d` again.

**`backend` keeps restarting / never shows healthy** — almost always a bad or missing
`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`. Check with:
```cmd
docker compose logs backend
```

**No verification email arrives** — double check you used the Gmail *app password* (16
characters, from Step 2), not your normal account password. Gmail silently rejects the
normal password over SMTP.

**Ping-type monitors always show down** — this is a known Docker/WSL2 networking quirk,
not a broken install. Check `docker compose logs worker` for the specific error before
assuming something's wrong.

For anything else, see the fuller
[Common Issues & Troubleshooting](../COMPLETE-SETUP-GUIDE.md#common-issues--troubleshooting)
section in the main setup guide.

---

## Optional: Microsoft Sign-In (SSO)

If your team wants people to log in with their Microsoft work accounts instead of an
email/password, that's a separate, optional add-on — email/password with verification
works fine on its own and is the default. Setting up SSO requires someone with admin
rights on your company's Microsoft 365/Azure tenant to register an app (a 5-10 minute,
one-time task, no approval from Microsoft needed). Full walkthrough:
[`docs/MICROSOFT-SSO-SETUP.md`](MICROSOFT-SSO-SETUP.md).

---

## Updating Later

When a new version is published, from the same `HMHMS` folder:

```cmd
docker compose pull
docker compose up -d
```

Your data (accounts, monitors, history) lives in a Docker volume and isn't touched by
this — it only replaces the application images.

---

## Setting Up a New Shared Mailbox

Only needed once, by whoever is setting this up for the team for the first time. Every
other install should reuse this account's credentials (Step 2 above) instead of
repeating these steps.

1. Create (or pick) a Gmail account meant for this purpose — not anyone's personal
   inbox, since its credentials will be shared across the team.
2. Go to https://myaccount.google.com/security and turn on **2-Step Verification** for
   that account. (App Passwords only exist once 2FA is enabled.)
3. Go to https://myaccount.google.com/apppasswords and create a new app password —
   name it something like "HMHMS".
4. Google shows the 16-character password **once** — copy it immediately, you can't
   view it again later (you can always generate a new one if it's lost).
5. Store the account email and this app password in your team's password manager (or
   send it privately to whoever needs it) — never in a file that gets committed to this
   repo.
