# Global UI/UX Design System & Guidelines
**Role:** Frontend Developer / UI/UX Designer
**Project:** RMG Traceability Software
**Status:** Approved for Implementation

---

## 1. Introduction
The RMG Traceability Software has two completely different user bases: 
1. **Factory Floor Operators** (Sewing, QC, Packing) using 10-inch Android Tablets in harsh, bright environments.
2. **Management & Buyers** (HQ) using high-resolution desktop monitors to view dense analytics.
This document ensures a consistent, accessible, and fast UI across all 12 modules.

---

## 2. Global Design System (TailwindCSS)

### 2.1. Color Palette (SAP Horizon Precision Standard)
We will use a strict, limited color palette to reduce cognitive load and maintain enterprise consistency (strictly aligned with `frontend/src/config/designTokens.ts` and `SRS_Theme_SAP_Horizon_Precision.md`).
- **Primary Brand / Action Color:** Sapphire Blue (`bg-blue-600` / `bg-blue-700` for primary buttons, `text-blue-900` for brand accents). Solid flat colors only. Gradients are strictly prohibited.
- **Surface Canvas:** Light Slate Canvas (`bg-slate-50`) with pure white (`bg-white`) cards and 1px border (`border-slate-200`).
- **Navigation Shell:** Enterprise Slate Dark Navy (`bg-slate-900`).
- **Success (Pass / Complete):** Emerald (`bg-emerald-600` for buttons, `text-emerald-700 bg-emerald-50 border-emerald-200` for badges).
- **Error / Reject (Fail / Defect):** Red (`bg-red-600` for buttons, `text-red-700 bg-red-50 border-red-200` for badges).
- **Warning / Alter (Hold / Pending):** Amber (`bg-amber-600` for buttons, `text-amber-700 bg-amber-50 border-amber-200` for badges).

### 2.2. Typography
- **Font Family:** `Inter` or `Roboto` (sans-serif) for high legibility on small tablet screens.
- **Data Tables:** Must use tabular/monospaced numbers so digits align perfectly vertically.

---

## 3. Tablet-First UI Rules (Factory Floor)
Modules like 04 (Cutting), 06 (Sewing), 07 (QC), 09 (Packing), and 12 (Export) rely heavily on Tablets.

### 3.1. Touch Targets & Accessibility
- **Rule:** ALL clickable elements (Buttons, Dropdowns, Toggles) MUST have a minimum size of **44x44 pixels**. Operators wear gloves or are moving fast; tiny buttons cause misclicks.
- **Spacing:** Use generous padding (`p-4` or `p-6` in Tailwind) around interactive elements.

### 3.2. Extreme Visual Feedback
In a noisy factory, operators might not look closely at the screen.
- **Success Scan:** The screen borders flash Green for 0.5 seconds.
- **Critical Error (e.g., Wrong Buyer Carton):** The ENTIRE SCREEN background turns solid Red, accompanied by a loud siren noise. The operator must physically tap an "Acknowledge" button to dismiss the red screen.

### 3.3. High-Contrast / Dark Mode
- The Export Loading Dock (Module 12) is often under bright sunlight. The UI must support a High-Contrast Dark Mode (White text on Pitch Black background) to ensure readability.

---

## 4. Web Dashboard UI Rules (Management / HQ)
Modules like 01 (Master Data), 02 (Order Mgmt), and BI Analytics.

### 4.1. Data Density
- Use data tables with dense padding (`py-2 px-3`) to show as much information (POs, Quantities, Status) as possible on a single 1080p screen without excessive scrolling.
- Use Sticky Headers for all tables.

### 4.2. Action Placement
- "Create" or "Export" buttons always go on the Top-Right of the page header.
- "Edit" or "Delete" actions go on the far-right column of a data table.

---
*(End of UI/UX Guidelines)*
