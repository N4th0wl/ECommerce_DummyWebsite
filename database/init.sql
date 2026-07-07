CREATE DATABASE IF NOT EXISTS shopvuln;
USE shopvuln;

-- Users table (vulnerable: plaintext passwords, no rate limiting)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- VULN: stored as plaintext/MD5
  role VARCHAR(50) DEFAULT 'customer',
  bio TEXT DEFAULT '',              -- VULN: XSS injection point
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 100,
  category VARCHAR(100),
  image_url VARCHAR(500) DEFAULT '/assets/product-placeholder.jpg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Reviews table (VULN: XSS via review content)
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,                     -- VULN: Stored XSS injection point
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin config table (VULN: Google Dork - exposed sensitive data)
CREATE TABLE IF NOT EXISTS site_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT NOT NULL
);

-- =============
-- SEED DATA
-- =============

-- Admin user (VULN: weak password, plaintext stored)
INSERT INTO users (username, email, password, role) VALUES
  ('admin', 'admin@shopvuln.local', 'admin123', 'admin'),
  ('john_doe', 'john@example.com', 'password123', 'customer'),
  ('jane_smith', 'jane@example.com', 'qwerty', 'customer'),
  ('alice', 'alice@test.com', '123456', 'customer'),
  ('bob_admin', 'bob@shopvuln.local', 'bob2024!', 'admin');

-- Sample products
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
  ('Gaming Mouse Pro X', 'High-performance gaming mouse with 16000 DPI optical sensor, RGB lighting, and programmable buttons.', 89.99, 150, 'Electronics', '/assets/mouse.jpg'),
  ('Mechanical Keyboard RGB', 'Full-size mechanical keyboard with Cherry MX switches and customizable RGB backlighting.', 129.99, 80, 'Electronics', '/assets/keyboard.jpg'),
  ('Laptop Stand Aluminum', 'Ergonomic aluminum laptop stand, compatible with all 11-17 inch laptops.', 49.99, 200, 'Accessories', '/assets/stand.jpg'),
  ('USB-C Hub 7-in-1', 'Multiport USB-C hub with HDMI 4K, USB 3.0, SD card reader, and 100W PD charging.', 59.99, 120, 'Accessories', '/assets/hub.jpg'),
  ('Webcam 1080p HD', 'Full HD webcam with built-in microphone, auto-focus, and low-light correction.', 79.99, 90, 'Electronics', '/assets/webcam.jpg'),
  ('Wireless Headphones', 'Premium wireless headphones with active noise cancellation and 30-hour battery life.', 199.99, 60, 'Audio', '/assets/headphones.jpg'),
  ('Monitor 27" 4K', '27-inch 4K UHD monitor with 144Hz refresh rate and HDR support.', 449.99, 30, 'Monitors', '/assets/monitor.jpg'),
  ('External SSD 1TB', 'Portable SSD with 1050MB/s read speed, USB 3.2 Gen 2 interface.', 109.99, 75, 'Storage', '/assets/ssd.jpg'),
  ('Smart Security Camera', 'Indoor/outdoor IP camera, 2K resolution, motion detection, night vision.', 69.99, 110, 'Security', '/assets/camera.jpg'),
  ('VPN Router', 'Dual-band router with built-in VPN support, OpenWRT compatible.', 159.99, 45, 'Networking', '/assets/router.jpg');

-- VULN: Sensitive config data accessible via SQL injection or Google Dork
INSERT INTO site_config (config_key, config_value) VALUES
  ('jwt_secret', 'super_secret_jwt_key_2024_do_not_share'),
  ('db_backup_password', 'Backup@2024!Secure'),
  ('payment_api_key', 'pk_live_shopvuln_1234567890abcdef'),
  ('admin_email', 'admin@shopvuln.local'),
  ('maintenance_mode', 'false');

-- Sample reviews (with XSS payload already stored for demo)
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
  (1, 2, 5, 'Great mouse! Totally worth the price.'),
  (1, 3, 4, 'Good build quality, feels premium.'),
  (2, 2, 5, 'Best keyboard I ever used!'),
  (3, 4, 3, 'Decent stand, a bit wobbly on larger laptops.');
