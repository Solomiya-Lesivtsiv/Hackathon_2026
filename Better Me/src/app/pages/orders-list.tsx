import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp, Upload, Plus, X, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { fetchOrders, type Order, type OrdersResponse } from "../services/api";

export function OrdersList() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrdersResponse>({ orders: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filters, setFilters] = useState({
    dateFrom: "", dateTo: "", subtotalMin: "", subtotalMax: "", taxRate: "all", searchId: "",
  });

  const loadOrders = () => {
    setLoading(true);
    fetchOrders({
      page: String(currentPage), limit: String(rowsPerPage),
      searchId: filters.searchId, dateFrom: filters.dateFrom, dateTo: filters.dateTo,
      subtotalMin: filters.subtotalMin, subtotalMax: filters.subtotalMax,
      taxRate: filters.taxRate,
    })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [currentPage, rowsPerPage]);

  const applyFilters = () => { setCurrentPage(1); loadOrders(); };
  const clearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", subtotalMin: "", subtotalMax: "", taxRate: "all", searchId: "" });
    setCurrentPage(1);
    setTimeout(loadOrders, 0);
  };

  const toggleRowExpansion = (orderId: string) => {
    const n = new Set(expandedRows);
    n.has(orderId) ? n.delete(orderId) : n.add(orderId);
    setExpandedRows(n);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getBadgeColor = (type: string) => {
    const c: Record<string, string> = {
      State: "bg-blue-100 text-blue-800", County: "bg-purple-100 text-purple-800",
      City: "bg-green-100 text-green-800", Special: "bg-orange-100 text-orange-800",
    };
    return c[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-[1440px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">Orders</h1>
          <p className="text-muted-foreground">{data.total} order{data.total !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex gap-2">
          <Link to="/create"><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> New Order</Button></Link>
          <Link to="/import"><Button className="gap-2 bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" /> Import CSV</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div><label className="text-sm text-muted-foreground mb-1 block">Date From</label>
            <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="bg-input-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Date To</label>
            <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="bg-input-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Min Subtotal</label>
            <Input type="number" placeholder="0.00" value={filters.subtotalMin} onChange={(e) => setFilters({ ...filters, subtotalMin: e.target.value })} className="bg-input-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Max Subtotal</label>
            <Input type="number" placeholder="999.99" value={filters.subtotalMax} onChange={(e) => setFilters({ ...filters, subtotalMax: e.target.value })} className="bg-input-background" /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Tax Rate</label>
            <Select value={filters.taxRate} onValueChange={(v) => setFilters({ ...filters, taxRate: v })}>
              <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="8">8%</SelectItem>
                <SelectItem value="8.375">8.375%</SelectItem>
                <SelectItem value="8.625">8.625%</SelectItem>
                <SelectItem value="8.75">8.75%</SelectItem>
                <SelectItem value="8.875">8.875%</SelectItem>
              </SelectContent>
            </Select></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Order ID</label>
            <Input placeholder="Search ID..." value={filters.searchId} onChange={(e) => setFilters({ ...filters, searchId: e.target.value })} className="bg-input-background" /></div>
        </div>
        <div className="flex gap-3">
          <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90">Apply Filters</Button>
          <Button variant="ghost" onClick={clearFilters} className="gap-2"><X className="h-4 w-4" /> Clear</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : data.orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No orders found</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">#</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Coordinates</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Subtotal</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Tax Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Tax Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Jurisdictions</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.flatMap((order, index) => {
                    const isExpanded = expandedRows.has(order.id);
                    const startIndex = (currentPage - 1) * rowsPerPage;
                    const rows = [
                      <tr key={`${order.id}-main`} className={`border-b border-border hover:bg-accent/50 transition-colors ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{startIndex + index + 1}</td>
                        <td className="py-3 px-4"><span className="font-mono text-sm font-medium">{order.id}</span></td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(order.timestamp)}</td>
                        <td className="py-3 px-4"><div className="font-mono text-xs"><div>{order.latitude.toFixed(6)},</div><div>{order.longitude.toFixed(6)}</div></div></td>
                        <td className="py-3 px-4 text-sm">${order.subtotal.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm font-medium">{order.taxRate.toFixed(3)}%</td>
                        <td className="py-3 px-4 text-sm">${order.taxAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold" style={{ color: '#22C55E' }}>${order.total.toFixed(2)}</td>
                        <td className="py-3 px-4"><div className="flex flex-wrap gap-1">{order.jurisdictions.map((j, i) => (
                          <Badge key={i} variant="secondary" className={`text-xs ${getBadgeColor(j.type)} border-0`}>{j.type}</Badge>
                        ))}</div></td>
                        <td className="py-3 px-4"><Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(order.id)} className="gap-1">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Details
                        </Button></td>
                      </tr>
                    ];
                    if (isExpanded) {
                      rows.push(
                        <tr key={`${order.id}-details`} className="bg-muted/30">
                          <td colSpan={10} className="py-4 px-8">
                            <div className="text-sm">
                              <h4 className="font-medium mb-3">Tax Breakdown</h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div><div className="text-muted-foreground text-xs mb-1">State Rate</div><div className="font-medium">{order.taxBreakdown.state.rate}% → ${order.taxBreakdown.state.amount.toFixed(2)}</div></div>
                                <div><div className="text-muted-foreground text-xs mb-1">County Rate</div><div className="font-medium">{order.taxBreakdown.county.rate}% → ${order.taxBreakdown.county.amount.toFixed(2)}</div></div>
                                <div><div className="text-muted-foreground text-xs mb-1">City Rate</div><div className="font-medium">{order.taxBreakdown.city.rate}% → ${order.taxBreakdown.city.amount.toFixed(2)}</div></div>
                                <div><div className="text-muted-foreground text-xs mb-1">Special Rate</div><div className="font-medium">{order.taxBreakdown.special.rate}% → ${order.taxBreakdown.special.amount.toFixed(2)}</div></div>
                                <div className="border-l border-border pl-4"><div className="text-muted-foreground text-xs mb-1">Composite Tax</div><div className="font-bold text-primary">{order.taxBreakdown.composite}%</div></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3 p-3">
              {data.orders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div><div className="font-mono text-sm font-bold mb-1">{order.id}</div><div className="text-xs text-muted-foreground">{formatDate(order.timestamp)}</div></div>
                    <div className="text-right"><div className="font-bold text-lg" style={{ color: '#22C55E' }}>${order.total.toFixed(2)}</div><div className="text-xs text-muted-foreground">{order.taxRate.toFixed(3)}% tax</div></div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">{order.jurisdictions.map((j, i) => (
                    <Badge key={i} variant="secondary" className={`text-xs ${getBadgeColor(j.type)} border-0`}>{j.type}</Badge>
                  ))}</div>
                  <Button variant="outline" size="sm" onClick={() => toggleRowExpansion(order.id)} className="w-full gap-2">
                    {expandedRows.has(order.id) ? <><ChevronUp className="h-4 w-4" /> Hide Details</> : <><ChevronDown className="h-4 w-4" /> Show Details</>}
                  </Button>
                  {expandedRows.has(order.id) && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">State:</span><span>{order.taxBreakdown.state.rate}% → ${order.taxBreakdown.state.amount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">County:</span><span>{order.taxBreakdown.county.rate}% → ${order.taxBreakdown.county.amount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">City:</span><span>{order.taxBreakdown.city.rate}% → ${order.taxBreakdown.city.amount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Special:</span><span>{order.taxBreakdown.special.rate}% → ${order.taxBreakdown.special.amount.toFixed(2)}</span></div>
                      <div className="flex justify-between pt-2 border-t"><span className="font-medium">Composite:</span><span className="font-bold text-primary">{order.taxBreakdown.composite}%</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))} disabled={currentPage === data.totalPages}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
