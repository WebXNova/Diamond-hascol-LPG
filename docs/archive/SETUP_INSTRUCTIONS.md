# Setup Instructions - Database Configuration

## ⚠️ IMPORTANT: Database Configuration Required

To connect the backend to your MySQL database, you need to create a `.env` file in the `backend` directory.

### Step 1: Create `.env` file

Create a file named `.env` in the `backend` directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=diamond_hascol_lpg
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 2: Update Database Credentials

Replace the values with your actual MySQL credentials:

- **DB_NAME**: Your database name (e.g., `diamond_hascol_lpg`)
- **DB_USER**: Your MySQL username (commonly `root`)
- **DB_PASSWORD**: Your MySQL password (leave empty if no password: `DB_PASSWORD=`)
- **DB_HOST**: Usually `localhost`
- **DB_PORT**: Usually `3306`

### Step 3: Create the Database

If the database doesn't exist, create it in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS diamond_hascol_lpg;
```

### Step 4: Restart Backend Server

After creating the `.env` file, restart the backend server:

```bash
cd backend
npm start
```

The server will automatically:
- Connect to the database
- Create all necessary tables (orders, messages, coupons, etc.)
- Sync the database schema

---

## ✅ What's Been Fixed

1. **Admin Controllers Implemented**
   - `backend/src/controllers/admin/order.controller.js` - Full CRUD for orders
   - `backend/src/controllers/admin/message.controller.js` - Full CRUD for messages

2. **Frontend Connected to Backend**
   - `frontend/js/admin/orders.js` - Now fetches real data from `/api/admin/orders`
   - `frontend/js/admin/messages.js` - Now fetches real data from `/api/admin/messages`
   - `frontend/js/api.js` - Updated with admin endpoints

3. **Order Creation Fixed**
   - Fixed camelCase property names in order controller
   - Orders now save correctly to database

---

## 🔄 Data Flow

### Order Flow:
1. User submits order on homepage → `POST /api/orders`
2. Backend saves to database
3. Admin views orders at `/admin/orders.html` → `GET /api/admin/orders`
4. Admin updates status → `PATCH /api/admin/orders/:id/status`

### Message Flow:
1. User submits contact form → `POST /api/contact`
2. Backend saves to database
3. Admin views messages at `/admin/messages.html` → `GET /api/admin/messages`
4. Admin marks as read → `PATCH /api/admin/messages/:id/read`

---

## 🧪 Testing

After setting up the `.env` file:

1. **Test Order Creation:**
   - Go to http://localhost:5173/
   - Submit an order
   - Check http://localhost:5173/admin/orders.html
   - Order should appear in the list

2. **Test Message Creation:**
   - Go to http://localhost:5173/contact.html
   - Submit a message
   - Check http://localhost:5173/admin/messages.html
   - Message should appear in the list

3. **Test Admin Functions:**
   - Update order status
   - Mark messages as read
   - Delete orders/messages

---

## 📝 Notes

- The `.env` file is in `.gitignore` and won't be committed to version control
- If you don't have a MySQL password, set `DB_PASSWORD=` (empty)
- The database tables will be created automatically when the server starts
- All data from user panel now saves to database and appears in admin panel

