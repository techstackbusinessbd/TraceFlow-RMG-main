# Product Requirements Document (PRD) (SUPERSEDED)
**Module:** 08 - Quality Control  
**Status:** ⚠️ SUPERSEDED by [PRD_08_QC.md](file:///g:/ERP/TraceFlow-RMG-main/docs/01_Business_Analyst/PRD_08_QC.md)

> [!WARNING]
> This brief stub is superseded by Version 4.0 Detailed QC Edition.
> Use: 📄 [PRD_08_QC.md](file:///g:/ERP/TraceFlow-RMG-main/docs/01_Business_Analyst/PRD_08_QC.md)

## 1. Executive Summary
Defect tracking at the end of the sewing line. Logs DHU (Defect Hundred Units).

## 2. Functional Requirements
- **DHU Formula:** `(Total Defects / Total Inspected) * 100`.
- **Rework Loop:** A bundle marked with "Alter" cannot proceed to Washing. It must be fixed and re-scanned as "Pass".
- **Defect Library:** Dropdown of standard defects (e.g. Broken Stitch, Puckering, Oil Spot).

## 3. Acceptance Criteria
- [ ] Auto-calculates DHU real-time on tablet.
