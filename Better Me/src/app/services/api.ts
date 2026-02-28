/**
 * API service — connects React frontend to FastAPI backend.
 * Includes JWT token in all requests when available.
 */

const API_BASE = "http://localhost:8000/api";

function getToken(): string | null {
  const stored = localStorage.getItem("betterme_token");
  return stored;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface TaxComponent { rate: number; amount: number; }
export interface TaxBreakdown {
  state: TaxComponent; county: TaxComponent;
  city: TaxComponent; special: TaxComponent; composite: number;
}
export interface Jurisdiction { name: string; type: "State" | "County" | "City" | "Special"; }
export interface Order {
  id: string; timestamp: string; latitude: number; longitude: number;
  subtotal: number; taxRate: number; taxAmount: number; total: number;
  jurisdictions: Jurisdiction[]; taxBreakdown: TaxBreakdown; userId?: string;
}
export interface OrdersResponse {
  orders: Order[]; total: number; page: number; limit: number; totalPages: number;
}
export interface TaxPreview {
  taxBreakdown: TaxBreakdown; jurisdictions: Jurisdiction[];
  taxRate: number; taxAmount: number; total: number; jurisdiction: string;
}
export interface ImportResult {
  success: number; failed: number; orders: Order[];
  errors: { row: number; error: string }[];
}
export interface Stats {
  totalOrders: number; totalRevenue: number; totalTax: number; avgTaxRate: number;
}

// Auth types
export interface User {
  id: string; email: string; name: string; role: "admin" | "user";
  phone?: string; company?: string; avatar?: string; createdAt: string;
}
export interface UserWithStats extends User {
  is_active: boolean; totalOrders: number; totalSpent: number; lastActive?: string;
}
export interface AuthResult { token: string; user: User; }
export interface ActivityLog {
  id: string; userId: string; userName: string;
  action: string; details: string; timestamp: string;
}

// ── Auth API ───────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function apiRegister(name: string, email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function apiGetMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function apiUpdateProfile(data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Update failed");
  }
  return res.json();
}

// ── Admin API ──────────────────────────────────────────────────────────────

export async function apiGetUsers(): Promise<UserWithStats[]> {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function apiUpdateUser(userId: string, data: Record<string, any>): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Update failed");
  }
  return res.json();
}

export async function apiDeleteUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Delete failed");
  }
}

export async function apiGetActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE}/admin/activity?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch activity log");
  return res.json();
}

// ── Orders API ─────────────────────────────────────────────────────────────

export async function fetchOrders(params: Record<string, string>): Promise<OrdersResponse> {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== "all" && v != null) cleaned[k] = v;
  }
  const qs = new URLSearchParams(cleaned).toString();
  const res = await fetch(`${API_BASE}/orders${qs ? "?" + qs : ""}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
}

export async function createOrder(data: {
  latitude: number; longitude: number; subtotal: number; timestamp?: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Create failed: ${res.status}`);
  }
  return res.json();
}

export async function calculateTax(
  latitude: number, longitude: number, subtotal: number,
): Promise<TaxPreview> {
  const res = await fetch(`${API_BASE}/orders/calculate-tax`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ latitude, longitude, subtotal }),
  });
  if (!res.ok) throw new Error(`Tax calc failed: ${res.status}`);
  return res.json();
}

export async function importCSV(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/orders/import-csv`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Import failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
}
