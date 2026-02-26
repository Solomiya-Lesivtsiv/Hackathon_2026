# BetterMe Drone Delivery - Full Stack Architecture

## Overview
Complete full-stack application with React TypeScript frontend and Python FastAPI backend.

## Frontend (React + TypeScript)
- **Location**: `/src/app/`
- **Tech Stack**: React, TypeScript, Tailwind CSS, React Router
- **Features**:
  - Dashboard with statistics
  - Orders list with filtering & pagination
  - CSV import with drag-and-drop
  - Create order form with live tax preview
  - Responsive design (desktop + mobile)

## Backend (Python + FastAPI)
- **Location**: `/api/`
- **Tech Stack**: FastAPI, Pydantic, Uvicorn
- **Features**:
  - RESTful API endpoints
  - GPS-based tax calculation
  - Order CRUD operations
  - CSV bulk import processing
  - Real-time statistics
  - In-memory database (easily replaceable)

## How to Run

### 1. Start the Python Backend
```bash
cd api
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```
Backend runs on: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 2. Update Frontend to Use Backend
The React frontend currently uses mock data. To connect it to the Python API, you'll need to:
- Create API service layer in `/src/app/services/api.ts`
- Replace mock data calls with fetch/axios calls to `http://localhost:8000/api/*`
- Update components to use the API service

### 3. Start the Frontend
```bash
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (paginated, filtered) |
| GET | `/api/orders/{id}` | Get single order |
| POST | `/api/orders` | Create order (auto-calculates tax) |
| PUT | `/api/orders/{id}` | Update order |
| DELETE | `/api/orders/{id}` | Delete order |
| POST | `/api/orders/calculate-tax` | Calculate tax for GPS coords |
| POST | `/api/orders/import-csv` | Bulk import from CSV |
| GET | `/api/stats` | Dashboard statistics |

## Tax Calculation

The Python backend calculates taxes based on GPS coordinates:

1. **State Tax**: 4% (all NY locations)
2. **County Tax**: 4-4.75% (varies by county)
3. **City Tax**: 4.5% (NYC only - 5 boroughs)
4. **Special Districts**: 0-0.5% (Manhattan CBD, JFK Airport, etc.)

### Supported Jurisdictions
- NYC: Manhattan, Brooklyn, Queens, Bronx, Staten Island
- Long Island: Nassau County, Suffolk County
- Upstate: Westchester, Erie (Buffalo), Monroe (Rochester), Albany

## Data Flow

```
User Action (Frontend)
    ↓
React Component
    ↓
API Service Layer (to be created)
    ↓
HTTP Request → Backend API (http://localhost:8000)
    ↓
FastAPI Route (main.py)
    ↓
Tax Calculator / Database
    ↓
JSON Response ← Backend
    ↓
Update React State
    ↓
Re-render UI
```

## Next Steps to Connect Frontend & Backend

1. **Create API Service**:
```typescript
// /src/app/services/api.ts
const API_BASE = 'http://localhost:8000/api';

export const ordersApi = {
  getOrders: (params) => fetch(`${API_BASE}/orders?${new URLSearchParams(params)}`),
  createOrder: (data) => fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  // ... other endpoints
};
```

2. **Update Components** to use the API service instead of mock data

3. **Handle Loading & Error States** for API calls

4. **Add Authentication** (if needed)

## Production Deployment

### Backend
- Deploy to: AWS Lambda, Google Cloud Run, Heroku, Railway, Render
- Add: Real database (PostgreSQL/MongoDB), authentication, logging

### Frontend
- Deploy to: Vercel, Netlify, AWS S3 + CloudFront
- Update: API base URL to production backend

## File Structure

```
/
├── api/                          # Python Backend
│   ├── main.py                   # FastAPI app & routes
│   ├── models.py                 # Pydantic data models
│   ├── tax_calculator.py         # Tax calculation logic
│   ├── database.py               # Mock database
│   ├── requirements.txt          # Python dependencies
│   ├── sample_import.csv         # CSV test file
│   └── README.md                 # Backend docs
│
├── src/app/                      # React Frontend
│   ├── App.tsx                   # Main component
│   ├── routes.tsx                # React Router config
│   ├── components/               # Reusable components
│   ├── pages/                    # Page components
│   ├── data/                     # Mock data (to be replaced)
│   └── [other frontend files]
│
└── [other project files]
```
