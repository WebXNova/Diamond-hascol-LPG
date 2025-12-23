-- Coupons Table
CREATE TABLE coupons (
  code VARCHAR(50) PRIMARY KEY,
  
  discount_type ENUM('percentage', 'flat') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),

  usage_limit INT NOT NULL DEFAULT 100,
  
  applicable_cylinder_type ENUM('Domestic', 'Commercial', 'Both') NOT NULL,
  min_order_amount DECIMAL(10,2) NULL,
  expiry_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

