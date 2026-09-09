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

export interface UserRole {
  id: number;
  name: string;
}

export interface UserCompany {
  id: number;
  uuid?: string;
  code: string;
  name: string;
  legal_name?: string | null;
  is_default: boolean;
}

export interface AppUser {
  id: number;
  uuid: string;
  company_id: number;
  emp_id: string;
  username: string;
  name: string;
  email: string | null;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  company?: UserCompany;
  roles?: UserRole[];
  direct_permissions?: string[];
  role_permissions?: string[];
  all_permissions?: string[];
}

export interface UserListResponse {
  status: string;
  data: AppUser[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface UserParams {
  search?: string;
  company_id?: string | number;
  role?: string;
  department?: string;
  status?: "active" | "inactive" | "";
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface CreateUserData {
  emp_id: string;
  username: string;
  name: string;
  email?: string;
  password: string;
  password_confirmation?: string;
  company_id: number;
  roles: string[];
  department?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  emp_id?: string;
  username?: string;
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  company_id?: number;
  roles?: string[];
  department?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UserMetadataResponse {
  status: string;
  data: {
    companies: { id: number; code: string; name: string; is_default: boolean }[];
    roles: { id: number; name: string }[];
    departments: string[];
  };
}

/**
 * Fetch paginated, filtered user accounts.
 */
export async function getUsers(params: UserParams = {}): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.company_id) query.set("company_id", String(params.company_id));
  if (params.role) query.set("role", params.role);
  if (params.department) query.set("department", params.department);
  if (params.status) query.set("status", params.status);
  if (params.sort_field) query.set("sort_field", params.sort_field);
  if (params.sort_direction) query.set("sort_direction", params.sort_direction);
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.page) query.set("page", String(params.page));

  const res = await fetch(`${API_BASE}/api/v1/users?${query.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse<UserListResponse>(res);
}

/**
 * Fetch lookup metadata (active companies, roles, departments).
 */
export async function getUserMetadata(): Promise<UserMetadataResponse> {
  const res = await fetch(`${API_BASE}/api/v1/users/meta/roles-companies`, {
    headers: getHeaders(),
  });
  return handleResponse<UserMetadataResponse>(res);
}

/**
 * Get details of a single user account.
 */
export async function getUser(id: number | string): Promise<{ status: string; data: AppUser }> {
  const res = await fetch(`${API_BASE}/api/v1/users/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; data: AppUser }>(res);
}

/**
 * Create a new user account.
 */
export async function createUser(data: CreateUserData): Promise<{ status: string; message: string; data: AppUser }> {
  const res = await fetch(`${API_BASE}/api/v1/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ status: string; message: string; data: AppUser }>(res);
}

/**
 * Update an existing user account.
 */
export async function updateUser(
  id: number | string,
  data: UpdateUserData
): Promise<{ status: string; message: string; data: AppUser }> {
  const res = await fetch(`${API_BASE}/api/v1/users/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ status: string; message: string; data: AppUser }>(res);
}

/**
 * Soft delete a user account.
 */
export async function deleteUser(id: number | string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/users/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; message: string }>(res);
}

/**
 * Toggle user active/inactive status.
 */
export async function toggleUserStatus(
  id: number | string
): Promise<{ status: string; message: string; data: { id: number; is_active: boolean } }> {
  const res = await fetch(`${API_BASE}/api/v1/users/${id}/toggle-status`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; message: string; data: { id: number; is_active: boolean } }>(res);
}

export interface UserPermissionsBreakdown {
  user_id: number;
  username: string;
  name: string;
  roles: string[];
  direct_permissions: string[];
  role_permissions: string[];
  all_permissions: string[];
}

/**
 * Get direct and inherited permissions breakdown for a user.
 */
export async function getUserPermissions(
  userId: number | string
): Promise<{ status: string; data: UserPermissionsBreakdown }> {
  const res = await fetch(`${API_BASE}/api/v1/users/${userId}/permissions`, {
    headers: getHeaders(),
  });
  return handleResponse<{ status: string; data: UserPermissionsBreakdown }>(res);
}

/**
 * Synchronize custom direct permissions for a user.
 */
export async function syncUserPermissions(
  userId: number | string,
  permissions: string[]
): Promise<{ status: string; message: string; data: UserPermissionsBreakdown }> {
  const res = await fetch(`${API_BASE}/api/v1/users/${userId}/permissions`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ permissions }),
  });
  return handleResponse<{ status: string; message: string; data: UserPermissionsBreakdown }>(res);
}

