# Permission Matrix & Hierarchy Strategy
**Role:** Solution Architect / Database Engineer  
**Project:** RMG Traceability Software  
**Standard:** 4-Tier Dot Notation (`module.submodule.resources.action`)  
**Status:** Approved for Implementation  

---

## 1. Introduction
In an enterprise ERP, controlling access is not just about "Admin vs User". Access must be granular down to specific Modules, Submodules, Data Resources, and specific Actions. This document defines the Database Schema modifications, Migration, and strict **4-Tier Dot Notation Standard** for Permissions to make them manageable via the Admin Panel UI and API middleware.

---

## 2. Mandatory 4-Tier Dot Notation Standard

All permissions in the system MUST strictly adhere to the 4-tier dot-notation format:

$$\mathbf{\langle module\rangle.\langle submodule\rangle.\langle resources\rangle.\langle action\rangle}$$

### 2.1. Segment Definitions
1. **Module (`module`):** The primary domain engine (e.g., `master_data`, `order`, `cutting`, `sewing`, `qc`, `finishing`, `packing`, `warehouse`, `system_admin`, `export_bi`).
2. **Submodule (`submodule`):** The functional sub-area (e.g., `buyers`, `suppliers`, `merchandising`, `planning`, `bundling`, `line_tracking`, `end_line`, `users`).
3. **Resource (`resources`):** The target business entity or screen (e.g., `profile`, `po`, `bom`, `ticket`, `bundle`, `defect`, `account`, `roll`).
4. **Action (`action`):** The standard operation (e.g., `view`, `create`, `update`, `delete`, `restore`, `force_delete`, `approve`, `reject`, `export`, `scan`, `pin`).

### 2.2. Standard Examples Across Domains

| Module | Submodule | Resource | Action | Complete Permission String (`name`) | Description |
|---|---|---|---|---|---|
| `master_data` | `buyers` | `profile` | `view` | `master_data.buyers.profile.view` | View buyers list and profile details |
| `master_data` | `buyers` | `profile` | `create` | `master_data.buyers.profile.create` | Create new buyer profile |
| `master_data` | `buyers` | `profile` | `update` | `master_data.buyers.profile.update` | Update existing buyer details |
| `master_data` | `buyers` | `profile` | `delete` | `master_data.buyers.profile.delete` | Soft delete buyer |
| `order` | `merchandising` | `po` | `approve` | `order.merchandising.po.approve` | Approve Buyer Purchase Order |
| `cutting` | `bundling` | `ticket` | `generate` | `cutting.bundling.ticket.generate` | Generate Master & Child QR bundle tickets |
| `sewing` | `line_tracking` | `bundle` | `scan_in` | `sewing.line_tracking.bundle.scan_in` | Scan-in bundle at sewing line entry |
| `qc` | `end_line` | `defect` | `pin` | `qc.end_line.defect.pin` | Pin defect on anatomical SVG body map |
| `system_admin` | `users` | `account` | `force_delete` | `system_admin.users.account.force_delete` | Permanent purge user account (Super Admin) |

---

## 3. Database Hierarchy (Extending Spatie)

By default, the `permissions` table in Spatie is flat. To provide high-performance tree aggregation for the Admin Panel Role Management UI, we extend the table with 4 discrete breakdown columns.

### 3.1. Migration Schema Definition

```php
Schema::create('permissions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name', 120)->unique(); // Complete dot-notation: e.g. 'master_data.buyers.profile.create'
    $table->string('guard_name', 50)->default('web');
    
    // Discrete Segmentation for Fast Grouping & Tree Construction
    $table->string('module_name', 60);      // e.g. 'master_data'
    $table->string('submodule_name', 60);   // e.g. 'buyers'
    $table->string('resource_name', 60);    // e.g. 'profile'
    $table->string('action_name', 60);      // e.g. 'create'
    $table->string('description', 255)->nullable();
    
    $table->timestamps();

    // Indexes
    $table->index(['module_name', 'submodule_name', 'resource_name'], 'idx_permissions_hierarchy');
    $table->index('name', 'idx_permissions_name');
});
```

---

## 4. Admin Panel UI Mapping & Dynamic Tree Generation

When the Super Admin or IT Lead opens the **Role & Permission Management** screen, the API queries and structures the permissions into a hierarchical JSON tree:

### 4.1. API Tree Response Structure
```json
{
  "master_data": {
    "label": "Master Data Management",
    "submodules": {
      "buyers": {
        "label": "Buyer Management",
        "resources": {
          "profile": {
            "label": "Buyer Profile",
            "actions": [
              { "name": "master_data.buyers.profile.view", "label": "View" },
              { "name": "master_data.buyers.profile.create", "label": "Create" },
              { "name": "master_data.buyers.profile.update", "label": "Update" },
              { "name": "master_data.buyers.profile.delete", "label": "Delete" }
            ]
          }
        }
      }
    }
  }
}
```

### 4.2. UI Accordion Tree
```text
▼ [✓] Master Data Management (Module)
    ▼ [✓] Buyer Management (Submodule)
        ▼ Buyer Profile (Resource)
            [✓] View   [✓] Create   [✓] Update   [ ] Delete
```

---

## 5. Middleware & Frontend Usage

### 5.1. Backend Controller / Route Protection
```php
Route::post('/buyers', [BuyerController::class, 'store'])
    ->middleware('permission:master_data.buyers.profile.create');
```

### 5.2. Frontend Action Authorization Component
```tsx
<HasPermission permission="master_data.buyers.profile.create">
  <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
    Create Buyer
  </Button>
</HasPermission>
```

---
*(End of Permission Matrix Strategy)*
