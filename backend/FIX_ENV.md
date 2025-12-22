# Fix .env File for Cloudinary

## Root Cause

Your `.env` file has **spaces around `=` signs**, which causes dotenv to load variables incorrectly:

**Current (BROKEN):**
```
CLOUDINARY_CLOUD_NAME = duxiuthsj
CLOUDINARY_API_KEY =571259345963511 
CLOUDINARY_API_SECRET = CLOUDINARY_URL=cloudinary://571259345963511:**********@duxiuthsj
```

**Problem:**
- Spaces around `=` make dotenv create variables with wrong names or values
- `CLOUDINARY_API_SECRET` has malformed value (includes `CLOUDINARY_URL=...`)
- This causes `process.env.CLOUDINARY_API_SECRET` to be `undefined` at runtime

## Fix Required

**Edit `backend/.env` file and change to (NO SPACES around `=`):**

```
PORT=5000
DB_NAME=diamond_hascol_LPG_Agency
DB_USER=root
DB_PASSWORD=zainzain
JWT_SECRET=hascol_secret_key
CLOUDINARY_CLOUD_NAME=duxiuthsj
CLOUDINARY_API_KEY=571259345963511
CLOUDINARY_API_SECRET=pc1wBqI9UuFNjMFf5StgLulUaF4
```

**Critical:**
- Remove ALL spaces around `=` signs
- `CLOUDINARY_API_SECRET` should ONLY contain the secret value (not `CLOUDINARY_URL=...`)
- The secret value from your current file appears to be: `pc1wBqI9UuFNjMFf5StgLulUaF4`

## After Fix

1. **Restart backend server** (env vars only load on startup)
2. Check backend logs - you should see:
   ```
   ✅ Cloudinary configured successfully
      Cloud Name: duxiuthsj
      API Key: 57125...
   ```
3. If you see `❌ Cloudinary credentials not configured`, the .env file still has issues

## Security Note

⚠️ **IMPORTANT**: The Cloudinary API secret shown above is exposed. After fixing, consider:
1. Rotating the secret in Cloudinary dashboard
2. Updating `.env` with new secret
3. Never commit `.env` to git

