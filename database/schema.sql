


-- Orders Table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,

  customer_name VARCHAR(100) NOT NULL,
  phone BIGINT NOT NULL,
  address TEXT NOT NULL,

  cylindertype ENUM('Domestic', 'Commercial') NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),

  price_per_cylinder DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,

  coupon_code VARCHAR(50),
  status ENUM('pending','confirmed','in-transit','delivered','cancelled') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(100) NOT NULL,
  phone BIGINT NOT NULL,
  message TEXT NOT NULL,

  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(100) NOT NULL,
  category ENUM('Domestic', 'Commercial') NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500) NULL,
  in_stock BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert two fixed products
INSERT INTO products (name, category, description, price, in_stock) VALUES
('Domestic LPG Cylinder', 'Domestic', 'LPG cylinder for home use', 2500.00, TRUE),
('Commercial LPG Cylinder', 'Commercial', 'LPG cylinder for commercial use', 3000.00, TRUE);

-- Coupons Table
CREATE TABLE coupons (
  code VARCHAR(50) PRIMARY KEY,
  discount_type ENUM('percentage', 'flat') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  usage_limit INT NOT NULL DEFAULT 100,
  applicable_cylinder_type ENUM('Domestic', 'Commercial', 'Both') NOT NULL,
  min_order_amount DECIMAL(10,2) NULL,
  expiry_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE coupon_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,

  coupon_code VARCHAR(50) NOT NULL,
  order_id INT NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_coupon_usage_coupon (coupon_code),
  INDEX idx_coupon_usage_order (order_id),

  CONSTRAINT fk_coupon_usage_coupon
    FOREIGN KEY (coupon_code) REFERENCES coupons(code)
    ON DELETE CASCADE,

  CONSTRAINT fk_coupon_usage_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);

-- Admins Table (for admin authentication)
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_admins_email (email),
  INDEX idx_admins_active (is_active)
);
