# HMHMS - Complete Setup Guide
## Host Machine Health Monitoring System - From Zero to Running

This guide will walk you through setting up and running the HMHMS project from scratch on Windows. Follow each step carefully to get the application running on your local machine.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Verification & Testing](#verification--testing)
7. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
8. [Optional Configuration](#optional-configuration)
9. [Next Steps](#next-steps)

---

## Prerequisites

Before starting, ensure you have the following installed on your Windows machine:

### Required Software

1. **Node.js (Version 20.19+ or 22.12+)**
   - Download from: https://nodejs.org/
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```
   - Should show v20.19+ or v22.12+

2. **MySQL (Version 8+)**
   - **Recommended:** Install via XAMPP (includes MySQL + phpMyAdmin)
     - Download from: https://www.apachefriends.org/
   - **Alternative:** Standalone MySQL installation
     - Download from: https://dev.mysql.com/downloads/installer/

3. **Code Editor (Recommended)**
   - VS Code: https://code.visualstudio.com/

### System Requirements
- Windows 10 or later
- At least 4GB RAM
- 2GB free disk space

---

## Database Setup

### Step 1: Start MySQL

**If using XAMPP:**
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for it to show "Running" status (green)

**If using standalone MySQL:**
1. Start MySQL from Windows Services
2. Or use MySQL Workbench to start the server

### Step 2: Access MySQL

**Option A: Using phpMyAdmin (XAMPP)**
1. In XAMPP Control Panel, click "Admin" next to MySQL
2. Browser opens to phpMyAdmin interface

**Option B: Using MySQL Command Line**
1. Open Command Prompt
2. Navigate to MySQL bin directory (e.g., `C:\xampp\mysql\bin`)
3. Connect to MySQL:
   ```cmd
   mysql -u root -p
   ```
   (Enter password if set, or just press Enter if no password)

### Step 3: Create Database

**In phpMyAdmin:**
1. Click "New" in the left sidebar
2. Database name: `hmhms_db`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"

**In MySQL Command Line:**
```sql
CREATE DATABASE hmhms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 4: Create Database User (Optional but Recommended)

For better security, create a dedicated user instead of using root:

```sql
CREATE USER 'hmhms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hmhms_db.* TO 'hmhms_user'@'localhost';
FLUSH PRIVILEGES;
```

**Note:** Remember these credentials - you'll need them for the backend configuration.

### Step 5: Import Database Schema

**Option A: Using phpMyAdmin**
1. Select the `hmhms_db` database from the left sidebar
2. Click the "Import" tab
3. Click "Choose File"
4. Navigate to `backend/mysql-schema.sql`
5. Click "Go" at the bottom
6. Wait for "Import has been successfully finished" message

**Option B: Using MySQL Command Line**
```cmd
cd C:\path\to\HMHMS
mysql -u root -p hmhms_db < backend\mysql-schema.sql
```

### Step 6: Verify Database Setup

Check that tables were created successfully:

**In phpMyAdmin:**
- Select `hmhms_db` database
- You should see multiple tables: users, monitors, check_logs, notifications, teams, etc.

**In MySQL Command Line:**
```sql
USE hmhms_db;
SHOW TABLES;
```

You should see tables like:
- users
- monitors
- check_logs
- monitor_tags
- monitor_dependencies
- notifications
- user_notifications
- teams
- team_members
- shared_monitors

---

## Backend Setup

### Step 1: Navigate to Backend Directory

Open Command Prompt and navigate to the project:

```cmd
cd C:\Users\Centific\Documents\GitHub\HMHMS\backend
```

### Step 2: Install Dependencies

```cmd
npm install
```

This will install all required packages (Express, TypeORM, JWT, etc.). This may take 2-5 minutes.

**Expected output:** Should complete without errors. You may see some warnings (these are usually safe to ignore).

### Step 3: Create Environment File

Copy the example environment file:

```cmd
copy example.env .env
```

### Step 4: Configure Environment Variables

Open `backend\.env` in your text editor and configure the following:

```env
# ======================
# Database Configuration
# ======================
DB_HOST=localhost
DB_PORT=3306
DB_USER=hmhms_user          # or 'root' if you didn't create a user
DB_PASS=your_secure_password # or leave blank if using root with no password
DB_NAME=hmhms_db

# ======================
# Application Configuration
# ======================
PORT=3001

# JWT secret - generate a random string (important for security!)
JWT_SECRET=generate_a_long_random_string_here_min_32_chars

# CORS origins - frontend URL
CORS_ORIGINS=http://localhost:5173

# Frontend URL (for OAuth redirects and email links)
FRONTEND_URL=http://localhost:5173

# ======================
# Worker Configuration
# ======================
CHECK_INTERVAL_MS=5000
MAX_CONCURRENT_CHECKS=10

# ======================
# Log Retention Policy
# ======================
LOG_RETENTION_DAYS=7
CLEANUP_BATCH_SIZE=1000
```

**Important Configuration Notes:**

1. **DB_USER and DB_PASS:** Use the credentials from Database Setup Step 4
   - If using root with no password, leave `DB_PASS=` blank

2. **JWT_SECRET:** Generate a secure random string
   - **Quick method:** Open Node.js and run:
     ```cmd
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy the output and paste it as your JWT_SECRET

3. **PORT:** Default is 3001 (make sure this port is not in use)

### Step 5: Verify Backend Configuration

You can check if your configuration is correct by trying to start the backend:

```cmd
npm run dev
```

**Expected output:**
```
Server running on port 3001
Database connected
```

If you see these messages, configuration is correct! Press `Ctrl+C` to stop the server for now.

**If you see errors:**
- Database connection errors → Check DB credentials in .env
- Port already in use → Change PORT in .env
- Module not found → Run `npm install` again

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

Open a new Command Prompt window:

```cmd
cd C:\Users\Centific\Documents\GitHub\HMHMS\frontend
```

### Step 2: Install Dependencies

```cmd
npm install
```

This will install Vue 3, Vite, Tailwind CSS, and other frontend dependencies. This may take 2-5 minutes.

### Step 3: Create Frontend Environment File

Create a new file called `.env.local` in the frontend directory:

```cmd
echo VITE_API_URL=http://localhost:3001/api > .env.local
```

**Or manually create** `frontend\.env.local` with this content:
```
VITE_API_URL=http://localhost:3001/api
```

**Important:** The port (3001) should match the backend PORT in `backend\.env`

### Step 4: Verify Frontend Configuration

Test if the frontend can start:

```cmd
npm run dev
```

**Expected output:**
```
VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

If you see this, the frontend is configured correctly! Press `Ctrl+C` to stop it for now.

---

## Running the Application

You have two options to run the application:

### Option 1: One-Click Start (Recommended for Development)

From the project root directory, simply run:

```cmd
start-dev.bat
```

**Or in VS Code:** Press `F5` to run start-dev.bat

This will automatically open three Command Prompt windows:
1. **Backend API Server** (port 3001)
2. **Background Worker** (handles health checks)
3. **Frontend Dev Server** (port 5173)

Wait about 10-15 seconds for all services to start.

### Option 2: Manual Start (Advanced)

If you prefer to start each service separately:

**Terminal 1 - Backend API:**
```cmd
cd C:\Users\Centific\Documents\GitHub\HMHMS\backend
npm run dev
```

**Terminal 2 - Background Worker:**
```cmd
cd C:\Users\Centific\Documents\GitHub\HMHMS\backend
npm run worker
```

**Terminal 3 - Frontend:**
```cmd
cd C:\Users\Centific\Documents\GitHub\HMHMS\frontend
npm run dev
```

### What Each Service Does

1. **Backend API (port 3001)**
   - Handles all API requests
   - Manages authentication
   - Stores/retrieves data from database
   - Provides SSE (Server-Sent Events) for real-time updates

2. **Background Worker**
   - Performs scheduled health checks
   - Monitors website/API availability
   - Updates check logs in database
   - Runs independently from the API

3. **Frontend (port 5173)**
   - Vue 3 web interface
   - User dashboard
   - Monitor management
   - Real-time status updates

---

## Verification & Testing

### Step 1: Check Backend Health

Open your browser and navigate to:
```
http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok"
}
```

If you see this, the backend is running correctly!

### Step 2: Open the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the HMHMS login page.

### Step 3: Create Your First User

1. Click "Sign Up" or "Register"
2. Fill in the registration form:
   - Username: your choice
   - Email: your email
   - Password: choose a secure password
3. Click "Register"
4. Verify your email.

### Step 4: Create Your First Monitor

1. After logging in, you'll see the dashboard
2. Click "Add Monitor"
3. Fill in the form: 
   - **Name:** "Google"
   - **Type:** "HTTP/HTTPS"
   - **Target:** "https://www.google.com"

   - **Name:** "Cloudflare DNS"
   - **Type:** "PING"
   - **Target:** "1.1.1.1"
4. Click "Save" or "Create"

### Step 5: Watch Real-Time Updates

1. Once the monitor is created, the background worker will start checking it
2. Within 5-10 seconds, you should see the first check result
3. Status indicators will update in real-time (green for up, red for down)
4. Response time will be displayed

### Step 6: Verify Check Logs

1. Click on the monitor you just created
2. You should see a list of check logs showing:
   - Timestamp
   - Status code
   - Response time
   - Up/Down indicator

**If you see check logs updating automatically, congratulations! 🎉 Everything is working correctly!**

---

## Common Issues & Troubleshooting

### Issue 1: "Port 3001 is already in use"

**Solution:**
1. Option A: Change the backend port
   - Edit `backend\.env`
   - Change `PORT=3001` to `PORT=3002` (or any available port)
   - Edit `frontend\.env.local`
   - Change to `VITE_API_URL=http://localhost:3002/api`

2. Option B: Find and stop the process using port 3001
   ```cmd
   netstat -ano | findstr :3001
   taskkill /PID <process_id> /F
   ```

### Issue 2: "Port 5173 is already in use"

**Solution:**
1. Stop any other Vite/Vue processes
2. Or change the Vite port in `frontend\vite.config.ts`:
   ```typescript
   export default defineConfig({
     server: {
       port: 5174 // Change to a different port
     }
   })
   ```

### Issue 3: "Cannot connect to database"

**Symptoms:** Backend shows database connection error

**Solutions:**
1. Verify MySQL is running (check XAMPP Control Panel)
2. Check database credentials in `backend\.env`
3. Test database connection manually:
   ```cmd
   mysql -u hmhms_user -p hmhms_db
   ```
4. Ensure database `hmhms_db` exists:
   ```sql
   SHOW DATABASES;
   ```

### Issue 4: "CORS Error" in Browser Console

**Symptoms:** Frontend shows CORS errors when making API requests

**Solution:**
1. Check `backend\.env` has correct CORS_ORIGINS:
   ```env
   CORS_ORIGINS=http://localhost:5173
   ```
2. Restart the backend server after changing .env

### Issue 5: Worker Not Performing Checks

**Symptoms:** Monitors show "Pending" or no check logs appear

**Solutions:**
1. Make sure the worker process is running:
   - Check the "worker" terminal window
   - Should see "Worker started" message
2. Check worker logs for errors
3. Verify CHECK_INTERVAL_MS in `backend\.env` (should be 5000 or higher)
4. Restart the worker:
   ```cmd
   cd backend
   npm run worker
   ```

### Issue 6: "Module not found" Errors

**Solution:**
```cmd
# In backend directory
cd backend
rm -rf node_modules
npm install

# In frontend directory
cd ..\frontend
rm -rf node_modules
npm install
```

### Issue 7: MySQL Port Conflict (3306 in use)

**Solution:**
1. Change MySQL port in XAMPP config
2. Update `backend\.env`:
   ```env
   DB_PORT=3307  # or whatever port you chose
   ```

### Issue 8: Frontend Shows Blank Page

**Solutions:**
1. Check browser console for errors (F12)
2. Verify frontend .env.local file exists and is correct
3. Restart the frontend dev server
4. Clear browser cache and refresh

---

## Optional Configuration

### Email Notifications (Optional)

To enable email notifications for monitor status changes:

1. Edit `backend\.env` and add SMTP configuration:
   ```env
   # Email Configuration (Gmail example)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

2. For Gmail:
   - Enable 2-factor authentication
   - Generate an "App Password"
   - Use the app password as SMTP_PASS

### Microsoft OAuth (Optional)

To enable Microsoft SSO:

1. Follow the guide in `docs/MICROSOFT-SSO-SETUP.md`
2. Configure Azure AD app registration
3. Add credentials to `backend\.env`:
   ```env
   MICROSOFT_CLIENT_ID=your-client-id
   MICROSOFT_CLIENT_SECRET=your-client-secret
   MICROSOFT_TENANT_ID=common
   ```

### Log Retention Configuration

Customize how long check logs are kept:

Edit `backend\.env`:
```env
# Keep logs for 30 days instead of 7
LOG_RETENTION_DAYS=30

# Run cleanup at 3 AM instead of 2 AM
RETENTION_JOB_HOUR=3
```

---

## Next Steps

### Learning the Application

1. **Read the Documentation:**
   - `docs/00-PROJECT-OVERVIEW.md` - Project overview
   - `docs/05-HEALTH-CHECK-SYSTEM.md` - How health checks work
   - `docs/09-API-DOCUMENTATION.md` - API reference

2. **Explore Features:**
   - Create multiple monitors
   - Set up email notifications
   - Create teams and share monitors
   - Bulk import monitors from CSV/JSON
   - Configure monitor dependencies
   - Add custom headers to requests

3. **Try Advanced Features:**
   - Test POST/PUT requests with body data
   - Set expected response status codes (e.g., 201, 204)
   - Configure retry logic for checks
   - Set up monitor tags for organization

### Development Workflow

**Normal Development:**
1. Run `start-dev.bat` in the morning
2. Code changes in frontend auto-reload (Vite HMR)
3. Backend changes require restart (Ctrl+C and `npm run dev`)
4. Worker changes require restart

**Making Changes:**
- Frontend: Changes auto-reload in browser
- Backend API: Stop server (Ctrl+C), restart with `npm run dev`
- Worker: Stop worker (Ctrl+C), restart with `npm run worker`
- Database: Use phpMyAdmin or MySQL command line

**Useful Commands:**

```cmd
# Backend
npm run dev              # Start API server
npm run worker           # Start background worker
npm run cleanup          # Run log cleanup manually
npm run cleanup:force    # Force cleanup (1 day retention)
npm run diagnose-email   # Test email configuration
npm run migration:run    # Run database migrations

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
npm run format           # Format code with Prettier
```

### Stopping the Application

To stop all services:

1. In each terminal window (API, Worker, Frontend):
   - Press `Ctrl+C`
   - Confirm with `Y` if asked

2. To stop MySQL (XAMPP):
   - Open XAMPP Control Panel
   - Click "Stop" next to MySQL

### Production Deployment

When ready to deploy to production:
1. Read `docs/08-PRODUCTION-DEPLOYMENT.md`
2. Set up proper environment variables
3. Use a process manager (PM2)
4. Set up reverse proxy (nginx)
5. Configure SSL certificates
6. Set up database backups

---

## Quick Reference

### Service URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health
- phpMyAdmin: http://localhost/phpmyadmin (if using XAMPP)

### Default Credentials
- Database: `hmhms_user` / your chosen password
- First app user: Created during registration

### Important Files
- Backend config: `backend\.env`
- Frontend config: `frontend\.env.local`
- Database schema: `backend\mysql-schema.sql`
- Startup script: `start-dev.bat`

### Getting Help
- Check the `docs/` folder for detailed documentation
- Look at error messages in terminal windows
- Check browser console (F12) for frontend errors
- Review this troubleshooting section

---

## Congratulations! 🎉

You've successfully set up and run the HMHMS application! You now have:

✅ MySQL database running with schema
✅ Backend API server responding to requests
✅ Background worker performing health checks
✅ Frontend web application with real-time updates
✅ A working monitor tracking website health

Happy monitoring! 🚀
