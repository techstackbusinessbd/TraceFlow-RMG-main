# API Specification & Schema Details (SUPERSEDED)
**Module:** 11 - Store  
**Status:** ⚠️ SUPERSEDED by [API_Spec_11_Store.md](file:///g:/ERP/TraceFlow-RMG-main/docs/02_Solution_Architect/API_Spec_11_Store.md)

> [!WARNING]
> This brief stub is superseded by the V4.0 Warehouse & Inventory Specification.
> Use: 📄 [API_Spec_11_Store.md](file:///g:/ERP/TraceFlow-RMG-main/docs/02_Solution_Architect/API_Spec_11_Store.md)

### Table: `inventory`
- `id` UUID PK
- `item_code` String
- `balance` Decimal
- `allocated_po_id` UUID FK
