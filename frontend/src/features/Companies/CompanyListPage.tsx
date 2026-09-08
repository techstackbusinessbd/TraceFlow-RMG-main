import React, { useState, useEffect, useCallback } from "react";
import { Plus, Download, Eye, Edit2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { TableActionButton } from "../../components/common/TableActionButton";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getCompanies, deleteCompany, toggleCompanyStatus, type Company } from "../../services/companyService";

interface CompanyListPageProps {
  onNavigate: (path: string) => void;
}

export const CompanyListPage: React.FC<CompanyListPageProps> = ({ onNavigate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCompanies({
        search,
        status: statusFilter as "" | "active" | "inactive",
        sort_field: sortField,
        sort_direction: sortDirection,
        per_page: pageSize,
        page: currentPage,
      });
      setCompanies(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.last_page);
    } catch {
      showToast("error", "Failed to Load", "Could not fetch the companies list. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortField, sortDirection, pageSize, currentPage]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleFilterSubmit = () => {
    setCurrentPage(1);
    loadCompanies();
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("");
    setSortField("name");
    setSortDirection("asc");
    setPageSize(10);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const res = await toggleCompanyStatus(company.id);
      const newStatus = res.data.is_active ? "Activated" : "Deactivated";
      showToast("success", `Company ${newStatus}`, `"${company.name}" has been ${newStatus.toLowerCase()} successfully.`);
      loadCompanies();
    } catch {
      showToast("error", "Status Update Failed", "Could not update company status. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCompany(deleteTarget.id);
      showToast("success", "Company Deleted", `"${deleteTarget.name}" has been removed successfully.`);
      setDeleteTarget(null);
      loadCompanies();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Delete Failed", apiError?.message || "Could not delete company. It may have assigned users.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSortLabel = () => {
    const labels: Record<string, string> = {
      name: "Company Name",
      code: "Code",
      created_at: "Created On",
      is_active: "Status",
      users_count: "Users",
    };
    return `${labels[sortField] ?? sortField} (${sortDirection.toUpperCase()})`;
  };

  const columns: ColumnDef<Company>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (row) => <Badge variant="code">{row.code}</Badge>,
    },
    {
      key: "name",
      header: "Company Name",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          {row.legal_name && (
            <p className="text-[11px] text-slate-500 mt-0.5">{row.legal_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "tax_id",
      header: "Tax / BIN",
      render: (row) =>
        row.tax_id ? (
          <span className="font-mono text-xs text-slate-700">{row.tax_id}</span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: "email",
      header: "Contact",
      render: (row) => (
        <div className="space-y-0.5">
          {row.email && <p className="text-xs text-slate-700">{row.email}</p>}
          {row.phone && <p className="text-[11px] text-slate-500">{row.phone}</p>}
          {!row.email && !row.phone && <span className="text-slate-400 text-xs">—</span>}
        </div>
      ),
    },
    {
      key: "users_count",
      header: "Users",
      align: "center",
      sortable: true,
      render: (row) => (
        <Badge variant="neutral">{row.users_count ?? 0} Users</Badge>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      align: "center",
      sortable: true,
      render: (row) => (
        <Badge variant={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <TableActionButton
            variant="secondary"
            icon={<Eye className="h-3 w-3" />}
            onClick={() => onNavigate(`/companies/${row.id}`)}
          >
            View
          </TableActionButton>
          <TableActionButton
            variant="primary"
            icon={<Edit2 className="h-3 w-3" />}
            onClick={() => onNavigate(`/companies/${row.id}/edit`)}
          >
            Edit
          </TableActionButton>
          <TableActionButton
            variant="secondary"
            icon={row.is_active ? <ToggleRight className="h-3 w-3 text-emerald-600" /> : <ToggleLeft className="h-3 w-3 text-slate-400" />}
            onClick={() => handleToggleStatus(row)}
            title={row.is_active ? "Deactivate" : "Activate"}
          >
            {row.is_active ? "Deactivate" : "Activate"}
          </TableActionButton>
          <TableActionButton
            variant="danger"
            icon={<Trash2 className="h-3 w-3" />}
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </TableActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Sleek Header Row */}
      <PageHeader
        title="Sister Companies"
        badgeCount={total}
        badgeLabel="Companies"
        actions={
          <>
            <Button variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>
              Export List
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/companies/create")}
            >
              Register Company
            </Button>
          </>
        }
      />

      {/* Tier 2: Unified Filter Toolbar */}
      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code, name, tax ID, or email..."
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        activeSortLabel={getSortLabel()}
        onFilterSubmit={handleFilterSubmit}
        onReset={handleReset}
        filterInputs={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        }
      />

      {/* Tier 3: Enterprise DataTable Shell */}
      <DataTable
        columns={columns}
        data={companies}
        totalRecords={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog (Non-CRUD: Destructive Action Only) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Company</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This action cannot be undone.
                  Companies with assigned users cannot be deleted.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
