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
    const errorObj = {
      message: data.message || "An error occurred",
      status: res.status,
      errors: data.errors || null,
      response: { status: res.status, data },
    };
    throw errorObj;
  }
  return data;
}

export interface Brand {
  id?: number;
  buyer_id?: number;
  code?: string;
  name: string;
  is_active?: boolean;
}

export interface Buyer {
  id: number;
  company_id: number;
  company?: {
    id: number;
    code: string;
    name: string;
  };
  code: string;
  name: string;
  country: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  payment_terms?: string | null;
  is_active: boolean;
  brands_count?: number;
  active_brands_count?: number;
  brands?: Brand[];
  created_at?: string;
  updated_at?: string;
}

export interface BuyerFilters {
  search?: string;
  company_id?: number | string;
  status?: "" | "active" | "inactive";
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface BuyerListResponse {
  status: string;
  data: Buyer[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface BuyerFormData {
  company_id: number;
  name: string;
  country: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active?: boolean;
  brands?: { id?: number; name: string; code?: string }[];
}

export const getBuyers = async (params: BuyerFilters = {}): Promise<BuyerListResponse> => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.company_id) query.set("company_id", String(params.company_id));
  if (params.status) query.set("status", params.status);
  if (params.sort_field) query.set("sort_field", params.sort_field);
  if (params.sort_direction) query.set("sort_direction", params.sort_direction);
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.page) query.set("page", String(params.page));

  const res = await fetch(`${API_BASE}/api/v1/buyers?${query.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse<BuyerListResponse>(res);
};

export const getBuyerNextCode = async (companyId?: number): Promise<{ next_code: string; company_code: string }> => {
  const query = companyId ? `?company_id=${companyId}` : "";
  const res = await fetch(`${API_BASE}/api/v1/buyers/next-code${query}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ status: string; data: { next_code: string; company_code: string } }>(res);
  return data.data;
};

export const getBuyerById = async (id: number): Promise<Buyer> => {
  const res = await fetch(`${API_BASE}/api/v1/buyers/${id}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ status: string; data: Buyer }>(res);
  return data.data;
};

export const createBuyer = async (data: BuyerFormData): Promise<{ status: string; message: string; data: Buyer }> => {
  const res = await fetch(`${API_BASE}/api/v1/buyers`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ status: string; message: string; data: Buyer }>(res);
};

export const updateBuyer = async (id: number, data: Partial<BuyerFormData>): Promise<{ status: string; message: string; data: Buyer }> => {
  const res = await fetch(`${API_BASE}/api/v1/buyers/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ status: string; message: string; data: Buyer }>(res);
};

export const deleteBuyer = async (id: number): Promise<{ status: string; message: string }> => {
  const res = await fetch(`${API_BASE}/api/v1/buyers/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; message: string }>(res);
};

export const toggleBuyerStatus = async (id: number): Promise<{ status: string; message: string; data: { id: number; is_active: boolean } }> => {
  const res = await fetch(`${API_BASE}/api/v1/buyers/${id}/toggle-status`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; message: string; data: { id: number; is_active: boolean } }>(res);
};
