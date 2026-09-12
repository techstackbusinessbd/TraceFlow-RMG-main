import React, { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Sliders, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { RowActionsMenu } from "../../components/common/RowActionsMenu";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getRoles, deleteRole, type RoleItem } from "../../services/roleService";

interface RoleListPageProps {
  onNavigate: (path: string) => void;
}

export const RoleListPage: React.FC<RoleListPageProps> = ({ onNavigate }) => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">("all");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRolesList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getRoles(search.trim());
      setRoles(res.data);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Load Error", apiError?.message || "Failed to load roles.");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRolesList();
  }, [fetchRolesList]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteRole(deleteTarget.id);
      showToast("success", "Role Deleted", res.message);
      setDeleteTarget(null);
      fetchRolesList();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Delete Failed", apiError?.message || "Could not delete role.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and Sort in memory
  const filteredRoles = roles.filter((r) => {
    if (typeFilter === "system") return r.is_system;
    if (typeFilter === "custom") return !r.is_system;
    return true;
  });

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    let valA = a[sortField as keyof RoleItem];
    let valB = b[sortField as keyof RoleItem];

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const columns: ColumnDef<RoleItem>[] = [
    {
      key: "name",
      header: "Role Identifier",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0066FF]" />
          <div>
            <span className="font-semibold text-slate-900 font-mono text-xs">{row.name}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {row.name === "superadmin"
                ? "Full unrestricted root access"
                : row.name === "admin"
                ? "Plant administration & governance"
                : row.name === "standarduser"
                ? "Operational viewing & line logging"
                : "Custom enterprise role"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Classification",
      align: "center",
      render: (row) =>
        row.is_system ? (
          <Badge variant="purple" className="text-[11px]">System Core</Badge>
        ) : (
          <Badge variant="info" className="text-[11px]">Custom</Badge>
        ),
    },
    {
      key: "permissions_count",
      header: "Active Permissions",
      align: "center",
      sortable: true,
      render: (row) => (
        <Badge variant={row.name === "superadmin" ? "success" : "neutral"}>
          {row.name === "superadmin" ? "All (Full Access)" : `${row.permissions_count} Allowed`}
        </Badge>
      ),
    },
    {
      key: "users_count",
      header: "Assigned Users",
      align: "center",
      sortable: true,
      render: (row) => (
        <Badge variant="neutral">{row.users_count} Users</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (row) => (
        <RowActionsMenu
          primaryActions={[
            {
              icon: <Sliders className="w-3.5 h-3.5" />,
              label: "Policy Matrix",
              variant: "primary",
              onClick: () => onNavigate(`/roles/${row.id}/matrix`),
            },
          ]}
          menuActions={
            row.is_system
              ? []
              : [
                  {
                    icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                    label: "Delete Role",
                    variant: "danger",
                    dividerBefore: true,
                    onClick: () => setDeleteTarget(row),
                  },
                ]
          }
        />
      ),
    },
  ];

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title="Enterprise Roles & Policy Matrix"
        badgeCount={roles.length}
        badgeLabel="Roles"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onNavigate("/roles/create")}
          >
            Create Role
          </Button>
        }
      />

      {/* Tier 2: Filter Toolbar */}
      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        pageSize={10}
        onPageSizeChange={() => {}}
        activeSortLabel={`Sorted by: ${sortField} (${sortDirection.toUpperCase()})`}
        searchPlaceholder="Search roles by name..."
        onFilterSubmit={fetchRolesList}
        onReset={() => {
          setSearch("");
          setTypeFilter("all");
          setSortField("id");
          setSortDirection("asc");
        }}
        filterInputs={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "system" | "custom")}
            className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
          >
            <option value="all">All Classifications</option>
            <option value="system">System Core Only</option>
            <option value="custom">Custom Roles Only</option>
          </select>
        }
      />

      {/* Tier 3: DataTable Shell */}
      <DataTable
        columns={columns}
        data={sortedRoles}
        totalRecords={sortedRoles.length}
        currentPage={1}
        totalPages={1}
        pageSize={sortedRoles.length || 10}
        isLoading={isLoading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onPageChange={() => {}}
        emptyMessage="No roles match your search filter."
      />

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Delete Custom Role</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete role <strong className="font-mono text-slate-900">{deleteTarget.name}</strong>?
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  This action cannot be undone. Users must not have this role assigned.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Role"}
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
