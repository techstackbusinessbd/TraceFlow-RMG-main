import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Tag,
  Lightbulb,
  ArrowRight,
  Palette,
  Layers,
  Box,
  Upload,
  FileText,
  CheckCircle2,
  X,
  ChevronDown,
  Check,
  Eye,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Toast } from "../../components/common/Toast";
import { Toggle } from "../../components/common/Toggle";
import { TechPackPreviewModal } from "../../components/common/TechPackPreviewModal";
import { UI_TOKENS } from "../../config/designTokens";
import {
  getStyleById,
  createStyle,
  updateStyle,
  getStyleNextCode,
  uploadTechPackFile,
  type StyleFormData,
  type StyleColorItem,
} from "../../services/styleService";
import { getOperationalCompanies, type Company } from "../../services/companyService";
import { getBuyers, type Buyer } from "../../services/buyerService";
import { getSizeScales, type SizeScale } from "../../services/sizeScaleService";
import { lookupColors, saveColorMaster, type ColorMasterItem } from "../../services/colorMasterService";

import {
  getMasterMetadata,
  DEFAULT_MASTER_METADATA,
  type MasterMetadata,
} from "../../services/masterMetadataService";

interface StyleFormPageProps {
  mode: "create" | "edit";
  styleId?: string | number;
  onNavigate: (path: string) => void;
}

export const StyleFormPage: React.FC<StyleFormPageProps> = ({ mode, styleId, onNavigate }) => {
  const [metadata, setMetadata] = useState<MasterMetadata>(DEFAULT_MASTER_METADATA);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [nextCode, setNextCode] = useState<string>("Select Company First");
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const saved = localStorage.getItem("traceflow_style_categories");
    return saved ? JSON.parse(saved) : DEFAULT_MASTER_METADATA.woven_categories;
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemInput, setNewItemInput] = useState("");
  const [itemError, setItemError] = useState<string | null>(null);

  // Store user-added custom garment items grouped by category
  const [customItemsMap, setCustomItemsMap] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem("traceflow_style_custom_items");
    return saved ? JSON.parse(saved) : {};
  });

  const [isAddingSize, setIsAddingSize] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState("");
  const [sizeModalError, setSizeModalError] = useState<string | null>(null);

  const [seasonName, setSeasonName] = useState<string>("");
  const [seasonYear, setSeasonYear] = useState<string>("2026");

  // Enterprise Size Scale Master list
  const [masterSizeScales, setMasterSizeScales] = useState<SizeScale[]>([]);
  const [selectedSizeScaleId, setSelectedSizeScaleId] = useState<string>("");

  // Color Master Lookup library
  const [colorLibrary, setColorLibrary] = useState<ColorMasterItem[]>([]);

  // Anti-Garbage Master Color Modal states
  const [isAddingMasterColor, setIsAddingMasterColor] = useState(false);
  const [newColorCode, setNewColorCode] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorPantone, setNewColorPantone] = useState("");
  const [newColorHex, setNewColorHex] = useState("#FFFFFF");
  const [colorModalError, setColorModalError] = useState<string | null>(null);

  // Multi-Piece Set / Single Piece Style Architecture
  const [packageType, setPackageType] = useState<"single" | "set">("single");
  const [setComponents, setSetComponents] = useState<Array<{ id: string; name: string; category?: string }>>([
    { id: "comp-1", name: "", category: "" },
    { id: "comp-2", name: "", category: "" },
  ]);

  // Tech-Pack Upload States
  const [isUploadingTechPack, setIsUploadingTechPack] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Enterprise Wash Type Multi-Select Dropdown State
  const [isWashDropdownOpen, setIsWashDropdownOpen] = useState(false);
  const washDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (washDropdownRef.current && !washDropdownRef.current.contains(event.target as Node)) {
        setIsWashDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState<StyleFormData>({
    company_id: "" as unknown as number,
    buyer_id: "",
    brand_id: null,
    buyer_style_no: "",
    style_name: "",
    product_category: "",
    garment_item: "",
    fabric_type: "",
    season: "",
    base_smv: "",
    wash_type: "",
    description: "",
    techpack_file_url: null,
    techpack_file_name: null,
    techpack_file_size: null,
    status: "Development",
    is_active: true,
    colors: [],
    sizes: [],
  });

  // Find currently selected buyer
  const selectedBuyer = React.useMemo(() => {
    if (!formData.buyer_id) return null;
    return buyers.find((x) => x.id === Number(formData.buyer_id)) || null;
  }, [formData.buyer_id, buyers]);

  // Dynamically derive available seasons based on the selected Buyer's profile/origin
  const availableSeasonNames: string[] = React.useMemo(() => {
    if (!formData.buyer_id) return [];
    if (!selectedBuyer) return metadata.seasons?.eu || DEFAULT_MASTER_METADATA.seasons.eu;

    const bName = (selectedBuyer.name || "").toLowerCase();
    const bCountry = (selectedBuyer.country || "").toLowerCase();

    // US Market buyers typically use 4-season cycle
    if (
      bCountry.includes("united states") ||
      bCountry.includes("usa") ||
      bCountry.includes("canada") ||
      bName.includes("target") ||
      bName.includes("walmart") ||
      bName.includes("gap") ||
      bName.includes("levi") ||
      bName.includes("kohl")
    ) {
      return metadata.seasons.us;
    }

    // EU & International buyers (H&M, Inditex, Next, M&S, etc.)
    return metadata.seasons.eu;
  }, [formData.buyer_id, selectedBuyer, metadata]);

  // Smart Contextual Prioritization for Product Categories based on selected Buyer's profile & focus
  const prioritizedCategories = React.useMemo(() => {
    if (!selectedBuyer) {
      return { recommended: [], others: categoriesList };
    }

    const bName = (selectedBuyer.name || "").toLowerCase();
    const recommended: string[] = [];
    const others: string[] = [];

    categoriesList.forEach((cat) => {
      const cLow = cat.toLowerCase();
      let isRec = false;

      // Denim & Bottoms heavy brands (Levi's, Wrangler, Lee, etc.)
      if (bName.includes("levi") || bName.includes("wrangler") || bName.includes("lee") || bName.includes("diesel")) {
        if (cLow.includes("denim") || cLow.includes("bottom") || cLow.includes("jean")) {
          isRec = true;
        }
      }
      // Outerwear & Jackets focus (North Face, Columbia, Zara, etc.)
      else if (bName.includes("north") || bName.includes("columbia") || bName.includes("patagonia")) {
        if (cLow.includes("outerwear") || cLow.includes("jacket") || cLow.includes("cargo")) {
          isRec = true;
        }
      }
      // Shirts & Tops focus (PVH, Tommy, Ralph Lauren, Brooks)
      else if (bName.includes("tommy") || bName.includes("ralph") || bName.includes("brooks") || bName.includes("shirt")) {
        if (cLow.includes("top") || cLow.includes("shirt")) {
          isRec = true;
        }
      }
      // Fast-Fashion / Volume Retailers (H&M, Zara, Inditex, Target, Walmart, Next, Marks) handle Core Tops & Bottoms
      else if (bName.includes("h&m") || bName.includes("zara") || bName.includes("target") || bName.includes("walmart") || bName.includes("next") || bName.includes("marks")) {
        if (cLow.includes("top") || cLow.includes("bottom") || cLow.includes("denim")) {
          isRec = true;
        }
      }

      if (isRec) {
        recommended.push(cat);
      } else {
        others.push(cat);
      }
    });

    return { recommended, others };
  }, [selectedBuyer, categoriesList]);

  // Dynamically derive available Garment Items based on the selected Product Category
  const availableGarmentItems: string[] = React.useMemo(() => {
    const selectedCategory = formData.product_category;
    if (!selectedCategory) return [];

    const backendCategoryItems =
      metadata.category_items?.[selectedCategory] ||
      DEFAULT_MASTER_METADATA.category_items?.[selectedCategory] ||
      [];
    const userCustomItems = customItemsMap[selectedCategory] || [];

    // Merge and de-duplicate
    const combined = Array.from(new Set([...backendCategoryItems, ...userCustomItems]));
    if (combined.length > 0) {
      return combined;
    }

    // Fallback if custom/new category has no items yet
    return metadata.garment_items || DEFAULT_MASTER_METADATA.garment_items;
  }, [formData.product_category, metadata, customItemsMap]);

  // Helper function to find matching size scales given a category and item string
  const findMatchingSizeScales = React.useCallback(
    (category: string, item: string, scales: SizeScale[]) => {
      const selectedCategory = (category || "").toLowerCase();
      const selectedItem = (item || "").toLowerCase();

      const matching: SizeScale[] = [];
      const others: SizeScale[] = [];

      const isKidsTarget =
        selectedCategory.includes("kid") ||
        selectedCategory.includes("baby") ||
        selectedCategory.includes("infant") ||
        selectedCategory.includes("toddler") ||
        selectedCategory.includes("junior") ||
        selectedItem.includes("kid") ||
        selectedItem.includes("baby") ||
        selectedItem.includes("toddler") ||
        selectedItem.includes("infant");

      const isDenimTarget =
        !isKidsTarget &&
        (selectedCategory.includes("denim") ||
          selectedItem.includes("denim") ||
          selectedItem.includes("jean") ||
          selectedItem.includes("5-pocket"));

      const isTopsTarget =
        !isKidsTarget &&
        (selectedCategory.includes("top") ||
          selectedCategory.includes("shirt") ||
          selectedItem.includes("shirt") ||
          selectedItem.includes("blouse") ||
          selectedItem.includes("tunic"));

      const isJacketsTarget =
        !isKidsTarget &&
        (selectedCategory.includes("jacket") ||
          selectedCategory.includes("outerwear") ||
          selectedCategory.includes("suit") ||
          selectedItem.includes("jacket") ||
          selectedItem.includes("blazer") ||
          selectedItem.includes("suit") ||
          selectedItem.includes("coat") ||
          selectedItem.includes("parka"));

      const isBottomsTarget =
        !isKidsTarget &&
        !isDenimTarget &&
        (selectedCategory.includes("bottom") ||
          selectedCategory.includes("pant") ||
          selectedCategory.includes("trouser") ||
          selectedCategory.includes("short") ||
          selectedCategory.includes("cargo") ||
          selectedCategory.includes("chino") ||
          selectedItem.includes("pant") ||
          selectedItem.includes("chino") ||
          selectedItem.includes("trouser") ||
          selectedItem.includes("short"));

      scales.forEach((scale) => {
        const scaleCat = (scale.category || "").toLowerCase();
        const scaleName = (scale.name || "").toLowerCase();
        const isDualInseamScale = scaleName.includes("inseam") || scaleName.includes("×") || scaleName.includes("x");

        if (isKidsTarget) {
          if (
            scaleName.includes("baby") ||
            scaleName.includes("infant") ||
            scaleName.includes("toddler") ||
            scaleName.includes("kid") ||
            scaleName.includes("junior") ||
            scaleName.includes("height") ||
            scaleCat.includes("universal")
          ) {
            matching.push(scale);
          } else {
            others.push(scale);
          }
        } else if (isDenimTarget) {
          // Denim target prioritizes denim inseam scale
          if (scaleCat.includes("denim") || scaleName.includes("denim")) {
            matching.push(scale);
          } else {
            others.push(scale);
          }
        } else if (isBottomsTarget) {
          // Non-denim bottoms (Chinos, Trousers, Cargo, Shorts) MUST NOT use denim dual-inseam scale
          if (isDualInseamScale || scaleCat.includes("denim")) {
            others.push(scale);
          } else if (scaleCat.includes("bottom") || scaleName.includes("waist") || scaleName.includes("bottom")) {
            matching.push(scale);
          } else {
            others.push(scale);
          }
        } else if (isTopsTarget) {
          if (scaleCat.includes("top") || scaleName.includes("top") || scaleName.includes("shirt")) {
            matching.push(scale);
          } else {
            others.push(scale);
          }
        } else if (isJacketsTarget) {
          if (scaleCat.includes("jacket") || scaleCat.includes("outerwear") || scaleName.includes("jacket") || scaleName.includes("suit")) {
            matching.push(scale);
          } else {
            others.push(scale);
          }
        } else {
          // Generic fallback
          if (scaleCat.includes(selectedCategory) || selectedCategory.includes(scaleCat)) {
            matching.push(scale);
          } else {
            others.push(scale);
          }
        }
      });

      return { matching, others };
    },
    []
  );

  // Dependent Size Scales: Filters and prioritizes scales directly matching Category and Item
  const dependentSizeScales = React.useMemo(() => {
    return findMatchingSizeScales(formData.product_category, formData.garment_item, masterSizeScales);
  }, [formData.product_category, formData.garment_item, masterSizeScales, findMatchingSizeScales]);

  // Direct helper to apply the best matching scale for a category & item
  const applyRecommendedScale = React.useCallback(
    (newCategory: string, newItem: string, currentScales: SizeScale[] = masterSizeScales) => {
      if (currentScales.length === 0) return;
      const { matching } = findMatchingSizeScales(newCategory, newItem, currentScales);
      if (matching.length > 0) {
        const bestScale = matching[0];
        if (bestScale && bestScale.entries && bestScale.entries.length > 0) {
          setSelectedSizeScaleId(String(bestScale.id));
          setFormData((prev) => ({
            ...prev,
            sizes: bestScale.entries!.map((e, i) => ({
              size_name: e.size_name,
              sort_order: e.sort_order || i + 1,
            })),
          }));
        }
      }
    },
    [findMatchingSizeScales, masterSizeScales]
  );

  // Keep combined formData.season synchronized when seasonName or seasonYear changes
  useEffect(() => {
    const combined = seasonYear ? `${seasonName} ${seasonYear}`.trim() : seasonName;
    setFormData((prev) => ({ ...prev, season: combined }));
  }, [seasonName, seasonYear]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch centralized RMG master metadata from backend
  useEffect(() => {
    getMasterMetadata()
      .then((meta) => {
        setMetadata(meta);
        // If local storage has no custom categories, initialize with backend woven categories
        const saved = localStorage.getItem("traceflow_style_categories");
        if (!saved && meta.woven_categories?.length > 0) {
          setCategoriesList(meta.woven_categories);
        }
      })
      .catch(() => {});

    // Fetch Enterprise Size Scales
    getSizeScales({ per_page: 50, status: "active" })
      .then((res) => {
        setMasterSizeScales(res.data);
      })
      .catch(() => {});

    // Fetch Color Master Library for quick lookup
    lookupColors()
      .then((res) => {
        setColorLibrary(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch operational companies (excluding Platform Owner)
  useEffect(() => {
    getOperationalCompanies()
      .then((operationalList) => {
        setCompanies(operationalList);
      })
      .catch(() => {});
  }, []);

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

          // Parse season into Season Name & Season Year (e.g. "Spring/Summer 2026")
          if (data.season) {
            const parts = data.season.trim().split(" ");
            const lastPart = parts[parts.length - 1];
            if (/^\d{4}$/.test(lastPart)) {
              setSeasonYear(lastPart);
              setSeasonName(parts.slice(0, -1).join(" "));
            } else {
              setSeasonName(data.season);
              setSeasonYear("");
            }
          }

          // Detect Multi-Piece Set / Combo
          if (data.garment_item && data.garment_item.includes(" + ")) {
            setPackageType("set");
            const comps = data.garment_item.split(" + ").map((name, i) => ({
              id: `comp-${i + 1}`,
              name: name.trim(),
              category: data.product_category || "",
            }));
            setSetComponents(comps);
          } else {
            setPackageType("single");
          }

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
            techpack_file_url: data.techpack_file_url || null,
            techpack_file_name: data.techpack_file_name || null,
            techpack_file_size: data.techpack_file_size || null,
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
        { color_code: `CLR-0${prev.colors.length + 1}`, color_name: "", hex_code: "#FFFFFF" },
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

  const handleSelectColorFromLibrary = (idx: number, item: ColorMasterItem) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors];
      nextColors[idx] = {
        ...nextColors[idx],
        color_code: item.color_code,
        color_name: item.color_name,
        pantone_ref: item.pantone_ref || "",
        hex_code: item.hex_code || "#FFFFFF",
      };
      return { ...prev, colors: nextColors };
    });
  };

  // Anti-Garbage Master Color Addition with Formatting & Duplicate Verification
  const handleSaveMasterColor = async () => {
    const trimmedName = newColorName.trim().replace(/\s+/g, " ");
    const trimmedCode = (newColorCode.trim() || `CLR-0${formData.colors.length + 1}`).toUpperCase();

    if (!trimmedName) {
      setColorModalError("Please enter a descriptive color name.");
      return;
    }

    if (trimmedName.length < 3) {
      setColorModalError("Color name must be at least 3 characters (e.g. Navy Blue).");
      return;
    }

    // Auto Title-Case formatting (e.g. "dark vintage olive" -> "Dark Vintage Olive")
    const formattedName = trimmedName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Check duplicate in current style colors
    const isDuplicateInStyle = formData.colors.some(
      (c) => c.color_name.trim().toLowerCase() === formattedName.toLowerCase()
    );
    if (isDuplicateInStyle) {
      setColorModalError(`Color "${formattedName}" is already added to this style.`);
      return;
    }

    const payload = {
      color_code: trimmedCode,
      color_name: formattedName,
      pantone_ref: newColorPantone.trim() ? newColorPantone.trim().toUpperCase() : null,
      hex_code: newColorHex || "#FFFFFF",
      company_id: formData.company_id || 1,
      buyer_id: formData.buyer_id ? Number(formData.buyer_id) : null,
    };

    try {
      // Save directly to backend Master Color Library
      const res = await saveColorMaster(payload);
      const savedItem = res.data;

      // Update color library in local state
      setColorLibrary((prev) => [savedItem, ...prev.filter((c) => c.id !== savedItem.id)]);

      // Append verified color to current style
      setFormData((prev) => ({
        ...prev,
        colors: [
          ...prev.colors,
          {
            color_code: savedItem.color_code,
            color_name: savedItem.color_name,
            pantone_ref: savedItem.pantone_ref,
            hex_code: savedItem.hex_code,
          },
        ],
      }));

      // Reset modal fields
      setNewColorName("");
      setNewColorCode("");
      setNewColorPantone("");
      setNewColorHex("#FFFFFF");
      setColorModalError(null);
      setIsAddingMasterColor(false);
      showToast("success", "Color Added", `"${formattedName}" added to Style and Color Master Library.`);
    } catch {
      // Offline fallback: still add to current style safely
      setFormData((prev) => ({
        ...prev,
        colors: [
          ...prev.colors,
          {
            color_code: trimmedCode,
            color_name: formattedName,
            pantone_ref: payload.pantone_ref,
            hex_code: payload.hex_code,
          },
        ],
      }));
      setIsAddingMasterColor(false);
      showToast("success", "Color Added", `"${formattedName}" added to current style.`);
    }
  };

  const handleSelectMasterSizeScale = (scaleId: string) => {
    setSelectedSizeScaleId(scaleId);
    if (!scaleId) return;

    const found = masterSizeScales.find((s) => String(s.id) === scaleId || s.code === scaleId);
    if (found && found.entries && found.entries.length > 0) {
      setFormData((prev) => ({
        ...prev,
        sizes: found.entries!.map((e, i) => ({
          size_name: e.size_name,
          sort_order: e.sort_order || i + 1,
        })),
      }));
      showToast("success", "Scale Applied", `Applied "${found.name}" size scale.`);
    }
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


  // Add custom size via dedicated enterprise modal dialog
  const handleSaveCustomSize = () => {
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed) {
      setSizeModalError("Please enter a size label (e.g. 42 or 4XL).");
      return;
    }

    const isDuplicate = formData.sizes.some(
      (s) => s.size_name.trim().toUpperCase() === trimmed
    );
    if (isDuplicate) {
      setSizeModalError(`Size "${trimmed}" is already added to this style.`);
      return;
    }

    handleAddSize(trimmed);
    setNewSizeInput("");
    setSizeModalError(null);
    setIsAddingSize(false);
    showToast("success", "Size Added", `Size "${trimmed}" added to size scale.`);
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

  // Real-time suggestions for identical or closely matching colors in the master library
  const colorSuggestions = React.useMemo(() => {
    const input = newColorName.trim();
    if (!input || input.length < 2) return [];

    const normInput = normalizeCategory(input);
    const tokens = input.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);

    return colorLibrary.filter((cl) => {
      const normColor = normalizeCategory(cl.color_name);
      if (normColor.includes(normInput) || normInput.includes(normColor)) return true;
      return tokens.some((token) => normColor.includes(token));
    }).slice(0, 6); // Limit to top 6 relevant matches
  }, [newColorName, colorLibrary]);

  const handleSelectExistingColorSuggestion = (colorItem: ColorMasterItem) => {
    // Check if already in current style
    const isAlreadyInStyle = formData.colors.some(
      (c) => c.color_name.trim().toLowerCase() === colorItem.color_name.trim().toLowerCase()
    );

    if (isAlreadyInStyle) {
      setColorModalError(`Color "${colorItem.color_name}" is already in this style.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          color_code: colorItem.color_code,
          color_name: colorItem.color_name,
          pantone_ref: colorItem.pantone_ref,
          hex_code: colorItem.hex_code || "#FFFFFF",
        },
      ],
    }));

    setNewColorName("");
    setNewColorCode("");
    setNewColorPantone("");
    setNewColorHex("#FFFFFF");
    setColorModalError(null);
    setIsAddingMasterColor(false);
    showToast("success", "Color Selected", `"${colorItem.color_name}" added from Master Color Library.`);
  };

  // Real-time suggestions for identical or closely matching items within current category
  const itemSuggestions = React.useMemo(() => {
    const input = newItemInput.trim();
    if (!input || input.length < 2) return [];

    const normInput = normalizeCategory(input);
    const tokens = input.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    return availableGarmentItems.filter((item) => {
      const normItem = normalizeCategory(item);
      if (normItem.includes(normInput) || normInput.includes(normItem)) return true;
      return tokens.some((token) => normItem.includes(token));
    });
  }, [newItemInput, availableGarmentItems]);

  // Anti-Garbage Garment Item Addition with Duplicate & Formatting Guards
  const handleSaveNewItem = () => {
    const trimmed = newItemInput.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setItemError("Please enter a garment item name.");
      return;
    }

    if (trimmed.length < 3) {
      setItemError("Item name must be at least 3 characters.");
      return;
    }

    // Auto Title-Case formatting (e.g. "combat tactical pants" -> "Combat Tactical Pants")
    const formatted = trimmed
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Check duplicate in current category items
    const isDuplicate = availableGarmentItems.some(
      (item) => normalizeCategory(item) === normalizeCategory(formatted)
    );

    if (isDuplicate) {
      const existing = availableGarmentItems.find(
        (item) => normalizeCategory(item) === normalizeCategory(formatted)
      );
      setItemError(`This item already exists as "${existing}" in this category.`);
      return;
    }

    const currentCat = formData.product_category;
    const existingList = customItemsMap[currentCat] || [];
    const updatedMap = {
      ...customItemsMap,
      [currentCat]: [...existingList, formatted],
    };

    setCustomItemsMap(updatedMap);
    localStorage.setItem("traceflow_style_custom_items", JSON.stringify(updatedMap));
    setFormData((prev) => ({ ...prev, garment_item: formatted }));
    setNewItemInput("");
    setItemError(null);
    setIsAddingItem(false);
    showToast("success", "Item Added", `"${formatted}" added to ${currentCat}.`);
  };

  const handleSelectExistingItemSuggestion = (existingItem: string) => {
    setFormData((prev) => ({ ...prev, garment_item: existingItem }));
    setNewItemInput("");
    setItemError(null);
    setIsAddingItem(false);
    showToast("success", "Item Selected", `"${existingItem}" selected from item library.`);
  };

  const handleSelectExistingSuggestion = (existingCat: string) => {
    setFormData((prev) => ({ ...prev, product_category: existingCat }));
    setNewCategoryInput("");
    setCategoryError(null);
    setIsAddingCategory(false);
    showToast("success", "Category Selected", `"${existingCat}" selected directly from existing library.`);
  };

  // Optional Tech-Pack File Upload Handler
  const handleTechPackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional 25MB client-side check
    if (file.size > 25 * 1024 * 1024) {
      showToast("error", "File Too Large", "Tech-Pack file size must be within 25 MB.");
      return;
    }

    setIsUploadingTechPack(true);
    try {
      const res = await uploadTechPackFile(file);
      setFormData((prev) => ({
        ...prev,
        techpack_file_url: res.data.file_url,
        techpack_file_name: res.data.file_name,
        techpack_file_size: res.data.file_size,
      }));
      showToast("success", "Tech-Pack Uploaded", `"${res.data.file_name}" attached successfully.`);
    } catch (err: any) {
      const msg = err?.message || err?.errors?.file?.[0] || "Could not upload Tech-Pack file. Please try again.";
      showToast("error", "Upload Failed", msg);
    } finally {
      setIsUploadingTechPack(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleRemoveTechPack = () => {
    setFormData((prev) => ({
      ...prev,
      techpack_file_url: null,
      techpack_file_name: null,
      techpack_file_size: null,
    }));
    showToast("success", "Tech-Pack Removed", "Attached Tech-Pack has been cleared.");
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

      // Background save of unique colorways to Color Master Library for future suggestions
      formData.colors.forEach((c) => {
        if (c.color_name && c.color_code) {
          saveColorMaster({
            color_code: c.color_code,
            color_name: c.color_name,
            pantone_ref: c.pantone_ref || null,
            hex_code: c.hex_code || null,
            company_id: formData.company_id,
            buyer_id: formData.buyer_id ? Number(formData.buyer_id) : null,
          }).catch(() => {});
        }
      });

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
                <h2 className={UI_TOKENS.card.title}>Buyer & Commercial Affiliation</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Company */}
                <FormField
                  label="Company"
                  required
                  error={errors.company_id}
                  helperText="Manufacturing operating unit responsible for execution."
                >
                  <select
                    className={`w-full ${UI_TOKENS.input.select} ${errors.company_id ? UI_TOKENS.input.error : ""}`}
                    value={formData.company_id}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      setSelectedCompanyId(cid);
                      setFormData((prev) => ({ ...prev, company_id: cid, buyer_id: "" }));
                    }}
                    disabled={mode === "edit"}
                  >
                    <option value="">Select Company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* 2. Buyer */}
                <FormField
                  label="Buyer"
                  required
                  error={errors.buyer_id}
                  helperText="Primary brand or retail client placing the order."
                >
                  <select
                    className={`w-full ${UI_TOKENS.input.select} ${errors.buyer_id ? UI_TOKENS.input.error : ""}`}
                    value={formData.buyer_id}
                    onChange={(e) => {
                      const selectedBId = Number(e.target.value) || "";
                      setFormData((prev) => ({ ...prev, buyer_id: selectedBId }));
                      // Set appropriate default season for buyer if available
                      if (selectedBId) {
                        const b = buyers.find((x) => x.id === selectedBId);
                        const bName = (b?.name || "").toLowerCase();
                        if (bName.includes("target") || bName.includes("walmart") || bName.includes("gap") || bName.includes("levis") || bName.includes("kohls")) {
                          setSeasonName("Spring");
                        } else {
                          setSeasonName("Spring/Summer");
                        }
                      } else {
                        setSeasonName("");
                      }
                    }}
                  >
                    <option value="">Select Buyer...</option>
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* 3. Season Name (Dependent on Buyer) */}
                <FormField
                  label="Season Name"
                  required
                  error={errors.season}
                  helperText={
                    !formData.buyer_id
                      ? "Please select a Buyer first to load applicable seasons."
                      : "Fashion buying collection for selected buyer."
                  }
                >
                  <select
                    className={`w-full ${UI_TOKENS.input.select} ${!formData.buyer_id ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
                    value={seasonName}
                    disabled={!formData.buyer_id}
                    onChange={(e) => setSeasonName(e.target.value)}
                  >
                    {!formData.buyer_id ? (
                      <option value="">Select Buyer First...</option>
                    ) : (
                      <>
                        <option value="">Select Season...</option>
                        {availableSeasonNames.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </FormField>

                {/* 4. Season Year */}
                <FormField
                  label="Season Year"
                  required
                  helperText="Calendar delivery & production year."
                >
                  <select
                    className={`w-full ${UI_TOKENS.input.select} ${!formData.buyer_id ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
                    value={seasonYear}
                    disabled={!formData.buyer_id}
                    onChange={(e) => setSeasonYear(e.target.value)}
                  >
                    {(metadata.seasons?.years || ["2025", "2026", "2027", "2028", "2029", "2030"]).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            {/* Card 2: Garment Specifications & Technical Engineering */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h2 className={UI_TOKENS.card.title}>Garment Specifications & Engineering</h2>
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

                {/* Unified Apparel Grouping: Category & Item side by side */}
                <FormField
                  label="Product Category"
                  required
                  error={errors.product_category}
                  helperText={
                    !formData.buyer_id
                      ? "Please select a Buyer first to load and prioritize categories."
                      : selectedBuyer
                      ? `Broad department (prioritized for ${selectedBuyer.name}).`
                      : "Broad department (e.g. Woven Bottoms, Denim)."
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <select
                      className={`flex-1 ${UI_TOKENS.input.select} ${
                        !formData.buyer_id ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
                      }`}
                      value={formData.product_category}
                      disabled={!formData.buyer_id}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_NEW__") {
                          setIsAddingCategory(true);
                          setCategoryError(null);
                        } else {
                          const newCat = e.target.value;
                          if (!newCat) {
                            // User re-selected "Select Product Category..." placeholder -> reset completely
                            setFormData((prev) => ({
                              ...prev,
                              product_category: "",
                              garment_item: "",
                              sizes: [],
                            }));
                            setSelectedSizeScaleId("");
                            return;
                          }

                          // Set newly selected category, but keep garment_item unselected so the user chooses explicitly
                          setFormData((prev) => ({
                            ...prev,
                            product_category: newCat,
                            garment_item: "",
                            sizes: [],
                          }));
                          setSelectedSizeScaleId("");

                          // Auto-apply recommended size scale based on category
                          applyRecommendedScale(newCat, "");
                        }
                      }}
                    >
                      <option value="">Select Product Category...</option>
                      {/* Priority 1: Recommended Categories for selected Buyer */}
                      {prioritizedCategories.recommended.length > 0 && (
                        <optgroup label={`⭐ Recommended for ${selectedBuyer?.name || "Buyer"}`}>
                          {prioritizedCategories.recommended.map((cat) => (
                            <option key={`rec-${cat}`} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Priority 2: All other Woven Categories */}
                      <optgroup label={prioritizedCategories.recommended.length > 0 ? "All Other Categories" : "Woven Categories"}>
                        {prioritizedCategories.others.map((cat) => (
                          <option key={`other-${cat}`} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </optgroup>

                      <option value="__ADD_NEW__" className="text-blue-600 font-bold bg-blue-50">
                        + Add New Category...
                      </option>
                    </select>
                    <button
                      type="button"
                      disabled={!formData.buyer_id}
                      onClick={() => {
                        setIsAddingCategory(true);
                        setCategoryError(null);
                      }}
                      className={`p-2 border rounded-md transition-colors shadow-2xs shrink-0 ${
                        !formData.buyer_id
                          ? "text-slate-300 border-slate-200 bg-slate-50 cursor-not-allowed"
                          : "text-[#0066FF] hover:bg-blue-50 border-blue-200 cursor-pointer"
                      }`}
                      title={!formData.buyer_id ? "Select a Buyer first" : "Add New Category with Anti-Garbage Engine"}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </FormField>

                {/* Garment Item (Single Piece) or Set Mode Placeholder on the right column */}
                {packageType === "single" ? (
                  <FormField
                    label="Garment Item"
                    required
                    error={errors.garment_item}
                    helperText={
                      !formData.product_category
                        ? "Select category to view garment items."
                        : `Garment items under ${formData.product_category}.`
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <select
                        className={`flex-1 ${UI_TOKENS.input.select} ${errors.garment_item ? UI_TOKENS.input.error : ""} ${
                          !formData.product_category ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
                        }`}
                        value={formData.garment_item}
                        disabled={!formData.product_category}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_NEW_ITEM__") {
                            setIsAddingItem(true);
                            setItemError(null);
                          } else {
                            const newItem = e.target.value;
                            setFormData((prev) => ({ ...prev, garment_item: newItem }));
                            // Apply recommendation if item has specific sizing needs (e.g. shorts vs denim vs pants)
                            applyRecommendedScale(formData.product_category, newItem);
                          }
                        }}
                      >
                        <option value="">Select Garment Item...</option>
                        {availableGarmentItems.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                        {formData.product_category && (
                          <option value="__ADD_NEW_ITEM__" className="text-blue-600 font-bold bg-blue-50">
                            + Add New Item to {formData.product_category}...
                          </option>
                        )}
                      </select>
                      <button
                        type="button"
                        disabled={!formData.product_category}
                        onClick={() => {
                          if (!formData.product_category) return;
                          setIsAddingItem(true);
                          setItemError(null);
                        }}
                        className={`p-2 border rounded-md transition-colors shadow-2xs shrink-0 ${
                          !formData.product_category
                            ? "text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50"
                            : "text-[#0066FF] hover:bg-blue-50 border-blue-200 cursor-pointer"
                        }`}
                        title={
                          !formData.product_category
                            ? "Select a category first to add items"
                            : `Add New Item to ${formData.product_category}`
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </FormField>
                ) : (
                  <FormField
                    label="Garment Item (Combo Set)"
                    required
                    error={errors.garment_item}
                    helperText="Auto-composed from the breakdown below."
                  >
                    <TextInput
                      readOnly
                      value={formData.garment_item || "Specifying below..."}
                      className="bg-blue-50/50 text-blue-900 font-medium font-mono"
                    />
                  </FormField>
                )}

                {/* Style Packaging & Multi-Piece Composition Selector Row */}
                <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0066FF]" />
                      Style Composition / Packaging Type
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Is this style an individual article (e.g. single trouser) or a coordinated multi-piece set (e.g. suit, 2-pack)?
                    </p>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPackageType("single");
                        // If components had values, revert garment_item to first component or reset
                        if (setComponents[0]?.name) {
                          setFormData((prev) => ({ ...prev, garment_item: setComponents[0].name }));
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        packageType === "single"
                          ? "bg-[#0066FF] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      Single Piece
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageType("set");
                        // Auto-compose combo name
                        const valid = setComponents.map((c) => c.name.trim()).filter(Boolean);
                        if (valid.length > 0) {
                          setFormData((prev) => ({ ...prev, garment_item: valid.join(" + ") }));
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        packageType === "set"
                          ? "bg-[#0066FF] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Multi-Piece Set / Combo
                    </button>
                  </div>
                </div>

                {/* Multi-Piece Set / Combo Breakdown Component Table (Shown only when packageType === 'set') */}
                {packageType === "set" && (
                  <div className="md:col-span-2 space-y-2 p-3 bg-blue-50/40 border border-blue-200/80 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>📦 Set Components Breakdown</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-[#0066FF] font-semibold">
                            {setComponents.length} Pieces Combo
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Specify each garment piece in this combo pack (e.g. Blazer + Trouser, or Top + Shorts).
                        </p>
                      </div>
                      {setComponents.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [
                              ...setComponents,
                              { id: `comp-${setComponents.length + 1}`, name: "", category: formData.product_category || "" },
                            ];
                            setSetComponents(next);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-blue-200 bg-white text-[#0066FF] hover:bg-blue-50 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Component
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      {setComponents.map((comp, idx) => (
                        <div
                          key={comp.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-md border border-slate-200 shadow-2xs text-xs"
                        >
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <TextInput
                              placeholder={`e.g. Component ${idx + 1} (e.g. Woven Blazer, Dress Shirt)`}
                              value={comp.name}
                              onChange={(e) => {
                                const nextVal = e.target.value;
                                const updated = [...setComponents];
                                updated[idx] = { ...updated[idx], name: nextVal };
                                setSetComponents(updated);

                                const validComps = updated.map((c) => c.name.trim()).filter(Boolean);
                                setFormData((prev) => ({
                                  ...prev,
                                  garment_item: validComps.join(" + "),
                                }));
                              }}
                            />
                            <select
                              className={UI_TOKENS.input.select}
                              value={comp.category || formData.product_category}
                              onChange={(e) => {
                                const nextCat = e.target.value;
                                const updated = [...setComponents];
                                updated[idx] = { ...updated[idx], category: nextCat };
                                setSetComponents(updated);
                              }}
                            >
                              <option value="">Select Sub-Category...</option>
                              {categoriesList.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {setComponents.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = setComponents.filter((_, i) => i !== idx);
                                setSetComponents(updated);
                                const validComps = updated.map((c) => c.name.trim()).filter(Boolean);
                                setFormData((prev) => ({
                                  ...prev,
                                  garment_item: validComps.join(" + "),
                                }));
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                              title="Remove component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded bg-white/80 border border-blue-200/60 text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="font-medium text-slate-700">Combined Style Garment Item Display:</span>
                      <span className="font-bold text-[#0066FF] font-mono">
                        {formData.garment_item || "Specify at least 2 components..."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Optional Technical & Fabrication Parameters */}
                <div className="md:col-span-2 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    label="Fabrication / Construction"
                    error={errors.fabric_type}
                    helperText="Optional weave/weight (e.g. 100% Cotton Twill, 11.5oz Denim)."
                  >
                    <TextInput
                      placeholder="e.g. 100% Cotton Twill, 220 GSM"
                      value={formData.fabric_type || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fabric_type: e.target.value }))}
                    />
                  </FormField>

                  <FormField
                    label="Target Base SMV"
                    error={errors.base_smv}
                    helperText="Optional Standard Minute Value for sewing planning."
                  >
                    <TextInput
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 14.50"
                      value={formData.base_smv !== undefined && formData.base_smv !== null ? String(formData.base_smv) : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          base_smv: val === "" ? "" : Number(val),
                        }));
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Wash Type"
                    error={errors.wash_type}
                    helperText="Optional industrial wash treatments."
                  >
                    <div className="relative" ref={washDropdownRef}>
                      {/* Professional Form Control Trigger */}
                      <div
                        onClick={() => setIsWashDropdownOpen((prev) => !prev)}
                        className={`min-h-[38px] w-full px-2.5 py-1.5 bg-white border rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                          isWashDropdownOpen
                            ? "border-[#0066FF] ring-2 ring-blue-100 shadow-2xs"
                            : "border-slate-300 hover:border-slate-400 shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                          {(() => {
                            const selectedWashes = (formData.wash_type || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);

                            if (selectedWashes.length === 0) {
                              return <span className="text-xs text-slate-400 select-none">Select wash types...</span>;
                            }

                            return selectedWashes.map((wt) => (
                              <span
                                key={wt}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200/80 text-xs font-semibold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>{wt}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = selectedWashes.filter((s) => s !== wt);
                                    setFormData((prev) => ({
                                      ...prev,
                                      wash_type: updated.join(", "),
                                    }));
                                  }}
                                  className="text-blue-400 hover:text-rose-600 rounded p-0.5 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={`Remove ${wt}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ));
                          })()}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 text-slate-400">
                          {formData.wash_type && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData((prev) => ({ ...prev, wash_type: "" }));
                              }}
                              className="p-1 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                              title="Clear all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isWashDropdownOpen ? "rotate-180 text-[#0066FF]" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dropdown Popover */}
                      {isWashDropdownOpen && (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto text-xs">
                          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                            <span>Available Industrial Finishes</span>
                            <span className="text-slate-500 font-normal lowercase">click to toggle</span>
                          </div>

                          {(metadata.wash_types || [
                            "None / Raw / Rinse",
                            "Enzyme Wash",
                            "Stone Enzyme Wash",
                            "Bleach Wash",
                            "Acid Wash",
                            "Tint & Distress",
                            "Resin 3D Crinkle",
                            "Silicone Softener",
                          ]).map((wt) => {
                            const selectedWashes = (formData.wash_type || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const isSelected = selectedWashes.includes(wt);

                            return (
                              <div
                                key={wt}
                                onClick={() => {
                                  let updated: string[];
                                  if (isSelected) {
                                    updated = selectedWashes.filter((s) => s !== wt);
                                  } else {
                                    if (wt === "None / Raw / Rinse") {
                                      updated = [wt];
                                    } else {
                                      updated = [...selectedWashes.filter((s) => s !== "None / Raw / Rinse"), wt];
                                    }
                                  }
                                  setFormData((prev) => ({
                                    ...prev,
                                    wash_type: updated.join(", "),
                                  }));
                                }}
                                className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50/60 text-[#0066FF] font-semibold"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                                      isSelected
                                        ? "bg-[#0066FF] border-[#0066FF] text-white"
                                        : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </span>
                                  <span>{wt}</span>
                                </span>
                                {isSelected && (
                                  <span className="text-[11px] font-medium text-blue-600">Selected</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>

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

                {/* Optional Tech-Pack Specification Document Upload Zone */}
                <div className="md:col-span-2 pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                        Buyer Tech-Pack / Measurement Spec (Optional)
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Upload official buyer PDF, measurement Excel sheet, or technical artwork (PDF, ZIP, DOCX, PNG up to 25MB).
                      </p>
                    </div>
                  </div>

                  {!formData.techpack_file_url ? (
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#0066FF] hover:bg-blue-50/40 transition-all rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer group shadow-2xs">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={handleTechPackFileChange}
                        disabled={isUploadingTechPack}
                      />
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#0066FF] transition-colors">
                          {isUploadingTechPack ? "Uploading document..." : "Click to browse or drag & drop Tech-Pack file"}
                        </p>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">
                          Supported: PDF, XLSX, DOCX, ZIP, Image (Max 25 MB)
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-3 bg-white border border-emerald-200 rounded-lg shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {formData.techpack_file_name || "Buyer_TechPack_Attachment"}
                          </p>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-mono">
                            {formData.techpack_file_size && (
                              <span>{(formData.techpack_file_size / (1024 * 1024)).toFixed(2)} MB</span>
                            )}
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setIsPreviewModalOpen(true)}
                              className="text-[#0066FF] hover:underline font-sans font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Quick Preview Spec
                            </button>
                            <span>•</span>
                            <a
                              href={formData.techpack_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-800 font-sans font-medium"
                            >
                              Open Ext ↗
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="px-2.5 py-1 text-xs font-medium text-[#0066FF] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveTechPack}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Remove attached Tech-Pack"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Card 3: Colorways Repeater with Master Color Auto-complete */}
              <div className={UI_TOKENS.card.base}>
                <div className={UI_TOKENS.card.header}>
                  <div>
                    <h2 className={UI_TOKENS.card.title}>Colorways & Shades</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select from company color library or enter custom colorways.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddColor}
                      title="Add a colorway row directly"
                    >
                      Quick Row
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      icon={<Palette className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setIsAddingMasterColor(true);
                        setColorModalError(null);
                        setNewColorName("");
                        setNewColorCode(`CLR-0${formData.colors.length + 1}`);
                        setNewColorPantone("");
                        setNewColorHex("#FFFFFF");
                      }}
                      title="Add validated color with Pantone & Hex to library"
                    >
                      Add Master Color
                    </Button>
                  </div>
                </div>

                {errors.colors && (
                  <div className="p-2.5 mb-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                    {errors.colors}
                  </div>
                )}

                {/* Color library datalist for browser auto-complete */}
                <datalist id="color-library-codes">
                  {colorLibrary.map((cl) => (
                    <option key={cl.id} value={cl.color_code}>
                      {cl.color_name} {cl.pantone_ref ? `(${cl.pantone_ref})` : ""}
                    </option>
                  ))}
                </datalist>

                <datalist id="color-library-names">
                  {colorLibrary.map((cl) => (
                    <option key={cl.id} value={cl.color_name}>
                      {cl.color_code} {cl.pantone_ref ? `(${cl.pantone_ref})` : ""}
                    </option>
                  ))}
                </datalist>

                <div className="space-y-2.5">
                  {formData.colors.length === 0 ? (
                    <div className="py-4 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
                      No colorways configured yet. Click <span className="font-semibold text-[#0066FF]">+ Add Color</span> above or type color name to add shades.
                    </div>
                  ) : (
                    formData.colors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded-md">
                        <div className="w-32">
                          <TextInput
                            list="color-library-codes"
                            placeholder="Color Code"
                            value={color.color_code}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleColorChange(idx, "color_code", val);
                              const matched = colorLibrary.find((cl) => cl.color_code.toLowerCase() === val.trim().toLowerCase());
                              if (matched) {
                                handleSelectColorFromLibrary(idx, matched);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <TextInput
                            list="color-library-names"
                            placeholder="Color Name (e.g. Washed Vintage Black)"
                            value={color.color_name}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleColorChange(idx, "color_name", val);
                              const matched = colorLibrary.find((cl) => cl.color_name.toLowerCase() === val.trim().toLowerCase());
                              if (matched) {
                                handleSelectColorFromLibrary(idx, matched);
                              }
                            }}
                          />
                        </div>
                        <div className="w-36 hidden sm:block">
                          <TextInput
                            placeholder="Pantone TCX"
                            value={color.pantone_ref || ""}
                            onChange={(e) => handleColorChange(idx, "pantone_ref", e.target.value)}
                          />
                        </div>
                        <div className="w-10 flex items-center justify-center">
                          <input
                            type="color"
                            className="w-8 h-8 rounded border border-slate-300 hover:border-slate-400 cursor-pointer p-0.5 bg-white shadow-2xs transition-colors"
                            value={color.hex_code || "#FFFFFF"}
                            onChange={(e) => handleColorChange(idx, "hex_code", e.target.value)}
                            title="Pick Hex Color Shade"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-all cursor-pointer shadow-2xs shrink-0"
                          title="Remove Colorway"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card 4: Enterprise Size Scale Master & Ratios */}
              <div className={UI_TOKENS.card.base}>
                <div className={UI_TOKENS.card.header}>
                  <div>
                    <h2 className={UI_TOKENS.card.title}>Size Scale & Ratios</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select a master size scale or build custom scale.</p>
                  </div>
                  
                  {/* Master Size Scale Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      className={`text-xs border rounded-md px-2.5 py-1 font-medium outline-none transition-colors ${
                        !formData.product_category
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-300 text-slate-700 focus:ring-1 focus:ring-[#0066FF] cursor-pointer"
                      }`}
                      value={selectedSizeScaleId}
                      disabled={!formData.product_category}
                      onChange={(e) => handleSelectMasterSizeScale(e.target.value)}
                    >
                      <option value="">
                        {!formData.product_category ? "Select Category First..." : "Apply Master Scale..."}
                      </option>

                      {/* 1. Category & Item Matching Scales */}
                      {dependentSizeScales.matching.length > 0 && (
                        <optgroup
                          label={`★ Recommended for ${formData.product_category}`}
                          className="font-semibold text-blue-900 bg-blue-50/60"
                        >
                          {dependentSizeScales.matching.map((scale) => (
                            <option key={scale.id} value={scale.id} className="font-medium text-slate-800 bg-white">
                              {scale.name} ({scale.code})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* 2. Other Categories Scales */}
                      {dependentSizeScales.others.length > 0 && (
                        <optgroup
                          label="Other Apparel Scales"
                          className="font-semibold text-slate-600 bg-slate-50"
                        >
                          {dependentSizeScales.others.map((scale) => (
                            <option key={scale.id} value={scale.id} className="font-normal text-slate-600 bg-white">
                              {scale.name} ({scale.category})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {errors.sizes && (
                  <div className="p-2 mb-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded">
                    {errors.sizes}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {formData.sizes.length === 0 ? (
                    <div className="w-full py-4 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
                      {!formData.product_category
                        ? "Please select a Product Category above to unlock size scale options."
                        : "No size scale selected yet. Choose an option from Apply Master Scale or click + Custom Size."}
                    </div>
                  ) : (
                    formData.sizes.map((sz, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-white border border-slate-300 rounded-md shadow-2xs font-mono text-xs text-slate-800"
                      >
                        <span>{sz.size_name || `Size ${idx + 1}`}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    disabled={!formData.product_category}
                    onClick={() => {
                      if (!formData.product_category) return;
                      setNewSizeInput("");
                      setSizeModalError(null);
                      setIsAddingSize(true);
                    }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border border-dashed transition-colors ${
                      !formData.product_category
                        ? "text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50"
                        : "text-[#0066FF] border-[#0066FF] hover:bg-blue-50 cursor-pointer"
                    }`}
                    title={!formData.product_category ? "Select a category first to add custom sizes" : "Add Custom Size"}
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
                <h2 className={UI_TOKENS.card.title}>Governance & Status</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={UI_TOKENS.form.label}>System Tracking Code</label>
                  <input
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs rounded-md px-3 py-1.5 cursor-not-allowed"
                    value={nextCode}
                    disabled
                    readOnly
                  />
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
                <h2 className={UI_TOKENS.card.title}>Style Summary</h2>
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
                  <span className="text-slate-500">Apparel Article:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[140px]" title={formData.garment_item || formData.product_category || ""}>
                    {formData.garment_item || formData.product_category || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Calculated SMV:</span>
                  <span className="font-mono font-bold text-[#0066FF]">
                    {formData.base_smv ? `${Number(formData.base_smv).toFixed(2)} min` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Fabrication:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[140px]" title={formData.fabric_type || ""}>
                    {formData.fabric_type || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Wash Type:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[140px]" title={formData.wash_type || ""}>
                    {formData.wash_type || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Colorway Count:</span>
                  <span className="font-semibold text-slate-800">{formData.colors.length} Colors</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Size Breakdown:</span>
                  <span className="font-semibold text-slate-800">{formData.sizes.length} Sizes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tech-Pack Spec:</span>
                  {formData.techpack_file_url ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 truncate max-w-[140px]" title={formData.techpack_file_name || "Uploaded"}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Attached ({formData.techpack_file_size ? `${(formData.techpack_file_size / (1024 * 1024)).toFixed(1)}MB` : "File"})
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">None (Optional)</span>
                  )}
                </div>
              </div>

              {/* Live Readiness Indicator */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="p-2 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">TechPack Readiness:</span>
                  {formData.buyer_id && formData.product_category && formData.garment_item && formData.colors.length > 0 && formData.sizes.length > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> In Progress
                    </span>
                  )}
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
            className={UI_TOKENS.launcherModal.dialogContainer}
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

      {/* Enterprise Custom Size Modal Dialog */}
      {isAddingSize && (
        <div className={UI_TOKENS.launcherModal.backdrop} onClick={() => setIsAddingSize(false)}>
          <div
            className={UI_TOKENS.launcherModal.dialogContainerSm}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Custom Size</h3>
                  <p className="text-[11px] text-slate-500">Append size label to style scale</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSize(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {sizeModalError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                <span className="font-bold shrink-0">⚠️ Alert:</span>
                <span>{sizeModalError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={UI_TOKENS.form.label}>Size Label</label>
              <TextInput
                placeholder="e.g. 42, 4XL, 38x34"
                value={newSizeInput}
                onChange={(e) => {
                  setNewSizeInput(e.target.value);
                  if (sizeModalError) setSizeModalError(null);
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCustomSize();
                  }
                }}
              />
              <p className="text-[11px] text-slate-400">
                Enter exact size notation or waist x inseam ratio.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddingSize(false);
                  setNewSizeInput("");
                  setSizeModalError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveCustomSize}
              >
                Add Size
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Garbage Quick Add Garment Item Modal Dialog */}
      {isAddingItem && (
        <div className={UI_TOKENS.launcherModal.backdrop} onClick={() => setIsAddingItem(false)}>
          <div
            className={UI_TOKENS.launcherModal.dialogContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Garment Item</h3>
                  <p className="text-[11px] text-slate-500">
                    Target Category: <span className="font-semibold text-slate-800">{formData.product_category}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {itemError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                <span className="font-bold shrink-0">⚠️ Alert:</span>
                <span>{itemError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={UI_TOKENS.form.label}>Garment Item Name</label>
              <TextInput
                placeholder="e.g. Utility Cargo Pant, Flannel Overshirt"
                value={newItemInput}
                onChange={(e) => {
                  setNewItemInput(e.target.value);
                  if (itemError) setItemError(null);
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveNewItem();
                  }
                }}
              />
              <p className="text-[11px] text-slate-400">
                Auto-formats title case and checks duplicates under this category.
              </p>
            </div>

            {/* Smart Similar / Existing Items Suggestion Panel */}
            {itemSuggestions.length > 0 && (
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Similar / Existing Items in This Category:</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {itemSuggestions.map((sug) => (
                    <div
                      key={sug}
                      onClick={() => handleSelectExistingItemSuggestion(sug)}
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
                  💡 Click <strong>"Use this"</strong> to select an existing item instead of creating a duplicate.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemInput("");
                  setItemError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveNewItem}
              >
                Verify & Add Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Garbage Master Color Addition Modal Dialog */}
      {isAddingMasterColor && (
        <div className={UI_TOKENS.launcherModal.backdrop} onClick={() => setIsAddingMasterColor(false)}>
          <div
            className={UI_TOKENS.launcherModal.dialogContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Master Color Shade</h3>
                  <p className="text-[11px] text-slate-500">Verified entry with Pantone TCX & Hex synchronization.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingMasterColor(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {colorModalError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                <span className="font-bold shrink-0">⚠️ Alert:</span>
                <span>{colorModalError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className={UI_TOKENS.form.label}>Color Code</label>
                  <TextInput
                    placeholder="e.g. CLR-01"
                    value={newColorCode}
                    onChange={(e) => setNewColorCode(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className={UI_TOKENS.form.label}>
                    Color Name <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    placeholder="e.g. Dark Vintage Olive"
                    value={newColorName}
                    autoFocus
                    onChange={(e) => {
                      setNewColorName(e.target.value);
                      if (colorModalError) setColorModalError(null);
                    }}
                  />
                </div>
              </div>

              {/* Smart Similar / Existing Master Colors Suggestion Panel */}
              {colorSuggestions.length > 0 && (
                <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Existing Colors in Central Master Library:</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {colorSuggestions.map((c) => (
                      <div
                        key={c.id || c.color_name}
                        onClick={() => handleSelectExistingColorSuggestion(c)}
                        className="flex items-center justify-between p-2 rounded bg-white hover:bg-amber-100/70 border border-amber-200 hover:border-amber-400 transition-colors cursor-pointer group text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: c.hex_code || "#FFFFFF" }}
                          />
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-amber-950">
                              {c.color_name}
                            </span>
                            <span className="ml-1.5 text-[10.5px] font-mono text-slate-500">
                              ({c.color_code}
                              {c.pantone_ref ? ` • ${c.pantone_ref}` : ""})
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066FF] group-hover:text-blue-700 shrink-0">
                          Use this <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-amber-800">
                    💡 Click <strong>"Use this"</strong> to select an existing verified color instead of creating a duplicate.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="col-span-2">
                  <label className={UI_TOKENS.form.label}>Pantone TCX / TPX (Optional)</label>
                  <TextInput
                    placeholder="e.g. 19-4010 TCX"
                    value={newColorPantone}
                    onChange={(e) => setNewColorPantone(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className={UI_TOKENS.form.label}>Visual Shade</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      className="w-9 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                    />
                    <span className="text-[11px] font-mono text-slate-500">{newColorHex}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">🛡️ Anti-Garbage Shield Active:</p>
                <p>• Duplicate names & random typing are rejected automatically.</p>
                <p>• Names are formatted into official textile Title-Case (e.g. "navy" → "Navy").</p>
                <p>• Color will be saved to Central Master Library for future styles.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddingMasterColor(false);
                  setColorModalError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveMasterColor}
              >
                Verify & Add to Master
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tech-Pack Quick Inspector / Document Preview Modal */}
      {formData.techpack_file_url && (
        <TechPackPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          fileUrl={formData.techpack_file_url}
          fileName={formData.techpack_file_name || "Style_Tech_Pack"}
          fileSize={formData.techpack_file_size}
          styleCode={nextCode}
        />
      )}
    </div>
  );
};
