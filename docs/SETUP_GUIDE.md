# 📖 Dokumentasi #2 — Setup & Panduan Menjalankan ShopVuln

> **Lab:** ShopVuln — CyberSecurity Workshop  
> **Stack:** ReactJS · Node.js · MySQL · Docker  
> ⚠️ Aplikasi ini **sengaja vulnerable** untuk keperluan edukasi.

---

## 📋 Daftar Isi

1. [Prasyarat (Prerequisites)](#prasyarat)
2. [Instalasi Docker](#instalasi-docker)
3. [Cara Menjalankan dengan Docker](#cara-menjalankan-dengan-docker)
4. [Cara Menjalankan Manual (tanpa Docker)](#cara-menjalankan-manual)
5. [Verifikasi Instalasi](#verifikasi-instalasi)
6. [Akses Aplikasi](#akses-aplikasi)
7. [Akun Default](#akun-default)
8. [Manajemen Container](#manajemen-container)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prasyarat

### Minimum Requirements
| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| OS | Ubuntu 20.04 / Debian 11 / Kali Linux | Kali Linux 2024+ |
| RAM | 2 GB | 4 GB |
| Disk | 5 GB free | 10 GB |
| CPU | 2 core | 4 core |

### Software yang Dibutuhkan

#### Metode 1 — Docker (Direkomendasikan)
- Docker Engine 24.x+
- Docker Compose v2.x+

#### Metode 2 — Manual
- Node.js 18.x+
- npm 9.x+
- MySQL 8.0+
- Git

---

## 🐳 Instalasi Docker

### Ubuntu / Debian / Kali Linux

```bash
# 1. Update package list
sudo apt update

# 2. Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# 3. Tambah Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Tambah Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine & Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Jalankan Docker tanpa sudo (opsional tapi direkomendasikan)
sudo usermod -aG docker $USER
newgrp docker

# 7. Verifikasi
docker --version
docker compose version
```

### Verifikasi Instalasi Docker

```
Docker version 24.x.x, build ...
Docker Compose version v2.x.x
```

---

## 🚀 Cara Menjalankan dengan Docker

### Langkah 1 — Clone / Buka Direktori Project

```bash
# Masuk ke direktori project
cd /path/to/E-Commerce

# Atau jika dari workspace workshop
cd ~/Documents/Coding/Workshop/E-Commerce
```

### Langkah 2 — Build & Jalankan Semua Service

```bash
# Build image Docker dan jalankan semua container
docker compose up --build

# Atau jalankan di background (detached mode)
docker compose up --build -d
```

> ⏳ **Estimasi waktu:** 2–5 menit pada build pertama (download base images).  
> Build berikutnya akan lebih cepat karena cache.

### Langkah 3 — Tunggu Semua Container Ready

Ketika menjalankan di foreground, tunggu hingga muncul pesan seperti:
```
shopvuln_backend   | ╔══════════════════════════════════════════════════╗
shopvuln_backend   | ║      ShopVuln - CyberSecurity Workshop           ║
shopvuln_backend   | ║  ⚠️  INTENTIONALLY VULNERABLE APPLICATION ⚠️    ║
shopvuln_backend   | ║  🚀 Server running on port 5000                  ║
shopvuln_backend   | ╚══════════════════════════════════════════════════╝
```

### Langkah 4 — Buka Aplikasi

Buka browser dan akses:
- **Website:** http://localhost:3000
- **API:** http://localhost:5000
- **DB Admin** (optional): lihat bagian manajemen

---

## ⚙️ Cara Menjalankan Manual (tanpa Docker)

Gunakan cara ini jika Docker tidak tersedia.

### A. Setup MySQL

```bash
# Install MySQL
sudo apt install -y mysql-server

# Jalankan MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Setup database
sudo mysql -u root << 'SQLEOF'
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootpassword';
FLUSH PRIVILEGES;
EXIT;
SQLEOF

# Import schema dan seed data
mysql -u root -prootpassword < database/init.sql

# Verifikasi
mysql -u root -prootpassword -e "USE shopvuln; SHOW TABLES; SELECT username, password, role FROM users;"
```

### B. Setup Backend (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Buat file environment
cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_USER=root
DB_PASS=rootpassword
DB_NAME=shopvuln
PORT=5000
NODE_ENV=development
ENVEOF

# Jalankan backend
node server.js

# Atau dengan auto-restart (development)
npm install -g nodemon
nodemon server.js
```

Backend akan berjalan di: **http://localhost:5000**

### C. Setup Frontend (React)

Buka terminal baru:

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps
npm install ajv@^8.11.0 --save-dev --legacy-peer-deps

# Set environment variable
export REACT_APP_API_URL=http://localhost:5000

# Jalankan React development server
npm start
```

Frontend akan berjalan di: **http://localhost:3000**

### D. Menjalankan Semua Sekaligus (Script)

```bash
#!/bin/bash
# run_local.sh

echo "[*] Starting ShopVuln Lab..."

# Start MySQL
sudo systemctl start mysql
echo "[+] MySQL started"

# Start Backend
cd backend
node server.js &
BACKEND_PID=$!
echo "[+] Backend started (PID: $BACKEND_PID)"

# Wait for backend
sleep 2

# Start Frontend
cd ../frontend
export REACT_APP_API_URL=http://localhost:5000
npm start &
FRONTEND_PID=$!
echo "[+] Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "[✅] ShopVuln Lab Running!"
echo "    Frontend → http://localhost:3000"
echo "    Backend  → http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID; sudo systemctl stop mysql" EXIT
wait
```

```bash
chmod +x run_local.sh
./run_local.sh
```

---

## ✅ Verifikasi Instalasi

Jalankan perintah berikut untuk memastikan semua berjalan dengan benar:

### Cek Container Status

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Output yang diharapkan:
```
NAMES               STATUS          PORTS
shopvuln_frontend   Up X minutes    0.0.0.0:3000->80/tcp
shopvuln_backend    Up X minutes    0.0.0.0:5000->5000/tcp
shopvuln_db         Up X minutes    0.0.0.0:3306->3306/tcp
```

### Cek API Health

```bash
curl http://localhost:5000/api/health
```

Output:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "node_version": "v18.x.x",
  "platform": "linux",
  "environment": "development",
  "db_host": "mysql"
}
```

### Cek Koneksi Database

```bash
# Via Docker
docker exec -it shopvuln_db mysql -u root -prootpassword -e \
  "USE shopvuln; SELECT id, username, email, role FROM users;"
```

Output yang diharapkan:
```
+----+-----------+------------------------+----------+
| id | username  | email                  | role     |
+----+-----------+------------------------+----------+
|  1 | admin     | admin@shopvuln.local   | admin    |
|  2 | john_doe  | john@example.com       | customer |
|  3 | jane_smith| jane@example.com       | customer |
+----+-----------+------------------------+----------+
```

### Cek Produk via API

```bash
curl http://localhost:5000/api/products | python3 -m json.tool | head -40
```

### Cek Exposed Files (Google Dork targets)

```bash
curl http://localhost:5000/robots.txt
curl http://localhost:5000/backup/db_backup_2024.sql | head -20
curl http://localhost:5000/config/config.txt
```

---

## 🌐 Akses Aplikasi

### URL Penting

| Service | URL | Keterangan |
|---------|-----|-----------|
| Frontend | http://localhost:3000 | Website utama |
| Backend API | http://localhost:5000 | REST API |
| Health Check | http://localhost:5000/api/health | Info server |
| robots.txt | http://localhost:5000/robots.txt | Google Dork target |
| DB Backup | http://localhost:5000/backup/db_backup_2024.sql | Credential leak |
| Config File | http://localhost:5000/config/config.txt | Secret key leak |
| Admin Notes | http://localhost:5000/admin/notes.txt | Admin credential leak |

### Halaman Website

| Halaman | URL | Akses |
|---------|-----|-------|
| Home (Product List) | http://localhost:3000/ | Public |
| Login | http://localhost:3000/login | Public |
| Register | http://localhost:3000/register | Public |
| Product Detail | http://localhost:3000/products/1 | Public |
| Dashboard | http://localhost:3000/dashboard | Login required |
| Cart | http://localhost:3000/cart | Login required |
| Admin Panel | http://localhost:3000/admin | Admin role only |

---

## 👥 Akun Default

| Username | Password | Role | Keterangan |
|----------|----------|------|-----------|
| `admin` | `admin123` | Admin | Akun admin utama |
| `bob_admin` | `bob2024!` | Admin | Akun admin cadangan |
| `john_doe` | `password123` | Customer | User biasa |
| `jane_smith` | `qwerty` | Customer | User biasa |
| `alice` | `123456` | Customer | User biasa |

> ⚠️ Semua password **disimpan dalam bentuk plaintext** di database — ini adalah intentional vulnerability untuk workshop!

---

## 🐳 Manajemen Container

### Perintah Docker Umum

```bash
# Lihat semua container yang berjalan
docker ps

# Lihat semua container (termasuk yang stopped)
docker ps -a

# Lihat log container tertentu
docker logs shopvuln_backend
docker logs shopvuln_backend -f      # Follow/live logs
docker logs shopvuln_db --tail 50    # 50 baris terakhir

# Masuk ke dalam container (shell)
docker exec -it shopvuln_backend sh
docker exec -it shopvuln_db bash
docker exec -it shopvuln_frontend sh

# Restart container tertentu
docker restart shopvuln_backend

# Stop semua container lab
docker compose down

# Stop + hapus semua data (reset total)
docker compose down -v

# Rebuild image (setelah edit kode)
docker compose build --no-cache
docker compose up -d
```

### Rebuild Setelah Edit Kode

```bash
# Rebuild backend saja
docker compose build backend
docker compose up -d backend

# Rebuild frontend saja
docker compose build frontend
docker compose up -d frontend

# Rebuild semua
docker compose up --build -d
```

### Akses MySQL Langsung

```bash
# Dari host machine
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword shopvuln

# Via Docker exec
docker exec -it shopvuln_db mysql -u root -prootpassword shopvuln

# Query langsung
docker exec shopvuln_db mysql -u root -prootpassword shopvuln \
  -e "SELECT * FROM users;"
```

---

## 🔧 Troubleshooting

### ❌ Error: Port 3000 / 5000 already in use

```bash
# Cari proses yang menggunakan port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill proses
sudo kill -9 $(sudo lsof -t -i :3000)
sudo kill -9 $(sudo lsof -t -i :5000)

# Atau ubah port di docker-compose.yml:
# ports:
#   - "3001:80"   # ubah dari 3000 ke 3001
```

### ❌ Error: MySQL container unhealthy

```bash
# Lihat log MySQL
docker logs shopvuln_db

# Reset database volume dan restart
docker compose down -v
docker compose up -d

# Cek apakah MySQL port 3306 bentrok dengan local MySQL
sudo systemctl stop mysql    # Stop local MySQL
docker compose up -d
```

### ❌ Error: Backend cannot connect to DB

```bash
# Pastikan db container sudah healthy dulu
docker ps | grep shopvuln_db

# Restart backend setelah db ready
docker compose restart backend

# Lihat error detail
docker logs shopvuln_backend
```

### ❌ Error: Frontend build failed (ajv module)

```bash
# Ini error kompatibilitas Node 18 + react-scripts
# Sudah di-fix di Dockerfile dengan:
# RUN npm install ajv@^8.11.0 --save-dev --legacy-peer-deps

# Jika masih error, rebuild dengan no-cache:
docker compose build --no-cache frontend
docker compose up -d frontend
```

### ❌ Website tampil blank / CORS error

```bash
# Pastikan backend berjalan dan accessible
curl http://localhost:5000/api/health

# Cek CORS di browser console (F12 > Console)
# Pastikan REACT_APP_API_URL sesuai

# Cek environment variable frontend
docker exec shopvuln_frontend env | grep REACT
```

### ❌ Cannot pull Docker images (offline)

```bash
# Simpan image setelah build pertama
docker save e-commerce-frontend:latest | gzip > frontend.tar.gz
docker save e-commerce-backend:latest | gzip > backend.tar.gz
docker save mysql:8.0 | gzip > mysql.tar.gz

# Load di mesin lain (offline)
docker load < frontend.tar.gz
docker load < backend.tar.gz
docker load < mysql.tar.gz

# Jalankan
docker compose up -d
```

> 💡 **Tip untuk Workshop offline:** Simpan semua image setelah build pertama untuk distribusi ke peserta tanpa internet.

---

## 📦 Reset & Cleanup

```bash
# Stop dan hapus container saja (data tersimpan)
docker compose down

# Stop, hapus container + volume (reset database)
docker compose down -v

# Hapus semua image project
docker rmi e-commerce-frontend e-commerce-backend

# Full cleanup Docker (HATI-HATI: menghapus semua container/image/volume)
docker system prune -a --volumes
```

---

*Setup Guide v1.0 — ShopVuln CyberSecurity Workshop*
