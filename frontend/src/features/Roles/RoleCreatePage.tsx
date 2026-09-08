import React, { useState } from "react";
import { ArrowLeft, Save, Shield } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { createRole } from "../../services/roleService";

interface RoleCreatePageProps {
  onNavigate: (path: string) => void;
}

export const RoleCreatePage: React.FC<RoleCreatePageProps> = ({ onNavigate }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setIsSubmitting(true);

    try {
      const res = await createRole(name.trim());
      showToast("success", "Role Created", res.message);
      setTimeout(() => onNavigate(`/roles/${res.data.id}/matrix`), 1000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      if (apiErr.errors?.name) {
        setFieldError(apiErr.errors.name[0]);
      } else {
        setFieldError(apiErr.message || "Failed to create role.");
      }
      showToast("error", "Creation Failed", apiErr.message || "Please fix the error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title="Create Custom Enterprise Role"
        badgeLabel="New Role"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onNavigate("/roles")}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Save className="h-3.5 w-3.5" />} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save Role & Configure Matrix"}
            </Button>
          </div>
        }
      />

      {/* Form Card */}
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} noValidate className={UI_TOKENS.card.base}>
          <div className={UI_TOKENS.card.header}>
            <h2 className={`${UI_TOKENS.card.title} flex items-center gap-2`}>
              <Shield className="w-4 h-4 text-[#0066FF]" />
              Role Details
            </h2>
          </div>

          <div className="space-y-4">
            <FormField
              label="Role Identifier Name"
              required
              htmlFor="role_name"
              error={fieldError || undefined}
              helperText="Lowercase identifier e.g. merchandiser, qc_inspector, warehouse_lead"
            >
              <TextInput
                id="role_name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                placeholder="e.g. qc_manager"
                isError={!!fieldError}
                autoFocus
                className="font-mono"
              />
            </FormField>

            <FormField
              label="Role Description (Optional)"
              htmlFor="role_desc"
              helperText="Brief statement of role scope and factory duties"
            >
              <TextInput
                id="role_desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Manages endline QC inspection terminals and rework lines"
              />
            </FormField>

            <div className="p-3 rounded bg-blue-50 border border-blue-200/80 text-[11px] text-[#0066FF] leading-relaxed">
              💡 After saving, you will immediately be redirected to the <strong>Policy Matrix</strong> grid to check and assign fine-grained permissions.
            </div>
          </div>
        </form>
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
