# Admin Products Management Setup

## Required NPM Packages

The admin product management system requires the following packages for image upload functionality:

```bash
cd backend
npm install cloudinary multer
```

## Environment Variables

Create or update your `.env` file in the `backend` directory with Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Getting Cloudinary Credentials

1. Sign up for a free account at https://cloudinary.com
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

**Note:** If Cloudinary credentials are not set, the system will use a demo configuration. For production, you must set up proper Cloudinary credentials.

## Database Migration

The Product model has been updated with new fields:
- `weight` (VARCHAR(50), nullable)
- `in_stock` (BOOLEAN, default true)

If your database already exists, you may need to run a migration to add these fields:

```sql
ALTER TABLE products 
ADD COLUMN weight VARCHAR(50) NULL AFTER type,
ADD COLUMN in_stock BOOLEAN DEFAULT TRUE AFTER is_active;
```

Or use the updated schema in `database/schema.sql` to recreate the table.

## Features Implemented

✅ Full CRUD operations for products
✅ Image upload to Cloudinary
✅ Stock management (inStock toggle)
✅ Dynamic pricing
✅ Product cards UI in admin panel
✅ Real-time UI updates

## API Endpoints

- `GET /api/admin/products` - Get all products
- `GET /api/admin/products/:id` - Get product by ID
- `POST /api/admin/products` - Create product (multipart/form-data)
- `PATCH /api/admin/products/:id` - Update product (multipart/form-data)
- `PATCH /api/admin/products/:id/stock` - Toggle stock status
- `DELETE /api/admin/products/:id` - Delete product

## Frontend

The admin products page is available at `/admin/products.html` with full CRUD functionality.

