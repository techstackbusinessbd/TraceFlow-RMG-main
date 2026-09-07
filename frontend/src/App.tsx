import { useState, useEffect } from "react";
import { Plus, Download, Edit2, Eye, LogOut, Lock } from "lucide-react";
import { PageHeader } from "./components/common/PageHeader";
import { FilterToolbar } from "./components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "./components/common/DataTable";
import { Button } from "./components/common/Button";
import { Badge } from "./components/common/Badge";
import { TableActionButton } from "./components/common/TableActionButton";
import { LoginPage } from "./features/Auth/LoginPage";
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

export function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  // If path is /login or user is not logged in, render LoginPage
  if (currentPath === "/login" || (!isAuthenticated && currentPath !== "/")) {
    return <LoginPage />;
  }

  const columns: ColumnDef<BuyerRow>[] = [
    {
      key: "code",
      header: "Buyer Code",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {item.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Buyer Name",
      render: (item) => <span className="font-medium text-slate-900">{item.name}</span>,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Pinned Top Navigation Bar */}
      <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
            TF
          </div>
          <span className="font-semibold tracking-wide text-sm">TraceFlow RMG</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            Enterprise Woven Traceability
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Active Plant: <strong className="text-white">Ananta Woven Ltd (AWL)</strong></span>
          <span className="h-3 w-px bg-slate-700" />
          
          {user ? (
            <div className="flex items-center gap-3">
              <span>
                User: <strong className="text-white">{user.name}</strong> ({user.roles.join(", ")}) | ID: <span className="font-mono text-cyan-300">{user.emp_id}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigateTo("/login");
                }}
                className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigateTo("/login")}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Page Content (3-Tier Golden List Architecture Demo) */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Tier 1: Sleek Header Row */}
        <PageHeader
          title="Buyer Directory"
          badgeCount={SAMPLE_BUYERS.length}
          badgeLabel="Registered Buyers"
          actions={
            <>
              <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
                Export List
              </Button>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
                Create Buyer
              </Button>
            </>
          }
        />

        {/* Tier 2: Unified Filter Toolbar */}
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          activeSortLabel="Buyer Name (ASC)"
          searchPlaceholder="Search buyers by code, name, or country..."
        />

        {/* Tier 3: Enterprise DataTable Shell */}
        <DataTable
          columns={columns}
          data={SAMPLE_BUYERS}
          totalRecords={SAMPLE_BUYERS.length}
          currentPage={page}
          totalPages={1}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
}

export default App;
