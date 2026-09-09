import React, { useState, useEffect } from "react";
import { Save, Percent } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getCompanies, type Company } from "../../services/companyService";
import {
  getAgentById,
  getAgentNextCode,
  createAgent,
  updateAgent,
  type AgentFormData,
} from "../../services/agentService";

interface AgentFormPageProps {
  mode: "create" | "edit";
  agentId?: number;
  onNavigate: (path: string) => void;
}

export const AgentFormPage: React.FC<AgentFormPageProps> = ({
  mode,
  agentId,
  onNavigate,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [nextCode, setNextCode] = useState<string>("AUTO-AGT");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const [formData, setFormData] = useState<AgentFormData>({
    company_id: 0,
    name: "",
    country: "Bangladesh",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    commission_rate: null,
    is_active: true,
  });

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await getCompanies({ per_page: 100 });
        setCompanies(res.data);
        if (mode === "create" && res.data.length > 0) {
          const defaultCmp = res.data.find((c) => c.is_default) || res.data[0];
          setSelectedCompanyId(defaultCmp.id);
          setFormData((prev) => ({ ...prev, company_id: defaultCmp.id }));
          loadNextCode(defaultCmp.id);
        }
      } catch {
        showToast("error", "Error", "Could not load companies list.");
      }
    };
    fetchCompanies();
  }, [mode]);

  const loadNextCode = async (cmpId: number) => {
    try {
      const data = await getAgentNextCode(cmpId);
      setNextCode(data.next_code);
    } catch {
      setNextCode("AUTO-AGT");
    }
  };

  // Load existing agent details if edit mode
  useEffect(() => {
    if (mode === "edit" && agentId) {
      const fetchAgent = async () => {
        try {
          const agent = await getAgentById(agentId);
          setSelectedCompanyId(agent.company_id);
          setNextCode(agent.code);
          setFormData({
            company_id: agent.company_id,
            name: agent.name,
            country: agent.country,
            contact_person: agent.contact_person || "",
            email: agent.email || "",
            phone: agent.phone || "",
            address: agent.address || "",
            commission_rate: agent.commission_rate ?? null,
            is_active: agent.is_active,
          });
        } catch {
          showToast("error", "Not Found", "Could not fetch buying agent details.");
        }
      };
      fetchAgent();
    }
  }, [mode, agentId]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cmpId = Number(e.target.value);
    setSelectedCompanyId(cmpId);
    setFormData((prev) => ({ ...prev, company_id: cmpId }));
    if (mode === "create") {
      loadNextCode(cmpId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "create") {
        const res = await createAgent(formData);
        showToast("success", "Created Successfully", res.message);
        setTimeout(() => onNavigate("/master/agents"), 1000);
      } else if (mode === "edit" && agentId) {
        const res = await updateAgent(agentId, formData);
        showToast("success", "Updated Successfully", res.message);
        setTimeout(() => onNavigate(`/master/agents/${agentId}`), 1000);
      }
    } catch (err: unknown) {
      const errorObj = err as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (errorObj?.errors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(errorObj.errors).forEach(([k, v]) => {
          flatErrors[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(flatErrors);
        showToast("error", "Validation Error", "Please review and correct the highlighted fields below.");
      } else {
        showToast("error", "Action Failed", errorObj?.message || "Could not save buying agent details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title={mode === "create" ? "Register Buying Agent / House" : "Edit Buying Agent Profile"}
        badgeCount={mode === "create" ? "New" : nextCode}
        badgeLabel={mode === "create" ? "Agent" : ""}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onNavigate("/master/agents")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {mode === "create" ? "Save Buying Agent" : "Save Changes"}
            </Button>
          </div>
        }
      />

      {/* Main Form Card */}
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <div className={`${UI_TOKENS.card.base} p-6 space-y-6`}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Basic Identification & Company
              </h2>
              <p className="text-[11px] text-slate-500">Legal business entity name and multi-company ownership</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Entity Code:</span>
              <Badge variant="code">{nextCode}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Selection */}
            <FormField
              label="Company"
              required={mode === "create"}
              error={errors.company_id}
              helperText={
                mode === "edit"
                  ? "Agent code prefix is permanently tied to origin company."
                  : "Company entity where this agent's accounts reside."
              }
            >
              <div className="relative">
                <select
                  disabled={mode === "edit"}
                  value={selectedCompanyId}
                  onChange={handleCompanyChange}
                  className={`w-full ${UI_TOKENS.input.select} ${
                    mode === "edit" ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed select-none" : ""
                  } ${errors.company_id ? UI_TOKENS.input.error : ""}`}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) {c.is_default ? "— Primary" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* System Entity Code (Read Only) */}
            <FormField
              label="Agent Code"
              systemAuto={true}
              helperText="Intelligent sequential code generated automatically."
            >
              <TextInput
                value={nextCode}
                readOnly
                tabIndex={-1}
                className={`${UI_TOKENS.input.readonly} font-mono font-semibold text-[#0066FF]`}
              />
            </FormField>

            {/* Agent Name */}
            <div className="md:col-span-2">
              <FormField
                label="Agent / Buying House Name"
                required
                error={errors.name}
                helperText="Full commercial trade name as registered in contracts."
              >
                <TextInput
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Li & Fung Ltd, Asmara International, Tex-Design Sourcing"
                  isError={!!errors.name}
                />
              </FormField>
            </div>

            {/* Country */}
            <FormField
              label="Country of Origin / Headquarter"
              required
              error={errors.country}
              helperText="Principal headquarters or global sourcing origin."
            >
              <TextInput
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. Hong Kong, United States, Germany, Bangladesh"
                isError={!!errors.country}
              />
            </FormField>

            {/* Commission Rate (%) */}
            <FormField
              label="Default Commission Rate (%)"
              error={errors.commission_rate}
              helperText="Agency commission percentage on FOB order value (if applicable)."
            >
              <div className="relative">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate !== null && formData.commission_rate !== undefined ? String(formData.commission_rate) : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_rate: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="e.g. 5.00"
                  isError={!!errors.commission_rate}
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </FormField>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className={`${UI_TOKENS.card.base} p-6 space-y-6`}>
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Contact & Regional Liaison
            </h2>
            <p className="text-[11px] text-slate-500">Representative contact details and correspondence address</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Person */}
            <FormField
              label="Key Account Manager / Contact Person"
              helperText="Designated liaison officer or merchandising head."
            >
              <TextInput
                value={formData.contact_person || ""}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g. John Doe / Country Manager"
              />
            </FormField>

            {/* Email */}
            <FormField
              label="Official Email"
              error={errors.email}
              helperText="Official corporate inbox for purchase orders & notices."
            >
              <TextInput
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. sourcing@agent.com"
                isError={!!errors.email}
              />
            </FormField>

            {/* Phone */}
            <FormField
              label="Phone / Hotline"
              helperText="Primary business telephone or mobile number."
            >
              <TextInput
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +880 1700-000000"
              />
            </FormField>

            {/* Active Status */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-2">Operational Status</label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === true}
                    onChange={() => setFormData({ ...formData, is_active: true })}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === false}
                    onChange={() => setFormData({ ...formData, is_active: false })}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <FormField
                label="Office Address"
                helperText="Physical office or liaison address."
              >
                <textarea
                  rows={3}
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Level 7, Sourcing Tower, Gulshan-2, Dhaka"
                  className={`w-full ${UI_TOKENS.input.base}`}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onNavigate("/master/agents")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            {mode === "create" ? "Save Buying Agent" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};
