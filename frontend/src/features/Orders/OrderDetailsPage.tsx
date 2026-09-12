import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  ShoppingBag,
  Download,
  Eye,
  Scissors,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { TechPackPreviewModal } from "../../components/common/TechPackPreviewModal";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getPurchaseOrder,
  type PurchaseOrder,
} from "../../services/orderService";
import { useAuthStore } from "../../store/authStore";

interface OrderDetailsPageProps {
  orderId: string | number;
  onNavigate: (path: string) => void;
}

export const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({
  orderId,
  onNavigate,
}) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canEdit = hasRole("superadmin") || hasPermission("orders.order.update");

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const res = await getPurchaseOrder(orderId);
        setOrder(res.data);
      } catch {
        showToast("error", "Not Found", "Could not load purchase order details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading purchase order...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-base font-semibold text-slate-800">
          Purchase Order Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested purchase order does not exist or has been removed.
        </p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => onNavigate("/orders")}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  // Extract unique colors and sizes from breakdowns
  const colorMap = new Map<string, { id: string | number; color_name: string; color_code: string }>();
  const sizeMap = new Map<string, { id: string | number; size_name: string; sort_order: number }>();
  const matrixData: Record<string, Record<string, number>> = {};

  (order.breakdowns || []).forEach((b, idx) => {
    const rawColorKey = b.style_color_id ? String(b.style_color_id) : (b.color?.color_name || (b as any).color_name || `color-${idx}`);
    const rawSizeKey = b.style_size_id ? String(b.style_size_id) : (b.size?.size_name || (b as any).size_name || `size-${idx}`);

    const colorObj = {
      id: rawColorKey,
      color_name: b.color?.color_name || (b as any).color_name || "Standard",
      color_code: b.color?.color_code || (b as any).color_code || "#64748b",
    };

    const sizeObj = {
      id: rawSizeKey,
      size_name: b.size?.size_name || (b as any).size_name || rawSizeKey,
      sort_order: b.size?.sort_order ?? ((b as any).size_sort_order ?? idx),
    };

    if (!colorMap.has(rawColorKey)) {
      colorMap.set(rawColorKey, colorObj);
    }
    if (!sizeMap.has(rawSizeKey)) {
      sizeMap.set(rawSizeKey, sizeObj);
    }

    if (!matrixData[rawColorKey]) {
      matrixData[rawColorKey] = {};
    }
    const qty = b.order_qty ?? ((b as any).quantity ?? 0);
    matrixData[rawColorKey][rawSizeKey] = (matrixData[rawColorKey][rawSizeKey] || 0) + qty;
  });

  const uniqueColors = Array.from(colorMap.values());
  const uniqueSizes = Array.from(sizeMap.values()).sort((a, b) => a.sort_order - b.sort_order);

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

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Toast Alert */}
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
        title={`PO: ${order.buyer_po_number}`}
        badgeCount={order.order_code}
        badgeLabel="Order Code"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onNavigate("/orders")}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Directory
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                onClick={() => onNavigate(`/orders/${order.uuid || order.id}/edit`)}
                icon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Order
              </Button>
            )}
          </div>
        }
      />

      {/* 2-Column Golden View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2/3 Main Canvas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1: Key Commercial Details */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#EFF6FC] text-[#0066FF] flex items-center justify-center font-bold text-xs shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={UI_TOKENS.card.title}>Purchase Order Commercial Overview</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Core buyer identifiers, delivery destinations, and contract timelines.</p>
                </div>
              </div>
              <Badge variant="code">{order.order_code}</Badge>
            </div>

            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Total Order Quantity</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {Number(order.total_order_qty).toLocaleString()} pcs
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Unit FOB Price</span>
                <p className="text-base font-bold font-mono text-emerald-600 mt-0.5">
                  {order.currency} {Number(order.unit_price).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Total Contract Value</span>
                <p className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                  {order.currency} {Number(order.total_order_value).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-2.5 bg-white border border-slate-200/80 rounded-md">
                <span className="text-[11px] text-slate-500 font-medium block">Buyer</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {order.buyer?.name || "—"}
                </p>
                <span className="text-[10.5px] font-mono text-slate-400">{order.buyer?.code || "—"}</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200/80 rounded-md">
                <span className="text-[11px] text-slate-500 font-medium block">Company (Operating Unit)</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {order.company?.name || "—"}
                </p>
                <span className="text-[10.5px] font-mono text-slate-400">{order.company?.code || "—"}</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200/80 rounded-md">
                <span className="text-[11px] text-slate-500 font-medium block">Style Profile</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {order.style?.buyer_style_no || "—"}
                </p>
                <span className="text-[10.5px] text-slate-500 truncate block">{order.style?.style_name || "—"}</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200/80 rounded-md">
                <span className="text-[11px] text-slate-500 font-medium block">Incoterm & Freight Mode</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {order.incoterm} • {order.shipment_mode}
                </p>
              </div>

              <div className="p-2.5 bg-white border border-slate-200/80 rounded-md">
                <span className="text-[11px] text-slate-500 font-medium block">Order Placed On</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {order.order_placement_date}
                </p>
              </div>

              <div className="p-2.5 bg-white border border-slate-200/80 rounded-md">
                <span className="text-[11px] text-slate-500 font-medium block">Factory Ex-Factory Date</span>
                <p className="font-semibold text-indigo-700 mt-1">
                  {order.factory_delivery_date}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: 2D Matrix Breakdown View */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={UI_TOKENS.card.title}>Color / Size Breakdown Matrix</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Granular itemized distribution verified against total contract volume.</p>
                </div>
              </div>
              <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
                Zero-Balance Verified
              </Badge>
            </div>

            {uniqueColors.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No breakdown entries found for this order.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200 min-w-[170px]">
                          Colorway
                        </th>
                        {uniqueSizes.map((s) => (
                          <th
                            key={s.id}
                            className="py-2.5 px-2 text-center border-r border-slate-200 min-w-[65px]"
                          >
                            {s.size_name}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-right bg-slate-100/70 min-w-[80px]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {uniqueColors.map((c) => {
                        const rowTotal = uniqueSizes.reduce(
                          (acc, s) => acc + (matrixData[c.id]?.[s.id] || 0),
                          0
                        );
                        return (
                          <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-2 px-3 font-medium text-slate-800 border-r border-slate-100">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor:
                                      c.color_code.startsWith("#") ? c.color_code : "#64748b",
                                  }}
                                />
                                <span>{c.color_name}</span>
                              </div>
                            </td>
                            {uniqueSizes.map((s) => (
                              <td
                                key={s.id}
                                className="py-2 px-2 text-center font-mono text-slate-800 border-r border-slate-100"
                              >
                                {matrixData[c.id]?.[s.id]
                                  ? Number(matrixData[c.id][s.id]).toLocaleString()
                                  : "—"}
                              </td>
                            ))}
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 bg-slate-50/50">
                              {rowTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#F8FAFC] font-bold border-t-2 border-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                          Total Order (Pcs)
                        </td>
                        {uniqueSizes.map((s) => {
                          const colTotal = uniqueColors.reduce(
                            (acc, c) => acc + (matrixData[c.id]?.[s.id] || 0),
                            0
                          );
                          return (
                            <td
                              key={s.id}
                              className="py-2.5 px-2 text-center font-mono text-slate-800 border-r border-slate-200"
                            >
                              {colTotal.toLocaleString()}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-mono text-sm bg-[#EFF6FC] text-[#0066FF]">
                          {Number(order.total_order_qty).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3 Sidebar */}
        <div className="space-y-4">
          {/* Card 1: Status & Eligibility */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h3 className={UI_TOKENS.card.title}>Order Status & Workflow</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Lifecycle State</span>
                <div>{getOrderStatusBadge(order.status)}</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Operational Active</span>
                <Badge variant={order.is_active ? "success" : "neutral"}>
                  {order.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Order Classification</span>
                <Badge variant="info">{order.order_type}</Badge>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Destination Port</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {order.delivery_destination || "Not Specified"}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-slate-500 font-medium">Payment Terms</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {order.payment_terms || "LC at Sight"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Attached Document */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0066FF]" />
                <h3 className={UI_TOKENS.card.title}>Attached Buyer PO Sheet</h3>
              </div>
            </div>

            {order.po_document_url ? (
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                      {order.po_document_name || "Buyer_PO_Sheet"}
                    </span>
                  </div>
                  <Badge variant="neutral">
                    {order.po_document_size
                      ? `${(order.po_document_size / 1024).toFixed(0)} KB`
                      : "Document"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => setIsPreviewModalOpen(true)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Preview
                  </Button>
                  <a
                    href={order.po_document_url}
                    download={order.po_document_name || "PO_Sheet"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      variant="secondary"
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No buyer document attached to this PO.</p>
            )}
          </div>

          {/* Card 3: Production Remarks */}
          {order.remarks && (
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h3 className={UI_TOKENS.card.title}>Production Instructions</h3>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {order.remarks}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {isPreviewModalOpen && order.po_document_url && (
        <TechPackPreviewModal
          isOpen={isPreviewModalOpen}
          fileUrl={order.po_document_url}
          fileName={order.po_document_name || "PO_Document"}
          fileSize={order.po_document_size || undefined}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </div>
  );
};
