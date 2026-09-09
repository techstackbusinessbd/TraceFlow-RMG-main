---
name: rmg_frontend
description: Frontend and UI/UX Engineering skill for RMG Woven Garments Traceability Software. Strictly enforces design tokens, golden layouts, and enterprise UX standards.
---

# RMG Woven Garments Traceability Software
## Frontend Engineering & UI/UX Execution Skill

This skill governs the end-to-end development of all React 19 / Vite / TypeScript web interfaces, mobile/tablet views, and data interactions for the TraceFlow RMG ERP system.

---

## 1. Golden Layout Standards (STRICT & FINAL)

All web pages across the entire application MUST strictly adhere to one of the following three immutable enterprise layouts. Any deviation is strictly prohibited.

### 1.1 Mandatory Golden List Page Standard
Every data list/management page MUST render in `<div className={UI_TOKENS.appLayout.mainContent}>` with a 3-tier structure:
1. **Tier 1: Sleek Header Row (`<PageHeader>`)**:
   - Left: Direct, concise Title (e.g. `User Directory`, `Buyer Directory`) paired with item counter `<Badge variant="neutral">{total} Buyers</Badge>`.
   - Right: Primary (`<Button variant="primary">`) and optional secondary action buttons (`<Button variant="secondary">`).
   - Page-level duplicate breadcrumbs, icon boxes, or verbose descriptions are strictly prohibited.
2. **Tier 2: Unified Filter Toolbar (`<FilterToolbar>`)**:
   - Left: Full-width search input (`UI_TOKENS.input.base` with search icon).
   - Middle: Standard filter selects (`UI_TOKENS.input.select`).
   - Right: Flat primary "Filter" submit button + secondary "Reset" icon button (`RotateCcw`).
   - Bottom subline: Active sort indicator on the left + "Show per page" dropdown (10, 15, 25, 50) on the right.
3. **Tier 3: Standard DataTable Shell (`<DataTable<T>>`)**:
   - Strictly consume `<DataTable<T>>` from `components/common/DataTable.tsx`. Manual `<table>` tags are strictly prohibited.
   - Dynamic typed `ColumnDef<T>[]` with entity codes in mono font, status pills using `<Badge>`, and actions using `<RowActionsMenu>` or `<TableActionButton>`.
   - Built-in pagination footer ("Showing X to Y of Z records", "Page X of Y", Prev/Next buttons).

### 1.2 Mandatory Golden Form Page Standard (Create & Edit)
Every create and edit form page MUST use `<div className={UI_TOKENS.appLayout.mainContent}>` with an exact 2-column enterprise grid:
```tsx
<form noValidate onSubmit={handleSubmit}>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {/* Left 2/3 Main Canvas */}
    <div className="lg:col-span-2 space-y-4">
      <div className={UI_TOKENS.card.base}>
        <div className={UI_TOKENS.card.header}>
          <h2 className={UI_TOKENS.card.title}>Section Title</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Field Name" required error={errors.field}>
            <TextInput ... />
          </FormField>
          {/* Inputs must use standard FormField. NO nested cards or sub-cards allowed! */}
        </div>
      </div>
    </div>

    {/* Right 1/3 Sidebar */}
    <div className="space-y-4">
      <div className={UI_TOKENS.card.base}>
        <div className={UI_TOKENS.card.header}>
          <h2 className={UI_TOKENS.card.title}>Operational Status</h2>
        </div>
        <div className="space-y-3">
          <Toggle
            checked={formData.is_active}
            onChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
            activeText="Active & Operational"
            inactiveText="Inactive / Suspended"
          />
        </div>
      </div>
    </div>
  </div>
</form>
```

### 1.3 Mandatory Golden Details/View Page Standard
Every entity details/view page MUST use `<div className={UI_TOKENS.appLayout.mainContent}>`:
- **Tier 1**: `<PageHeader title={entity.name} badgeCount={entity.code} badgeLabel="Entity Code" actions={<Button variant="secondary">Back</Button><Button variant="primary">Edit</Button>} />`
- **Tier 2 (Left 2/3: `lg:col-span-2 space-y-4`)**: Core entity attributes and specification cards (`UI_TOKENS.card.base`).
- **Tier 3 (Right 1/3: `space-y-4`)**: Status/eligibility card (`UI_TOKENS.card.base`), metrics, and quick statistics.

---

## 2. Mandatory UI Primitives & Design Token Rules

1. **Centralized Tokens Only**:
   - NEVER write arbitrary Tailwind utility classes for buttons, badges, tables, inputs, cards, or action controls.
   - ALWAYS use `UI_TOKENS.*` from `config/designTokens.ts`.
2. **Standard Reusable UI Primitives (`components/common/`)**:
   - `<Button>`: Flat, crisp, solid colors only. Gradient buttons are strictly prohibited.
   - `<Badge>`: Standard variants (`neutral`, `success`, `warning`, `danger`, `info`, `code`).
   - `<FormField>`: Handles field labels, required asterisks (`*`), error messages, and system-auto tags.
   - `<TextInput>`: Standardized input primitive with error states.
   - `<Toggle>`: MANDATORY for all binary Active/Inactive status fields. Radio buttons (`type="radio"`) or raw checkboxes for active/inactive status are STRICTLY PROHIBITED.
   - `<DataTable>`: Fixed table shell with integrated pagination and sort handling.
   - `<FilterToolbar>`: Unified search and filter container.
   - `<PageHeader>`: Standardized header row with title, badge count, and action buttons.
3. **No Nested Cards**:
   - Placing custom styled cards, shaded boxes, or borders inside another card is strictly prohibited. Keep form layouts clean, flat, and organized using 2-column `<FormField>` grids.
4. **Strict Entity Naming Standard: "Company"**:
   - In all labels, headings, dropdowns, and microcopy, ALWAYS use the clean term **"Company"** or **"Company *"**. Phrases like "Sister Company", "Affiliated Unit", etc. are strictly prohibited.
5. **System-Wide Uniform Naming, PageHeader, and Action Consistency Standard**:
   - All directory views across the entire ERP MUST be suffixed with **"Directory"** (e.g. `User Directory`, `Company Directory`, `Buyer Directory`, `Buying Agent Directory`, `Supplier Directory`).
   - The Sidebar Navigation Rail, Top Pinned Breadcrumb, and `<PageHeader>` Title MUST use the exact same directory name without discrepancies.
   - PageHeader Counter Badge: `{total} <Entities>` (e.g., `{total} Users`, `{total} Companies`, `{total} Buyers`, `{total} Agents`).
   - PageHeader Action Buttons: Primary action is always `"Create <Entity>"` (with Plus icon). Secondary export action is always `"Export Directory"` (with Download icon). Create/Edit action is always `"Cancel"` and `"Save <Entity>"`. Details action is always `"Back to Directory"` and `"Edit <Entity>"`.
6. **Platform Owner Exclusion in Selectors (STRICT & FINAL)**:
    - The core administrative tenant "Platform Owner" (`code === 'PLT'`) MUST NEVER be rendered as an option in company dropdowns, style forms, buyer forms, or filter select elements.
    - All operational company selectors must filter out `PLT` so factory operators and merchandisers only ever see production entities.


---

## 3. Form Validation & Data Handling

1. **Pure Server-Side Validation Only**:
   - Forms MUST include `noValidate` on the `<form>` tag.
   - DO NOT use native HTML5 validation (`required`, `minlength`, `maxlength`, `pattern`, or browser popup tooltips).
   - Display validation errors returned from backend API responses (HTTP 422 JSON errors) mapped directly under each `<FormField error={errors.field_name}>`.
2. **System Auto-Generated Entity Code Standard**:
   - In all creation/edit forms, entity code inputs MUST be read-only (`readOnly={true}`, `tabIndex={-1}`) with `systemAuto={true}` on `<FormField>`.
   - Users must never be forced or confused into typing entity codes manually.

---

## 4. Navigation & Workspace Standard

1. **Smart Accordion Rail (`NavigationRail`)**:
   - Only the parent category of the currently active module should be expanded by default.
   - All other categories must remain collapsed to avoid visual clutter and screen scroll fatigue.
2. **Zero Modals for CRUD Operations**:
   - Create, List, Edit, and Details MUST be dedicated full-page routes with breadcrumbs and back navigation.
   - Modals are strictly limited to non-CRUD flows (e.g. destructive action confirmation, QR scanner, supervisor PIN prompt).
