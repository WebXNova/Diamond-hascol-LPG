# Admin Bootstrap Mechanism

## Overview

A secure, one-time admin bootstrap mechanism that automatically creates the first admin user on server startup if no admin exists.

## How It Works

1. **Runs at Server Startup**: The bootstrap logic executes once when the server starts, after database connection is established and schema is synced.

2. **Checks for Existing Admins**: If any admin already exists in the database, bootstrap is skipped permanently.

3. **Reads from Environment Variables**: 
   - `ADMIN_EMAIL` - Email address for the admin
   - `ADMIN_PASSWORD` - Password (will be hashed automatically)

4. **Creates Admin if Needed**: If no admin exists and env variables are provided, creates one admin with:
   - Email from `ADMIN_EMAIL`
   - Hashed password from `ADMIN_PASSWORD` (using bcrypt)
   - Name extracted from email (username part)
   - `isActive = true`
   - All other defaults from Admin model

5. **Graceful Handling**: If env variables are missing, logs a clear warning but does NOT crash the server.

## Security Features

✅ **One-Time Only**: Only creates admin if none exists. After first admin is created, bootstrap is permanently disabled.

✅ **No Public API**: Bootstrap logic only runs at server startup. No routes or endpoints expose admin creation.

✅ **Password Hashing**: Passwords are hashed with bcrypt (12 rounds) before storage. Never stored in plain text.

✅ **No Password Logging**: Passwords are never logged to console or files.

✅ **Validation**: Email format and password length (min 8 chars) are validated before creation.

✅ **Non-Blocking**: Missing env variables don't crash the server. Admin can be created manually via script.

## Implementation Details

### Files Modified

1. **`backend/src/utils/bootstrap.js`** (NEW)
   - Contains `bootstrapAdmin()` function
   - Handles all bootstrap logic
   - Validates credentials
   - Creates admin if conditions are met

2. **`backend/server.js`**
   - Imports Admin model
   - Calls `bootstrapAdmin()` after database sync
   - Runs before server starts listening

### Code Flow

```
Server Startup
    ↓
Database Connection
    ↓
Schema Sync
    ↓
Initialize Products
    ↓
Bootstrap Admin ← Checks if admin exists
    ↓
    ├─→ Admin exists? → Skip (log message)
    │
    ├─→ No admin + Env vars set? → Create admin (hash password)
    │
    └─→ No admin + No env vars? → Log warning, continue
    ↓
Start Server
```

## Usage

### First-Time Setup

1. Add to `backend/.env`:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
```

2. Start server:
```bash
cd backend
npm start
```

3. Server will automatically create the first admin on startup.

4. **Important**: Remove `ADMIN_PASSWORD` from `.env` after first login for security.

### Subsequent Starts

- If admin already exists, bootstrap is skipped automatically.
- No need to remove env variables (they're ignored after first admin exists).

### Manual Alternative

If you prefer not to use bootstrap, create admin manually:
```bash
node scripts/create-admin.js admin@example.com SecurePassword123 "Admin Name"
```

## Example Output

### First Startup (No Admin Exists, Env Vars Set)
```
✅ Database connection established successfully
✅ Database schema synced with models
✅ Created Domestic product in database
✅ Created Commercial product in database
✅ Admin bootstrap: Created first admin successfully
   Email: admin@example.com
   Name: admin
   ID: 1
🔒 Security: Password has been hashed and stored securely
⚠️  Important: Remove ADMIN_PASSWORD from .env after first login for security
🚀 Server is running on port 5000
```

### Subsequent Startup (Admin Exists)
```
✅ Database connection established successfully
✅ Database schema synced with models
✅ Admin bootstrap: 1 admin(s) already exist. Skipping auto-creation.
🚀 Server is running on port 5000
```

### No Env Vars (Warning Only)
```
✅ Database connection established successfully
✅ Database schema synced with models
⚠️  Admin bootstrap: ADMIN_EMAIL and/or ADMIN_PASSWORD not set in environment variables.
💡 To create the first admin automatically, set:
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=YourSecurePassword123
💡 Alternatively, use: node scripts/create-admin.js <email> <password> [name]
🚀 Server is running on port 5000
```

## Security Considerations

1. **Environment Variables**: Store `.env` securely. Never commit it to version control.

2. **Password Removal**: After first login, remove `ADMIN_PASSWORD` from `.env` to prevent accidental exposure.

3. **Production**: In production, use secure secret management (e.g., AWS Secrets Manager, HashiCorp Vault) instead of `.env` files.

4. **One-Time Only**: Bootstrap only works once. After first admin exists, it cannot be triggered again, even if env vars are present.

5. **No API Exposure**: There is no public endpoint to create admins. Bootstrap is server-startup only.

## Troubleshooting

### Admin Not Created

**Check:**
- Are `ADMIN_EMAIL` and `ADMIN_PASSWORD` set in `.env`?
- Is email format valid?
- Is password at least 8 characters?
- Check server logs for error messages

**Solution:**
- Fix env variables and restart server, OR
- Use manual script: `node scripts/create-admin.js <email> <password>`

### Bootstrap Runs Every Time

**This should NOT happen.** Bootstrap only runs if no admin exists.

**Check:**
- Verify admin exists in database: `SELECT * FROM admins;`
- Check server logs - should say "admin(s) already exist"

### Password Not Working

**Check:**
- Did you remove `ADMIN_PASSWORD` from `.env` after first creation?
- Are you using the exact password from `ADMIN_PASSWORD`?
- Check if admin was created successfully (check logs)

**Solution:**
- Use manual script to reset password: `node scripts/create-admin.js <email> <newpassword>`
- Or update password hash directly in database (not recommended)

## Code Location

- **Bootstrap Logic**: `backend/src/utils/bootstrap.js`
- **Server Integration**: `backend/server.js` (line ~103)
- **Admin Model**: `backend/src/models/admin.model.js`
- **Password Utils**: `backend/src/utils/password.js`

