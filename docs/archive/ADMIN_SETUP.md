# Admin Panel Security Setup Guide

## Overview

The admin panel is now fully secured with JWT authentication, rate limiting, audit logging, and protected routes.

## Initial Setup

### 1. Create Admin User

You have **two options** to create the first admin user:

#### Option A: Automatic Bootstrap (Recommended for First Setup)

The server will automatically create the first admin on startup if no admin exists. Simply add these to your `.env` file:

```env
ADMIN_EMAIL=admin@diamondhascol.com
ADMIN_PASSWORD=YourSecurePassword123
```

**How it works:**
- On first server startup, if no admin exists, it will create one using these credentials
- Password is automatically hashed with bcrypt
- After the first admin is created, bootstrap is permanently disabled
- If env variables are missing, server will log a warning but continue (you can use Option B)

**Security Note:** Remove `ADMIN_PASSWORD` from `.env` after first login for security.

#### Option B: Manual Script

Alternatively, create an admin manually using the script:

```bash
cd backend
node scripts/create-admin.js <email> <password> [name]
```

**Example:**
```bash
node scripts/create-admin.js admin@diamondhascol.com SecurePass123 "Admin Name"
```

**Requirements:**
- Email must be valid format
- Password must be at least 8 characters
- Name is optional (defaults to email username)

### 2. Environment Variables

Ensure your `.env` file in `backend/` contains:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=diamond_hascol_lpg
DB_USER=root
DB_PASSWORD=your_password

# JWT Secret (REQUIRED in production)
JWT_SECRET=your-super-secret-key-at-least-16-characters-long
JWT_EXPIRES_IN=24h

# Admin Bootstrap (Optional - only for first admin creation)
# Remove ADMIN_PASSWORD after first login for security
ADMIN_EMAIL=admin@diamondhascol.com
ADMIN_PASSWORD=YourSecurePassword123

# Server
PORT=5000
NODE_ENV=development

# Cloudinary (for product images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS - restrict in production)
FRONTEND_URL=http://localhost:5173
ADMIN_CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

Run the schema to create all tables including `admins`:

```bash
mysql -u root -p diamond_hascol_lpg < database/schema.sql
```

Or use Sequelize auto-sync (development only):
- The server will create tables automatically on first run

## Security Features Implemented

### Backend Security

✅ **JWT Authentication**
- All admin routes require valid JWT token
- Tokens expire after 24 hours (configurable)
- Token blacklist for logout/invalidation

✅ **Rate Limiting**
- Login endpoint: 5 attempts per 15 minutes per IP
- Prevents brute-force attacks

✅ **Route Protection**
- All `/api/admin/*` routes (except `/api/admin/auth/login`) require authentication
- Middleware checks token validity and admin account status

✅ **CORS Restrictions**
- Admin APIs restricted to frontend origin (configurable)
- Public APIs allow all origins

✅ **Audit Logging**
- All sensitive admin actions are logged:
  - Order status updates
  - Order deletions
  - Coupon create/update/delete
  - Product updates
  - Message deletions
- Logs include: admin ID, action, resource, IP, timestamp

✅ **Input Validation**
- Email format validation
- Password strength requirements
- SQL injection prevention (Sequelize parameterized queries)
- XSS prevention (input sanitization)

✅ **Account Security**
- Admin accounts can be deactivated (`isActive` flag)
- Last login timestamp tracking
- Password hashing with bcrypt (12 rounds)

### Frontend Security

✅ **Real Backend Authentication**
- Login calls `/api/admin/auth/login` endpoint
- Stores JWT token securely in localStorage
- Token verified on page load

✅ **Automatic Token Injection**
- All admin API calls include `Authorization: Bearer <token>` header
- Automatic redirect to login if token invalid/expired

✅ **Route Protection**
- Client-side route protection (backup to backend)
- Token verification on page load
- Automatic logout on 401 responses

✅ **Secure Logout**
- Calls backend `/api/admin/auth/logout` to invalidate token
- Clears local session
- Redirects to login

## API Endpoints

### Public (No Auth Required)
- `POST /api/admin/auth/login` - Admin login (rate limited)

### Protected (Require JWT Token)
- `GET /api/admin/auth/verify` - Verify token
- `POST /api/admin/auth/logout` - Logout (invalidate token)
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status
- `DELETE /api/admin/orders/:id` - Delete order
- `GET /api/admin/coupons` - List coupons
- `POST /api/admin/coupons` - Create coupon
- `PATCH /api/admin/coupons/:code` - Update coupon
- `DELETE /api/admin/coupons/:code` - Delete coupon
- `GET /api/admin/messages` - List messages
- `PATCH /api/admin/messages/:id/read` - Mark message as read
- `DELETE /api/admin/messages/:id` - Delete message
- `GET /api/admin/products` - List products
- `PATCH /api/admin/products/:id` - Update product

## Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### "Authentication required" errors
- Check that admin user exists in database
- Verify JWT_SECRET is set in .env
- Ensure token is being sent in Authorization header

### "Too many login attempts" error
- Wait 15 minutes or restart server (rate limit resets)
- Check if multiple IPs are trying to login

### Token expires immediately
- Check JWT_EXPIRES_IN in .env
- Verify system clock is correct

### Admin routes return 401
- Verify token is valid (not expired)
- Check admin account is active (`isActive = true`)
- Ensure token is in `Authorization: Bearer <token>` format

## Production Checklist

- [ ] Set strong `JWT_SECRET` (at least 32 characters, random)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` and `ADMIN_CORS_ORIGIN` to your domain
- [ ] Remove demo credentials from any documentation
- [ ] Set up proper logging service (replace console.log audit logs)
- [ ] Configure Cloudinary credentials
- [ ] Use HTTPS in production
- [ ] Set up database backups
- [ ] Review and restrict CORS origins
- [ ] Monitor audit logs for suspicious activity

