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

export interface StyleColorItem {
  id?: number;
  uuid?: string;
  color_code: string;
  color_name: string;
  pantone_ref?: string | null;
  hex_code?: string | null;
  is_active?: boolean;
}

export interface StyleSizeItem {
  id?: number;
  uuid?: string;
  size_name: string;
  sort_order: number;
  is_active?: boolean;
}

export interface WovenStyle {
  id: number;
  uuid: string;
  company_id: number;
  buyer_id: number;
  brand_id?: number | null;
  code: string;
  buyer_style_no: string;
  style_name: string;
  product_category: string;
  garment_item: string;
  fabric_type: string;
  season: string;
  base_smv: number | string;
  wash_type: string;
  description?: string | null;
  status: "Development" | "Sampling" | "Confirmed" | "Bulk_Approved" | "Discontinued";
  is_active: boolean;
  company?: { id: number; code: string; name: string };
  buyer?: { id: number; uuid: string; code: string; name: string; country?: string };
  brand?: { id: number; uuid: string; name: string } | null;
  colors?: StyleColorItem[];
  sizes?: StyleSizeItem[];
  colors_count?: number;
  sizes_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StyleFormData {
  company_id: number;
  buyer_id: number | "";
  brand_id?: number | null | "";
  buyer_style_no: string;
  style_name: string;
  product_category: string;
  garment_item: string;
  fabric_type: string;
  season: string;
  base_smv: number | "";
  wash_type: string;
  description?: string;
  status: "Development" | "Sampling" | "Confirmed" | "Bulk_Approved" | "Discontinued";
  is_active: boolean;
  colors: StyleColorItem[];
  sizes: StyleSizeItem[];
}

export interface StyleListParams {
  page?: number;
  per_page?: number;
  search?: string;
  company_id?: number;
  buyer_id?: number | string;
  product_category?: string;
  season?: string;
  wash_type?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface PaginatedStyles {
  success: boolean;
  data: WovenStyle[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Fetch paginated list of styles
 */
export async function getStyles(params: StyleListParams = {}): Promise<PaginatedStyles> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.search) query.set("search", params.search);
  if (params.company_id) query.set("company_id", String(params.company_id));
  if (params.buyer_id) query.set("buyer_id", String(params.buyer_id));
  if (params.product_category) query.set("product_category", params.product_category);
  if (params.season) query.set("season", params.season);
  if (params.wash_type) query.set("wash_type", params.wash_type);
  if (params.status) query.set("status", params.status);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);

  const res = await fetch(`${API_BASE}/api/v1/styles?${query.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse<PaginatedStyles>(res);
}

/**
 * Fetch next auto-generated Style Code preview
 */
export async function getStyleNextCode(companyId?: number): Promise<{ success: boolean; data: { code: string; company_id: number; company_code: string } }> {
  const url = companyId
    ? `${API_BASE}/api/v1/styles/next-code?company_id=${companyId}`
    : `${API_BASE}/api/v1/styles/next-code`;
  const res = await fetch(url, { method: "GET", headers: getHeaders() });
  return handleResponse(res);
}

/**
 * Fetch single style details by UUID or ID
 */
export async function getStyleById(id: number | string): Promise<WovenStyle> {
  const res = await fetch(`${API_BASE}/api/v1/styles/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await handleResponse<{ success: boolean; data: WovenStyle }>(res);
  return data.data;
}

/**
 * Create new Woven Style
 */
export async function createStyle(payload: StyleFormData): Promise<{ success: boolean; message: string; data: WovenStyle }> {
  const res = await fetch(`${API_BASE}/api/v1/styles`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Update existing Woven Style
 */
export async function updateStyle(id: number | string, payload: Partial<StyleFormData>): Promise<{ success: boolean; message: string; data: WovenStyle }> {
  const res = await fetch(`${API_BASE}/api/v1/styles/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Delete a Woven Style
 */
export async function deleteStyle(id: number | string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/styles/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

/**
 * Toggle operational active/inactive status
 */
export async function toggleStyleStatus(id: number | string): Promise<{ success: boolean; message: string; data: { id: number; uuid: string; is_active: boolean } }> {
  const res = await fetch(`${API_BASE}/api/v1/styles/${id}/toggle-status`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

/**
 * Fetch active styles for a specific buyer (for Orders dropdown)
 */
export async function getStylesByBuyer(buyerId: number | string): Promise<{ success: boolean; data: WovenStyle[] }> {
  const res = await fetch(`${API_BASE}/api/v1/styles/by-buyer/${buyerId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
