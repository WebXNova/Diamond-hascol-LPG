# Quick Access Guide - Diamond Hascol LPG Application

## 🚀 Server Access

### Backend Server
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Status**: ✅ Running

### Frontend Server
- **URL**: http://localhost:5173
- **Status**: ✅ Running

---

## 📍 User Panel Routes

### Homepage
- **URL**: http://localhost:5173/
- **Description**: Main landing page with order form

### Contact Page
- **URL**: http://localhost:5173/contact.html
- **Description**: Contact form and information

### Order Tracking
- **URL**: http://localhost:5173/track.html
- **Description**: Track order status

### Location Page
- **URL**: http://localhost:5173/locations/larkana.html
- **Description**: Service area information

---

## 🔐 Admin Panel Routes

### Admin Login
- **URL**: http://localhost:5173/admin/login.html
- **Description**: Admin authentication page
- **Status**: ✅ Accessible

### Admin Dashboard
- **URL**: http://localhost:5173/admin/dashboard.html
- **Description**: Overview statistics and quick actions
- **Requires**: Authentication

### Orders Management
- **URL**: http://localhost:5173/admin/orders.html
- **Description**: View, update, and manage all orders
- **Requires**: Authentication
- **API**: http://localhost:5000/api/admin/orders

### Messages Management
- **URL**: http://localhost:5173/admin/messages.html
- **Description**: View and manage contact form submissions
- **Requires**: Authentication
- **API**: http://localhost:5000/api/admin/messages

### Coupons Management
- **URL**: http://localhost:5173/admin/coupons.html
- **Description**: Create, edit, and manage discount coupons
- **Requires**: Authentication
- **API**: http://localhost:5000/api/admin/coupons

### Order History & Analytics
- **URL**: http://localhost:5173/admin/history.html
- **Description**: Historical order data and analytics
- **Requires**: Authentication

### Admin Settings
- **URL**: http://localhost:5173/admin/settings.html
- **Description**: System configuration and settings
- **Requires**: Authentication

---

## 🔌 API Endpoints Quick Reference

### Public APIs (Base: http://localhost:5000)

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

#### Coupons
- `GET /api/coupons` - Get all active coupons
- `GET /api/coupons/:code` - Validate coupon code

#### Contact
- `POST /api/contact` - Submit contact message

### Admin APIs (Base: http://localhost:5000)

#### Orders
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order by ID
- `PATCH /api/admin/orders/:id/status` - Update order status
- `DELETE /api/admin/orders/:id` - Delete order

#### Coupons
- `POST /api/admin/coupons` - Create coupon
- `GET /api/admin/coupons` - Get all coupons
- `GET /api/admin/coupons/:code` - Get coupon by code
- `PATCH /api/admin/coupons/:code` - Update coupon
- `DELETE /api/admin/coupons/:code` - Delete coupon

#### Messages
- `GET /api/admin/messages` - Get all messages
- `PATCH /api/admin/messages/:id/read` - Mark as read
- `DELETE /api/admin/messages/:id` - Delete message

---

## 📊 Data Flow Summary

### Order Creation Flow
1. User visits homepage → http://localhost:5173/
2. Fills order form with details
3. Frontend sends `POST /api/orders` to backend
4. Backend saves order to database
5. Order appears in admin panel → http://localhost:5173/admin/orders.html

### Admin Order Management Flow
1. Admin logs in → http://localhost:5173/admin/login.html
2. Navigates to Orders → http://localhost:5173/admin/orders.html
3. Views all orders (fetched from `GET /api/admin/orders`)
4. Can update status via `PATCH /api/admin/orders/:id/status`
5. Can delete orders via `DELETE /api/admin/orders/:id`

### Coupon Management Flow
1. Admin navigates to Coupons → http://localhost:5173/admin/coupons.html
2. Creates coupon via `POST /api/admin/coupons`
3. Coupon saved to database
4. Users can validate via `GET /api/coupons/:code` during checkout
5. Coupon applied to order total

---

## 🛠️ Development Notes

- **Backend Port**: 5000
- **Frontend Port**: 5173 (Vite dev server)
- **Database**: MySQL (configured via .env)
- **Admin Auth**: Currently disabled for development
- **CORS**: Enabled for all origins in development

---

## 📝 Important Files

- **Routes Documentation**: See `ROUTES.md` for detailed route information
- **Backend Routes**: `backend/src/app.js`
- **Admin Router**: `frontend/js/admin/router.js`
- **API Config**: `frontend/js/api.js`

---

## ✅ Current Status

- ✅ Backend server running on port 5000
- ✅ Frontend server running on port 5173
- ✅ Admin login page accessible
- ✅ All routes properly registered
- ✅ Order creation fixed and working
- ✅ All admin routes accessible

---

## 🔍 Testing Checklist

- [ ] Access homepage
- [ ] Submit order form
- [ ] Access admin login
- [ ] View admin dashboard
- [ ] View orders in admin panel
- [ ] Update order status
- [ ] View messages
- [ ] Create coupon
- [ ] View order history

---

For detailed route information, see `ROUTES.md`

