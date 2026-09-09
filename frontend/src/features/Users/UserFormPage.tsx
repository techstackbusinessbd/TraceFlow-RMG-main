import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Shield, User as UserIcon, Building2, Lock, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getUser,
  createUser,
  updateUser,
  getUserMetadata,
  type CreateUserData,
  type UpdateUserData,
} from "../../services/userService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface UserFormPageProps {
  mode: "create" | "edit";
  userId?: string | number;
  onNavigate: (path: string) => void;
}

interface FieldErrors {
  emp_id?: string;
  username?: string;
  name?: string;
  email?: string;
  password?: string;
  company_id?: string;
  roles?: string;
  department?: string;
  phone?: string;
  is_active?: string;
  [key: string]: string | undefined;
}

export const UserFormPage: React.FC<UserFormPageProps> = ({
  mode,
  userId,
  onNavigate,
}) => {
  const isEditMode = mode === "edit";
  const { user: currentUser } = useAuthStore();

  // Form Fields
  const [empId, setEmpId] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [companyId, setCompanyId] = useState<number | "">("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Metadata dropdowns
  const [companies, setCompanies] = useState<{ id: number; code: string; name: string; is_default: boolean }[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ id: number; name: string }[]>([]);
  const [suggestedDepartments, setSuggestedDepartments] = useState<string[]>([]);

  // State flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const isRootSuperadmin = isEditMode && username === "superadmin";
  const isSelf = isEditMode && currentUser?.id === userId;

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Metadata (Companies & Roles)
  useEffect(() => {
    getUserMetadata()
      .then((res) => {
        setCompanies(res.data.companies);
        setAvailableRoles(res.data.roles);
        setSuggestedDepartments(res.data.departments);

        // If create mode and only 1 default company, auto-select it
        if (!isEditMode && res.data.companies.length > 0) {
          const defaultComp = res.data.companies.find((c) => c.is_default) || res.data.companies[0];
          setCompanyId(defaultComp.id);
        }
      })
      .catch(() => {
        showToast("error", "Metadata Error", "Could not load companies and roles.");
      });
  }, [isEditMode]);

  // Load existing user data in edit mode
  useEffect(() => {
    if (isEditMode && userId) {
      setIsLoadingData(true);
      getUser(userId)
        .then(({ data }) => {
          setEmpId(data.emp_id ?? "");
          setUsername(data.username ?? "");
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setCompanyId(data.company_id ?? "");
          setDepartment(data.department ?? "");
          setPhone(data.phone ? formatPhoneNumber(data.phone) : "");
          setIsActive(data.is_active);
          setSelectedRoles(data.roles ? data.roles.map((r) => r.name) : []);
        })
        .catch(() => {
          showToast("error", "Load Failed", "Could not load user details.");
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [isEditMode, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      if (isEditMode && userId) {
        const payload: UpdateUserData = {
          emp_id: empId.trim(),
          username: username.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          company_id: Number(companyId),
          roles: selectedRoles,
          department: department.trim() || undefined,
          phone: phone.trim() || undefined,
          is_active: isActive,
        };
        if (password.trim()) {
          payload.password = password;
          payload.password_confirmation = passwordConfirmation;
        }

        const res = await updateUser(userId, payload);
        showToast("success", "Account Updated", res.message);
        setTimeout(() => onNavigate("/users"), 1200);
      } else {
        const payload: CreateUserData = {
          emp_id: empId.trim(),
          username: username.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          password: password,
          password_confirmation: passwordConfirmation,
          company_id: Number(companyId),
          roles: selectedRoles,
          department: department.trim() || undefined,
          phone: phone.trim() || undefined,
          is_active: isActive,
        };

        const res = await createUser(payload);
        showToast("success", "Account Created", res.message);
        setTimeout(() => onNavigate("/users"), 1200);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      if (apiErr.errors) {
        const flatErrors: FieldErrors = {};
        for (const [key, val] of Object.entries(apiErr.errors)) {
          flatErrors[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setFieldErrors(flatErrors);
        setGeneralError(null);
        showToast("error", "Validation Error", "Please review the highlighted fields and fill in all required information.");
      } else {
        setGeneralError(apiErr.message || "An unexpected error occurred. Please try again.");
        showToast("error", "Action Failed", apiErr.message || "Failed to save user account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0066FF] border-r-transparent" />
            <p className="text-xs text-slate-500">Loading user account details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title={isEditMode ? `Edit User: ${name || username}` : "Create New User"}
        badgeLabel={isEditMode ? "Edit Mode" : "New Account"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/users")}
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
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Update User"
                : "Create User"}
            </Button>
          </div>
        }
      />

      {/* General Validation Error Alert */}
      {generalError && (
        <div className={UI_TOKENS.authLayout.generalAlert} role="alert">
          <Shield className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Main Identity & Roles (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identity Section */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={`${UI_TOKENS.card.title} flex items-center gap-2`}>
                  <UserIcon className="w-4 h-4 text-[#0066FF]" />
                  Account Identity
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee ID (Manual punch card standard) */}
                <FormField
                  label="Employee ID (HR / Biometric Badge)"
                  required
                  htmlFor="emp_id"
                  error={fieldErrors.emp_id}
                  helperText="Official punch card / HR badge number (e.g. 255776, 100492)"
                >
                  <TextInput
                    id="emp_id"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. 255776"
                    isError={!!fieldErrors.emp_id}
                    className="font-mono"
                    autoFocus={!isEditMode}
                  />
                </FormField>

                {/* Username */}
                <FormField
                  label="Login Username"
                  required
                  htmlFor="username"
                  error={fieldErrors.username}
                  helperText="Used for system sign in. Lowercase & digits."
                >
                  <TextInput
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="e.g. jdoe or operator01"
                    isError={!!fieldErrors.username}
                    readOnly={isRootSuperadmin}
                    className={`font-mono ${isRootSuperadmin ? UI_TOKENS.input.readonly : ""}`}
                  />
                </FormField>

                {/* Full Name */}
                <FormField
                  label="Full Name"
                  required
                  htmlFor="name"
                  error={fieldErrors.name}
                >
                  <TextInput
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mohammad Rahim"
                    isError={!!fieldErrors.name}
                  />
                </FormField>

                {/* Email */}
                <FormField
                  label="Email Address"
                  htmlFor="email"
                  error={fieldErrors.email}
                  helperText="Optional for floor operators, required for management"
                >
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahim@factory.com"
                    isError={!!fieldErrors.email}
                  />
                </FormField>

                {/* Phone */}
                <FormField
                  label="Phone Number"
                  htmlFor="phone"
                  error={fieldErrors.phone}
                  helperText="e.g. +880 1700-000000"
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
                    placeholder="+880 1700-000000"
                    isError={!!fieldErrors.phone}
                  />
                </FormField>

                {/* Password & Confirm Password Fields (Creation Mode Only) */}
                {!isEditMode && (
                  <>
                    <FormField
                      label="Account Password"
                      required={true}
                      htmlFor="password"
                      error={fieldErrors.password}
                      helperText="Minimum 8 characters with letters & symbols"
                    >
                      <div className="relative">
                        <TextInput
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secure password"
                          isError={!!fieldErrors.password}
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormField>

                    <FormField
                      label="Confirm Password"
                      required={true}
                      htmlFor="password_confirmation"
                      error={fieldErrors.password_confirmation}
                      helperText="Re-type the identical password for verification"
                    >
                      <div className="relative">
                        <TextInput
                          id="password_confirmation"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordConfirmation}
                          onChange={(e) => setPasswordConfirmation(e.target.value)}
                          placeholder="Confirm password"
                          isError={!!fieldErrors.password_confirmation}
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormField>
                  </>
                )}
              </div>
            </div>

            {/* Affiliation & RBAC Roles Section */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={`${UI_TOKENS.card.title} flex items-center gap-2`}>
                  <Building2 className="w-4 h-4 text-[#0066FF]" />
                  Company & Role Assignment
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Select */}
                <FormField
                  label="Company"
                  required
                  htmlFor="company_id"
                  error={fieldErrors.company_id}
                  helperText="Select the company this user belongs to"
                >
                  <select
                    id="company_id"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : "")}
                    className={`${UI_TOKENS.input.select} ${fieldErrors.company_id ? UI_TOKENS.input.error : ""}`}
                  >
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Department */}
                <FormField
                  label="Department / Unit"
                  htmlFor="department"
                  error={fieldErrors.department}
                  helperText="e.g. Cutting, Sewing Line 04, Quality Assurance"
                >
                  <TextInput
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Cutting Section"
                    isError={!!fieldErrors.department}
                    list="department-suggestions"
                  />
                  <datalist id="department-suggestions">
                    {suggestedDepartments.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </FormField>

                {/* Role Select Dropdown */}
                <div className="md:col-span-2">
                  <FormField
                    label="Assigned Enterprise Role"
                    required
                    htmlFor="role_select"
                    error={fieldErrors.roles}
                    helperText="Defines module permissions and terminal authorization rights"
                  >
                    <select
                      id="role_select"
                      value={selectedRoles[0] || ""}
                      disabled={isRootSuperadmin}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRoles(val ? [val] : []);
                      }}
                      className={`${UI_TOKENS.input.select} ${fieldErrors.roles ? UI_TOKENS.input.error : ""} ${
                        isRootSuperadmin ? UI_TOKENS.input.readonly : ""
                      }`}
                    >
                      <option value="">Select an enterprise role</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name === "superadmin"
                            ? "superadmin — (Root Administrator)"
                            : role.name === "admin"
                            ? "admin — (Plant / System Administrator)"
                            : role.name === "standarduser"
                            ? "standarduser — (Factory Floor Operator)"
                            : role.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Settings & Account State (1/3 width) */}
          <div className="space-y-4">
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Account Status</h2>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Inactive users cannot authenticate or submit any floor transactions.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    disabled={isRootSuperadmin || isSelf}
                    onClick={() => {
                      if (isRootSuperadmin) {
                        showToast("error", "Action Prohibited", "The root Super Administrator account cannot be deactivated.");
                        return;
                      }
                      if (isSelf) {
                        showToast("error", "Action Prohibited", "You cannot deactivate your own logged-in account.");
                        return;
                      }
                      setIsActive((v) => !v);
                    }}
                    className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-1 ${
                      isRootSuperadmin || isSelf
                        ? "bg-[#0066FF] opacity-60 cursor-not-allowed"
                        : isActive
                        ? "bg-[#0066FF] cursor-pointer"
                        : "bg-slate-300 cursor-pointer"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      {isRootSuperadmin && (
                        <Badge variant="purple" className="text-[10px] px-1.5 py-0">Root Protected</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isRootSuperadmin
                        ? "Protected root administrator"
                        : isSelf
                        ? "Current active user account"
                        : isActive
                        ? "Operational and authorized"
                        : "Suspended / access blocked"}
                    </p>
                  </div>
                </div>

                {isRootSuperadmin && (
                  <div className="p-2 rounded bg-purple-50 border border-purple-200/80 text-[11px] text-purple-800 flex items-start gap-1.5 leading-snug">
                    <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Root Superadmin:</strong> This primary administration account cannot be deactivated or deleted.</span>
                  </div>
                )}

                {isSelf && !isRootSuperadmin && (
                  <div className="p-2 rounded bg-blue-50 border border-blue-200/80 text-[11px] text-[#0066FF] flex items-start gap-1.5 leading-snug">
                    <span>⚡ <strong>Active Session:</strong> You are currently logged into this account. Self-deactivation is disabled for security.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Toast Notification */}
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
