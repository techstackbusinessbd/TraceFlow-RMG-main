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
import {
  getStyles,
  deleteStyle,
  toggleStyleStatus,
  type WovenStyle,
} from "../../services/styleService";
import { getCompanies, type Company } from "../../services/companyService";
import { getBuyers, type Buyer } from "../../services/buyerService";
import { useAuthStore } from "../../store/authStore";

interface StyleListPageProps {
  onNavigate: (path: string) => void;
}

export const StyleListPage: React.FC<StyleListPageProps> = ({ onNavigate }) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canCreate = hasRole("superadmin") || hasPermission("master_data.styles.profile.create");
  const canEdit = hasRole("superadmin") || hasPermission("master_data.styles.profile.update");
  const canDelete = hasRole("superadmin") || hasPermission("master_data.styles.profile.delete");

  const [styles, setStyles] = useState<WovenStyle[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sortField, setSortField] = useState("buyer_style_no");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<WovenStyle | null>(null);
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
    getBuyers({ per_page: 100 })
      .then((res) => setBuyers(res.data))
      .catch(() => {});
  }, []);

  const loadStyles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getStyles({
        page: currentPage,
        per_page: pageSize,
        search: search.trim() || undefined,
        company_id: companyFilter ? Number(companyFilter) : undefined,
        buyer_id: buyerFilter || undefined,
        product_category: categoryFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortField,
        sort_dir: sortDirection,
      });
      setStyles(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.last_page);
    } catch {
      showToast("error", "Failed to Load", "Could not fetch style library records.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, companyFilter, buyerFilter, categoryFilter, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  const handleToggleStatus = async (style: WovenStyle) => {
    try {
      const res = await toggleStyleStatus(style.uuid || style.id);
      setStyles((prev) =>
        prev.map((s) => (s.id === style.id ? { ...s, is_active: res.data.is_active } : s))
      );
      showToast("success", "Status Updated", res.message);
    } catch {
      showToast("error", "Action Failed", "Could not toggle style status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteStyle(deleteTarget.uuid || deleteTarget.id);
      showToast("success", "Deleted", res.message);
      setDeleteTarget(null);
      loadStyles();
    } catch {
      showToast("error", "Delete Failed", "Could not delete style record.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortHeaderName = () => {
    const labels: Record<string, string> = {
      code: "System Code",
      buyer_style_no: "Style Number",
      style_name: "Style Name",
      season: "Season",
      base_smv: "Base SMV",
      is_active: "Status",
    };
    const label = labels[sortField] || "Style Number";
    return `${label} (${sortDirection.toUpperCase()})`;
  };

  const columns: ColumnDef<WovenStyle>[] = [
    {
      key: "code",
      header: "Style Code",
      sortable: true,
      render: (style) => <Badge variant="code">{style.code}</Badge>,
    },
    {
      key: "buyer_style_no",
      header: "Buyer Style No",
      sortable: true,
      render: (style) => (
        <div>
          <span className="font-semibold text-slate-900 block font-mono text-xs">{style.buyer_style_no}</span>
          <span className="text-xs text-slate-500">{style.style_name}</span>
        </div>
      ),
    },
    {
      key: "buyer",
      header: "Buyer",
      sortable: false,
      render: (style) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">{style.buyer?.name || "—"}</span>
          {style.brand && <span className="text-[11px] text-slate-400">Brand: {style.brand.name}</span>}
        </div>
      ),
    },
    {
      key: "product_category",
      header: "Woven Category",
      sortable: false,
      render: (style) => (
        <div>
          <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block max-w-fit">
            {style.product_category}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">{style.garment_item}</span>
        </div>
      ),
    },
    {
      key: "fabric_type",
      header: "Fabric & Wash",
      sortable: false,
      render: (style) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-700 font-medium">{style.fabric_type}</div>
          <div className="text-slate-400 text-[11px]">{style.wash_type}</div>
        </div>
      ),
    },
    {
      key: "base_smv",
      header: "Base SMV",
      align: "center",
      sortable: true,
      render: (style) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {Number(style.base_smv).toFixed(2)} min
        </span>
      ),
    },
    {
      key: "colors_sizes",
      header: "Matrix",
      align: "center",
      sortable: false,
      render: (style) => (
        <div className="flex items-center justify-center gap-1.5">
          <Badge variant="neutral">{(style.colors || []).length} Colors</Badge>
          <Badge variant="neutral">{(style.sizes || []).length} Sizes</Badge>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      align: "center",
      sortable: true,
      render: (style) => (
        <Badge variant={style.is_active ? "success" : "danger"}>
          {style.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (style) => (
        <RowActionsMenu
          primaryActions={[
            {
              icon: <Eye className="w-3.5 h-3.5" />,
              label: "View Style",
              variant: "secondary",
              onClick: () => onNavigate(`/master/styles/${style.uuid || style.id}`),
            },
            ...(canEdit
              ? [
                  {
                    icon: <Edit2 className="w-3.5 h-3.5" />,
                    label: "Edit Style",
                    variant: "primary" as const,
                    onClick: () => onNavigate(`/master/styles/${style.uuid || style.id}/edit`),
                  },
                ]
              : []),
          ]}
          menuActions={[
            ...(canEdit
              ? [
                  {
                    label: style.is_active ? "Deactivate Style" : "Activate Style",
                    icon: style.is_active ? (
                      <ToggleRight className="w-3.5 h-3.5" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5" />
                    ),
                    onClick: () => handleToggleStatus(style),
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    label: "Delete Style",
                    icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                    variant: "danger" as const,
                    onClick: () => setDeleteTarget(style),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tier 1: Page Header */}
      <PageHeader
        title="Style Library"
        badgeLabel="Woven Garments"
        badgeCount={`${total} Styles`}
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => onNavigate("/master/styles/create")}
              >
                Create Style
              </Button>
            )}
          </div>
        }
      />

      {/* Tier 2: Unified Filter Toolbar */}
      <FilterToolbar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        activeSortLabel={getSortHeaderName()}
        searchPlaceholder="Search styles by code, style no, name, fabric, or wash..."
        onFilterSubmit={loadStyles}
        onReset={() => {
          setSearch("");
          setCompanyFilter("");
          setBuyerFilter("");
          setCategoryFilter("");
          setStatusFilter("");
          setSortField("buyer_style_no");
          setSortDirection("asc");
          setCurrentPage(1);
        }}
        filterInputs={
          <div className="flex flex-wrap items-center gap-2">
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
              value={buyerFilter}
              onChange={(e) => {
                setBuyerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Buyers</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Categories</option>
              <option value="Woven Tops (Shirts/Blouses)">Woven Tops (Shirts)</option>
              <option value="Woven Bottoms (Trousers/Chinos)">Woven Bottoms (Chinos)</option>
              <option value="Denim & Jeans">Denim & Jeans</option>
              <option value="Cargo & Utility Shorts">Cargo & Utility Shorts</option>
              <option value="Outerwear / Woven Jackets">Outerwear & Jackets</option>
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
              <option value="Development">Development</option>
              <option value="Sampling">Sampling</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Bulk_Approved">Bulk Approved</option>
            </select>
          </div>
        }
      />

      {/* Tier 3: DataTable Shell */}
      <DataTable<WovenStyle>
        columns={columns}
        data={styles}
        totalRecords={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={(p: number) => setCurrentPage(p)}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        isLoading={isLoading}
        emptyMessage="No woven styles found matching the selected criteria."
      />

      {/* Confirmation Dialog for Destructive Action */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Confirm Style Deletion</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <span className="font-semibold text-slate-800">{deleteTarget.code} ({deleteTarget.buyer_style_no})</span>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
