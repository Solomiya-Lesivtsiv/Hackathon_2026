from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import csv
import io
from datetime import datetime
from models import Order, OrderCreate, OrderUpdate, TaxBreakdown, TaxCalculationRequest, OrderFilters
from tax_calculator import TaxCalculator
from database import Database

app = FastAPI(title="BetterMe Drone Delivery - Tax Admin API")

# CORS middleware to allow React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = Database()
tax_calculator = TaxCalculator()


@app.get("/")
async def root():
    return {
        "message": "BetterMe Drone Delivery Tax Admin API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/orders", response_model=dict)
async def get_orders(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get paginated list of orders with optional filters"""
    filters = OrderFilters(
        search=search,
        status=status,
        priority=priority,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
    )
    
    result = db.get_orders(page=page, limit=limit, filters=filters)
    return result


@app.get("/api/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a single order by ID"""
    order = db.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/api/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create a new order with automatic tax calculation"""
    # Calculate tax based on GPS coordinates
    tax_breakdown = tax_calculator.calculate_tax(
        latitude=order_data.delivery_lat,
        longitude=order_data.delivery_lng,
        subtotal=order_data.subtotal
    )
    
    # Create order with calculated tax
    order = db.create_order(order_data, tax_breakdown)
    return order


@app.put("/api/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderUpdate):
    """Update an existing order"""
    order = db.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Recalculate tax if delivery location changed
    if order_data.delivery_lat or order_data.delivery_lng:
        lat = order_data.delivery_lat or order.delivery_lat
        lng = order_data.delivery_lng or order.delivery_lng
        subtotal = order_data.subtotal or order.subtotal
        
        tax_breakdown = tax_calculator.calculate_tax(
            latitude=lat,
            longitude=lng,
            subtotal=subtotal
        )
        order_data.tax_breakdown = tax_breakdown
    
    updated_order = db.update_order(order_id, order_data)
    return updated_order


@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str):
    """Delete an order"""
    success = db.delete_order(order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}


@app.post("/api/orders/calculate-tax", response_model=TaxBreakdown)
async def calculate_tax(request: TaxCalculationRequest):
    """Calculate tax for given coordinates and amount"""
    tax_breakdown = tax_calculator.calculate_tax(
        latitude=request.latitude,
        longitude=request.longitude,
        subtotal=request.subtotal
    )
    return tax_breakdown


@app.post("/api/orders/import-csv")
async def import_csv(file: UploadFile = File(...)):
    """Import orders from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        imported_orders = []
        errors = []
        
        for idx, row in enumerate(csv_reader, start=2):  # Start at 2 (row 1 is header)
            try:
                # Validate required fields
                required_fields = ['order_id', 'customer_name', 'customer_email', 
                                   'delivery_address', 'delivery_lat', 'delivery_lng', 
                                   'subtotal', 'priority']
                
                missing_fields = [field for field in required_fields if not row.get(field)]
                if missing_fields:
                    errors.append({
                        "row": idx,
                        "error": f"Missing required fields: {', '.join(missing_fields)}"
                    })
                    continue
                
                # Create order data
                order_data = OrderCreate(
                    order_id=row['order_id'],
                    customer_name=row['customer_name'],
                    customer_email=row['customer_email'],
                    customer_phone=row.get('customer_phone', ''),
                    delivery_address=row['delivery_address'],
                    delivery_lat=float(row['delivery_lat']),
                    delivery_lng=float(row['delivery_lng']),
                    subtotal=float(row['subtotal']),
                    priority=row['priority'],
                    status=row.get('status', 'pending'),
                    items=row.get('items', '').split(';') if row.get('items') else [],
                )
                
                # Calculate tax
                tax_breakdown = tax_calculator.calculate_tax(
                    latitude=order_data.delivery_lat,
                    longitude=order_data.delivery_lng,
                    subtotal=order_data.subtotal
                )
                
                # Create order
                order = db.create_order(order_data, tax_breakdown)
                imported_orders.append(order)
                
            except ValueError as e:
                errors.append({
                    "row": idx,
                    "error": f"Invalid data format: {str(e)}"
                })
            except Exception as e:
                errors.append({
                    "row": idx,
                    "error": str(e)
                })
        
        return {
            "success": len(imported_orders),
            "failed": len(errors),
            "orders": imported_orders,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


@app.get("/api/stats")
async def get_stats():
    """Get dashboard statistics"""
    stats = db.get_statistics()
    return stats


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
