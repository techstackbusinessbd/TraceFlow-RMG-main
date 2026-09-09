import { useState, useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./features/Auth/LoginPage";
import { ExecutiveDashboard } from "./features/Dashboard/ExecutiveDashboard";
import { UserProfilePage } from "./features/Profile/UserProfilePage";
import { CompanyListPage } from "./features/Companies/CompanyListPage";
import { CompanyFormPage } from "./features/Companies/CompanyFormPage";
import { CompanyDetailsPage } from "./features/Companies/CompanyDetailsPage";
import { UserListPage } from "./features/Users/UserListPage";
import { UserFormPage } from "./features/Users/UserFormPage";
import { UserDetailsPage } from "./features/Users/UserDetailsPage";
import { UserPermissionsPage } from "./features/Users/UserPermissionsPage";
import { RoleListPage } from "./features/Roles/RoleListPage";
import { RoleMatrixPage } from "./features/Roles/RoleMatrixPage";
import { RoleCreatePage } from "./features/Roles/RoleCreatePage";
import { BuyerListPage } from "./features/Buyers/BuyerListPage";
import { BuyerFormPage } from "./features/Buyers/BuyerFormPage";
import { BuyerDetailsPage } from "./features/Buyers/BuyerDetailsPage";
import { AgentListPage } from "./features/Agents/AgentListPage";
import { AgentFormPage } from "./features/Agents/AgentFormPage";
import { AgentDetailsPage } from "./features/Agents/AgentDetailsPage";
import { StyleListPage } from "./features/Styles/StyleListPage";
import { StyleFormPage } from "./features/Styles/StyleFormPage";
import { StyleDetailsPage } from "./features/Styles/StyleDetailsPage";
import { NotFoundPage } from "./components/common/NotFoundPage";
import { AccessDeniedPage } from "./components/common/AccessDeniedPage";
import { useAuthStore } from "./store/authStore";



// Helper: parse /companies/:id and /companies/:id/edit
function parseCompanyPath(path: string): { type: "list" | "create" | "edit" | "view" | null; id?: string } {
  if (path === "/companies") return { type: "list" };
  if (path === "/companies/create") return { type: "create" };
  const editMatch = path.match(/^\/companies\/([a-zA-Z0-9-]+)\/edit$/);
  if (editMatch) return { type: "edit", id: editMatch[1] };
  const viewMatch = path.match(/^\/companies\/([a-zA-Z0-9-]+)$/);
  if (viewMatch) return { type: "view", id: viewMatch[1] };
  return { type: null };
}

// Helper: parse /users/:id, /users/:id/edit, and /users/:id/permissions
function parseUserPath(path: string): { type: "list" | "create" | "edit" | "view" | "permissions" | null; id?: string } {
  if (path === "/users") return { type: "list" };
  if (path === "/users/create") return { type: "create" };
  const permsMatch = path.match(/^\/users\/([a-zA-Z0-9-]+)\/permissions$/);
  if (permsMatch) return { type: "permissions", id: permsMatch[1] };
  const editMatch = path.match(/^\/users\/([a-zA-Z0-9-]+)\/edit$/);
  if (editMatch) return { type: "edit", id: editMatch[1] };
  const viewMatch = path.match(/^\/users\/([a-zA-Z0-9-]+)$/);
  if (viewMatch) return { type: "view", id: viewMatch[1] };
  return { type: null };
}

// Helper: parse /roles and /roles/:id/matrix
function parseRolePath(path: string): { type: "list" | "create" | "matrix" | null; id?: number } {
  if (path === "/roles") return { type: "list" };
  if (path === "/roles/create") return { type: "create" };
  const matrixMatch = path.match(/^\/roles\/(\d+)\/matrix$/);
  if (matrixMatch) return { type: "matrix", id: parseInt(matrixMatch[1]) };
  return { type: null };
}

// Helper: parse /master/agents, /master/agents/create, /master/agents/:id, and /master/agents/:id/edit
function parseAgentPath(path: string): { type: "list" | "create" | "edit" | "view" | null; id?: string } {
  if (path === "/master/agents") return { type: "list" };
  if (path === "/master/agents/create") return { type: "create" };
  const editMatch = path.match(/^\/master\/agents\/([a-zA-Z0-9-]+)\/edit$/);
  if (editMatch) return { type: "edit", id: editMatch[1] };
  const viewMatch = path.match(/^\/master\/agents\/([a-zA-Z0-9-]+)$/);
  if (viewMatch) return { type: "view", id: viewMatch[1] };
  return { type: null };
}

// Helper: parse /master/buyers, /master/buyers/create, /master/buyers/:id, and /master/buyers/:id/edit
function parseBuyerPath(path: string): { type: "list" | "create" | "edit" | "view" | null; id?: string } {
  if (path === "/master/buyers") return { type: "list" };
  if (path === "/master/buyers/create") return { type: "create" };
  const editMatch = path.match(/^\/master\/buyers\/([a-zA-Z0-9-]+)\/edit$/);
  if (editMatch) return { type: "edit", id: editMatch[1] };
  const viewMatch = path.match(/^\/master\/buyers\/([a-zA-Z0-9-]+)$/);
  if (viewMatch) return { type: "view", id: viewMatch[1] };
  return { type: null };
}

// Helper: parse /master/styles, /master/styles/create, /master/styles/:id, and /master/styles/:id/edit
function parseStylePath(path: string): { type: "list" | "create" | "edit" | "view" | null; id?: string } {
  if (path === "/master/styles") return { type: "list" };
  if (path === "/master/styles/create") return { type: "create" };
  const editMatch = path.match(/^\/master\/styles\/([a-zA-Z0-9-]+)\/edit$/);
  if (editMatch) return { type: "edit", id: editMatch[1] };
  const viewMatch = path.match(/^\/master\/styles\/([a-zA-Z0-9-]+)$/);
  if (viewMatch) return { type: "view", id: viewMatch[1] };
  return { type: null };
}

export function App() {
  const { isAuthenticated, canAccessWidget } = useAuthStore();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Dashboard is accessible to all authenticated users; inner widgets are permission-dependent
  const canViewDashboard = isAuthenticated;

  const canViewMasterBuyers = canAccessWidget(
    ['master_data.buyers.profile.view'],
    ['superadmin', 'admin', 'standarduser', 'merchandiser']
  );
  const canViewCompanies = canAccessWidget(
    ['system_admin.companies.profile.view'],
    ['superadmin', 'admin']
  );
  const canViewUsers = canAccessWidget(
    ['system_admin.users.account.view', 'system_admin.users.view'],
    ['superadmin', 'admin']
  );
  const canViewRoles = canAccessWidget(
    ['system_admin.roles.matrix.view', 'system_admin.roles.view'],
    ['superadmin', 'admin']
  );
  const canViewAgents = canAccessWidget(
    ['master_data.agents.profile.view'],
    ['superadmin', 'admin', 'standarduser', 'merchandiser']
  );
  const canViewStyles = canAccessWidget(
    ['master_data.styles.profile.view', 'merchandising.styles.view'],
    ['superadmin', 'admin', 'standarduser', 'merchandiser']
  );

  const defaultLandingPath = "/dashboard";

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (currentPath === "/" || currentPath === "/login") {
        window.history.replaceState({}, "", defaultLandingPath);
        setCurrentPath(defaultLandingPath);
      }
    }
  }, [isAuthenticated, currentPath, defaultLandingPath]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (currentPath === "/login") {
    window.history.replaceState({}, "", defaultLandingPath);
  }

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const handleSelectModule = (moduleId: string) => {
    if (moduleId === "dashboard") {
      navigateTo("/dashboard");
    } else if (moduleId === "profile") {
      navigateTo("/profile");
    } else if (moduleId === "profile-password") {
      navigateTo("/profile#password");
      setTimeout(() => {
        const el = document.getElementById("security-password");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else if (moduleId === "master-buyers") {
      navigateTo("/master/buyers");
    } else if (moduleId === "master-styles" || moduleId === "styles-costing") {
      navigateTo("/master/styles");
    } else if (moduleId === "master-agents") {
      navigateTo("/master/agents");
    } else if (moduleId === "master-companies") {
      navigateTo("/companies");
    } else if (moduleId === "admin-users") {
      navigateTo("/users");
    } else if (moduleId === "admin-roles") {
      navigateTo("/roles");
    } else {
      navigateTo(`/${moduleId}`);
    }
  };

  const isDashboard = currentPath === "/dashboard" || currentPath === "/" || currentPath === "/login";
  const isProfile = currentPath === "/profile";
  const companyRoute = parseCompanyPath(currentPath);
  const isCompanySection = companyRoute.type !== null;
  const userRoute = parseUserPath(currentPath);
  const isUserSection = userRoute.type !== null;
  const roleRoute = parseRolePath(currentPath);
  const isRoleSection = roleRoute.type !== null;
  const agentRoute = parseAgentPath(currentPath);
  const isAgentSection = agentRoute.type !== null;
  const buyerRoute = parseBuyerPath(currentPath);
  const isBuyerSection = buyerRoute.type !== null;
  const styleRoute = parseStylePath(currentPath);
  const isStyleSection = styleRoute.type !== null;

  const isKnownRoute =
    isDashboard ||
    isProfile ||
    isCompanySection ||
    isUserSection ||
    isRoleSection ||
    isAgentSection ||
    isBuyerSection ||
    isStyleSection;
  const isNotFound = !isKnownRoute;

  // Check if current route violates user's authorization
  const isUnauthorized =
    (isDashboard && !canViewDashboard) ||
    (isCompanySection && !canViewCompanies) ||
    (isUserSection && !canViewUsers) ||
    (isRoleSection && !canViewRoles) ||
    (isAgentSection && !canViewAgents) ||
    (isBuyerSection && !canViewMasterBuyers) ||
    (isStyleSection && !canViewStyles);

  // Map current module/path to Category
  const getActiveCategory = (moduleId: string): string | null => {
    if (["profile", "profile-password", "admin-users", "admin-roles"].includes(moduleId)) return "system-admin";
    if (["master-companies", "master-units", "master-buyers", "master-agents", "master-styles", "master-suppliers"].includes(moduleId)) return "master-data";
    if (["inquiries", "styles-costing", "techpacks", "order-pos"].includes(moduleId)) return "merchandising";
    if (["warehouse-rolls", "roll-grn", "shade-lots", "trims-warehouse"].includes(moduleId)) return "materials";
    if (["cad-markers", "spreading-tables", "cutting-bundles", "sewing-lines", "hourly-production"].includes(moduleId)) return "shopfloor";
    if (["qc-inspection", "cutting-qc", "endline-qc"].includes(moduleId)) return "quality";
    if (["finishing-packing", "export-shipment"].includes(moduleId)) return "shipping";
    return null;
  };

  // Determine active module ID for navigation rail
  let currentModuleId: string;
  if (isDashboard) {
    currentModuleId = "dashboard";
  } else if (isProfile) {
    currentModuleId = "profile";
  } else if (isCompanySection) {
    currentModuleId = "master-companies";
  } else if (isUserSection) {
    currentModuleId = "admin-users";
  } else if (isRoleSection) {
    currentModuleId = "admin-roles";
  } else if (isAgentSection) {
    currentModuleId = "master-agents";
  } else if (isBuyerSection) {
    currentModuleId = "master-buyers";
  } else if (isStyleSection) {
    currentModuleId = "master-styles";
  } else {
    currentModuleId = currentPath.replace(/^\//, "").replace("master/buyers", "master-buyers") || "master-buyers";
  }

  const activeCategory = getActiveCategory(currentModuleId);

  // Build breadcrumbs
  const getBreadcrumbs = () => {
    if (isDashboard) {
      return [
        { label: "Home", href: "/dashboard" },
        { label: "Executive Dashboard", active: true },
      ];
    }
    if (isProfile) {
      return [
        { label: "Home", href: "/dashboard" },
        { label: "System Admin", href: "/profile" },
        { label: "User Account & Profile", href: "/profile" },
        { label: "My Profile", active: true },
      ];
    }
    if (isCompanySection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "Master Data", href: "/companies" },
        { label: "Organization Setup", href: "/companies" },
      ];
      if (companyRoute.type === "list") {
        return [...base, { label: "Company Directory", active: true }];
      }
      if (companyRoute.type === "create") {
        return [...base, { label: "Company Directory", href: "/companies" }, { label: "Create Company", active: true }];
      }
      if (companyRoute.type === "edit") {
        return [...base, { label: "Company Directory", href: "/companies" }, { label: "Edit Company", active: true }];
      }
      if (companyRoute.type === "view") {
        return [...base, { label: "Company Directory", href: "/companies" }, { label: "Company Profile", active: true }];
      }
    }
    if (isUserSection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "System Admin", href: "/users" },
        { label: "User Directory", href: "/users" },
      ];
      if (userRoute.type === "list") {
        return [...base, { label: "User Directory", active: true }];
      }
      if (userRoute.type === "create") {
        return [...base, { label: "User Directory", href: "/users" }, { label: "Create User", active: true }];
      }
      if (userRoute.type === "edit") {
        return [...base, { label: "User Directory", href: "/users" }, { label: "Edit User", active: true }];
      }
      if (userRoute.type === "view") {
        return [...base, { label: "User Directory", href: "/users" }, { label: "User Profile", active: true }];
      }
    }
    if (isRoleSection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "System Admin", href: "/roles" },
        { label: "User Directory", href: "/roles" },
      ];
      if (roleRoute.type === "list") {
        return [...base, { label: "Role Matrix", active: true }];
      }
      if (roleRoute.type === "create") {
        return [...base, { label: "Role Matrix", href: "/roles" }, { label: "Create Role", active: true }];
      }
      if (roleRoute.type === "matrix") {
        return [...base, { label: "Role Matrix", href: "/roles" }, { label: "Policy Matrix Grid", active: true }];
      }
    }
    if (isAgentSection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "Master Data", href: "/master/buyers" },
        { label: "Merchandising", href: "/master/agents" },
      ];
      if (agentRoute.type === "list") {
        return [...base, { label: "Buying Agent Directory", active: true }];
      }
      if (agentRoute.type === "create") {
        return [...base, { label: "Buying Agent Directory", href: "/master/agents" }, { label: "Create Agent", active: true }];
      }
      if (agentRoute.type === "edit") {
        return [...base, { label: "Buying Agent Directory", href: "/master/agents" }, { label: "Edit Agent", active: true }];
      }
      if (agentRoute.type === "view") {
        return [...base, { label: "Buying Agent Directory", href: "/master/agents" }, { label: "Agent Profile", active: true }];
      }
    }
    if (isBuyerSection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "Master Data", href: "/master/buyers" },
        { label: "Merchandising", href: "/master/buyers" },
      ];
      if (buyerRoute.type === "list") {
        return [...base, { label: "Buyer Directory", active: true }];
      }
      if (buyerRoute.type === "create") {
        return [...base, { label: "Buyer Directory", href: "/master/buyers" }, { label: "Create Buyer", active: true }];
      }
      if (buyerRoute.type === "edit") {
        return [...base, { label: "Buyer Directory", href: "/master/buyers" }, { label: "Edit Buyer", active: true }];
      }
      if (buyerRoute.type === "view") {
        return [...base, { label: "Buyer Directory", href: "/master/buyers" }, { label: "Buyer Profile", active: true }];
      }
    }
    if (isStyleSection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "Master Data", href: "/master/styles" },
        { label: "Merchandising", href: "/master/styles" },
      ];
      if (styleRoute.type === "list") {
        return [...base, { label: "Style Library", active: true }];
      }
      if (styleRoute.type === "create") {
        return [...base, { label: "Style Library", href: "/master/styles" }, { label: "Create Style", active: true }];
      }
      if (styleRoute.type === "edit") {
        return [...base, { label: "Style Library", href: "/master/styles" }, { label: "Edit Style", active: true }];
      }
      if (styleRoute.type === "view") {
        return [...base, { label: "Style Library", href: "/master/styles" }, { label: "Style Profile", active: true }];
      }
    }
    if (isUnauthorized) {
      return [
        { label: "Home", href: "/dashboard" },
        { label: "Access Denied", active: true },
      ];
    }
    return [
      { label: "Home", href: "/dashboard" },
      { label: "Page Not Found", active: true },
    ];
  };

  // Render the main content area
  const renderContent = () => {
    // 1. Guard against Unauthorized Access (403)
    if (isUnauthorized) {
      return <AccessDeniedPage currentPath={currentPath} onNavigate={navigateTo} />;
    }

    if (isDashboard) return <ExecutiveDashboard />;
    if (isProfile) return <UserProfilePage />;

    // Company Section Routes
    if (isCompanySection) {
      if (companyRoute.type === "list") {
        return <CompanyListPage onNavigate={navigateTo} />;
      }
      if (companyRoute.type === "create") {
        return <CompanyFormPage mode="create" onNavigate={navigateTo} />;
      }
      if (companyRoute.type === "edit" && companyRoute.id) {
        return <CompanyFormPage mode="edit" companyId={companyRoute.id} onNavigate={navigateTo} />;
      }
      if (companyRoute.type === "view" && companyRoute.id) {
        return <CompanyDetailsPage companyId={companyRoute.id} onNavigate={navigateTo} />;
      }
    }

    // User Section Routes
    if (isUserSection) {
      if (userRoute.type === "list") {
        return <UserListPage onNavigate={navigateTo} />;
      }
      if (userRoute.type === "create") {
        return <UserFormPage mode="create" onNavigate={navigateTo} />;
      }
      if (userRoute.type === "edit" && userRoute.id) {
        return <UserFormPage mode="edit" userId={userRoute.id} onNavigate={navigateTo} />;
      }
      if (userRoute.type === "view" && userRoute.id) {
        return <UserDetailsPage userId={userRoute.id} onNavigate={navigateTo} />;
      }
      if (userRoute.type === "permissions" && userRoute.id) {
        return <UserPermissionsPage userId={userRoute.id} onNavigate={navigateTo} />;
      }
    }

    // Role Section Routes
    if (isRoleSection) {
      if (roleRoute.type === "list") {
        return <RoleListPage onNavigate={navigateTo} />;
      }
      if (roleRoute.type === "create") {
        return <RoleCreatePage onNavigate={navigateTo} />;
      }
      if (roleRoute.type === "matrix" && roleRoute.id) {
        return <RoleMatrixPage roleId={roleRoute.id} onNavigate={navigateTo} />;
      }
    }

    // Agent Section Routes
    if (isAgentSection) {
      if (agentRoute.type === "list") {
        return <AgentListPage onNavigate={navigateTo} />;
      }
      if (agentRoute.type === "create") {
        return <AgentFormPage mode="create" onNavigate={navigateTo} />;
      }
      if (agentRoute.type === "edit" && agentRoute.id) {
        return <AgentFormPage mode="edit" agentId={agentRoute.id} onNavigate={navigateTo} />;
      }
      if (agentRoute.type === "view" && agentRoute.id) {
        return <AgentDetailsPage agentId={agentRoute.id} onNavigate={navigateTo} />;
      }
    }

    // Buyer Section Routes (Phase 1: Dynamic Master Data)
    if (isBuyerSection) {
      if (buyerRoute.type === "list") {
        return <BuyerListPage onNavigate={navigateTo} />;
      }
      if (buyerRoute.type === "create") {
        return <BuyerFormPage mode="create" onNavigate={navigateTo} />;
      }
      if (buyerRoute.type === "edit" && buyerRoute.id) {
        return <BuyerFormPage mode="edit" buyerId={buyerRoute.id} onNavigate={navigateTo} />;
      }
      if (buyerRoute.type === "view" && buyerRoute.id) {
        return <BuyerDetailsPage buyerId={buyerRoute.id} onNavigate={navigateTo} />;
      }
    }

    // Style Section Routes (100% Woven Master Data)
    if (isStyleSection) {
      if (styleRoute.type === "list") {
        return <StyleListPage onNavigate={navigateTo} />;
      }
      if (styleRoute.type === "create") {
        return <StyleFormPage mode="create" onNavigate={navigateTo} />;
      }
      if (styleRoute.type === "edit" && styleRoute.id) {
        return <StyleFormPage mode="edit" styleId={styleRoute.id} onNavigate={navigateTo} />;
      }
      if (styleRoute.type === "view" && styleRoute.id) {
        return <StyleDetailsPage styleId={styleRoute.id} onNavigate={navigateTo} />;
      }
    }

    // Standard 404 Fallback for unmapped/wrong routes
    return <NotFoundPage currentPath={currentPath} onNavigate={navigateTo} />;
  };

  return (
    <AppLayout
      currentModuleId={currentModuleId}
      hideRail={isDashboard || isNotFound || isUnauthorized}
      activeCategory={activeCategory}
      onProfileClick={() => navigateTo("/profile")}
      breadcrumbs={getBreadcrumbs()}
      onSelectModule={handleSelectModule}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default App;
