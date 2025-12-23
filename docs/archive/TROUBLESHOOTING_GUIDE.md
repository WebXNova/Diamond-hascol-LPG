# Order Flow Troubleshooting Guide

## Quick Diagnosis

If orders are not saving or displaying, follow these steps in order:

### Step 1: Check Server Logs

**Backend Server Startup:**
```bash
cd backend
npm start
```

**Expected Output:**
```
✅ Database connection established successfully
✅ Database schema synced with models (tables created if they don't exist)
✅ Created Domestic product in database
✅ Created Commercial product in database
🚀 Server is running on port 5000
✅ Server and database are ready
```

**If you see errors:**
- ❌ "Unable to connect to the database" → Check database credentials in `.env`
- ❌ "Table doesn't exist" → Check database exists and tables are created
- ❌ "Access denied" → Check database user permissions

---

### Step 2: Test Database Connection

**Check if database is accessible:**
```sql
-- Connect to MySQL
mysql -u your_user -p your_database

-- Check if orders table exists
SHOW TABLES LIKE 'orders';

-- Check table structure
DESCRIBE orders;

-- Check if any orders exist
SELECT COUNT(*) FROM orders;
```

**Expected:** `orders` table exists with correct structure

---

### Step 3: Test API Endpoint Directly

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/order \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "1234567890",
    "address": "123 Test Street, Test City",
    "cylinderType": "Domestic",
    "quantity": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "pricePerCylinder": 2500,
    "subtotal": 2500,
    "discount": 0,
    "totalPrice": 2500,
    "couponCode": null,
    "message": "Order created successfully"
  }
}
```

**If you get errors:**
- ❌ 400 Bad Request → Check request payload format
- ❌ 500 Internal Server Error → Check server logs for details
- ❌ Connection refused → Server not running or wrong port

---

### Step 4: Check Browser Console

**Open browser DevTools (F12) and check:**

1. **Network Tab:**
   - Find POST request to `/api/order`
   - Check Status Code (should be 201)
   - Check Response (should contain `orderId`)

2. **Console Tab:**
   - Look for error messages
   - Check for "Order created successfully" message

**Common Frontend Errors:**
- ❌ "Failed to fetch" → CORS issue or server not running
- ❌ "Invalid response" → Backend returned error
- ❌ "Network error" → Server connection issue

---

### Step 5: Verify Order in Database

**After submitting an order, verify it was saved:**

```sql
-- Get latest order
SELECT * FROM orders ORDER BY id DESC LIMIT 1;

-- Check all fields are populated
SELECT 
  id,
  customer_name,
  phone,
  address,
  cylinder_type,
  quantity,
  total_price,
  status,
  created_at
FROM orders 
ORDER BY id DESC 
LIMIT 1;
```

**Expected:** Order exists with all fields populated correctly

---

### Step 6: Test Admin Panel

**Open admin panel and check:**

1. **Orders Page Loads:**
   - Open `/admin/orders.html`
   - Check browser console for errors
   - Verify orders list displays

2. **New Order Appears:**
   - Submit order from frontend
   - Refresh admin orders page
   - New order should appear in list

3. **Order Details Work:**
   - Click "View" button on an order
   - Modal should show order details
   - All fields should be populated

---

## Common Issues and Solutions

### Issue 1: Orders Not Saving to Database

**Symptoms:**
- Frontend shows success message
- No errors in console
- Order doesn't appear in admin panel

**Diagnosis:**
1. Check server logs for database errors
2. Verify database connection
3. Check if `Order.create()` is being called
4. Verify database table permissions

**Solution:**
- Ensure database user has INSERT permissions
- Check database connection string in `.env`
- Verify table structure matches model

---

### Issue 2: Orders Save But Don't Appear in Admin Panel

**Symptoms:**
- Order exists in database (verified with SQL query)
- Admin panel shows empty or doesn't load

**Diagnosis:**
1. Check admin API endpoint: `GET /api/admin/orders`
2. Verify response format matches frontend expectations
3. Check browser console for JavaScript errors

**Solution:**
```bash
# Test admin endpoint
curl http://localhost:5000/api/admin/orders
```

Expected: Returns JSON with `success: true` and `data` array of orders

---

### Issue 3: Database Connection Errors

**Symptoms:**
- Server fails to start
- Error: "Unable to connect to the database"

**Solution:**
1. **Check `.env` file exists and has correct values:**
   ```env
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_PORT=3306
   ```

2. **Verify database is running:**
   ```bash
   # MySQL
   mysql -u root -p
   
   # Or check service status
   # Windows: services.msc -> MySQL
   # Linux: sudo systemctl status mysql
   ```

3. **Test connection manually:**
   ```bash
   mysql -u your_user -p your_database
   ```

---

### Issue 4: Validation Errors

**Symptoms:**
- Frontend shows validation error
- API returns 400 Bad Request

**Solution:**
- Check request payload matches expected format:
  ```json
  {
    "name": "string (min 2 chars)",
    "phone": "string (min 7 digits)",
    "address": "string (min 10 chars)",
    "cylinderType": "Domestic" or "Commercial",
    "quantity": number (1-999),
    "couponCode": "string (optional)"
  }
  ```

---

### Issue 5: CORS Errors

**Symptoms:**
- Browser console shows CORS error
- Request fails with "Access-Control-Allow-Origin"

**Solution:**
- CORS is already enabled in `backend/src/app.js`
- Verify backend server is running
- Check if frontend is using correct API URL

---

## Debugging Commands

### Check Server Logs
```bash
# Backend logs
cd backend
npm start

# Look for:
# ✅ Database connection established
# 📥 POST /api/order - Request received
# 💾 Saving order to database...
# ✅ Order saved successfully!
```

### Check Database Directly
```sql
-- Count orders
SELECT COUNT(*) FROM orders;

-- Latest order
SELECT * FROM orders ORDER BY id DESC LIMIT 1;

-- Orders by status
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Recent orders
SELECT id, customer_name, total_price, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test API Endpoints
```bash
# Create order
curl -X POST http://localhost:5000/api/order \
  -H "Content-Type: application/json" \
  -d @test-order.json

# Get all orders (admin)
curl http://localhost:5000/api/admin/orders

# Get order by ID
curl http://localhost:5000/api/admin/orders/1
```

---

## Environment Variables Checklist

**Required in `backend/.env`:**
```env
# Database
DB_NAME=lpg_database
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=development  # or production
```

---

## File Locations Reference

**Backend:**
- Routes: `backend/src/routes/public/simple-order.routes.js`
- Controller: `backend/src/controllers/simple-order.controller.js`
- Model: `backend/src/models/order.model.js`
- Config: `backend/src/config/db.js`
- Server: `backend/server.js`

**Frontend:**
- Order form: `frontend/js/order.js`
- Admin orders: `frontend/js/admin/orders.js`
- API config: `frontend/js/api.js`

**Database:**
- Schema: `database/schema.sql`
- Orders table: `database/tables/orders.sql`

---

## Still Having Issues?

1. **Enable detailed logging:**
   - Add `console.log()` statements in controller
   - Enable Sequelize query logging
   - Check browser console for errors

2. **Check for recent changes:**
   - Review git history
   - Check if database schema changed
   - Verify all dependencies are installed

3. **Test with minimal data:**
   - Try creating order with minimal required fields
   - Test without coupon code
   - Test with different cylinder types

4. **Compare with working environment:**
   - Check if same code works elsewhere
   - Compare database schemas
   - Verify environment variables match

---

**Last Updated:** $(date)

