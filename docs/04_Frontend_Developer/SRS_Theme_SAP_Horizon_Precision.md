# Software Requirements Specification (SRS)
## Theme Architecture: "SAP Horizon Precision" (Enterprise Industrial Standard)
**Project:** TraceFlow RMG — Woven Garments Traceability & Manufacturing ERP  
**Module:** Frontend Design System & Theme Engine  
**Status:** Approved & Final Specification  
**Benchmark References:** SAP Fiori Horizon (Morning Horizon), Odoo Enterprise v17/v18, Microsoft Dynamics 365  

---

## ১. ভূমিকা ও লক্ষ্য (Introduction & Objectives)

TraceFlow RMG একটি মিশন-ক্রিটিক্যাল ইন্ডাস্ট্রিয়াল ম্যানুফ্যাকচারিং ইআরপি। মার্চেন্ডাইজিং, ফেব্রিক ওয়্যারহাউস, কিউসি ইনস্পেকশন, কাটিং এবং সুইং ফ্লোরের মতো উচ্চ-ডেনসিটি ও ডেটা-নিবিড় মডিউলগুলোর জন্য **"SAP Horizon Precision"** থিম চূড়ান্তভাবে অনুমোদিত হয়েছে।

### মূল লক্ষ্যসমূহ:
1. **Cognitive Ergonomics & Zero Eye-Strain:** কারখানার কম্পিউটার ও ফ্লোর ট্যাবলেটগুলোতে শিফটের ৮-১০ ঘণ্টা একটানা কাজ করার পরও চোখের ক্লান্তিহীন ইউজার এক্সপেরিয়েন্স।
2. **High Information Density with Industrial Precision:** অহেতুক হোয়াইট-স্পেস বর্জন করে স্ক্রিনের সর্বোচ্চ ব্যবহার এবং শার্প, প্রফেশনাল কন্ট্রাস্ট নিশ্চিতকরণ।
3. **Strict Flat Industrial Geometry:** কোনো অপ্রয়োজনীয় গ্রেডিয়েন্ট, টয়িশ/অতিরিক্ত গোল কার্ভ বা ব্লারড ব্যাকগ্রাউন্ড নিষিদ্ধ।
4. **100% English UI Standard:** সকল ইউজার ইন্টারফেস কপি সম্পূর্ণ ইংরেজিতে থাকবে (পলিসি অনুযায়ী)।

---

## ২. ডিজাইন টোকেন ও কালার প্যালেট স্পেসিফিকেশন (Color Palette & Tokens)

SAP Fiori Horizon আর্কিটেকচার অনুযায়ী আমাদের কালার প্যালেটকে নিচে সংজ্ঞায়িত করা হলো:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SAP Horizon Precision Palette                     │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Token Role         │ Hex Code / Tailwind│ Usage Scope                  │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ Primary Brand      │ #1D4ED8 (blue-700) │ Primary Buttons, Active Tabs │
│ Primary Hover      │ #1E40AF (blue-800) │ Primary Button Hover         │
│ Brand Accent       │ #2563EB (blue-600) │ Interactive Links, Highlights│
│ Canvas Background  │ #F8FAFC (slate-50) │ App Main Background          │
│ Card / Surface     │ #FFFFFF (white)    │ Cards, Panels, Modals        │
│ Table Header Row   │ #F1F5F9 (slate-100)│ Dense Table Header Grid      │
│ Alternate Row Strip│ #F8FAFC (slate-50) │ Even Data Table Rows (40% op)│
│ Border Default     │ #E2E8F0 (slate-200)│ 1px Sharp Dividing Lines     │
│ Border Input Focus │ #2563EB (blue-600) │ 1px Solid Focus Border       │
│ Navigation Dark Nav│ #0F172A (slate-900)│ Enterprise Left App Rail     │
│ Nav Hover/Active   │ #1E293B (slate-800)│ Active Left Menu Item        │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### ২.১. সেমান্টিক স্ট্যাটাস কালার (Status & Workflow Badges)
* **Success (Pass / Complete / In-Stock / Approved):**
  * Badge: `bg-emerald-50 text-emerald-700 border-emerald-200`
  * Action: `bg-emerald-600 hover:bg-emerald-700 text-white`
* **Warning (Pending Inspection / Under Review / Hold):**
  * Badge: `bg-amber-50 text-amber-700 border-amber-200`
  * Action: `bg-amber-600 hover:bg-amber-700 text-white`
* **Danger (Reject / Defect / Cancelled / Shortage):**
  * Badge: `bg-red-50 text-red-700 border-red-200`
  * Action: `bg-red-600 hover:bg-red-700 text-white`
* **Info / Blue (In Progress / Scheduled / Sent):**
  * Badge: `bg-blue-50 text-blue-700 border-blue-200`
  * Action: `bg-blue-600 hover:bg-blue-700 text-white`
* **Neutral (Draft / Inactive):**
  * Badge: `bg-slate-100 text-slate-800 border-slate-200`

---

## ৩. টাইপোগ্রাফি আর্কিটেকচার (Typography Standards)

* **Primary Sans Font:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Data / Code Monospace Font:** `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace`
  * *প্রযোজ্য:* Roll Barcode, Style Code, Inquiry Code, PO Number, Fabric Batch ID, Master Entity Codes (`AWL-STY-001`, `AWL-BYR-001`).
* **টাইপ স্কেল (High-Density Hierarchy):**
  * `Page Title (H1)`: `text-xl font-bold text-slate-900 tracking-tight` (20px)
  * `Section Header / Card Title (H2/H3)`: `text-base font-semibold text-slate-900` (16px)
  * `Table Header`: `text-xs font-semibold text-slate-600 uppercase tracking-wider` (12px)
  * `Body / Data Cells`: `text-sm text-slate-700 font-normal` (14px)
  * `Form Labels & Subtitles`: `text-xs font-medium text-slate-700` (12px)
  * `Helper / Sub-text`: `text-xs text-slate-500` (12px)

---

## ৪. সারফেস জিওমেট্রি ও স্পেসিং (Surface Geometry & Density)

SAP Horizon স্টাইল অনুসরণ করে টয়িশ কার্ভ সম্পূর্ণ বাদ দিয়ে তীক্ষ্ণ ও ইন্ডাস্ট্রিয়াল লুক নির্ধারণ করা হয়েছে:

### ৪.১. Corner Radius (Strictly Controlled)
* **Buttons, Badges, Inputs, Selects:** `rounded` (4px) অথবা `rounded-md` (6px).
* **Cards, Containers, DataTables:** `rounded-lg` (8px max).
* **🚫 Prohibited:** `rounded-xl`, `rounded-2xl`, `rounded-3xl` (ওয়েব অ্যাডমিন প্যানেলে সম্পূর্ণ নিষিদ্ধ)।

### ৪.২. এন্টারপ্রাইজ এলিভেশন ও শ্যাডো (Elevation & Shadows)
* **Card & DataTable Base:** `shadow-2xs` (`0 1px 2px 0 rgb(0 0 0 / 0.03)`) অথবা ফ্ল্যাট বর্ডারড (`border border-slate-200`).
* **Dropdowns & Action Menus:** `shadow-md` (`0 4px 6px -1px rgb(0 0 0 / 0.08)`).
* **Modal Dialogs:** `shadow-xl border border-slate-200`.

---

## ৫. মূল কম্পোনেন্ট লেআউট স্পেসিফিকেশন (Component Layout Specs)

### ৫.১. গ্লোবাল লেআউট শেল (SAP ShellBar Standard)
1. **Top Pinned ShellBar (56px Height):**
   * বামে: Company Switcher & Sister Unit Badge (`AWL - Ananta Woven Ltd`).
   * মাঝে: গ্লোবাল কুইক সার্চ (Search roll, style, buyer by code or barcode).
   * ডানে: Network/Offline Status indicator, Notification Center, User Profile (Employee ID badge).
2. **Left Navigation Rail (SAP Horizon Dark Variant):**
   * সলিড ডার্ক স্লেট ব্যাকগ্রাউন্ড (`bg-slate-900`).
   * মেনু আইটেম প্যাডিং `py-2.5 px-3`, অ্যাক্টিভ স্টেট `bg-slate-800 text-white border-l-4 border-blue-500`.
   * কোলাপসিবল সাইডবার (240px Expanded / 64px Compact Rail).

### ৫.২. গোল্ডেন লিস্ট পেজ (Mandatory 3-Tier Pattern)
1. **Tier 1: Sleek Header Row (`<PageHeader>`):**
   * Title + Dynamic Count Badge (`e.g., 24 Styles`) বামে।
   * Primary Action (`+ Create New ...`) এবং Secondary Action (`Export Excel`) ডানে।
2. **Tier 2: Unified Filter Toolbar (`<FilterToolbar>`):**
   * সার্চ বার + ড্রপডাউন ফিল্টার + "Filter" বাটন + "Reset" রোটেট আইকন।
   * সাবলাইনে অ্যাক্টিভ সর্টিং ব্যাজ ও পার-পেজ সিলেক্টর (10, 15, 25, 50)।
3. **Tier 3: Standard DataTable Shell (`<DataTable<T>>`):**
   * কমপ্যাক্ট সেল প্যাডিং (`px-4 py-3`), অল্টারনেটিং রো স্ট্রাইপিং (`even:bg-slate-50/40`), ফিক্সড পেজিনেশন ফুটার।

### ৫.৩. ওডু/এসএপি স্টাইল ডিটেইলস & এডিট ফর্ম ভিউ (Form View Pattern)
1. **Sticky Header Action Bar:**
   * স্ক্রোল করলেও সেভ, ব্যাক ও ক্যানসেল বোতাম টপবারে ভিজিবল থাকবে।
2. **Smart Status Stage Pipeline (Top Right):**
   * যেমন: `Draft ➔ Confirmed ➔ In Production ➔ Completed` স্টেজ বার।
3. **Responsive Grid:**
   * 2-কলাম / 3-কলাম রেসপন্সিভ ফর্ম লেআউট।
   * সিস্টেম অটো-জেনারেটেড কোড ফিল্ড সবসময় `readOnly={true}` সাথে `font-mono bg-slate-100` স্টাইলিং।

---

## ৬. কোড ও সিস্টেম স্ট্যান্ডার্ড সম্মতি (Rule Compliance)

* **Server-Side Validation:** ব্রাউজার পপআপ বা ক্লায়েন্ট ভ্যালিডেশন নিষিদ্ধ; ইনপুটে রেড বর্ডার `border-red-500` এবং নিচে এরর মেসেজ রেন্ডার হবে এপিআই রেসপন্স থেকে।
* **Centralized Tokens Only:** কোনো পেজে নতুন আরবিট্রারি টেইলউইন্ড ক্লাস লেখা যাবে না; সব স্টাইল `frontend/src/config/designTokens.ts` থেকে লোড হবে।

---

*(End of SAP Horizon Precision Theme SRS)*
