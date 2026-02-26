/**
 * API service — connects React frontend to the FastAPI backend.
 *
 * All requests go to http://localhost:8000/api/*
 * Change API_BASE for production deployment.
 */

const API_BASE = "http://localhost:8000/api";

// ── Types (re-export from data/orders for convenience) ─────────────────────

export interface TaxComponent {
  rate: number;
  amount: number;
}

export interface TaxBreakdown {
  state: TaxComponent;
  county: TaxComponent;
  city: TaxComponent;
  special: TaxComponent;
  composite: number;
}

export interface Jurisdiction {
  name: string;
  type: "State" | "County" | "City" | "Special";
}

export interface Order {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  jurisdictions: Jurisdiction[];
  taxBreakdown: TaxBreakdown;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaxPreview {
  taxBreakdown: TaxBreakdown;
  jurisdictions: Jurisdiction[];
  taxRate: number;
  taxAmount: number;
  total: number;
  jurisdiction: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  orders: Order[];
  errors: { row: number; error: string }[];
}

export interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  avgTaxRate: number;
}

// ── API calls ──────────────────────────────────────────────────────────────

export async function fetchOrders(params: Record<string, string>): Promise<OrdersResponse> {
  // Remove empty values
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== "all" && v !== undefined && v !== null) {
      cleaned[k] = v;
    }
  }
  const qs = new URLSearchParams(cleaned).toString();
  const res = await fetch(`${API_BASE}/orders${qs ? "?" + qs : ""}`);
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Order not found: ${res.status}`);
  return res.json();
}

export async function createOrder(data: {
  latitude: number;
  longitude: number;
  subtotal: number;
  timestamp?: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Create failed: ${res.status}`);
  }
  return res.json();
}

export async function calculateTax(
  latitude: number,
  longitude: number,
  subtotal: number,
): Promise<TaxPreview> {
  const res = await fetch(`${API_BASE}/orders/calculate-tax`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude, subtotal }),
  });
  if (!res.ok) throw new Error(`Tax calc failed: ${res.status}`);
  return res.json();
}

export async function importCSV(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/orders/import-csv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Import failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
}
