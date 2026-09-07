# Software Requirements Specification (SRS)
## Sub-Specification: Enterprise System Bootstrapping & Master Data Seeding Architecture
### প্রজেক্ট: TraceFlow RMG — Precision Fabric-to-Freight Garment Intelligence
**ডকুমেন্ট রেফারেন্স:** `TFRMG-SRS-BOOTSTRAP-V1.0`  
**ডকুমেন্ট ভার্সন:** 1.0 (Tier-1 Enterprise Production Edition)  
**স্ট্যান্ডার্ড কমপ্লায়েন্স:** ISO/IEC/IEEE 29148:2018, SOC 2 Type II (Least Privilege & Zero-Trust Provisioning)  
**মডিউল ম্যাপ:** Module 01 (System Admin & Auth) + Module 02 (Master Data)  
**স্ট্যাটাস:** Approved & Ready for Implementation  

---

## ১. ভূমিকা ও কৌশলগত উদ্দেশ্য (Strategic Objective)

বৃহৎ এন্টারপ্রাইজ গার্মেন্টস ইআরপি সিস্টেমে কারখানা চালু করা (Plant Go-Live), ক্লাউড সিআই/সিডি ডেপ্লয়মেন্ট এবং লোকাল ডেভেলপমেন্টের জন্য প্রাথমিক ডাটা (যেমন: সিস্টেমের রুট সুপার অ্যাডমিন, কোর রোলস, ডট-নোটেশন পারমিশন ক্যাটালগ এবং কারখানার মৌলিক ডেটা) তৈরি ও ব্যবস্থাপনা অত্যন্ত সংবেদনশীল কাজ।

প্রোডাকশন ডাটাবেসে অসাবধানতাবশত `db:seed` বা `migrate:fresh` রান করলে যেন ফ্যাক্টরির রানিং প্রোডাকশন ডাটা মুছে না যায় বা পারমিশন ডুপ্লিকেট না হয়, সেজন্য একটি সুনির্দিষ্ট, নিরাপদ এবং আন্তর্জাতিক এন্টারপ্রাইজ গ্রেড **System Bootstrapping Architecture** সংজ্ঞায়িত করা হলো।

---

## ২. কোর বুটস্ট্র্যাপিং নীতিমালা (Core Principles)

1. **আইডেমপোটেন্সি (Strict Idempotency):**
   - বুটস্ট্র্যাপ সিডার ১ বার রান হোক বা ১০০ বার রান হোক, ডাটাবেসের স্টেট অপরিবর্তিত থাকবে। কোনো ডুপ্লিকেট রোল বা পারমিশন তৈরি হবে না এবং এক্সিস্টিং প্রোডাকশন ডাটা ক্ষতিগ্রস্ত হবে না (`updateOrCreate` / `firstOrCreate` এনফোর্সমেন্ট)।
2. **জিরো-হার্ডকোড ক্রেডেনশিয়ালস (Zero-Hardcoded Secrets Policy):**
   - সিডার কোডের মধ্যে কোনো প্লেইনটেক্সট পাসওয়ার্ড বা ব্যক্তিগত ইমেইল থাকবে না। সমস্ত সিক্রেট এনভায়রনমেন্ট ভ্যারিয়েবল (`.env`) বা এন্টারপ্রাইজ সিক্রেট ম্যানেজার থেকে ডায়নামিকালি ইনজেক্ট হবে।
3. **কনফিগ-ড্রিভেন পারমিশন ক্যাটালগ (Config-Driven Catalog):**
   - সমস্ত পারমিশন কোডবেসের কেন্দ্রীয় কনফিগ অ্যারে (`config/permissions_catalog.php`) থেকে লোড হবে। এটি একক সত্যের উৎস (Single Source of Truth) হিসেবে কাজ করবে।
4. **পরিবেশভিত্তিক ট্রিপল-টিয়ার সেপারেশন (3-Tier Environment Segregation):**
   - **Tier 1 (Kernel Seeds):** সিস্টেমের মৌলিক কাঠামো (Core Roles, 4-tier Permissions, Root Super Admin, Base UOM/Currencies)। প্রোডাকশন, স্টেজিং ও লোকাল সব জায়গায় রান করা বাধ্যতামূলক।
   - **Tier 2 (Enterprise Factory Config Seeds):** অর্গানাইজেশন স্ট্রাকচার, সিস্টার কোম্পানিজ, ফ্যাক্টরি ফ্লোর ও স্ট্যান্ডার্ড ডিফেক্ট লাইব্রেরি।
   - **Tier 3 (Demo / Mock Seeds):** ফেক বায়ার, ডামি পিও ও টেস্ট বান্ডল ডাটা। প্রোডাকশন এনভায়রনমেন্টে এটি এক্সিকিউট হওয়া সম্পূর্ণ নিষিদ্ধ (`App::environment('production')` চেক দ্বারা লকড)।

---

## ৩. ৪-টিয়ার পারমিশন ক্যাটালগ আর্কিটেকচার (Permission Catalog Spec)

### ৩.১ কনফিগ ফাইল স্ট্রাকচার (`config/permissions_catalog.php`)
সিস্টেমের সমস্ত পারমিশন নিচের হাই-লেভেল ট্রি ফরম্যাটে কনফিগার করা থাকবে:

```php
return [
    'modules' => [
        'master_data' => [
            'label' => 'Master Data Management',
            'submodules' => [
                'buyers' => [
                    'label' => 'Buyer Management',
                    'resources' => [
                        'profile' => [
                            'label' => 'Buyer Profile',
                            'actions' => ['view', 'create', 'update', 'delete', 'export'],
                        ],
                        'brands' => [
                            'label' => 'Buyer Brands',
                            'actions' => ['view', 'create', 'update', 'delete'],
                        ],
                    ],
                ],
                'lines' => [
                    'label' => 'Sewing Line Configuration',
                    'resources' => [
                        'setup' => [
                            'label' => 'Line Setup & Capacity',
                            'actions' => ['view', 'create', 'update', 'delete'],
                        ],
                    ],
                ],
            ],
        ],
        'order' => [
            'label' => 'Order Management & Merchandising',
            'submodules' => [
                'merchandising' => [
                    'label' => 'Merchandising & PO',
                    'resources' => [
                        'po' => [
                            'label' => 'Purchase Order',
                            'actions' => ['view', 'create', 'update', 'delete', 'approve', 'reject'],
                        ],
                        'bom' => [
                            'label' => 'Bill of Materials',
                            'actions' => ['view', 'create', 'update', 'lock'],
                        ],
                    ],
                ],
            ],
        ],
        'system_admin' => [
            'label' => 'System Administration',
            'submodules' => [
                'users' => [
                    'label' => 'User Directory',
                    'resources' => [
                        'account' => [
                            'label' => 'User Account',
                            'actions' => ['view', 'create', 'update', 'delete', 'restore', 'force_delete'],
                        ],
                    ],
                ],
                'roles' => [
                    'label' => 'Roles & Permissions',
                    'resources' => [
                        'matrix' => [
                            'label' => 'Permission Matrix',
                            'actions' => ['view', 'update', 'assign'],
                        ],
                    ],
                ],
            ],
        ],
    ],
];
```

---

## ৪. সিস্টেমের প্রাথমিক ডিফল্ট ৩টি কোর রোল (Core Default 3 Roles)

সিস্টেম বুটস্ট্র্যাপের সময় নিচের প্রাথমিক ৩টি রোল স্বয়ংক্রিয়ভাবে তৈরি হবে:

| রোল নাম (`name`) | গার্ড (`guard_name`) | পারমিশন স্কোপ (Permission Scope) | ভূমিকা ও বিবরণ |
|---|---|---|---|
| **`superadmin`** | `web` | `*` (All Privileges via Kernel Gate) | সিস্টেমের সর্বোচ্চ ও একমাত্র একক পার্সোনা যিনি পার্মানেন্ট হার্ড ডিলিট (`force_delete`) করতে পারেন। সম্পূর্ণ আনরেস্ট্রিক্টেড এক্সেস। |
| **`admin`** | `web` | All except `*.force_delete` | ফ্যাক্টরি প্ল্যান্ট অ্যাডমিনিস্ট্রেটর। ইউজার অনবোর্ডিং, সফট ডিলিট, মাস্টার ডাটা এন্ট্রি ও কনফিগারেশন। |
| **`standarduser`** | `web` | `*.view`, `*.create`, `*.update` | সাধারণ ফ্যাক্টরি ও ফ্লোর ইউজার। প্রাত্যহিক প্রোডাকশন ও অপারেশনাল কাজ পরিচালনা। |

---

## ৫. সিস্টেম বুটস্ট্র্যাপের প্রাথমিক ৩টি ইউজার (Default 3 System Users)

সিস্টেমের প্রাথমিক সেটআপে নিচের ৩টি ডিফল্ট ইউজার তৈরি হবে:

| নং | ইউজারনেম (`username`) | নাম (`name`) | এমপ্লয়ী আইডি (`emp_id`) | অ্যাসাইন্ড রোল (`role`) | প্রাথমিক পাসওয়ার্ড |
|---|---|---|---|---|---|
| ১ | **`superadmin`** | Super Administrator | `AWL-ADM-0001` | **`superadmin`** | `SuperAdmin#2026!` |
| ২ | **`admin`** | Plant Administrator | `AWL-ADM-0002` | **`admin`** | `Admin#2026!` |
| ৩ | **`standarduser`** | Standard User | `AWL-STD-0003` | **`standarduser`** | `Standard#2026!` |

### ৫.১ সিক্রেট এনভলপ কনফিগারেশন (`.env`)
```env
# System Bootstrap Default Accounts
SYSTEM_SUPERADMIN_USERNAME="superadmin"
SYSTEM_SUPERADMIN_PASSWORD="SuperAdmin#2026!"

SYSTEM_ADMIN_USERNAME="admin"
SYSTEM_ADMIN_PASSWORD="Admin#2026!"

SYSTEM_STANDARDUSER_USERNAME="standarduser"
SYSTEM_STANDARDUSER_PASSWORD="Standard#2026!"
```

### ৫.২ নিরাপত্তা ও ফাস্ট-লগইন বাধ্যবাধকতা
- রুট সুপার অ্যাডমিন ইউজারের জন্য ডাটাবেসে `must_change_password = true` ফ্ল্যাগ থাকবে।
- প্রথমবার সিস্টেমে প্রবেশের পর তিনি পাসওয়ার্ড পরিবর্তন না করা পর্যন্ত সিস্টেমের কোনো ফিচারে প্রবেশ করতে পারবেন না।
- ইউজারটিকে স্বয়ংক্রিয়ভাবে `Super Admin` রোলে অ্যাসাইন করা হবে।

---

## ৬. বুটস্ট্র্যাপ সিডার এক্সিকিউশন অর্ডার ও ক্লাস হায়ারার্কি

```mermaid
graph TD
    A[php artisan db:seed / erp:bootstrap] --> B[DatabaseSeeder]
    
    subgraph Tier 1: Kernel Mandatory Seeds
        B --> C[PermissionCatalogSeeder]
        C --> D[CoreRoleSeeder]
        D --> E[RootSuperAdminSeeder]
    end
    
    subgraph Tier 2: Factory Enterprise Setup
        B --> F[CompanyOrganizationSeeder]
        F --> G[StandardUomAndCurrencySeeder]
        G --> H[DefectCodeLibrarySeeder]
    end
    
    subgraph Tier 3: Local Dev Only
        B --> I{App::isProduction()?}
        I -->|Yes| J[Skip Mock Data]
        I -->|No| K[DemoFactoryDataSeeder]
    end
```

### ৬.১ সিডার ক্লাস রেসপন্সিবিলিটি:
1. **`PermissionCatalogSeeder`**:
   - `config/permissions_catalog.php` থেকে নেস্টেড অ্যারে রিড করে।
   - প্রতিটি অ্যাকশনকে ৪-টিয়ার স্ট্রিংয়ে রূপান্তর করে (`module.submodule.resources.action`)।
   - `Permission::firstOrCreate()` দিয়ে `module_name`, `submodule_name`, `resource_name`, `action_name` সহ ইনসার্ট করে।
2. **`CoreRoleSeeder`**:
   - টেবিল `roles`-এ সিস্টেম রোলগুলো তৈরি করে (`firstOrCreate(['slug' => ...])`)।
   - নির্দিষ্ট রোলগুলোতে প্রি-ডিফাইন্ড পারমিশন অ্যাসাইন করে।
3. **`RootSuperAdminSeeder`**:
   - `.env` চেক করে রুট ইউজারের অস্তিত্ব নিশ্চিত করে।
   - ইউজার তৈরি করে `Super Admin` রোল যুক্ত করে।
4. **`DatabaseSeeder`**:
   - উপরের সমস্ত সিডারকে ক্রমানুসারে কল করার কেন্দ্রীয় মাস্টার পাইপলাইন।

---

## ৭. ডেডিকেটেড সিআই/সিডি বুটস্ট্র্যাপ কমান্ড (Artisan Command Spec)

প্রোডাকশন সার্ভারে কনফিউশনবিহীন ডেপ্লয়মেন্টের জন্য একটি ডেডিকেটেড আর্টিসান কমান্ড প্রদান করা হবে:

```bash
php artisan erp:bootstrap
```

### কমান্ডটির কাজের ধাপ:
1. **Validation**: বর্তমান ডেটাবেস কানেকশন যাচাই (`PostgreSQL 17`).
2. **Migration**: পেন্ডিং মাইগ্রেশন নিরাপদে সম্পন্ন করা (`migrate --force`).
3. **Permissions Sync**: পারমিশন ক্যাটালগ নতুন কোনো পারমিশন থাকলে তা সিঙ্ক করা (Delete বা Drop ছাড়া)।
4. **Role Sync**: কোর রোলসমূহ যাচাই ও নতুন পারমিশন ম্যাপ করা।
5. **Super Admin Check**: রুট এডমিন উপস্থিত না থাকলে তৈরি করা।
6. **Cache Invalidation**: Redis ক্যাশ ফ্লাশ করা যাতে এপিআই গেটওয়ে তাৎক্ষণিক নতুন পারমিশন লোড করতে পারে।

---
*(এন্টারপ্রাইজ সিস্টেম বুটস্ট্র্যাপিং স্পেসিফিকেশন সমাপ্ত)*
