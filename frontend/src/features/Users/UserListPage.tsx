import React, { useState, useEffect, useCallback } from "react";
import { Plus, Download, Edit2, Eye, ToggleLeft, ToggleRight, Trash2, Key } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { RowActionsMenu } from "../../components/common/RowActionsMenu";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getUsers,
  toggleUserStatus,
  deleteUser,
  getUserMetadata,
  type AppUser,
} from "../../services/userService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface UserListPageProps {
  onNavigate: (path: string) => void;
}

export const UserListPage: React.FC<UserListPageProps> = ({ onNavigate }) => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Metadata dropdowns
  const [companies, setCompanies] = useState<{ id: number; code: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load lookup metadata
  useEffect(() => {
    getUserMetadata()
      .then((res) => {
        setCompanies(res.data.companies);
        setRoles(res.data.roles);
      })
      .catch(() => {});
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getUsers({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        company_id: companyFilter || undefined,
        role: roleFilter || undefined,
        sort_field: sortField,
        sort_direction: sortDirection,
        per_page: pageSize,
        page: currentPage,
      });

      setUsers(res.data);
      setTotalRecords(res.pagination.total);
      setTotalPages(res.pagination.last_page);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Error", apiError?.message || "Failed to fetch user accounts.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, companyFilter, roleFilter, sortField, sortDirection, pageSize, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleToggleStatus = async (user: AppUser) => {
    try {
      const res = await toggleUserStatus(user.id);
      showToast("success", "Status Updated", res.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: res.data.is_active } : u))
      );
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Action Failed", apiError?.message || "Could not toggle status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(deleteTarget.id);
      showToast("success", "User Deleted", res.message);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Delete Failed", apiError?.message || "Could not delete user.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSortLabel = () => {
    const labels: Record<string, string> = {
      emp_id: "Employee ID",
      name: "Full Name",
      username: "Username",
      created_at: "Created On",
      is_active: "Status",
    };
    return `${labels[sortField] ?? sortField} (${sortDirection.toUpperCase()})`;
  };

  const columns: ColumnDef<AppUser>[] = [
    {
      key: "emp_id",
      header: "Employee ID",
      sortable: true,
      render: (row) => <Badge variant="code">{row.emp_id}</Badge>,
    },
    {
      key: "name",
      header: "User Details",
      sortable: true,
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{row.name}</span>
            {row.username === "superadmin" && (
              <Badge variant="purple" className="text-[10px] px-1.5 py-0">Root Superadmin</Badge>
            )}
            {currentUser?.id === row.id && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0">You</Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">@{row.username}</p>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (row) => (
        <div>
          {row.company ? (
            <div className="space-y-0.5">
              <span className="font-medium text-slate-800 text-xs">{row.company.name}</span>
              <div>
                <Badge variant="code" className="text-[10px] px-1 py-0">{row.company.code}</Badge>
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) =>
        row.department ? (
          <span className="text-xs text-slate-700">{row.department}</span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: "roles",
      header: "Assigned Roles",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((r) => (
              <Badge
                key={r.id}
                variant={r.name === "superadmin" ? "purple" : r.name === "admin" ? "info" : "neutral"}
                className="text-[11px]"
              >
                {r.name}
              </Badge>
            ))
          ) : (
            <span className="text-slate-400 text-xs">No Role</span>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (row) => (
        <div className="space-y-0.5">
          {row.email && <p className="text-xs text-slate-700">{row.email}</p>}
          {row.phone && <p className="text-[11px] text-slate-500 font-mono">{formatPhoneNumber(row.phone)}</p>}
          {!row.email && !row.phone && <span className="text-slate-400 text-xs">—</span>}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      align: "center",
      sortable: true,
      render: (row) => (
        <Badge variant={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (row) => {
        const isRootSuperadmin = row.username === "superadmin";
        const isSelf = currentUser?.id === row.id;

        return (
          <RowActionsMenu
            primaryActions={[
              {
                icon: <Eye className="w-3.5 h-3.5" />,
                label: "View Profile",
                variant: "secondary",
                onClick: () => onNavigate(`/users/${row.uuid || row.id}`),
              },
              {
                icon: <Edit2 className="w-3.5 h-3.5" />,
                label: "Edit User",
                variant: "primary",
                onClick: () => onNavigate(`/users/${row.uuid || row.id}/edit`),
              },
            ]}
            menuActions={
              isRootSuperadmin
                ? []
                : [
                    {
                      icon: <Key className="w-3.5 h-3.5" />,
                      label: "Custom Permissions",
                      variant: "default",
                      onClick: () => onNavigate(`/users/${row.uuid || row.id}/permissions`),
                    },
                    ...(!isSelf
                      ? [
                          {
                            icon: row.is_active ? (
                              <ToggleRight className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                            ),
                            label: row.is_active ? "Deactivate User" : "Activate User",
                            variant: (row.is_active ? "warning" : "default") as "warning" | "default",
                            onClick: () => handleToggleStatus(row),
                          },
                          {
                            icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                            label: "Delete User",
                            variant: "danger" as const,
                            dividerBefore: true,
                            onClick: () => setDeleteTarget(row),
                          },
                        ]
                      : []),
                  ]
            }
          />
        );
      },
    },
  ];

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Sleek Header Row */}
      <PageHeader
        title="User Directory"
        badgeCount={totalRecords}
        badgeLabel="Users"
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => showToast("success", "Export", "User directory export started.")}
            >
              Export Directory
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/users/create")}
            >
              Create User
            </Button>
          </>
        }
      />

      {/* Tier 2: Unified Filter Toolbar */}
      <FilterToolbar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        activeSortLabel={getSortLabel()}
        searchPlaceholder="Search users by name, username, employee ID, email..."
        onFilterSubmit={fetchUsers}
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setCompanyFilter("");
          setRoleFilter("");
          setSortField("created_at");
          setSortDirection("desc");
          setCurrentPage(1);
        }}
        filterInputs={
          <>
            {/* Company Filter */}
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs min-w-[150px]`}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs min-w-[120px]`}
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "active" | "inactive" | "");
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </>
        }
      />

      {/* Tier 3: Standard DataTable Shell */}
      <DataTable
        columns={columns}
        data={users}
        totalRecords={totalRecords}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        isLoading={isLoading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onPageChange={setCurrentPage}
        emptyMessage="No user accounts match the selected criteria."
      />

      {/* Non-CRUD Confirmation Modal: Delete User */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Confirm User Account Deletion</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete user{" "}
                  <strong className="text-slate-900">{deleteTarget.name}</strong> (@{deleteTarget.username})?
                </p>
                <p className="text-[11px] text-rose-600 mt-2">
                  This user will immediately lose system access. Transactions previously authored by this user will remain intact.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
