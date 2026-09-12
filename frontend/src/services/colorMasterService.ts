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

export interface ColorMasterItem {
  id: number;
  uuid: string;
  company_id?: number | null;
  buyer_id?: number | null;
  color_code: string;
  color_name: string;
  pantone_ref?: string | null;
  hex_code?: string | null;
  is_active: boolean;
}

export async function lookupColors(query?: string, buyerId?: number): Promise<{ data: ColorMasterItem[] }> {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (buyerId) params.append("buyer_id", String(buyerId));

  const res = await fetch(`${API_BASE}/api/v1/colors/lookup?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function saveColorMaster(payload: {
  color_code: string;
  color_name: string;
  pantone_ref?: string | null;
  hex_code?: string | null;
  company_id?: number | null;
  buyer_id?: number | null;
}): Promise<{ data: ColorMasterItem }> {
  const res = await fetch(`${API_BASE}/api/v1/colors`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
