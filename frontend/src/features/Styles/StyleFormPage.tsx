import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Building2,
  Plus,
  Trash2,
  Tag,
  Scissors,
  Layers,
  Palette,
  Sparkles,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { Toggle } from "../../components/common/Toggle";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getStyleById,
  createStyle,
  updateStyle,
  getStyleNextCode,
  type StyleFormData,
  type StyleColorItem,
} from "../../services/styleService";
import { getOperationalCompanies, type Company } from "../../services/companyService";
import { getBuyers, type Buyer } from "../../services/buyerService";

interface StyleFormPageProps {
  mode: "create" | "edit";
  styleId?: string | number;
  onNavigate: (path: string) => void;
}

const WOVEN_CATEGORIES = [
  "Woven Tops (Shirts/Blouses)",
  "Woven Bottoms (Trousers/Chinos)",
  "Denim & Jeans",
  "Cargo & Utility Shorts",
  "Outerwear / Woven Jackets",
];

const WASH_TYPES = [
  "None / Raw / Rinse",
  "Enzyme Wash",
  "Stone Enzyme Wash",
  "Bleach Wash",
  "Acid Wash",
  "Tint & Distress",
  "Resin 3D Crinkle",
];

const COMMON_SEASONS = [
  "Spring/Summer 2026",
  "Autumn/Winter 2026",
  "Pre-Fall 2026",
  "Spring/Summer 2027",
  "Autumn/Winter 2027",
  "All Seasons / Carry Over",
];

const COMMON_GARMENT_ITEMS = [
  "Casual Chino Pant",
  "5-Pocket Denim Jeans",
  "Cargo Utility Pant",
  "Bermuda Shorts",
  "Formal Dress Shirt",
  "Casual Button-Down Shirt",
  "Flannel Overshirt",
  "Woven Blazer / Jacket",
];

const COMMON_FABRICS = [
  "100% Cotton Twill (240 GSM)",
  "98% Cotton 2% Spandex Stretch Twill",
  "100% Cotton Poplin (120 GSM)",
  "100% Cotton Oxford Weave",
  "100% Cotton Indigo Denim (12 oz)",
  "99% Cotton 1% Elastane Denim",
  "65% Polyester 35% Cotton (TC) Twill",
  "100% Linen Plain Weave",
];

const PRESET_SIZE_SCALES = {
  "Men's Tops": ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  "Waist (Inches)": ["28", "30", "32", "34", "36", "38", "40"],
  "Waist x Inseam": ["30x32", "32x32", "34x32", "36x32", "38x32"],
};

export const StyleFormPage: React.FC<StyleFormPageProps> = ({ mode, styleId, onNavigate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
  const [nextCode, setNextCode] = useState<string>("Loading...");
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const saved = localStorage.getItem("traceflow_style_categories");
    return saved ? JSON.parse(saved) : WOVEN_CATEGORIES;
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [formData, setFormData] = useState<StyleFormData>({
    company_id: 1,
    buyer_id: "",
    brand_id: null,
    buyer_style_no: "",
    style_name: "",
    product_category: WOVEN_CATEGORIES[1], // Default: Woven Bottoms
    garment_item: "Casual Chino Pant",
    fabric_type: "100% Cotton Twill",
    season: "Spring/Summer 2026",
    base_smv: 18.5,
    wash_type: WASH_TYPES[1], // Enzyme Wash
    description: "",
    status: "Development",
    is_active: true,
    colors: [
      { color_code: "BLK-01", color_name: "Washed Vintage Black", hex_code: "#1f2937" },
      { color_code: "NVY-01", color_name: "Midnight Navy", hex_code: "#1e3a8a" },
    ],
    sizes: [
      { size_name: "30", sort_order: 1 },
      { size_name: "32", sort_order: 2 },
      { size_name: "34", sort_order: 3 },
      { size_name: "36", sort_order: 4 },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch operational companies (excluding Platform Owner)
  useEffect(() => {
    getOperationalCompanies()
      .then((operationalList) => {
        setCompanies(operationalList);
        if (operationalList.length > 0 && mode === "create") {
          const defaultCo = operationalList[0];
          setSelectedCompanyId(defaultCo.id);
          setFormData((prev) => ({ ...prev, company_id: defaultCo.id }));
        }
      })
      .catch(() => {});
  }, [mode]);

  // Fetch buyers (filtered by selected Company and Active status)
  useEffect(() => {
    if (!selectedCompanyId) return;
    getBuyers({ company_id: selectedCompanyId, status: "active", per_page: 100 })
      .then((res) => {
        setBuyers(res.data);
        // If current buyer doesn't belong to newly selected company, reset buyer_id
        if (res.data.length > 0 && mode === "create") {
          setFormData((prev) => ({
            ...prev,
            buyer_id: res.data.some((b) => b.id === prev.buyer_id) ? prev.buyer_id : "",
          }));
        }
      })
      .catch(() => setBuyers([]));
  }, [selectedCompanyId, mode]);

  // Load next code preview in create mode
  useEffect(() => {
    if (mode === "create" && selectedCompanyId) {
      getStyleNextCode(selectedCompanyId)
        .then((res) => setNextCode(res.data.code))
        .catch(() => setNextCode("AWL-STY-26-0001"));
    }
  }, [mode, selectedCompanyId]);

  // Fetch style details in edit mode
  useEffect(() => {
    if (mode === "edit" && styleId) {
      getStyleById(styleId)
        .then((data) => {
          setSelectedCompanyId(data.company_id);
          setNextCode(data.code);
          setFormData({
            company_id: data.company_id,
            buyer_id: data.buyer_id,
            brand_id: data.brand_id || null,
            buyer_style_no: data.buyer_style_no,
            style_name: data.style_name,
            product_category: data.product_category,
            garment_item: data.garment_item,
            fabric_type: data.fabric_type,
            season: data.season,
            base_smv: Number(data.base_smv),
            wash_type: data.wash_type,
            description: data.description || "",
            status: data.status,
            is_active: data.is_active,
            colors: (data.colors || []).map((c) => ({
              id: c.id,
              color_code: c.color_code,
              color_name: c.color_name,
              pantone_ref: c.pantone_ref,
              hex_code: c.hex_code,
            })),
            sizes: (data.sizes || []).map((s) => ({
              id: s.id,
              size_name: s.size_name,
              sort_order: s.sort_order,
            })),
          });
        })
        .catch(() => {
          showToast("error", "Error", "Could not load style details.");
        });
    }
  }, [mode, styleId]);

  // Handle color repeater
  const handleAddColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        { color_code: `CLR-0${prev.colors.length + 1}`, color_name: "", hex_code: "#0066FF" },
      ],
    }));
  };

  const handleRemoveColor = (idx: number) => {
    if (formData.colors.length <= 1) {
      showToast("error", "Rule Alert", "At least one colorway is required for a Style.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx),
    }));
  };

  const handleColorChange = (idx: number, field: keyof StyleColorItem, val: string) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors];
      nextColors[idx] = { ...nextColors[idx], [field]: val };
      return { ...prev, colors: nextColors };
    });
  };

  // Handle size builder
  const handleAddSize = (sizeName: string = "") => {
    setFormData((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        { size_name: sizeName, sort_order: prev.sizes.length + 1 },
      ],
    }));
  };

  const handleRemoveSize = (idx: number) => {
    if (formData.sizes.length <= 1) {
      showToast("error", "Rule Alert", "At least one size is required in the size scale.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== idx),
    }));
  };

  const handleApplyPresetSizes = (sizes: string[]) => {
    setFormData((prev) => ({
      ...prev,
      sizes: sizes.map((s, idx) => ({ size_name: s, sort_order: idx + 1 })),
    }));
  };

  // Helper for normalized comparison
  const normalizeCategory = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Real-time suggestions for identical or closely matching categories
  const categorySuggestions = React.useMemo(() => {
    const input = newCategoryInput.trim();
    if (!input || input.length < 2) return [];

    const normInput = normalizeCategory(input);
    const tokens = input.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    return categoriesList.filter((cat) => {
      const normCat = normalizeCategory(cat);
      // 1. Exact or prefix match
      if (normCat.includes(normInput) || normInput.includes(normCat)) return true;
      // 2. Token overlap (e.g. user types "Denim" or "Jackets" or "Jeans")
      return tokens.some((token) => normCat.includes(token));
    });
  }, [newCategoryInput, categoriesList]);

  // Anti-Garbage Category Addition with Duplicate & Formatting Guards
  const handleSaveNewCategory = () => {
    const trimmed = newCategoryInput.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setCategoryError("Please enter a category name.");
      return;
    }

    if (trimmed.length < 3) {
      setCategoryError("Category name must be at least 3 characters.");
      return;
    }

    // Auto Title-Case formatting (e.g. "workwear overalls" -> "Workwear Overalls")
    const formatted = trimmed
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Check duplicate case-insensitively
    const isDuplicate = categoriesList.some(
      (cat) => normalizeCategory(cat) === normalizeCategory(formatted)
    );

    if (isDuplicate) {
      const existing = categoriesList.find(
        (cat) => normalizeCategory(cat) === normalizeCategory(formatted)
      );
      setCategoryError(`This category already exists as "${existing}". Please select it from the list.`);
      return;
    }

    const updated = [...categoriesList, formatted];
    setCategoriesList(updated);
    localStorage.setItem("traceflow_style_categories", JSON.stringify(updated));
    setFormData((prev) => ({ ...prev, product_category: formatted }));
    setNewCategoryInput("");
    setCategoryError(null);
    setIsAddingCategory(false);
    showToast("success", "Category Added", `"${formatted}" has been added and selected.`);
  };

  const handleSelectExistingSuggestion = (existingCat: string) => {
    setFormData((prev) => ({ ...prev, product_category: existingCat }));
    setNewCategoryInput("");
    setCategoryError(null);
    setIsAddingCategory(false);
    showToast("success", "Category Selected", `"${existingCat}" selected directly from existing library.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createStyle(formData);
        showToast("success", "Success", "Style created successfully.");
      } else {
        await updateStyle(styleId!, formData);
        showToast("success", "Success", "Style updated successfully.");
      }
      setTimeout(() => {
        onNavigate("/master/styles");
      }, 1000);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.errors)) {
          fieldErrors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(fieldErrors);
        showToast("error", "Validation Error", "Please review the highlighted fields.");
      } else {
        showToast("error", "Error", apiErr.message || "Failed to save style record.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const selectedBuyer = buyers.find((b) => b.id === Number(formData.buyer_id));

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tier 1: Page Header */}
      <PageHeader
        title={mode === "create" ? "Create Style" : `Edit Style: ${formData.style_name || nextCode}`}
        badgeLabel="Style Code"
        badgeCount={nextCode}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate(mode === "edit" && styleId ? `/master/styles/${styleId}` : "/master/styles")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save className="h-3.5 w-3.5" />}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : mode === "create" ? "Save Style" : "Save Changes"}
            </Button>
          </div>
        }
      />

      {/* Tier 2: 2-Column Golden Layout */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2/3 Main Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Card 1: Core Affiliations */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0066FF]" />
                  <h2 className={UI_TOKENS.card.title}>Buyer & Commercial Affiliation</h2>
                </div>
                <span className="text-xs text-slate-400">Step 1 of 4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company" required error={errors.company_id}>
                  <select
                    className={UI_TOKENS.input.select}
                    value={formData.company_id}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      setSelectedCompanyId(cid);
                      setFormData((prev) => ({ ...prev, company_id: cid }));
                    }}
                    disabled={mode === "edit"}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Buyer" required error={errors.buyer_id}>
                  <select
                    className={UI_TOKENS.input.select}
                    value={formData.buyer_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, buyer_id: Number(e.target.value) || "" }))}
                  >
                    <option value="">Select Buyer</option>
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Season" required error={errors.season} helperText="Select standard season or type custom.">
                  <TextInput
                    list="season-presets"
                    placeholder="e.g. Spring/Summer 2026"
                    value={formData.season}
                    onChange={(e) => setFormData((prev) => ({ ...prev, season: e.target.value }))}
                  />
                  <datalist id="season-presets">
                    {COMMON_SEASONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </FormField>

                <FormField label="Garment Item" required error={errors.garment_item} helperText="Select standard garment or type custom item.">
                  <TextInput
                    list="garment-presets"
                    placeholder="e.g. Casual Chino Pant, Formal Shirt"
                    value={formData.garment_item}
                    onChange={(e) => setFormData((prev) => ({ ...prev, garment_item: e.target.value }))}
                  />
                  <datalist id="garment-presets">
                    {COMMON_GARMENT_ITEMS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </FormField>
              </div>
            </div>

            {/* Card 2: Garment & Technical Specifications */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#0066FF]" />
                  <h2 className={UI_TOKENS.card.title}>Woven Specifications & Engineering</h2>
                </div>
                <span className="text-xs text-slate-400">Step 2 of 4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Buyer Style No" required error={errors.buyer_style_no} helperText="Buyer's official style identification code.">
                  <TextInput
                    placeholder="e.g. HM-JEANS-001"
                    value={formData.buyer_style_no}
                    onChange={(e) => setFormData((prev) => ({ ...prev, buyer_style_no: e.target.value }))}
                  />
                </FormField>

                <FormField label="Style Name" required error={errors.style_name} helperText="Descriptive commercial name.">
                  <TextInput
                    placeholder="e.g. Men's Slim Fit Chino Pant"
                    value={formData.style_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, style_name: e.target.value }))}
                  />
                </FormField>

                <FormField
                  label="Woven Category"
                  required
                  error={errors.product_category}
                  helperText="Choose standard or add verified custom category."
                >
                  <div className="flex items-center gap-1.5">
                    <select
                      className={`flex-1 ${UI_TOKENS.input.select}`}
                      value={formData.product_category}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_NEW__") {
                          setIsAddingCategory(true);
                          setCategoryError(null);
                        } else {
                          setFormData((prev) => ({ ...prev, product_category: e.target.value }));
                        }
                      }}
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="text-blue-600 font-bold bg-blue-50">
                        + Add New Category...
                      </option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(true);
                        setCategoryError(null);
                      }}
                      className="p-2 text-[#0066FF] hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer shadow-2xs shrink-0"
                      title="Add New Category with Anti-Garbage Engine"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </FormField>

                <FormField label="Fabric Construction" required error={errors.fabric_type} helperText="Select popular weave/composition or type custom.">
                  <TextInput
                    list="fabric-presets"
                    placeholder="e.g. 100% Cotton Twill, 12 oz Denim"
                    value={formData.fabric_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fabric_type: e.target.value }))}
                  />
                  <datalist id="fabric-presets">
                    {COMMON_FABRICS.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </FormField>

                <FormField label="Base SMV (Minutes)" required error={errors.base_smv} helperText="Standard Minute Value calculated by IE team.">
                  <TextInput
                    type="number"
                    step="0.01"
                    placeholder="18.50"
                    value={formData.base_smv === "" ? "" : String(formData.base_smv)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, base_smv: e.target.value === "" ? "" : Number(e.target.value) }))}
                  />
                </FormField>

                <FormField label="Garment Wash Type" required error={errors.wash_type}>
                  <select
                    className={UI_TOKENS.input.select}
                    value={formData.wash_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, wash_type: e.target.value }))}
                  >
                    {WASH_TYPES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Technical Styling Notes" error={errors.description}>
                    <textarea
                      rows={2}
                      className={UI_TOKENS.input.base}
                      placeholder="Enter stitching tolerances, special pocket construction, or fusing instructions..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Card 3: Colorways Repeater */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#0066FF]" />
                  <h2 className={UI_TOKENS.card.title}>Colorways Matrix</h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddColor}
                >
                  Add Color
                </Button>
              </div>

              {errors.colors && (
                <div className="p-2 mb-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded">
                  {errors.colors}
                </div>
              )}

              <div className="space-y-2.5">
                {formData.colors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded-md">
                    <div className="w-28">
                      <TextInput
                        placeholder="Color Code"
                        value={color.color_code}
                        onChange={(e) => handleColorChange(idx, "color_code", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <TextInput
                        placeholder="Color Name (e.g. Washed Vintage Black)"
                        value={color.color_name}
                        onChange={(e) => handleColorChange(idx, "color_name", e.target.value)}
                      />
                    </div>
                    <div className="w-32 hidden sm:block">
                      <TextInput
                        placeholder="Pantone TCX"
                        value={color.pantone_ref || ""}
                        onChange={(e) => handleColorChange(idx, "pantone_ref", e.target.value)}
                      />
                    </div>
                    <div className="w-10">
                      <input
                        type="color"
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5 bg-white"
                        value={color.hex_code || "#0066FF"}
                        onChange={(e) => handleColorChange(idx, "hex_code", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => handleRemoveColor(idx)}
                      disabled={formData.colors.length <= 1}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Size Scale Builder */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0066FF]" />
                  <h2 className={UI_TOKENS.card.title}>Size Scale Matrix</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
                  {Object.entries(PRESET_SIZE_SCALES).map(([name, scale]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleApplyPresetSizes(scale)}
                      className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-[#0066FF] hover:bg-blue-100 rounded border border-blue-200 cursor-pointer transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {errors.sizes && (
                <div className="p-2 mb-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded">
                  {errors.sizes}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {formData.sizes.map((sz, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-white border border-slate-300 rounded-md shadow-2xs font-mono text-xs text-slate-800"
                  >
                    <span>{sz.size_name || `Size ${idx + 1}`}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(idx)}
                      disabled={formData.sizes.length <= 1}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const promptSize = window.prompt("Enter new size label (e.g. 42 or 4XL):");
                    if (promptSize && promptSize.trim()) {
                      handleAddSize(promptSize.trim());
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0066FF] hover:bg-blue-50 px-2.5 py-1 rounded border border-dashed border-[#0066FF] cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Size</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 1/3 Sidebar */}
          <div className="space-y-4">
            {/* Sidebar Card 1: System Identifiers & Status */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#0066FF]" />
                  <h2 className={UI_TOKENS.card.title}>Governance & Status</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={UI_TOKENS.form.label}>System Tracking Code</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs rounded-md px-3 py-1.5 cursor-not-allowed"
                      value={nextCode}
                      disabled
                      readOnly
                    />
                    <Badge variant="code">System Auto</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Unique multi-tenant identifier across reports and barcodes.</p>
                </div>

                <FormField label="Lifecycle Status" required error={errors.status}>
                  <select
                    className={UI_TOKENS.input.select}
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="Development">Development (TechPack Review)</option>
                    <option value="Sampling">Sampling (Proto / Fit)</option>
                    <option value="Confirmed">Confirmed (Ready for PO)</option>
                    <option value="Bulk_Approved">Bulk Approved (In Production)</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </FormField>

                <div className="pt-2 border-t border-slate-100">
                  <Toggle
                    label="Operational Status"
                    description="Controls whether this style appears in Order entry dropdowns."
                    checked={formData.is_active}
                    onChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Card 2: Live Summary Preview */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0066FF]" />
                  <h2 className={UI_TOKENS.card.title}>Style Summary Card</h2>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Company Unit:</span>
                  <span className="font-semibold text-slate-800">{selectedCompany ? selectedCompany.code : "—"}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Buyer Client:</span>
                  <span className="font-semibold text-slate-800">{selectedBuyer ? selectedBuyer.name : "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Buyer Style No:</span>
                  <span className="font-mono font-semibold text-slate-800">{formData.buyer_style_no || "—"}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Calculated SMV:</span>
                  <span className="font-mono font-bold text-[#0066FF]">{Number(formData.base_smv || 0).toFixed(2)} min</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Colorway Count:</span>
                  <span className="font-semibold text-slate-800">{formData.colors.length} Colors</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Size Breakdown:</span>
                  <span className="font-semibold text-slate-800">{formData.sizes.length} Sizes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Anti-Garbage Quick Add Category Modal Dialog */}
      {isAddingCategory && (
        <div className={UI_TOKENS.launcherModal.backdrop} onClick={() => setIsAddingCategory(false)}>
          <div
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Woven Category</h3>
                  <p className="text-[11px] text-slate-500">Anti-Garbage Duplicate Engine Active</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {categoryError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                <span className="font-bold shrink-0">⚠️ Alert:</span>
                <span>{categoryError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={UI_TOKENS.form.label}>Category Name</label>
              <TextInput
                placeholder="e.g. Workwear Overalls, Denim Jackets"
                value={newCategoryInput}
                onChange={(e) => {
                  setNewCategoryInput(e.target.value);
                  if (categoryError) setCategoryError(null);
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveNewCategory();
                  }
                }}
              />
              <p className="text-[11px] text-slate-400">
                System auto-trims, formats title case, and prevents duplicate variations.
              </p>
            </div>

            {/* Smart Similar / Existing Categories Suggestion Panel */}
            {categorySuggestions.length > 0 && (
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Similar / Existing Categories Found in System:</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {categorySuggestions.map((sug) => (
                    <div
                      key={sug}
                      onClick={() => handleSelectExistingSuggestion(sug)}
                      className="flex items-center justify-between p-2 rounded bg-white hover:bg-amber-100/60 border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-amber-500" />
                        <span className="font-medium text-slate-800 group-hover:text-amber-900">{sug}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066FF] group-hover:text-blue-700">
                        Use this <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10.5px] text-amber-700">
                  💡 Click <strong>"Use this"</strong> to select an existing category instead of creating a duplicate.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryInput("");
                  setCategoryError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveNewCategory}
              >
                Verify & Add Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
