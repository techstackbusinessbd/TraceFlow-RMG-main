# Software Requirements Specification (SRS)
## Enterprise Form Control & Pure Token-Driven UI Primitives Architecture
**Project:** TraceFlow RMG — Woven Garments Traceability & Manufacturing ERP  
**Module:** Frontend UI Engineering & Form Component Standard  
**Document ID:** SRS-UI-FORM-PRIMITIVES-001  
**Status:** Approved & Production-Ready  
**Benchmark Reference:** SAP Fiori UI5 Form Controls, Odoo Enterprise Widget Engine, Microsoft Dynamics FastTab Fields  

---

## ১. ভূমিকা ও সমস্যা বিবরণী (Introduction & Problem Statement)

### ১.১ সমস্যা (The Problem with Ad-hoc / Inline CSS in ERP)
সাধারণ ওয়েব অ্যাপ্লিকেশনে ডেভেলপাররা প্রায়শই ফর্ম ফিল্ড, লেবেল বা এরর টেক্সটের জন্য পেজের ভেতর সরাসরি ইনলাইন টেইলউইন্ড বা সিএসএস ক্লাস লিখে থাকেন। যেমন:
```tsx
// ❌ BAD PRACTICE (Ad-hoc / Inline classes in page files)
<p className="text-xs font-medium text-rose-400 mt-1.5">
  {errors.login_identifier[0]}
</p>
```
বিশাল এন্টারপ্রাইজ ইআরপি সিস্টেমে (যেখানে ৫০+ মডিউল ও শত শত ডেটা-এন্ট্রি পেজ থাকে) এই অ্যাপ্রোচটি মারাত্মক ক্ষতিসাধন করে:
1. **Visual Inconsistency & Fragmentation:** ভিন্ন ভিন্ন ডেভেলপার `text-rose-400`, `text-red-500`, `text-red-600`, `mt-1`, বা `mt-2` লিখে থাকেন, যার ফলে গোটা ইআরপিতে ভিজ্যুয়াল বিশৃঙ্খলা দেখা দেয়।
2. **Maintenance Nightmare:** এরর মেসেজের ফন্ট বা ডার্ক/লাইট কালার পরিবর্তন করতে গেলে হাজার হাজার ফাইল ম্যানুয়ালি এডিট করতে হয়।
3. **Loss of Accessibility (A11y):** সরাসরি `<p>` বা `<div>` লেখার কারণে স্ক্রিন-রিডার ও ইন্ডাস্ট্রিয়াল ইনপুট কন্ট্রোলারের জন্য প্রয়োজনীয় `aria-invalid`, `aria-describedby` ইত্যাদির সংযোগ নষ্ট হয়।

### ১.২ বিগ ইআরপি সমাধান (The Big ERP Standard)
বিশ্বমানের ইআরপি সিস্টেম (SAP Fiori, Odoo Enterprise, MS Dynamics) পেজে কোনো র সিএসএস কোড লিখতে দেয় না। তারা **Form Primitives & Centralized Tokens** ব্যবহার করে। এই এসআরএস-এর মাধ্যমে TraceFlow RMG-তে ইনলাইন ক্লাস সম্পূর্ণ নিষিদ্ধ করে সেন্ট্রালাইজড আর্কিটেকচার চূড়ান্ত করা হলো।

---

## ২. ফর্ম আর্কিটেকচার নীতি (Core Principles)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Enterprise Form Primitive Hierarchy                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  <FormField>                                                                │
│    ├── <FormLabel> (Mandatory indicator, tooltip, token-driven)             │
│    ├── <Input / Select / Textarea> (Icon slots, focus ring, readonly mode)  │
│    ├── <FormHelperText> (Domain instructions, token-driven)                 │
│    └── <FormErrorMessage> (HTTP 422 server error, aria-live, token-driven)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Zero Inline Classes in Page Files (STRICT):**
   * পেজ ফাইলে কোনো অবস্থাতেই সরাসরি ইনলাইন টেইলউইন্ড ক্লাস বা স্টাইল লিখে ফিল্ড বা এরর তৈরি করা যাবে না।
2. **Single Source of Truth (`designTokens.ts`):**
   * ইনপুট বর্ডার, ফোকাস রিং, ব্যাকগ্রাউন্ড, রিড-অনলি মোড, লেবেল কালার এবং এরর টেক্সটের সমস্ত সিএসএস ক্লাস কেবল `frontend/src/config/designTokens.ts`-এর `UI_TOKENS.input.*` ও `UI_TOKENS.form.*` থেকে রেন্ডার হবে।
3. **Declarative Component Usage:**
   * ডেভেলপাররা শুধুমাত্র `<FormField>` প্রিমিটিভ ব্যবহার করবেন। স্টাইলিং ও স্টেট ইন্টারনালি ম্যানেজ হবে।

---

## ৩. ডিজাইন টোকেন সম্প্রসারণ স্পেসিফিকেশন (`designTokens.ts`)

`UI_TOKENS`-এ নিচের টোকেনগুলো কেন্দ্রীয়ভাবে সংজ্ঞায়িত থাকবে:

```typescript
export const UI_TOKENS = {
  // ... existing tokens
  form: {
    group: "space-y-1.5",
    label: "block text-xs font-medium text-slate-700 dark:text-slate-300",
    labelRequired: "text-red-500 ml-0.5",
    helper: "text-[11px] text-slate-500 dark:text-slate-400 mt-1",
    errorMessage: "text-xs font-medium text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1",
    errorIcon: "w-3.5 h-3.5 text-red-500 shrink-0",
    readonlyBadge: "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200",
  },
  input: {
    base: "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors",
    darkBase: "dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500",
    error: "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500",
    readonly: "bg-slate-100 border-slate-200 text-slate-600 font-mono text-xs cursor-not-allowed",
    iconWrapper: "relative flex items-center",
    iconLeft: "absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none",
    iconRight: "absolute right-3 top-2.5 h-4 w-4 text-slate-400 cursor-pointer",
  }
} as const;
```

---

## ৪. রিইউজেবল কম্পোনেন্ট প্রিমিটিভ স্পেসিফিকেশন (Component Specs)

### ৪.১. `<FormField>` Wrapper Primitive
* **ফাইলের অবস্থান:** `frontend/src/components/common/FormField.tsx`
* **Props Interface:**
  ```typescript
  interface FormFieldProps {
    label?: string;
    required?: boolean;
    helperText?: string;
    error?: string | string[];
    htmlFor?: string;
    systemAuto?: boolean;
    children: React.ReactNode;
    className?: string;
  }
  ```
* **ফাংশনালিটি:**
  1. লেবেলের পাশে `required` থাকলে লাল রঙের তারকাচিহ্ন (`*`) রেন্ডার করবে।
  2. `systemAuto` থাকলে স্বয়ংক্রিয়ভাবে "System Auto" ব্যাজ যুক্ত করবে।
  3. `error` থাকলে ইনপুটের নিচে স্বয়ংক্রিয়ভাবে সতর্কবার্তা আইকন সহ টোকেন-ভিত্তিক এরর টেক্সট রেন্ডার করবে।

### ৪.২. `<TextInput>` & `<SelectInput>` Primitives
* **ফাইলের অবস্থান:** `frontend/src/components/common/TextInput.tsx`
* **বৈশিষ্ট্য:**
  1. `isError` বুলিয়ান প্রপ সত্য হলে স্বয়ংক্রিয়ভাবে `UI_TOKENS.input.error` ক্লাস অ্যাপ্লাই করবে।
  2. বাম বা ডানপাশে আইকন স্লট সাপোর্ট করবে (যেমন: ইউজারনেম আইকন বা পাসওয়ার্ড শো/হাইড আইকন)।

---

## ৫. পৃষ্ঠা স্তরের ব্যবহার নির্দেশিকা (Developer Usage Blueprint)

পেজ ফাইলে ইনলাইন ক্লাস ব্যবহারের পরিবর্তে নতুন স্ট্যান্ডার্ড অনুযায়ী কোড হবে নিম্নরূপ:

### ❌ পুরানো ও নিষিদ্ধ কোড (Prohibited):
```tsx
<div>
  <label className="block text-xs font-medium text-slate-300 mb-1.5">
    Employee ID / Username
  </label>
  <input
    type="text"
    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
  />
  {errors.login_identifier && (
    <p className="text-xs font-medium text-rose-400 mt-1.5">
      {errors.login_identifier[0]}
    </p>
  )}
</div>
```

### ✅ নতুন বিগ ইআরপি স্ট্যান্ডার্ড কোড (Mandatory):
```tsx
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";

<FormField
  label="Employee ID / Username / Email"
  required
  error={errors.login_identifier}
>
  <TextInput
    value={identifier}
    onChange={(e) => setIdentifier(e.target.value)}
    placeholder="e.g. 255776, superadmin, or it@traceflow.com"
    leftIcon={<User className="h-4 w-4" />}
    isError={!!errors.login_identifier}
  />
</FormField>
```

---

## ৬. বাস্তবায়ন ও কমপ্লায়েন্স যাচাই (Verification Plan)

1. **টোকেন আপডেট:** `designTokens.ts`-এ ফর্ম ও এরর মেসেজের জন্য চূড়ান্ত টোকেন সংযুক্ত করা।
2. **কম্পোনেন্ট প্রিমিটিভ সৃষ্টি:** `FormField.tsx` এবং `TextInput.tsx` তৈরি করা।
3. **রিফ্যাক্টরিং:** `LoginPage.tsx` থেকে সমস্ত অ্যাড-হক ও ইনলাইন সিএসএস সরিয়ে নতুন `<FormField>` প্রিমিটিভে রূপান্তর করা।
4. **বিল্ড টেস্ট:** `npm run build` চালিয়ে কোনো টাইপ বা লিন্ট ত্রুটি নেই তা নিশ্চিত করা।

---

*(End of Enterprise Form Control & Pure Token-Driven UI Primitives SRS)*
