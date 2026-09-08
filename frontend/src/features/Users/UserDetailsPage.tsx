import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Building2,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
  Clock,
  Briefcase,
  Lock,
  Key,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getUser, toggleUserStatus, type AppUser } from "../../services/userService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface UserDetailsPageProps {
  userId: number;
  onNavigate: (path: string) => void;
}

export const UserDetailsPage: React.FC<UserDetailsPageProps> = ({
  userId,
  onNavigate,
}) => {
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    getUser(userId)
      .then(({ data }) => setUser(data))
      .catch((err: unknown) => {
        const apiErr = err as { message?: string };
        showToast("error", "Load Error", apiErr?.message || "Could not load user details.");
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleToggleStatus = async () => {
    if (!user) return;
    setIsToggling(true);
    try {
      const res = await toggleUserStatus(user.id);
      showToast("success", "Status Updated", res.message);
      setUser((prev) => (prev ? { ...prev, is_active: res.data.is_active } : null));
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showToast("error", "Action Prohibited", apiErr?.message || "Could not toggle user status.");
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0066FF] border-r-transparent" />
            <p className="text-xs text-slate-500">Loading user profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">User account not found.</p>
          <Button variant="secondary" onClick={() => onNavigate("/users")}>
            Back to User Directory
          </Button>
        </div>
      </div>
    );
  }

  const isRootSuperadmin = user.username === "superadmin";
  const isSelf = currentUser?.id === user.id;

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title={user.name}
        badgeLabel={`@${user.username}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/users")}
            >
              Back to Directory
            </Button>
            {!isRootSuperadmin && !isSelf && (
              <Button
                variant="secondary"
                icon={
                  user.is_active
                    ? <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                    : <ToggleLeft className="h-3.5 w-3.5 text-slate-400" />
                }
                onClick={handleToggleStatus}
                disabled={isToggling}
              >
                {isToggling ? "Updating..." : user.is_active ? "Deactivate User" : "Activate User"}
              </Button>
            )}
            {!isRootSuperadmin && (
              <Button
                variant="secondary"
                icon={<Key className="h-3.5 w-3.5 text-[#0066FF]" />}
                onClick={() => onNavigate(`/users/${user.id}/permissions`)}
              >
                Custom Permissions
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={() => onNavigate(`/users/${user.id}/edit`)}
            >
              Edit User
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
                  <UserIcon className="w-4 h-4 text-[#0066FF]" />
                  User Identity & Affiliation
                </h2>
                {isRootSuperadmin && (
                  <Badge variant="purple" className="text-[10px] px-2 py-0.5">Root Super Administrator</Badge>
                )}
                {isSelf && (
                  <Badge variant="info" className="text-[10px] px-2 py-0.5">Your Account</Badge>
                )}
              </div>
              <Badge variant={user.is_active ? "success" : "danger"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Employee ID (Punch Card)</p>
                <Badge variant="code">{user.emp_id}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Login Username</p>
                <p className="text-sm font-bold text-slate-900 font-mono">@{user.username}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Full Name</p>
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#0066FF]" /> Company
                </p>
                {user.company ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-800">{user.company.name}</span>
                    <Badge variant="code" className="text-[10px] px-1 py-0">{user.company.code}</Badge>
                    {user.company.is_default && (
                      <Badge variant="info" className="text-[10px] px-1.5 py-0">Default</Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">None</span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Department / Section
                </p>
                <p className="text-sm text-slate-800 font-medium">{user.department || "General Operations"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#0066FF]" /> Assigned Roles
                </p>
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((r) => (
                      <Badge
                        key={r.id}
                        variant={r.name === "superadmin" ? "purple" : r.name === "admin" ? "info" : "neutral"}
                        className="text-xs"
                      >
                        {r.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">No Role Assigned</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#0066FF]" /> Custom Direct Permissions
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={user.direct_permissions && user.direct_permissions.length > 0 ? "success" : "neutral"} className="text-xs">
                    {user.direct_permissions ? user.direct_permissions.length : 0} Direct Granted
                  </Badge>
                  {!isRootSuperadmin && (
                    <button
                      type="button"
                      onClick={() => onNavigate(`/users/${user.id}/permissions`)}
                      className="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer"
                    >
                      Manage Custom
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Official Email
                </p>
                <p className="text-sm text-slate-800 font-mono">
                  {user.email || <span className="text-slate-400 font-sans">Not provided</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Contact Phone
                </p>
                <p className="text-sm text-slate-800 font-mono">
                  {user.phone ? formatPhoneNumber(user.phone) : <span className="text-slate-400 font-sans">Not provided</span>}
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
              <h2 className={UI_TOKENS.card.title}>Account Audit & Telemetry</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Status
                </div>
                <Badge variant={user.is_active ? "success" : "danger"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last Login
                </div>
                <span className="text-xs font-semibold text-slate-800 font-mono">
                  {formatDate(user.last_login_at)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Account Created</span>
                <span className="text-xs font-semibold text-slate-800 font-mono">{formatDate(user.created_at)}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-600">Last Profile Update</span>
                <span className="text-xs font-semibold text-slate-800 font-mono">{formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={`${UI_TOKENS.card.title} flex items-center gap-1.5`}>
                <Lock className="w-4 h-4 text-[#0066FF]" />
                Security Governance
              </h2>
            </div>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                All actions performed by this user account are cryptographically recorded in the central audit ledger.
              </p>
              {isRootSuperadmin && (
                <div className="p-2 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[11px]">
                  🛡️ This root user has immutable administrative access.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
