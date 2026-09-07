import { create } from 'zustand';

export interface AuthUser {
  id: string | number;
  company_id?: number | null;
  company_name?: string;
  emp_id: string;
  username: string;
  name: string;
  email?: string;
  department?: string;
  phone?: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  canAccessWidget: (requiredPermissions?: string[], requiredRoles?: string[]) => boolean;
  canAccess: (requiredPermissions?: string[], requiredRoles?: string[]) => boolean;
  switchPreviewRole: (roleName: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('tf_user') || 'null'),
  token: localStorage.getItem('tf_token') || null,
  isAuthenticated: !!localStorage.getItem('tf_token'),

  setAuth: (user, token) => {
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updatedFields };
    localStorage.setItem('tf_user', JSON.stringify(newUser));
    set({ user: newUser });
  },

  logout: () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hasRole: (role) => {
    const { user } = get();
    if (!user || !user.roles) return false;
    const targetRoles = Array.isArray(role) ? role : [role];
    if (user.roles.includes('superadmin')) return true;
    return targetRoles.some((r) => user.roles.includes(r.toLowerCase()));
  },

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles && user.roles.includes('superadmin')) return true;
    if (!user.permissions) return false;
    const targetPerms = Array.isArray(permission) ? permission : [permission];
    return targetPerms.some((p) => user.permissions.includes(p) || user.permissions.includes('*'));
  },

  canAccessWidget: (requiredPermissions = [], requiredRoles = []) => {
    const { user } = get();
    if (!user) return false;
    // Superadmin has absolute access to every card, menu, and widget
    if (user.roles && (user.roles.includes('superadmin') || user.roles.includes('Superadmin'))) return true;

    // Check matching roles (case-insensitive)
    if (requiredRoles.length > 0) {
      const userRolesLower = (user.roles || []).map((r) => r.toLowerCase());
      const hasMatchingRole = requiredRoles.some((r) => userRolesLower.includes(r.toLowerCase()));
      if (hasMatchingRole) return true;
    }

    // Check matching permissions
    if (requiredPermissions.length > 0) {
      if (!user.permissions || user.permissions.length === 0) return false;
      if (user.permissions.includes('*')) return true;

      const hasMatchingPerm = requiredPermissions.some((p) => {
        const pLower = p.toLowerCase();
        return user.permissions.some((userPerm) => {
          const uLower = userPerm.toLowerCase();
          if (uLower === pLower || uLower === '*') return true;
          // Wildcard prefix matching: if user possesses e.g. 'master_data.*', they can access 'master_data.buyers.profile.view'
          if (uLower.endsWith('.*')) {
            const prefix = uLower.slice(0, -2);
            return pLower.startsWith(prefix);
          }
          return false;
        });
      });
      if (hasMatchingPerm) return true;
    }

    // If no restrictions specified, allow
    return requiredPermissions.length === 0 && requiredRoles.length === 0;
  },
  canAccess: (requiredPermissions = [], requiredRoles = []) => {
    return get().canAccessWidget(requiredPermissions, requiredRoles);
  },

  switchPreviewRole: (roleName) => {
    const { user } = get();
    if (!user) return;
    const roleLower = roleName.toLowerCase();
    
    // Preset permission mapping for standard factory roles
    let perms: string[] = [];
    if (roleLower === 'superadmin') {
      perms = ['*'];
    } else if (roleLower === 'merchandiser') {
      perms = ['merchandising.styles.view', 'orders.pos.view'];
    } else if (roleLower === 'cutting_manager') {
      perms = ['cutting.bundles.view', 'cutting.planning.view'];
    } else if (roleLower === 'floor_supervisor') {
      perms = ['sewing.lines.view', 'sewing.tracking.view'];
    } else if (roleLower === 'qc_auditor') {
      perms = ['quality.inspections.view'];
    }

    const updatedUser: AuthUser = {
      ...user,
      roles: [roleLower],
      permissions: perms,
    };
    set({ user: updatedUser });
  },
}));
