import React, { useState } from "react";
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
} from "lucide-react";
import { UI_TOKENS } from "../../config/designTokens";

import { useAuthStore } from "../../store/authStore";

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (moduleId: string) => void;
  initialSearchQuery?: string;
}

interface SubItemLink {
  id: string;
  name: string;
}

interface AppCard {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  submodules?: SubItemLink[];
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

const APPS_CATALOG: AppCard[] = [
  // 01. System Admin & Auth (Module 01)
  {
    id: "profile",
    name: "User Account & Profile",
    category: "System Administration & Auth",
    description: "Employee biometric punch ID, password reset, and access details",
    icon: ShieldCheck,
    badge: "Core",
    submodules: [
      { id: "profile", name: "My Profile" },
      { id: "profile-password", name: "Change Password" },
    ],
    requiredRoles: ["superadmin", "admin", "standarduser", "merchandiser", "store_manager", "cutting_manager", "floor_supervisor", "qc_auditor", "commercial_manager"],
  },
  {
    id: "admin-users",
    name: "User Directory & RBAC",
    category: "System Administration & Auth",
    description: "Multi-tenant factory operators, role permissions, and user badges",
    icon: KeyRound,
    submodules: [
      { id: "admin-users", name: "User Directory" },
      { id: "admin-roles", name: "Role Matrix" },
    ],
    requiredPermissions: ["system_admin.users.view", "system_admin.roles.view"],
    requiredRoles: ["superadmin", "admin"],
  },

  // 02. Master Governance
  {
    id: "master-companies",
    name: "Companies",
    category: "Master Governance",
    description: "Legal entity profiles, codes, tax IDs and factory setups",
    icon: Building2,
    submodules: [
      { id: "master-companies", name: "Company Profiles" },
      { id: "master-units", name: "Floors & Lines" },
    ],
    requiredPermissions: [
      "system_admin.companies.view",
      "master_data.companies.view",
      "system_admin.*",
    ],
    requiredRoles: ["superadmin", "admin"],
  },
  {
    id: "master-buyers",
    name: "Buyers & Brands",
    category: "Master Governance",
    description: "Global brands, contracts, and commission matrices",
    icon: Users,
    badge: "Active",
    submodules: [
      { id: "master-buyers", name: "Buyer Directory" },
      { id: "master-brands", name: "Brands List" },
    ],
    requiredPermissions: [
      "master_data.buyers.profile.view",
      "master_data.buyers.*",
      "master_data.*",
    ],
    requiredRoles: ["superadmin", "admin", "standarduser", "merchandiser"],
  },
  {
    id: "master-suppliers",
    name: "Suppliers & Mills",
    category: "Master Governance",
    description: "Yarn spinners, fabric mills, and accessory vendors",
    icon: Building2,
    submodules: [
      { id: "master-suppliers", name: "Suppliers" },
      { id: "master-mills", name: "Fabric Mills" },
    ],
    requiredPermissions: [
      "master_data.suppliers.view",
      "suppliers.view",
      "master_data.*",
    ],
    requiredRoles: ["superadmin", "admin", "commercial_manager"],
  },

  // Merchandising
  {
    id: "inquiries",
    name: "Buyer Inquiries",
    category: "Merchandising & Styles",
    description: "Sample proto development and early costing requests",
    icon: Shirt,
    submodules: [
      { id: "inquiries", name: "Sample Requests" },
      { id: "inquiries-costing", name: "Proto Costing" },
    ],
    requiredPermissions: ["merchandising.inquiries.view", "inquiries.view"],
    requiredRoles: ["superadmin", "admin", "merchandiser"],
  },
  {
    id: "styles-costing",
    name: "Styles & BOM Costing",
    category: "Merchandising & Styles",
    description: "Complete bill of materials and pre-costing calculator",
    icon: Shirt,
    badge: "Core",
    submodules: [
      { id: "styles-costing", name: "Style Library" },
      { id: "techpacks", name: "Tech Packs" },
      { id: "bom-calc", name: "BOM Sheets" },
    ],
    requiredPermissions: [
      "master_data.styles.profile.view",
      "merchandising.styles.view",
      "styles.view",
    ],
    requiredRoles: ["superadmin", "admin", "merchandiser"],
  },
  {
    id: "order-pos",
    name: "Customer Purchase Orders",
    category: "Merchandising & Styles",
    description: "Commercial PO line allocation and delivery schedule",
    icon: Shirt,
    submodules: [
      { id: "order-pos", name: "PO Allocation" },
      { id: "order-tracking", name: "Ship Dates" },
    ],
    requiredPermissions: ["merchandising.orders.view", "orders.pos.view"],
    requiredRoles: ["superadmin", "admin", "merchandiser"],
  },

  // Materials & Warehouse
  {
    id: "warehouse-rolls",
    name: "Fabric Roll Inventory",
    category: "Warehouse & Materials",
    description: "QR/Barcode tracked rolls, shade segregation & bins",
    icon: Layers,
    badge: "Core",
    submodules: [
      { id: "warehouse-rolls", name: "Roll Inventory" },
      { id: "shade-lots", name: "Shade & Lots" },
    ],
    requiredPermissions: ["warehouse.rolls.view", "inventory.rolls.view"],
    requiredRoles: ["superadmin", "admin", "store_manager", "fabric_inspector"],
  },
  {
    id: "roll-grn",
    name: "GRN Receiving Desk",
    category: "Warehouse & Materials",
    description: "Physical gate-entry and gate-pass QR reconciliation",
    icon: Layers,
    submodules: [
      { id: "roll-grn", name: "Gate Entry" },
      { id: "grn-scan", name: "Scan & Receive" },
    ],
    requiredPermissions: ["warehouse.grn.view", "inventory.grn.view"],
    requiredRoles: ["superadmin", "admin", "store_manager", "gate_officer"],
  },
  {
    id: "trims-warehouse",
    name: "Trims Store",
    category: "Warehouse & Materials",
    description: "Buttons, zippers, threads, and poly packaging packs",
    icon: Boxes,
    submodules: [
      { id: "trims-warehouse", name: "Accessories" },
      { id: "trims-issuance", name: "Floor Issue" },
    ],
    requiredPermissions: ["warehouse.trims.view", "inventory.trims.view"],
    requiredRoles: ["superadmin", "admin", "store_manager", "trims_incharge"],
  },

  // Manufacturing & Cutting
  {
    id: "cad-markers",
    name: "CAD Marker Planning",
    category: "Shopfloor Manufacturing",
    description: "Marker efficiency ratio, cutting order generation",
    icon: Scissors,
    submodules: [
      { id: "cad-markers", name: "Marker Efficiency" },
      { id: "spreading-tables", name: "Spreading Plies" },
    ],
    requiredPermissions: ["cutting.cad.view", "cutting.markers.view"],
    requiredRoles: ["superadmin", "admin", "cutting_manager", "cad_engineer"],
  },
  {
    id: "cutting-bundles",
    name: "Bundle Tickets Barcoding",
    category: "Shopfloor Manufacturing",
    description: "Sequential ply/size QR cut-bundle tickets generation",
    icon: Scissors,
    badge: "Core",
    submodules: [
      { id: "cutting-bundles", name: "Bundle Tickets" },
      { id: "bundle-dispatch", name: "Sewing Issue" },
    ],
    requiredPermissions: ["cutting.bundles.view"],
    requiredRoles: ["superadmin", "admin", "cutting_manager"],
  },
  {
    id: "sewing-lines",
    name: "Sewing Production Lines",
    category: "Shopfloor Manufacturing",
    description: "Operator WIP tracking and real-time line balancing",
    icon: Scissors,
    submodules: [
      { id: "sewing-lines", name: "Line Loading" },
      { id: "hourly-production", name: "Hourly Output" },
    ],
    requiredPermissions: ["sewing.lines.view", "master_data.lines.setup.view"],
    requiredRoles: [
      "superadmin",
      "admin",
      "floor_supervisor",
      "production_manager",
    ],
  },

  // Quality Control
  {
    id: "qc-inspection",
    name: "4-Point Fabric Inspection",
    category: "Quality Assurance",
    description: "ASTM D5430 compliant roll penalty point audit engine",
    icon: CheckCircle2,
    badge: "Core",
    submodules: [
      { id: "qc-inspection", name: "Fabric 4-Point" },
      { id: "gsm-shade-check", name: "GSM & Width" },
    ],
    requiredPermissions: ["quality.inspections.view", "qc.fabric.view"],
    requiredRoles: ["superadmin", "admin", "qc_auditor", "qc_manager"],
  },
  {
    id: "cutting-qc",
    name: "Cut Panel Quality Audit",
    category: "Quality Assurance",
    description: "Pattern matching, bow/skew defect logging",
    icon: CheckCircle2,
    submodules: [
      { id: "cutting-qc", name: "Pattern Audit" },
      { id: "bundle-defect", name: "Defect Log" },
    ],
    requiredPermissions: ["quality.cutting.view", "qc.panels.view"],
    requiredRoles: ["superadmin", "admin", "qc_auditor", "qc_manager"],
  },
  {
    id: "endline-qc",
    name: "End-Line Traffic QC",
    category: "Quality Assurance",
    description: "Red/Green traffic light DHU defect classification",
    icon: CheckCircle2,
    submodules: [
      { id: "endline-qc", name: "Traffic Lights" },
      { id: "dhu-reports", name: "Line DHU" },
    ],
    requiredPermissions: ["quality.endline.view", "qc.traffic.view"],
    requiredRoles: ["superadmin", "admin", "qc_auditor", "qc_manager"],
  },

  // Packing & Commercial
  {
    id: "finishing-packing",
    name: "Carton Packing & Weighing",
    category: "Finishing & Dispatch",
    description: "Solid/Assorted carton ratio and electronic weighing",
    icon: Boxes,
    submodules: [
      { id: "finishing-packing", name: "Carton Packing" },
      { id: "weight-scale", name: "Digital Scale" },
    ],
    requiredPermissions: ["finishing.packing.view", "commercial.packing.view"],
    requiredRoles: ["superadmin", "admin", "finishing_manager"],
  },
  {
    id: "export-shipment",
    name: "Export Container Dispatch",
    category: "Finishing & Dispatch",
    description: "Customs commercial invoice, packing list, container seals",
    icon: Truck,
    submodules: [
      { id: "export-shipment", name: "Packing List" },
      { id: "container-seals", name: "Container Seal" },
    ],
    requiredPermissions: ["shipping.export.view", "commercial.dispatch.view"],
    requiredRoles: [
      "superadmin",
      "admin",
      "commercial_manager",
      "export_officer",
    ],
  },
];

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  isOpen,
  onClose,
  onSelectApp,
  initialSearchQuery = "",
}) => {
  const { canAccessWidget } = useAuthStore();
  const [filterQuery, setFilterQuery] = useState(initialSearchQuery);

  React.useEffect(() => {
    if (isOpen) {
      setFilterQuery(initialSearchQuery);
    }
  }, [isOpen, initialSearchQuery]);

  React.useEffect(() => {
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

  if (!isOpen) return null;

  // Filter apps strictly by user permission
  const permittedApps = APPS_CATALOG.filter((app) =>
    canAccessWidget(app.requiredPermissions, app.requiredRoles),
  );

  const filteredApps = permittedApps.filter((app) => {
    const query = filterQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesMain =
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query) ||
      app.category.toLowerCase().includes(query);
    const matchesSubmodules = app.submodules?.some((sub) =>
      sub.name.toLowerCase().includes(query),
    );
    return matchesMain || matchesSubmodules;
  });

  return (
    <div className={UI_TOKENS.launcherModal.backdrop} onClick={onClose}>
      <div
        className={UI_TOKENS.launcherModal.container}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Power Automate Style Header */}
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
                  {filteredApps.length} Available
                </span>
              </div>
              <p className={UI_TOKENS.launcherModal.headerSubtitle}>
                Fast Business Process Dispatcher & Navigation
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

        {/* Clean Full-Width Search Input Bar */}
        <div className={UI_TOKENS.launcherModal.searchBar}>
          <div className={UI_TOKENS.launcherModal.searchWrapper}>
            <Search className={UI_TOKENS.launcherModal.searchIcon} />
            <input
              type="text"
              autoFocus
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search module, process, or workflow..."
              className={UI_TOKENS.launcherModal.searchInput}
            />
          </div>
        </div>

        {/* Apps Grid Body - Grouped by Manufacturing Process Sequence */}
        <div className={UI_TOKENS.launcherModal.gridContainer}>
          <div className="space-y-6">
            {[
              {
                id: "auth",
                step: "01",
                category: "System Administration & Auth",
                title: "1. System Admin, Identity & Authentication",
              },
              {
                id: "governance",
                step: "02",
                category: "Master Governance",
                title: "2. Master Governance & System Setup",
              },
              {
                id: "merchandising",
                step: "03",
                category: "Merchandising & Styles",
                title: "3. Merchandising, Costing & Buyer Orders",
              },
              {
                id: "materials",
                step: "04",
                category: "Warehouse & Materials",
                title: "4. Supply Chain, Fabric Rolls & Inventory",
              },
              {
                id: "shopfloor",
                step: "05",
                category: "Shopfloor Manufacturing",
                title: "5. Shopfloor CAD, Cutting & Sewing Lines",
              },
              {
                id: "quality",
                step: "06",
                category: "Quality Assurance",
                title: "6. Quality Control Audits & Compliance",
              },
              {
                id: "shipping",
                step: "07",
                category: "Finishing & Dispatch",
                title: "7. Finishing, Packaging & Commercial Dispatch",
              },
            ].map((moduleGroup) => {
              const groupApps = filteredApps.filter(
                (app) => app.category === moduleGroup.category
              );

              if (groupApps.length === 0) return null;

              return (
                <div key={moduleGroup.id} className={UI_TOKENS.launcherModal.sectionWrapper}>
                  {/* Module Step Header with Serial Number */}
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
                      {groupApps.length} {groupApps.length === 1 ? "Feature" : "Features"}
                    </span>
                  </div>

                  {/* Cards Grid for this Module */}
                  <div className={UI_TOKENS.launcherModal.grid}>
                    {groupApps.map((app) => {
                      const AppIcon = app.icon;
                      return (
                        <div
                          key={app.id}
                          onClick={() => {
                            onSelectApp(app.id);
                            onClose();
                          }}
                          className={UI_TOKENS.launcherModal.card}
                        >
                          <div className={UI_TOKENS.launcherModal.cardTop}>
                            <div className={UI_TOKENS.launcherModal.cardTopHeader}>
                              <div className={UI_TOKENS.launcherModal.cardIconBox}>
                                <AppIcon className={UI_TOKENS.launcherModal.cardIcon} />
                              </div>
                              {app.badge === "Active" && (
                                <span className={UI_TOKENS.launcherModal.cardBadgeActive}>
                                  <span className={UI_TOKENS.launcherModal.cardBadgeActiveDot} />
                                  Active
                                </span>
                              )}
                              {app.badge === "Core" && (
                                <span className={UI_TOKENS.launcherModal.cardBadgeCore}>
                                  Core
                                </span>
                              )}
                              {app.badge &&
                                app.badge !== "Active" &&
                                app.badge !== "Core" && (
                                  <span className={UI_TOKENS.launcherModal.cardBadge}>
                                    {app.badge}
                                  </span>
                                )}
                            </div>
                            <h4 className={UI_TOKENS.launcherModal.cardTitle}>
                              {app.name}
                            </h4>
                            <p className={UI_TOKENS.launcherModal.cardDesc}>
                              {app.description}
                            </p>

                            {/* Submodules List */}
                            {app.submodules && app.submodules.length > 0 && (
                              <div className={UI_TOKENS.launcherModal.cardSubList}>
                                {app.submodules.map((sub) => (
                                  <span
                                    key={sub.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectApp(sub.id);
                                      onClose();
                                    }}
                                    className={UI_TOKENS.launcherModal.cardSubPill}
                                    title={`Open ${sub.name}`}
                                  >
                                    {sub.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={UI_TOKENS.launcherModal.cardFooter}>
                            <span className="truncate">{app.category}</span>
                            <ArrowRight className={UI_TOKENS.launcherModal.cardArrow} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise Bottom Status Bar */}
        <div className={UI_TOKENS.launcherModal.modalFooter}>
          <div className={UI_TOKENS.launcherModal.footerHint}>
            <span>Navigation shortcut:</span>
            <kbd className={UI_TOKENS.launcherModal.footerKbd}>ESC</kbd>
            <span>to close</span>
          </div>
          <div className="text-slate-400 text-[10px] flex items-center gap-2">
            <span>TraceFlow RMG Workspace • Multi-Tenant</span>
            <span className="font-mono text-slate-500 bg-slate-200/70 px-1 py-0.2 rounded text-[9px] font-semibold">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
