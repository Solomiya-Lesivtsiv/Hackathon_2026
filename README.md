# BetterMe — Drone Delivery Tax Admin Panel

Full-stack web application for managing drone delivery orders with **automatic NY State sales tax calculation** based on GPS coordinates.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+

### 1. Install dependencies

```bash
cd "Better Me"
pip install -r api/requirements.txt
npm install --legacy-peer-deps
```

### 2. Run (single command)

```bash
npm run start
```

This launches both the backend (Python, port 8000) and frontend (Vite, port 5173) simultaneously.

### 3. Open in browser

**http://localhost:5173**

### Default accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@betterme.com | admin123 |
| User | user@example.com | user123 |

> To stop both servers press **Ctrl+C**.

---

## Features

### Tax Calculation Engine
- Automatic NY State sales tax based on GPS coordinates
- Source: **Publication 718** (NY Department of Taxation, effective March 2025)
- Tax components: State (4%) + County (0–4.75%) + City (0–4.5%) + MCTD surcharge (0–0.375%)
- 24 NY counties supported with correct composite rates

### Order Management
- Create orders with live tax preview as you type coordinates
- Import orders in bulk via CSV upload (drag & drop supported)
- Orders list with pagination, filtering by date, subtotal, tax rate, order ID
- Expandable rows showing full tax breakdown per order

### Authentication & Authorization
- JWT-based authentication (register, login, logout)
- Role-based access control: **Admin** and **User** roles
- Admin sees all orders; regular users see only their own
- Protected routes with automatic redirect to login

### Admin Panel
- User management: view, edit role, activate/deactivate, delete users
- Activity log: tracks logins, registrations, order creation, CSV imports
- Statistics dashboard: total users, active users, administrators

### Profile
- View and edit: name, email, phone, company
- Role badge display
- Member since date

---

## Architecture

```
Better Me/
├── api/                        # Python Backend (FastAPI)
│   ├── main.py                 # API routes: auth, admin, orders
│   ├── auth.py                 # JWT tokens + password hashing
│   ├── models.py               # Pydantic models
│   ├── database.py             # SQLite (users, orders, activity_log)
│   ├── tax_calculator.py       # GPS → tax rate (Publication 718)
│   ├── requirements.txt        # Python dependencies
│   └── sample_import.csv       # Example CSV for testing import
│
├── src/app/                    # React Frontend (TypeScript)
│   ├── App.tsx                 # Root with AuthProvider
│   ├── routes.tsx              # React Router (protected + admin routes)
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state (JWT in localStorage)
│   ├── services/
│   │   └── api.ts              # API client (fetch + auth headers)
│   ├── pages/
│   │   ├── dashboard.tsx        # Stats cards + recent orders
│   │   ├── orders-list.tsx      # Filterable table with pagination
│   │   ├── create-order.tsx     # Form with live tax preview
│   │   ├── import-csv.tsx       # Drag & drop CSV upload
│   │   ├── ProfilePage.tsx      # User profile editor
│   │   ├── AdminOnlyPage.tsx    # Admin dashboard + user management
│   │   ├── user-management.tsx  # Search & edit users
│   │   ├── LoginPage.tsx        # Login form
│   │   └── RegisterPage.tsx     # Registration form
│   └── components/              # UI components (shadcn/ui)
│
├── package.json                # npm scripts (dev, start, build)
├── start.mjs                   # Launcher (backend + frontend)
└── vite.config.ts              # Vite config
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Current user info |
| PUT | `/api/auth/profile` | Update profile |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (paginated, filtered) |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create order (auto tax calc) |
| POST | `/api/orders/calculate-tax` | Preview tax for coordinates |
| POST | `/api/orders/import-csv` | Bulk import from CSV |
| GET | `/api/stats` | Dashboard statistics |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users with stats |
| PUT | `/api/admin/users/:id` | Update user (role, status) |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/activity` | Activity log |

Interactive API docs: **http://localhost:8000/docs**

---

## Tax Rates (Publication 718)

| Location | State | County | City | MCTD | **Composite** |
|----------|-------|--------|------|------|---------------|
| Manhattan, Brooklyn, Queens, Bronx, Staten Island | 4% | — | 4.5% | 0.375% | **8.875%** |
| Nassau County | 4% | 4.25% | — | 0.375% | **8.625%** |
| Suffolk County | 4% | 4.375% | — | 0.375% | **8.75%** |
| Erie County (Buffalo) | 4% | 4.75% | — | — | **8.75%** |
| Westchester County | 4% | 4% | — | 0.375% | **8.375%** |
| Albany County | 4% | 4% | — | — | **8%** |
| Dutchess County | 4% | 3.75% | — | 0.375% | **8.125%** |

---

## CSV Import Format

Required columns: `id`, `latitude`, `longitude`, `subtotal`
Optional: `timestamp`

```csv
id,latitude,longitude,timestamp,subtotal
ORD-001,40.7484,-73.9857,2026-02-28T10:30:00Z,125.50
ORD-002,42.8864,-78.8784,2026-02-28T11:00:00Z,89.99
```

A sample file is included: `api/sample_import.csv`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Routing | React Router 7 |
| Backend | Python 3, FastAPI, Pydantic |
| Database | SQLite (via sqlite3) |
| Auth | JWT (python-jose), SHA-256 password hashing |
| Build | Vite 6 |

---

## Running Backend Independently

```bash
cd "Better Me/api"
pip install -r requirements.txt
python main.py
```

Backend at http://localhost:8000 · Swagger docs at http://localhost:8000/docs

## Running Frontend Independently

```bash
cd "Better Me"
npm install --legacy-peer-deps
npm run dev
```

Frontend at http://localhost:5173 (requires backend running on port 8000)
