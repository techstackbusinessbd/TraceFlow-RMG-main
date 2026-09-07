# API Specification & Schema Details (SUPERSEDED)
**Module:** 08 - QC  
**Status:** ⚠️ SUPERSEDED by [API_Spec_08_QC.md](file:///g:/ERP/TraceFlow-RMG-main/docs/02_Solution_Architect/API_Spec_08_QC.md)

> [!WARNING]
> This brief stub is superseded by the V4.0 Single-Piece QC & Defect Logging Specification.
> Use: 📄 [API_Spec_08_QC.md](file:///g:/ERP/TraceFlow-RMG-main/docs/02_Solution_Architect/API_Spec_08_QC.md)

### Table: `qc_inspections`
- `id` UUID PK
- `bundle_id` UUID FK
- `status` Enum (Pass, Alter, Reject)
- `dhu` Decimal

### API Endpoints
`POST /api/v1/qc/inspect`
Payload:
```json
{
  "bundle_id": "uuid",
  "pass_qty": 48,
  "defects": [{"type": "Stitch", "qty": 2}]
}
```
