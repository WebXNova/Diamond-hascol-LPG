


-- Orders Table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,

  customer_name VARCHAR(100) NOT NULL,
  phone BIGINT NOT NULL,
  address TEXT NOT NULL,

  cylinder_type ENUM('Domestic', 'Commercial') NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),

  price_per_cylinder DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,

  coupon_code VARCHAR(50),
  status ENUM('pending','confirmed','delivered','cancelled') DEFAULT 'pending',

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

