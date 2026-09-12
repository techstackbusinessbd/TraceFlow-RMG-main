import React, { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Edit2, Trash2, AlertCircle, ShoppingBag, Download } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { RowActionsMenu } from "../../components/common/RowActionsMenu";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getPurchaseOrders,
  deletePurchaseOrder,
  type PurchaseOrder,
} from "../../services/orderService";
import { getOperationalCompanies, type Company } from "../../services/companyService";
import { getBuyers, type Buyer } from "../../services/buyerService";
import { useAuthStore } from "../../store/authStore";

interface OrderListPageProps {
  onNavigate: (path: string) => void;
}

export const OrderListPage: React.FC<OrderListPageProps> = ({ onNavigate }) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canCreate = hasRole("superadmin") || hasPermission("orders.order.create");
  const canEdit = hasRole("superadmin") || hasPermission("orders.order.update");
  const canDelete = hasRole("superadmin") || hasPermission("orders.order.delete");

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getOperationalCompanies()
      .then((operationalList) => setCompanies(operationalList))
      .catch(() => {});
    getBuyers({ per_page: 100 })
      .then((res) => setBuyers(res.data))
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPurchaseOrders({
        page: currentPage,
        per_page: pageSize,
        search: search.trim() || undefined,
        company_id: companyFilter ? Number(companyFilter) : undefined,
        buyer_id: buyerFilter ? Number(buyerFilter) : undefined,
        order_type: orderTypeFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortField,
        sort_dir: sortDirection,
      });
      setOrders(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.last_page);
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast("error", "Failed to Load Orders", e.message || "An error occurred while fetching purchase orders.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, companyFilter, buyerFilter, orderTypeFilter, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleResetFilters = () => {
    setSearch("");
    setCompanyFilter("");
    setBuyerFilter("");
    setOrderTypeFilter("");
    setStatusFilter("");
    setCurrentPage(1);
    setSortField("created_at");
    setSortDirection("desc");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePurchaseOrder(deleteTarget.id);
      showToast("success", "Order Deleted", `Purchase Order ${deleteTarget.buyer_po_number} has been deleted successfully.`);
      setDeleteTarget(null);
      loadOrders();
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast("error", "Delete Failed", e.message || "Could not delete purchase order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getOrderStatusBadge = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "Draft":
        return <Badge variant="neutral">Draft</Badge>;
      case "Confirmed":
        return <Badge variant="info">Confirmed</Badge>;
      case "In_Production":
        return <Badge variant="purple">In Production</Badge>;
      case "Shipped":
        return <Badge variant="success">Shipped</Badge>;
      case "Cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      case "Closed":
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      key: "buyer_po_number",
      header: "Buyer PO #",
      sortable: true,
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-primary-500" />
            {order.buyer_po_number}
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {order.order_code}
          </span>
        </div>
      ),
    },
    {
      key: "style",
      header: "Style & Category",
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {order.style?.buyer_style_no || "—"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
            {order.style?.style_name || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "buyer",
      header: "Buyer & Company",
      render: (order) => (
        <div className="flex flex-col">
          <span className="text-slate-800 dark:text-slate-200 font-medium">
            {order.buyer?.name || "—"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {order.company?.name || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "total_order_qty",
      header: "Quantity & Price",
      sortable: true,
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
            {Number(order.total_order_qty).toLocaleString()} pcs
          </span>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
            {order.currency} {Number(order.unit_price).toFixed(2)} / pc
          </span>
        </div>
      ),
    },
    {
      key: "factory_delivery_date",
      header: "Delivery Date",
      sortable: true,
      render: (order) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Fac: {order.factory_delivery_date || "—"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Buyer: {order.buyer_delivery_date || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "order_type",
      header: "Type",
      render: (order) => (
        <Badge variant={order.order_type === "Regular" ? "info" : "warning"}>
          {order.order_type}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => getOrderStatusBadge(order.status),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (order) => (
        <RowActionsMenu
          primaryActions={[
            {
              icon: <Eye className="w-3.5 h-3.5" />,
              label: "View Order",
              variant: "secondary",
              onClick: () => onNavigate(`/orders/${order.uuid || order.id}`),
            },
            ...(canEdit
              ? [
                  {
                    icon: <Edit2 className="w-3.5 h-3.5" />,
                    label: "Edit Order",
                    variant: "primary" as const,
                    onClick: () => onNavigate(`/orders/${order.uuid || order.id}/edit`),
                  },
                ]
              : []),
          ]}
          menuActions={[
            ...(canDelete
              ? [
                  {
                    label: "Delete Order",
                    icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                    variant: "danger" as const,
                    dividerBefore: true,
                    onClick: () => setDeleteTarget(order),
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
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tier 1: PageHeader */}
      <PageHeader
        title="Purchase Order Directory"
        badgeCount={total}
        badgeLabel="Orders"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const csvRows = [
                  ["Order Code", "Buyer PO #", "Buyer", "Style", "Quantity", "Currency", "FOB Price", "Ex-Factory Date", "Buyer Delivery Date", "Status"],
                  ...orders.map((o) => [
                    o.order_code,
                    o.buyer_po_number,
                    o.buyer?.name || "",
                    o.style?.buyer_style_no || "",
                    o.total_order_qty,
                    o.currency,
                    o.unit_price,
                    o.factory_delivery_date,
                    o.buyer_delivery_date,
                    o.status,
                  ]),
                ];
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Order_Directory_${new Date().toISOString().split("T")[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              icon={<Download className="w-4 h-4" />}
            >
              Export Directory
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                onClick={() => onNavigate("/orders/create")}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Order
              </Button>
            )}
          </div>
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
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by Buyer PO #, Order Code, Style..."
        onFilterSubmit={loadOrders}
        onReset={handleResetFilters}
        filterInputs={
          <div className="flex flex-wrap items-center gap-2">
            {/* Company Filter */}
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
              aria-label="Filter by Company"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Buyer Filter */}
            <select
              value={buyerFilter}
              onChange={(e) => {
                setBuyerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
              aria-label="Filter by Buyer"
            >
              <option value="">All Buyers</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Order Type Filter */}
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
              aria-label="Filter by Order Type"
            >
              <option value="">All Order Types</option>
              <option value="Regular">Regular</option>
              <option value="Repeat">Repeat</option>
              <option value="Sample">Sample</option>
              <option value="Promo">Promo</option>
              <option value="Test">Test</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
              aria-label="Filter by Status"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In_Production">In Production</option>
              <option value="Shipped">Shipped</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        }
      />

      {/* Tier 3: DataTable */}
      <DataTable<PurchaseOrder>
        columns={columns}
        data={orders}
        totalRecords={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={(p: number) => setCurrentPage(p)}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        isLoading={isLoading}
        emptyMessage="No purchase orders found matching the selected criteria."
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={UI_TOKENS.launcherModal.container}>
          <div className={`${UI_TOKENS.launcherModal.dialogContainer} max-w-md w-full`}>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Delete Purchase Order
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete purchase order{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {deleteTarget.buyer_po_number}
                  </strong>{" "}
                  ({deleteTarget.order_code})? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
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
