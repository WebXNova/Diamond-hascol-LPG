# Application Routes Documentation

This document provides a comprehensive overview of all routes in the Diamond Hascol LPG application.

## Backend API Routes

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: Configure via environment variables

---

## Public API Routes

### Orders
- **POST** `/api/orders` - Create a new order
  - Body: `{ customerName, phone, address, cylinderType, quantity, couponCode? }`
  - Returns: `{ success: true, orderId: number }`

### Products
- **GET** `/api/products` - Get all products
- **GET** `/api/products/:id` - Get product by ID

### Coupons
- **GET** `/api/coupons` - Get all active coupons
- **GET** `/api/coupons/:code` - Validate coupon code

### Contact/Messages
- **POST** `/api/contact` - Submit contact form message
  - Body: `{ name, phone, message }`

### Health Check
- **GET** `/health` - Server health status
  - Returns: `{ status: "ok", timestamp: string }`

---

## Admin API Routes

### Admin Orders
- **GET** `/api/admin/orders` - Get all orders (with pagination/filtering)
- **GET** `/api/admin/orders/:id` - Get order by ID
- **PATCH** `/api/admin/orders/:id/status` - Update order status
  - Body: `{ status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' }`
- **DELETE** `/api/admin/orders/:id` - Delete an order

### Admin Coupons
- **POST** `/api/admin/coupons` - Create new coupon
  - Body: `{ code, discountType, discountValue, expiryDate, usageLimit? }`
- **GET** `/api/admin/coupons` - Get all coupons
- **GET** `/api/admin/coupons/:code` - Get coupon by code
- **PATCH** `/api/admin/coupons/:code` - Update coupon
- **DELETE** `/api/admin/coupons/:code` - Delete coupon

### Admin Messages
- **GET** `/api/admin/messages` - Get all contact messages
- **PATCH** `/api/admin/messages/:id/read` - Mark message as read
- **DELETE** `/api/admin/messages/:id` - Delete message

---

## Frontend Routes

### Base URL
- **Development**: `http://localhost:5173`
- **Production**: Configure via environment variables

---

## Public Frontend Pages

### Main Pages
- **GET** `/` - Homepage (index.html)
  - Order LPG cylinders
  - View products
  - Main landing page

- **GET** `/contact.html` - Contact page
  - Contact form
  - Contact information

- **GET** `/track.html` - Order tracking page
  - Track order status
  - View order history

- **GET** `/locations/larkana.html` - Location page
  - Service area information
  - Location details

---

## Admin Panel Routes

### Base Path: `/admin`

### Public Admin Routes
- **GET** `/admin/login.html` - Admin login page
  - Authentication required for access
  - Redirects to dashboard if already authenticated

### Protected Admin Routes (Require Authentication)
All admin routes below require authentication. Non-authenticated users are redirected to `/admin/login.html`.

- **GET** `/admin/dashboard.html` - Admin dashboard
  - Overview statistics
  - Recent orders
  - Quick actions

- **GET** `/admin/orders.html` - Orders management
  - View all orders
  - Update order status
  - Delete orders
  - Filter and search orders

- **GET** `/admin/messages.html` - Messages management
  - View contact form submissions
  - Mark messages as read
  - Delete messages

- **GET** `/admin/coupons.html` - Coupons management
  - Create new coupons
  - View all coupons
  - Edit coupons
  - Delete coupons

- **GET** `/admin/history.html` - Order history & analytics
  - Historical order data
  - Analytics and reports
  - Date filtering
  - Export functionality

- **GET** `/admin/settings.html` - Admin settings
  - Configuration options
  - System settings

---

## Route Protection

### Admin Routes Protection
Admin routes are protected by the router module (`frontend/js/admin/router.js`):
- Protected routes require authentication
- Non-authenticated users are redirected to `/admin/login.html`
- Authentication status is checked via `isAuthenticated()` function
- Session management handled via `AdminAuth` module

### Protected Routes List
- `dashboard.html`
- `orders.html`
- `messages.html`
- `coupons.html`
- `history.html`
- `settings.html`

---

## Data Flow

### Order Submission Flow
1. User fills order form on `/` (homepage)
2. Frontend sends **POST** `/api/orders` to backend
3. Backend validates and creates order in database
4. Frontend displays success message
5. Order appears in admin panel at `/admin/orders.html`

### Admin Order Management Flow
1. Admin accesses `/admin/orders.html`
2. Frontend fetches orders via **GET** `/api/admin/orders`
3. Admin can update status via **PATCH** `/api/admin/orders/:id/status`
4. Changes are reflected in real-time

### Coupon Management Flow
1. Admin creates coupon at `/admin/coupons.html`
2. Frontend sends **POST** `/api/admin/coupons`
3. Coupon is saved to database
4. Users can validate coupons via **GET** `/api/coupons/:code`
5. Coupons are applied during order creation

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... }
}
```

---

## CORS Configuration

- CORS is enabled for all origins in development
- Configure in `backend/src/app.js` using `cors()` middleware

---

## Notes

- All API endpoints use JSON format
- Content-Type header: `application/json`
- Error responses follow consistent format
- Admin routes currently have no authentication middleware (open for development)
- Frontend uses Vite dev server on port 5173
- Backend uses Express on port 5000

