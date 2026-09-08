import { useState, useEffect } from "react";
import { Plus, Download, Edit2, Eye } from "lucide-react";
import { PageHeader } from "./components/common/PageHeader";
import { FilterToolbar } from "./components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "./components/common/DataTable";
import { Button } from "./components/common/Button";
import { Badge } from "./components/common/Badge";
import { TableActionButton } from "./components/common/TableActionButton";
import { UI_TOKENS } from "./config/designTokens";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./features/Auth/LoginPage";
import { ExecutiveDashboard } from "./features/Dashboard/ExecutiveDashboard";
import { UserProfilePage } from "./features/Profile/UserProfilePage";
import { CompanyListPage } from "./features/Companies/CompanyListPage";
import { CompanyFormPage } from "./features/Companies/CompanyFormPage";
import { CompanyDetailsPage } from "./features/Companies/CompanyDetailsPage";
import { useAuthStore } from "./store/authStore";

interface BuyerRow {
  id: string;
  code: string;
  name: string;
  country: string;
  brandsCount: number;
  status: "Active" | "Inactive";
}

const SAMPLE_BUYERS: BuyerRow[] = [
  { id: "1", code: "AWL-BYR-001", name: "H&M Hennes & Mauritz", country: "Sweden", brandsCount: 4, status: "Active" },
  { id: "2", code: "AWL-BYR-002", name: "Zara (Inditex Group)", country: "Spain", brandsCount: 6, status: "Active" },
  { id: "3", code: "AWL-BYR-003", name: "Marks & Spencer (M&S)", country: "United Kingdom", brandsCount: 2, status: "Active" },
  { id: "4", code: "AWL-BYR-004", name: "Next Retail Ltd", country: "United Kingdom", brandsCount: 3, status: "Inactive" },
  { id: "5", code: "AWL-BYR-005", name: "PVH Corp (Tommy Hilfiger / Calvin Klein)", country: "United States", brandsCount: 5, status: "Active" },
];

// Helper: parse /companies/:id and /companies/:id/edit
function parseCompanyPath(path: string): { type: "list" | "create" | "edit" | "view" | null; id?: number } {
  if (path === "/companies") return { type: "list" };
  if (path === "/companies/create") return { type: "create" };
  const editMatch = path.match(/^\/companies\/(\d+)\/edit$/);
  if (editMatch) return { type: "edit", id: parseInt(editMatch[1]) };
  const viewMatch = path.match(/^\/companies\/(\d+)$/);
  if (viewMatch) return { type: "view", id: parseInt(viewMatch[1]) };
  return { type: null };
}

export function App() {
  const { isAuthenticated, canAccessWidget } = useAuthStore();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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
    } else if (moduleId === "master-companies") {
      navigateTo("/companies");
    } else {
      navigateTo(`/${moduleId}`);
    }
  };

  const isDashboard = currentPath === "/dashboard" || currentPath === "/" || currentPath === "/login";
  const isProfile = currentPath === "/profile";
  const companyRoute = parseCompanyPath(currentPath);
  const isCompanySection = companyRoute.type !== null;

  // Handle column sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Logic
  const filteredData = SAMPLE_BUYERS.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortField as keyof BuyerRow];
    let valB = b[sortField as keyof BuyerRow];

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const getSortHeaderName = () => {
    const col = columns.find(c => c.key === sortField);
    return col ? `${col.header} (${sortDirection.toUpperCase()})` : `Name (${sortDirection.toUpperCase()})`;
  };

  const columns: ColumnDef<BuyerRow>[] = [
    {
      key: "code",
      header: "Buyer Code",
      render: (item) => <Badge variant="code">{item.code}</Badge>,
    },
    {
      key: "name",
      header: "Buyer Name",
      render: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
    },
    {
      key: "country",
      header: "Country",
      render: (item) => <span className="text-slate-600">{item.country}</span>,
    },
    {
      key: "brandsCount",
      header: "Assigned Brands",
      align: "center",
      render: (item) => <Badge variant="neutral">{item.brandsCount} Brands</Badge>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (item) => (
        <Badge variant={item.status === "Active" ? "success" : "danger"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: () => (
        <div className="flex items-center justify-end gap-1.5">
          <TableActionButton variant="secondary" icon={<Eye className="h-3 w-3" />}>
            View
          </TableActionButton>
          <TableActionButton variant="primary" icon={<Edit2 className="h-3 w-3" />}>
            Edit
          </TableActionButton>
        </div>
      ),
    },
  ];

  // Map current module/path to Category
  const getActiveCategory = (moduleId: string): string | null => {
    if (["profile", "profile-password", "admin-users", "admin-roles"].includes(moduleId)) return "auth";
    if (["master-companies", "master-buyers", "master-suppliers", "master-units"].includes(moduleId)) return "governance";
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
        return [...base, { label: "Sister Companies", active: true }];
      }
      if (companyRoute.type === "create") {
        return [...base, { label: "Sister Companies", href: "/companies" }, { label: "Register Company", active: true }];
      }
      if (companyRoute.type === "edit") {
        return [...base, { label: "Sister Companies", href: "/companies" }, { label: "Edit Company", active: true }];
      }
      if (companyRoute.type === "view") {
        return [...base, { label: "Sister Companies", href: "/companies" }, { label: "Company Profile", active: true }];
      }
    }
    return [
      { label: "Home", href: "/dashboard" },
      { label: "Master Data", href: "/master/buyers" },
      { label: "Buyer Directory", active: true },
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

    // Default: Buyer Directory (placeholder)
    return (
      <>
        <PageHeader
          title="Buyer Directory"
          badgeCount={sortedData.length}
          badgeLabel="Registered Buyers"
          actions={
            <>
              <Button variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>
                Export List
              </Button>
              <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                Create Buyer
              </Button>
            </>
          }
        />

        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          activeSortLabel={getSortHeaderName()}
          searchPlaceholder="Search buyers by code, name, or country..."
          onFilterSubmit={() => {}}
          onReset={() => {
            setSearch("");
            setStatusFilter("ALL");
            setSortField("name");
            setSortDirection("asc");
          }}
          filterInputs={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          }
        />

        <DataTable
          columns={columns}
          data={sortedData}
          totalRecords={sortedData.length}
          currentPage={page}
          totalPages={1}
          pageSize={pageSize}
          onPageChange={setPage}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </>
    );
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
