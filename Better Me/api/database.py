from typing import List, Optional, Dict, Any
from models import Order, OrderCreate, OrderUpdate, TaxBreakdown, OrderFilters
from datetime import datetime
import uuid


class Database:
    """
    Mock database implementation using in-memory storage.
    In production, replace with PostgreSQL, MongoDB, or similar.
    """
    
    def __init__(self):
        self.orders: Dict[str, Order] = {}
        self._init_mock_data()
    
    def _init_mock_data(self):
        """Initialize with 50 mock orders for testing"""
        from tax_calculator import TaxCalculator
        
        tax_calc = TaxCalculator()
        
        mock_orders_data = [
            # Manhattan orders
            {"name": "John Smith", "email": "john.smith@email.com", "phone": "(555) 123-4567",
             "address": "350 5th Ave, New York, NY 10118", "lat": 40.7484, "lng": -73.9857,
             "subtotal": 89.99, "priority": "express", "status": "delivered"},
            
            {"name": "Sarah Johnson", "email": "sarah.j@email.com", "phone": "(555) 234-5678",
             "address": "1 Wall St, New York, NY 10005", "lat": 40.7074, "lng": -74.0113,
             "subtotal": 124.50, "priority": "urgent", "status": "delivered"},
            
            {"name": "Michael Chen", "email": "m.chen@email.com", "phone": "(555) 345-6789",
             "address": "Times Square, New York, NY 10036", "lat": 40.7580, "lng": -73.9855,
             "subtotal": 67.25, "priority": "standard", "status": "in_transit"},
            
            # Brooklyn orders
            {"name": "Emily Davis", "email": "emily.davis@email.com", "phone": "(555) 456-7890",
             "address": "Brooklyn Bridge Park, Brooklyn, NY 11201", "lat": 40.7021, "lng": -73.9969,
             "subtotal": 156.80, "priority": "express", "status": "processing"},
            
            {"name": "David Wilson", "email": "d.wilson@email.com", "phone": "(555) 567-8901",
             "address": "Prospect Park West, Brooklyn, NY 11215", "lat": 40.6602, "lng": -73.9690,
             "subtotal": 93.40, "priority": "standard", "status": "pending"},
            
            # Queens orders
            {"name": "Jennifer Martinez", "email": "jen.martinez@email.com", "phone": "(555) 678-9012",
             "address": "JFK Airport, Queens, NY 11430", "lat": 40.6413, "lng": -73.7781,
             "subtotal": 210.00, "priority": "urgent", "status": "delivered"},
            
            {"name": "Robert Taylor", "email": "r.taylor@email.com", "phone": "(555) 789-0123",
             "address": "Flushing Meadows Park, Queens, NY 11368", "lat": 40.7406, "lng": -73.8418,
             "subtotal": 78.60, "priority": "express", "status": "in_transit"},
            
            # Bronx orders
            {"name": "Lisa Anderson", "email": "lisa.anderson@email.com", "phone": "(555) 890-1234",
             "address": "Yankee Stadium, Bronx, NY 10451", "lat": 40.8296, "lng": -73.9262,
             "subtotal": 145.20, "priority": "standard", "status": "delivered"},
            
            {"name": "James Thomas", "email": "james.t@email.com", "phone": "(555) 901-2345",
             "address": "Bronx Zoo, Bronx, NY 10460", "lat": 40.8506, "lng": -73.8769,
             "subtotal": 54.30, "priority": "express", "status": "pending"},
            
            # Staten Island orders
            {"name": "Patricia Moore", "email": "patricia.moore@email.com", "phone": "(555) 012-3456",
             "address": "Staten Island Ferry Terminal, NY 10301", "lat": 40.6438, "lng": -74.0739,
             "subtotal": 112.90, "priority": "standard", "status": "processing"},
            
            # Long Island - Nassau County
            {"name": "Christopher Lee", "email": "chris.lee@email.com", "phone": "(555) 123-7890",
             "address": "Roosevelt Field Mall, Garden City, NY 11530", "lat": 40.7370, "lng": -73.6107,
             "subtotal": 189.75, "priority": "express", "status": "delivered"},
            
            {"name": "Amanda White", "email": "amanda.w@email.com", "phone": "(555) 234-8901",
             "address": "Jones Beach, Wantagh, NY 11793", "lat": 40.5906, "lng": -73.5087,
             "subtotal": 76.40, "priority": "standard", "status": "in_transit"},
            
            # Additional diverse orders
            {"name": "Daniel Harris", "email": "daniel.harris@email.com", "phone": "(555) 345-9012",
             "address": "Central Park South, New York, NY 10019", "lat": 40.7664, "lng": -73.9786,
             "subtotal": 234.60, "priority": "urgent", "status": "delivered"},
            
            {"name": "Michelle Clark", "email": "michelle.c@email.com", "phone": "(555) 456-0123",
             "address": "Williamsburg Bridge, Brooklyn, NY 11211", "lat": 40.7134, "lng": -73.9630,
             "subtotal": 98.20, "priority": "express", "status": "processing"},
            
            {"name": "Kevin Rodriguez", "email": "k.rodriguez@email.com", "phone": "(555) 567-1234",
             "address": "LaGuardia Airport, Queens, NY 11371", "lat": 40.7769, "lng": -73.8740,
             "subtotal": 167.80, "priority": "urgent", "status": "in_transit"},
        ]
        
        # Create 50 orders by cycling through the mock data
        for i in range(50):
            base_data = mock_orders_data[i % len(mock_orders_data)]
            
            # Create unique order ID
            order_id = f"ORD-{str(i+1).zfill(5)}"
            
            # Vary the data slightly
            subtotal = base_data["subtotal"] + (i * 2.5)
            
            # Calculate tax
            tax_breakdown = tax_calc.calculate_tax(
                latitude=base_data["lat"],
                longitude=base_data["lng"],
                subtotal=subtotal
            )
            
            # Create order
            order = Order(
                id=str(uuid.uuid4()),
                order_id=order_id,
                customer_name=f"{base_data['name']} {chr(65 + (i // len(mock_orders_data)))}",
                customer_email=base_data["email"],
                customer_phone=base_data["phone"],
                delivery_address=base_data["address"],
                delivery_lat=base_data["lat"],
                delivery_lng=base_data["lng"],
                subtotal=round(subtotal, 2),
                tax_breakdown=tax_breakdown,
                total=round(subtotal + tax_breakdown.total_tax, 2),
                priority=base_data["priority"],
                status=base_data["status"],
                items=[f"Item {j+1}" for j in range((i % 3) + 1)],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            self.orders[order.id] = order
    
    def get_orders(self, page: int = 1, limit: int = 10, filters: Optional[OrderFilters] = None) -> Dict[str, Any]:
        """Get paginated list of orders with optional filters"""
        orders_list = list(self.orders.values())
        
        # Apply filters
        if filters:
            if filters.search:
                search_lower = filters.search.lower()
                orders_list = [
                    o for o in orders_list
                    if search_lower in o.order_id.lower()
                    or search_lower in o.customer_name.lower()
                    or search_lower in o.customer_email.lower()
                    or search_lower in o.delivery_address.lower()
                ]
            
            if filters.status:
                orders_list = [o for o in orders_list if o.status == filters.status]
            
            if filters.priority:
                orders_list = [o for o in orders_list if o.priority == filters.priority]
            
            if filters.min_amount is not None:
                orders_list = [o for o in orders_list if o.total >= filters.min_amount]
            
            if filters.max_amount is not None:
                orders_list = [o for o in orders_list if o.total <= filters.max_amount]
        
        # Sort by created_at descending
        orders_list.sort(key=lambda x: x.created_at, reverse=True)
        
        # Pagination
        total = len(orders_list)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_orders = orders_list[start_idx:end_idx]
        
        return {
            "orders": paginated_orders,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    
    def get_order(self, order_id: str) -> Optional[Order]:
        """Get a single order by ID"""
        return self.orders.get(order_id)
    
    def create_order(self, order_data: OrderCreate, tax_breakdown: TaxBreakdown) -> Order:
        """Create a new order"""
        order_id = str(uuid.uuid4())
        total = order_data.subtotal + tax_breakdown.total_tax
        
        order = Order(
            id=order_id,
            order_id=order_data.order_id,
            customer_name=order_data.customer_name,
            customer_email=order_data.customer_email,
            customer_phone=order_data.customer_phone,
            delivery_address=order_data.delivery_address,
            delivery_lat=order_data.delivery_lat,
            delivery_lng=order_data.delivery_lng,
            subtotal=order_data.subtotal,
            tax_breakdown=tax_breakdown,
            total=round(total, 2),
            priority=order_data.priority,
            status=order_data.status,
            items=order_data.items,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.orders[order_id] = order
        return order
    
    def update_order(self, order_id: str, order_data: OrderUpdate) -> Optional[Order]:
        """Update an existing order"""
        order = self.orders.get(order_id)
        if not order:
            return None
        
        # Update fields
        update_dict = order_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(order, key, value)
        
        # Recalculate total if tax_breakdown or subtotal changed
        if order_data.tax_breakdown or order_data.subtotal:
            order.total = round(order.subtotal + order.tax_breakdown.total_tax, 2)
        
        order.updated_at = datetime.now()
        return order
    
    def delete_order(self, order_id: str) -> bool:
        """Delete an order"""
        if order_id in self.orders:
            del self.orders[order_id]
            return True
        return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Calculate dashboard statistics"""
        orders_list = list(self.orders.values())
        
        total_orders = len(orders_list)
        total_revenue = sum(o.total for o in orders_list)
        total_tax = sum(o.tax_breakdown.total_tax for o in orders_list)
        
        # Status breakdown
        status_counts = {}
        for order in orders_list:
            status_counts[order.status] = status_counts.get(order.status, 0) + 1
        
        # Priority breakdown
        priority_counts = {}
        for order in orders_list:
            priority_counts[order.priority] = priority_counts.get(order.priority, 0) + 1
        
        # Average order value
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Average tax rate
        avg_tax_rate = (total_tax / (total_revenue - total_tax)) if total_revenue > total_tax else 0
        
        return {
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "total_tax_collected": round(total_tax, 2),
            "average_order_value": round(avg_order_value, 2),
            "average_tax_rate": round(avg_tax_rate, 4),
            "status_breakdown": status_counts,
            "priority_breakdown": priority_counts,
            "pending_orders": status_counts.get("pending", 0),
            "processing_orders": status_counts.get("processing", 0),
            "in_transit_orders": status_counts.get("in_transit", 0),
            "delivered_orders": status_counts.get("delivered", 0),
        }
