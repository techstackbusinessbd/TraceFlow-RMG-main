# Software Requirements Specification (SRS)
## Human-Centric, Easy-Readable & Zero-Confusion UI/UX Text Standard
**Project:** TraceFlow RMG — Woven Garments Traceability & Manufacturing ERP  
**Module:** Enterprise UI/UX Text, Microcopy & Content Architecture  
**Document ID:** SRS-UIUX-TEXT-002  
**Status:** Approved & Final Specification  
**Language Standard:** 100% English for all UI copy (Conversations & Internal Plans in Bengali)  
**Core Goal:** 100% Zero-Confusion, Action-Oriented, Human-Readable Text across Web & Tablet Screens  

---

## ১. ভূমিকা ও উদ্দেশ্য (Introduction & Objectives)

TraceFlow RMG সিস্টেমে মার্চেন্ডাইজার, কমার্শিয়াল অফিসার, কাটিং মাস্টার, ফ্লোর সুপারভাইজার এবং কোয়ালিটি কন্ট্রোলাররা দ্রুত সিদ্ধান্ত নেন। কারখানার উচ্চ-গতির পরিবেশে বিভ্রান্তিকর টেক্সট, অস্পষ্ট কোড বা প্রযুক্তিগত জার্গন ব্যবহারের ফলে বিপুল আর্থিক ক্ষতি ও প্রোডাকশন বিলম্ব ঘটতে পারে।

এই SRS-এর উদ্দেশ্য হলো:
1. **Zero-Confusion Guarantee:** ইন্টারফেসের কোনো লেখাই যেন দ্ব্যর্থবোধক, অস্পষ্ট বা বিভ্রান্তিকর না হয়।
2. **Human-Readable Plain English:** ডাটাবেস কলামের টেকনিক্যাল নাম (যেমন: `created_at`, `uuid`, `is_active`) সরাসরি UI-তে নিষিদ্ধ।
3. **Action-Oriented Microcopy:** ব্যবহারকারী একটি বাটন বা লিঙ্কে ক্লিক করলে কি ঘটবে তা যেন বোতামের নাম পড়েই নিশ্চিত হওয়া যায়।

---

## ২. মূল লেখার মূলনীতি (Core Microcopy Principles)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Zero-Confusion UI Writing Matrix                         │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ Principle         │ Rule & Example                                          │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 1. Direct & Lean  │ অপ্রয়োজনীয় ভূমিকা বা ফিল্টার শব্দ বাদ দিয়ে সরাসরি বলা।  │
│                   │ ❌ "Please provide the value for buyer name here"       │
│                   │ ✅ "Buyer Name" / Placeholder: "e.g., H&M Hennes"       │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 2. Plain Domain   │ টেকনিক্যাল ডিবি ফিল্ড না লিখে কারখানার স্বাভাবিক শব্দ:    │
│    English        │ ❌ "uuid_hash" ➔ ✅ "Reference Code"                     │
│                   │ ❌ "created_at" ➔ ✅ "Created On"                        │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 3. Explicit Action│ বাটন টেক্সট দেখলেই কাজ স্পষ্ট হতে হবে:                   │
│                   │ ❌ "Submit", "Process", "Do Action"                     │
│                   │ ✅ "Save Changes", "Approve Order", "Reject Roll"        │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 4. Clear Consequence│ কনফার্মেশন মেসেজে সুনির্দিষ্ট ফলাফল ও নাম থাকতে হবে:   │
│                   │ ❌ "Are you sure to delete this entity from DB?"        │
│                   │ ✅ "Delete Buyer 'Zara Sourcing'? This cannot be undone"│
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## ৩. নিষিদ্ধ বনাম বাধ্যতামূলক UI টেক্সট ম্যাপিং (Prohibited vs Mandatory)

| ইন্টারফেস উপাদান | ❌ নিষিদ্ধ ও বিভ্রান্তিকর টেক্সট (Prohibited) | ✅ বাধ্যতামূলক স্পষ্ট টেক্সট (Mandatory Standard) | কেন এটি বাধ্যতামূলক? |
| :--- | :--- | :--- | :--- |
| **Login Input** | *"Enter credential or unique system key"* | *"Employee ID or Email"* | সরাসরি বোঝা যায় কি টাইপ করতে হবে। |
| **Login Action** | *"Authenticate Session"*, *"Submit"* | *"Sign In"* | আন্তর্জাতিক সার্বজনীন স্ট্যান্ডার্ড। |
| **Primary Action** | *"Process"*, *"Execute"*, *"Go"* | *"Create Buyer"*, *"Issue Fabric"*, *"Approve Lay"* | ভুল ক্লিকের কোনো সুযোগ থাকে না। |
| **Save / Edit** | *"Persist Changes to DB"* | *"Save Changes"* | সাধারণ ও দ্ব্যর্থহীন। |
| **Cancel Action** | *"Abort"*, *"Kill"* | *"Discard"* অথবা *"Cancel"* | বিনম্র ও স্পষ্ট। |
| **Delete Action** | *"Purge"*, *"Drop Entity"* | *"Delete"* অথবা *"Delete Supplier"* | ডেস্ট্রাক্টিভ অ্যাকশন সম্পর্কে স্পষ্ট সচেতনতা। |
| **Status (Draft)** | *"Uncommitted State"* | *"Draft"* | ওডু/এসএপি সার্বজনীন স্ট্যাটাস। |
| **Status (Active)** | *"Flag 1"*, *"True"* | *"Active"* | স্পষ্ট দৃশ্যমানতা। |
| **Status (Hold)** | *"Suspended Pipeline"* | *"On Hold"* | ফ্যাক্টরি ফ্লোরের স্বাভাবিক পরিভাষা। |
| **Empty State** | *"0 results found for query"* | *"No fabrics received yet. Click 'Receive Fabric' to start."* | বর্তমান অবস্থা এবং পরবর্তী পদক্ষেপ দুটোই বলা থাকে। |
| **Auto Code Field** | ইউজারকে কোড টাইপ করতে বলা | *"AWL-STY-2026-0001"* সাথে `System Auto` ব্যাজ | অপারেটর বোঝে যে এটি সিস্টেম নিজে দিয়েছে। |

---

## ৪. এরর ও নোটিফিকেশন মেসেজ স্ট্যান্ডার্ড (Zero-Confusion Error Messages)

সার্ভার-সাইড ভ্যালিডেশন এবং সিস্টেম এরর মেসেজ কোনো অবস্থাতেই ডেভেলপার ব্যাকট্রেস বা কোড প্রদর্শন করবে না:

### ৪.১. ফর্ম ভ্যালিডেশন এরর (HTTP 422 Server-Side Response)
* ❌ **ভুল ও বিভ্রান্তিকর:**
  * *"Validation failed on regex `^[A-Z]{3}-[0-9]+$` on attribute style_code."*
  * *"Field is required."* (কোন ফিল্ড তা স্পষ্ট নয়)
* ✅ **সঠিক ও বোধগম্য:**
  * *"Style Code must be in the format AWL-STY-001."*
  * *"Buyer Name is required. Please enter a valid name."*
  * *"Phone number must contain at least 10 digits."*

### ৪.২. বিজনেস লজিক ও প্রসেস এরর
* ❌ **ভুল ও বিভ্রান্তিকর:**
  * *"Integrity constraint violation: foreign key roll_id failed on allocation."*
* ✅ **সঠিক ও বোধগম্য:**
  * *"Cannot issue Roll #AWL-RL-042: This roll has not passed 4-Point QC inspection yet."*
  * *"Cannot delete Style 'AWL-STY-102': This style has active cutting orders."*

### ৪.৩. সাকসেস টোস্ট মেসেজ (Positive Feedback)
* ❌ **ভুল ও বিভ্রান্তিকর:**
  * *"200 OK: Record saved successfully to PostgreSQL."*
* ✅ **সঠিক ও বোধগম্য:**
  * *"Fabric Roll AWL-RL-0092 received successfully."*
  * *"Order AWL-ORD-2026-0012 confirmed and sent to Planning."*

---

## ৫. ডোমেন অনুযায়ী ফিল্ড লেবেলিং স্ট্যান্ডার্ড (Domain Terminology)

### ৫.১. মার্চেন্ডাইজিং ও মাস্টার ডাটা (Merchandising & Master Data)
* `Buyer Code`: সিস্টেম জেনারেটেড কোড (`AWL-BYR-001`), কখনো শুধু `Code` বা `ID` নয়।
* `Buyer Name`: প্রতিষ্ঠানের আনুষ্ঠানিক নাম (e.g. `H&M Hennes & Mauritz`).
* `Buyer Brand`: বায়ারের সাব-ব্র্যান্ড (e.g. `Divided`, `H&M Man`).
* `Order Code`: ইন্টারনাল ট্রেসিবিলিটি নম্বর (`AWL-ORD-2026-0001`).
* `Buyer PO Number`: বায়ারের অফিসিয়াল পারচেজ অর্ডার নম্বর (e.g. `PO-994821`).
* `Base SMV`: স্ট্যান্ডার্ড মিনিট ভ্যালু (`e.g. 14.50 min`).

### ৫.২. ফেব্রিক ওয়্যারহাউস ও রোল ইনস্পেকশন (Fabric Warehouse & QC)
* `Roll Barcode`: রোলের গায়ের বারকোড আইডি (`AWL-RL-26-00918`).
* `Shade Group`: লট শেড ব্যান্ড (e.g. `Shade A (Center)`, `Shade B (Edge)`).
* `Inspected Length`: পরীক্ষাকৃত কাপড়ের দৈর্ঘ্য (`e.g. 120.5 yds`).
* `Total Defect Points`: ৪-পয়েন্ট স্কেলে মোট ত্রুটি পয়েন্ট (`e.g. 18 pts`).
* `QC Decision`: চূড়ান্ত রায় (`Accepted / Pass`, `Rejected / Fail`, `Conditional Pass`).

### ৫.৩. কাটিং ও সিঙ্গেল পিস ট্রেসিবিলিটি (Cutting & Sewing)
* `Lay No`: লেই নম্বর (`Lay #01`).
* `Ply Count`: প্লাই সংখ্যা (`120 Plies`).
* `Bundle Number`: বান্ডেল আইডি (`BND-01`).
* `Piece Tracking QR`: প্রতিটি পোশাকের ডিজিটাল পাসপোর্ট (`Single Piece Sub-QR`).
* `Defect Location`: ত্রুটির সুনির্দিষ্ট স্থান (e.g. `Left Collar`, `Back Hem`).

---

## ৬. ক্যাপিটালাইজেশন ও পাঙ্কচুয়েশন রুল (Capitalization Rules)

1. **Title Case (বড় হাতের শুরুর অক্ষর):**
   * Page Titles (e.g., `Fabric Roll Inventory`, `Create Buyer`)
   * Button Labels (e.g., `Save Changes`, `Export to Excel`, `Approve Order`)
   * Form Field Labels (e.g., `Buyer Name`, `Contact Email`, `Delivery Date`)
   * Table Header Columns (e.g., `Order Code`, `Total Quantity`, `Current Status`)
2. **Sentence Case (বাক্যের মতো সাধারণ নিয়ম):**
   * ইনপুট হেল্পার টেক্সট (e.g., `Code is automatically generated by the system.`)
   * ভ্যালিডেশন এরর মেসেজ (e.g., `Please enter a valid email address.`)
   * কনফার্মেশন ডায়ালগ বর্ণনা (e.g., `Are you sure you want to cancel this cutting lay?`)
   * টোস্ট নোটিফিকেশন (e.g., `Changes saved successfully.`)

---

## ৭. ডেভেলপমেন্ট কোড স্ট্যান্ডার্ড (Developers Implementation Rule)

ফ্রন্টএন্ডের কোনো ফর্মে বা কম্পোনেন্টে হার্ডকোডেড আরবিট্রারি টেক্সট বা অদ্ভুত শব্দ লেখা নিষিদ্ধ।
সকল টেক্সট সরাসরি সুনির্দিষ্ট কনস্ট্যান্ট ফাইল থেকে লোড হবে:
```typescript
// frontend/src/config/uiTextConstants.ts
export const UI_TEXT = {
  ACTIONS: {
    SAVE: "Save Changes",
    CANCEL: "Discard",
    CREATE_BUYER: "Create Buyer",
    DELETE_CONFIRM: "Delete Record",
    EXPORT_EXCEL: "Export to Excel",
  },
  EMPTY_STATES: {
    NO_BUYERS: "No buyers registered yet. Click 'Create Buyer' to start.",
    NO_ROLLS: "No fabric rolls found matching your filter criteria.",
  },
  HELPERS: {
    SYSTEM_AUTO_CODE: "System auto-generated unique identifier.",
  }
} as const;
```

---

*(End of Human-Centric Zero-Confusion UI/UX Text Standard SRS)*
