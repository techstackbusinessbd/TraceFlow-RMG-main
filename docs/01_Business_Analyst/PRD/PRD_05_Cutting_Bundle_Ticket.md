# Product Requirements Document (PRD) (SUPERSEDED)
**Module:** 05 - Cutting & Bundle Ticket  
**Status:** ⚠️ SUPERSEDED by [PRD_05_Cutting.md](file:///g:/ERP/TraceFlow-RMG-main/docs/01_Business_Analyst/PRD_05_Cutting.md)

> [!WARNING]
> Version 2.0 has been upgraded to Single-Piece Sub-QR Traceability Architecture (V4.1).
> Use: 📄 [PRD_05_Cutting.md](file:///g:/ERP/TraceFlow-RMG-main/docs/01_Business_Analyst/PRD_05_Cutting.md)

## 1. Executive Summary
This is where Traceability physically begins. The cutting room cuts fabric based on the IE plan and generates unique QR Codes for every bundle. These QR codes act as the digital passport for the garments.

## 2. User Personas
- **Cutting Master:** Enters cut details, ply count, and shade.
- **Barcode Operator:** Prints bundle tickets.

## 3. User Stories
- **US04-01:** As a Cutting Master, I want to input the number of plies and table length so the system calculates the cut quantity.
- **US04-02:** As a Cutting Master, I want to specify the Shade Band (e.g., A, B, C) for the cut so that color shading issues are tracked.
- **US04-03:** As a Barcode Operator, I want the system to automatically generate bundles of a specific ratio (e.g., 50 pcs per bundle) and generate printable QR code PDFs.

## 4. Functional Requirements
### 4.1. Excess Cutting Logic
- Factories often cut 2-3% extra for rejections.
- System must allow `Cut Qty > PO Qty`.
- Formula: `Variance % = ((Total Cut - PO Breakdown Qty) / PO Breakdown Qty) * 100`.
- If Variance > 5%, Manager override/approval is required.

### 4.2. Bundle Generation Rule
- If Cut Qty = 120 and Bundle Size = 50.
- System generates: Bundle 1 (50 pcs), Bundle 2 (50 pcs), Bundle 3 (20 pcs).
- Bundle ID format: `{PO_ID}-{Cut_No}-{Size}-{Bundle_Serial}`

## 5. Non-Functional Requirements
- QR Code generation library must support bulk PDF creation (e.g., 500 tags per page) without crashing the server. Queue jobs (Redis) must be used.

## 6. Acceptance Criteria
- [ ] **AC1:** Scanning a generated QR code with any standard scanner resolves to the correct UUID in the system.
- [ ] **AC2:** Attempting to cut 10% excess without manager approval blocks the save action.
