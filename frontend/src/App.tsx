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
import { NotFoundPage } from "./components/common/NotFoundPage";
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

export function App() {
  const { isAuthenticated, canAccessWidget } = useAuthStore();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const canViewDashboard = canAccessWidget(
    ['dashboard.view', 'executive.dashboard.view'],
    ['superadmin', 'admin', 'executive', 'management']
  );
  const canViewMasterBuyers = canAccessWidget(
    ['master_data.buyers.profile.view'],
    ['superadmin', 'admin', 'standarduser', 'merchandiser']
  );

  const defaultLandingPath = canViewDashboard ? "/dashboard" : "/master/buyers";

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
      } else if (currentPath === "/dashboard" && !canViewDashboard && canViewMasterBuyers) {
        window.history.replaceState({}, "", "/master/buyers");
        setCurrentPath("/master/buyers");
      }
    }
  }, [isAuthenticated, currentPath, canViewDashboard, canViewMasterBuyers, defaultLandingPath]);

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
    } else if (moduleId === "master-buyers") {
      navigateTo("/master/buyers");
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

  // Map current module/path to Category
  const getActiveCategory = (moduleId: string): string | null => {
    if (["profile", "profile-password", "admin-users", "admin-roles"].includes(moduleId)) return "auth";
    if (["master-companies", "master-agents", "master-buyers", "master-suppliers", "master-units"].includes(moduleId)) return "governance";
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
        { label: "Security & Accounts", href: "/profile" },
        { label: "User Profile", active: true },
      ];
    }
    if (isCompanySection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "Governance & Setup", href: "/companies" },
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
        { label: "System Admin & Auth", href: "/users" },
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
        { label: "System Admin & Auth", href: "/roles" },
      ];
      if (roleRoute.type === "list") {
        return [...base, { label: "Roles & Policy Matrix", active: true }];
      }
      if (roleRoute.type === "create") {
        return [...base, { label: "Roles & Policy Matrix", href: "/roles" }, { label: "Create Role", active: true }];
      }
      if (roleRoute.type === "matrix") {
        return [...base, { label: "Roles & Policy Matrix", href: "/roles" }, { label: "Policy Matrix Grid", active: true }];
      }
    }
    if (isAgentSection) {
      const base = [
        { label: "Home", href: "/dashboard" },
        { label: "Master Data", href: "/master/agents" },
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
    return [
      { label: "Home", href: "/dashboard" },
      { label: "Page Not Found", active: true },
    ];
  };

  // Render the main content area
  const renderContent = () => {
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

    // Standard 404 Fallback for unmapped/wrong routes
    return <NotFoundPage currentPath={currentPath} onNavigate={navigateTo} />;
  };

  return (
    <AppLayout
      currentModuleId={currentModuleId}
      hideRail={isDashboard}
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
