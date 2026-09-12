# Software Requirements Specification (SRS)
## Module 03: RMG Master Order, Buyer PO & AI-Powered Matrix Management
**Document Version:** 2.0 (Enterprise Comprehensive Edition)  
**Target Audience:** Product Owner, Solution Architect, Backend Engineers, Frontend Engineers, QA Engineers  
**Language Standard:** Bengali (Bangla) Requirements & Architectural Manifesto  

---

## ১. নির্বাহী সারসংক্ষেপ (Executive Summary)
প্রচলিত সাধারণ ইআরপিতে সরাসরি বায়ার পিও (Buyer PO) এন্ট্রি করা হয়। কিন্তু বাংলাদেশের বাস্তব গার্মেন্টস ম্যানুফ্যাকচারিং প্রেক্ষাপটে বায়ার প্রথমে একটি **মোট ভলিউম/ক্যাপাসিটি (যেমন: ১০,০০০ পিস)** নিশ্চিত করে কিন্তু কোনো অফিসিয়াল বায়ার পিও (PO) প্রদান করে না। বায়ার সাধারণত বাল্ক ফেব্রিক ও ইয়ার্ন বুকিং কনফার্ম করতে বলে এবং পরবর্তীতে ডেলিভারি সিজন ভেদে (যেমন: Summer-এ ৫,০০০ পিস, Fall-এ ৫,০০০ পিস) পার্ট পার্ট করে পৃথক PO এবং নিজস্ব ফরম্যাটের কালার-সাইজ ব্রেকডাউন ইস্যু করে।

তদুপরি, বিভিন্ন আন্তর্জাতিক বায়ার (H&M, Zara, Target, Levi's) তাদের নিজস্ব ভিন্ন ভিন্ন ফরম্যাটে (PDF, Excel, Scan কপি) PO শিট প্রদান করে, যার ফলে ম্যানুয়ালি ডেটা এন্ট্রি করতে প্রচুর সময় নষ্ট হয় এবং কোটি টাকার ভুল হওয়ার ঝুঁকি থাকে।

এই বাস্তবতাকে শতভাগ ডিজিটাল ও নির্ভুলভাবে পরিচালনা করতে **TraceFlow RMG** সিস্টেমে **২-স্তর বিশিষ্ট অর্ডার ম্যানেজমেন্ট (Two-Tier Order Architecture)** এবং **AI-Powered Intelligent PO Parser** বাস্তবায়ন করা হবে:
1. **Tier-1: Master Order (`[CompanyCode]-[YY]-[UniqueNumber]`, যেমন: `TFL-26-0001`)** — ফ্যাক্টরির ইন্টারনাল মাস্টার ফাইল যা বায়ারের মোট প্রতিশ্রুত ভলিউম (১০,০০০ পিস) এবং সেন্ট্রাল মেটেরিয়াল/ফেব্রিক বুকিংকে ধারণ করে।
2. **Tier-2: Buyer Purchase Order / PO Received (`PO-XXXX` under Master Order)** — বায়ার যখন পরবর্তীতে সিজন ধরে নির্দিষ্ট PO ও ডেলিভারি ডেট প্রদান করে। এখানে বায়ারের অফিশিয়াল PO ফাইল (PDF/Excel) আপলোডের অপশন থাকবে এবং আধুনিক **AI Document Extraction Engine** যেকোনো বায়ারের ফাইল থেকে কালার ও সাইজ ম্যাট্রিক্স স্বয়ংক্রিয়ভাবে এক্সট্রাক্ট করে স্ক্রিনে ফিলআপ করে দেবে।

---

## ২. ডোমেন আর্কিটেকচার ও ডেটা হায়ারার্কি (Domain Architecture)

```mermaid
graph TD
    Buyer([Buyer: American Eagle / Zara]) -->|Confirms 10,000 Pcs Commitment| MasterOrder[1. Master Order: TFL-26-0001]
    MasterOrder -->|Bulk Procurement| MaterialBooking[Bulk Fabric & Trims Booking]
    
    MasterOrder -->|Part 1: Summer Season| PO1[2. Purchase Order: PO-8801 | 5,000 Pcs]
    MasterOrder -->|Part 2: Fall Season| PO2[2. Purchase Order: PO-8802 | 5,000 Pcs]
    
    PO1 -->|Official PO PDF/Excel Upload| AIPool1[AI PO Parser Engine]
    AIPool1 --> Matrix1[Color-Size Ratio Matrix: Summer 5,000 Pcs]
    
    PO2 -->|Official PO PDF/Excel Upload| AIPool2[AI PO Parser Engine]
    AIPool2 --> Matrix2[Color-Size Ratio Matrix: Fall 5,000 Pcs]
    
    Matrix1 --> Cutting1[Cutting Release & Bundle QR Tags]
    Matrix2 --> Cutting2[Cutting Release & Bundle QR Tags]
```

---

## ৩. বিস্তারিত ফাংশনাল রিকোয়ারমেন্টস (Functional Requirements)

### ৩.১. সাব-মডিউল ১: Master Order Management (`orders` / `master_orders`)
বায়ার যখন প্রাথমিক মোট ভলিউম নিশ্চিত করে (PO ছাড়া বা প্রাথমিক কন্ট্রাক্টে), তখন সিস্টেমে মাস্টার অর্ডার তৈরি হবে।

#### Master Order কোড নামকরণ স্ট্যান্ডার্ড (Strict System Auto-Generated Formula):
$$\mathbf{Master\ Order\ No} = \mathbf{[CompanyCode]}-\mathbf{[YY]}-\mathbf{[UniqueNumber]}$$
- **`CompanyCode`**: গ্রুপের যে সিস্টার কোম্পানিতে বায়ার অর্ডার বরাদ্দ করেছে তার ইউনিক কোড (যেমন: `TFL` বা `EGL` - যা `companies.code` থেকে আসবে)।
- **`YY`**: অর্ডারের চলতি ইংরেজি বছরের শেষ দুই ডিজিট (যেমন: ২০২৬ সালের জন্য `26`)।
- **`UniqueNumber`**: ৪-ডিজিটের অটো-ইনক্রিমেন্টেড সিকোয়েন্সিয়াল ইউনিক সিরিয়াল (যেমন: `0001`, `0002`... সংশ্লিষ্ট কোম্পানি ও বছর ভেদে ইউনিক)।
- **পূর্ণাঙ্গ উদাহরণ:** `TFL-26-0001`, `EGL-26-0002`

#### ফিল্ড লেভেল স্পেসিফিকেশন:
| ফিল্ডের নাম | ডেটা টাইপ | বাধ্যতামূলক? | ভ্যালিডেশন রুলস ও আচরণ | ইউআই কম্পোনেন্ট |
|---|---|---|---|---|
| `Master Order No` | String | সিস্টেম অটো (হ্যাঁ) | অপরিবর্তনীয়, ইউনিক, অটো-জেনারেটেড (`[CompanyCode]-[YY]-[Seq]`, যেমন `TFL-26-0001`)। ইউজার ম্যানুয়াল টাইপিং নিষিদ্ধ। | Disabled Input with "System Auto" Badge |
| `Company ID` | UUID | হ্যাঁ | গ্রুপের অনুমোদিত সিস্টার কোম্পানি (`companies`)। এর কোড দিয়ে জব নং তৈরি হবে। | Select Dropdown |
| `Buyer ID` | UUID | হ্যাঁ | মাস্টার বায়ার লাইব্রেরি (`buyers`) থেকে আসবে। | Searchable Dropdown |
| `Brand ID` | UUID | না | নির্বাচিত বায়ারের নিবন্ধিত সাব-ব্র্যান্ডসমূহ (`buyer_brands`)। | Select Dropdown |
| `Department ID` | UUID | না | নির্বাচিত বায়ারের প্রোডাকশন বিভাগসমূহ (`buyer_departments`)। | Select Dropdown |
| `Style ID` | UUID | হ্যাঁ | সিলেক্টেড বায়ারের আন্ডারে নিবন্ধিত অ্যাক্টিভ স্টাইল (`styles`) থেকে ফিল্টার হবে। | Searchable Dropdown |
| `Season Name` | String | হ্যাঁ | বায়ার ভিত্তিক ফ্যাশন কালেকশন (e.g. `Summer`, `Spring/Summer`, `Fall`, `Autumn/Winter`)। | Select Dropdown |
| `Season Year` | String | হ্যাঁ | ডেলিভারি ও ক্যালেন্ডার বছর (e.g. `2025`, `2026`, `2027`, `2028`, `2029`, `2030`)। | Select Dropdown |
| `Contract / Program Ref`| String | না | বায়ারের ইমেইল রেফারেন্স, সেলস কন্ট্রাক্ট (SC) বা প্রোগ্রাম কোড (Max: 100 chars)। | Text Input |
| `Total Committed Quantity` | Integer | হ্যাঁ | সর্বমোট প্রতিশ্রুত পরিমাণ (যেমন `10000`)। Must be > 0। | Number Input with Inline UOM |
| `Order Quantity UOM` | Enum | হ্যাঁ | পরিমাপের একক: `Pcs` (Pieces - Default), `Dzn` (Dozens), `Set` (Sets), `Pair` (Pairs), `Pack` (Multi-packs)। | Select Dropdown (Inline) |
| `Default Currency` | Enum | হ্যাঁ | `USD`, `EUR`, `GBP`, `BDT` (Default: USD)। | Select Dropdown |
| `Unit Price (FOB)` | Decimal | হ্যাঁ | গড় প্রতি পিস দর (e.g. `4.50`)। | Number Input |
| `Order Allocation Status` | Enum | হ্যাঁ | `Provisional` (কোনো PO আসেনি), `Partially_Confirmed` (আংশিক PO এসেছে), `Fully_Confirmed` (সম্পূর্ণ PO এসেছে), `In_Production`, `Completed`, `Cancelled`। | Status Badge |
| `Target Delivery Month` | String | না | সম্ভাব্য ডেলিভারি সময়কাল (e.g. `May - Sep 2026`)। | Text Input |
| `Remarks / Special Notes`| Text | না | বাণিজ্যিক ও টেকনিক্যাল শর্তাবলী। | Textarea |

---

### ৩.২. সাব-মডিউল ২: Buyer Purchase Order (PO Received & Splitting)
বায়ার যখন সিজন অনুযায়ী নির্দিষ্ট PO ও ডেলিভারি ডেট প্রদান করবে, তখন এই সেকশনে প্রতিটি PO এন্ট্রি বা স্প্লিট হবে।

#### ফিল্ড লেভেল স্পেসিফিকেশন:
| ফিল্ডের নাম | ডেটা টাইপ | বাধ্যতামূলক? | ভ্যালিডেশন রুলস | ইউআই কম্পোনেন্ট |
|---|---|---|---|---|
| `Master Order ID` | UUID | হ্যাঁ | প্যারেন্ট মাস্টার অর্ডারের ফরেন কি (`orders.id`)। | Hidden / Contextual |
| `Buyer PO Number` | String | হ্যাঁ | বায়ারের অফিসিয়াল PO শিট নম্বর (যেমন `PO-8801`)। বায়ার-ভিত্তিক ইউনিক। | Text Input |
| `Season Name` | String | হ্যাঁ | মাস্টার অর্ডার থেকে ইনহেরিট হয় অথবা বায়ার ভিত্তিক সিজন কালেকশন (যেমন `Summer`)। | Select Dropdown |
| `Season Year` | String | হ্যাঁ | ক্যালেন্ডার বছর (যেমন `2026`)। সিজন নেম ও ইয়ার মিলে কম্বাইন্ড সিজন গঠিত হয়। | Select Dropdown |
| `PO Quantity` | Integer | হ্যাঁ | এই নির্দিষ্ট PO-র জন্য নির্ধারিত পিস (যেমন `5000`)। | Number Input |
| `Ex-Factory Date` | Date | হ্যাঁ | ফ্যাক্টরি থেকে মাল বের হওয়ার শেষ তারিখ। | Date Picker |
| `Buyer Delivery Date`| Date | হ্যাঁ | বায়ারের পোর্টে পৌঁছানোর তারিখ। | Date Picker |
| `Shipment Mode` | Enum | হ্যাঁ | `Sea`, `Air`, `Sea-Air`, `Road` (Default: Sea)। | Select Dropdown |
| `Destination Port` | String | না | Discharge Port (e.g. Hamburg, New York, Felixstowe)। | Text Input |
| `PO Document File URL` | String/File | না | বায়ারের পাঠানো আসল PO ফাইল (`.pdf`, `.xlsx`, `.xls`, `.csv`)। | File Upload Dropzone |
| `PO Status` | Enum | হ্যাঁ | `Draft`, `PO_Received`, `Cutting_Ready`, `In_Sewing`, `Shipped`। | Status Badge |

#### গাণিতিক সমতা ও সুরক্ষা নীতি (Mathematical Integrity Constraints):
1. **Rule 1 (PO Quantities vs Master Order):** 
   $$\sum (\text{Buyer PO Quantities}) \le \text{Total Master Order Quantity}$$
   যদি কোনো মার্চেন্ডাইজার মোট ১০,০০০ পিসের বিপরীতে প্রথম PO-তে ৬,০০০ এবং দ্বিতীয় PO-তে ৫,০০০ (মোট ১১,০০০) ইনপুট দেয়, তবে সিস্টেম সাথে সাথে `422 Unprocessable Entity` এরর দেবে:
   *"Total PO quantity (11,000 Pcs) cannot exceed Master Order committed quantity (10,000 Pcs)."*
2. **Rule 2 (Live Unassigned PO Balance):**
   সিস্টেমে সর্বদাই একটি লাইভ রিড-অনলি কাউন্টার থাকবে:
   $$\text{Unassigned PO Balance} = \text{Master Order Qty} - \sum (\text{Confirmed PO Quantities})$$

---

### ৩.৩. সাব-মডিউল ৩: AI-Powered PO Parser & Color-Size Ratio Matrix
বায়ারদের PO ফাইলে সাইজ ও কালার ব্রেকডাউন ভিন্ন ভিন্ন ফরম্যাটে থাকে। এই জটিলতাকে স্বয়ংক্রিয় করতে **AI Document Extraction Engine** সংযুক্ত থাকবে।

#### ৩.৩.১. AI Extraction Workflow:
1. **File Upload:** মার্চেন্ডাইজার বায়ারের পাঠানো আসল PO ফাইল (PDF বা Excel) আপলোড করবে।
2. **AI Document Analysis:** AI ডকুমেন্টটি স্ক্যান করে নিম্নলিখিত ডেটাসমূহ স্বয়ংক্রিয়ভাবে এক্সট্রাক্ট করবে:
   - `buyer_po_number`
   - `delivery_date`
   - `colors` (বায়ারের কালার নাম ও কোড)
   - `sizes` (বায়ারের সাইজ লেবেল)
   - `matrix_quantities` (কালার ও সাইজ অনুপাতে পিস সংখ্যা)
3. **Smart Fuzzy Matching with Master Library:**
   - বায়ারের ফাইলে যদি লেখা থাকে `Wsh Blk` ➔ AI সিস্টেমের মাস্টার কালার `Washed Black` (`CLR-01`)-এর সাথে ম্যাচ করাবে।
   - বায়ারের ফাইলে যদি লেখা থাকে `MED` ➔ AI সিস্টেমের মাস্টার সাইজ `M`-এর সাথে ম্যাচ করাবে।
4. **Side-by-Side Verification Screen:**
   - স্ক্রিনের বাম পাশে বায়ারের আসল PDF/এক্সেল ফাইল ভিউয়ার থাকবে।
   - স্ক্রিনের ডান পাশে AI দ্বারা এক্সট্রাক্ট করা কালার-সাইজ ম্যাট্রিক্স গ্রিড থাকবে।
   - মার্চেন্ডাইজার ২ সেকেন্ডে মিলিয়ে দেখে কোনো সংখ্যা এডিট করতে চাইলে এডিট করে **"Approve & Confirm PO"** বাটনে চাপবে।

#### ৩.৩.২. ম্যাট্রিক্সের গাণিতিক অখণ্ডতা রুল (The Golden Matrix Rule):
$$\sum (\text{Matrix Cell Quantities}) \equiv \text{PO Quantity}$$
যদি বায়ার PO কোয়ান্টিটি হয় ৫,০০০ পিস, তবে ম্যাট্রিক্সের ভেতরের সমস্ত কালার ও সাইজ সেলের যোগফল অবিকল **৫,০০০** হতে হবে। ১ পিস কম বা বেশি হলে সিস্টেম অনুমোদন ব্লক করে দেবে এবং অমিল সংখ্যা হাইলাইট করবে।

---

### ৩.৪. সাব-মডিউল ৪: Material & Bulk Booking Linkage
বায়ার PO না দিলেও Master Order-এর অধীনে বাল্ক ফেব্রিক ও এক্সেসরিজ বুকিং পরিচালিত হবে:
1. **Bulk Fabric Booking:**
   - প্রতি ডজনে ফেব্রিক কনজাম্পশন (যেমন `1.65 Yds/Pc` বা `2.40 Kg/Dzn`)।
   - ১০,০০০ পিসের জন্য মোট প্রয়োজনীয় ফেব্রিক = ১৬,৫০০ গজ।
   - সাপ্লায়ার মিলের নাম ও বুকিং রেফারেন্স (যেমন `BK-MILL-9901`)।
2. **Four-Stage Material Tracking:**
   $$\text{Required} \longrightarrow \text{Booked} \longrightarrow \text{In-House / Received} \longrightarrow \text{Issued to Floor}$$

---

### ৩.৫. সাব-মডিউল ৫: Central Unit of Measure (UOM) Architecture & Conversion Standard
গার্মেন্টস ইআরপি সিস্টেমে বিভিন্ন বাণিজ্যিক ও প্রযুক্তিগত কার্যক্রমে ভিন্ন ভিন্ন একক (UOM) ব্যবহৃত হয়। এই ভিন্নতাকে কেন্দ্রীয়ভাবে সুশৃঙ্খল রাখতে সিস্টেম-ওয়াইড সেন্ট্রাল UOM ইঞ্জিন অনুসৃত হবে।

#### ৩.৫.১. কেন্দ্রীয় UOM ক্যাটাগরি ও স্ট্যান্ডার্ড স্কেল:
| UOM ক্যাটাগরি | অনুমোদিত ইউনিটসমূহ (Allowed Units) | মূল ভিত্তি একক (Base Unit) | প্রয়োগ ক্ষেত্র (Application Scope) |
|---|---|---|---|
| **`apparel`** | `Pcs` (Pieces), `Dzn` (Dozens), `Set` (Sets), `Pair` (Pairs), `Pack` (Multi-packs) | `Pcs` | অর্ডার মাস্টার, বায়ার PO, ফ্লোর প্রোডাকশন, কোয়ালিটি অডিট |
| **`fabric`** | `Yds` (Yards), `Mtr` (Meters), `Kg` (Kilograms), `Lbs` (Pounds) | `Yds` / `Kg` | বাল্ক ফেব্রিক বুকিং, রিসিভিং, রোল ইন্সপেকশন, স্প্রেডিং |
| **`accessories`** | `Gross` (Grs - 144 pcs), `Dzn` (12 pcs), `Cone`, `Roll`, `Thousand` (Ths), `Pcs` | `Pcs` | ট্রিমস বুকিং, ইয়ার্ন কোণ, জিপার, বাটন, লেবেল ইনভেন্টরি |
| **`packing`** | `Carton` (Ctn), `Poly`, `CBM` (Cubic Meter), `Pallet` | `Carton` | ফিনিশিং, কমার্শিয়াল প্যাকিং লিস্ট, কার্গো বুকিং |

#### ৩.৫.২. গাণিতিক কনভার্সন নীতি (Mathematical Conversion Rules):
১. **Apparel Conversion to Base Pieces:**
   $$\text{Base Pcs} = 
   \begin{cases} 
   \text{Quantity} \times 12, & \text{if UOM} = \text{'Dzn'} \\
   \text{Quantity} \times 1, & \text{if UOM} = \text{'Pcs'} \\
   \text{Quantity} \times (\text{Pieces per Set}), & \text{if UOM} = \text{'Set'}
   \end{cases}$$
২. **The Zero-Variance Rule for Matrix:**
   ম্যাট্রিক্সের সমস্ত সেল সর্বদা শারীরিক **`Pcs` (Pieces)** এককে হিসাব করবে। বায়ার অর্ডারে ইউজার `1,000 Dzn` এন্ট্রি দিলে সিস্টেম ম্যাট্রিক্সে টার্গেট কোয়ান্টিটিকে স্বয়ংক্রিয়ভাবে $1,000 \times 12 = 12,000\text{ Pcs}$ হিসেবে সিঙ্ক করবে।

#### ৩.৫.৩. ইউআই কম্পোনেন্ট স্ট্যান্ডার্ড (`<UomQuantityInput />`):
সিস্টেমের যেকোনো ফর্মে পরিমাণ ও ইউনিট গ্রহণের ক্ষেত্রে অ্যাড-হক ইনপুট লেখা সম্পূর্ণ নিষিদ্ধ। বাধ্যতামূলকভাবে সেন্ট্রাল প্রিমিটিভ `<UomQuantityInput />` ব্যবহার করতে হবে:
- **ভিজ্যুয়াল আর্কিটেকচার**: বামে সংখ্যাগত ইনপুট ফিল্ড এবং ডানে ইনলাইন ড্রপডাউন সিলেক্টর (`UI_TOKENS.inputGroup.*`)।
- **লাইভ কনভার্সন ব্যাজ**: যদি নির্বাচিত ইউনিট বেস ইউনিট না হয় (যেমন `Dzn`), তবে নিচে স্বয়ংক্রিয়ভাবে সমতুল্য সংখ্যা রূপান্তর (e.g. `Equivalent: 12,000 Pcs`) প্রদর্শিত হবে।

---

## ৪. ইউজার ইন্টারফেস ও স্ক্রিন কাঠামো (UI/UX Engineering Standards)
গ্লোবাল প্রজেক্ট রুলস (`AGENTS.md`) কঠোরভাবে অনুসৃত হবে:
1. **Strict No Modals Rule:** মোডাল বা পপআপ সম্পূর্ণ নিষিদ্ধ। সমস্ত ফর্ম, ম্যাট্রিক্স এন্ট্রি ও এডিট ফুল ডেডিকেটেড পেজে হবে।
2. **Mandatory Golden List Page Standard (3-Tier Layout):**
   - **Page 1: Master Orders Directory (`/orders/master`)**:
     - *Tier 1:* PageHeader (`Master Orders Directory`, কাউন্টার ব্যাজ e.g. `12 Orders`, "Create Master Order" সলিড বাটন)।
     - *Tier 2:* FilterToolbar (Search by Job No / Contract / Buyer, Buyer filter, Status filter, Sort by Job No, Per-page dropdown 10, 15, 25, 50)।
     - *Tier 3:* Standard DataTable (Master Order No, Buyer & Style, Total Qty, Confirmed PO Qty, Unassigned Balance, Order Status, Actions: View Details, Add PO)।
   - **Page 2: Buyer Purchase Orders Directory (`/orders/purchase-orders`)**:
     - সমস্ত বায়ার PO-সমূহের তালিকা (Buyer PO No, Master Order Ref, Season, Ex-Factory Date, PO Qty, Production Stage Status, Actions)।
3. **Dedicated PO Creation & AI Matrix Page (`/orders/master/:id/add-po`)**:
   - উপরে PO বেসিক্স (Buyer PO No, Season, Delivery Date, PO Qty)।
   - ড্রপজোন: Drag & Drop Buyer PO Sheet (.pdf, .xlsx)।
   - "Analyze with AI" অ্যাকশন বাটন ➔ সাইড-বাই-সাইড প্রিভিউ ও ইন্টারেক্টিভ স্প্রেডশীট ম্যাট্রিক্স গ্রিড।
4. **Pure Server-Side Validation:** ব্রাউজার ডিফল্ট পপআপ নয়; সার্ভার থেকে আসা ৪২২ এরর ফিল্ডের নিচে স্পষ্টভাবে লাল টেক্সটে উপস্থাপিত হবে।

---

## ৫. ডাটাবেজ রিলেশনাল স্কিমা (Database Schema Design)

```
1. master_orders (Table: orders)
   - id: UUID (PK)
   - company_id: UUID (FK -> companies)
   - order_code: VARCHAR(30) UNIQUE // Formula: [CompanyCode]-[YY]-[UniqueNumber] e.g. TFL-26-0001
   - buyer_id: UUID (FK -> buyers)
   - brand_id: UUID NULLABLE (FK -> buyer_brands)
   - department_id: UUID NULLABLE (FK -> buyer_departments)
   - style_id: UUID (FK -> styles)
   - contract_ref: VARCHAR(100) NULLABLE
   - total_qty: INTEGER // 10,000 Pcs
   - currency: VARCHAR(10) DEFAULT 'USD'
   - unit_price: DECIMAL(10,4) // FOB Price
   - status: ENUM ('Provisional', 'Partially_Confirmed', 'Fully_Confirmed', 'In_Production', 'Completed', 'Cancelled')
   - target_delivery_month: VARCHAR(50) NULLABLE
   - remarks: TEXT NULLABLE
   - created_by: UUID (FK -> users)
   - updated_by: UUID NULLABLE (FK -> users)
   - timestamps, softDeletes

2. buyer_purchase_orders (Table: buyer_purchase_orders)
   - id: UUID (PK)
   - master_order_id: UUID (FK -> orders.id)
   - po_code: VARCHAR(30) UNIQUE // System internal tracking code e.g. PO-SYS-01
   - buyer_po_number: VARCHAR(100) // Buyer's official PO No e.g. PO-8801
   - season_name: VARCHAR(50) // e.g. Summer 2026
   - po_qty: INTEGER // e.g. 5,000 Pcs
   - ex_factory_date: DATE
   - buyer_delivery_date: DATE
   - shipment_mode: VARCHAR(20) DEFAULT 'Sea'
   - destination_port: VARCHAR(100) NULLABLE
   - po_file_url: VARCHAR(255) NULLABLE // Attached official PO PDF/Excel
   - ai_parsed_payload: JSON NULLABLE // Raw AI extraction payload for audit
   - status: ENUM ('Draft', 'PO_Received', 'Cutting_Ready', 'In_Sewing', 'Shipped', 'Cancelled')
   - created_by: UUID (FK -> users)
   - timestamps, softDeletes

3. po_color_size_breakdowns (Table: po_color_size_breakdowns)
   - id: UUID (PK)
   - buyer_purchase_order_id: UUID (FK -> buyer_purchase_orders.id)
   - garment_color_id: UUID NULLABLE (FK -> garment_colors.id)
   - garment_size_id: UUID NULLABLE (FK -> garment_sizes.id)
   - color_code: VARCHAR(50)
   - color_name: VARCHAR(100)
   - size_name: VARCHAR(50)
   - quantity: INTEGER // Cell quantity e.g. 600
   - timestamps

4. master_order_material_bookings (Table: order_material_bookings)
   - id: UUID (PK)
   - master_order_id: UUID (FK -> orders.id)
   - booking_code: VARCHAR(30) UNIQUE // e.g. BKG-FB-01
   - material_type: ENUM ('Fabric', 'Sewing_Trims', 'Finishing_Trims', 'Packaging')
   - supplier_id: UUID (FK -> suppliers.id)
   - item_description: VARCHAR(200)
   - required_qty: DECIMAL(12,2)
   - booked_qty: DECIMAL(12,2)
   - received_qty: DECIMAL(12,2) DEFAULT 0
   - uom: VARCHAR(20) // Yards, Kgs, Gross, Pcs
   - status: ENUM ('Draft', 'Issued', 'Partially_Received', 'In_House')
   - timestamps, softDeletes
```

---

## ৬. টেস্ট কেস ও গ্রহণযোগ্যতার মানদণ্ড (Acceptance Criteria for QA)

- [ ] **AC-01 (Job No Formula):** নতুন Master Order তৈরির সময় সিস্টেম স্বয়ংক্রিয়ভাবে `[CompanyCode]-[YY]-[UniqueNumber]` (যেমন `TFL-26-0001`) কোড তৈরি করবে। ইউজার ম্যানুয়ালি কোড টাইপ করতে পারবে না।
- [ ] **AC-02 (Cascading Selection):** বায়ার সিলেক্ট না করা পর্যন্ত স্টাইল, ব্র্যান্ড ও ডিপার্টমেন্ট ড্রপডাউন ডিজেবল থাকবে। বায়ার সিলেক্ট করার পর কেবল ওই বায়ারের স্টাইলগুলো লোড হবে।
- [ ] **AC-03 (Allocation Ceiling Validation):** ১০,০০০ পিসের Master Order-এর অধীনে বায়ার PO-সমূহের মোট যোগফল ১০,০০০ পিস অতিক্রম করলে সিস্টেম `422 Error` দিয়ে সেভ ব্লক করবে।
- [ ] **AC-04 (Matrix Golden Sum Rule):** কালার-সাইজ ম্যাট্রিক্স গ্রিডের সমস্ত ঘরের যোগফল সংশ্লিষ্ট বায়ার PO কোয়ান্টিটির সাথে ১ পিসও অমিল হলে সংরক্ষণ প্রতিহত হবে।
- [ ] **AC-05 (Official PO File Attachment):** বায়ারের অফিশিয়াল PO শিট (PDF/Excel) আপলোড করা যাবে এবং ডাউনলোডের জন্য প্রস্তুত থাকবে।
- [ ] **AC-06 (AI Matrix Extraction):** বায়ার PO আপলোড করে "Extract with AI" বাটনে চাপলে AI স্বয়ংক্রিয়ভাবে কালার ও সাইজ টেবিল শনাক্ত করে ম্যাট্রিক্স গ্রিড পূরণ করবে এবং মার্চেন্ডাইজারকে প্রিভিউ দেখাবে।

---
*(End of SRS Document)*
