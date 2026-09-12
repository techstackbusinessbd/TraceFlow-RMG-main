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
    throw { message: "Session expired or unauthenticated. Please log in.", status: 401 };
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

export interface SizeScaleEntry {
  id?: number;
  size_name: string;
  sort_order: number;
}

export interface SizeScale {
  id: number;
  uuid: string;
  company_id?: number | null;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  is_active: boolean;
  entries?: SizeScaleEntry[];
  company?: { id: number; code: string; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface SizeScaleFormData {
  company_id?: number | null;
  name: string;
  category: string;
  description?: string;
  is_active: boolean;
  entries: string[];
}

export interface SizeScaleListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  status?: "active" | "inactive";
  sort_by?: string;
  sort_direction?: "asc" | "desc";
}

export async function getSizeScales(params: SizeScaleListParams = {}): Promise<{
  data: SizeScale[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.per_page) query.append("per_page", String(params.per_page));
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.status) query.append("status", params.status);
  if (params.sort_by) query.append("sort_by", params.sort_by);
  if (params.sort_direction) query.append("sort_direction", params.sort_direction);

  const res = await fetch(`${API_BASE}/api/v1/size-scales?${query.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getSizeScaleById(id: number | string): Promise<{ data: SizeScale }> {
  const res = await fetch(`${API_BASE}/api/v1/size-scales/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createSizeScale(payload: SizeScaleFormData): Promise<{ data: SizeScale; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/size-scales`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateSizeScale(id: number | string, payload: SizeScaleFormData): Promise<{ data: SizeScale; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/size-scales/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteSizeScale(id: number | string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/size-scales/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
