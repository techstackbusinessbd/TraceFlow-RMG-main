# UI/UX Guidelines - ENTERPRISE READY (Superseded)
**Author:** Frontend/Android Developer  
**Status:** Superseded by [SRS_Enterprise_UI_UX_And_Admin_Panel.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/SRS_Enterprise_UI_UX_And_Admin_Panel.md) and [SRS_Theme_SAP_Horizon_Precision.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/SRS_Theme_SAP_Horizon_Precision.md)

> [!NOTE]
> This legacy brief stub is superseded. Please refer directly to the comprehensive master specifications:
> - **Theme & Palette:** [SRS_Theme_SAP_Horizon_Precision.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/SRS_Theme_SAP_Horizon_Precision.md)
> - **Web Architecture & Shell:** [SRS_Enterprise_Web_Interface_Architecture.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/SRS_Enterprise_Web_Interface_Architecture.md)
> - **Multi-Device / Tablet Floor:** [Multi_Device_UI_UX_Dashboard_Spec.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/Multi_Device_UI_UX_Dashboard_Spec.md)

## 1. Factory Floor Tablet UI (React/Android)
- **Theme:** Dark mode by default to reduce battery consumption and eye strain on the factory floor.
- **Buttons:** Extra large touch targets (min 48x48dp) for operators wearing gloves or working fast.
- **Indicators:** Prominent Offline/Online indicator at the top right.

## 2. Admin Web Panel (React/Tailwind)
- **Data Tables:** Server-side pagination, global search, and export to Excel/CSV via centralized `<DataTable<T>>`.
- **Charts:** Use Recharts or Chart.js for real-time DHU and Efficiency rendering.
