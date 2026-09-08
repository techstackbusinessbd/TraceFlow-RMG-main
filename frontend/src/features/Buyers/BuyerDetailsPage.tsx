import React, { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Globe, Mail, Phone, Calendar, CheckCircle2, XCircle, Tag } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Buyer not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => onNavigate("/master/buyers")}>
          Return to Buyers Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => onNavigate("/master/buyers")}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{buyer.name}</h1>
              <Badge variant="code">{buyer.code}</Badge>
              <Badge variant={buyer.is_active ? "success" : "danger"}>
                {buyer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Company: {buyer.company?.name || "Platform Owner"} ({buyer.company?.code || "PLT"})
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Key Parameters */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Procurement & Entity Details
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
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
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 text-xs block mb-1">Headquarters / Regional Office</span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                {buyer.address}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Quick Stats Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Operational Summary
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-600">Assigned Brands</span>
              <span className="text-base font-bold text-brand-600">{buyer.brands?.length || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-600">Operational Eligibility</span>
              {buyer.is_active ? (
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Eligible
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                  <XCircle className="h-3.5 w-3.5" />
                  Locked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brands Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Registered Brands & Garment Divisions ({buyer.brands?.length || 0})
            </h2>
          </div>
        </div>

        {buyer.brands && buyer.brands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <p className="text-xs text-slate-500 italic py-4">No sub-brands registered for this buyer.</p>
        )}
      </div>
    </div>
  );
};
