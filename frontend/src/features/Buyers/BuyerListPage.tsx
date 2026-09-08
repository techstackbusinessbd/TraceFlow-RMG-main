import React, { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Edit2, ToggleLeft, ToggleRight, Trash2, AlertCircle } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { RowActionsMenu } from "../../components/common/RowActionsMenu";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getBuyers, deleteBuyer, toggleBuyerStatus, type Buyer } from "../../services/buyerService";
import { getCompanies, type Company } from "../../services/companyService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface BuyerListPageProps {
  onNavigate: (path: string) => void;
}

export const BuyerListPage: React.FC<BuyerListPageProps> = ({ onNavigate }) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canCreate = hasRole("superadmin") || hasPermission("master_data.buyers.profile.create");
  const canEdit = hasRole("superadmin") || hasPermission("master_data.buyers.profile.update");
  const canDelete = hasRole("superadmin") || hasPermission("master_data.buyers.profile.delete");

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Buyer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getCompanies({ per_page: 100 })
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }, []);

  const loadBuyers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBuyers({
        search,
        company_id: companyFilter || undefined,
        status: statusFilter as "" | "active" | "inactive",
        sort_field: sortField,
        sort_direction: sortDirection,
        per_page: pageSize,
        page: currentPage,
      });
      setBuyers(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.last_page);
    } catch {
      showToast("error", "Failed to Load", "Could not fetch the registered buyers list. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [search, companyFilter, statusFilter, sortField, sortDirection, pageSize, currentPage]);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleToggleStatus = async (buyer: Buyer) => {
    try {
      const res = await toggleBuyerStatus(buyer.id);
      showToast("success", "Status Updated", res.message);
      setBuyers((prev) =>
        prev.map((b) => (b.id === buyer.id ? { ...b, is_active: res.data.is_active } : b))
      );
    } catch {
      showToast("error", "Update Failed", "Could not toggle buyer status. Try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteBuyer(deleteTarget.id);
      showToast("success", "Buyer Removed", res.message);
      setDeleteTarget(null);
      loadBuyers();
    } catch {
      showToast("error", "Delete Failed", "Could not delete buyer. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getSortHeaderName = () => {
    const labels: Record<string, string> = {
      code: "Buyer Code",
      name: "Buyer Name",
      country: "Country",
      brands_count: "Brands Count",
      is_active: "Status",
    };
    const label = labels[sortField] || "Buyer Name";
    return `${label} (${sortDirection.toUpperCase()})`;
  };

  const columns: ColumnDef<Buyer>[] = [
    {
      key: "code",
      header: "Buyer Code",
      sortable: true,
      render: (buyer) => <Badge variant="code">{buyer.code}</Badge>,
    },
    {
      key: "name",
      header: "Buyer Name",
      sortable: true,
      render: (buyer) => (
        <div>
          <span className="font-semibold text-slate-900 block">{buyer.name}</span>
          {buyer.contact_person && (
            <span className="text-xs text-slate-500">Contact: {buyer.contact_person}</span>
          )}
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      sortable: true,
      render: (buyer) => <span className="text-slate-700 font-medium">{buyer.country}</span>,
    },
    {
      key: "company",
      header: "Company",
      sortable: false,
      render: (buyer) => (
        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {buyer.company?.code || "PLT"}
        </span>
      ),
    },
    {
      key: "brands_count",
      header: "Brands",
      align: "center",
      sortable: true,
      render: (buyer) => (
        <Badge variant={buyer.brands_count && buyer.brands_count > 0 ? "neutral" : "warning"}>
          {buyer.brands_count || 0} Brands
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Contact Info",
      sortable: false,
      render: (buyer) => (
        <div className="text-xs space-y-0.5">
          {buyer.email && <div className="text-slate-600">{buyer.email}</div>}
          {buyer.phone && <div className="font-mono text-slate-500">{formatPhoneNumber(buyer.phone)}</div>}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      align: "center",
      sortable: true,
      render: (buyer) => (
        <Badge variant={buyer.is_active ? "success" : "danger"}>
          {buyer.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (buyer) => (
        <RowActionsMenu
          primaryActions={[
            {
              icon: <Eye className="w-3.5 h-3.5" />,
              label: "View Profile",
              variant: "secondary",
              onClick: () => onNavigate(`/master/buyers/${buyer.id}`),
            },
            ...(canEdit
              ? [
                  {
                    icon: <Edit2 className="w-3.5 h-3.5" />,
                    label: "Edit Buyer",
                    variant: "primary" as const,
                    onClick: () => onNavigate(`/master/buyers/${buyer.id}/edit`),
                  },
                ]
              : []),
          ]}
          menuActions={[
            ...(canEdit
              ? [
                  {
                    label: buyer.is_active ? "Deactivate Buyer" : "Activate Buyer",
                    icon: buyer.is_active ? (
                      <ToggleLeft className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                    ),
                    variant: buyer.is_active ? ("warning" as const) : ("default" as const),
                    onClick: () => handleToggleStatus(buyer),
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    label: "Delete Buyer",
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    variant: "danger" as const,
                    onClick: () => setDeleteTarget(buyer),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tier 1: Sleek Header Row */}
      <PageHeader
        title="Buyer Directory"
        badgeCount={total}
        badgeLabel="Buyers"
        actions={
          canCreate ? (
            <Button
              variant="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/master/buyers/create")}
            >
              Create Buyer
            </Button>
          ) : undefined
        }
      />

      {/* Tier 2: Filter Toolbar */}
      <FilterToolbar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(val) => {
          setPageSize(val);
          setCurrentPage(1);
        }}
        activeSortLabel={getSortHeaderName()}
        searchPlaceholder="Search buyers by code, name, country, or contact..."
        onFilterSubmit={loadBuyers}
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setCompanyFilter("");
          setSortField("name");
          setSortDirection("asc");
          setCurrentPage(1);
        }}
        filterInputs={
          <div className="flex items-center gap-2">
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        }
      />

      {/* Tier 3: Standard DataTable Shell */}
      <DataTable
        columns={columns}
        data={buyers}
        totalRecords={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={(p: number) => setCurrentPage(p)}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        isLoading={isLoading}
        emptyMessage="No buyers found matching criteria."
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-slate-900">Confirm Buyer Deletion</h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to soft-delete buyer{" "}
                  <strong className="text-slate-900 font-semibold">{deleteTarget.name}</strong> (
                  {deleteTarget.code})? Associated brands and orders will be preserved in history.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
    </div>
  );
};
