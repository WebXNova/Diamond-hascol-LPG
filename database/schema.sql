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

