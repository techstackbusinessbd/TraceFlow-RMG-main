import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Save,
  Shield,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lock,
  Search,
  CheckCheck,
  XCircle,
  Filter,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { TableActionButton } from "../../components/common/TableActionButton";
import { Toast } from "../../components/common/Toast";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getRole,
  getPermissionTree,
  syncRoleMatrix,
  type RoleDetails,
  type PermissionModule,
} from "../../services/roleService";

interface RoleMatrixPageProps {
  roleId: number;
  onNavigate: (path: string) => void;
}

export const RoleMatrixPage: React.FC<RoleMatrixPageProps> = ({ roleId, onNavigate }) => {
  const [role, setRole] = useState<RoleDetails | null>(null);
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Close module dropdown when clicking outside
  useEffect(() => {
    if (!isModuleDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModuleDropdownOpen]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getRole(roleId), getPermissionTree()])
      .then(([roleRes, treeRes]) => {
        setRole(roleRes.data);
        setModules(treeRes.data);

        // Pre-select existing permissions
        const perms = new Set(roleRes.data.permissions || []);
        setSelectedPermissions(perms);

        // Expand all modules by default
        const exp: Record<string, boolean> = {};
        treeRes.data.forEach((m) => {
          exp[m.slug] = true;
        });
        setExpandedModules(exp);
      })
      .catch((err: unknown) => {
        const apiError = err as { message?: string };
        showToast("error", "Load Error", apiError?.message || "Failed to load role or permissions.");
      })
      .finally(() => setIsLoading(false));
  }, [roleId]);

  const isSuperadmin = role?.name === "superadmin";

  // Toggle single module in multi-select filter
  const toggleModuleFilter = (moduleSlug: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleSlug)) {
        next.delete(moduleSlug);
      } else {
        next.add(moduleSlug);
      }
      return next;
    });
  };

  // Select all modules or clear in filter
  const selectAllModulesFilter = () => {
    setSelectedModules(new Set(modules.map((m) => m.slug)));
  };

  const clearModulesFilter = () => {
    setSelectedModules(new Set());
  };

  // Calculate global total counts
  const { totalPermissionsCount, allPermissionNames } = useMemo(() => {
    const allNames: string[] = [];
    modules.forEach((m) => {
      m.submodules.forEach((s) => {
        s.resources.forEach((r) => {
          r.actions.forEach((a) => {
            allNames.push(a.name);
          });
        });
      });
    });
    return {
      totalPermissionsCount: allNames.length,
      allPermissionNames: allNames,
    };
  }, [modules]);

  // Filter modules based on multi-select module filter, search query and action filter
  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const hasModuleFilter = selectedModules.size > 0;

    return modules
      .filter((mod) => !hasModuleFilter || selectedModules.has(mod.slug))
      .map((mod) => {
        const filteredSubmodules = mod.submodules
          .map((sub) => {
            const filteredResources = sub.resources
              .map((res) => {
                const filteredActions = res.actions.filter((act) => {
                  const matchesSearch =
                    !q ||
                    act.name.toLowerCase().includes(q) ||
                    act.description.toLowerCase().includes(q) ||
                    act.action.toLowerCase().includes(q) ||
                    res.label.toLowerCase().includes(q) ||
                    sub.label.toLowerCase().includes(q) ||
                    mod.label.toLowerCase().includes(q);

                  const matchesAction =
                    actionFilter === "all" ||
                    act.action.toLowerCase() === actionFilter.toLowerCase();

                  return matchesSearch && matchesAction;
                });

                return { ...res, actions: filteredActions };
              })
              .filter((res) => res.actions.length > 0);

            return { ...sub, resources: filteredResources };
          })
          .filter((sub) => sub.resources.length > 0);

        return { ...mod, submodules: filteredSubmodules };
      })
      .filter((mod) => mod.submodules.length > 0);
  }, [modules, selectedModules, searchQuery, actionFilter]);

  const togglePermission = (permName: string) => {
    if (isSuperadmin) return;

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) {
        next.delete(permName);
      } else {
        next.add(permName);
      }
      return next;
    });
  };

  const toggleModule = (moduleSlug: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleSlug]: !(prev[moduleSlug] ?? true),
    }));
  };

  const expandAll = () => {
    const exp: Record<string, boolean> = {};
    modules.forEach((m) => {
      exp[m.slug] = true;
    });
    setExpandedModules(exp);
  };

  const collapseAll = () => {
    const exp: Record<string, boolean> = {};
    modules.forEach((m) => {
      exp[m.slug] = false;
    });
    setExpandedModules(exp);
  };

  // Select all permissions in system
  const handleSelectAllGlobal = () => {
    if (isSuperadmin) return;
    setSelectedPermissions(new Set(allPermissionNames));
  };

  // Deselect all permissions in system
  const handleDeselectAllGlobal = () => {
    if (isSuperadmin) return;
    setSelectedPermissions(new Set());
  };

  // Select/Deselect all permissions inside a module
  const toggleAllInModule = (module: PermissionModule) => {
    if (isSuperadmin) return;

    const modulePerms: string[] = [];
    module.submodules.forEach((sub) => {
      sub.resources.forEach((res) => {
        res.actions.forEach((act) => {
          modulePerms.push(act.name);
        });
      });
    });

    const allSelected = modulePerms.every((p) => selectedPermissions.has(p));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      modulePerms.forEach((p) => {
        if (allSelected) {
          next.delete(p);
        } else {
          next.add(p);
        }
      });
      return next;
    });
  };

  // Select/Deselect all permissions inside a submodule
  const toggleAllInSubmodule = (submodulePerms: string[]) => {
    if (isSuperadmin) return;

    const allSelected = submodulePerms.every((p) => selectedPermissions.has(p));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      submodulePerms.forEach((p) => {
        if (allSelected) {
          next.delete(p);
        } else {
          next.add(p);
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    if (role.name === "superadmin") {
      showToast("error", "Permanent Role", "The superadmin role has fixed full privileges.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await syncRoleMatrix(role.id, Array.from(selectedPermissions));
      showToast("success", "Matrix Updated", res.message);
      setRole((prev) => (prev ? { ...prev, permissions: res.data.permissions } : null));
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      showToast("error", "Save Failed", apiError?.message || "Could not save permission matrix.");
    } finally {
      setIsSaving(false);
    }
  };

  const grantedCount = isSuperadmin ? totalPermissionsCount : selectedPermissions.size;
  const coveragePercent = totalPermissionsCount > 0 ? Math.round((grantedCount / totalPermissionsCount) * 100) : 0;

  // Distinct action badges for quick filter
  const actionTypes = ["all", "view", "create", "update", "delete", "restore", "force_delete", "pair", "revoke"];

  const getActionBadgeVariant = (action: string): "info" | "success" | "warning" | "danger" | "purple" | "neutral" => {
    switch (action) {
      case "view":
        return "info";
      case "create":
        return "success";
      case "update":
        return "warning";
      case "delete":
      case "force_delete":
        return "danger";
      case "restore":
        return "success";
      case "pair":
      case "revoke":
        return "purple";
      default:
        return "neutral";
    }
  };

  if (isLoading) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0066FF] border-r-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading policy matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">Role not found.</p>
          <Button variant="secondary" onClick={() => onNavigate("/roles")}>
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title={`Policy Matrix: ${role.name.toUpperCase()}`}
        badgeLabel={isSuperadmin ? "Full Access Root" : `${grantedCount} of ${totalPermissionsCount} Allowed (${coveragePercent}%)`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/roles")}
            >
              Back to Roles
            </Button>
            {!isSuperadmin && (
              <Button
                variant="primary"
                icon={<Save className="h-3.5 w-3.5" />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        }
      />

      {/* Role Notice & Security Banner */}
      {isSuperadmin ? (
        <div className={UI_TOKENS.matrix.bannerRoot}>
          <div className="p-1.5 rounded-md bg-purple-100 text-purple-700 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs text-purple-900">
            <div className="font-bold flex items-center gap-1.5">
              <span>Root Super Administrator (Immutable Architecture)</span>
              <Badge variant="purple" className="text-[10px] px-1.5 py-0">100% Locked</Badge>
            </div>
            <p className="mt-0.5 text-purple-700/90 leading-relaxed">
              This role inherently possesses permanent root privileges across all current and future system modules. Its policy matrix cannot be restricted or altered.
            </p>
          </div>
        </div>
      ) : (
        <div className={UI_TOKENS.matrix.bannerGov}>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-blue-100 text-[#0066FF] mt-0.5 md:mt-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-800">
              <span className="font-bold text-slate-900">Access Governance Mode:</span> Configure operational authority for operators assigned to the <strong className="text-[#0066FF]">{role.name}</strong> role.
              <p className="text-[11px] text-slate-500 mt-0.5">
                Changes take effect instantly for active user sessions after clicking <strong>Save Changes</strong>.
              </p>
            </div>
          </div>

          {/* Quick Global Action Controls: Full Select & Full Deselect */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <Button
              variant="primary"
              icon={<CheckCheck className="w-3.5 h-3.5" />}
              onClick={handleSelectAllGlobal}
            >
              Select All Permissions ({totalPermissionsCount})
            </Button>
            <Button
              variant="secondary"
              icon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
              onClick={handleDeselectAllGlobal}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Tier 2: Search, Filter & View Control Toolbar */}
      <div className={UI_TOKENS.filter.container}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className={UI_TOKENS.input.iconLeft} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions, resources, or descriptions..."
              className={`${UI_TOKENS.input.base} pl-9`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Module Filter, Action Type Filter Pills & Collapse Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Enterprise Multi-Select Module Filter Popover */}
            <div className="relative" ref={moduleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModuleDropdownOpen((prev) => !prev)}
                className={`${UI_TOKENS.matrix.filterTrigger} ${
                  selectedModules.size > 0
                    ? UI_TOKENS.matrix.filterTriggerActive
                    : UI_TOKENS.matrix.filterTriggerInactive
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                <span>
                  {selectedModules.size === 0
                    ? `All Modules (${modules.length})`
                    : selectedModules.size === 1
                    ? modules.find((m) => selectedModules.has(m.slug))?.label || "1 Module"
                    : `${selectedModules.size} Modules Selected`}
                </span>
                {isModuleDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400 shrink-0" />
                )}
              </button>

              {isModuleDropdownOpen && (
                <div className={UI_TOKENS.matrix.filterPopover}>
                  <div className={UI_TOKENS.matrix.filterPopoverHeader}>
                    <span>Filter by Modules</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllModulesFilter}
                        className="text-[11px] font-semibold text-[#0066FF] hover:underline cursor-pointer"
                      >
                        All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={clearModulesFilter}
                        className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                    {modules.map((m, idx) => {
                      const isChecked = selectedModules.has(m.slug);
                      return (
                        <label
                          key={m.slug}
                          onClick={() => toggleModuleFilter(m.slug)}
                          className={UI_TOKENS.matrix.filterPopoverItem}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                              isChecked
                                ? "bg-[#0066FF] border-[#0066FF] text-white"
                                : "bg-white border-slate-300 group-hover:border-slate-400"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={UI_TOKENS.matrix.submoduleNumberPill}>
                            {idx + 1}
                          </span>
                          <span
                            className={`truncate flex-1 text-xs ${
                              isChecked ? "font-bold text-slate-900" : "font-medium text-slate-700"
                            }`}
                          >
                            {m.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Type Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 h-8 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-slate-400" />
                Action:
              </span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-medium text-slate-700 focus:ring-0 focus:outline-none pr-1 py-0 cursor-pointer"
              >
                {actionTypes.map((act) => (
                  <option key={act} value={act}>
                    {act === "all" ? "All Actions" : act.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className={`${UI_TOKENS.button.tableAction} ${UI_TOKENS.button.tableActionSecondary} h-8`}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className={`${UI_TOKENS.button.tableAction} ${UI_TOKENS.button.tableActionSecondary} h-8`}
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar Subline: Live Stats & Progress Bar */}
        <div className={UI_TOKENS.filter.subline}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Layers className="w-3.5 h-3.5 text-[#0066FF]" />
              Showing <strong>{filteredModules.length}</strong> Modules
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Granted: <strong className="text-slate-900">{grantedCount}</strong> of {totalPermissionsCount}
            </span>
          </div>

          {/* Mini Visual Coverage Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[#0066FF]">
              {coveragePercent}%
            </span>
            <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
              <div
                className={`h-full transition-all duration-300 ${
                  coveragePercent === 100
                    ? "bg-emerald-500"
                    : coveragePercent > 50
                    ? "bg-[#0066FF]"
                    : "bg-amber-500"
                }`}
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tier 3: 4-Tier Modules Matrix */}
      {filteredModules.length === 0 ? (
        <div className={`${UI_TOKENS.card.base} p-8 text-center space-y-2`}>
          <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No matching permissions found</p>
          <p className="text-xs text-slate-500">Try adjusting your search keywords or action filter.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchQuery("");
              setSelectedModules(new Set());
              setActionFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredModules.map((module, modIdx) => {
            const isExpanded = expandedModules[module.slug] ?? true;

            // Compute counts for this module
            let moduleTotalCount = 0;
            let moduleGrantedCount = 0;
            module.submodules.forEach((sub) => {
              sub.resources.forEach((res) => {
                res.actions.forEach((act) => {
                  moduleTotalCount++;
                  if (isSuperadmin || selectedPermissions.has(act.name)) {
                    moduleGrantedCount++;
                  }
                });
              });
            });

            const isAllModuleSelected = moduleTotalCount > 0 && moduleGrantedCount === moduleTotalCount;
            const isSomeModuleSelected = moduleGrantedCount > 0 && !isAllModuleSelected;

            return (
              <div
                key={module.slug}
                className={UI_TOKENS.matrix.moduleCard}
              >
                {/* Module Header Bar */}
                <div className={UI_TOKENS.matrix.moduleHeader}>
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => toggleModule(module.slug)}
                  >
                    <div className="p-1 rounded bg-white border border-slate-200 text-slate-500 group-hover:text-slate-800 shadow-2xs transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={UI_TOKENS.matrix.moduleNumberPill}>
                        {modIdx + 1}
                      </span>
                      <Shield className="w-4 h-4 text-[#0066FF]" />
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {module.label}
                      </h3>
                      <span className={UI_TOKENS.matrix.moduleSlugBadge}>
                        {module.slug}
                      </span>
                    </div>

                    <Badge
                      variant={isAllModuleSelected ? "success" : isSomeModuleSelected ? "info" : "neutral"}
                    >
                      {moduleGrantedCount} / {moduleTotalCount} Granted
                    </Badge>
                  </div>

                  {/* Module Bulk Action Button */}
                  {!isSuperadmin && (
                    <div className="flex items-center gap-2">
                      <TableActionButton
                        variant={isAllModuleSelected ? "danger" : "primary"}
                        icon={isAllModuleSelected ? <XCircle className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
                        onClick={() => toggleAllInModule(module)}
                      >
                        {isAllModuleSelected ? "Deselect All in Module" : `Select All in Module (${moduleTotalCount})`}
                      </TableActionButton>
                    </div>
                  )}
                </div>

                {/* Module Body */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {module.submodules.map((submodule, subIdx) => {
                      // Submodule permissions
                      const submodulePerms: string[] = [];
                      submodule.resources.forEach((r) => {
                        r.actions.forEach((a) => submodulePerms.push(a.name));
                      });

                      const subTotal = submodulePerms.length;
                      const subGranted = submodulePerms.filter((p) =>
                        isSuperadmin || selectedPermissions.has(p)
                      ).length;
                      const isAllSubSelected = subTotal > 0 && subGranted === subTotal;

                      return (
                        <div
                          key={submodule.slug}
                          className={UI_TOKENS.matrix.submoduleCard}
                        >
                          {/* Submodule Header Row */}
                          <div className={UI_TOKENS.matrix.submoduleHeader}>
                            <div className="flex items-center gap-2">
                              <span className={UI_TOKENS.matrix.submoduleNumberPill}>
                                {modIdx + 1}.{subIdx + 1}
                              </span>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                {submodule.label}
                              </h4>
                              <span className={UI_TOKENS.matrix.submoduleSlugText}>
                                ({submodule.slug})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-slate-500">
                                {subGranted}/{subTotal} Allowed
                              </span>
                              {!isSuperadmin && (
                                <TableActionButton
                                  variant="secondary"
                                  onClick={() => toggleAllInSubmodule(submodulePerms)}
                                >
                                  {isAllSubSelected ? "Clear Submodule" : "Allow All"}
                                </TableActionButton>
                              )}
                            </div>
                          </div>

                          {/* Resources Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {submodule.resources.map((resource) => (
                              <div
                                key={resource.slug}
                                className={UI_TOKENS.matrix.resourceCard}
                              >
                                <div className={UI_TOKENS.matrix.resourceHeader}>
                                  <span className="text-xs font-bold text-slate-900">
                                    {resource.label}
                                  </span>
                                  <Badge variant="neutral" className="text-[10px] font-mono px-1.5 py-0">
                                    {resource.slug}
                                  </Badge>
                                </div>

                                <div className="space-y-1.5">
                                  {resource.actions.map((act) => {
                                    const isChecked = isSuperadmin || selectedPermissions.has(act.name);

                                    return (
                                      <div
                                        key={act.name}
                                        onClick={() => togglePermission(act.name)}
                                        className={`${UI_TOKENS.matrix.actionRow} ${
                                          isChecked
                                            ? UI_TOKENS.matrix.actionRowChecked
                                            : UI_TOKENS.matrix.actionRowUnchecked
                                        } ${
                                          isSuperadmin
                                            ? "cursor-default opacity-85"
                                            : "cursor-pointer"
                                        }`}
                                      >
                                        <div className="mt-0.5 shrink-0">
                                          {isChecked ? (
                                            <CheckSquare className="w-4 h-4 text-[#0066FF]" />
                                          ) : (
                                            <Square className="w-4 h-4 text-slate-300 group-hover/item:text-slate-400" />
                                          )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <span
                                              className={`text-xs font-semibold leading-snug ${
                                                isChecked ? "text-slate-900" : "text-slate-700"
                                              }`}
                                            >
                                              {act.description}
                                            </span>
                                            <Badge
                                              variant={getActionBadgeVariant(act.action)}
                                              className="text-[9px] uppercase tracking-wider px-1.5 py-0 shrink-0 font-bold"
                                            >
                                              {act.action}
                                            </Badge>
                                          </div>

                                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate select-all">
                                            {act.name}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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

