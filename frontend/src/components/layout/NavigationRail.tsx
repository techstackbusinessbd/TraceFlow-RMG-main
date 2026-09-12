import React, { useState } from 'react';
import {
  Home,
  FolderOpen,
  Layers,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Shirt,
  Scissors,
  CheckCircle2,
  Truck,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { UI_TOKENS } from '../../config/designTokens';
import { useAuthStore } from '../../store/authStore';

import { navigationService, type NavModule } from '../../services/navigationService';
import {
  Calendar,
  BarChart3,
  Boxes,
  FolderTree,
} from 'lucide-react';

export interface SubMenuItem {
  id: string;
  label: string;
  badge?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export interface NavItem {
  id: string;
  label: string;
  badge?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  subItems?: SubMenuItem[];
}

export interface NavCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  items: NavItem[];
}

interface NavigationRailProps {
  currentModuleId?: string;
  onSelectModule?: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  activeCategory?: string | null;
  hideCategories?: boolean;
  activeSubmoduleGroup?: string | null;
  onClearSubmoduleGroup?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Database,
  Shirt,
  Calendar,
  Scissors,
  Boxes,
  CheckCircle2,
  Layers,
  Truck,
  FolderTree,
  BarChart3,
};

/**
 * Authentic Microsoft Power Automate Portal Left Navigation
 * 100% Dynamic from Centralized Single Source of Truth (`/api/v1/navigation/catalog`)
 */
export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentModuleId = 'master-buyers',
  onSelectModule,
  collapsed: externalCollapsed,
  onToggleCollapse,
  activeCategory,
  hideCategories = false,
  activeSubmoduleGroup,
  onClearSubmoduleGroup,
}) => {
  const { canAccessWidget } = useAuthStore();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleRail = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const [catalog, setCatalog] = useState<NavModule[]>(() => navigationService.getImmediateCatalog());

  // Load centralized navigation catalog from backend single source of truth
  React.useEffect(() => {
    navigationService.getCatalog(false).then((data) => {
      if (data && data.length > 0) {
        setCatalog(data);
      }
    });
  }, []);

  // Quick Links Permissions
  const canViewHome = canAccessWidget(
    ['dashboard.view', 'executive.dashboard.view'],
    ['superadmin', 'admin', 'executive', 'management']
  );
  const canViewMasterRecords = canAccessWidget(
    ['master_data.buyers.profile.view'],
    ['superadmin', 'admin', 'standarduser', 'merchandiser']
  );

  // Convert centralized dynamic catalog into NavCategory structure
  const categories: NavCategory[] = React.useMemo(() => {
    return catalog.map((mod) => ({
      id: mod.id,
      title: mod.title,
      icon: ICON_MAP[mod.icon] || FolderOpen,
      items: mod.submodules.map((sub) => ({
        id: sub.id,
        label: sub.name,
        badge: sub.badge,
        subItems: (sub.clusters?.flatMap((c) => c.menus) || []).map((m) => ({
          id: m.id,
          label: m.label,
          path: m.path,
          requiredPermissions: m.required_permissions,
          requiredRoles: m.required_roles,
        })),
      })),
    }));
  }, [catalog]);

  // Strictly filter categories, items, and submenus by permission, and by activeSubmoduleGroup if focused
  const visibleCategories = hideCategories
    ? []
    : categories
        .map((cat) => {
          // If category has category-level restriction and user lacks access, hide
          if (!canAccessWidget(cat.requiredPermissions, cat.requiredRoles)) {
            return null;
          }

          // If activeSubmoduleGroup is active, check if this category contains that submodule group
          if (activeSubmoduleGroup) {
            const hasFocusedGroup = cat.items.some((item) => item.id === activeSubmoduleGroup);
            if (!hasFocusedGroup) return null;
          }

          // Map and filter items within category strictly by user permission
          const visibleItems = cat.items
            .map((item) => {
              // If activeSubmoduleGroup is active, show ONLY this active submodule item and its submenus
              if (activeSubmoduleGroup && item.id !== activeSubmoduleGroup) {
                return null;
              }

              // If item has subItems, filter subItems
              if (item.subItems && item.subItems.length > 0) {
                const visibleSubItems = item.subItems.filter((sub) =>
                  canAccessWidget(sub.requiredPermissions, sub.requiredRoles)
                );
                // If none of the subItems are accessible, hide parent item
                if (visibleSubItems.length === 0) return null;
                return {
                  ...item,
                  subItems: visibleSubItems,
                };
              }

              // Single item without subItems
              const isItemPermitted = canAccessWidget(item.requiredPermissions, item.requiredRoles);
              return isItemPermitted ? item : null;
            })
            .filter(Boolean) as NavItem[];

          // If category has no visible items left, hide entire category
          if (visibleItems.length === 0) return null;

          return {
            ...cat,
            items: visibleItems,
          };
        })
        .filter(Boolean) as NavCategory[];

  // Helper to find which category and parent contain the current module or active submodule group
  const findActiveCategoryAndParent = (modId: string, activeGroup?: string | null) => {
    for (const cat of visibleCategories) {
      for (const item of cat.items) {
        if (activeGroup && item.id === activeGroup) {
          return { catId: cat.id, parentId: item.id };
        }
        if (item.id === modId) {
          return { catId: cat.id, parentId: item.subItems && item.subItems.length > 0 ? item.id : null };
        }
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (sub.id === modId) {
              return { catId: cat.id, parentId: item.id };
            }
          }
        }
      }
    }
    if (visibleCategories.length > 0) {
      return { catId: visibleCategories[0].id, parentId: visibleCategories[0].items[0]?.id || null };
    }
    return { catId: 'master-data', parentId: 'org-setup-group' };
  };

  const initialActive = findActiveCategoryAndParent(currentModuleId, activeSubmoduleGroup);

  // Smart Accordion Rail: The active module's category & parent group are expanded by default.
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const defaultOpen: Record<string, boolean> = {};
    if (initialActive.catId) {
      defaultOpen[initialActive.catId] = true;
    }
    return defaultOpen;
  });

  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(() => {
    const defaultParents: Record<string, boolean> = {};
    if (initialActive.parentId) {
      defaultParents[initialActive.parentId] = true;
    }
    return defaultParents;
  });

  // Ensure active category, active parent group, or App Launcher selected submodule group remain visible & expanded
  React.useEffect(() => {
    if (visibleCategories.length === 0) return;

    const active = findActiveCategoryAndParent(currentModuleId, activeSubmoduleGroup);
    if (active.catId) {
      setOpenCategories((prev) => ({ ...prev, [active.catId!]: true }));
    }
    if (active.parentId) {
      setExpandedParents((prev) => ({ ...prev, [active.parentId!]: true }));
    }

    if (activeSubmoduleGroup) {
      setExpandedParents((prev) => ({ ...prev, [activeSubmoduleGroup]: true }));
      // Also ensure category containing this submodule group is open
      const parentCat = visibleCategories.find((cat) =>
        cat.items.some((item) => item.id === activeSubmoduleGroup)
      );
      if (parentCat) {
        setOpenCategories((prev) => ({ ...prev, [parentCat.id]: true }));
      }
    }
  }, [currentModuleId, activeSubmoduleGroup, visibleCategories]);

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const toggleParent = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  return (
    <aside
      className={`${UI_TOKENS.powerNav.rail} ${
        collapsed ? UI_TOKENS.powerNav.railCollapsed : UI_TOKENS.powerNav.railOpen
      }`}
    >
      {/* Navigation Groups Container */}
      <div className={UI_TOKENS.powerNav.itemsContainer}>
        {/* Core Quick Links (Power Automate Style) - Hidden when active submodule is isolated */}
        {!collapsed && !activeSubmoduleGroup && (canViewHome || canViewMasterRecords) && (
          <div className={UI_TOKENS.powerNav.quickSection}>
            {canViewHome && (
              <button
                type="button"
                onClick={() => onSelectModule?.('dashboard')}
                className={`${UI_TOKENS.powerNav.item} ${
                  currentModuleId === 'dashboard'
                    ? UI_TOKENS.powerNav.itemActive
                    : UI_TOKENS.powerNav.itemInactive
                }`}
              >
                <Home className={UI_TOKENS.powerNav.iconSmSlate} />
                <span>Home</span>
              </button>
            )}
            {canViewMasterRecords && activeCategory !== 'profile' && activeCategory !== 'auth' && (
              <button
                type="button"
                onClick={() => onSelectModule?.('master-buyers')}
                className={`${UI_TOKENS.powerNav.item} ${
                  currentModuleId === 'master-buyers'
                    ? UI_TOKENS.powerNav.itemActive
                    : UI_TOKENS.powerNav.itemInactive
                }`}
              >
                <FolderOpen className={UI_TOKENS.powerNav.iconSmBlue} />
                <span>Master Records</span>
              </button>
            )}
          </div>
        )}

        {/* Focused Submodule Group Indicator (if selected from App Launcher) */}
        {!collapsed && activeSubmoduleGroup && (
          <div className={UI_TOKENS.powerNav.focusBanner}>
            <span className={UI_TOKENS.powerNav.focusBannerText}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span>Filtered Submodule</span>
            </span>
            {onClearSubmoduleGroup && (
              <button
                type="button"
                onClick={onClearSubmoduleGroup}
                className={UI_TOKENS.powerNav.focusBannerClearBtn}
                title="Show all submodules of this module"
              >
                Show All
              </button>
            )}
          </div>
        )}

        {/* Dynamic Business Domain Categories */}
        {visibleCategories.map((cat) => {
          const CatIcon = cat.icon;
          const isOpen = openCategories[cat.id] ?? false;

          if (collapsed) {
            return (
              <div key={cat.id} className={UI_TOKENS.powerNav.collapsedCategoryWrapper}>
                <button
                  type="button"
                  title={cat.title}
                  onClick={toggleRail}
                  className={UI_TOKENS.powerNav.collapsedCategoryButton}
                >
                  <CatIcon className={UI_TOKENS.powerNav.iconMd} />
                </button>
              </div>
            );
          }

          return (
            <div key={cat.id} className={UI_TOKENS.powerNav.categoryGroup}>
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(cat.id)}
                className={UI_TOKENS.powerNav.categoryHeader}
              >
                <div className={UI_TOKENS.powerNav.categoryHeaderLeft}>
                  <CatIcon className={UI_TOKENS.powerNav.categoryHeaderIcon} />
                  <span className={UI_TOKENS.powerNav.subItemText}>{cat.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className={UI_TOKENS.powerNav.categoryHeaderChevron} />
                ) : (
                  <ChevronRight className={UI_TOKENS.powerNav.categoryHeaderChevron} />
                )}
              </div>

              {/* Items List when Category is Open */}
              {isOpen && (
                <div className={UI_TOKENS.powerNav.categoryItemsList}>
                  {cat.items.map((item) => {
                    const hasSub = item.subItems && item.subItems.length > 0;
                    const isParentExpanded = expandedParents[item.id] ?? false;
                    const isActiveDirect = currentModuleId === item.id;
                    const isChildActive = item.subItems?.some(s => s.id === currentModuleId);

                    return (
                      <div key={item.id} className={UI_TOKENS.powerNav.categoryGroup}>
                        <button
                          type="button"
                          onClick={(e) => {
                            if (hasSub) {
                              toggleParent(item.id, e);
                            } else {
                              onSelectModule?.(item.id);
                            }
                          }}
                          className={`${UI_TOKENS.powerNav.item} ${
                            isActiveDirect || isChildActive
                              ? UI_TOKENS.powerNav.itemActive
                              : UI_TOKENS.powerNav.itemInactive
                          }`}
                        >
                          <span className={UI_TOKENS.powerNav.itemText}>{item.label}</span>
                          {hasSub && (
                            <span className={isActiveDirect || isChildActive ? UI_TOKENS.powerNav.chevronWrapperActive : UI_TOKENS.powerNav.chevronWrapperInactive}>
                              {isParentExpanded ? (
                                <ChevronDown className={UI_TOKENS.powerNav.chevronSm} />
                              ) : (
                                <ChevronRight className={UI_TOKENS.powerNav.chevronSm} />
                              )}
                            </span>
                          )}
                        </button>

                        {/* Sub-items */}
                        {hasSub && isParentExpanded && (
                          <div className={UI_TOKENS.powerNav.subItemContainer}>
                            {item.subItems!.map((sub) => {
                              const isSubActive = currentModuleId === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => onSelectModule?.(sub.id)}
                                  className={`${UI_TOKENS.powerNav.subItem} ${
                                    isSubActive
                                      ? UI_TOKENS.powerNav.subItemActive
                                      : UI_TOKENS.powerNav.subItemInactive
                                  }`}
                                >
                                  <span className={isSubActive ? UI_TOKENS.powerNav.subItemDotActive : UI_TOKENS.powerNav.subItemDotInactive} />
                                  <span className={UI_TOKENS.powerNav.subItemText}>{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Rail Collapse Toggle */}
      <div className={UI_TOKENS.powerNav.footer}>
        <button
          type="button"
          onClick={toggleRail}
          className={UI_TOKENS.powerNav.toggleButton}
          title={collapsed ? "Expand Navigation" : "Collapse to Slim Rail"}
        >
          {collapsed ? (
            <PanelLeftOpen className={UI_TOKENS.powerNav.iconSmBlue} />
          ) : (
            <div className={UI_TOKENS.powerNav.toggleContent}>
              <PanelLeftClose className={UI_TOKENS.powerNav.categoryHeaderIcon} />
              <span className={UI_TOKENS.powerNav.toggleText}>Collapse menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
