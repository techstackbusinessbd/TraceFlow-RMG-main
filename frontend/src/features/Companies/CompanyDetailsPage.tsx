import React, { useState, useEffect } from "react";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Shield, Users, Edit2, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getCompany, toggleCompanyStatus, type Company } from "../../services/companyService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface CompanyDetailsPageProps {
  companyId: number;
  onNavigate: (path: string) => void;
}

export const CompanyDetailsPage: React.FC<CompanyDetailsPageProps> = ({
  companyId,
  onNavigate,
}) => {
  const { hasRole } = useAuthStore();
  const isSuperAdmin = hasRole("superadmin");

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    getCompany(companyId)
      .then(({ data }) => setCompany(data))
      .catch(() => showToast("error", "Load Failed", "Could not load company details. Please go back and try again."))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const handleToggleStatus = async () => {
    if (!company) return;
    setIsToggling(true);
    try {
      const res = await toggleCompanyStatus(company.id);
      const newStatus = res.data.is_active ? "Activated" : "Deactivated";
      setCompany((prev) => prev ? { ...prev, is_active: res.data.is_active } : null);
      showToast("success", `Company ${newStatus}`, res.message);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast(
        "error",
        "Status Update Failed",
        apiError?.message || "Could not toggle company status. Active users must be deactivated first."
      );
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading company profile...
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Building2 className="w-10 h-10 text-slate-300" />
          <p className="text-sm text-slate-600">Company not found or could not be loaded.</p>
          <Button variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onNavigate("/companies")}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Header */}
      <PageHeader
        title="Company Profile"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/companies")}
            >
              Back to List
            </Button>
            {!company.is_default && (
              <Button
                variant="secondary"
                icon={company.is_active
                  ? <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                  : <ToggleLeft className="h-3.5 w-3.5 text-slate-400" />}
                onClick={() => {
                  if (company.is_active && (company.active_users_count ?? 0) > 0 && !isSuperAdmin) {
                    showToast(
                      "error",
                      "Cannot Deactivate",
                      `This company has ${company.active_users_count} active assigned user(s). Deactivate users first.`
                    );
                    return;
                  }
                  handleToggleStatus();
                }}
                disabled={isToggling}
                title={
                  company.is_active && (company.active_users_count ?? 0) > 0
                    ? isSuperAdmin
                      ? `Active (${company.active_users_count} active users — Super Admin can force deactivate)`
                      : `Cannot deactivate: ${company.active_users_count} active user(s) assigned`
                    : undefined
                }
              >
                {isToggling ? "Updating..." : company.is_active ? "Deactivate" : "Activate"}
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={() => onNavigate(`/companies/${company.id}/edit`)}
            >
              Edit Company
            </Button>
          </div>
        }
      />

      {/* Profile Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Info (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <h2 className={`${UI_TOKENS.card.title} flex items-center gap-2`}>
                  <Building2 className="w-4 h-4 text-[#0066FF]" />
                  Company Identity
                </h2>
                {company.is_default && (
                  <Badge variant="info" className="text-[10px] px-2 py-0.5">Default System Company</Badge>
                )}
              </div>
              <Badge variant={company.is_active ? "success" : "danger"}>
                {company.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Company Code</p>
                <Badge variant="code">{company.code}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Company Name</p>
                <p className="text-sm font-bold text-slate-900">{company.name}</p>
              </div>
              {company.legal_name && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Legal Entity Name</p>
                  <p className="text-sm text-slate-800">{company.legal_name}</p>
                </div>
              )}
              {company.tax_id && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tax ID / BIN</p>
                  <p className="text-sm font-mono text-slate-800">{company.tax_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={`${UI_TOKENS.card.title} flex items-center gap-2`}>
                <Mail className="w-4 h-4 text-[#0066FF]" />
                Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Official Email
                </p>
                <p className="text-sm text-slate-800">{company.email || <span className="text-slate-400">Not provided</span>}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone Number
                </p>
                <p className="text-sm text-slate-800 font-mono">
                  {company.phone ? formatPhoneNumber(company.phone) : <span className="text-slate-400 font-sans">Not provided</span>}
                </p>
              </div>
              <div className="md:col-span-2 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {company.address || <span className="text-slate-400">Not provided</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Summary</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Assigned Users
                </div>
                <Badge variant="neutral">{company.users_count ?? 0} Users</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Status
                </div>
                <Badge variant={company.is_active ? "success" : "danger"}>
                  {company.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-600">Registered On</span>
                <span className="text-xs font-semibold text-slate-800">{formatDate(company.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Code Info */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Code Information</h2>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                All entity records (Buyers, Styles, Orders, Rolls) created under this company will be prefixed with:
              </p>
              <Badge variant="code" className="text-sm px-3 py-1">{company.code}-</Badge>
              <p className="text-[11px] text-slate-500 mt-1">
                Example: <span className="font-mono">{company.code}-BYR-001</span>, <span className="font-mono">{company.code}-STY-001</span>
              </p>
            </div>
          </div>
        </div>
      </div>

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
