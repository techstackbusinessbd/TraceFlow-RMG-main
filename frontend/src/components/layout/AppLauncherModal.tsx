import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Building2,
  Users,
  Shirt,
  Scissors,
  Layers,
  CheckCircle2,
  Boxes,
  Truck,
  ArrowRight,
  Zap,
  ShieldCheck,
  KeyRound,
  FolderTree,
  Globe,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { UI_TOKENS } from "../../config/designTokens";
import { navigationService } from "../../services/navigationService";
import type { NavModule, NavSubmodule } from "../../services/navigationService";

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (moduleId: string, submoduleGroupId?: string) => void;
  initialSearchQuery?: string;
  activeSubmoduleGroupId?: string | null;
  currentModuleId?: string;
}

// Icon dictionary to map backend string icon identifiers to Lucide SVG components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  KeyRound,
  Building2,
  Users,
  Truck,
  Shirt,
  Layers,
  Scissors,
  CheckCircle2,
  Boxes,
  Calendar,
  FolderTree,
  BarChart3,
};

// Project Signature Theme: Pure Microsoft Power Automate Cobalt Blue & Slate
const THEME = {
  iconBox: "bg-[#EFF6FC] text-[#0066FF] border border-[#C7E0F4] group-hover:bg-[#0066FF] group-hover:text-white group-hover:border-[#0066FF]",
  iconColor: "text-[#0066FF]",
  badge: "bg-slate-100 text-slate-600 border border-slate-200",
  chipBg: "bg-slate-50 text-slate-700 hover:bg-[#EFF6FC] hover:text-[#0066FF] hover:border-[#C7E0F4] border-slate-200",
  accentGlow: "hover:border-[#0066FF] hover:shadow-sm",
  tagBorder: "border-slate-200 text-slate-600 bg-slate-100",
};

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  isOpen,
  onClose,
  onSelectApp,
  initialSearchQuery = "",
  activeSubmoduleGroupId,
  currentModuleId,
}) => {
  const [filterQuery, setFilterQuery] = useState(initialSearchQuery);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [catalog, setCatalog] = useState<NavModule[]>(() => navigationService.getImmediateCatalog());
  const [isLoading, setIsLoading] = useState(() => navigationService.getImmediateCatalog().length === 0);

  // Load Hybrid Backend-Driven Navigation Catalog on mount/open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const currentImmediate = navigationService.getImmediateCatalog();
    if (currentImmediate.length > 0 && catalog.length === 0) {
      setCatalog(currentImmediate);
      setIsLoading(false);
    } else if (catalog.length === 0) {
      setIsLoading(true);
    }

    navigationService
      .getCatalog(false)
      .then((data) => {
        if (isMounted && data.length > 0) {
          setCatalog(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Check if current path is dashboard or home
  const isHomeOrDashboard =
    window.location.pathname === "/" ||
    window.location.pathname === "/dashboard" ||
    window.location.pathname === "/login" ||
    currentModuleId === "dashboard" ||
    currentModuleId === "home";

  // Check if user is currently on an operational sidebar menu (excluding dashboard/home)
  const hasActiveSidebarMenu =
    !isHomeOrDashboard &&
    Boolean(
      activeSubmoduleGroupId ||
        (currentModuleId && currentModuleId !== "dashboard" && currentModuleId !== "home")
    );

  useEffect(() => {
    if (isOpen) {
      setFilterQuery(initialSearchQuery);

      // If on an active operational menu, automatically select its domain
      if (hasActiveSidebarMenu && catalog.length > 0) {
        const foundModule = catalog.find((mod) =>
          mod.submodules.some((sub) => {
            const allActionMenus = sub.clusters?.flatMap((c) => c.menus) || [];
            return (
              (activeSubmoduleGroupId && activeSubmoduleGroupId === sub.id) ||
              (!activeSubmoduleGroupId &&
                currentModuleId &&
                (sub.target_module_id === currentModuleId ||
                  sub.id === currentModuleId ||
                  allActionMenus.some((m) => m.id === currentModuleId || m.path === window.location.pathname)))
            );
          })
        );

        if (foundModule) {
          setActiveTab(foundModule.id);
          return;
        }
      }

      // Normally (e.g. on Dashboard / Home), show ALL domains
      setActiveTab("all");
    }
  }, [isOpen, initialSearchQuery, catalog, activeSubmoduleGroupId, currentModuleId, hasActiveSidebarMenu]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter catalog based on search query and active tab
  const query = filterQuery.toLowerCase().trim();

  const filteredCatalog = useMemo(() => {
    return catalog
      .filter((mod) => (activeTab === "all" ? true : mod.id === activeTab))
      .map((mod) => {
        const filteredSubmodules = mod.submodules.filter((sub) => {
          if (!query) return true;
          const matchesSubName = sub.name.toLowerCase().includes(query);
          const matchesSubDesc = sub.description.toLowerCase().includes(query);
          const matchesCluster = sub.clusters?.some(
            (c) =>
              c.title.toLowerCase().includes(query) ||
              c.menus.some((m) => m.label.toLowerCase().includes(query))
          );
          return matchesSubName || matchesSubDesc || matchesCluster;
        });

        if (filteredSubmodules.length === 0) return null;

        return {
          ...mod,
          submodules: filteredSubmodules,
        };
      })
      .filter(Boolean) as NavModule[];
  }, [catalog, activeTab, query]);

  // Calculate total process modules across accessible areas
  const totalAvailableProcesses = useMemo(
    () => catalog.reduce((acc, m) => acc + m.submodules.length, 0),
    [catalog]
  );

  if (!isOpen) return null;

  return (
    <div className={UI_TOKENS.launcherModal.backdrop} onClick={onClose}>
      <div
        className={UI_TOKENS.launcherModal.container}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enterprise Header */}
        <div className={UI_TOKENS.launcherModal.header}>
          <div className={UI_TOKENS.launcherModal.headerLeft}>
            <div className={UI_TOKENS.launcherModal.headerIconBox}>
              <Zap className={UI_TOKENS.launcherModal.headerIcon} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={UI_TOKENS.launcherModal.headerTitle}>
                  All Modules & Workflows
                </h2>
                <span className={UI_TOKENS.launcherModal.headerCountBadge}>
                  {totalAvailableProcesses} Workflows
                </span>
              </div>
              <p className={UI_TOKENS.launcherModal.headerSubtitle}>
                Select any operational module to launch into dedicated workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={UI_TOKENS.launcherModal.closeButton}
            title="Close launcher (Esc)"
          >
            <span className={UI_TOKENS.launcherModal.escBadge}>ESC</span>
            <X className={UI_TOKENS.launcherModal.closeIcon} />
          </button>
        </div>

        {/* Unified Search Bar */}
        <div className={UI_TOKENS.launcherModal.searchBar}>
          <div className={UI_TOKENS.launcherModal.searchWrapper}>
            <Search className={UI_TOKENS.launcherModal.searchIcon} />
            <input
              type="text"
              autoFocus
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search workflows, POs, cutting, fabric rolls, styles..."
              className={UI_TOKENS.launcherModal.searchInput}
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Domain Filter Icon Tabs Bar (Strict 1-line tabs with sleek More dropdown popover) */}
        <div className={UI_TOKENS.launcherModal.domainTabsBar}>
          {(() => {
            // With compact "All" label, Row 1 comfortably fits "All" + 5 primary domains + "More" button without overflow
            const primaryCount = 5;
            const primaryDomains = catalog.slice(0, primaryCount);
            const secondaryDomains = catalog.slice(primaryCount);
            const hasSecondary = secondaryDomains.length > 0;
            const activeSecondaryMod = secondaryDomains.find((m) => m.id === activeTab);

            return (
              <div className="flex flex-col gap-2">
                {/* Row 1: All + Primary 5 Domains + More / Less Toggle Button */}
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {/* All Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`${UI_TOKENS.launcherModal.domainTab} ${
                      activeTab === "all"
                        ? UI_TOKENS.launcherModal.domainTabActive
                        : UI_TOKENS.launcherModal.domainTabInactive
                    }`}
                    title="All Domains"
                  >
                    <span
                      className={`${UI_TOKENS.launcherModal.domainTabIconBox} ${
                        activeTab === "all"
                          ? UI_TOKENS.launcherModal.domainTabIconBoxActive
                          : UI_TOKENS.launcherModal.domainTabIconBoxInactive
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </span>
                    <span>All</span>
                    <span
                      className={`${UI_TOKENS.launcherModal.domainTabBadge} ${
                        activeTab === "all"
                          ? UI_TOKENS.launcherModal.domainTabBadgeActive
                          : UI_TOKENS.launcherModal.domainTabBadgeInactive
                      }`}
                    >
                      {catalog.length}
                    </span>
                  </button>

                  {/* Primary Domain Filter Tabs (Dynamic from Centralized Catalog) */}
                  {primaryDomains.map((mod) => {
                    const ModIcon = ICON_MAP[mod.icon] || Boxes;
                    const label = `${parseInt(mod.step, 10)}. ${mod.title}`;
                    const isActive = activeTab === mod.id;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => setActiveTab(mod.id)}
                        className={`${UI_TOKENS.launcherModal.domainTab} ${
                          isActive
                            ? UI_TOKENS.launcherModal.domainTabActive
                            : UI_TOKENS.launcherModal.domainTabInactive
                        }`}
                        title={mod.title}
                      >
                        <span
                          className={`${UI_TOKENS.launcherModal.domainTabIconBox} ${
                            isActive
                              ? UI_TOKENS.launcherModal.domainTabIconBoxActive
                              : UI_TOKENS.launcherModal.domainTabIconBoxInactive
                          }`}
                        >
                          <ModIcon className="w-3.5 h-3.5" />
                        </span>
                        <span>{label}</span>
                        <span
                          className={`${UI_TOKENS.launcherModal.domainTabBadge} ${
                            isActive
                              ? UI_TOKENS.launcherModal.domainTabBadgeActive
                              : UI_TOKENS.launcherModal.domainTabBadgeInactive
                          }`}
                        >
                          {mod.submodules.length}
                        </span>
                      </button>
                    );
                  })}

                  {/* More / Less Toggle Button right next to last item with proper gap */}
                  {hasSecondary && (
                    <button
                      type="button"
                      onClick={() => setIsMoreOpen(!isMoreOpen)}
                      className={`${UI_TOKENS.launcherModal.domainTabMoreBtn} shrink-0 ${
                        isMoreOpen || activeSecondaryMod
                          ? UI_TOKENS.launcherModal.domainTabMoreBtnActive
                          : ""
                      }`}
                      title={
                        isMoreOpen
                          ? "Hide additional domains"
                          : `Show ${secondaryDomains.length} more domains`
                      }
                    >
                      <span>
                        {isMoreOpen ? "Less" : `More (${secondaryDomains.length})`}
                      </span>
                      {isMoreOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Row 2: Secondary Domains (Visible when expanded or when an active secondary domain is selected) */}
                {hasSecondary && (isMoreOpen || Boolean(activeSecondaryMod)) && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    {secondaryDomains.map((mod) => {
                      const ModIcon = ICON_MAP[mod.icon] || Boxes;
                      const label = `${parseInt(mod.step, 10)}. ${mod.title}`;
                      const isActive = activeTab === mod.id;

                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => setActiveTab(mod.id)}
                          className={`${UI_TOKENS.launcherModal.domainTab} ${
                            isActive
                              ? UI_TOKENS.launcherModal.domainTabActive
                              : UI_TOKENS.launcherModal.domainTabInactive
                          }`}
                          title={mod.title}
                        >
                          <span
                            className={`${UI_TOKENS.launcherModal.domainTabIconBox} ${
                              isActive
                                ? UI_TOKENS.launcherModal.domainTabIconBoxActive
                                : UI_TOKENS.launcherModal.domainTabIconBoxInactive
                            }`}
                          >
                            <ModIcon className="w-3.5 h-3.5" />
                          </span>
                          <span>{label}</span>
                          <span
                            className={`${UI_TOKENS.launcherModal.domainTabBadge} ${
                              isActive
                                ? UI_TOKENS.launcherModal.domainTabBadgeActive
                                : UI_TOKENS.launcherModal.domainTabBadgeInactive
                            }`}
                          >
                            {mod.submodules.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Clean Process Grid (Option A: Dynamics 365 Standard) */}
        <div className={UI_TOKENS.launcherModal.gridContainer}>
          {isLoading && catalog.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <span className="w-7 h-7 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 font-medium">Loading Enterprise Navigation Catalog...</span>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <FolderTree className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No matching workflows found</p>
              <p className="text-slate-400 max-w-sm">
                No active processes matched &quot;{filterQuery}&quot; in the selected domain.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCatalog.map((moduleGroup) => {
                return (
                  <div key={moduleGroup.id} className={UI_TOKENS.launcherModal.sectionWrapper}>
                    {/* Main Module Category Header */}
                    <div className={UI_TOKENS.launcherModal.sectionHeader}>
                      <div className={UI_TOKENS.launcherModal.sectionHeaderLeft}>
                        <span className={UI_TOKENS.launcherModal.sectionStepBadge}>
                          {moduleGroup.step}
                        </span>
                        <h3 className={UI_TOKENS.launcherModal.sectionTitle}>
                          {moduleGroup.title}
                        </h3>
                      </div>
                      <span className={UI_TOKENS.launcherModal.sectionCountBadge}>
                        {moduleGroup.submodules.length}{" "}
                        {moduleGroup.submodules.length === 1 ? "Process" : "Processes"}
                      </span>
                    </div>

                    {/* Clean Submodule Process Cards Grid */}
                    <div className={UI_TOKENS.launcherModal.grid}>
                      {moduleGroup.submodules.map((sub: NavSubmodule) => {
                        const SubIcon = ICON_MAP[sub.icon] || FolderTree;
                        const targetId = sub.target_module_id || sub.id;

                        // Extract all child menu items across clusters
                        const allActionMenus =
                          sub.clusters?.flatMap((c) => c.menus) || [];
                        const previewMenus = allActionMenus.slice(0, 3);
                        const remainingCount = allActionMenus.length - previewMenus.length;

                        // Check if this submodule is actively selected in the current session (only when inside an operational menu)
                        const isSubmoduleActive =
                          hasActiveSidebarMenu &&
                          ((activeSubmoduleGroupId && activeSubmoduleGroupId === sub.id) ||
                            (!activeSubmoduleGroupId &&
                              currentModuleId &&
                              (targetId === currentModuleId ||
                                allActionMenus.some((m) => m.id === currentModuleId || m.path === window.location.pathname))));

                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              onSelectApp(targetId, sub.id);
                              onClose();
                            }}
                            className={
                              isSubmoduleActive
                                ? UI_TOKENS.launcherModal.cardActive
                                : `${UI_TOKENS.launcherModal.card} ${THEME.accentGlow}`
                            }
                          >
                            <div className={UI_TOKENS.launcherModal.cardTop}>
                              <div className={UI_TOKENS.launcherModal.cardTopHeader}>
                                <div
                                  className={
                                    isSubmoduleActive
                                      ? UI_TOKENS.launcherModal.cardIconBoxActive
                                      : `${UI_TOKENS.launcherModal.cardIconBox} ${THEME.iconBox}`
                                  }
                                >
                                  <SubIcon className={UI_TOKENS.launcherModal.cardIcon} />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isSubmoduleActive && (
                                    <span className={UI_TOKENS.launcherModal.cardActiveBadge}>
                                      Active
                                    </span>
                                  )}
                                  <span className={`${UI_TOKENS.launcherModal.cardBadge} ${THEME.tagBorder}`}>
                                    {sub.badge || "Standard"}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4
                                  className={
                                    isSubmoduleActive
                                      ? UI_TOKENS.launcherModal.cardTitleActive
                                      : UI_TOKENS.launcherModal.cardTitle
                                  }
                                >
                                  {sub.name}
                                </h4>
                                <p className={UI_TOKENS.launcherModal.cardDesc}>
                                  {sub.description}
                                </p>
                              </div>

                              {/* Sleek Preview Micro-Badges of Key Features */}
                              {previewMenus.length > 0 && (
                                <div className="pt-2 flex flex-wrap gap-1">
                                  {previewMenus.map((menu) => {
                                    const isMenuActive = currentModuleId === menu.id;
                                    return (
                                      <button
                                        key={menu.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectApp(menu.id, sub.id);
                                          onClose();
                                        }}
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                          isMenuActive
                                            ? "bg-[#0066FF] text-white border-[#0066FF] font-semibold shadow-2xs"
                                            : THEME.chipBg
                                        }`}
                                        title={`Open ${menu.label}`}
                                      >
                                        {menu.label}
                                      </button>
                                    );
                                  })}
                                  {remainingCount > 0 && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100/90 px-1.5 py-0.5 rounded-md border border-slate-200">
                                      +{remainingCount}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div
                              className={
                                isSubmoduleActive
                                  ? UI_TOKENS.launcherModal.cardFooterActive
                                  : UI_TOKENS.launcherModal.cardFooter
                              }
                            >
                              <span
                                className={
                                  isSubmoduleActive
                                    ? UI_TOKENS.launcherModal.cardActionHintActive
                                    : UI_TOKENS.launcherModal.cardActionHint
                                }
                              >
                                <span>{isSubmoduleActive ? "Current Workspace" : "Open Workspace"}</span>
                                <ArrowRight
                                  className={
                                    isSubmoduleActive
                                      ? UI_TOKENS.launcherModal.cardArrowActive
                                      : UI_TOKENS.launcherModal.cardArrow
                                  }
                                />
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {allActionMenus.length} {allActionMenus.length === 1 ? "view" : "views"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enterprise Bottom Status Bar */}
        <div className={UI_TOKENS.launcherModal.modalFooter}>
          <div className={UI_TOKENS.launcherModal.footerHint}>
            <span>Navigation shortcut:</span>
            <kbd className={UI_TOKENS.launcherModal.footerKbd}>ESC</kbd>
            <span>to close</span>
            <span className="text-slate-300 mx-1">•</span>
            <kbd className={UI_TOKENS.launcherModal.footerKbd}>Ctrl + K</kbd>
            <span>quick toggle</span>
          </div>
          <div className="text-slate-400 text-[10px] flex items-center gap-2">
            <span>TraceFlow RMG Workspace • Multi-Tenant</span>
            <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border border-slate-200">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
