# Tablet UI Specifications (Superseded)
**Role:** Frontend / Android Developer  
**Status:** Superseded by [Multi_Device_UI_UX_Dashboard_Spec.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/Multi_Device_UI_UX_Dashboard_Spec.md)

> [!NOTE]
> For the comprehensive production specification of floor tablets, scanning ergonomics, and offline SQLite sync, please refer to:
> 📄 [Multi_Device_UI_UX_Dashboard_Spec.md](file:///g:/ERP/TraceFlow-RMG-main/docs/04_Frontend_Developer/Multi_Device_UI_UX_Dashboard_Spec.md)

## 1. Factory Floor UI/UX
- **Dark Theme:** Mandatory to save battery and reduce eye strain in low-light factory floors.
- **Touch Targets:** Minimum 48x48 dp for all interactive elements (buttons, inputs) because operators wear gloves.
- **Colors:** Use High-Contrast colors.
  - Green (#4CAF50): Success/Pass
  - Red (#F44336): Reject/Error
  - Orange (#FF9800): Alter/Warning

## 2. Hardware Integration
- Must integrate with Zebra / Honeywell physical barcode scanners (Keyboard wedge mode).
- Focus must auto-return to the scanning input field after every scan.
