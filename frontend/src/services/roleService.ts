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

export interface RoleItem {
  id: number;
  name: string;
  is_system: boolean;
  permissions_count: number;
  users_count: number;
  created_at: string;
}

export interface PermissionAction {
  name: string;
  action: string;
  description: string;
  exists: boolean;
}

export interface PermissionResource {
  slug: string;
  label: string;
  actions: PermissionAction[];
}

export interface PermissionSubmodule {
  slug: string;
  label: string;
  resources: PermissionResource[];
}

export interface PermissionModule {
  slug: string;
  label: string;
  submodules: PermissionSubmodule[];
}

export interface RoleDetails {
  id: number;
  name: string;
  is_system: boolean;
  users_count: number;
  permissions: string[];
  created_at: string;
}

/**
 * Get all enterprise roles.
 */
export async function getRoles(search = ""): Promise<{ status: string; data: RoleItem[] }> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE}/api/v1/roles${q}`, {
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; data: RoleItem[] }>(res);
}

/**
 * Create a new custom role.
 */
export async function createRole(name: string, permissions: string[] = []): Promise<{ status: string; message: string; data: RoleItem }> {
  const res = await fetch(`${API_BASE}/api/v1/roles`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name, permissions }),
  });
  return handleResponse<{ status: string; message: string; data: RoleItem }>(res);
}

/**
 * Get role details with active permissions.
 */
export async function getRole(id: number | string): Promise<{ status: string; data: RoleDetails }> {
  const res = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; data: RoleDetails }>(res);
}

/**
 * Rename a custom role.
 */
export async function updateRole(id: number | string, name: string): Promise<{ status: string; message: string; data: RoleItem }> {
  const res = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<{ status: string; message: string; data: RoleItem }>(res);
}

/**
 * Delete a custom role.
 */
export async function deleteRole(id: number | string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; message: string }>(res);
}

/**
 * Fetch 4-tier structured permission tree catalog.
 */
export async function getPermissionTree(): Promise<{ status: string; data: PermissionModule[] }> {
  const res = await fetch(`${API_BASE}/api/v1/permissions/tree`, {
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; data: PermissionModule[] }>(res);
}

/**
 * Sync permissions matrix for a role.
 */
export async function syncRoleMatrix(
  id: number | string,
  permissions: string[]
): Promise<{ status: string; message: string; data: { id: number; name: string; permissions_count: number; permissions: string[] } }> {
  const res = await fetch(`${API_BASE}/api/v1/roles/${id}/matrix`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ permissions }),
  });
  return handleResponse<{ status: string; message: string; data: { id: number; name: string; permissions_count: number; permissions: string[] } }>(res);
}
