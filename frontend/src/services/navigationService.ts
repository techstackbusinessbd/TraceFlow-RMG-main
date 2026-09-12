import { useAuthStore } from "../store/authStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export interface NavMenuAction {
  id: string;
  label: string;
  path: string;
  required_permissions?: string[];
  required_roles?: string[];
}

export interface NavCluster {
  id: string;
  title: string;
  menus: NavMenuAction[];
}

export interface NavSubmodule {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  target_module_id?: string;
  clusters: NavCluster[];
  total_menus?: number;
}

export interface NavModule {
  id: string;
  step: string;
  title: string;
  icon: string;
  submodules: NavSubmodule[];
}

export interface NavigationCatalogResponse {
  status: string;
  message: string;
  data: NavModule[];
}

const SESSION_CATALOG_KEY = "tf_nav_catalog";

export function getStoredCatalog(): NavModule[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CATALOG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

let cachedCatalog: NavModule[] | null = getStoredCatalog();
let inFlightCatalogPromise: Promise<NavModule[]> | null = null;

export const navigationService = {
  /**
   * Synchronously get the cached catalog if available (0ms).
   */
  getImmediateCatalog(): NavModule[] {
    if (cachedCatalog && cachedCatalog.length > 0) return cachedCatalog;
    const stored = getStoredCatalog();
    if (stored && stored.length > 0) {
      cachedCatalog = stored;
      return stored;
    }
    return [];
  },

  /**
   * Fetch permission-filtered 4-level navigation catalog from backend API.
   * Instant (<1ms) via memory + sessionStorage; updates asynchronously in background.
   */
  async getCatalog(forceRefresh: boolean = false): Promise<NavModule[]> {
    if (!forceRefresh) {
      if (cachedCatalog && cachedCatalog.length > 0) {
        return cachedCatalog;
      }
      const stored = getStoredCatalog();
      if (stored && stored.length > 0) {
        cachedCatalog = stored;
        return stored;
      }
    }

    if (inFlightCatalogPromise && !forceRefresh) {
      return inFlightCatalogPromise;
    }

    inFlightCatalogPromise = (async () => {
      const token = useAuthStore.getState().token;
      try {
        const response = await fetch(`${API_BASE}/api/v1/navigation/catalog`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load navigation catalog: ${response.status}`);
        }

        const json: NavigationCatalogResponse = await response.json();
        const catalogData = json.data || [];
        if (catalogData.length > 0) {
          cachedCatalog = catalogData;
          try {
            sessionStorage.setItem(SESSION_CATALOG_KEY, JSON.stringify(catalogData));
          } catch {
            // sessionStorage write ignore if quota exceeded
          }
        }
        return catalogData;
      } catch (err) {
        console.warn("Navigation service falling back to offline structure", err);
        return cachedCatalog || [];
      } finally {
        inFlightCatalogPromise = null;
      }
    })();

    return inFlightCatalogPromise;
  },

  clearCache() {
    cachedCatalog = null;
    inFlightCatalogPromise = null;
    try {
      sessionStorage.removeItem(SESSION_CATALOG_KEY);
    } catch {
      // ignore
    }
  },
};
