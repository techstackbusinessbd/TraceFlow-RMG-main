# Frontend Component Architecture (Reference Summary)
**Role:** Frontend / Android Developer  
**Status:** Approved for Implementation  
**Master Architectural References:**
- **Navigation & Shell:** [Navigation_Architecture_Strategy.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/Navigation_Architecture_Strategy.md)
- **Design Tokens:** [Design_System_Tokens.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/Design_System_Tokens.md)
- **Theme SRS:** [SRS_Theme_SAP_Horizon_Precision.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/SRS_Theme_SAP_Horizon_Precision.md)

## 1. Directory Structure
```text
/src
  /components     (Reusable UI components: Buttons, Modals)
  /features       (Module-specific logic: Sewing, QC)
  /services       (Axios API calls)
  /store          (Zustand/Redux state management)
```

## 2. Offline-First Architecture (Critical)
- **Local Database:** Android tablets must use SQLite / LocalForage to store today's allocated bundles.
- **Sync Logic:** If `navigator.onLine` is false, save scans locally with `sync_status = pending`.
- **Background Sync:** Use Service Workers / WorkManager to push data in bulk when Wi-Fi connects.

## 3. API Integration
- Use `Axios` interceptors to inject the Bearer Token automatically.
- Handle 401 Unauthorized by auto-redirecting to Login screen.
