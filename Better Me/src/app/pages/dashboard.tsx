import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Package, Upload, PlusCircle, TrendingUp, DollarSign, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { fetchStats, fetchOrders, type Stats, type Order } from "../services/api";

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchOrders({ page: "1", limit: "5" }),
    ])
      .then(([s, r]) => {
        setStats(s);
        setRecentOrders(r.orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to BetterMe Drone Delivery Tax Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalOrders ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Deliveries completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.totalRevenue ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Including tax collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.totalTax ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg rate: {(stats?.avgTaxRate ?? 0).toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jurisdictions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4+</div>
            <p className="text-xs text-muted-foreground mt-1">NY State counties</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/orders">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
                <div className="text-left"><div className="font-medium">View Orders</div><div className="text-xs text-muted-foreground">Browse all deliveries</div></div>
              </Button>
            </Link>
            <Link to="/import">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Upload className="h-5 w-5 text-primary" /></div>
                <div className="text-left"><div className="font-medium">Import CSV</div><div className="text-xs text-muted-foreground">Bulk upload orders</div></div>
              </Button>
            </Link>
            <Link to="/create">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><PlusCircle className="h-5 w-5 text-primary" /></div>
                <div className="text-left"><div className="font-medium">Create Order</div><div className="text-xs text-muted-foreground">Add single order</div></div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/orders"><Button variant="link" className="text-primary">View All →</Button></Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders yet. Create one or import a CSV!</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                    <div>
                      <div className="font-medium font-mono text-sm">{order.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.timestamp).toLocaleDateString()}
                        {order.jurisdictions.length > 1 && ` · ${order.jurisdictions[1]?.name}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#22C55E]">${order.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{order.taxRate.toFixed(2)}% tax</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
