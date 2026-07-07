-- Database Backup 2024-01-15
-- ShopVuln Production Database Dump
-- ⚠️ THIS FILE SHOULD NOT BE PUBLICLY ACCESSIBLE

CREATE TABLE users (
  id INT, username VARCHAR(100), email VARCHAR(200),
  password VARCHAR(255), role VARCHAR(50)
);

INSERT INTO users VALUES (1,'admin','admin@shopvuln.local','admin123','admin');
INSERT INTO users VALUES (2,'john_doe','john@example.com','password123','customer');
INSERT INTO users VALUES (5,'bob_admin','bob@shopvuln.local','bob2024!','admin');
