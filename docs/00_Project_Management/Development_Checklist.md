# RMG TraceFlow ERP — Master Development Checklist & Progress Tracker
**Project:** RMG Woven Garments Traceability Software (TraceFlow RMG)  
**Methodology:** Agile Scrum (12 Modules / 5 Sprints)  
**Standard:** Enterprise Clean Architecture (Laravel 13 API-First + React 19 / Vite + Tailwind v4 + PostgreSQL)  
**Last Updated:** 2026-09-10  
**Current Active Sprint:** Sprint 1 / Sprint 2 Transition  

---

## 📊 High-Level Sprint Progress Overview

| Sprint | Modules Covered | Target Scope | Status | Progress |
| :--- | :--- | :--- | :---: | :---: |
| **Sprint 1** | **Module 01 & 02** | Auth, RBAC, Multi-Company, Buyer, Style, Masters | 🟢 Complete | **100%** |
| **Sprint 2 (Part 1)** | **Module 03** | Purchase Order (PO), 2D Matrix Grid, Excel/PDF Import | 🟢 Complete | **100%** |
| **Sprint 2 (Part 2)** | **Module 04 & 05** | BOM & Planning, Cutting & Bundling | 🟡 Next Up | **0%** |
| **Sprint 3** | **Module 06 & 07** | Value Addition (Print/Emb), Sewing Line Concurrency | ⚪ Planned | **0%** |
| **Sprint 4** | **Module 08, 09, 10** | Quality Control (SVG Body Map), Washing, Carton Packing | ⚪ Planned | **0%** |
| **Sprint 5** | **Module 11 & 12** | Store/Inventory Ledger, Export Commercial & Analytics BI | ⚪ Planned | **0%** |

---

## 📁 SPRINT 1: Foundation, Multi-Tenancy & Master Data

### 1. Module 01: Authentication, RBAC & Core Administration
- [x] **Sanctum API Authentication**:
  - [x] Secure Bearer Token Login & Logout API
  - [x] User Session Expiry Handling & Interceptors
  - [x] Frontend Auth Store (`authStore.ts`) with Token Persistence
- [x] **Role-Based Access Control (Spatie RBAC)**:
  - [x] Seed Roles: `Super_Admin`, `Admin`, `Merchandiser`, `Cutting_Master`, `Line_Supervisor`, `QC_Inspector`, `Store_Manager`
  - [x] Granular Permission Mapping on API Routes
  - [x] Role List & Management UI (`RoleListPage.tsx`)
- [x] **User Management**:
  - [x] User List DataTable (`UserListPage.tsx`)
  - [x] Create / Edit User Form (`UserFormPage.tsx`)
  - [x] Biometric / Manual Employee ID (`emp_id`) standard
- [x] **Multi-Company Management**:
  - [x] Company Directory DataTable (`CompanyListPage.tsx`)
  - [x] Company Create/Edit Form (`CompanyFormPage.tsx`)
  - [x] Platform Owner (`PLT`) Exclusion from Operational Dropdowns
  - [x] Company Short Code Prefix Standard (`AWL`, `SDL`, etc.)

---

### 2. Module 02: Master Data Engine

#### A. Buyers & Buying Agents
- [x] **Buyer Management**:
  - [x] Auto-generated Code Formula: `{CompanyCode}-BYR-{Sequential}`
  - [x] Buyer Directory (`BuyerListPage.tsx`)
  - [x] Dedicated Create / Edit Form (`BuyerFormPage.tsx`)
  - [x] Buyer Details Page (`BuyerDetailsPage.tsx`)
  - [x] Active/Inactive `<Toggle>` Component
- [x] **Buying Agents**:
  - [x] Buying Agent Directory (`AgentListPage.tsx`)
  - [x] Buying Agent Association with Operating Companies

#### B. Central Colors & Size Scales Master Library
- [x] **Central Color Library Master**:
  - [x] Migration: `colors_master` table
  - [x] Controller & API: `ColorMasterController.php`
  - [x] Central color lookup endpoint (`/api/v1/colors/lookup`)
  - [x] Auto Title-Casing & Anti-Garbage Duplicate Prevention
  - [x] Quick Add to Central Master Dialog (`rounded-lg`)
- [x] **Central Size Scales Master**:
  - [x] Migrations: `size_scales` and `size_scale_entries`
  - [x] Controller & API: `SizeScaleController.php`
  - [x] Size Scales Seeder (`SizeScaleSeeder.php` with Standard Men's Alpha, Numeric, Boys scales)
  - [x] Dynamic Size Matrix Builder & Quick Add Dialog

#### C. Woven Style Library
- [x] **Backend Architecture & Validation**:
  - [x] Intelligent Sequential Code: `{CompanyCode}-STY-{YY}-{Sequential}` (e.g. `SDL-STY-26-0001`)
  - [x] `next-code` API endpoint for real-time form preview
  - [x] Multi-Wash Types support (JSON array column in Postgres)
  - [x] Optional Tech-Pack Upload API (PDF, Excel, Images up to 25 MB)
  - [x] Dedicated CORS-enabled document streaming endpoint: `GET /api/v1/styles/stream-techpack/{filename}`
  - [x] Diverse Dummy Styles Seeder (`StyleSeeder.php` with 5 woven garments styles)
- [x] **Frontend Golden Layouts & UI UX**:
  - [x] Style Directory (`StyleListPage.tsx`) with 3-tier layout & FilterToolbar
  - [x] Dedicated Style Create/Edit Form (`StyleFormPage.tsx`) with 2/3 and 1/3 layout
  - [x] Colorways Dynamic Repeater with autocomplete & hex picker
  - [x] Size Scale Selector with automatic size breakdown preview
  - [x] Dedicated Style Details Page (`StyleDetailsPage.tsx`)
- [x] **In-App Tech-Pack Quick Inspector Modal**:
  - [x] Reusable `<TechPackPreviewModal>` component (`rounded-lg` Non-CRUD dialog)
  - [x] Client-side HTML5 Canvas rendering via PDF.js (defeats IDM interception)
  - [x] Responsive Page Navigation (`Page X of Y`), Zoom In/Out, 90° Rotation
  - [x] Top-scrolling flex container preventing header crop on zoom
  - [x] Instant reactive callback ref (`ref={setCanvasNode}`) for auto first-load paint

---

## 🚀 SPRINT 2: Order Management, Planning & Cutting (Upcoming)

### 3. Module 03: Purchase Order (PO) & Dual-Mode Breakdown Engine
- [x] **Documentation & Architecture Standards (SRS & SOP)**:
  - [x] Comprehensive SRS: [`SRS_Purchase_Order_Management_and_Import.md`](../01_Business_Analyst/SRS_Purchase_Order_Management_and_Import.md)
  - [x] Operational SOP: [`SOP_Purchase_Order_Management_and_Import.md`](../01_Business_Analyst/SOP_Purchase_Order_Management_and_Import.md)
- [x] **PO Master Data Model & PostgreSQL Schema**:
  - [x] Purchase Orders Table (`purchase_orders`): `order_code`, `buyer_po_number`, `company_id`, `buyer_id`, `style_id`, `order_qty`, `unit_price`, `currency`, `order_date`, `ex_factory_date`, `delivery_date`, `shipment_mode`, `po_document_url`, `status`
  - [x] Auto-Generated Internal Order Code Formula: `[CompanyShortCode]-ORD-[YY]-[Sequential]` (e.g. `SDL-ORD-26-0001`)
  - [x] Case-Insensitive Unique Constraint on `(buyer_id, buyer_po_number)`
  - [x] PO Color & Size Breakdown Matrix Table (`po_breakdowns`): `purchase_order_id`, `style_color_id`, `style_size_id`, `order_qty`, `excess_percentage`, `planned_cut_qty`
- [x] **Dual-Entry Backend APIs & Import Engines**:
  - [x] `GET /api/v1/orders` (Filtered list with search, sorting, pagination)
  - [x] `POST /api/v1/orders` (Mode A: Transactional creation with manual matrix array)
  - [x] `GET /api/v1/orders/{id}` (Details with 2D matrix view)
  - [x] `PUT /api/v1/orders/{id}` (Order updates with mathematical validation)
  - [x] `GET /api/v1/orders/next-code` (Auto order code preview)
  - [x] `GET /api/v1/orders/template/{style_id}` (Download pre-filled Excel template for style)
  - [x] `POST /api/v1/orders/upload-document` (Official buyer PO sheet attachment)
  - [x] `POST /api/v1/orders/parse-file` (Mode B: Extract PO Header & Matrix from Excel/PDF with fuzzy mapping)
- [x] **Frontend Golden Layouts & UI Components**:
  - [x] Order Directory (`OrderListPage.tsx` with 3-tier layout & FilterToolbar)
  - [x] Dedicated Order Create/Edit Page (`OrderFormPage.tsx` with 2/3 and 1/3 layout):
    - [x] Mode A: Interactive 2D Matrix Grid (Y: Colors, X: Sizes, live zero-balance check)
    - [x] Mode B: Drag & Drop Dropzone (.xlsx, .pdf), template download, backend parser, verification preview
  - [x] Order Details Page (`OrderDetailsPage.tsx` with matrix summary & attached PO file preview)

### 4. Module 04: Production Planning & BOM (Bill of Materials)
- [ ] Material Consumption & BOM Builder (Fabric & Trims per style/order)
- [ ] Production Routing & Line Allocation (Target SMV, daily line output)

### 5. Module 05: Fabric Inspection, Cutting & Bundling
- [ ] Fabric Roll Inventory & 4-Point System QC Inspection
- [ ] Marker Making & Cut Order Plan
- [ ] Master Bundle QR Generation & Single-Piece Child QR Serialization

---

## 🧵 SPRINT 3: Value Addition & Sewing Line Tracking

### 6. Module 06: Value Added Services (VAS)
- [ ] Print / Embroidery Dispatch & Gatepass Generation
- [ ] External Vendor Tracking & Re-entry QC Inspection

### 7. Module 07: High-Concurrency Sewing Line Tracking
- [ ] Offline-First Tablet PWA with SQLite Local Storage
- [ ] High-Speed Barcode Scanning Engine
- [ ] Redis Queue Worker for Line In & Line Out Concurrency

---

## 🎯 SPRINT 4: Quality Control, Washing & Packing

### 8. Module 08: Digital Quality Control (QC)
- [ ] Interactive SVG Garment Body Map for Defect Pinpointing
- [ ] Real-time DHU (Defects per Hundred Units) Calculations
- [ ] Reverb WebSockets for Factory Alert Broadcasting

### 9. Module 09 & 10: Washing & Carton Packing
- [ ] Wet & Dry Wash Batch Management
- [ ] Barcode Scan-to-Pack Carton Builder
- [ ] Single-Piece to Carton 1-to-Many Mapping

---

## 📦 SPRINT 5: Inventory, Commercial & Executive BI

### 10. Module 11: Inventory, Warehouse & Finished Goods
- [ ] Double-Entry Stock Movement Ledger
- [ ] Warehouse Bin & Rack Location Tracking

### 11. Module 12: Export Commercial & Executive Analytics
- [ ] Container Stuffing & Commercial Invoice Generation
- [ ] Executive BI Real-time Analytics Dashboard
