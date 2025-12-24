# 🚨 Security Fixes - Quick Reference Guide

## Critical Fixes (Fix Immediately)

### 1. XSS in Admin Panel
**Files to Fix:**
- `frontend/js/admin/orders.js:181`
- `frontend/js/admin/coupons.js:185`
- `frontend/js/admin/messages.js:102`
- `frontend/js/admin/products.js:133`
- `frontend/admin/dashboard.html:271`

**Quick Fix:**
```javascript
// Replace innerHTML with escaped version
const escapeHtml = (str) => {
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return String(str).replace(/[&<>"']/g, m => map[m]);
};

// Before:
tableBody.innerHTML = filtered.map(order => `<td>${order.customerName}</td>`).join('');

// After:
tableBody.innerHTML = filtered.map(order => `<td>${escapeHtml(order.customerName)}</td>`).join('');
```

### 2. CORS Wildcard
**File:** `backend/src/app.js:42`

**Quick Fix:**
```javascript
// Change from:
origin: '*',

// To:
origin: process.env.FRONTEND_URL || 'http://localhost:5173',
```

### 3. Token Blacklist Persistence
**File:** `backend/src/middlewares/auth.middleware.js`

**Quick Fix:** Install Redis and update:
```bash
npm install ioredis
```

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function blacklistToken(token) {
  await redis.setex(`blacklist:${token}`, 86400, Date.now().toString());
}

async function isTokenBlacklisted(token) {
  return (await redis.exists(`blacklist:${token}`)) === 1;
}
```

### 4. Database Indexes
**File:** `database/schema.sql`

**Quick Fix:**
```sql
-- Add to schema.sql or run manually:
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_name ON orders(customer_name);
CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

## Very High Priority Fixes

### 5. BigInt Validation
**File:** `backend/src/controllers/order.controller.js:39`

**Quick Fix:**
```javascript
const phoneDigits = phone.replace(/[^\d]/g, '');
if (phoneDigits.length > 20 || phoneDigits.length < 7) {
  return res.status(400).json({ error: 'Invalid phone number length' });
}
const phoneNumber = BigInt(phoneDigits);
if (phoneNumber > BigInt('9223372036854775807')) {
  return res.status(400).json({ error: 'Phone number exceeds maximum value' });
}
```

### 6. Rate Limiting on Admin Routes
**File:** `backend/src/middlewares/rateLimit.middleware.js`

**Quick Fix:**
```javascript
const adminApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  statusCode: 429
});

// In app.js, apply to admin routes:
app.use("/api/admin", cors(adminCorsOptions), authenticateAdmin, adminApiRateLimiter, ...);
```

### 7. CSP Headers
**File:** `backend/src/app.js:90`

**Quick Fix:**
```javascript
scriptSrc: ["'self'"], // Remove 'unsafe-inline' and 'unsafe-eval'
```

### 8. Coupon Validation Rate Limit
**File:** `backend/src/routes/public/coupon.routes.js:6`

**Quick Fix:**
```javascript
const couponValidationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests' },
  statusCode: 429
});

router.post("/validate", couponValidationRateLimiter, (req, res, next) => {
  validateCouponCode(req, res, next);
});
```

## Testing Checklist

After applying fixes, test:
- [ ] XSS: Try injecting `<script>alert('XSS')</script>` in order name
- [ ] CORS: Try cross-origin request from different domain
- [ ] Token: Logout, restart server, try using old token
- [ ] Rate Limit: Send 200 requests to admin endpoint
- [ ] BigInt: Send phone number with 1000 digits
- [ ] Database: Query orders by status with 10,000+ orders

## Deployment Checklist

Before deploying to production:
- [ ] All Critical fixes applied
- [ ] All Very High fixes applied
- [ ] Security tests passed
- [ ] HTTPS configured
- [ ] Environment variables set
- [ ] Database indexes created
- [ ] Redis configured (for token blacklist)
- [ ] Monitoring enabled
- [ ] Backups configured


