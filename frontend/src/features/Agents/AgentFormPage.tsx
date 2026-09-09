import React, { useState, useEffect } from "react";
import { Save, Percent } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { Toggle } from "../../components/common/Toggle";
import { UI_TOKENS } from "../../config/designTokens";
import { getOperationalCompanies, type Company } from "../../services/companyService";
import {
  getAgentById,
  getAgentNextCode,
  createAgent,
  updateAgent,
  type AgentFormData,
} from "../../services/agentService";

interface AgentFormPageProps {
  mode: "create" | "edit";
  agentId?: string | number;
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

  // Load companies (excluding Platform Owner)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const operationalList = await getOperationalCompanies();
        setCompanies(operationalList);
        if (mode === "create" && operationalList.length > 0) {
          const defaultCmp = operationalList[0];
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
    <div className={UI_TOKENS.appLayout.mainContent}>
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
        title={mode === "create" ? "Create New Buying Agent" : `Edit Buying Agent: ${formData.name}`}
        badgeCount={mode === "create" ? "New" : nextCode}
        badgeLabel={mode === "create" ? "Agent" : "Agent Code"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onNavigate(mode === "edit" && agentId ? `/master/agents/${agentId}` : "/master/agents")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Saving..." : mode === "create" ? "Save Agent" : "Update Agent"}
            </Button>
          </div>
        }
      />

      {/* Main Form (Exact 2-Column Golden Layout) */}
      <form noValidate onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2/3 Main Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identity Card */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Agent Identity</h2>
                <Badge variant="code">{nextCode}</Badge>
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
                <FormField
                  label="Agent / Buying House Name"
                  required
                  error={errors.name}
                  helperText="Full commercial trade name as registered in contracts."
                >
                  <TextInput
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Li & Fung Bangladesh, Asmara Group"
                    isError={!!errors.name}
                  />
                </FormField>

                {/* Country Dropdown */}
                <FormField
                  label="Headquarters Country"
                  required
                  error={errors.country}
                  helperText="Principal headquarters or global sourcing office."
                >
                  <div className="relative">
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className={`w-full ${UI_TOKENS.input.select} ${errors.country ? UI_TOKENS.input.error : ""}`}
                    >
                      <option value="">Select Headquarters Country...</option>
                      <optgroup label="Domestic & Sourcing Hubs">
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Singapore">Singapore</option>
                        <option value="India">India</option>
                        <option value="China">China</option>
                        <option value="Turkey">Turkey</option>
                      </optgroup>
                      <optgroup label="Primary European Markets">
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Spain">Spain</option>
                        <option value="France">France</option>
                        <option value="Italy">Italy</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Poland">Poland</option>
                        <option value="Norway">Norway</option>
                      </optgroup>
                      <optgroup label="Americas">
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Mexico">Mexico</option>
                      </optgroup>
                      <optgroup label="Asia-Pacific & Middle East">
                        <option value="Japan">Japan</option>
                        <option value="Australia">Australia</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="South Korea">South Korea</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Other">Other Country</option>
                      </optgroup>
                    </select>
                  </div>
                </FormField>
              </div>
            </div>

            {/* Contact & Terms Card */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Contact & Liaison Office</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Person */}
                <FormField
                  label="Contact Person"
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
                  helperText="Corporate inbox for purchase orders & notices."
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

                {/* Commission Rate */}
                <FormField
                  label="Commission Rate (% FOB)"
                  error={errors.commission_rate}
                  helperText="Standard agency commission rate on FOB order value."
                >
                  <div className="relative">
                    <TextInput
                      type="number"
                      step="0.01"
                      value={formData.commission_rate === null ? "" : formData.commission_rate}
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

                {/* Office Address */}
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
                      className={`w-full ${UI_TOKENS.input.base} resize-none`}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1/3 Sidebar (Settings & Status) */}
          <div className="space-y-4">
            {/* Operational Status Card */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Operational Status</h2>
                <Badge variant={formData.is_active ? "success" : "neutral"}>
                  {formData.is_active ? "Active" : "Suspended"}
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Active agents are immediately selectable in buyer creation and merchandising inquiries.
                </p>

                <div className="pt-2">
                  <Toggle
                    checked={formData.is_active}
                    onChange={(val) => setFormData({ ...formData, is_active: val })}
                    activeText="Active & Operational"
                    inactiveText="Inactive / Suspended"
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>System Lineage</h2>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Code:</span>
                  <Badge variant="code">{nextCode}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span className="font-semibold text-slate-800 uppercase">{mode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
