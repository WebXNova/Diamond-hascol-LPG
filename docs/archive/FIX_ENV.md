# Fix .env File for Cloudinary

## Root Cause

Your `.env` file has **spaces around `=` signs**, which causes dotenv to load variables incorrectly:

**Current (BROKEN):**
```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY =your_api_key
CLOUDINARY_API_SECRET = CLOUDINARY_URL=cloudinary://api_key:**********@cloud_name
```

**Problem:**
- Spaces around `=` make dotenv create variables with wrong names or values
- `CLOUDINARY_API_SECRET` has malformed value (includes `CLOUDINARY_URL=...`)
- This causes `process.env.CLOUDINARY_API_SECRET` to be `undefined` at runtime

## Fix Required

**Edit `backend/.env` file and change to (NO SPACES around `=`):**

```
PORT=5000
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Critical:**
- Remove ALL spaces around `=` signs
- `CLOUDINARY_API_SECRET` should ONLY contain the secret value (not `CLOUDINARY_URL=...`)
- Replace `your_api_secret` with your actual Cloudinary API secret from the dashboard

## After Fix

1. **Restart backend server** (env vars only load on startup)
2. Check backend logs - you should see:
   ```
   ✅ Cloudinary configured successfully
      Cloud Name: your_cloud_name
      API Key: xxxxx...
   ```
3. If you see `❌ Cloudinary credentials not configured`, the .env file still has issues

## Security Note

⚠️ **IMPORTANT**: The Cloudinary API secret shown above is exposed. After fixing, consider:
1. Rotating the secret in Cloudinary dashboard
2. Updating `.env` with new secret
3. Never commit `.env` to git

