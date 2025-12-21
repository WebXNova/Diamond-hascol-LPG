# Order Save Test Instructions

## How to Test Order Saving

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Verify database connection:**
   - Check console for: "✅ Database connection established successfully"
   - Check console for: "✅ Database schema synced with models"
   - Check console for: "✅ Created Domestic product in database" (if first time)
   - Check console for: "✅ Created Commercial product in database" (if first time)

3. **Test order creation via API:**
   ```bash
   curl -X POST http://localhost:5000/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "customerName": "Test User",
       "phone": "03001234567",
       "address": "123 Test Street, Karachi",
       "cylinderType": "Domestic",
       "quantity": 2,
       "couponCode": null
     }'
   ```

4. **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "orderId": 1,
       "pricePerCylinder": 2500,
       "subtotal": 5000,
       "discount": 0,
       "totalPrice": 5000,
       "couponCode": null,
       "status": "pending",
       "createdAt": "2024-01-15T10:30:00.000Z"
     }
   }
   ```

5. **Verify in Database:**
   ```sql
   SELECT * FROM orders ORDER BY id DESC LIMIT 1;
   ```

6. **Check Console Logs:**
   - Should see: "✅ Order #1 created successfully in database"
   - Should see customer name, type, quantity, and total

## Troubleshooting

### If orders are not saving:

1. **Check database connection:**
   - Verify `.env` file has correct DB credentials
   - Check MySQL is running
   - Verify database exists

2. **Check products exist:**
   ```sql
   SELECT * FROM products;
   ```
   - Should have at least 2 products (Domestic and Commercial)

3. **Check table structure:**
   ```sql
   DESCRIBE orders;
   ```
   - Should match the schema exactly

4. **Check server logs:**
   - Look for error messages in console
   - Check debug.log file for detailed logs

5. **Test database directly:**
   ```sql
   INSERT INTO orders (
     customer_name, phone, address, cylinder_type, quantity,
     price_per_cylinder, subtotal, discount, total_price, coupon_code, status
   ) VALUES (
     'Test', 1234567890, 'Test Address', 'Domestic', 1,
     2500.00, 2500.00, 0, 2500.00, NULL, 'pending'
   );
   ```



