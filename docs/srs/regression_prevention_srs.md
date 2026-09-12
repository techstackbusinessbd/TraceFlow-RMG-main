# RMG TraceFlow ERP — Regression Prevention & Non-Destructive Engineering SRS
**Standard:** ISO/IEC/IEEE 29148:2018 Systems and Software Engineering — Requirements Engineering  
**Project:** TraceFlow RMG — Woven Garments Traceability Software  
**Version:** 1.0 (Immutable Master Standard)  
**Governance:** Strict Engineering Policy for Antigravity AI Assistant & Project Engineers  

---

## 1. Executive Summary & Purpose

### 1.1 The Core Problem
In rapid feature iteration and bug-fixing, new code changes often introduce **regressions**—breaking existing features, altering established layouts, removing working logic, or mutating centralized contracts. In an enterprise ERP/Traceability environment, breaking a completed master setup (e.g., Auth, RBAC, Navigation Rail, Master Data, Design Tokens) disrupts operations across multiple factory departments.

### 1.2 The Immutable Prime Directive
> **"Never break, rewrite, or degrade previously completed, tested, and approved features while implementing new tasks or fixes. Existing functionality is strictly backward-compatible and immutable unless explicit modification is requested."**

---

## 2. Strict Engineering Governance Principles

### Principle 1: Blast Radius Isolation
* Every code modification must have a minimal, surgical blast radius.
* Never rewrite an entire file or component when a localized patch satisfies the requirement.
* If a new task requires modifying a shared component (e.g., `NavigationRail.tsx`, `designTokens.ts`, `AppLauncherModal.tsx`, `DataTable.tsx`), all existing consumers and props must remain 100% functional.

### Principle 2: Zero Regression Verification (Pre-Flight & Post-Flight)
Before declaring any task complete:
1. **Source Integrity Check**: Inspect git diff (`git status`, `git diff`) to verify only files related to the requested task were touched.
2. **Type-Safety & Build Verification**: Run `npm run build` in `frontend/` to confirm zero TypeScript compile errors (`tsc -b`) and successful bundling.
3. **Existing Feature Sanity**: Verify that previously completed features in the same component remain functional.

### Principle 3: Dedicated Page vs Modal Standard (No Regression on Architecture)
* All CRUD workflows (Create, Read, Update, List) MUST remain full dedicated pages with proper breadcrumb and back navigation.
* Never degrade a dedicated page into a modal or inline drawer, nor vice versa, without explicit product owner direction.

### Principle 4: Design Token Immutability
* Never remove, rename, or arbitrarily alter existing tokens in `designTokens.ts` (`UI_TOKENS`).
* If a new visual state or variant is needed, append a new token or extend cleanly without mutating existing token definitions that other screens depend on.

### Principle 5: Auto-Generated Entity Code Preservation
* The standard for system auto-generated codes (with mandatory Company Short Code prefix) and manual `emp_id` exception must never be bypassed in any new entity, migration, or controller.

---

## 3. Functional Requirements (FR) for New Task Implementation

### FR-01: Baseline Audit Before Modification
* **Requirement**: Before modifying any shared component, configuration file, or layout wrapper, the engineer/AI MUST first read the entire file or target section to understand the complete context and existing features.
* **Failure Condition**: Changing lines of code based on assumptions without checking existing state, props, or side-effects.

### FR-02: Surgical Editing Standard
* **Requirement**: Use localized block replacement tools (`replace_file_content` / `multi_replace_file_content`).
* **Restriction**: Total file overwrite (`Overwrite: true` on `write_to_file`) is strictly forbidden on existing codebase components unless creating a brand-new file from scratch.

### FR-03: Backward Compatibility Guarantee
* **Requirement**: When adding new props, hooks, or state variables to existing components:
  1. All new props must be optional with sensible defaults.
  2. Existing function signatures and return types must not be broken.
  3. Existing interfaces (`NavModule`, `ColumnDef`, `ButtonProps`, etc.) must remain compatible.

### FR-04: Mandatory Pre-Completion Build & Lint Gate
* **Requirement**: After every code modification turn:
  1. Automated build validation (`npm run build`) must pass with code 0.
  2. No unused imports, broken types, or orphan variables can be left behind.

---

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement Description |
| :--- | :--- | :--- |
| **NFR-01** | **Reliability** | Zero regressions on all Sprint 1 completed modules (Auth, RBAC, Users, Companies, Buyers, Size Scales, Colors, Navigation). |
| **NFR-02** | **Maintainability** | Clean separation of concerns. New module code (e.g. Module 03 Merchandising) must live in its dedicated feature folder without polluting global wrappers. |
| **NFR-03** | **Consistency** | 100% adherence to `designTokens.ts`, `<PageHeader>`, `<FilterToolbar>`, and `<DataTable<T>>` golden layouts. |
| **NFR-04** | **Auditability** | Every file modification must clearly describe why the change was made and why it will not impact existing modules. |

---

## 5. Verification & Acceptance Checklist

Every future task prompt executed by the AI assistant MUST pass this mandatory checklist:

- [ ] **Step 1 (Read & Understand)**: Did I read the target file and understand its current dependencies before making changes?
- [ ] **Step 2 (Scope Control)**: Are my edits restricted ONLY to what the user explicitly requested?
- [ ] **Step 3 (Token Preservation)**: Did I use existing `UI_TOKENS` without mutating or deleting existing styling tokens?
- [ ] **Step 4 (Type & Build Check)**: Did `npm run build` succeed with zero errors?
- [ ] **Step 5 (Regression Check)**: Did I verify that surrounding features, buttons, or layouts were not degraded, overlapped, or broken?
