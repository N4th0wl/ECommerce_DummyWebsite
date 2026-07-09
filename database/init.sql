CREATE DATABASE IF NOT EXISTS shopvuln;
USE shopvuln;

-- Users table (vulnerable: plaintext passwords, no rate limiting)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(200) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- VULN: stored as plaintext/MD5
  role VARCHAR(50) DEFAULT 'customer',
  bio TEXT,              -- VULN: XSS injection point
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
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL
);

-- CTF Flags table (hidden — discoverable via SQL injection UNION attacks)
CREATE TABLE IF NOT EXISTS ctf_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flag_name VARCHAR(100) NOT NULL UNIQUE,
  flag_value VARCHAR(255) NOT NULL,
  hint TEXT
);

-- =============
-- SEED DATA (Using INSERT IGNORE to prevent duplicate errors on restart)
-- =============

-- Admin user (VULN: weak password, plaintext stored)
INSERT IGNORE INTO users (id, username, email, password, role) VALUES
  (1, 'admin', 'admin@shopvuln.local', 'admin123', 'admin'),
  (2, 'john_doe', 'john@example.com', 'password123', 'customer'),
  (3, 'jane_smith', 'jane@example.com', 'qwerty', 'customer'),
  (4, 'alice', 'alice@test.com', '123456', 'customer'),
  (5, 'bob_admin', 'bob@shopvuln.local', 'bob2024!', 'admin');

-- Sample products
INSERT IGNORE INTO products (id, name, description, price, stock, category, image_url) VALUES
  (1, 'Gaming Mouse Pro X', 'High-performance gaming mouse with 16000 DPI optical sensor, RGB lighting, and programmable buttons.', 89.99, 150, 'Electronics', '/assets/mouse.jpg'),
  (2, 'Mechanical Keyboard RGB', 'Full-size mechanical keyboard with Cherry MX switches and customizable RGB backlighting.', 129.99, 80, 'Electronics', '/assets/keyboard.jpg'),
  (3, 'Laptop Stand Aluminum', 'Ergonomic aluminum laptop stand, compatible with all 11-17 inch laptops.', 49.99, 200, 'Accessories', '/assets/stand.jpg'),
  (4, 'USB-C Hub 7-in-1', 'Multiport USB-C hub with HDMI 4K, USB 3.0, SD card reader, and 100W PD charging.', 59.99, 120, 'Accessories', '/assets/hub.jpg'),
  (5, 'Webcam 1080p HD', 'Full HD webcam with built-in microphone, auto-focus, and low-light correction.', 79.99, 90, 'Electronics', '/assets/webcam.jpg'),
  (6, 'Wireless Headphones', 'Premium wireless headphones with active noise cancellation and 30-hour battery life.', 199.99, 60, 'Audio', '/assets/headphones.jpg'),
  (7, 'Monitor 27" 4K', '27-inch 4K UHD monitor with 144Hz refresh rate and HDR support.', 449.99, 30, 'Monitors', '/assets/monitor.jpg'),
  (8, 'External SSD 1TB', 'Portable SSD with 1050MB/s read speed, USB 3.2 Gen 2 interface.', 109.99, 75, 'Storage', '/assets/ssd.jpg'),
  (9, 'Smart Security Camera', 'Indoor/outdoor IP camera, 2K resolution, motion detection, night vision.', 69.99, 110, 'Security', '/assets/camera.jpg'),
  (10, 'VPN Router', 'Dual-band router with built-in VPN support, OpenWRT compatible.', 159.99, 45, 'Networking', '/assets/router.jpg');

-- VULN: Sensitive config data accessible via SQL injection or Google Dork
INSERT IGNORE INTO site_config (config_key, config_value) VALUES
  ('jwt_secret', 'super_secret_jwt_key_2024_do_not_share'),
  ('db_backup_password', 'Backup@2024!Secure'),
  ('payment_api_key', 'pk_live_shopvuln_1234567890abcdef'),
  ('admin_email', 'admin@shopvuln.local'),
  ('maintenance_mode', 'false'),
  ('ctf_flag_config', 'UMNCySec{S3ns1t1v3_C0nf1g_L34k3d_V1a_Adm1n_P4n3l}');

-- CTF FLAGS — hidden treasures for workshop participants
INSERT IGNORE INTO ctf_flags (flag_name, flag_value, hint) VALUES
  ('sqli_auth_bypass', 'UMNCySec{SQL_1nj3ct10n_Auth_Byp4ss_Succ3ss}', 'Bypass login with SQL injection on the username field'),
  ('sqli_union_users', 'UMNCySec{UN10N_S3L3CT_Us3r_Dump_Compl3t3}', 'Use UNION SELECT to dump this flags table'),
  ('sqli_union_config', 'UMNCySec{D4t4b4s3_S3cr3ts_3xtr4ct3d}', 'Use UNION SELECT to extract site_config secrets'),
  ('xss_stored_review', 'UMNCySec{St0r3d_XSS_1n_R3v13w_F13ld}', 'Inject XSS payload in product review comment'),
  ('xss_stored_bio', 'UMNCySec{XSS_V1a_Us3r_B10_F13ld}', 'Inject XSS payload in user bio during registration'),
  ('google_dork_robots', 'UMNCySec{R0b0ts_Txt_R3c0n_Succ3ss}', 'Find hidden paths via robots.txt'),
  ('google_dork_backup', 'UMNCySec{D4t4b4s3_B4ckup_F1l3_3xp0s3d}', 'Access exposed database backup file'),
  ('google_dork_config', 'UMNCySec{C0nf1g_F1l3_L34k3d_Cr3ds}', 'Access exposed configuration file'),
  ('google_dork_admin_notes', 'UMNCySec{4dm1n_N0t3s_1nt3rn4l_L34k}', 'Access exposed admin notes file'),
  ('idor_order_access', 'UMNCySec{1D0R_0th3r_Us3r_0rd3r_4cc3ss}', 'Access other users orders by changing user_id parameter'),
  ('jwt_forgery', 'UMNCySec{JWT_T0k3n_F0rg3d_4dm1n_4cc3ss}', 'Forge a JWT token using the leaked secret to gain admin access'),
  ('plaintext_passwords', 'UMNCySec{Pl41nt3xt_P4ssw0rd_St0r4g3_F0und}', 'Discover that passwords are stored in plaintext via admin panel or SQLi'),
  ('info_disclosure_health', 'UMNCySec{S3rv3r_1nf0_D1scl0sur3_H34lth}', 'Access the health endpoint to discover server information');

-- Sample reviews (with XSS payload already stored for demo)
INSERT IGNORE INTO reviews (id, product_id, user_id, rating, comment) VALUES
  (1, 1, 2, 5, 'Great mouse! Totally worth the price.'),
  (2, 1, 3, 4, 'Good build quality, feels premium.'),
  (3, 2, 2, 5, 'Best keyboard I ever used!'),
  (4, 3, 4, 3, 'Decent stand, a bit wobbly on larger laptops.');

-- Sample order for IDOR demonstration
INSERT IGNORE INTO orders (id, user_id, total, status, shipping_address) VALUES
  (1, 1, 299.97, 'completed', 'Admin Office, Secret Building, Floor 13'),
  (2, 2, 89.99, 'pending', 'John Doe, 123 Main St, Anytown');

INSERT IGNORE INTO order_items (id, order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 1, 89.99),
  (2, 1, 2, 1, 129.99),
  (3, 1, 5, 1, 79.99),
  (4, 2, 1, 1, 89.99);
