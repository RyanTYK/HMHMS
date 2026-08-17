# Microsoft SSO Setup Guide

## Overview
This guide will walk you through setting up Microsoft Single Sign-On (SSO) for HMHMS using Azure Active Directory.

---

## Phase 1: Azure AD App Registration

### Step 1: Access Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Microsoft account (organization or personal)
3. Navigate to **Azure Active Directory**

### Step 2: Register Application
1. In the left sidebar, click **App registrations**
2. Click **+ New registration**
3. Fill in the details:
   - **Name**: `HMHMS` (or your preferred app name)
   - **Supported account types**: 
     - Choose "Accounts in any organizational directory and personal Microsoft accounts" for public use
     - OR choose "Accounts in this organizational directory only" for organization-only access
   - **Redirect URI**: 
     - Platform: `Web`
     - URL: `http://localhost:3001/api/auth/microsoft/callback` (for development)
4. Click **Register**

### Step 3: Get Application Credentials
After registration, you'll see the app overview page:

1. **Copy Application (client) ID**
   - This is your `MICROSOFT_CLIENT_ID`
   - Example: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`

2. **Copy Directory (tenant) ID**
   - This is your `MICROSOFT_TENANT_ID`
   - Example: `x9y8z7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4`
   - OR use `common` to allow any Microsoft account

### Step 4: Create Client Secret
1. In the left sidebar, click **Certificates & secrets**
2. Under **Client secrets**, click **+ New client secret**
3. Add a description: `HMHMS Backend Secret`
4. Choose expiration: `24 months` (recommended)
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately (it won't be shown again)
   - This is your `MICROSOFT_CLIENT_SECRET`
   - Example: `abc~123XYZ_456def~789GHI`

### Step 5: Configure API Permissions
1. In the left sidebar, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `User.Read` - Read user profile
   - `email` - View user's email address
   - `openid` - Sign users in
   - `profile` - View user's basic profile
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

### Step 6: Add Production Redirect URI (Later)
When deploying to production:
1. Go back to **Authentication** in the left sidebar
2. Under **Web** platform, click **Add URI**
3. Add: `https://yourdomain.com/api/auth/microsoft/callback`
4. Click **Save**

---

## Phase 2: Backend Configuration

### Step 1: Update Environment Variables
1. Open your `.env` file (or create from `example.env`)
2. Add/update these values:

```env
# Microsoft OAuth (Azure AD)
MICROSOFT_CLIENT_ID=your-client-id-from-azure
MICROSOFT_CLIENT_SECRET=your-client-secret-from-azure
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=http://localhost:3001/api/auth/microsoft/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173

# Ensure JWT secret is set
JWT_SECRET=your-secure-jwt-secret-key
```

### Step 2: Restart Backend Server
```bash
cd backend
npm run dev
```

---

## Phase 3: Frontend Configuration

### Step 1: Environment Variables (Optional)
If your backend is not on `http://localhost:3001`, create/update `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

---

## Testing the Integration

### Test 1: Microsoft SSO Login
1. Navigate to `http://localhost:5173/login`
2. Click **"Sign in with Microsoft"** button
3. You'll be redirected to Microsoft login page
4. Sign in with your Microsoft account
5. Grant permissions when prompted
6. You should be redirected back and logged in

### Test 2: Account Linking
1. Register a normal account with email/password
2. Logout
3. Sign in with Microsoft using the **same email**
4. The Microsoft account should auto-link to your existing account
5. You can now sign in with either method

### Test 3: OAuth-Only Account
1. Sign in with Microsoft using a **new email** (not registered before)
2. A new account should be created automatically
3. Try signing in with email/password - should show error directing to Microsoft login

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: Redirect URI in Azure doesn't match backend callback URL
- **Fix**: Ensure `MICROSOFT_CALLBACK_URL` exactly matches Azure redirect URI
- Azure: `http://localhost:3001/api/auth/microsoft/callback`
- .env: `MICROSOFT_CALLBACK_URL=http://localhost:3001/api/auth/microsoft/callback`

### Error: "invalid_client"
- **Cause**: Client ID or Secret is incorrect
- **Fix**: Double-check `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` in `.env`

### Error: "AADSTS50011: The reply URL specified in the request does not match"
- **Cause**: Missing redirect URI in Azure
- **Fix**: Add redirect URI in Azure Portal → App registrations → Authentication

### Backend shows "Failed to send verification email"
- **Expected**: OAuth users don't need email verification
- Microsoft accounts are automatically verified (`email_verified: true`)

### "This account uses microsoft sign-in" error
- **Expected behavior**: User created via Microsoft cannot use password login
- **Fix**: Use "Sign in with Microsoft" button instead

---

## Security Best Practices

1. **Protect Client Secret**: Never commit `.env` to version control
2. **Use HTTPS in Production**: Always use HTTPS for OAuth callbacks
3. **Rotate Secrets**: Rotate client secrets periodically (every 6-12 months)
4. **Limit Permissions**: Only request necessary Microsoft Graph permissions
5. **Validate Tokens**: Backend validates all JWT tokens (already implemented)
6. **CORS Configuration**: Ensure CORS only allows trusted origins

---

## Production Deployment Checklist

- [ ] Update `MICROSOFT_CALLBACK_URL` to production URL
- [ ] Add production redirect URI in Azure Portal
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS for all endpoints
- [ ] Rotate and secure client secret
- [ ] Test OAuth flow end-to-end in production
- [ ] Monitor Azure AD logs for errors
- [ ] Set up error alerts for failed authentications

---

## Architecture Overview

```
┌──────────┐         ┌──────────────┐         ┌─────────────┐
│  Browser │────────▶│   Frontend   │────────▶│   Backend   │
│          │         │ (Vue/Vite)   │         │  (Express)  │
└──────────┘         └──────────────┘         └─────────────┘
     │                      │                         │
     │                      │                         │
     ▼                      ▼                         ▼
┌──────────┐         ┌──────────────┐         ┌─────────────┐
│ Microsoft│◀────────│  Passport.js │────────▶│   Database  │
│   Azure  │         │   Strategy   │         │    MySQL    │
└──────────┘         └──────────────┘         └─────────────┘
```

### Flow:
1. User clicks "Sign in with Microsoft"
2. Frontend redirects to backend OAuth endpoint
3. Backend redirects to Microsoft login
4. User authenticates with Microsoft
5. Microsoft redirects back to backend callback
6. Backend validates, creates/links user, generates JWT
7. Backend redirects to frontend with JWT token
8. Frontend stores token and fetches user data
9. User is logged in

---

## API Endpoints

### OAuth Routes
- `GET /api/auth/microsoft` - Initiates Microsoft OAuth flow
- `GET /api/auth/microsoft/callback` - Handles Microsoft OAuth callback

### Existing Auth Routes
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - Email/password registration
- `GET /api/auth/me` - Get current user (requires JWT)

---

## Database Schema Changes

### New Columns in `users` table:
- `oauth_provider` VARCHAR(50) NULL - OAuth provider name ('microsoft', 'google', etc.)
- `oauth_id` VARCHAR(255) NULL - Unique ID from OAuth provider
- `avatar_url` VARCHAR(500) NULL - Profile picture URL from OAuth provider
- `password_hash` VARCHAR(128) NULL - Now nullable for OAuth-only users

### Indexes:
- `idx_users_oauth_provider` - Fast lookup by provider
- `idx_users_oauth_id` - Fast lookup by OAuth ID
- `unique_oauth_provider_id` - Ensures one account per OAuth provider+ID

---

## Support

For issues or questions:
1. Check Azure AD logs for authentication errors
2. Check backend console for detailed error messages
3. Verify environment variables are set correctly
4. Ensure database migration completed successfully

---

## Next Steps

After successful Microsoft SSO setup, consider:
1. Add Google OAuth support (similar implementation)
2. Implement refresh token mechanism
3. Add profile picture display in UI
4. Add ability to unlink OAuth accounts
5. Add OAuth provider selection in settings
