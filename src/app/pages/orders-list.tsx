import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp, Upload, Plus, X, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { fetchOrders, type Order } from "../services/api";

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    subtotalMin: "",
    subtotalMax: "",
    taxRate: "all",
    searchId: "",
  });

  // Applied filters (only update when user clicks Apply)
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const loadOrders = async (page: number, limit: number, f: typeof filters) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (f.searchId) params.searchId = f.searchId;
      if (f.dateFrom) params.dateFrom = f.dateFrom;
      if (f.dateTo) params.dateTo = f.dateTo;
      if (f.subtotalMin) params.subtotalMin = f.subtotalMin;
      if (f.subtotalMax) params.subtotalMax = f.subtotalMax;
      if (f.taxRate && f.taxRate !== "all") params.taxRate = f.taxRate;

      const data = await fetchOrders(params);
      setOrders(data.orders);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(currentPage, rowsPerPage, appliedFilters);
  }, [currentPage, rowsPerPage, appliedFilters]);

  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const empty = {
      dateFrom: "",
      dateTo: "",
      subtotalMin: "",
      subtotalMax: "",
      taxRate: "all",
      searchId: "",
    };
    setFilters(empty);
    setCurrentPage(1);
    setAppliedFilters(empty);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      State: "bg-blue-100 text-blue-800",
      County: "bg-purple-100 text-purple-800",
      City: "bg-green-100 text-green-800",
      Special: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-[1440px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">Orders</h1>
          <p className="text-muted-foreground">
            {totalCount} order{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/create" className="hidden sm:inline-block">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </Link>
          <Link to="/create" className="sm:hidden">
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/import" className="hidden sm:inline-block">
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </Link>
          <Link to="/import" className="sm:hidden">
            <Button size="icon" className="bg-primary hover:bg-primary/90">
              <Upload className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="bg-input-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="bg-input-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Min Subtotal</label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.subtotalMin}
              onChange={(e) => setFilters({ ...filters, subtotalMin: e.target.value })}
              className="bg-input-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Max Subtotal</label>
            <Input
              type="number"
              placeholder="999.99"
              value={filters.subtotalMax}
              onChange={(e) => setFilters({ ...filters, subtotalMax: e.target.value })}
              className="bg-input-background"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Tax Rate</label>
            <Select value={filters.taxRate} onValueChange={(value) => setFilters({ ...filters, taxRate: value })}>
              <SelectTrigger className="bg-input-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="7">7%</SelectItem>
                <SelectItem value="7.5">7.5%</SelectItem>
                <SelectItem value="8">8%</SelectItem>
                <SelectItem value="8.125">8.125%</SelectItem>
                <SelectItem value="8.375">8.375%</SelectItem>
                <SelectItem value="8.625">8.625%</SelectItem>
                <SelectItem value="8.75">8.75%</SelectItem>
                <SelectItem value="8.875">8.875%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Order ID</label>
            <Input
              placeholder="Search ID..."
              value={filters.searchId}
              onChange={(e) => setFilters({ ...filters, searchId: e.target.value })}
              className="bg-input-background"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90">
            Apply Filters
          </Button>
          <Button variant="ghost" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Data Table */}
      {!loading && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Desktop Table View */}
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
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-muted-foreground">
                      No orders found. Import a CSV or create an order.
                    </td>
                  </tr>
                )}
                {orders.map((order, index) => (
                  <Fragment key={order.id}>
                    <tr
                      className={`border-b border-border hover:bg-accent/50 transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium">{order.id}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(order.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs">
                          <div>{order.latitude.toFixed(6)},</div>
                          <div>{order.longitude.toFixed(6)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">${order.subtotal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm font-medium">{order.taxRate.toFixed(3)}%</td>
                      <td className="py-3 px-4 text-sm">${order.taxAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold" style={{ color: order.taxAmount > 0 ? '#22C55E' : '#6B7280' }}>
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {order.jurisdictions.map((j, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className={`text-xs ${getBadgeColor(j.type)} border-0`}
                            >
                              {j.type}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(order.id)}
                          className="gap-1"
                        >
                          {expandedRows.has(order.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Details
                        </Button>
                      </td>
                    </tr>
                    {expandedRows.has(order.id) && (
                      <tr className="bg-muted/30">
                        <td colSpan={10} className="py-4 px-8">
                          <div className="text-sm">
                            <h4 className="font-medium mb-3">Tax Breakdown</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div>
                                <div className="text-muted-foreground text-xs mb-1">State Rate</div>
                                <div className="font-medium">
                                  {order.taxBreakdown.state.rate}% → ${order.taxBreakdown.state.amount.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs mb-1">County Rate</div>
                                <div className="font-medium">
                                  {order.taxBreakdown.county.rate}% → ${order.taxBreakdown.county.amount.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs mb-1">City Rate</div>
                                <div className="font-medium">
                                  {order.taxBreakdown.city.rate}% → ${order.taxBreakdown.city.amount.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs mb-1">Special Rate (MCTD)</div>
                                <div className="font-medium">
                                  {order.taxBreakdown.special.rate}% → ${order.taxBreakdown.special.amount.toFixed(2)}
                                </div>
                              </div>
                              <div className="border-l border-border pl-4">
                                <div className="text-muted-foreground text-xs mb-1">Composite Tax</div>
                                <div className="font-bold text-primary">
                                  {order.taxBreakdown.composite}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3">
            {orders.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No orders found. Import a CSV or create an order.
              </p>
            )}
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-sm font-bold mb-1">{order.id}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(order.timestamp)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: order.taxAmount > 0 ? '#22C55E' : '#6B7280' }}>
                      ${order.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">{order.taxRate.toFixed(3)}% tax</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {order.jurisdictions.map((j, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className={`text-xs ${getBadgeColor(j.type)} border-0`}
                    >
                      {j.type}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">Subtotal:</span> ${order.subtotal.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax:</span> ${order.taxAmount.toFixed(2)}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleRowExpansion(order.id)}
                  className="w-full gap-2"
                >
                  {expandedRows.has(order.id) ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Details
                    </>
                  )}
                </Button>

                {expandedRows.has(order.id) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <h4 className="font-medium text-sm mb-2">Tax Breakdown</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">State Rate:</span>
                        <span className="font-medium">{order.taxBreakdown.state.rate}% → ${order.taxBreakdown.state.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">County Rate:</span>
                        <span className="font-medium">{order.taxBreakdown.county.rate}% → ${order.taxBreakdown.county.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">City Rate:</span>
                        <span className="font-medium">{order.taxBreakdown.city.rate}% → ${order.taxBreakdown.city.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Special Rate (MCTD):</span>
                        <span className="font-medium">{order.taxBreakdown.special.rate}% → ${order.taxBreakdown.special.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="font-medium">Composite Tax:</span>
                        <span className="font-bold text-primary">{order.taxBreakdown.composite}%</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border font-mono text-[10px] text-muted-foreground">
                      <div>{order.latitude.toFixed(6)}, {order.longitude.toFixed(6)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
