<?php

return [

    /*
    |--------------------------------------------------------------------------
    | TraceFlow RMG — Centralized 12 Business Domains & Navigation Catalog
    | (Single Source of Truth)
    |--------------------------------------------------------------------------
    | Governs the 12 core domains matching official BRD & Master Feature Details:
    | Domain 01: System Admin & User Management
    | Domain 02: Master Data (Global Library)
    | Domain 03: Order Management (Merchandising)
    | Domain 04: IE & Production Planning
    | Domain 05: Cutting & Bundle Ticket Generation
    | Domain 06: Value Addition (Print & Embroidery)
    | Domain 07: Sewing & Line Tracking
    | Domain 08: Quality Control (QC & Compliance)
    | Domain 09: Washing & Finishing
    | Domain 10: Packing & Shipment
    | Domain 11: Fabric & Accessories Store
    | Domain 12: BI & Analytics Dashboard
    */

    'modules' => [
        // 01. System Admin & User Management
        [
            'id' => 'system-admin',
            'step' => '01',
            'title' => 'System Admin',
            'icon' => 'ShieldCheck',
            'submodules' => [
                [
                    'id' => 'user-profile-group',
                    'name' => 'User Account & Profile',
                    'description' => 'Employee biometric punch ID, password reset, and access details',
                    'icon' => 'ShieldCheck',
                    'badge' => 'Core',
                    'target_module_id' => 'profile',
                    'clusters' => [
                        [
                            'id' => 'account-credentials',
                            'title' => 'Account Credentials',
                            'menus' => [
                                [
                                    'id' => 'profile',
                                    'label' => 'My Profile',
                                    'path' => '/profile',
                                    'required_roles' => ['superadmin', 'admin', 'standarduser', 'merchandiser', 'store_manager', 'cutting_manager', 'floor_supervisor', 'qc_auditor', 'commercial_manager'],
                                ],
                                [
                                    'id' => 'profile-password',
                                    'label' => 'Change Password',
                                    'path' => '/profile#password',
                                    'required_roles' => ['superadmin', 'admin', 'standarduser', 'merchandiser', 'store_manager', 'cutting_manager', 'floor_supervisor', 'qc_auditor', 'commercial_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'id' => 'user-directory-group',
                    'name' => 'User Directory & RBAC',
                    'description' => 'Multi-tenant factory operators, role permissions, and user badges',
                    'icon' => 'KeyRound',
                    'badge' => 'Core',
                    'target_module_id' => 'admin-users',
                    'clusters' => [
                        [
                            'id' => 'access-control',
                            'title' => 'Access Control & Directory',
                            'menus' => [
                                [
                                    'id' => 'admin-users',
                                    'label' => 'User Directory',
                                    'path' => '/users',
                                    'required_permissions' => ['system_admin.users.account.view', 'system_admin.users.view'],
                                    'required_roles' => ['superadmin', 'admin'],
                                ],
                                [
                                    'id' => 'admin-roles',
                                    'label' => 'Role Matrix',
                                    'path' => '/roles',
                                    'required_permissions' => ['system_admin.roles.matrix.view', 'system_admin.roles.view'],
                                    'required_roles' => ['superadmin', 'admin'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 02. Master Data (Global Library)
        [
            'id' => 'master-data',
            'step' => '02',
            'title' => 'Master Data',
            'icon' => 'Database',
            'submodules' => [
                [
                    'id' => 'org-setup-group',
                    'name' => 'Organization Setup',
                    'description' => 'Legal entity profiles, factory floor units and sewing lines',
                    'icon' => 'Building2',
                    'badge' => 'Master',
                    'target_module_id' => 'master-companies',
                    'clusters' => [
                        [
                            'id' => 'legal-factory',
                            'title' => 'Legal Units & Infrastructure',
                            'menus' => [
                                [
                                    'id' => 'master-companies',
                                    'label' => 'Company Directory',
                                    'path' => '/companies',
                                    'required_permissions' => ['system_admin.companies.profile.view', 'system_admin.companies.view'],
                                    'required_roles' => ['superadmin', 'admin'],
                                ],
                                [
                                    'id' => 'master-units',
                                    'label' => 'Factory Floors & Line',
                                    'path' => '/master-units',
                                    'required_permissions' => ['master_data.lines.setup.view'],
                                    'required_roles' => ['superadmin', 'admin', 'production_manager', 'floor_supervisor', 'standarduser'],
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'id' => 'merchandising-master-group',
                    'name' => 'Merchandising Master',
                    'description' => 'Global buyers, buying agents, and style garment libraries',
                    'icon' => 'Users',
                    'badge' => 'Master',
                    'target_module_id' => 'master-buyers',
                    'clusters' => [
                        [
                            'id' => 'commercial-partners',
                            'title' => 'Commercial Accounts & Brands',
                            'menus' => [
                                [
                                    'id' => 'master-buyers',
                                    'label' => 'Buyer Directory',
                                    'path' => '/master/buyers',
                                    'required_permissions' => ['master_data.buyers.profile.view', 'master_data.buyers.view'],
                                    'required_roles' => ['superadmin', 'admin', 'standarduser', 'merchandiser'],
                                ],
                                [
                                    'id' => 'master-agents',
                                    'label' => 'Buying Agent Directory',
                                    'path' => '/master/agents',
                                    'required_permissions' => ['master_data.agents.profile.view', 'master_data.agents.view'],
                                    'required_roles' => ['superadmin', 'admin', 'standarduser', 'merchandiser'],
                                ],
                            ],
                        ],
                        [
                            'id' => 'style-repository',
                            'title' => 'Garment Item Repository',
                            'menus' => [
                                [
                                    'id' => 'master-styles',
                                    'label' => 'Style Library',
                                    'path' => '/master/styles',
                                    'required_permissions' => ['master_data.styles.profile.view', 'merchandising.styles.view'],
                                    'required_roles' => ['superadmin', 'admin', 'standarduser', 'merchandiser'],
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'id' => 'sourcing-master-group',
                    'name' => 'Sourcing & Supply Master',
                    'description' => 'Yarn spinners, fabric mills, and accessory vendors',
                    'icon' => 'Truck',
                    'badge' => 'Master',
                    'target_module_id' => 'master-suppliers',
                    'clusters' => [
                        [
                            'id' => 'vendor-management',
                            'title' => 'Vendor & Mill Partners',
                            'menus' => [
                                [
                                    'id' => 'master-suppliers',
                                    'label' => 'Supplier Directory',
                                    'path' => '/master-suppliers',
                                    'required_permissions' => ['master_data.suppliers.view', 'suppliers.view'],
                                    'required_roles' => ['superadmin', 'admin', 'commercial_manager'],
                                ],
                                [
                                    'id' => 'master-mills',
                                    'label' => 'Fabric Mills',
                                    'path' => '/master-mills',
                                    'required_permissions' => ['master_data.suppliers.view'],
                                    'required_roles' => ['superadmin', 'admin', 'commercial_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 03. Order Management (Merchandising)
        [
            'id' => 'merchandising',
            'step' => '03',
            'title' => 'Merchandising',
            'icon' => 'Shirt',
            'submodules' => [
                [
                    'id' => 'product-dev-group',
                    'name' => 'Product Development & BOM',
                    'description' => 'Sample proto development, BOM costing calculator, and Tech-Pack archives',
                    'icon' => 'Shirt',
                    'badge' => 'Core',
                    'target_module_id' => 'styles-costing',
                    'clusters' => [
                        [
                            'id' => 'inquiry-proto',
                            'title' => 'Inquiry & Sampling',
                            'menus' => [
                                [
                                    'id' => 'inquiries',
                                    'label' => 'Buyer Inquiries',
                                    'path' => '/inquiries',
                                    'required_permissions' => ['merchandising.inquiries.view', 'inquiries.view'],
                                    'required_roles' => ['superadmin', 'admin', 'merchandiser'],
                                ],
                            ],
                        ],
                        [
                            'id' => 'bom-costing',
                            'title' => 'Technical Specs & Costing',
                            'menus' => [
                                [
                                    'id' => 'styles-costing',
                                    'label' => 'Styles & Costing BOM',
                                    'path' => '/styles-costing',
                                    'required_permissions' => ['merchandising.styles.view', 'styles.view'],
                                    'required_roles' => ['superadmin', 'admin', 'merchandiser'],
                                ],
                                [
                                    'id' => 'techpacks',
                                    'label' => 'Tech-Pack Archives',
                                    'path' => '/techpacks',
                                    'required_permissions' => ['merchandising.techpacks.view', 'techpacks.view'],
                                    'required_roles' => ['superadmin', 'admin', 'merchandiser', 'cad_engineer'],
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'id' => 'commercial-orders',
                    'name' => 'Customer Purchase Orders',
                    'description' => 'Commercial PO contract allocation, 2D matrix breakdown, and tracking',
                    'icon' => 'Shirt',
                    'badge' => 'Core',
                    'target_module_id' => 'order-pos',
                    'clusters' => [
                        [
                            'id' => 'po-execution',
                            'title' => 'Contract & PO Execution',
                            'menus' => [
                                [
                                    'id' => 'order-pos',
                                    'label' => 'Purchase Order Directory',
                                    'path' => '/orders',
                                    'required_permissions' => ['merchandising.orders.view', 'orders.pos.view', 'orders.order.view'],
                                    'required_roles' => ['superadmin', 'admin', 'merchandiser'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 04. IE & Production Planning
        [
            'id' => 'planning',
            'step' => '04',
            'title' => 'Planning',
            'icon' => 'Calendar',
            'submodules' => [
                [
                    'id' => 'planning-group',
                    'name' => 'Capacity & Line Planning',
                    'description' => 'SMV target setting, line allocation, and material readiness calendar',
                    'icon' => 'Calendar',
                    'badge' => 'Core',
                    'target_module_id' => 'production-plan',
                    'clusters' => [
                        [
                            'id' => 'line-scheduling',
                            'title' => 'Line Allocation & Target',
                            'menus' => [
                                [
                                    'id' => 'production-plan',
                                    'label' => 'Line Allocation Plan',
                                    'path' => '/planning/lines',
                                    'required_permissions' => ['planning.lines.view', 'planning.view'],
                                    'required_roles' => ['superadmin', 'admin', 'production_manager', 'floor_supervisor'],
                                ],
                                [
                                    'id' => 'smv-target',
                                    'label' => 'Daily Target & SMV',
                                    'path' => '/planning/smv',
                                    'required_permissions' => ['planning.smv.view', 'planning.view'],
                                    'required_roles' => ['superadmin', 'admin', 'production_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 05. Cutting & Bundle Ticket Generation
        [
            'id' => 'cutting',
            'step' => '05',
            'title' => 'Cutting',
            'icon' => 'Scissors',
            'submodules' => [
                [
                    'id' => 'cutting-group',
                    'name' => 'CAD & Cutting Runs',
                    'description' => 'Marker efficiency ratio, spreading plies, and sequential cut-bundle tickets',
                    'icon' => 'Scissors',
                    'badge' => 'Core',
                    'target_module_id' => 'cad-markers',
                    'clusters' => [
                        [
                            'id' => 'cad-planning',
                            'title' => 'CAD Planning & Spreading',
                            'menus' => [
                                [
                                    'id' => 'cad-markers',
                                    'label' => 'Marker Planning & Ratio',
                                    'path' => '/cad-markers',
                                    'required_permissions' => ['cutting.cad.view', 'cutting.markers.view'],
                                    'required_roles' => ['superadmin', 'admin', 'cutting_manager', 'cad_engineer'],
                                ],
                                [
                                    'id' => 'spreading-tables',
                                    'label' => 'Spreading & Plies',
                                    'path' => '/spreading-tables',
                                    'required_permissions' => ['cutting.spreading.view'],
                                    'required_roles' => ['superadmin', 'admin', 'cutting_manager'],
                                ],
                            ],
                        ],
                        [
                            'id' => 'bundle-tickets',
                            'title' => 'Barcoded Ticket Generation',
                            'menus' => [
                                [
                                    'id' => 'cutting-bundles',
                                    'label' => 'Bundle Tickets & Barcodes',
                                    'path' => '/cutting-bundles',
                                    'required_permissions' => ['cutting.bundles.view'],
                                    'required_roles' => ['superadmin', 'admin', 'cutting_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 06. Value Addition (Print & Embroidery)
        [
            'id' => 'value-addition',
            'step' => '06',
            'title' => 'Value Addition',
            'icon' => 'Boxes',
            'submodules' => [
                [
                    'id' => 'embellishment-group',
                    'name' => 'Print & Embroidery Dispatch',
                    'description' => 'Challan dispatch scanning, transit variance logging, and receive audit',
                    'icon' => 'Boxes',
                    'badge' => 'Core',
                    'target_module_id' => 'embellishment-challan',
                    'clusters' => [
                        [
                            'id' => 'challan-dispatch',
                            'title' => 'Transit & Gate Control',
                            'menus' => [
                                [
                                    'id' => 'embellishment-challan',
                                    'label' => 'Print/Embroidery Challan',
                                    'path' => '/value-addition/challan',
                                    'required_permissions' => ['value_addition.view'],
                                    'required_roles' => ['superadmin', 'admin', 'cutting_manager', 'store_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 07. Sewing & Line Tracking
        [
            'id' => 'sewing',
            'step' => '07',
            'title' => 'Sewing',
            'icon' => 'Shirt',
            'submodules' => [
                [
                    'id' => 'sewing-group',
                    'name' => 'Sewing Production Lines',
                    'description' => 'Operator WIP tracking, line loading, and real-time hourly output tracking',
                    'icon' => 'Shirt',
                    'badge' => 'Core',
                    'target_module_id' => 'sewing-lines',
                    'clusters' => [
                        [
                            'id' => 'line-operations',
                            'title' => 'Line Loading & Balancing',
                            'menus' => [
                                [
                                    'id' => 'sewing-lines',
                                    'label' => 'Line Loading & Flow',
                                    'path' => '/sewing-lines',
                                    'required_permissions' => ['sewing.lines.view', 'master_data.lines.setup.view'],
                                    'required_roles' => ['superadmin', 'admin', 'floor_supervisor', 'production_manager'],
                                ],
                                [
                                    'id' => 'hourly-production',
                                    'label' => 'Hourly Output Tracking',
                                    'path' => '/hourly-production',
                                    'required_permissions' => ['sewing.tracking.view', 'sewing.hourly.view'],
                                    'required_roles' => ['superadmin', 'admin', 'floor_supervisor', 'production_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 08. Quality Control (QC & Compliance)
        [
            'id' => 'quality',
            'step' => '08',
            'title' => 'Quality & QC',
            'icon' => 'CheckCircle2',
            'submodules' => [
                [
                    'id' => 'qc-group',
                    'name' => 'Quality Control Audits',
                    'description' => '4-point fabric inspection, cut panel pattern audit, and end-line traffic lights',
                    'icon' => 'CheckCircle2',
                    'badge' => 'Core',
                    'target_module_id' => 'qc-inspection',
                    'clusters' => [
                        [
                            'id' => 'raw-material-qc',
                            'title' => 'Fabric & Material Quality',
                            'menus' => [
                                [
                                    'id' => 'qc-inspection',
                                    'label' => '4-Point Fabric Inspection',
                                    'path' => '/qc-inspection',
                                    'required_permissions' => ['quality.inspections.view', 'qc.fabric.view'],
                                    'required_roles' => ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
                                ],
                            ],
                        ],
                        [
                            'id' => 'inline-endline-qc',
                            'title' => 'Cut Panel & End-Line Quality',
                            'menus' => [
                                [
                                    'id' => 'cutting-qc',
                                    'label' => 'Cut Panel Audit',
                                    'path' => '/cutting-qc',
                                    'required_permissions' => ['quality.cutting.view', 'qc.panels.view'],
                                    'required_roles' => ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
                                ],
                                [
                                    'id' => 'endline-qc',
                                    'label' => 'End-Line Defect Traffic',
                                    'path' => '/endline-qc',
                                    'required_permissions' => ['quality.endline.view', 'qc.traffic.view'],
                                    'required_roles' => ['superadmin', 'admin', 'qc_auditor', 'qc_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 09. Washing & Finishing
        [
            'id' => 'washing',
            'step' => '09',
            'title' => 'Washing',
            'icon' => 'Layers',
            'submodules' => [
                [
                    'id' => 'washing-group',
                    'name' => 'Washing & Batch Tracking',
                    'description' => 'Wash recipe batching, machine tracking, and post-wash drying inspections',
                    'icon' => 'Layers',
                    'badge' => 'Core',
                    'target_module_id' => 'wash-batches',
                    'clusters' => [
                        [
                            'id' => 'wash-operations',
                            'title' => 'Wash Lot & Machines',
                            'menus' => [
                                [
                                    'id' => 'wash-batches',
                                    'label' => 'Wash Batch Logs',
                                    'path' => '/washing/batches',
                                    'required_permissions' => ['washing.view'],
                                    'required_roles' => ['superadmin', 'admin', 'washing_manager', 'production_manager'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 10. Packing & Shipment
        [
            'id' => 'packing',
            'step' => '10',
            'title' => 'Packing',
            'icon' => 'Truck',
            'submodules' => [
                [
                    'id' => 'packing-group',
                    'name' => 'Packing & Container Loading',
                    'description' => 'Carton packing ratio, digital scale weighing, and customs container seals',
                    'icon' => 'Truck',
                    'badge' => 'Core',
                    'target_module_id' => 'finishing-packing',
                    'clusters' => [
                        [
                            'id' => 'packaging-weighing',
                            'title' => 'Carton Packing & Scale',
                            'menus' => [
                                [
                                    'id' => 'finishing-packing',
                                    'label' => 'Carton Packing & Weighing',
                                    'path' => '/finishing-packing',
                                    'required_permissions' => ['finishing.packing.view', 'commercial.packing.view'],
                                    'required_roles' => ['superadmin', 'admin', 'finishing_manager'],
                                ],
                                [
                                    'id' => 'export-shipment',
                                    'label' => 'Commercial Dispatch',
                                    'path' => '/export-shipment',
                                    'required_permissions' => ['shipping.export.view', 'commercial.dispatch.view'],
                                    'required_roles' => ['superadmin', 'admin', 'commercial_manager', 'export_officer'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 11. Fabric & Accessories Store
        [
            'id' => 'materials',
            'step' => '11',
            'title' => 'Warehouse',
            'icon' => 'FolderTree',
            'submodules' => [
                [
                    'id' => 'warehouse-group',
                    'name' => 'Fabric & Store Inventory',
                    'description' => 'QR/Barcode tracked rolls, shade segregation bins, and trims warehouse',
                    'icon' => 'FolderTree',
                    'badge' => 'Core',
                    'target_module_id' => 'warehouse-rolls',
                    'clusters' => [
                        [
                            'id' => 'fabric-intake',
                            'title' => 'Fabric Intake & GRN',
                            'menus' => [
                                [
                                    'id' => 'roll-grn',
                                    'label' => 'GRN Receiving & Scanning',
                                    'path' => '/roll-grn',
                                    'required_permissions' => ['warehouse.grn.view', 'inventory.grn.view'],
                                    'required_roles' => ['superadmin', 'admin', 'store_manager', 'gate_officer'],
                                ],
                                [
                                    'id' => 'warehouse-rolls',
                                    'label' => 'Fabric Roll Inventory',
                                    'path' => '/warehouse-rolls',
                                    'required_permissions' => ['warehouse.rolls.view', 'inventory.rolls.view'],
                                    'required_roles' => ['superadmin', 'admin', 'store_manager', 'fabric_inspector'],
                                ],
                                [
                                    'id' => 'shade-lots',
                                    'label' => 'Shade & Lot Segregation',
                                    'path' => '/shade-lots',
                                    'required_permissions' => ['warehouse.shade_lots.view', 'inventory.shade.view'],
                                    'required_roles' => ['superadmin', 'admin', 'store_manager', 'lab_technician'],
                                ],
                                [
                                    'id' => 'trims-warehouse',
                                    'label' => 'Trims & Accessories',
                                    'path' => '/trims-warehouse',
                                    'required_permissions' => ['warehouse.trims.view', 'inventory.trims.view'],
                                    'required_roles' => ['superadmin', 'admin', 'store_manager', 'trims_incharge'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // 12. BI & Analytics Dashboard
        [
            'id' => 'analytics',
            'step' => '12',
            'title' => 'Analytics',
            'icon' => 'BarChart3',
            'submodules' => [
                [
                    'id' => 'analytics-group',
                    'name' => 'BI & Production Analytics',
                    'description' => 'Real-time floor displays, line efficiency DHU, and executive analytics',
                    'icon' => 'BarChart3',
                    'badge' => 'Core',
                    'target_module_id' => 'executive-bi',
                    'clusters' => [
                        [
                            'id' => 'bi-reporting',
                            'title' => 'Live Operations & BI',
                            'menus' => [
                                [
                                    'id' => 'executive-bi',
                                    'label' => 'Executive Analytics',
                                    'path' => '/dashboard',
                                    'required_roles' => ['superadmin', 'admin', 'executive', 'management'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],
];
