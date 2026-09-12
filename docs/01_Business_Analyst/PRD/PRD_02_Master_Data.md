# Product Requirements Document (PRD)
**Module:** 02 - Master Data (Global Library)
**Document Version:** 4.0 (Enterprise Detailed Edition)
**Author:** AI Business Analyst
**Status:** Approved for Architectural Design

---

## 1. Executive Summary
Master Data is the foundational module of the RMG Traceability Software. It acts as the central repository for all global configurations. Without setting up the Master Data, no other module (Merchandising, Planning, Sewing, etc.) can function, as they strictly rely on the relational IDs generated here.

The system will enforce **"Create Once, Use Everywhere"** to prevent data duplication and typographical errors across the factory.

> **Related Comprehensive Specification:**  
> For the complete 7-Layer Enterprise Master Data Architecture, Auto-Code specifications, Multi-Company isolation rules, and UI/UX standards, refer to: [SRS_Master_Data_Layer_Architecture.md](file:///g:/ERP/TraceFlow-RMG/docs/01_Business_Analyst/SRS_Master_Data_Layer_Architecture.md).

---

## 2. Target Personas
1. **System Admin:** Full CRUD (Create, Read, Update, Delete) access to all Master Data.
2. **Merchandising Manager:** Can Create/Update Buyers and Styles.
3. **IE Manager:** Can Create/Update Production Lines, Colors, and Sizes.
4. **General Users:** Read-Only access (Dropdown selections) across other modules.

---

## 3. Sub-Module & Feature Details

### 3.1. Sub-module: Enterprise Buyer Master
Buyers are the international brands, retailers, and buying houses (e.g., H&M, Inditex/Zara, Primark, Levi's) procuring garments from the manufacturing group.

#### 3.1.1. Field Level Validations
| Field Name | Type | Mandatory | Validation Rules | UI Component |
|---|---|---|---|---|
| `Buyer Code` | String | Auto (Yes) | Immutable, auto-generated sequentially (e.g. `BYR-01`, `BYR-02`). | Read-Only Badge |
| `Buyer Name` | String | Yes | Trade brand name. Min: 3, Max: 150 chars. Globally unique (Case-insensitive). | Text Input |
| `Legal Name` | String | No | Registered corporate name (e.g. H & M Hennes & Mauritz GBC AB). Max: 200 chars. | Text Input |
| `Brand Name` | String | No | Primary retail brand label. Max: 150 chars. | Text Input |
| `Buyer Type` | Enum | Yes | Options: Brand, Retailer, Importer, Buying House, E-Commerce. | Select Dropdown |
| `Region` | Enum | No | Options: North America, European Union, Scandinavia, Asia Pacific, Middle East, Domestic. | Select Dropdown |
| `Country` | String | Yes | Must be selected from predefined list of countries. | Searchable Dropdown |
| `Website` | URL | No | Must be valid URL format (https://...). | URL Input |
| `Nominated Company` | UUID | Yes | Primary independent company legal entity contracted to receive Master LC / Contract. | Select Dropdown |
| `Default Currency` | String | Yes | Options: USD, EUR, GBP, CAD, AUD, BDT. Default: USD. | Select Dropdown |
| `Incoterm` | String | Yes | Options: FOB, CIF, CFR, EXW, DDP, FCA. Default: FOB. | Select Dropdown |
| `Payment Terms` | String | Yes | Options: LC at Sight, LC 30/60/90/120 Days, TT in Advance, OA, CAD. | Select Dropdown |
| `Credit Term Days`| Integer | No | Min: 0, Max: 360 days. Default: 90. | Number Input |
| `Shipment Mode` | String | Yes | Options: Sea, Air, Sea-Air, Road. Default: Sea. | Select Dropdown |
| `Delivery Port` | String | No | Discharge / destination sea port or airport. Max: 100 chars. | Text Input |
| `Target Volume Annual` | BigInt | No | Annual capacity commitment in PCS. | Number Input |
| `Standard Lead Days` | Integer | No | Standard production lead time in days. Default: 60. | Number Input |
| `Quality Standard` | String | No | Options: AQL 1.5, AQL 2.5, AQL 4.0. Default: AQL 2.5. | Select Dropdown |
| `Compliance Requirements` | Array | No | Options: BSCI, OEKO-TEX, GOTS, SEDEX, WRAP, ISO 9001, BCI, GRS. | Multi-Select Checkboxes |
| `Buying Agent` | UUID | No | Associated Buying House / Liaison Office (if middle agency exists). | Select Dropdown |
| `Contacts Grid` | Array | No | Dynamic list of role-based contacts (Sourcing, Merchandising, Quality, Finance). | Dynamic Grid Repeater |
| `Sub-Brands Repeater` | Array | No | Associated brand labels (e.g. Divided, Trafaluc). | Dynamic Repeater |
| `Departments Repeater` | Array | No | Production divisions (e.g. Men's Wear, Kids, Denim). | Dynamic Repeater |
| `Product Items Repeater` | Array | No | Authorized garment items with baseline SMV. | Dynamic Repeater |
| `Status` | Boolean | Yes | Default: `Active`. | Toggle Switch |

#### 3.1.2. Business Rules & Edge Cases
- **Rule 1 (Soft Delete & Historical Integrity):** If a Buyer has existing Inquiries, Purchase Orders, or Styles, the Buyer **CANNOT** be hard-deleted. It can only be marked as `Inactive`.
- **Rule 2 (Inactive Behavior):** `Inactive` buyers will not appear in the dropdown when creating a *new* Inquiry or PO, but will continue to render in historical reports.
- **Rule 3 (Duplicate Check):** Adding a buyer with an existing name (case-insensitive and trimmed) returns `422 Unprocessable Entity`.
- **Rule 4 (Independent Company Association):** Nominated Company defines the independent legal and contracting company entity for this buyer.

---

### 3.2. Sub-module: Style Library
Styles are the specific garment designs (e.g., Slim Fit Denim Jeans) assigned to a Buyer.

#### 3.2.1. Field Level Validations
| Field Name | Type | Mandatory | Validation Rules | UI Component |
|---|---|---|---|---|
| `Style No` | String | Yes | Min: 2, Max: 50 chars. Alphanumeric. Unique per Buyer. | Text Input |
| `Buyer_ID` | UUID | Yes | Must exist in `buyers` table and be Active. | Searchable Dropdown |
| `Category` | Enum | Yes | Options: Knit, Woven, Sweater, Denim. | Select Box |
| `Base SMV` | Decimal| No | Must be > 0. Max 2 decimal places (e.g. 15.50). | Number Input |

#### 3.2.2. Business Rules & Edge Cases
- **Rule 1 (Unique Constraint):** Style Number "101" can exist for both "Zara" and "H&M", but cannot exist twice for "Zara". The unique key is a composite of `(Buyer_ID, Style_No)`.

---

### 3.3. Sub-module: Color Library
Global colors used for fabrics and garments.

#### 3.3.1. Field Level Validations
| Field Name | Type | Mandatory | Validation Rules | UI Component |
|---|---|---|---|---|
| `Color Name` | String | Yes | Min: 2, Max: 50 chars. Globally unique. | Text Input |
| `HEX Code` | String | No | Must start with '#' followed by 6 valid hex chars. | Color Picker |

---

### 3.4. Sub-module: Size Library
Standard sizes (e.g., S, M, L or 32, 34, 36).

#### 3.4.1. Field Level Validations
| Field Name | Type | Mandatory | Validation Rules | UI Component |
|---|---|---|---|---|
| `Size Label` | String | Yes | Min: 1, Max: 10 chars. Globally unique. | Text Input |
| `Sort Order` | Integer| Yes | Used for sorting sizes logically in dropdowns (e.g. S=1, M=2, L=3). | Number Input |

---

### 3.5. Sub-module: Production Line Library
The physical layout of the factory where sewing happens.

#### 3.5.1. Field Level Validations
| Field Name | Type | Mandatory | Validation Rules | UI Component |
|---|---|---|---|---|
| `Line Name` | String | Yes | Unique. e.g. "Line-01". | Text Input |
| `Floor No` | String | Yes | e.g. "Ground Floor", "2nd Floor". | Select Box |
| `Max Capacity`| Integer| No | Maximum machine operators. Max: 100. | Number Input |
| `Is_Active` | Boolean| Yes | Default: `Active`. | Toggle Switch |

#### 3.5.2. Business Rules
- **Rule 1 (Tablet Mapping):** When configuring an Android Tablet in Module 01, it must be mapped to an Active `Line_ID`. If a line is marked `Inactive`, the tablet mapped to it will force log out.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1. Performance & Caching
- **Redis Caching:** As Master Data is read frequently but updated rarely, all `GET` API endpoints for Dropdowns must be cached using Redis.
- **Cache Invalidation:** If an Admin updates a Buyer's name, the Redis cache for `buyers_list` must be cleared immediately via Event Listeners.
- **Latency:** API response for Master Data dropdowns must be under **100ms** at the 95th percentile.

### 4.2. Security & Audit Logging
- **Audit Trails:** Every Insert/Update/Delete action must log the `User_ID`, `IP_Address`, `Timestamp`, and the JSON `Changes (Old vs New)` into an `audit_logs` table.

---

## 5. Acceptance Criteria (For QA Team)

- [ ] **AC-01.1:** Creating a Buyer with name "  ZARA  " should trim spaces and save as "ZARA".
- [ ] **AC-01.2:** Creating a Buyer with "ZARA" when "zara" exists returns a `422 Unprocessable Entity` with message "Buyer name already exists."
- [ ] **AC-01.3:** Attempting to delete a Size that is used in `po_breakdowns` fails gracefully with a user-friendly error modal.
- [ ] **AC-01.4:** API `/api/v1/master/lines` returns data from Redis cache within 100ms.

---
*(End of PRD for Module 02)*
