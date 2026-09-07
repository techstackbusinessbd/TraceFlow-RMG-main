import React, { useState } from "react";
import {
  Building2,
  BadgeCheck,
  Shield,
  AlertCircle,
  Layers,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { useAuthStore } from "../../store/authStore";

export const UserProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuthStore();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Handle Profile Update (Pure Server-Side Validation)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileErrors({});
    setProfileSuccessMessage(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          department,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setProfileErrors(data.errors);
        } else {
          setProfileErrors({ general: [data.message || "Failed to update profile."] });
        }
        return;
      }

      // Success
      if (data.data?.user) {
        updateUser(data.data.user);
      } else {
        updateUser({ name, email, department, phone });
      }
      setProfileSuccessMessage("Profile information updated successfully.");
    } catch {
      setProfileErrors({ general: ["Network connection failed. Please check backend server."] });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update (Pure Server-Side Validation)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordErrors({});
    setPasswordSuccessMessage(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setPasswordErrors(data.errors);
        } else {
          setPasswordErrors({ general: [data.message || "Failed to change password."] });
        }
        return;
      }

      // Success
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setPasswordSuccessMessage("Password changed successfully.");
    } catch {
      setPasswordErrors({ general: ["Network connection failed. Please check backend server."] });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const primaryRole = user?.roles?.[0] || "Standard User";
  const userCompany = user?.company_name || "Platform Owner";

  return (
    <div className="space-y-4">
      {/* Tier 1: Power Automate Sleek Header Row */}
      <PageHeader
        title="User Account & Security"
        badgeCount={primaryRole}
        badgeLabel=""
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="code">EMP ID: {user?.emp_id || "N/A"}</Badge>
            <Badge variant="success">Active Account</Badge>
          </div>
        }
      />

      {/* Main Grid: User Overview Card + Profile Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Account Profile Summary Card */}
        <div className="space-y-4">
          <div className={UI_TOKENS.card.base}>
            <div className="flex flex-col items-center text-center p-2">
              <div className="w-20 h-20 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-blue-100 mb-3">
                {user?.name?.charAt(0) || "U"}
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {user?.name || "User Profile"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email || "No email assigned"}</p>
              
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                <Badge variant="purple">{primaryRole}</Badge>
                <Badge variant="neutral">@{user?.username}</Badge>
              </div>
            </div>

            <div className="border-t border-slate-100 mt-4 pt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Assigned Company
                </span>
                <span className="font-semibold text-slate-800 text-right">{userCompany}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-slate-400" />
                  Biometric Punch ID
                </span>
                <span className="font-mono font-semibold text-slate-800">{user?.emp_id || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Department
                </span>
                <span className="font-medium text-slate-800">{user?.department || "Operations"}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Access Tier
                </span>
                <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {user?.roles?.includes("superadmin") ? "Global Full-Trust" : "Role-Scoped RBAC"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-slate-100/80 pt-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Software Version
                </span>
                <span className="font-mono font-semibold text-slate-700 text-[11px]">
                  TraceFlow RMG v1.0.0
                </span>
              </div>
            </div>
          </div>

          {/* Assigned System Roles & Permissions Info */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h3 className={UI_TOKENS.card.title}>Role Privileges & Access</h3>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your privileges are governed strictly by your assigned role. Contact your System Administrator for role alterations.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <Badge key={r} variant="purple">
                      {r}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">No direct role</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms (Profile Information & Security) */}
        <div className="lg:col-span-2 space-y-4">
          {/* General Information Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h3 className={UI_TOKENS.card.title}>General Information</h3>
            </div>

            {profileErrors.general && (
              <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileErrors.general[0]}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} noValidate className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Employee ID (Read-only System Policy) */}
                <FormField
                  label="Employee Biometric Badge (EMP ID)"
                  helperText="Official HR Badge Number (Fixed ID)"
                >
                  <TextInput
                    type="text"
                    value={user?.emp_id || ""}
                    disabled
                    className={UI_TOKENS.input.readonly}
                  />
                </FormField>

                {/* Username (Read-only) */}
                <FormField
                  label="Login Username"
                  helperText="Unique system authentication handle"
                >
                  <TextInput
                    type="text"
                    value={user?.username || ""}
                    disabled
                    className={UI_TOKENS.input.readonly}
                  />
                </FormField>

                {/* Full Name */}
                <FormField
                  label="Full Official Name"
                  required
                  error={profileErrors.name}
                >
                  <TextInput
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    isError={!!profileErrors.name}
                  />
                </FormField>

                {/* Corporate Email */}
                <FormField
                  label="Official Corporate Email"
                  required
                  error={profileErrors.email}
                >
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    isError={!!profileErrors.email}
                  />
                </FormField>

                {/* Department */}
                <FormField
                  label="Department / Unit"
                  error={profileErrors.department}
                >
                  <TextInput
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Merchandising, Cutting, Quality"
                    isError={!!profileErrors.department}
                  />
                </FormField>

                {/* Official Contact Phone */}
                <FormField
                  label="Official Contact Number"
                  error={profileErrors.phone}
                >
                  <TextInput
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +880 1700 000000"
                    isError={!!profileErrors.phone}
                  />
                </FormField>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? "Saving Changes..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </div>

          {/* Security & Password Reset Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h3 className={UI_TOKENS.card.title}>Security & Password</h3>
            </div>

            {passwordErrors.general && (
              <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordErrors.general[0]}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Current Password */}
                <FormField
                  label="Current Password"
                  required
                  error={passwordErrors.current_password}
                >
                  <TextInput
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    isError={!!passwordErrors.current_password}
                  />
                </FormField>

                {/* New Password */}
                <FormField
                  label="New Secure Password"
                  required
                  error={passwordErrors.password}
                >
                  <TextInput
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    isError={!!passwordErrors.password}
                  />
                </FormField>

                {/* Confirm New Password */}
                <FormField
                  label="Confirm New Password"
                  required
                  error={passwordErrors.password_confirmation}
                >
                  <TextInput
                    type="password"
                    value={newPasswordConfirmation}
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                    placeholder="Retype new password"
                    isError={!!passwordErrors.password_confirmation}
                  />
                </FormField>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <p className="text-[11px] text-slate-500">
                  Passwords must contain at least 8 characters with numbers and symbols recommended.
                </p>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Enterprise Floating Toast Notification */}
      <div className={UI_TOKENS.toast.container}>
        {profileSuccessMessage && (
          <Toast
            type="success"
            title="Profile Updated"
            message={profileSuccessMessage}
            onClose={() => setProfileSuccessMessage(null)}
          />
        )}
        {passwordSuccessMessage && (
          <Toast
            type="success"
            title="Security Updated"
            message={passwordSuccessMessage}
            onClose={() => setPasswordSuccessMessage(null)}
          />
        )}
      </div>
    </div>
  );
};
