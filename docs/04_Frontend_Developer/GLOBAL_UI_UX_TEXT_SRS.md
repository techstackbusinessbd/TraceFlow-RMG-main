# Global UI/UX Text & Content Standards SRS
## Enterprise RMG ERP / SaaS Application

**Document Type:** Global UI/UX Text Standards / SRS  
**Version:** 2.0 (Aligned with Enterprise AGENTS.md Architecture)  
**Status:** Approved Standard  
**Scope:** Entire application  
**Primary UI Language:** 100% English (All UI labels, buttons, tables, badges, headers, and messages)  
**Engineering & Documentation Language:** Bengali (Bangla for discussions, plans, and documentation)  
**Future Localization:** Bangla-ready i18n structure  
**Audience:** Product Owner, Project Manager, Solution Architect, UI/UX Designer, Frontend Developer, Backend Developer, QA, Technical Writer

---

# 1. Purpose

এই document-এর উদ্দেশ্য হলো পুরো RMG Traceability Software project-এর জন্য একটি **centralized, consistent, user-friendly এবং enterprise-grade UI/UX text ও content architecture standard** নিশ্চিত করা।

এই standard অনুযায়ী application-এর সব:

- Page Title & Header
- Section Title & Sub-headers
- Field Label & Asterisk Indicator
- Placeholder
- Helper Text
- Tooltip
- Button & Table Action Controls
- Action Menu
- Server-Side Validation Message (HTTP 422)
- System & Business Error Message
- Success & Toast Message
- Warning & Data Integrity Message
- Inline Confirmation & Destructive Action View (Strict No-Modal Standard)
- Empty State & Loading State
- Lifecycle Status & Approval Status
- Notification & Audit Trail
- Table Column, Sorting & Pagination
- Filter & Search Toolbar
- Permission & Security Message
- Workflow & Traceability Microcopy

একই সুসংহত ভাষা প্যাটার্ন, কেন্দ্রীয় ডিজাইন টোকেন (`UI_TOKENS`) এবং পরিভাষা (terminology) মেনে চলবে।

---

# 2. Core Principle

## 2.1 UI Language ≠ Database Language

Developer/database terminology সরাসরি user interface-এ ব্যবহার করা যাবে না।

| Technical / Database | UI Text |
|---|---|
| `buyer_factory_assignments` | Factory Assignment |
| `buyer_commercial_profiles` | Commercial Terms |
| `buyer_quality_profiles` | Quality Requirements |
| `workflow_status` | Approval Status |
| `created_at` | Created On |
| `updated_at` | Last Updated |
| `is_active` | Active |
| `deleted_at` | Deleted On |
| `foreign_key` | Related Record |
| `master_data` | Master Data |
| `transaction` | Transaction |
| `record_id` | ID |
| `uuid` | Reference ID |

**Rule:** User should understand the meaning without knowing the system's technical architecture.

---

# 3. Global UI Writing Principles

## 3.1 Clear

Use simple and direct language.

**Good:**  
`Enter Buyer Name`

**Avoid:**  
`Please provide the textual value corresponding to the buyer entity name.`

---

## 3.2 Action-Oriented

Buttons should describe the action.

**Good:**
- Save
- Save Draft
- Submit
- Approve
- Reject
- Cancel
- Delete
- Export
- Print

**Avoid:**
- Process
- Execute
- Perform Action
- Do It

---

## 3.3 Consistent

একই meaning-এর জন্য পুরো application-এ একই শব্দ ব্যবহার করতে হবে।

Example:

Do not use:

- Customer
- Client
- Buyer
- Buyer Customer

for the same business entity.

If the ERP business terminology is **Buyer**, use **Buyer** everywhere.

---

## 3.4 System Auto-Generated Codes (Strict Standard)

Entity codes (e.g. Buyer Code, Supplier Code, Season Code, Style Code, Order Code, Floor Code, Line Code, Roll Code) ব্যবহারকারীকে কখনোই বানিয়ে বা ম্যানুয়ালি টাইপ করতে হবে না।
- সব Entity Code backend থেকে সিকোয়েনশিয়াল বা ইন্টেলিজেন্ট ফরম্যাটে 100% অটো জেনারেট হবে।
- Form-এ কোড ফিল্ডটি `readOnly={true}` থাকবে এবং সাথে একটি **"System Auto"** ব্যাজ অথবা হেল্পার টেক্সট প্রদর্শিত হবে।
- Backend এ অবশ্যই `next-code` প্রিভিউ এন্ডপয়েন্ট থাকবে এবং `store()` মেথডে ব্যাকএন্ড নিজস্ব জেনারেশন লজিক প্রয়োগ করে কোড সেভ করবে।

---

## 3.5 Buyer & Season Cascading Dependency (Enterprise RMG Standard)

Tier-1 Enterprise RMG ERP আর্কিটেকচার অনুযায়ী Season এবং Buyer এর মধ্যে একটি শক্তিশালী সম্পর্ক (Dependency) বজায় রাখতে হবে:
1. **Buyer Master Configuration**: প্রতিটি Buyer Profile-এ (Brands & Items ট্যাবে) নির্দিষ্ট Buyer-এর জন্য সক্রিয় **"Assigned Order Seasons"** নির্বাচন করা যাবে।
2. **Style & Merchandising Forms**: Style Creation/Edit এবং Order Creation ফর্মে Season ড্রপডাউনটি Buyer সিলেকশনের উপর সম্পূর্ণ নির্ভরশীল থাকবে:
   - যতক্ষণ না একজন Buyer সিলেক্ট করা হচ্ছে, ততক্ষণ Season ড্রপডাউনটি নিষ্ক্রিয় (`disabled={true}`) থাকবে এবং `Select Buyer First...` নির্দেশনা দেখাবে।
   - Buyer সিলেক্ট করার সাথে সাথে ব্যাকএন্ডের `/master/seasons/active?buyer_id={id}` এন্ডপয়েন্ট কল হয়ে শুধুমাত্র সেই Buyer-এর জন্য নির্ধারিত সিজনগুলো ফিল্টার হয়ে লোড হবে।
3. **List Filter Toolbar**: Style বা Order লিস্ট পেজের ফিল্টার টুলবারেও Buyer ফিল্টার সিলেক্ট করলে সাথে সাথে Season ফিল্টারের অপশনগুলো সেই Buyer-এর অনুমোদিত সিজন অনুসারে ফিল্টার হবে।

---

## 3.6 Standard Garment Color & Buyer Shade Architecture

RMG ট্রেসেবিলিটি ও ডাইং/ফ্যাব্রিকেশন সঠিকভাবে ট্র্যাক করার জন্য **Garment Color** ২-টায়ার কাঠামোতে পরিচালিত হবে:
1. **Central Color Master (`/master-data/colors`)**:
   - সব বেসিক বা স্ট্যান্ডার্ড কালার (e.g. Navy Blue, Black, Optic White, Olive, Burgundy) গ্লোবাল কালার মাস্টারে নিবন্ধিত থাকবে।
   - এতে থাকবে System Auto Code (`CLR-01`), Standard Name, Hex Swatch (`#000080`), Pantone Ref (`19-4024 TCX`), এবং Color Family (Blue, Black, etc.)।
2. **Style & Buyer Colorway Mapping**:
   - Style Create/Edit বা Order Entry-র সময় ইউজার সেন্ট্রাল লাইব্রেরি থেকে কালার ড্রপডাউন দিয়ে এক ক্লিকে সিলেক্ট করতে পারবেন।
   - সিলেক্ট করার সাথে সাথে গ্লোবাল কোড, হেক্স ও প্যানটোন অটো-ফিল হবে।
   - মার্চেন্ডাইজার প্রয়োজন অনুযায়ী নির্দিষ্ট Buyer-এর টেকপ্যাক অনুযায়ী **Buyer Shade / Color Name** (e.g. Zara-র জন্য `Midnight Blue`, H&M-এর জন্য `Dark Navy`) কাস্টমাইজ করতে পারবেন।
   - এই কালার ফেব্রিক রোল ও কাটিং বান্ডিল কিউআর স্টিকারে ট্রেসেবিলিটির জন্য সরাসরি প্রিন্ট হবে।

---

# 4. Global Terminology Dictionary

| Concept | Standard UI Term | Avoid |
|---|---|---|
| Buyer | Buyer | Customer/Client |
| Supplier | Supplier | Vendor, unless business context requires Vendor |
| Factory | Factory | Unit, Plant |
| Business Unit | Business Unit | BU |
| Style | Style | Product Code |
| Purchase Order | Purchase Order | PO, except compact UI |
| Sales Order | Sales Order | SO |
| Color | Color | Shade |
| Size | Size | Dimension |
| Order Quantity | Order Quantity | Qty |
| Quantity | Quantity | Qty, except compact tables |
| Status | Status | Current State |
| Approval | Approval | Authorization |
| Remarks | Remarks | Comments, unless comments are intended |
| Description | Description | Details |
| Effective Date | Effective Date | Start Date |
| Expiry Date | Expiry Date | End Date |
| Created On | Created On | Creation Date |
| Updated On | Last Updated | Modified Date |
| Reference | Reference | Ref |
| Attachment | Attachment | File |
| Document | Document | Doc |
| Search | Search | Find |
| Filter | Filter | Refine |
| Reset | Reset | Clear All |
| Submit | Submit | Send |
| Approve | Approve | Accept |
| Reject | Reject | Decline |
| Suspend | Suspend | Block |
| Activate | Activate | Enable |
| Deactivate | Deactivate | Disable |
| Archive | Archive | Remove |
| Delete | Delete | Erase |
| Restore | Restore | Recover |

---

# 5. Capitalization Standard

Use **Title Case** for:

- Page Titles
- Section Titles
- Table Headers
- Button Labels
- Menu Items

Examples:

- Buyer Management
- Basic Information
- Commercial Terms
- Approval Status
- Save Draft

Use **sentence case** for:

- Helper text
- Validation messages
- Notifications
- Confirmation messages

Example:

> Buyer has been created successfully.

---

# 6. Page Naming Standard

Every page should follow:

`[Business Entity] + [Action/Context]`

Examples:

- Buyer Management
- Buyer Details
- Create Buyer
- Edit Buyer
- Buyer Approval
- Buyer History
- Style Management
- Purchase Order Details
- Production Dashboard

Avoid technical page names:

- BuyerMasterIndex
- BuyerCRUD
- BuyerFactoryAssignmentScreen

---

# 7. Standard Page Structure & Mandatory Golden List Page Standard
 
Every major data list/management page across the entire enterprise software MUST strictly adhere to the approved **3-Tier Golden Layout**:
 
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Sleek Header Row (<PageHeader>)                                                │
│ Title (Left) + Item Counter Badge (<Badge variant="neutral">)        Action Buttons (R)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: Unified Filter Toolbar (<FilterToolbar>)                                       │
│ [Search Input (Left)]        [Select Filters (Mid)]        [Filter (Flat)] [Reset (Ccw)]│
│ Sorted by: FIELD (DIR) (Left Subline)                       Show per page: 10,15,25,50 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 3: Standard DataTable Shell (<DataTable<T>>)                                      │
│ Fixed Enterprise Shell | Alternating Rows | Strongly-Typed ColumnDef<T>[]              │
│ Footer: Showing X to Y of Z records (Left)         Page X of Y | < Prev | > Next (Right)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Breakdown:
1. **Tier 1: Sleek Header Row (`<PageHeader>`)**:
   - Single-line clean layout with direct Title on the left (e.g., `User Directory`, `Sister Companies`, `Buyer Directory`).
   - Paired with an item counter badge: `<Badge variant="neutral">12 Buyers</Badge>`.
   - Primary/Secondary action buttons on the far right (`<Button variant="primary">`, `<Button variant="secondary">`).
   - **Strict Rule**: Redundant large icons, decorative icon boxes, verbose subtitle paragraphs, and page-level duplicate breadcrumbs are strictly prohibited (breadcrumbs belong exclusively to the global top pinned bar).

2. **Tier 2: Unified Filter Toolbar (`<FilterToolbar>`)**:
   - Top row: Full-width search input on left (`UI_TOKENS.input.base` with search icon), followed by select filters (`UI_TOKENS.input.select`), and on the far right a primary flat "Filter" submit button alongside a secondary "Reset" icon button (`RotateCcw`).
   - Bottom subline (`UI_TOKENS.filter.subline`): Active sort indicator on the left (`Sorted by: FIELD (DIR)` with icon) and page size dropdown on the right ("Show per page:" 10, 15, 25, 50).
   - Ad-hoc search layouts or loose standalone inputs are strictly prohibited.

3. **Tier 3: Standard DataTable Shell (`<DataTable<T>>`)**:
   - Fixed and immutable enterprise shell across the whole system (`frontend/src/components/common/DataTable.tsx`). Manual `<table>` tags or custom table layouts are strictly prohibited.
   - Dynamic typed `ColumnDef<T>[]` (entity codes in mono font, status pills using `<Badge>`, actions using `<TableActionButton>`).
   - Fixed footer pagination: `Showing X to Y of Z records` on the left, and `< Previous` / `> Next` flat buttons on the right.

---

# 8. Page Title Standard

### Pattern

`[Entity] Management`

Examples:

- Buyer Management
- Supplier Management
- Style Management
- Purchase Order Management
- Production Management

For a specific record:

- Buyer Details
- Style Details
- Purchase Order Details

For creation:

- Create New Buyer
- Create New Style
- Create New Purchase Order

For editing:

- Edit Buyer
- Edit Style
- Edit Purchase Order

---

# 9. Page Description Standard

Keep descriptions short.

### Good

> Manage buyer information, contacts, commercial terms, and approval status.

### Avoid

> This page is used for managing all kinds of information that are related to the buyer master entity.

---

# 10. Section Naming Standard

Use business-friendly nouns.

Recommended:

- Basic Information
- Contact Information
- Business Information
- Commercial Terms
- Quality Requirements
- Compliance Information
- Factory Assignment
- Documents
- Approval Information
- Additional Information
- Audit History

Avoid:

- Master Data Section
- General Tab 1
- Data Configuration
- Entity Details Block

---

# 11. Field Label Standard

Every field must have:

1. Clear label
2. Required indicator where applicable
3. Placeholder when useful
4. Helper text when necessary
5. Validation message

Example:

```text
Buyer Name *
[ Enter buyer name ]

The registered or commonly used name of the buyer.
```

---

# 12. Required Field Standard

Use `*` visually for required fields.

Example:

- Buyer Name *
- Country *
- Buyer Type *

Do not write:

- Buyer Name (Mandatory)
- Buyer Name (Required Field)

The form legend may state:

> * Required field

---

# 13. Placeholder Standard

Placeholders should explain expected input.

### Good

- `Enter buyer name`
- `Select buyer type`
- `Select country`
- `Enter business registration number`
- `Search by buyer name or code`

### Avoid

- `Type here`
- `Input`
- `Write something`
- `N/A`

---

# 14. Placeholder Rules

Do not repeat the label unnecessarily.

Bad:

```text
Buyer Name
[ Buyer Name ]
```

Good:

```text
Buyer Name
[ Enter buyer name ]
```

For dropdowns:

```text
Buyer Type
[ Select buyer type ]
```

For date:

```text
Effective Date
[ Select date ]
```

---

# 15. Helper Text

Helper text should explain business meaning, not technical implementation.

Example:

```text
Buyer Reference Code
[ Enter reference code ]

The reference code used by the buyer for this company.
```

Avoid:

> This value will be stored in the external_code database field.

---

# 16. Tooltip Standard

Use tooltips only when a field/action may be unclear.

Examples:

**Buyer Reference Code**

> Reference assigned by the buyer.

**AQL**

> Acceptable Quality Limit used for final inspection.

**Incoterm**

> Defines the responsibilities, costs, and risks between buyer and seller.

---

# 17. Button Standards

## Primary Buttons

Use one primary action per screen where possible.

Examples:

- Save
- Save Draft
- Submit
- Create Buyer
- Update Buyer
- Approve

## Secondary Buttons

- Cancel
- Back
- Reset
- Close

## Utility Buttons

- Export
- Print
- Refresh
- Download
- Upload

---

# 18. Create / Edit Button Standard

Create:

> Create Buyer

Edit:

> Update Buyer

Generic form:

> Save

Avoid:

- Submit Data
- Execute
- Process Record
- Do Save

---

# 19. Workflow Button Standard

| Business Action | Button |
|---|---|
| Save incomplete record | Save Draft |
| Send for review | Submit for Review |
| Approve | Approve |
| Reject | Reject |
| Send back | Return for Correction |
| Activate | Activate |
| Temporarily stop | Put on Hold |
| Suspend | Suspend |
| Resume | Resume |
| Complete | Mark as Complete |

---

# 20. Confirmation Standard (Strict "No Modals" Rule)
 
> [!IMPORTANT]
> **No Modals Rule (STRICT)**: Modals and popups are STRICTLY PROHIBITED across the entire application. All forms, details, creation flows, edit flows, reports, and delete/destructive actions MUST be built as full dedicated views or inline expandable confirmation banners with back navigation. NEVER use modal dialogues or popups.
 
Destructive or sensitive actions (e.g. Delete, Cancel, Suspend) must use either:
1. **Inline Card / Action Banner**: Directly embedded above the action or row with clear consequence microcopy.
2. **Dedicated Full Review Page**: For multi-record bulk changes or high-risk business deletions.
 
Pattern:
 
```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Inline Confirmation Banner]                                           │
│ Action Question: Delete this buyer?                                    │
│ Short Consequence: This buyer and related records will be deactivated. │
│ [Cancel (Flat Secondary)]          [Confirm Delete Buyer (Flat Danger)]│
└────────────────────────────────────────────────────────────────────────┘
```
 
Example:
 
> **Delete this buyer?**  
> This buyer and its related information will be deactivated.  
> `Cancel`  |  `Delete Buyer`
 
For irreversible actions:
 
> This action cannot be undone.
 
---
 
# 21. Delete & Deactivation Confirmation
 
Standard:
 
**Title / Prompt**
 
> Delete Buyer?
 
**Consequence Microcopy**
 
> Are you sure you want to delete this buyer?
 
If dependencies exist:
 
> This buyer cannot be deleted because it is linked to active purchase orders and contracts. Deactivate the buyer instead to preserve transactional integrity.
 
Use **Deactivate** instead of Delete when historical integrity is required.

---

# 22. Success Message Standard

Pattern:

`[Entity] + [past action] + successfully.`

Examples:

- Buyer created successfully.
- Buyer updated successfully.
- Buyer approved successfully.
- Buyer activated successfully.
- Purchase order created successfully.
- Production entry saved successfully.

Avoid:

- Done!
- Success!
- Operation completed!
- Data inserted successfully!

---

# 23. Error Message Standard

Error messages should tell the user:

1. What went wrong
2. What they can do

Example:

> Buyer Name is required.

Better:

> Enter a buyer name to continue.

Example:

> The selected buyer is already registered. Search for the existing buyer or use a different buyer reference.

---

# 24. Validation Message Standard (Pure Server-Side Validation Only)
 
> [!IMPORTANT]
> **Validation Standard**: Pure Server-Side Validation Only. Do NOT use native HTML5 validation (`required`, `minlength`, `maxlength`, `pattern`, or browser popup tooltips). Forms must include `noValidate` and handle error feedback strictly from backend API responses (HTTP 422 JSON errors).
 
All validation errors return as key-value pairs from backend FormRequests (e.g. `BuyerStoreRequest.php`) and render directly beneath the corresponding input field using `UI_TOKENS.input.errorText`:
 
| Situation | Standard Message (HTTP 422 Response) |
|---|---|
| Required | This field is required. |
| Required with group | At least one primary contact must be designated. |
| Invalid email | Enter a valid email address. |
| Invalid phone | Enter a valid phone number. |
| Duplicate / Unique | This buyer name has already been taken. |
| Invalid date | Enter a valid date. |
| Past date | Select today or a future date. |
| Invalid quantity | Enter a quantity greater than zero. |
| Invalid selection | Select a valid option. |
| Character limit | The :attribute may not be greater than :max characters. |
 
Validation feedback rules:
- Red error text directly beneath the field (`text-xs text-rose-500 mt-1`).
- The input border turns red (`border-rose-400 dark:border-rose-600 focus:border-rose-500`).
- No native browser tooltip popups appear.
- On multi-tab forms, the UI automatically activates the specific tab where the first validation error occurred.

---

# 25. Warning Message Standard

Warnings should explain risk.

Examples:

> This buyer has active purchase orders. Deactivating the buyer may affect future transactions.

> The selected quantity exceeds the available stock.

> This action will affect existing production records.

Avoid vague warnings:

> Warning!

---

# 26. Information Message Standard

Examples:

> No changes have been made.

> This buyer is currently under review.

> Approval is required before this buyer can be activated.

---

# 27. Empty State Standard

Every list/table should have a meaningful empty state.

### No records

**Title:**

> No buyers found

**Description:**

> No buyer records match your current filters.

**Action:**

> Clear Filters

or:

> Add New Buyer

### No data yet

> No buyers have been added yet.

> Add your first buyer to get started.

# 28. Search Standard (Unified FilterToolbar Pattern)

Search input MUST reside within the standardized `<FilterToolbar>` top row on the far left with magnifying glass icon:

- Dynamic Placeholder format: `Search by [field1], [field2], or [field3]...`
- Buyer Management: `Search by name, code, contact, country...`
- Order / PO Management: `Search by PO number, style, or buyer...`
- Production Tracking: `Search by bundle ticket, cut number, or line...`

Rules:
- Real-time or submit-triggered search.
- Standalone floating search boxes are strictly prohibited.

---

# 29. Filter Standard (Unified FilterToolbar Standard)

All data list/management pages MUST use the unified Enterprise Filter Toolbar pattern:

1. **Top Row**:
   - Search input on the left (`UI_TOKENS.input.base` with search icon).
   - Select filters in the middle (`UI_TOKENS.input.select`) with standard empty state (e.g. `All Statuses`, `All Types`, `All Companies`).
   - Primary flat **Filter** submit button alongside a secondary **Reset** icon button (`RotateCcw`) on the far right.

2. **Bottom Subline (`UI_TOKENS.filter.subline`)**:
   - Active sort indicator on the left (`Sorted by: FIELD (DIR)` with sort icon).
   - Records page size dropdown on the far right (`Show per page: 10, 15, 25, 50`).

Buttons Microcopy:
- Primary: `Filter`
- Reset: Icon only with tooltip `Reset Filters` or secondary label `Reset`

Avoid:
- `Apply Filters` (use concise action `Filter`)
- `Clear Search` / `Do Filter`

# 30. Table Column Standards

Columns should be concise and business-readable.

Recommended:

| Technical | UI |
|---|---|
| `buyer_code` | Buyer Code |
| `buyer_name` | Buyer Name |
| `buyer_type` | Buyer Type |
| `country_id` | Country |
| `factory_id` | Factory |
| `status` | Status |
| `created_at` | Created On |
| `updated_at` | Last Updated |

Avoid database-style names.

---

# 31. Row Action Standard

Preferred action hierarchy:

```text
View
Edit
Approve
More
```

Under More:

- Duplicate
- Suspend
- Activate
- Archive
- Delete
- History

Use icons with tooltips where space is limited.

---

# 32. Status Standard

Status names must be:

- Short
- Consistent
- Business meaningful
- Mutually understandable

Recommended generic lifecycle:

```text
Draft
Submitted
Under Review
Approved
Active
On Hold
Rejected
Suspended
Inactive
Archived
```

Do not use technical statuses such as:

- `1`
- `0`
- `pending_approval`
- `is_active`
- `deleted`

---

# 33. Status vs Approval Status

Do not mix these concepts.

### Status

Describes the overall record lifecycle.

Example:

> Active

### Approval Status

Describes approval workflow.

Example:

> Pending Approval

A buyer can therefore have:

```text
Status: Active
Approval Status: Approved
```

---

# 34. Date & Time Standards

Use readable labels:

- Created On
- Updated On
- Effective From
- Effective Until
- Approved On
- Submitted On

Avoid:

- Created At
- Updated At
- Timestamp

unless technical/admin screens specifically require them.

---

# 35. Date Display

Preferred:

> 06 Sep 2026

For detailed timestamp:

> 06 Sep 2026, 03:45 PM

Use one consistent application-wide format.

---

# 36. Quantity & Unit Standard

Always display the unit where meaningful.

Examples:

- 10,000 Pcs
- 2,500 Meters
- 450 Kg
- 120 Cartons

Avoid:

> Qty: 10000

when the unit is available.

---

# 37. Currency Standard

Display currency clearly.

Examples:

- USD 25,000
- BDT 500,000
- EUR 18,500

Use the system's configured currency formatting rules consistently.

---

# 38. Loading State

Avoid generic:

> Loading...

Use contextual text where useful:

- Loading buyers...
- Loading purchase orders...
- Saving buyer...
- Submitting for approval...
- Generating report...

For short operations, a spinner with no text is acceptable.

---

# 39. Permission Message

When the user lacks permission:

> You don't have permission to perform this action.

For page access:

> You don't have permission to access this page.

Avoid:

> Access Denied 403

for normal business users.

---

# 40. Session / Authentication Messages

Use:

> Your session has expired. Please sign in again.

Avoid technical:

> Token expired.

---

# 41. Network / System Error

User-facing:

> We couldn't complete your request. Please try again.

Optional support reference:

> If the problem continues, contact support with reference ID: ABC123.

Do not expose:

- SQL errors
- Stack traces
- API endpoints
- Database exceptions
- Internal class names

---

# 42. Record Conflict Messages

Example:

> This record was updated by another user. Refresh the page and review the latest information before saving your changes.

This is important for enterprise concurrent systems.

---

# 43. Unsaved Changes

When leaving an edited form:

> You have unsaved changes. Are you sure you want to leave this page?

Actions:

- Stay
- Leave Without Saving

---

# 44. Import / Export Standards

## Import

Button:

> Import

Steps:

```text
Download Template
Upload File
Validate Data
Review Errors
Import Records
```

Messages:

> File uploaded successfully.

> 245 records are ready to import.

> 12 records contain errors. Review the error report before importing.

## Export

Use:

- Export Excel
- Export CSV
- Export PDF

Avoid:

- Generate File
- Download Data

---

# 45. File Upload Text

Example:

```text
Upload Document

Drag and drop your file here or Browse

Supported formats: PDF, JPG, PNG
Maximum file size: 10 MB
```

For specific documents:

> Upload Buyer Registration Certificate

---

# 46. Tabs Naming & Enterprise Segmented Layout Standard
 
For complex master entities (e.g., Buyers, Suppliers, Styles, Purchase Orders), single long scrolling pages or messy accordions are strictly prohibited. Forms MUST use **Enterprise Segmented Tabs with Step Navigation**:
 
Recommended standard tab sequence for commercial partner entities:
1. `General & Profile`
2. `Commercial & Terms`
3. `Capacity & Compliance`
4. `Divisions & Labels`
5. `Contact Directory`
 
Tab Bar Rules:
- Rendered in a sleek top navigation container with icons and count indicators.
- Inactive tabs display subtle hover highlights.
- Active tabs feature a crisp solid indicator (`bg-blue-600` / `border-blue-600`).
- Bottom of each tab body features a fixed footer navigation row with flat `<Button variant="secondary">` (`Previous: [Name]`) and (`Next: [Name]`).
 
---
 
# 47. Wizard & Segmented Form Navigation
 
Use direct, actionable step navigation:
 
- In Tab 1: `Next: Commercial & Terms`
- In Mid Tabs: `Previous: Profile` and `Next: Capacity & Compliance`
- In Final Tab: `Previous: Divisions` and primary action `Save Buyer` or `Save Draft`
 
---
 
# 51. Form Layout Standard & "No Nested Cards" Rule
 
> [!IMPORTANT]
> **No Nested Cards Rule (STRICT)**: Wrapping cards inside other cards or using high-contrast colored boxes inside standard form shells creates visual clutter and is strictly prohibited.
> 1. Use a **Single Unified Card Shell** per active tab or form view.
> 2. Separate logical sections inside the card using **Subtle Horizontal Dividers** (`border-b border-slate-100 dark:border-slate-800`).
> 3. Sub-brands, Departments, and Related entities must render in flat, harmonious grids or compact table lines.
 
### Handling Optional Sections & Clean Empty States
For sub-collections that are non-mandatory (e.g. Sub-Brands, Product Divisions, Special SMV items):
- Do NOT pre-populate forced dummy rows.
- Label the section header with an explicit `(Optional)` tag.
- When empty, display a clean, dashed empty-state placeholder:
  > *No sub-brands added. Click "Add Label" if this buyer operates under specific brand labels.*
- Provide a clear `+ Add [Entity]` button and unrestricted removal (`<TableActionButton variant="danger">`) for every row.
- Filter out blank rows automatically before submission.
 
---
 
# 52. Field Grouping Standard
 
Related fields must be grouped cleanly without heavy visual boxes:
 
### 1. General & Profile
- Buyer Code (Read-only badge/input)
- Buyer Name *
- Legal Entity Name
- Primary Associated Sister Company * (Dropdown)
- Country * & Region
- Buyer Type * (Brand / Retailer / Buying Agent / Importer)
 
### 2. Commercial Terms
- Default Currency *
- Payment Terms *
- Incoterm *
- Credit Days & Shipment Mode *
- Nominated LC Beneficiary Sister Companies
- Nominated Buying Agent (Optional flat select)
 
### 3. Capacity & Compliance
- Target Annual Volume & Lead Days
- Quality Standard (AQL)
- Compliance Certifications (Multi-select pill tags: BSCI, OEKO-TEX, GOTS, SEDEX, etc.)

---

# 53. UI Text for Master Data

Recommended terminology:

- Master Data
- Basic Information
- Configuration
- Reference Data
- Code
- Name
- Description
- Status

Do not expose internal terms like:

- Lookup Table
- Foreign Key
- Enum Value
- Seed Data

---

# 54. UI Text for Transaction Modules

Use:

- Create
- Submit
- Confirm
- Approve
- Process
- Complete
- Cancel
- Close

Examples:

> Confirm Purchase Order

> Submit Production Plan

> Complete Cutting Batch

---

# 55. UI Text for Production Traceability

Recommended terms:

- Traceability
- Production Tracking
- Bundle Tracking
- Bundle History
- Process History
- Production Movement
- Current Process
- Previous Process
- Next Process
- Scan Bundle
- Scan QR Code
- Transfer
- Receive
- Dispatch

Example:

> Scan Bundle QR Code

> Bundle is currently at Sewing Line 5.

> Bundle has not been received by the next process.

---

# 56. QR / Barcode Text Standard

Use:

- Scan QR Code
- Scan Barcode
- QR Code
- Barcode
- Bundle ID
- Bundle Card
- Piece Card

Avoid:

- Scan Data
- QR Input
- Code Reader

---

# 57. Production Error Messages

Examples:

> This bundle is not assigned to the selected production line.

> This bundle has already been transferred to the next process.

> The scanned QR code is invalid or inactive.

> This bundle cannot be processed because the previous process is incomplete.

---

# 58. Approval UI Standard

Approval page should clearly show:

```text
Record Information
Approval Status
Submitted By
Submitted On
Review History
Remarks
Action
```

Actions:

- Approve
- Reject
- Return for Correction

Reject/return should normally require a reason.

---

# 59. Remarks Standard

Label:

> Remarks

Placeholder:

> Enter any additional remarks

Avoid:

> Write comments here

unless the business meaning is specifically comments.

---

# 60. Confirmation vs Approval

These are different.

### Confirmation

User confirms an operational action.

> Confirm Transfer

### Approval

Authorized user approves a business record.

> Approve Purchase Order

Do not use them interchangeably.

---

# 61. Destructive Action Standard

Destructive actions include:

- Delete
- Cancel
- Reject
- Suspend
- Remove
- Void

These actions must:

1. Use clear wording
2. Show confirmation
3. Explain impact where necessary
4. Require reason where business policy requires
5. Respect permission rules
6. Be recorded in audit history

---

# 62. Accessibility Text Standard

All important interactive controls must have meaningful accessible labels.

Examples:

- `View Buyer`
- `Edit Buyer`
- `Delete Buyer`
- `Close Dialog`
- `Open Filter`
- `Refresh Data`

Avoid:

- `Click Here`
- `Action`
- `More`

without context.

---

# 63. Mobile / Tablet UI Text

Because production environments may use tablets, labels should remain short.

Preferred:

- Scan Bundle
- Start Process
- Complete Process
- Transfer
- Receive
- Reject
- Save

Avoid long button text on operational screens.

---

# 64. Responsive Text Rule

Desktop may show:

> Submit for Approval

Tablet/mobile may use:

> Submit

Tooltip or supporting text can provide additional context.

---

# 65. Bangla Language Readiness

The system should be designed for future localization.

All user-facing text must come from a translation/resource layer.

Do not hard-code UI text inside business logic.

Recommended conceptual structure:

```text
resources/
 ├── lang/
 │   ├── en/
 │   └── bn/
```

Example keys:

```text
buyer.create.title
buyer.fields.name
buyer.actions.save
buyer.messages.created
validation.required
common.actions.cancel
```

---

# 66. Translation Rules

English should be the source language.

Bangla translation should preserve business meaning rather than translate word-for-word.

Example:

English:

> Submit for Review

Bangla:

> পর্যালোচনার জন্য জমা দিন

Avoid literal or unnatural translations.

---

# 67. Global UI Copy Registry

The project should maintain a centralized UI text registry.

Recommended categories:

```text
common
navigation
actions
validation
messages
errors
warnings
statuses
permissions
authentication
master_data
transactions
production
quality
inventory
commercial
finance
reports
dashboard
```

---

# 68. Recommended Common Action Dictionary

| Key | English |
|---|---|
| save | Save |
| save_draft | Save Draft |
| create | Create |
| update | Update |
| edit | Edit |
| view | View |
| delete | Delete |
| cancel | Cancel |
| close | Close |
| back | Back |
| next | Next |
| previous | Previous |
| submit | Submit |
| submit_for_review | Submit for Review |
| approve | Approve |
| reject | Reject |
| return_for_correction | Return for Correction |
| activate | Activate |
| deactivate | Deactivate |
| suspend | Suspend |
| resume | Resume |
| archive | Archive |
| restore | Restore |
| search | Search |
| filter | Filter |
| reset | Reset |
| refresh | Refresh |
| export | Export |
| import | Import |
| print | Print |
| download | Download |
| upload | Upload |

---

# 69. Standard CRUD Copy

## Create

Title:

> Create New [Entity]

Primary button:

> Create [Entity]

Success:

> [Entity] created successfully.

## Edit

Title:

> Edit [Entity]

Primary button:

> Update [Entity]

Success:

> [Entity] updated successfully.

## View

Title:

> [Entity] Details

## Delete

Dialog:

> Delete [Entity]?

Success:

> [Entity] deleted successfully.

---

# 70. Global Error Classification

The UI should distinguish:

### Validation Error

> Enter a valid email address.

### Business Rule Error

> This purchase order cannot be cancelled because production has already started.

### Permission Error

> You don't have permission to approve this purchase order.

### System Error

> We couldn't complete your request. Please try again.

### Network Error

> Unable to connect to the server. Check your connection and try again.

---

# 71. Business Rule Message Standard

Business rules should explain the reason.

Bad:

> Action not allowed.

Good:

> This bundle cannot be transferred because the previous process has not been completed.

---

# 72. Search No-Result Standard

When filters/search return nothing:

> No results found.

If useful:

> No buyers found matching your search.

Action:

> Clear Filters

---

# 73. Pagination Text

Recommended:

> Showing 1–25 of 250 records

Avoid:

> 25 rows

---

# 74. Bulk Action Standard

When records are selected:

> 25 buyers selected

Bulk actions:

- Approve Selected
- Activate Selected
- Export Selected
- Delete Selected

Confirmation:

> Are you sure you want to approve 25 selected buyers?

---

# 75. Data Integrity Text

For protected records:

> This record cannot be deleted because it is linked to existing transactions.

Recommended alternative:

> Deactivate

This preserves historical data.

---

# 76. Record Locking

If editing is restricted:

> This record is currently being edited by another user.

If a lock expires:

> The editing session has expired. Refresh the page before continuing.

---

# 77. Draft Standard

Draft means incomplete or not submitted.

Use:

> Draft

Avoid:

> Temporary

> Incomplete Data

---

# 78. Archive Standard

Archive means historical record is retained but removed from normal active views.

Message:

> This record has been archived.

Avoid using Archive when the record must be permanently deleted.

---

# 79. Active / Inactive Standard

Use:

> Active

> Inactive

Do not use:

> Enable / Disable

for business records unless the action specifically controls a system feature.

---

# 80. Technical Admin UI Exception

System Administration screens may expose technical information when necessary.

Examples:

- API Endpoint
- UUID
- Tenant ID
- Job ID
- Queue
- Request ID
- Integration Status

However, these should remain inside **Advanced / Technical Information** sections.

---

# 81. Security-Sensitive Text

Never display sensitive system information unnecessarily.

Do not expose:

- Password
- Password Hash
- Access Token
- API Secret
- Encryption Key
- Internal Database Credentials

Use:

> Password

not:

> Password Hash

---

# 82. Audit & Compliance Requirement

Every important business action should have a user-readable audit description.

Examples:

> Buyer created.

> Buyer approved.

> Purchase order quantity changed from 10,000 Pcs to 12,000 Pcs.

> Production line changed from Line 05 to Line 07.

Audit text must be understandable to business users and auditors.

---

# 83. UI/UX Consistency Matrix

Every new module must validate:

| Item | Required |
|---|---|
| Page title | Yes |
| Page description | Recommended |
| Section titles | Yes |
| Field labels | Yes |
| Required indicators | Yes |
| Placeholders | Where useful |
| Helper text | Where needed |
| Validation messages | Yes |
| Success messages | Yes |
| Error messages | Yes |
| Empty state | Yes |
| Loading state | Yes |
| Confirmation dialog | For destructive actions |
| Permission message | Yes |
| Audit description | For auditable actions |
| Localization key | Yes |

---

# 84. Definition of Done — UI Text

A screen is not UI-text complete until:

- All visible text follows global terminology.
- No database field names appear in normal UI.
- Labels are consistent.
- Required fields are clearly marked.
- Placeholders are meaningful.
- Validation messages are user-friendly.
- Success/error/warning messages are implemented.
- Empty states are implemented.
- Confirmation dialogs exist for destructive actions.
- Permission messages are understandable.
- Status terminology follows the global dictionary.
- Translation keys are defined.
- Accessibility labels exist for icon-only actions.
- Audit messages are human-readable where required.

---

# 85. Developer Implementation Rules (Centralized Tokens & Architectural Standards)
 
## Must
 
- Exclusively consume centralized design tokens from `frontend/src/config/designTokens.ts` (`UI_TOKENS`).
- Exclusively consume standard reusable UI primitives from `frontend/src/components/common/` (`<Button>`, `<Badge>`, `<TableActionButton>`, `<PageHeader>`, `<FilterToolbar>`, `<DataTable>`).
- Buttons MUST use flat, crisp, solid colors.
- Use 100% English for all UI labels, buttons, tables, badges, and messages.
- Ensure pure server-side validation (`noValidate` on forms, handle 422 JSON errors).
- Adhere strictly to the No Modals rule: build all workflows as full dedicated pages or inline confirmation states.
- Follow the 3-Tier Golden List Page Standard for all data management views.
- Reuse global terminology and common action labels.
- Keep business text separate from business logic.
- Keep UI copy version-controlled.
 
## Must Not
 
- Invent arbitrary colors, borders, paddings, or geometry using ad-hoc inline Tailwind utility classes.
- Use gradient buttons under any circumstance (gradient buttons are strictly prohibited).
- Use modal dialogues, popups, or browser alert popups.
- Use native HTML5 browser form validation or popups.
- Hard-code duplicate UI text unnecessarily.
- Use database column names as UI labels.
- Expose raw exception messages, stack traces, or SQL errors directly to users.
- Create new terminology without checking the global dictionary.
- Use different words for the same business concept.
 
---
 
# 86. Component-Level Text Standards
 
Reusable components should have standard copy.
 
### Data Table (`<DataTable<T>>`)
 
- Search
- Filter
- Reset Filters
- Refresh
- Export
- No results found
- Showing X to Y of Z records
- `< Previous` / `> Next`
 
### Form
 
- Save Draft
- Save [Entity]
- Cancel
- * Required field
- Invalid value
 
### Inline Confirmation Banner (Replacing Modals)
 
- Cancel
- Confirm [Action]
- Back to Safety
 
### File Upload
 
- Upload
- Browse
- Remove
- Replace
 
### Approval
 
- Approve
- Reject
- Return for Correction
- Approval History

---

# 87. Enterprise UI/UX Content Governance

A **Global UI Text Owner** or Product/UX Governance role should control terminology.

Before introducing a new term:

1. Check the Global Terminology Dictionary.
2. Check existing modules.
3. Confirm business meaning.
4. Add the new term if required.
5. Update translation resources.
6. Notify UX and development teams.

---

# 88. Versioning

Global UI text changes must be version-controlled.

Example:

```text
UI Text Standard v1.0
UI Text Standard v1.1
UI Text Standard v1.2
```

Changes should record:

- Version
- Date
- Change
- Reason
- Approved By

---

# 89. Recommended Project Structure

```text
docs/
└── ui-ux/
    ├── GLOBAL_UI_UX_TEXT_SRS.md
    ├── GLOBAL_TERMINOLOGY.md
    ├── UI_STATUS_DICTIONARY.md
    ├── UI_MESSAGE_DICTIONARY.md
    └── UI_COMPONENT_COPY.md
```

Application translation structure:

```text
resources/
└── lang/
    ├── en/
    │   ├── common.php
    │   ├── navigation.php
    │   ├── validation.php
    │   ├── messages.php
    │   ├── statuses.php
    │   └── modules/
    │       ├── buyer.php
    │       ├── merchandising.php
    │       ├── order.php
    │       ├── planning.php
    │       ├── inventory.php
    │       ├── cutting.php
    │       ├── sewing.php
    │       ├── quality.php
    │       ├── washing.php
    │       ├── finishing.php
    │       ├── shipment.php
    │       └── finance.php
    └── bn/
        └── ...
```

---

# 90. Final Enterprise UI/UX Text Architecture

```text
GLOBAL UI/UX TEXT STANDARD
│
├── Global Terminology
│
├── Navigation
│
├── Page Titles
│
├── Section Titles
│
├── Field Labels
│
├── Placeholders
│
├── Helper Text
│
├── Tooltips
│
├── Buttons
│
├── Statuses
│
├── Validation Messages
│
├── Success Messages
│
├── Error Messages
│
├── Warning Messages
│
├── Confirmation Dialogs
│
├── Empty States
│
├── Loading States
│
├── Permission Messages
│
├── Notifications
│
├── Audit Messages
│
├── Dashboard Text
│
├── Reports
│
├── Accessibility Labels
│
└── Localization / Translation
```

---

# 91. Project-Wide Rule

**One Business Meaning = One UI Term**

If the business concept is "Buyer", every module should use:

> Buyer

not:

> Customer / Client / Buyer Customer / Account / Party

unless those terms represent genuinely different business entities.

This rule is mandatory for maintaining a professional enterprise ERP experience.

---

# 92. Recommended Next-Level Documents

This global SRS should be the parent standard for the following documents:

1. `GLOBAL_UI_UX_TEXT_SRS.md`
2. `GLOBAL_TERMINOLOGY.md`
3. `GLOBAL_STATUS_DICTIONARY.md`
4. `GLOBAL_MESSAGE_DICTIONARY.md`
5. `GLOBAL_FORM_UX_STANDARD.md`
6. `GLOBAL_TABLE_UX_STANDARD.md`
7. `GLOBAL_DASHBOARD_UX_STANDARD.md`
8. `GLOBAL_ACCESSIBILITY_STANDARD.md`
9. `GLOBAL_LOCALIZATION_STANDARD.md`
10. `MODULE_UI_UX_SPEC.md`

Each module-specific UI/UX document must inherit this global standard and may extend it only when a business-specific requirement exists.

---

# 93. Acceptance Criteria

The project will be considered compliant when:

- 100% user-facing text follows the global terminology.
- No unexplained technical/database terminology appears in business screens.
- All modules use consistent action labels.
- All forms use consistent validation patterns.
- All workflows use standardized status terminology.
- All destructive actions use confirmation.
- All important business actions generate understandable audit descriptions.
- All user-facing strings support localization.
- UX, frontend, backend and QA teams use the same terminology source.
- New UI text is reviewed against this document before release.

---

# 94. Final Standard

This document is the **Global UI/UX Text SRS** for the entire ERP/SaaS project.

All future modules—including CRM, Buyer Master, Merchandising, Order Management, Planning/PPC, Procurement, Inventory, Cutting, Printing, Embroidery, Sewing, Washing, Finishing, Packing, Quality, Shipment, Finance, HR, Maintenance, Compliance, Traceability, Reporting and BI—must follow this standard.

**No module should independently invent its own UI terminology when an equivalent global term already exists.**

