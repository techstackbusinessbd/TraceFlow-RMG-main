import { useAuthStore } from "../store/authStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export interface UomItem {
  code: string;
  name: string;
  is_base: boolean;
  factor: number;
}

export interface MasterMetadata {
  woven_categories: string[];
  category_items?: Record<string, string[]>;
  garment_items: string[];
  fabric_constructions: string[];
  wash_types: string[];
  seasons: {
    eu: string[];
    us: string[];
    years: string[];
  };
  size_scales: Record<string, string[]>;
  payment_terms: string[];
  uom_scales?: Record<string, UomItem[]>;
  style_statuses: Record<string, string>;
}

export interface MasterMetadataResponse {
  status: string;
  message: string;
  data: MasterMetadata;
}

// Resilient Fallback Object in case of offline/network interruption
export const DEFAULT_MASTER_METADATA: MasterMetadata = {
  woven_categories: [
    "Woven Tops (Shirts/Blouses)",
    "Woven Bottoms (Trousers/Chinos)",
    "Denim & Jeans",
    "Cargo & Utility Shorts",
    "Outerwear / Woven Jackets",
  ],
  category_items: {
    "Woven Tops (Shirts/Blouses)": [
      "Formal Dress Shirt",
      "Casual Button-Down Shirt",
      "Flannel Overshirt",
      "Short-Sleeve Resort Shirt",
      "Woven Tunic / Blouse",
    ],
    "Woven Bottoms (Trousers/Chinos)": [
      "Casual Chino Pant",
      "Slim Fit Stretch Chino",
      "Tailored Dress Trouser",
      "Pleated Work Trouser",
      "Jogger Woven Pant",
    ],
    "Denim & Jeans": [
      "5-Pocket Denim Jeans",
      "Slim Tapered Denim Pant",
      "Relaxed Fit Denim Jeans",
      "Denim Trucker Jacket",
      "Denim Carpenter Pant",
    ],
    "Cargo & Utility Shorts": [
      "Cargo Utility Pant",
      "Multi-Pocket Cargo Shorts",
      "Bermuda Shorts",
      "Chino Casual Shorts",
      "Tactical Field Shorts",
    ],
    "Outerwear / Woven Jackets": [
      "Woven Blazer / Suit Jacket",
      "Harrington Cotton Jacket",
      "Field Parka / Windbreaker",
      "Safari Utility Overshirt",
      "Puffer Woven Vest",
    ],
  },
  garment_items: [
    "Casual Chino Pant",
    "5-Pocket Denim Jeans",
    "Cargo Utility Pant",
    "Bermuda Shorts",
    "Formal Dress Shirt",
    "Casual Button-Down Shirt",
    "Flannel Overshirt",
    "Woven Blazer / Jacket",
  ],
  fabric_constructions: [
    "100% Cotton Twill (240 GSM)",
    "98% Cotton 2% Spandex Stretch Twill",
    "100% Cotton Poplin (120 GSM)",
    "100% Cotton Oxford Weave",
    "100% Cotton Indigo Denim (12 oz)",
    "99% Cotton 1% Elastane Denim",
    "65% Polyester 35% Cotton (TC) Twill",
    "100% Linen Plain Weave",
  ],
  wash_types: [
    "None / Raw / Rinse",
    "Enzyme Wash",
    "Stone Enzyme Wash",
    "Bleach Wash",
    "Acid Wash",
    "Tint & Distress",
    "Resin 3D Crinkle",
  ],
  seasons: {
    eu: [
      "Spring/Summer",
      "Autumn/Winter",
      "Pre-Fall",
      "Holiday",
      "All Seasons / Carry Over",
    ],
    us: [
      "Spring",
      "Summer",
      "Fall",
      "Holiday",
      "Resort / Cruise",
      "Back to School",
      "All Seasons / Carry Over",
    ],
    years: ["2025", "2026", "2027", "2028", "2029", "2030"],
  },
  size_scales: {
    "Men's Tops": ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    "Waist (Inches)": ["28", "30", "32", "34", "36", "38", "40"],
    "Waist x Inseam": ["30x32", "32x32", "34x32", "36x32", "38x32"],
  },
  payment_terms: [
    "LC at Sight",
    "Usance LC 30 Days",
    "Usance LC 60 Days",
    "Usance LC 90 Days",
    "TT / Advance",
    "Open Account (CAD)",
  ],
  uom_scales: {
    apparel: [
      { code: "Pcs", name: "Pieces", is_base: true, factor: 1 },
      { code: "Dzn", name: "Dozen", is_base: false, factor: 12 },
      { code: "Set", name: "Suit / Set", is_base: false, factor: 1 },
      { code: "Pair", name: "Pairs", is_base: false, factor: 1 },
      { code: "Pack", name: "Multi-pack", is_base: false, factor: 1 },
    ],
    fabric: [
      { code: "Yds", name: "Yards", is_base: true, factor: 1 },
      { code: "Mtr", name: "Meters", is_base: false, factor: 1.09361 },
      { code: "Kg", name: "Kilograms", is_base: true, factor: 1 },
      { code: "Lbs", name: "Pounds", is_base: false, factor: 0.453592 },
    ],
    accessories: [
      { code: "Pcs", name: "Pieces", is_base: true, factor: 1 },
      { code: "Gross", name: "Gross (144 pcs)", is_base: false, factor: 144 },
      { code: "Dzn", name: "Dozen (12 pcs)", is_base: false, factor: 12 },
      { code: "Cone", name: "Cone", is_base: false, factor: 1 },
      { code: "Roll", name: "Roll", is_base: false, factor: 1 },
      { code: "Thousand", name: "Thousand (1000 pcs)", is_base: false, factor: 1000 },
    ],
    packing: [
      { code: "Carton", name: "Carton (Ctn)", is_base: true, factor: 1 },
      { code: "Poly", name: "Polybag", is_base: false, factor: 1 },
      { code: "CBM", name: "Cubic Meter", is_base: false, factor: 1 },
      { code: "Pallet", name: "Pallet", is_base: false, factor: 1 },
    ],
  },
  style_statuses: {
    Development: "Development (TechPack Review)",
    Sampling: "Sampling (Proto / Fit)",
    Confirmed: "Confirmed (Ready for PO)",
    Bulk_Approved: "Bulk Approved (In Production)",
    Discontinued: "Discontinued",
  },
};

// In-memory cache to prevent redundant HTTP roundtrips across views
let cachedMetadata: MasterMetadata | null = null;

export async function getMasterMetadata(): Promise<MasterMetadata> {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  const token = useAuthStore.getState().token;
  try {
    const res = await fetch(`${API_BASE}/api/v1/master/metadata`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      return DEFAULT_MASTER_METADATA;
    }

    const json: MasterMetadataResponse = await res.json();
    cachedMetadata = json.data;
    return json.data;
  } catch {
    // Return resilient fallback on connection drop
    return DEFAULT_MASTER_METADATA;
  }
}
