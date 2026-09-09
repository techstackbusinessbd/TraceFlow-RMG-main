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
  buyerId: string | number;
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
                  onClick={() => onNavigate(`/master/buyers/${buyer.uuid || buyer.id}/edit`)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Buyer Code</p>
                <Badge variant="code">{buyer.code}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Buyer Legal Name</p>
                <p className="text-sm font-bold text-slate-900">{buyer.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sourcing Channel</p>
                <div className="mt-0.5">
                  {buyer.buyer_type === "agent" ? (
                    <Badge variant="info">Via Buying Agent</Badge>
                  ) : (
                    <Badge variant="neutral">Direct Buyer</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Buying Agent / House</p>
                {buyer.buyer_type === "agent" && buyer.agent ? (
                  <div
                    onClick={() => onNavigate(`/master/agents/${buyer.agent?.uuid || buyer.agent?.id}`)}
                    className="font-medium text-sm text-[#0066FF] hover:underline cursor-pointer flex items-center gap-1.5 mt-0.5"
                  >
                    <span>{buyer.agent.name}</span>
                    <Badge variant="code">{buyer.agent.code}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">None (Direct Engagement)</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Company</p>
                <div className="mt-0.5">
                  <Badge variant="neutral">{buyer.company?.name || "Platform Unit"} ({buyer.company?.code || "PLT"})</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Country of Origin
                </p>
                <p className="text-sm font-medium text-slate-800">{buyer.country}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Payment Terms</p>
                <p className="text-sm font-medium text-slate-800">{buyer.payment_terms || <span className="text-slate-400">Not Specified</span>}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Registered On
                </p>
                <p className="text-sm text-slate-700">
                  {buyer.created_at ? new Date(buyer.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
            </div>

            {/* Contact Information in Buyer Profile */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0066FF]" />
                Buyer Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Contact Person</p>
                  <p className="text-sm font-medium text-slate-800">{buyer.contact_person || <span className="text-slate-400">Not provided</span>}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Official Email</p>
                  {buyer.email ? (
                    <a href={`mailto:${buyer.email}`} className="text-sm text-[#0066FF] hover:underline font-medium block truncate">
                      {buyer.email}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">Not provided</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone Number
                  </p>
                  <p className="text-sm font-mono text-slate-800">
                    {buyer.phone ? formatPhoneNumber(buyer.phone) : <span className="text-slate-400 font-sans">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Office Address</p>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-200">
                    {buyer.address || <span className="text-slate-400">No office address registered.</span>}
                  </p>
                </div>
              </div>
            </div>
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
                    className="p-2.5 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">{b.name}</span>
                      {b.code && <span className="text-[10px] font-mono text-slate-500">Code: {b.code}</span>}
                    </div>
                    <Badge variant={b.is_active ? "success" : "danger"}>
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
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Assigned Brands</span>
                <Badge variant="neutral">{buyer.brands?.length || 0} Brands</Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Sourcing Model</span>
                <span className="text-xs font-semibold text-slate-800">
                  {buyer.buyer_type === "agent" ? "Buying Agent" : "Direct Buyer"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-600">PO Eligibility</span>
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
