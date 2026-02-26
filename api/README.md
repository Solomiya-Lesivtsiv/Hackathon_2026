# BetterMe Drone Delivery - Python Backend API

FastAPI backend for handling tax calculations, order management, and CSV imports.

## Setup

1. **Create a virtual environment:**
```bash
cd api
python -m venv venv
```

2. **Activate the virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## Running the API

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

## API Endpoints

### Orders
- `GET /api/orders` - Get paginated list of orders with filters
- `GET /api/orders/{order_id}` - Get single order
- `POST /api/orders` - Create new order (auto-calculates tax)
- `PUT /api/orders/{order_id}` - Update order
- `DELETE /api/orders/{order_id}` - Delete order

### Tax Calculation
- `POST /api/orders/calculate-tax` - Calculate tax for given GPS coordinates

### CSV Import
- `POST /api/orders/import-csv` - Import orders from CSV file

### Statistics
- `GET /api/stats` - Get dashboard statistics

## Query Parameters (GET /api/orders)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in order ID, customer name, email, address
- `status` - Filter by status (pending, processing, in_transit, delivered, cancelled)
- `priority` - Filter by priority (standard, express, urgent)
- `min_amount` - Minimum order total
- `max_amount` - Maximum order total
- `start_date` - Filter orders from this date
- `end_date` - Filter orders until this date

## Tax Calculation Logic

The API uses GPS coordinates to determine:
1. **State Tax**: 4% (applies to all NY locations)
2. **County Tax**: 4-4.75% (varies by county)
3. **City Tax**: 4.5% (only NYC - 5 boroughs)
4. **Special District Tax**: 0-0.5% (specific zones like Manhattan CBD, JFK Airport)

Supported NY jurisdictions:
- NYC (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- Nassau County
- Suffolk County
- Westchester County
- Erie County (Buffalo)
- Monroe County (Rochester)
- Albany County

## CSV Import Format

Required columns:
- `order_id` - Unique order identifier
- `customer_name` - Customer full name
- `customer_email` - Valid email address
- `delivery_address` - Full delivery address
- `delivery_lat` - Latitude (-90 to 90)
- `delivery_lng` - Longitude (-180 to 180)
- `subtotal` - Order subtotal (before tax)
- `priority` - standard, express, or urgent

Optional columns:
- `customer_phone` - Phone number
- `status` - Order status (default: pending)
- `items` - Semicolon-separated item list

## Database

Currently using in-memory storage with 50 mock orders.

For production, replace `database.py` with:
- PostgreSQL with SQLAlchemy
- MongoDB with Motor
- Supabase
- Or any other database

## Architecture

```
api/
├── main.py              # FastAPI app & routes
├── models.py            # Pydantic models
├── tax_calculator.py    # Tax calculation logic
├── database.py          # Mock database (replace in production)
└── requirements.txt     # Python dependencies
```

## Next Steps

1. Connect to a real database (PostgreSQL/MongoDB/Supabase)
2. Add authentication & authorization
3. Implement rate limiting
4. Add logging and monitoring
5. Deploy to production (AWS, GCP, Heroku, etc.)
