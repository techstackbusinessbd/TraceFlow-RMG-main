import React, { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Globe, Mail, Phone, Calendar, CheckCircle2, XCircle, Tag, Building2, RefreshCw } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getBuyerById, toggleBuyerStatus, type Buyer } from "../../services/buyerService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface BuyerDetailsPageProps {
  buyerId: number;
  onNavigate: (path: string) => void;
}

export const BuyerDetailsPage: React.FC<BuyerDetailsPageProps> = ({ buyerId, onNavigate }) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canEdit = hasRole("superadmin") || hasPermission("master_data.buyers.profile.update");

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchBuyer = async () => {
      setIsLoading(true);
      try {
        const data = await getBuyerById(buyerId);
        setBuyer(data);
      } catch {
        showToast("error", "Not Found", "Could not load buyer profile.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBuyer();
  }, [buyerId]);

  const handleToggleStatus = async () => {
    if (!buyer) return;
    try {
      const res = await toggleBuyerStatus(buyer.id);
      setBuyer((prev) => (prev ? { ...prev, is_active: res.data.is_active } : null));
      showToast("success", "Status Updated", res.message);
    } catch {
      showToast("error", "Error", "Failed to update status.");
    }
  };

  if (isLoading) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading buyer profile...
          </div>
        </div>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Building2 className="w-10 h-10 text-slate-300" />
          <p className="text-sm text-slate-600">Buyer not found or could not be loaded.</p>
          <Button variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onNavigate("/master/buyers")}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

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
        title={buyer.name}
        badgeCount={buyer.code}
        badgeLabel="Buyer Code"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/master/buyers")}
            >
              Back to Directory
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleToggleStatus}
                >
                  {buyer.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="primary"
                  icon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => onNavigate(`/master/buyers/${buyer.id}/edit`)}
                >
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Key Parameters */}
        <div className="lg:col-span-2 space-y-4">
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Procurement & Entity Details</h2>
              <Badge variant={buyer.is_active ? "success" : "danger"}>
                {buyer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Sourcing Channel</span>
                <div className="flex items-center gap-2">
                  {buyer.buyer_type === "agent" ? (
                    <Badge variant="info">Via Buying Agent</Badge>
                  ) : (
                    <Badge variant="neutral">Direct Buyer</Badge>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Buying Agent / House</span>
                {buyer.buyer_type === "agent" && buyer.agent ? (
                  <div
                    onClick={() => onNavigate(`/master/agents/${buyer.agent?.id}`)}
                    className="font-medium text-[#0066FF] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{buyer.agent.name}</span>
                    <Badge variant="code">{buyer.agent.code}</Badge>
                  </div>
                ) : (
                  <span className="text-slate-400">None (Direct Engagement)</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Company</span>
                <div className="mt-0.5">
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {buyer.company?.name || "Platform Owner"} ({buyer.company?.code || "PLT"})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Country of Origin</span>
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Globe className="h-3.5 w-3.5 text-slate-500" />
                  {buyer.country}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Payment Terms</span>
                <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                  {buyer.payment_terms || "Not Specified"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Contact Person</span>
                <span className="font-medium text-slate-800">{buyer.contact_person || "—"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Official Email</span>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {buyer.email || "—"}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Telephone</span>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {buyer.phone ? formatPhoneNumber(buyer.phone) : "—"}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Registered On</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {buyer.created_at ? new Date(buyer.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>

            {buyer.address && (
              <div className="pt-3 mt-3 border-t border-slate-100">
                <span className="text-slate-400 text-xs block mb-1">Headquarters / Regional Office</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  {buyer.address}
                </p>
              </div>
            )}
          </div>

          {/* Brands Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>
                  Registered Brands & Garment Divisions
                </h2>
              </div>
              <Badge variant="neutral">{buyer.brands?.length || 0}</Badge>
            </div>

            {buyer.brands && buyer.brands.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {buyer.brands.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">{b.name}</span>
                      {b.code && <span className="text-[10px] font-mono text-slate-500">Code: {b.code}</span>}
                    </div>
                    <Badge variant={b.is_active ? "neutral" : "danger"}>
                      {b.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No sub-brands registered for this buyer.</p>
            )}
          </div>
        </div>

        {/* Right 1 Column: Operational Summary */}
        <div className="space-y-4">
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Operational Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs text-slate-600">Assigned Brands</span>
                <span className="text-base font-bold text-[#0066FF]">{buyer.brands?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs text-slate-600">Operational Status</span>
                {buyer.is_active ? (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Eligible for PO
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                    <XCircle className="h-3.5 w-3.5" />
                    Locked / Inactive
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
