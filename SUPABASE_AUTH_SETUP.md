# Supabase Auth Integration — Setup Guide

This document explains how to configure Google OAuth, email verification, and password reset using Supabase Auth for the Kabura Adventures platform.

---

## Prerequisites

- A Supabase project (the same one used for the database)
- Access to the Supabase project dashboard

---

## 1. Required Environment Variables

Add these to your `.env` file (or Render environment variables):

```bash
# Supabase Auth — find these in Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...         # anon/public key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     # service_role key (secret!)
```

Where to find them:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** → `SUPABASE_URL`
5. Copy the **anon public** key → `SUPABASE_ANON_KEY`
6. Copy the **service_role** key → `SUPABASE_SERVICE_KEY`

> **⚠️ Security:** Never expose `SUPABASE_SERVICE_KEY` to the client. It has admin privileges.
> The `SUPABASE_ANON_KEY` is safe to use on the frontend (it is protected by Row Level Security).

---

## 2. Configure Google OAuth in Supabase

### Step 1: Create a Google OAuth Credential

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If not already configured, set up the **OAuth consent screen**:
   - **User Type**: External (or Internal if using Google Workspace)
   - Fill in the required fields (App name, User support email, Developer contact info)
   - Add the following **Authorized redirect URIs** (under "Authorized redirect URIs"):
     - `https://<your-project>.supabase.co/auth/v1/callback`
     - For local development, also add: `http://localhost:54321/auth/v1/callback`
6. For **Application type**, select **Web application**
7. Under **Authorized redirect URIs**, add:
   - `https://<your-project>.supabase.co/auth/v1/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret** that appear

### Step 2: Enable Google Provider in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click the **Google** toggle to enable it
5. Paste the **Client ID** and **Client Secret** from Google Cloud Console
6. Click **Save**

### Step 3: Configure Site URL and Redirect URLs in Supabase

1. In **Authentication** → **URL Configuration**:
   - **Site URL**: `https://your-frontend-domain.vercel.app` (or `http://localhost:5500` for local dev)
   - **Redirect URLs**: Add `https://your-frontend-domain.vercel.app/login.html`
   - For local dev, also add: `http://localhost:5500/login.html`

---

## 3. Email Verification & Password Reset

### Email Templates & OTP Configuration

Supabase provides default email templates. To receive a **6-digit verification code** by email (instead of a magic link), you have **two options**:

#### Option A: Enable Email OTP (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **Email OTP**
3. Toggle **Enable Email OTP** to ON
4. Save changes

This tells Supabase to send a 6-digit numeric code instead of a magic link in OTP emails.

#### Option B: Customize Magic Link Template

1. Go to **Authentication** → **Email Templates** → **Magic Link**
2. Replace `{{ .ConfirmationURL }}` with `{{ .Token }}` in the template body
3. Click **Save**

The `{{ .Token }}` variable contains the 6-digit OTP code that the user can enter on the verification page.

---

### Optional: Custom SMTP for Reliable Email Delivery

For production, configure a custom SMTP provider to ensure reliable email delivery:

1. **In Supabase Dashboard**: Authentication → Settings → SMTP Settings
2. OR configure the following environment variables for the backend to send emails directly:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_SERVER` | SMTP server hostname | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USERNAME` | SMTP username | `apikey` |
| `SMTP_PASSWORD` | SMTP password or API key | `SG.xxxxx` |
| `SMTP_FROM` | From email address | `noreply@kaburaadventures.com` |
| `SMTP_USE_TLS` | Use TLS (default: true) | `true` |

When SMTP is configured, the backend sends the 6-digit OTP directly. If SMTP is not configured, it falls back to Supabase's built-in email service (which must have Email OTP enabled for the 6-digit code to appear in the email).

---

## 4. How It Works — Architecture

```
User clicks "Continue with Google"
       │
       ▼
Frontend calls supabase.auth.signInWithOAuth({ provider: 'google' })
       │
       ▼
Browser redirects to Google consent screen
       │
       ▼
User authorizes → Google redirects to Supabase callback
       │
       ▼
Supabase redirects to login.html#access_token=...&...
       │
       ▼
Supabase JS client detects SIGNED_IN event
       │
       ▼
Frontend calls POST /api/auth/supabase/exchange
       │
       ▼
Backend verifies token via Supabase admin API
       │
       ▼
Backend finds/creates local user in Flask DB
       │
       ▼
Backend returns Flask JWT (same format as existing auth)
       │
       ▼
Frontend stores Flask JWT in localStorage via api.setToken()
       │
       ▼
User is redirected to homepage — updateAuthUI() picks up the token
```

### Key Design Decisions

1. **Existing auth is untouched** — The Flask JWT system (`/api/auth/login`, `/api/auth/register`, `token_required`, `admin_required`) remains fully functional.
2. **Supabase sessions are exchanged for Flask JWTs** — The backend issues a Flask JWT so that all existing API middleware continues to work.
3. **No duplicate accounts** — The exchange endpoint matches Supabase users to local users by email. If no local user exists, one is created.
4. **Password reset uses Supabase** — Supabase handles sending the reset email. The password is updated in both Supabase Auth and can be synced to the local DB.

---

## 5. New Files Created

| File | Purpose |
|------|---------|
| `backend/services/supabase_client.py` | Supabase admin client: token verification, user creation |
| `backend/routes/supabase_auth.py` | API endpoints: `/api/auth/supabase/config`, `/api/auth/supabase/exchange` |
| `frontend/assets/js/supabase-client.js` | Frontend Supabase client: OAuth, password reset, session exchange |

### Modified Files

| File | Changes |
|------|---------|
| `backend/config.py` | Added `SUPABASE_ANON_KEY` config variable |
| `backend/app.py` | Registered `supabase_auth_bp` blueprint |
| `frontend/login.html` | Added Supabase JS CDN, supabase-client.js, functional Google button, forgot password link |
| `frontend/signup.html` | Added Supabase JS CDN, supabase-client.js, functional Google button |
| `.env.example` | Documented new Supabase Auth environment variables |

---

## 6. Testing Locally

1. **Set up environment variables** in `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

2. **Configure Supabase redirect URLs**:
   - Site URL: `http://localhost:5500`
   - Redirect URLs: `http://localhost:5500/login.html`

3. **Start the frontend** (e.g., with Live Server on port 5500)

4. **Start the backend**:
   ```bash
   python run.py
   ```

5. **Test the flows**:
   - Click "Continue with Google" → should redirect to Google
   - After authorization, should return to login.html and redirect to homepage
   - Test "Forgot Password?" → should send a reset email

---

## 7. Potential Issues & Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Google OAuth redirects to wrong page | Redirect URL mismatch in Supabase config | Check Authentication → URL Configuration in Supabase dashboard |
| "Authentication service unavailable" toast | Backend `/api/auth/supabase/config` returns 500 | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars |
| Token exchange fails with 401 | Invalid or expired Supabase token | The user may need to re-authenticate |
| "Supabase not configured" on config endpoint | Missing env vars | Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set |
| Password reset email not sent | User doesn't exist in Supabase Auth | Users registered via Flask's `/api/auth/register` don't automatically exist in Supabase Auth. Password reset only works for users who signed in with Google at least once. |
| CORS error on exchange endpoint | Backend CORS not configured for frontend origin | The existing `CORS(app)` in `app.py` allows all origins by default |

---

## 8. Adding More OAuth Providers

To add additional OAuth providers (Apple, Facebook, GitHub, etc.):

1. **In Supabase Dashboard**: Authentication → Providers → Enable the provider
2. **In frontend (`supabase-client.js`)**: Add a new function similar to `signInWithGoogle()` but with the appropriate provider name
3. **In HTML**: Add a button that calls the new function

Example for GitHub:
```javascript
async function signInWithGitHub() {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin + '/login.html' },
    });
}
```
