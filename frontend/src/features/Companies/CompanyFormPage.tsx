import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Building2, Save, RefreshCw } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { Toggle } from "../../components/common/Toggle";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getCompany,
  getNextCompanyCode,
  createCompany,
  updateCompany,
  type CompanyFormData,
} from "../../services/companyService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface CompanyFormPageProps {
  mode: "create" | "edit";
  companyId?: string | number;
  onNavigate: (path: string) => void;
}

type FieldErrors = Record<string, string[]>;

export const CompanyFormPage: React.FC<CompanyFormPageProps> = ({
  mode,
  companyId,
  onNavigate,
}) => {
  const isEditMode = mode === "edit";
  const { hasRole } = useAuthStore();
  const isSuperAdmin = hasRole("superadmin");

  // Form Fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load existing company data in edit mode
  useEffect(() => {
    if (isEditMode && companyId) {
      setIsLoadingData(true);
      getCompany(companyId)
        .then(({ data }) => {
          setCode(data.code ?? "");
          setName(data.name ?? "");
          setLegalName(data.legal_name ?? "");
          setTaxId(data.tax_id ?? "");
          setEmail(data.email ?? "");
          setPhone(data.phone ? formatPhoneNumber(data.phone) : "");
          setAddress(data.address ?? "");
          setIsActive(data.is_active);
          setIsDefault(!!data.is_default);
          setActiveUsersCount(data.active_users_count ?? 0);
        })
        .catch(() => {
          showToast("error", "Load Failed", "Could not load company details.");
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [isEditMode, companyId]);

  // On create mode: load the next auto-generated code
  useEffect(() => {
    if (!isEditMode) {
      fetchNextCode("");
    }
  }, [isEditMode]);

  const fetchNextCode = async (companyName: string) => {
    setIsLoadingCode(true);
    try {
      const { next_code } = await getNextCompanyCode(companyName);
      setCode(next_code);
    } catch {
      // Silently ignore - code field will remain blank
    } finally {
      setIsLoadingCode(false);
    }
  };

  // Auto-suggest code as user types company name (debounced, create mode only)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditMode) {
      if (nameDebounce.current) clearTimeout(nameDebounce.current);
      nameDebounce.current = setTimeout(() => {
        if (val.trim().length >= 2) {
          fetchNextCode(val.trim());
        }
      }, 600);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const payload: CompanyFormData = {
      // NOTE: 'code' is intentionally omitted — it is 100% auto-generated server-side.
      // The code field shown in the form is a read-only preview only.
      name: name.trim(),
      legal_name: legalName.trim() || undefined,
      tax_id: taxId.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      is_active: isActive,
    };

    try {
      if (isEditMode && companyId) {
        await updateCompany(companyId, payload);
        showToast("success", "Company Updated", "Company details have been saved successfully.");
        setTimeout(() => onNavigate(`/companies/${companyId}`), 1200);
      } else {
        const res = await createCompany(payload);
        showToast("success", "Company Registered", `"${res.data.name}" (${res.data.code}) has been registered.`);
        setTimeout(() => onNavigate("/companies"), 1200);
      }
    } catch (err: unknown) {
      const apiError = err as { errors?: FieldErrors; message?: string };
      if (apiError?.errors) {
        setFieldErrors(apiError.errors);
      } else {
        setGeneralError(apiError?.message || "An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading company data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title={isEditMode ? `Edit Company: ${name}` : "Create New Company"}
        badgeCount={isEditMode ? code : "New"}
        badgeLabel={isEditMode ? "Company Code" : "Company"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate(isEditMode && companyId ? `/companies/${companyId}` : "/companies")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save className="h-3.5 w-3.5" />}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : isEditMode ? "Update Company" : "Save Company"}
            </Button>
          </div>
        }
      />

      {/* General API Error */}
      {generalError && (
        <div className={UI_TOKENS.authLayout.generalAlert} role="alert">
          <Building2 className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Main Details (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identity Section */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Company Identity</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* System Auto Code */}
                <FormField
                  label="Company Code"
                  systemAuto={true}
                  htmlFor="company_code"
                  helperText="Auto-generated from company name initials. Read-only."
                >
                  <div className="relative">
                    <TextInput
                      id="company_code"
                      value={isLoadingCode ? "Generating..." : code}
                      readOnly
                      className={`${UI_TOKENS.input.readonly} font-mono`}
                      tabIndex={-1}
                    />
                  </div>
                </FormField>

                {/* Company Name (required) */}
                <FormField
                  label="Company Name"
                  required
                  htmlFor="company_name"
                  error={fieldErrors.name}
                >
                  <TextInput
                    id="company_name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Ananta Woven Limited"
                    isError={!!fieldErrors.name}
                    autoFocus
                  />
                </FormField>

                {/* Legal Name */}
                <FormField
                  label="Legal Entity Name"
                  htmlFor="legal_name"
                  error={fieldErrors.legal_name}
                  helperText="Full legal registered name (optional)"
                >
                  <TextInput
                    id="legal_name"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Ananta Woven Limited (Subsidiary)"
                    isError={!!fieldErrors.legal_name}
                  />
                </FormField>

                {/* Tax / BIN */}
                <FormField
                  label="Tax ID / BIN Number"
                  htmlFor="tax_id"
                  error={fieldErrors.tax_id}
                  helperText="Business Identification Number or TIN"
                >
                  <TextInput
                    id="tax_id"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. 123456789-0101"
                    isError={!!fieldErrors.tax_id}
                  />
                </FormField>
              </div>
            </div>

            {/* Contact Section */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Contact Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Official Email"
                  htmlFor="email"
                  error={fieldErrors.email}
                >
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. info@anantawoven.com"
                    isError={!!fieldErrors.email}
                  />
                </FormField>

                <FormField
                  label="Phone Number"
                  htmlFor="phone"
                  error={fieldErrors.phone}
                  helperText="e.g. +880 9666-778833 or +880 1700-000000"
                >
                  <TextInput
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => {
                      if (phone.trim()) {
                        setPhone(formatPhoneNumber(phone));
                      }
                    }}
                    placeholder="+880 9666-778833"
                    isError={!!fieldErrors.phone}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField
                    label="Address"
                    htmlFor="address"
                    error={fieldErrors.address}
                  >
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Factory / Head office address"
                      rows={3}
                      className={`${UI_TOKENS.input.base} resize-none ${fieldErrors.address ? UI_TOKENS.input.error : ""}`}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Settings Panel (1/3 width) */}
          <div className="space-y-4">
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Company Status</h2>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  {isDefault
                    ? "This is the default system company. It is permanent and cannot be deactivated."
                    : "Inactive companies cannot create new orders or transactions, and their users may have restricted access."}
                </p>

                <Toggle
                  checked={isActive}
                  onChange={(val) => {
                    if (isDefault) {
                      showToast("error", "Action Prohibited", "The default system company cannot be deactivated.");
                      return;
                    }
                    if (isEditMode && isActive && activeUsersCount > 0 && !isSuperAdmin) {
                      showToast("error", "Cannot Deactivate", `This company has ${activeUsersCount} active assigned user(s). Deactivate or reassign them first.`);
                      return;
                    }
                    setIsActive(val);
                  }}
                  disabled={isDefault || (isEditMode && isActive && activeUsersCount > 0 && !isSuperAdmin)}
                  activeText="Active"
                  inactiveText="Inactive"
                  description={
                    isDefault
                      ? "Protected default entity — cannot be deactivated"
                      : isEditMode && isActive && activeUsersCount > 0
                      ? isSuperAdmin
                        ? `Active (${activeUsersCount} active users — Super Admin Force Allowed)`
                        : `Locked (${activeUsersCount} active user accounts)`
                      : isActive
                      ? "Operational — can accept orders"
                      : "Suspended — no new transactions"
                  }
                />
                
                {isDefault && (
                  <div className="p-2 rounded bg-blue-50 border border-blue-200/80 text-[11px] text-[#0066FF] flex items-start gap-1.5 leading-snug">
                    <span>🛡️ <strong>Default System Company:</strong> This is the primary system entity and cannot be deactivated or deleted by any user (including Super Admin).</span>
                  </div>
                )}

                {!isDefault && isEditMode && isActive && activeUsersCount > 0 && !isSuperAdmin && (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-1.5 leading-snug">
                    <span>⚠️ Deactivation is locked because this company has <strong>{activeUsersCount} active assigned user(s)</strong>. Please deactivate users in User Directory first.</span>
                  </div>
                )}
                {!isDefault && isEditMode && isActive && activeUsersCount > 0 && isSuperAdmin && (
                  <div className="p-2 rounded bg-blue-50 border border-blue-200/80 text-[11px] text-[#0066FF] flex items-start gap-1.5 leading-snug">
                    <span>⚡ <strong>Super Admin Override Active:</strong> You can force deactivate this company even though it has {activeUsersCount} active user account(s).</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">System Code:</span>
                    <Badge variant="code">{isLoadingCode ? "..." : code || "Auto"}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    This code will prefix all entity records (Buyers, Orders, Rolls) created under this company.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className={UI_TOKENS.card.base}>
              <div className="space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  icon={<Save className="h-3.5 w-3.5" />}
                  disabled={isSubmitting || isLoadingData}
                >
                  {isSubmitting
                    ? isEditMode ? "Updating Company..." : "Registering..."
                    : isEditMode ? "Update Company" : "Register Company"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => onNavigate(isEditMode && companyId ? `/companies/${companyId}` : "/companies")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

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
