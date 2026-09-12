import React, { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Edit2, Trash2, Percent, ToggleRight, ToggleLeft } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { RowActionsMenu } from "../../components/common/RowActionsMenu";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import { getOperationalCompanies, type Company } from "../../services/companyService";
import {
  getAgents,
  deleteAgent,
  toggleAgentStatus,
  type Agent,
} from "../../services/agentService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface AgentListPageProps {
  onNavigate: (path: string) => void;
}

export const AgentListPage: React.FC<AgentListPageProps> = ({ onNavigate }) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canCreate = hasRole("superadmin") || hasPermission("master_data.agents.profile.create");
  const canEdit = hasRole("superadmin") || hasPermission("master_data.agents.profile.update");
  const canDelete = hasRole("superadmin") || hasPermission("master_data.agents.profile.delete");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Companies for filter dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const operationalList = await getOperationalCompanies();
        setCompanies(operationalList);
      } catch {
        // silent fail
      }
    };
    fetchCompanies();
  }, []);

  // Fetch agents data
  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAgents({
        search,
        company_id: companyFilter,
        status: statusFilter as "" | "active" | "inactive",
        sort_field: sortField,
        sort_direction: sortDirection,
        per_page: pageSize,
        page: currentPage,
      });
      setAgents(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.last_page);
    } catch {
      showToast("error", "Failed to Load", "Could not fetch buying agents list. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [search, companyFilter, statusFilter, sortField, sortDirection, pageSize, currentPage]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCompanyFilter("");
    setStatusFilter("");
    setSortField("name");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      const res = await toggleAgentStatus(agent.id);
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, is_active: res.data.is_active } : a))
      );
      showToast("success", "Status Updated", res.message);
    } catch {
      showToast("error", "Update Failed", "Could not toggle buying agent status. Try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteAgent(deleteTarget.id);
      showToast("success", "Agent Removed", res.message);
      setDeleteTarget(null);
      loadAgents();
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || "Could not delete buying agent.";
      showToast("error", "Delete Failed", errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSortHeaderName = () => {
    const labels: Record<string, string> = {
      code: "Agent Code",
      name: "Agent Name",
      country: "Country",
      commission_rate: "Commission Rate",
      is_active: "Status",
    };
    const label = labels[sortField] || "Agent Name";
    return `${label} (${sortDirection.toUpperCase()})`;
  };

  const columns: ColumnDef<Agent>[] = [
    {
      key: "code",
      header: "Agent Code",
      sortable: true,
      render: (agent) => <Badge variant="code">{agent.code}</Badge>,
    },
    {
      key: "name",
      header: "Agent / Buying House Name",
      sortable: true,
      render: (agent) => (
        <div>
          <span className="font-semibold text-slate-900 block">{agent.name}</span>
          {agent.contact_person && (
            <span className="text-xs text-slate-500">Contact: {agent.contact_person}</span>
          )}
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      sortable: true,
      render: (agent) => <span className="text-slate-700 font-medium">{agent.country}</span>,
    },
    {
      key: "company",
      header: "Company",
      sortable: false,
      render: (agent) => (
        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {agent.company?.code || "PLT"}
        </span>
      ),
    },
    {
      key: "commission_rate",
      header: "Commission",
      sortable: true,
      render: (agent) => (
        agent.commission_rate !== null && agent.commission_rate !== undefined ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Percent className="w-3 h-3" />
            {Number(agent.commission_rate).toFixed(2)}%
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      ),
    },
    {
      key: "buyers_count",
      header: "Linked Buyers",
      align: "center",
      sortable: false,
      render: (agent) => (
        <Badge variant={agent.buyers_count && agent.buyers_count > 0 ? "neutral" : "warning"}>
          {agent.buyers_count || 0} Buyers
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Contact Info",
      sortable: false,
      render: (agent) => (
        <div className="text-xs space-y-0.5">
          {agent.email && <div className="text-slate-600">{agent.email}</div>}
          {agent.phone && <div className="font-mono text-slate-500">{formatPhoneNumber(agent.phone)}</div>}
          {!agent.email && !agent.phone && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      align: "center",
      sortable: true,
      render: (agent) => (
        <Badge variant={agent.is_active ? "success" : "danger"}>
          {agent.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      sortable: false,
      render: (agent) => (
        <RowActionsMenu
          primaryActions={[
            {
              icon: <Eye className="w-3.5 h-3.5" />,
              label: "View Profile",
              variant: "secondary",
              onClick: () => onNavigate(`/master/agents/${agent.uuid || agent.id}`),
            },
            ...(canEdit
              ? [
                  {
                    icon: <Edit2 className="w-3.5 h-3.5" />,
                    label: "Edit Agent",
                    variant: "primary" as const,
                    onClick: () => onNavigate(`/master/agents/${agent.uuid || agent.id}/edit`),
                  },
                ]
              : []),
          ]}
          menuActions={[
            ...(canEdit
              ? [
                  {
                    label: agent.is_active ? "Deactivate Agent" : "Activate Agent",
                    icon: agent.is_active ? (
                      <ToggleRight className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                    ),
                    variant: agent.is_active ? ("warning" as const) : ("default" as const),
                    onClick: () => handleToggleStatus(agent),
                  },
                ]
              : []),
            ...(canDelete
              ? [
                  {
                    label: "Delete Agent",
                    icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                    variant: "danger" as const,
                    dividerBefore: true,
                    onClick: () => setDeleteTarget(agent),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

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

      {/* Tier 1: Sleek Header Row */}
      <PageHeader
        title="Buying Agent Directory"
        badgeCount={total}
        badgeLabel={total === 1 ? "Agent" : "Agents"}
        actions={
          canCreate ? (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate("/master/agents/create")}
            >
              Create Agent
            </Button>
          ) : undefined
        }
      />

      {/* Tier 2: Unified Filter Toolbar */}
      <FilterToolbar
        searchPlaceholder="Search by Agent Code, Name, Country, or Contact..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        onReset={handleResetFilters}
        activeSortLabel={getSortHeaderName()}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        filterInputs={
          <div className="flex items-center gap-2">
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`${UI_TOKENS.input.select} py-1.5 text-xs`}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        }
      />

      {/* Tier 3: Standard DataTable Shell */}
      <DataTable
        columns={columns}
        data={agents}
        totalRecords={total}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={(p: number) => setCurrentPage(p)}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        isLoading={isLoading}
        emptyMessage="No buying agents or sourcing houses registered yet."
      />

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className={UI_TOKENS.launcherModal.backdrop}>
          <div className={UI_TOKENS.launcherModal.dialogContainer}>
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2.5 bg-rose-50 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Buying Agent</h3>
                <p className="text-xs text-slate-500">System Traceability Action</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete Buying Agent{" "}
              <strong className="text-slate-900 font-semibold">{deleteTarget.name}</strong> (
              <span className="font-mono text-xs">{deleteTarget.code}</span>)?
              {deleteTarget.buyers_count && deleteTarget.buyers_count > 0 ? (
                <span className="block mt-2 text-rose-600 font-medium text-xs">
                  Warning: This agent is currently linked to {deleteTarget.buyers_count} registered buyer(s).
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
