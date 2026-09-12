import { useAuthStore } from "../store/authStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    const err = { message: "Session expired or unauthenticated. Please log in.", status: 401 };
    throw err;
  }

  const data = await res.json();
  if (!res.ok) {
    const err: { message: string; errors?: Record<string, string[]>; status?: number } = {
      message: data.message || "An unexpected error occurred.",
      errors: data.errors,
      status: res.status,
    };
    throw err;
  }
  return data as T;
}

export interface PoBreakdownItem {
  id?: number;
  uuid?: string;
  purchase_order_id?: number;
  style_color_id: number;
  style_size_id: number;
  order_qty: number;
  excess_percentage?: number;
  planned_cut_qty?: number;
  delivery_date?: string | null;
  destination_country?: string | null;
  color?: {
    id: number;
    color_code: string;
    color_name: string;
    pantone_ref?: string | null;
  };
  size?: {
    id: number;
    size_name: string;
    sort_order?: number;
  };
}

export interface PurchaseOrder {
  id: number;
  uuid: string;
  company_id: number;
  buyer_id: number;
  style_id: number;
  season_id?: number | null;
  season_name?: string | null;
  order_code: string;
  buyer_po_number: string;
  department?: string | null;
  order_type: "Regular" | "Sample" | "Repeat" | "Promo" | "Test";
  total_order_qty: number;
  currency: string;
  unit_price: number;
  total_order_value: number;
  order_placement_date: string;
  factory_delivery_date: string;
  buyer_delivery_date: string;
  shipment_mode: "SEA" | "AIR" | "ROAD" | "RAIL" | "SEA_AIR";
  incoterm: "FOB" | "CIF" | "CFR" | "EXW" | "DDP";
  payment_terms?: string | null;
  delivery_destination?: string | null;
  po_document_url?: string | null;
  po_document_name?: string | null;
  po_document_size?: number | null;
  remarks?: string | null;
  status: "Draft" | "Confirmed" | "In_Production" | "Shipped" | "Cancelled" | "Closed";
  is_active: boolean;
  company?: { id: number; code: string; name: string };
  buyer?: { id: number; uuid: string; code: string; name: string };
  style?: {
    id: number;
    uuid: string;
    code: string;
    buyer_style_no: string;
    style_name: string;
    product_category?: string;
    season?: string;
    colors?: Array<{ id: number; color_code: string; color_name: string }>;
    sizes?: Array<{ id: number; size_name: string; sort_order: number }>;
  };
  breakdowns?: PoBreakdownItem[];
  breakdowns_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrderFormData {
  company_id: number;
  buyer_id: number | "";
  style_id: number | "";
  season_id?: number | null | "";
  season_name?: string;
  order_code?: string;
  buyer_po_number: string;
  department?: string | null;
  order_type: "Regular" | "Sample" | "Repeat" | "Promo" | "Test";
  total_order_qty: number | "";
  currency: string;
  unit_price: number | "";
  order_placement_date: string;
  factory_delivery_date: string;
  buyer_delivery_date: string;
  shipment_mode: "SEA" | "AIR" | "ROAD" | "RAIL" | "SEA_AIR";
  incoterm: "FOB" | "CIF" | "CFR" | "EXW" | "DDP";
  payment_terms?: string;
  delivery_destination?: string;
  po_document_url?: string | null;
  po_document_name?: string | null;
  po_document_size?: number | null;
  remarks?: string;
  status: "Draft" | "Confirmed" | "In_Production" | "Shipped" | "Cancelled" | "Closed";
  is_active: boolean;
  breakdowns: Array<{
    style_color_id: number;
    style_size_id: number;
    order_qty: number;
    excess_percentage?: number;
    planned_cut_qty?: number;
    delivery_date?: string | null;
    destination_country?: string | null;
  }>;
}

export interface PurchaseOrderListParams {
  page?: number;
  per_page?: number;
  search?: string;
  company_id?: number;
  buyer_id?: number | string;
  style_id?: number | string;
  order_type?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface PaginatedOrders {
  success: boolean;
  data: PurchaseOrder[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface MultiPoGroupItem {
  buyer_po_number: string;
  destination_country?: string | null;
  delivery_date?: string | null;
  unit_price?: number;
  currency?: string;
  season_name?: string;
  order_qty: number;
  breakdowns: Array<{
    style_color_id: number;
    style_size_id: number;
    order_qty: number;
    color_name?: string;
    size_name?: string;
  }>;
  matrix: Record<number, Record<number, number>>;
}

export interface ParsedPoResult {
  success: boolean;
  message?: string;
  buyer_po_number?: string | null;
  total_order_qty?: number;
  currency?: string;
  unit_price?: number;
  factory_delivery_date?: string | null;
  buyer_delivery_date?: string | null;
  season_name?: string | null;
  delivery_destination?: string | null;
  detected_po_numbers?: string[];
  new_colors_created?: number;
  new_sizes_created?: number;
  breakdowns: Array<{
    style_color_id: number;
    style_size_id: number;
    order_qty: number;
    color_name?: string;
    size_name?: string;
  }>;
  matrix: Record<number, Record<number, number>>;
  multi_po_groups?: MultiPoGroupItem[];
  unmapped_colors?: string[];
  unmapped_sizes?: string[];
  style_colors?: Array<{ id: number; color_code: string; color_name: string }>;
  style_sizes?: Array<{ id: number; size_name: string; sort_order: number }>;
  raw_text?: string;
}

/**
 * Fetch paginated list of purchase orders
 */
export async function getPurchaseOrders(params: PurchaseOrderListParams = {}): Promise<PaginatedOrders> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.search) query.set("search", params.search);
  if (params.company_id) query.set("company_id", String(params.company_id));
  if (params.buyer_id) query.set("buyer_id", String(params.buyer_id));
  if (params.style_id) query.set("style_id", String(params.style_id));
  if (params.order_type) query.set("order_type", params.order_type);
  if (params.status) query.set("status", params.status);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);

  const res = await fetch(`${API_BASE}/api/v1/orders?${query.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse<PaginatedOrders>(res);
}

/**
 * Fetch single order by ID
 */
export async function getPurchaseOrder(id: number | string): Promise<{ success: boolean; data: PurchaseOrder }> {
  const res = await fetch(`${API_BASE}/api/v1/orders/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<{ success: boolean; data: PurchaseOrder }>(res);
}

/**
 * Fetch next intelligent order code preview
 */
export async function getNextOrderCode(companyId?: number): Promise<string> {
  const query = new URLSearchParams();
  if (companyId) query.set("company_id", String(companyId));

  const res = await fetch(`${API_BASE}/api/v1/orders/next-code?${query.toString()}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ success: boolean; next_code: string }>(res);
  return data.next_code;
}

/**
 * Create a new Purchase Order
 */
export async function createPurchaseOrder(
  data: PurchaseOrderFormData
): Promise<{ success: boolean; message: string; data: PurchaseOrder }> {
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ success: boolean; message: string; data: PurchaseOrder }>(res);
}

/**
 * Update existing Purchase Order
 */
export async function updatePurchaseOrder(
  id: number | string,
  data: PurchaseOrderFormData
): Promise<{ success: boolean; message: string; data: PurchaseOrder }> {
  const res = await fetch(`${API_BASE}/api/v1/orders/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ success: boolean; message: string; data: PurchaseOrder }>(res);
}

/**
 * Soft delete a Purchase Order
 */
export async function deletePurchaseOrder(id: number | string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/orders/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

/**
 * Download dynamic pre-filled Excel template for specific Style
 */
export async function downloadOrderTemplate(styleId: number, filename = "po_template.xlsx"): Promise<void> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE}/api/v1/orders/template/${styleId}`, {
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to download template.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Upload buyer PO document (PDF, Excel, Image)
 */
export async function uploadPoDocument(file: File): Promise<{
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}> {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/orders/upload-document`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await handleResponse<{
    success: boolean;
    data: {
      file_url: string;
      file_name: string;
      file_size: number;
      mime_type: string;
    };
  }>(res);

  return data.data;
}

/**
 * Parse uploaded PO file (.xlsx, .csv, .pdf) for auto-fill & matrix breakdown
 */
export async function parsePoFile(file: File, styleId: number): Promise<ParsedPoResult> {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("style_id", String(styleId));

  const res = await fetch(`${API_BASE}/api/v1/orders/parse-file`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await handleResponse<{
    success: boolean;
    message?: string;
    data: ParsedPoResult;
  }>(res);

  return data.data;
}

/**
 * Batch store multiple Purchase Orders simultaneously
 */
export async function batchCreatePurchaseOrders(payload: {
  company_id: number;
  buyer_id: number;
  style_id: number;
  orders: Array<Partial<PurchaseOrderFormData>>;
}): Promise<PurchaseOrder[]> {
  const res = await fetch(`${API_BASE}/api/v1/orders/batch-store`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{
    success: boolean;
    message: string;
    data: PurchaseOrder[];
  }>(res);

  return data.data;
}
