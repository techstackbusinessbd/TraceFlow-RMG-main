# API Specification & Schema Details (SUPERSEDED)
**Module:** 07 - Sewing  
**Status:** ⚠️ SUPERSEDED by [API_Spec_07_Sewing.md](file:///g:/ERP/TraceFlow-RMG-main/docs/02_Solution_Architect/API_Spec_07_Sewing.md)

> [!WARNING]
> This brief stub is superseded by the V4.1 Single-Piece Tracking Specification.
> Use: 📄 [API_Spec_07_Sewing.md](file:///g:/ERP/TraceFlow-RMG-main/docs/02_Solution_Architect/API_Spec_07_Sewing.md)

### Table: `sewing_transactions`
- `id` UUID PK
- `bundle_id` UUID FK
- `line_id` UUID FK
- `operation_type` Enum (Input, Output)
- `scanned_at` Timestamp

### API Endpoints
`POST /api/v1/sewing/scan`
Payload:
```json
{
  "line_id": "uuid",
  "scans": [
    {"qr": "BNDL-001", "type": "Input", "time": "2026-08-28T10:00:00"}
  ]
}
```
