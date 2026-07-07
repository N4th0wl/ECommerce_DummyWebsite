# Cybersecurity Web Exploitation Demo

## 🚀 Quick Start

```bash
# 1. Pastikan Docker & Docker Compose terinstall
docker --version
docker compose version

# 2. Build & jalankan semua service
docker compose up --build

# 3. Tunggu ~2-3 menit hingga MySQL siap & DB ter-seed

# 4. Buka browser:
#    Frontend  → http://localhost:3000
#    Backend   → http://localhost:5000
#    API Docs  → http://localhost:5000/api/health
```

## 📁 Struktur Project

```
E-Commerce/
├── frontend/           # ReactJS (port 3000)
│   ├── src/
│   │   ├── pages/      # Login, Register, Home, Dashboard, AdminPanel, Cart
│   │   ├── components/ # Navbar
│   │   └── context/    # AuthContext, CartContext
│   ├── Dockerfile
│   └── nginx.conf
├── backend/            # Node.js + Express (port 5000)
│   └── server.js       # Vulnerable endpoints
├── database/
│   └── init.sql        # MySQL schema + seed data
├── docs/
│   ├── ATTACK_DOCUMENTATION.md  # Panduan lengkap serangan
│   ├── sqli_exploit.py          # SQLi automation
│   ├── attacker_server.py       # XSS data catcher
│   └── dork_scanner.py          # Google Dork scanner
└── docker-compose.yml
```

## 🎯 Vulnerability Summary

| Vulnerability | Location | Payload |
|---------------|----------|---------|
| **SQLi Auth Bypass** | Login form | `admin' -- ` |
| **SQLi UNION Dump** | Search bar | `' UNION SELECT ... FROM users -- ` |
| **Stored XSS** | Product review | `<script>alert(1)</script>` |
| **Stored XSS (Bio)** | Register form | `<img src=x onerror=alert(1)>` |
| **Google Dork** | `/backup/`, `/config/` | Direct file access |
| **IDOR** | Orders API | `?user_id=1` |

## 👥 Test Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `john_doe` | `password123` | Customer |

## 📚 Workshop Tools

```bash
# SQLi exploit
python3 docs/sqli_exploit.py

# Google Dork scanner
python3 docs/dork_scanner.py

# XSS attacker server (tangkap token / retrieve token)
python3 docs/attacker_server.py
```

## 🛑 Stop Lab

```bash
docker compose down
docker compose down -v   # + hapus database
```
