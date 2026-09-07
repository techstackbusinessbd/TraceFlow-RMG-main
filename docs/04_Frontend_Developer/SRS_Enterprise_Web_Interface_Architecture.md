# Software Requirements Specification (SRS)
## Enterprise Web Interface Architecture & Layout Shell
**Project:** TraceFlow RMG — Woven Garments Traceability & Manufacturing ERP  
**Module:** Enterprise Web Interface & Component Layout Specification  
**Status:** Approved & Final Specification  
**Design Philosophy:** SAP Fiori Horizon ShellBar + Odoo Enterprise 17/18 Smart Form + Microsoft Dynamics High-Density Grid  

---

## ১. ভূমিকা ও কার্যপরিধি (Introduction & Scope)

TraceFlow RMG একটি আন্তর্জাতিক মানের মিশন-ক্রিটিক্যাল আরএমজি ম্যানুফ্যাকচারিং ট্রেসিবিলিটি সিস্টেম। সাধারণ ওয়েব অ্যাপ্লিকেশনের মতো ক্যাজুয়াল বা অতিরিক্ত ফাঁকা ইউজার ইন্টারফেসের পরিবর্তে এই সিস্টেমে বিশ্বখ্যাত এন্টারপ্রাইজ ইআরপি—**SAP S/4HANA (Fiori Horizon)** এবং **Odoo Enterprise**-এর মতো অত্যন্ত দ্রুত ডেটা-ইনপুট, হাই ইনফরমেশন ডেনসিটি, রিয়েল-টাইম বারকোড সাপোর্ট এবং কিবোর্ড-ফার্স্ট ইন্টারফেস ব্যবহৃত হবে।

এই স্পেসিফিকেশন ডকুমেন্টে TraceFlow RMG-এর সম্পূর্ণ গ্লোবাল ওয়েব ইন্টারফেস আর্কিটেকচার, শেল কম্পোনেন্ট, ফর্ম লেআউট, ডায়ালগ রুলস এবং নেভিগেশন স্ট্যান্ডার্ড আনুষ্ঠানিকভাবে সংজ্ঞায়িত করা হলো।

---

## ২. গ্লোবাল লেআউট আর্কিটেকচার (Global Layout Skeleton)

পুরো সিস্টেমের ভিউপোর্টকে ৪টি প্রধান স্ট্রাকচারাল জোনে বিভক্ত করা হয়েছে:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Zone 1: SAP Horizon Top ShellBar (56px Fixed Height)                                   │
│  [TraceFlow RMG Logo] [Company: AWL - Ananta Woven ▼] [ 🔍 Global Barcode/Entity Search] [🔔] [User👤] │
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ Zone 2:      │ Zone 3: Global Breadcrumb & Workflow Stage Sub-Header (40px Fixed)      │
│ Collapsible  │  Merchandising > Fabric Bookings > AWL-FB-2026-001  [Status: In Cutting]│
│ Left Rail    ├─────────────────────────────────────────────────────────────────────────┤
│ Navigation   │ Zone 4: High-Density Main Work Canvas (100% Responsive Scrollable Area) │
│ (240px Wide  │                                                                         │
│ Collapsible  │  Mode A: Golden 3-Tier List Page (Header + Filter Toolbar + DataTable)  │
│ to 64px      │  Mode B: Odoo-Style Form View (Sticky Top Action Bar + 3-Col Data Grid) │
│ Solid Slate) │  Mode C: Split-Screen Inspector / Scanner Split-View (Tablet/Web)       │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

## ৩. ইন্টারফেস জোন স্পেসিফিকেশন (Zone-by-Zone Detailed Specs)

### ৩.১. Zone 1: SAP Horizon Top ShellBar (56px Fixed Header)
* **অবস্থান ও শৈলী:** স্ক্রিনের একদম শীর্ষে পিন করা থাকবে (`fixed top-0 inset-x-0 z-50 h-14 bg-white border-b border-slate-200 shadow-2xs`).
* **উপাদানসমূহ:**
  1. **Brand & Logo Section (Left):** ট্রেসিবিলিটি ব্র্যান্ড আইকন + "TraceFlow RMG" বোল্ড টেক্সট।
  2. **Multi-Company Branch Switcher (Odoo Style):** ড্রপডাউন পিকার যার মাধ্যমে অপারেটর/ম্যানেজার মুহূর্তের মধ্যে মাল্টি-টেন্যান্ট সিস্টার কোম্পানিতে সুইচ করতে পারে (যেমন: `AWL - Ananta Woven Ltd` থেকে `AFL - Ananta Fashion Ltd`)।
  3. **Omni-Search Bar (Global Barcode/PO/Style Search):** সেন্ট্রাল সার্চ ইনপুট (`Ctrl + K` শর্টকাট)। এখানে বারকোড গান দিয়ে স্ক্যান করা বা রোল কোড টাইপ করলে তাৎক্ষণিক ড্রপডাউনে সংশ্লিষ্ট লট বা অর্ডারে সরাসরি নেভিগেট করার সুবিধা থাকবে।
  4. **Right Control Cluster:**
     * **Network / Cloud Status Pill:** সবুজ পালস ব্যাজ (`Connected`) বা অফলাইন অ্যালার্ট।
     * **Notification Bell:** ক্রিটিক্যাল ডিফেক্ট অ্যালার্ট বা রোল রিজেকশন নোটিফিকেশন কাউন্টার।
     * **User Profile & Shift Badge:** লগইনকৃত অফিসারের নাম, রোল ও বায়োমেট্রিক `emp_id` ব্যাজ (e.g., `Khaled A. [255776]`).

### ৩.২. Zone 2: Collapsible Left Navigation Rail (SAP Horizon Dark Variant)
* **অবস্থান ও মাত্রা:** বামপাশে স্ক্রিন-জুড়ে ফিক্সড সাইডবার (`top-14 bottom-0 w-60 bg-slate-900 text-slate-300 border-r border-slate-800 z-40 transition-all duration-200`).
* **কমপ্যাক্ট মোড:** অপারেটর চাইলে একটি টগল আইকনে ক্লিক করে সাইডবারকে `60px` মিনি-রেইলে কোলাপ্স করতে পারবে যাতে ফ্লোরের ছোট মনিটরেও ডেটাটেবিল ১০০% প্রস্থ পায়।
* **মডিউল গ্রুপিং ও আইকনোগ্রাফি:**
  * **Core Modules:**
    * 📊 `Dashboard & KPI Control`
    * 🏢 `System Master & Sister Units`
    * 👗 `Merchandising & Inquiry Engine`
    * 🧵 `Fabric & Trims Warehouse (Rolls)`
    * 🔍 `QC Inspection (4-Point System)`
    * ✂️ `CAD, Marker & Spreading-Cutting`
    * 🪡 `Sewing Line & Defect Tracking`
    * 📦 `Finishing, Packing & Dispatch`
* **সিলেকশন হাইলাইট:** নির্বাচিত মেনু আইটেমে গাঢ় ব্লু বর্ডার ও সলিড কালার হাইলাইট থাকবে (`bg-slate-800 text-white border-l-4 border-blue-500 font-medium`).

### ৩.৩. Zone 3: Global Breadcrumb & Workflow Sub-Header (40px Fixed)
* **অবস্থান:** ShellBar-এর ঠিক নিচে ফিক্সড থাকবে (`h-10 bg-slate-100/80 backdrop-blur-none border-b border-slate-200 px-6 flex items-center justify-between`).
* **কাজ:**
  * বামপাশে সম্পূর্ণ ব্র্যাডক্রাম্ব নেভিগেশন পথ (e.g., `Home > Merchandising > Styles > AWL-STY-2026-0012`).
  * ডানপাশে বর্তমান ডকুমেন্টের লাইভ স্ট্যাটাস ব্যাজ (e.g., `<Badge variant="success">IN PRODUCTION</Badge>`).

### ৩.৪. Zone 4: High-Density Work Canvas
* **মেইন কনটেন্ট এরিয়া:** অফ-হোয়াইট আরামদায়ক ব্যাকগ্রাউন্ড (`bg-slate-50 min-h-screen p-6`).

---

## ৪. দুটি প্রধান পেজ প্যাটার্ন (Core Page Patterns)

### ৪.১. প্যাটার্ন ১: Mandatory Golden 3-Tier Data List Page
প্রতিটি মাস্টার ডেটা বা ট্র্যাকিং তালিকার জন্য এই ৩-টিয়ার আর্কিটেকচার বাধ্যতামূলক:

1. **Tier 1: Sleek Header Row (`<PageHeader>`):**
   * বামে: সুনির্দিষ্ট সংক্ষিপ্ত টাইটেল (e.g., `Fabric Roll Inventory`) + নিউট্রাল কাউন্টার ব্যাজ (e.g., `1,420 Rolls`).
   * ডানে: অ্যাকশন বাটন গ্রুপ (Primary Button: `+ Receive Rolls`, Secondary Button: `Export Excel / CSV`).
2. **Tier 2: Unified Filter Toolbar (`<FilterToolbar>`):**
   * ফুল-উইডথ সার্চ বার (বারকোড, রোল আইডি বা লট নম্বর সার্চের জন্য)।
   * ড্রপডাউন ফিল্টার (সাপ্লায়ার সিলেক্টর, শেড সিলেক্টর, কিউসি রেজাল্ট সিলেক্টর)।
   * সাবলাইনে অ্যাক্টিভ সর্ট ইন্ডিকেটর (e.g., `Sorted by: Received Date (DESC)`) এবং "Show per page" সিলেক্টর (10, 15, 25, 50, 100)।
3. **Tier 3: Standard DataTable Shell (`<DataTable<T>>`):**
   * কমপ্যাক্ট রো হাইট (`py-2.5` থেকে `py-3`), ফিক্সড টেবিল হেডার (`bg-slate-100 text-slate-600 uppercase font-semibold text-xs`).
   * জোড়-বিজোড় সারিতে হালকা অল্টারনেটিং স্ট্রাইপ (`even:bg-slate-50/40`) ও হোভার ট্রানজিশন।
   * প্রতিটি শনাক্তকারী কোডের জন্য `font-mono tracking-wide` বাধ্যতামূলক।
   * ফিক্সড ফুটার পেজিনেশন ("Showing 1 to 25 of 1,420 records" + `< Previous` / `> Next` বাটন)।

### ৪.২. প্যাটার্ন ২: Odoo-Style Form View & Smart KPI Tabs
ডিটেইলস, তৈরি বা এডিটের জন্য ফুল ডেডিকেটেড পেজ (মোডাল নিষিদ্ধ):

1. **Top Pinned Form Action Bar (Sticky):**
   * পেজ স্ক্রোল করলেও সেভ (`Save Changes`), ক্যানসেল (`Discard`), এবং ব্যাক নেভিগেশন বাটন সবসময় শীর্ষে দৃশ্যমান থাকবে।
2. **Smart KPI Status Bar (Top Right):**
   * ওডু-স্টাইলের স্মার্ট কাউন্টার বোতাম (যেমন: এই স্টাইলের অধীনে কয়টি রোল ব্যবহৃত হয়েছে, কয়টি মার্কার প্ল্যান হয়েছে: `[ 📦 48 Rolls ] [ ✂️ 6 Markers ] [ 💰 $14.20 FOB ]`)।
3. **Status Workflow Pipeline:**
   * ডান শীর্ষে ওয়ার্কফ্লো অ্যারো পাইপলাইন:
     ```
     [ 1. Draft ] ➔ [ 2. Costing Approved ] ➔ [ 3. Fabric Issued ] ➔ [ 4. Completed ]
     ```
4. **Form Sectioning & Responsive Grid:**
   * ২ বা ৩ কলামের ক্লিন গ্রিড লেআউট।
   * মাস্টার কোড ফিল্ড সবসময় রিড-অনলি (`readOnly={true}`) ও মনোপেস স্টাইলে সিস্টেম অটো-জেনারেটেড ব্যাজ সহ প্রদর্শিত হবে।
   * সার্ভার-সাইড ভ্যালিডেশন এরর ইনপুটের নিচে লাল বর্ডারে তাৎক্ষণিক প্রদর্শিত হবে।

---

## ৫. ইন্টারঅ্যাকশন ও ডায়ালগ পলিসি (Interaction & Dialog Standards)

* **CRUD অপারেশনে মোডাল সম্পূর্ণ নিষিদ্ধ:** কোনো তথ্য তৈরি বা সম্পাদনা করার জন্য পপআপ/ড্রয়ার খোলা কঠোরভাবে নিষিদ্ধ। প্রতিটি কাজের জন্য ডেডিকেটেড ফুল-পেজ ও স্পষ্ট ব্র্যাডক্রাম্ব ব্যবহৃত হবে।
* **অনুমোদিত নন-CRUD মোডাল:**
  1. **Destructive Action Confirmation:** (e.g., "Are you sure you want to scrap Roll AWL-RL-0092?").
  2. **Supervisor PIN Verification:** ফ্লোর ম্যানেজারের ৬ ডিজিট পিন ইনপুট ডায়ালগ।
  3. **Barcode / QR Scanner Camera Overlay:** মোবাইল/ট্যাবলেটের ক্যামেরা ভিউয়ার।
  4. **Document / Tech-Pack Quick Preview:** টেকপ্যাক বা পিডিএফ ইনস্পেক্টর।

---

## ৬. কীবোর্ড শর্টকাট ও অপারেটর এফিসিয়েন্সি স্ট্যান্ডার্ড (Keyboard Ergonomics)

কারখানার ফাস্ট ডাটা-এন্ট্রির সুবিধার্থে নিম্নলিখিত গ্লোবাল কীবোর্ড শর্টকাট নিশ্চিত করা হবে:
* `Ctrl + K`: গ্লোবাল বারকোড ও অমনি-সার্চ ফোকাস।
* `Alt + N`: সংশ্লিষ্ট পেজের নতুন আইটেম তৈরির ডেডিকেটেড পেজে যাওয়া।
* `Ctrl + S`: ফর্মে থাকা অবস্থায় সরাসরি সাবমিট/সেভ রিকোয়েস্ট পাঠানো।
* `Esc`: ফিল্টার বা প্রিভিউ মোডাল বন্ধ করা।
* `Tab` / `Shift + Tab`: ফর্ম ফিল্ডগুলোর মধ্যে লজিক্যাল ক্রমানুসারে জাম্প করা।

---

*(End of Enterprise Web Interface Architecture SRS)*
