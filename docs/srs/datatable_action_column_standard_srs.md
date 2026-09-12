# Software Requirements Specification (SRS)
## Document ID: SRS-UI-DATATABLE-ACTIONS-001
## Title: System-Wide Uniform DataTable Action Column & RowActions Standard (সিস্টেম-ব্যাপী অভিন্ন ডেটাটেবিল অ্যাকশন কলাম ও রো-অ্যাকশন স্ট্যান্ডার্ড)
## Version: 1.0.0
## Status: APPROVED / ACTIVE

---

## ১. ভূমিকা ও উদ্দেশ্য (Introduction & Purpose)
TraceFlow RMG সিস্টেমে প্রতিটি লিস্ট বা ডিরেক্টরি পেইজে ডেটা ব্রাউজিংয়ের জন্য `<DataTable<T>>` কম্পোনেন্ট ব্যবহৃত হয়। পূর্বে বিভিন্ন লিস্ট পেইজে অ্যাকশন কলামে বাটনের ডিজাইন, আইকন, কালার ভ্যারিয়েন্ট এবং ড্রপডাউন মেনু স্ট্রাকচারে কিছু অসঙ্গতি ছিল (যেমন: কিছু পেইজে আইকন বাটন সরাসরি, কিছু পেইজে টেক্সটসহ বাটন, ড্রপডাউনে বিভিন্ন রকম লেবেল)।

এই স্পেসিফিকেশনের মূল উদ্দেশ্য হলো:
1. **১০০% অভিন্ন ইউজার এক্সপেরিয়েন্স (100% Uniform UX)**: সিস্টেমের যেকোনো লিস্ট পেইজেই অপারেটর কাজ করুক না কেন, প্রতিটি রো-এর ডানপাশের অ্যাকশন কলামের বিন্যাস, আইকন, ক্রম (order), টুলটিপ এবং ড্রপডাউন মেনু সম্পূর্ণ একই নিয়মে কাজ করবে।
2. **ভুল অ্যাকশন প্রতিরোধ (Accidental Click Prevention)**: প্রাইমারি রিড/ভিউ এবং এডিট অ্যাকশন সরাসরি এক ক্লিকে সহজলভ্য থাকবে, এবং বিপজ্জনক বা আনকমন অ্যাকশনগুলো (যেমন Status Toggle, Delete) একটি সমন্বিত `⋮` (MoreHorizontal) ড্রপডাউন মেনুর ভেতর থাকবে।

---

## ২. কোর আর্কিটেকচার ও স্ট্যান্ডার্ড (Core Architecture & Standards)

### ২.১ স্ট্যান্ডার্ড অ্যাকশন কলাম আর্কিটেকচার (Column Definition Standard)
সকল `<DataTable<T>>` কলাম ডেফিনিশনে অ্যাকশন কলামটি অবশ্যই নিম্নলিখিত বৈশিষ্ট্যে সংজ্ঞায়িত হবে:
```typescript
{
  key: "actions",
  header: "Actions",
  align: "right",
  sortable: false,
  render: (row) => (
    <RowActionsMenu
      primaryActions={[ ... ]}
      menuActions={[ ... ]}
    />
  )
}
```

### ২.২ প্রাইমারি ইনলাইন বাটন স্ট্যান্ডার্ড (Primary Inline Buttons - Max 2)
প্রতিটি রো-এর শেষ কলামে ইনলাইন হিসেবে সর্বোচ্চ ২টি কমপ্যাক্ট আইকন বাটন থাকবে:
1. **Action 1: View / Inspect (`variant: "secondary"`)**:
   - **Icon**: `<Eye className="w-3.5 h-3.5" />`
   - **Label/Title**: `"View Details"` অথবা `"View Profile"`
   - **ডিজাইন টোকেন**: হোয়াইট/স্লেট ব্যাকগ্রাউন্ড (`border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900`)
   - **পারমিশন**: ডিফল্টভাবে রিড পারমিশনযুক্ত সকল ব্যবহারকারীর জন্য দৃশ্যমান।

2. **Action 2: Edit / Update (`variant: "primary"`)**:
   - **Icon**: `<Edit2 className="w-3.5 h-3.5" />` (অথবা রোলস পলিসির ক্ষেত্রে সংশ্লিষ্ট কনফিগার আইকন `<Sliders className="w-3.5 h-3.5" />`)
   - **Label/Title**: `"Edit <Entity>"` (যেমন: `"Edit User"`, `"Edit Company"`, `"Edit Buyer"`, `"Edit Agent"`, `"Edit Style"`, `"Edit Order"`)
   - **ডিজাইন টোকেন**: প্রাইমারি ব্লু টিন্ট (`border-blue-200 text-[#0066FF] bg-[#EFF6FC] hover:bg-blue-100`)
   - **পারমিশন গার্ড**: ইউজার বা রোলের এডিট পারমিশন থাকলে দৃশ্যমান (`canEdit`), নতুবা লুকায়িত।

---

### ২.৩ ড্রপডাউন মেনু অ্যাকশন স্ট্যান্ডার্ড (`menuActions` via `⋮` MoreHorizontal)
প্রাইমারি অ্যাকশন বাটনের ঠিক ডানপাশে একটি স্লিক `⋮` (`MoreHorizontal className="w-3.5 h-3.5"`) বাটন থাকবে। এটি ক্লিক করলে ড্রপডাউন মেনু ওপেন হবে:

1. **Custom Contextual Actions (যেমন: Permissions / Special Views)**:
   - বিশেষ কোনো মডিউল অ্যাকশন থাকলে (যেমন: ইউজারের ক্ষেত্রে `Custom Permissions` - `<Key className="w-3.5 h-3.5" />`) ড্রপডাউনের শুরুতে প্রদর্শিত হবে।
2. **Status Toggle Action (Active / Inactive)**:
   - **Label**: রো যদি সক্রিয় থাকে তবে `"Deactivate <Entity>"`, নিষ্ক্রিয় থাকলে `"Activate <Entity>"`.
   - **Icon**: সক্রিয় অবস্থায় `<ToggleRight className="w-3.5 h-3.5 text-slate-500" />` এবং নিষ্ক্রিয় অবস্থায় `<ToggleLeft className="w-3.5 h-3.5 text-slate-400" />`.
   - **Variant**: `"warning"` (Deactivate-এর জন্য) অথবা `"default"` (Activate-এর জন্য).
3. **Delete Action (Destructive Action - Always at Bottom with Divider)**:
   - **Label**: `"Delete <Entity>"` (যেমন: `"Delete Buyer"`, `"Delete Style"`, `"Delete Order"`).
   - **Icon**: `<Trash2 className="w-3.5 h-3.5 text-rose-600" />`.
   - **Variant**: `"danger"`.
   - **Divider**: `dividerBefore: true` (একটি সূক্ষ্ম ডিভাইডার বর্ডার থাকবে যা সাধারণ অপশন থেকে ডিলিট অপশনকে আলাদা করে)।
   - **সেফটি**: সরাসরি ডিলিট না হয়ে সর্বদা একটি কনফার্মেশন মোডাল ওপেন হবে (`setDeleteTarget(row)`).

---

## ৩. পেইজ-ভিত্তিক নিরীক্ষা ও ইউনিফর্ম ম্যাপিং (Page-by-Page Audit & Mapping)

| মডিউল ও পেইজ | প্রাইমারি অ্যাকশন ১ (Eye) | প্রাইমারি অ্যাকশন ২ (Edit) | ড্রপডাউন অপশন ১ | ড্রপডাউন অপশন ২ (Delete) |
|---|---|---|---|---|
| **Users** (`UserListPage`) | `View Profile` | `Edit User` | `Custom Permissions` & `Deactivate/Activate User` | `Delete User` (with divider) |
| **Roles** (`RoleListPage`) | `Policy Matrix` (`Sliders`) | — | — | `Delete Role` (Custom roles only) |
| **Companies** (`CompanyListPage`) | `View Details` | `Edit Company` | `Deactivate/Activate Company` | `Delete Company` (with divider) |
| **Buyers** (`BuyerListPage`) | `View Profile` | `Edit Buyer` | `Deactivate/Activate Buyer` | `Delete Buyer` (with divider) |
| **Agents** (`AgentListPage`) | `View Profile` | `Edit Agent` | `Deactivate/Activate Agent` | `Delete Agent` (with divider) |
| **Styles** (`StyleListPage`) | `View Style` | `Edit Style` | `Deactivate/Activate Style` | `Delete Style` (with divider) |
| **Orders** (`OrderListPage`) | `View Order` | `Edit Order` | — | `Delete Order` (with divider) |

---

## ৪. জিরো-রিগ্রেশন এবং কোয়ালিটি রুলস (Zero-Regression & Quality Rules)
1. কোনো পেইজেই ম্যানুয়ালি বাটন বা কাস্টম ড্রপডাউন এলিমেন্ট বানানো যাবে না; সর্বদা স্ট্যান্ডার্ড `<RowActionsMenu>` কম্পোনেন্ট ব্যবহার করতে হবে।
2. আইকনের সাইজ সর্বদা `w-3.5 h-3.5` থাকবে।
3. কোনো টেক্সট লেবেল ইনলাইন অ্যাকশনে ব্যবহার করা যাবে না (ইনলাইন সর্বদা কমপ্যাক্ট `w-7 h-7` আইকন বাটন)।
4. ড্রপডাউনের ডিলিট অ্যাকশনটি সর্বদা `variant: "danger"` এবং `dividerBefore: true` সহকারে লাল টেক্সট/আইকন ব্যবহার করবে।
