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
} from 'lucide-react';
import { UI_TOKENS } from '../../config/designTokens';
import { useAuthStore } from '../../store/authStore';

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
}

/**
 * Authentic Microsoft Power Automate Portal Left Navigation
 * Strictly permission-gated: menus without user permission do not render.
 */
export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentModuleId = 'master-buyers',
  onSelectModule,
  collapsed: externalCollapsed,
  onToggleCollapse,
  activeCategory,
  hideCategories = false,
}) => {
  const { canAccessWidget } = useAuthStore();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleRail = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  // Quick Links Permissions
  const canViewHome = canAccessWidget(
    ['dashboard.view', 'executive.dashboard.view'],
    ['superadmin', 'admin', 'executive', 'management']
  );
  const canViewMasterRecords = canAccessWidget(
    ['master_data.buyers.profile.view'],
    ['superadmin', 'admin', 'standarduser', 'merchandiser']
  );

  const categories: NavCategory[] = [
    {
      id: 'master-data',
      title: 'Master Data',
      icon: Database,
      requiredRoles: ['superadmin', 'admin', 'standarduser', 'merchandiser', 'commercial_manager'],
      items: [
        {
          id: 'org-setup-group',
          label: 'Organization Setup',
          requiredRoles: ['superadmin', 'admin', 'standarduser'],
          subItems: [
            {
              id: 'master-companies',
              label: 'Company Directory',
              requiredPermissions: ['system_admin.companies.profile.view'],
              requiredRoles: ['superadmin', 'admin'],
            },
            {
              id: 'master-units',
              label: 'Factory Floors & Lines',
              requiredPermissions: ['master_data.lines.setup.view'],
              requiredRoles: ['superadmin', 'admin', 'production_manager', 'floor_supervisor', 'standarduser'],
            },
          ],
        },
        {
          id: 'merchandising-master-group',
          label: 'Merchandising',
          requiredRoles: ['superadmin', 'admin', 'standarduser', 'merchandiser'],
          subItems: [
            {
              id: 'master-buyers',
              label: 'Buyer Directory',
              requiredPermissions: ['master_data.buyers.profile.view'],
              requiredRoles: ['superadmin', 'admin', 'standarduser', 'merchandiser'],
            },
            {
              id: 'master-agents',
              label: 'Buying Agent Directory',
              requiredPermissions: ['master_data.agents.profile.view'],
              requiredRoles: ['superadmin', 'admin', 'standarduser', 'merchandiser'],
            },
            {
              id: 'master-styles',
              label: 'Style Library',
              requiredPermissions: ['master_data.styles.profile.view', 'merchandising.styles.view'],
              requiredRoles: ['superadmin', 'admin', 'standarduser', 'merchandiser'],
            },
          ],
        },
        {
          id: 'sourcing-master-group',
          label: 'Sourcing & Supply',
          requiredRoles: ['superadmin', 'admin', 'commercial_manager'],
          subItems: [
            {
              id: 'master-suppliers',
              label: 'Suppliers Directory',
              requiredPermissions: ['master_data.suppliers.view', 'suppliers.view'],
              requiredRoles: ['superadmin', 'admin', 'commercial_manager'],
            },
          ],
        },
        {
          id: 'identity-master-group',
          label: 'System & Security',
          requiredRoles: ['superadmin', 'admin'],
          subItems: [
            {
              id: 'admin-users',
              label: 'User Directory',
              requiredPermissions: ['system_admin.users.account.view', 'system_admin.users.view'],
              requiredRoles: ['superadmin', 'admin'],
            },
            {
              id: 'admin-roles',
              label: 'Roles & Policy Matrix',
              requiredPermissions: ['system_admin.roles.matrix.view', 'system_admin.roles.view'],
              requiredRoles: ['superadmin', 'admin'],
            },
          ],
        },
      ],
    },
    {
      id: 'merchandising',
      title: 'Merchandising Operations',
      icon: Shirt,
      requiredPermissions: ['merchandising.*'],
      requiredRoles: ['superadmin', 'admin', 'merchandiser'],
      items: [
        {
          id: 'product-dev-group',
          label: 'Product Development',
          requiredRoles: ['superadmin', 'admin', 'merchandiser'],
          subItems: [
            {
              id: 'inquiries',
              label: 'Buyer Inquiries',
              requiredPermissions: ['merchandising.inquiries.view', 'inquiries.view'],
              requiredRoles: ['superadmin', 'admin', 'merchandiser'],
            },
            {
              id: 'styles-costing',
              label: 'Styles & Costing BOM',
              requiredPermissions: ['merchandising.styles.view', 'styles.view'],
              requiredRoles: ['superadmin', 'admin', 'merchandiser'],
            },
            {
              id: 'techpacks',
              label: 'Tech-Pack Archives',
              requiredPermissions: ['merchandising.techpacks.view', 'techpacks.view'],
              requiredRoles: ['superadmin', 'admin', 'merchandiser', 'cad_engineer'],
            },
          ],
        },
        {
          id: 'commercial-orders',
          label: 'Commercial Orders',
          requiredRoles: ['superadmin', 'admin', 'merchandiser'],
          subItems: [
            {
              id: 'order-pos',
              label: 'Customer Purchase Orders',
              requiredPermissions: ['merchandising.orders.view', 'orders.pos.view'],
              requiredRoles: ['superadmin', 'admin', 'merchandiser'],
            },
          ],
        },
      ],
    },
    {
      id: 'materials',
      title: 'Supply Chain & Inventory',
      icon: Layers,
      requiredPermissions: ['warehouse.*', 'materials.*', 'inventory.*'],
      requiredRoles: ['superadmin', 'admin', 'store_manager', 'fabric_inspector'],
      items: [
        {
          id: 'warehouse-group',
          label: 'Fabric & Store Flows',
          requiredPermissions: ['warehouse.*', 'materials.*', 'inventory.*'],
          requiredRoles: ['superadmin', 'admin', 'store_manager', 'fabric_inspector'],
          subItems: [
            {
              id: 'warehouse-rolls',
              label: 'Fabric Roll Inventory',
              requiredPermissions: ['warehouse.rolls.view', 'inventory.rolls.view'],
              requiredRoles: ['superadmin', 'admin', 'store_manager', 'fabric_inspector'],
            },
            {
              id: 'roll-grn',
              label: 'GRN Receiving & Scanning',
              requiredPermissions: ['warehouse.grn.view', 'inventory.grn.view'],
              requiredRoles: ['superadmin', 'admin', 'store_manager', 'gate_officer'],
            },
            {
              id: 'shade-lots',
              label: 'Shade & Lot Segregation',
              requiredPermissions: ['warehouse.shade_lots.view', 'inventory.shade.view'],
              requiredRoles: ['superadmin', 'admin', 'store_manager', 'lab_technician'],
            },
            {
              id: 'trims-warehouse',
              label: 'Trims & Accessories',
              requiredPermissions: ['warehouse.trims.view', 'inventory.trims.view'],
              requiredRoles: ['superadmin', 'admin', 'store_manager', 'trims_incharge'],
            },
          ],
        },
      ],
    },
    {
      id: 'shopfloor',
      title: 'Manufacturing & Floor',
      icon: Scissors,
      requiredPermissions: ['shopfloor.*', 'cutting.*', 'sewing.*', 'master_data.lines.*'],
      requiredRoles: ['superadmin', 'admin', 'cutting_manager', 'floor_supervisor', 'production_manager'],
      items: [
        {
          id: 'cutting-group',
          label: 'CAD & Cutting Runs',
          requiredPermissions: ['cutting.*', 'shopfloor.cutting.*'],
          requiredRoles: ['superadmin', 'admin', 'cutting_manager'],
          subItems: [
            {
              id: 'cad-markers',
              label: 'Marker Planning & Ratio',
              requiredPermissions: ['cutting.cad.view', 'cutting.markers.view'],
              requiredRoles: ['superadmin', 'admin', 'cutting_manager', 'cad_engineer'],
            },
            {
              id: 'spreading-tables',
              label: 'Spreading & Plies',
              requiredPermissions: ['cutting.spreading.view'],
              requiredRoles: ['superadmin', 'admin', 'cutting_manager'],
            },
            {
              id: 'cutting-bundles',
              label: 'Bundle Tickets & Barcodes',
              requiredPermissions: ['cutting.bundles.view'],
              requiredRoles: ['superadmin', 'admin', 'cutting_manager'],
            },
          ],
        },
        {
          id: 'sewing-group',
          label: 'Sewing Production',
          requiredPermissions: ['sewing.*', 'master_data.lines.setup.view'],
          requiredRoles: ['superadmin', 'admin', 'floor_supervisor', 'production_manager'],
          subItems: [
            {
              id: 'sewing-lines',
              label: 'Line Loading & Flow',
              requiredPermissions: ['sewing.lines.view', 'master_data.lines.setup.view'],
              requiredRoles: ['superadmin', 'admin', 'floor_supervisor', 'production_manager'],
            },
            {
              id: 'hourly-production',
              label: 'Hourly Output Tracking',
              requiredPermissions: ['sewing.tracking.view', 'sewing.hourly.view'],
              requiredRoles: ['superadmin', 'admin', 'floor_supervisor', 'production_manager'],
            },
          ],
        },
      ],
    },
    {
      id: 'quality',
      title: 'Quality & Compliance',
      icon: CheckCircle2,
      requiredPermissions: ['quality.*', 'qc.*'],
      requiredRoles: ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
      items: [
        {
          id: 'qc-group',
          label: 'Quality Control Audits',
          requiredPermissions: ['quality.*', 'qc.*'],
          requiredRoles: ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
          subItems: [
            {
              id: 'qc-inspection',
              label: '4-Point Fabric Inspection',
              requiredPermissions: ['quality.inspections.view', 'qc.fabric.view'],
              requiredRoles: ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
            },
            {
              id: 'cutting-qc',
              label: 'Cut Panel Audit',
              requiredPermissions: ['quality.cutting.view', 'qc.panels.view'],
              requiredRoles: ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
            },
            {
              id: 'endline-qc',
              label: 'End-Line Defect Traffic',
              requiredPermissions: ['quality.endline.view', 'qc.traffic.view'],
              requiredRoles: ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
            },
          ],
        },
      ],
    },
    {
      id: 'shipping',
      title: 'Commercial & Export',
      icon: Truck,
      requiredPermissions: ['shipping.*', 'commercial.*'],
      requiredRoles: ['superadmin', 'admin', 'commercial_manager', 'export_officer'],
      items: [
        {
          id: 'commercial-group',
          label: 'Finishing & Dispatch',
          requiredPermissions: ['shipping.*', 'commercial.*'],
          requiredRoles: ['superadmin', 'admin', 'finishing_manager', 'commercial_manager'],
          subItems: [
            {
              id: 'finishing-packing',
              label: 'Carton Packing & Weighing',
              requiredPermissions: ['finishing.packing.view', 'commercial.packing.view'],
              requiredRoles: ['superadmin', 'admin', 'finishing_manager'],
            },
            {
              id: 'export-shipment',
              label: 'Commercial Dispatch',
              requiredPermissions: ['shipping.export.view', 'commercial.dispatch.view'],
              requiredRoles: ['superadmin', 'admin', 'commercial_manager', 'export_officer'],
            },
          ],
        },
      ],
    },
  ];

  // Strictly filter categories, items, and submenus by permission
  const visibleCategories = hideCategories
    ? []
    : categories
        .filter((cat) => {
          if (!activeCategory) return true;
          return cat.id === activeCategory;
        })
        .map((cat) => {
      // If category has category-level restriction and user lacks access, hide
      if (!canAccessWidget(cat.requiredPermissions, cat.requiredRoles)) {
        return null;
      }

      // Filter items within category
      const visibleItems = cat.items
        .map((item) => {
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

  // Helper to find which category and parent contain the current module
  const findActiveCategoryAndParent = (modId: string) => {
    for (const cat of visibleCategories) {
      for (const item of cat.items) {
        if (item.id === modId) {
          return { catId: cat.id, parentId: null };
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
    return { catId: 'master-data', parentId: 'org-setup-group' };
  };

  const initialActive = findActiveCategoryAndParent(currentModuleId);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    [initialActive.catId]: true,
  });

  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    ...(initialActive.parentId ? { [initialActive.parentId]: true } : {}),
  });

  // Automatically keep current module's category open when route changes
  React.useEffect(() => {
    const active = findActiveCategoryAndParent(currentModuleId);
    if (active.catId) {
      setOpenCategories((prev) => ({
        ...prev,
        [active.catId]: true,
      }));
    }
    if (active.parentId) {
      setExpandedParents((prev) => ({
        ...prev,
        [active.parentId!]: true,
      }));
    }
  }, [currentModuleId]);

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleParent = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  return (
    <aside
      className={`${UI_TOKENS.powerNav.rail} ${
        collapsed ? UI_TOKENS.powerNav.railCollapsed : UI_TOKENS.powerNav.railOpen
      }`}
    >
      {/* Navigation Groups Container */}
      <div className={UI_TOKENS.powerNav.itemsContainer}>
        {/* Core Quick Links (Power Automate Style) */}
        {!collapsed && (canViewHome || canViewMasterRecords) && (
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
