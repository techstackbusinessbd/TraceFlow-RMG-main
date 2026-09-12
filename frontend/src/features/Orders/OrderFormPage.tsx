import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Save,
  ArrowLeft,
  ShoppingBag,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Calculator,
  DollarSign,
  Sparkles,
  Eye,
  Trash2,
  Truck,
  Tag,
  Clock,
  Info,
  Check,
  Layers,
  Plus,
  X,
  Globe,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { Toast } from "../../components/common/Toast";
import { Toggle } from "../../components/common/Toggle";
import { Badge } from "../../components/common/Badge";
import { TechPackPreviewModal } from "../../components/common/TechPackPreviewModal";
import { UomQuantityInput } from "../../components/common/UomQuantityInput";
import { UI_TOKENS } from "../../config/designTokens";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  batchCreatePurchaseOrders,
  getPurchaseOrder,
  getNextOrderCode,
  downloadOrderTemplate,
  uploadPoDocument,
  parsePoFile,
  type PurchaseOrderFormData,
  type ParsedPoResult,
  type MultiPoGroupItem,
} from "../../services/orderService";
import {
  getStyles,
  quickAddStyleColor,
  quickAddStyleSize,
  type WovenStyle,
} from "../../services/styleService";
import { getOperationalCompanies, type Company } from "../../services/companyService";
import { getBuyers, type Buyer } from "../../services/buyerService";
import {
  getMasterMetadata,
  DEFAULT_MASTER_METADATA,
  type MasterMetadata,
} from "../../services/masterMetadataService";

export interface ManualPoItem {
  id: string;
  buyer_po_number: string;
  department?: string;
  destination_country: string;
  factory_delivery_date: string;
  buyer_delivery_date: string;
  order_qty: number | "";
  matrix: Record<number, Record<number, number>>;
}

interface OrderFormPageProps {
  mode: "create" | "edit";
  orderId?: string | number;
  onNavigate: (path: string) => void;
}

export const OrderFormPage: React.FC<OrderFormPageProps> = ({
  mode,
  orderId,
  onNavigate,
}) => {
  // Master options
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [styles, setStyles] = useState<WovenStyle[]>([]);

  // Selected Style Details
  const [selectedStyle, setSelectedStyle] = useState<WovenStyle | null>(null);

  // Active Entry Mode: null (unselected initial state) vs 'manual' (2D Matrix Grid) vs 'import' (Excel/PDF File)
  const [activeTab, setActiveTab] = useState<"manual" | "import" | null>(null);

  // Form State
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    company_id: 0,
    buyer_id: "",
    style_id: "",
    buyer_po_number: "",
    season_name: "",
    department: "",
    order_type: "Regular",
    total_order_qty: "",
    currency: "USD",
    unit_price: "",
    order_placement_date: new Date().toISOString().split("T")[0],
    factory_delivery_date: "",
    buyer_delivery_date: "",
    shipment_mode: "SEA",
    incoterm: "FOB",
    payment_terms: "LC at Sight",
    delivery_destination: "",
    po_document_url: null,
    po_document_name: null,
    po_document_size: null,
    remarks: "",
    status: "Confirmed",
    is_active: true,
    breakdowns: [],
  });

  // Next intelligent code preview
  const [nextCode, setNextCode] = useState<string>("Select Company First");

  // 2D Matrix Grid state: matrix[colorId][sizeId] = quantity
  const [matrix, setMatrix] = useState<Record<number, Record<number, number>>>({});

  // File parsing / upload state
  const [isParsing, setIsParsing] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<ParsedPoResult | null>(null);
  const [multiPos, setMultiPos] = useState<MultiPoGroupItem[]>([]);
  const [activePoTab, setActivePoTab] = useState<number>(0);

  // Manual Multi-PO state (Allows adding multiple POs/destinations manually in 2D Matrix mode)
  const [manualPos, setManualPos] = useState<ManualPoItem[]>([]);
  const [activeManualPoIndex, setActiveManualPoIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Quick-Add Color & Size state (Manual 2D Matrix On-the-Fly)
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorCode, setNewColorCode] = useState("");
  const [isAddingSize, setIsAddingSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [isSavingEntity, setIsSavingEntity] = useState(false);

  // Document preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Order Quantity Unit of Measure (UOM) state: Pcs, Dzn, Set, Pair, Pack
  const [orderUom, setOrderUom] = useState<"Pcs" | "Dzn" | "Set" | "Pair" | "Pack">("Pcs");

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Metadata state
  const [metadata, setMetadata] = useState<MasterMetadata>(DEFAULT_MASTER_METADATA);

  // Load master metadata on mount (seasons, years, etc.)
  useEffect(() => {
    getMasterMetadata()
      .then((data) => setMetadata(data))
      .catch(() => setMetadata(DEFAULT_MASTER_METADATA));
  }, []);

  // Selected Buyer helper
  const selectedBuyer = useMemo(() => {
    if (!formData.buyer_id) return null;
    return buyers.find((b) => b.id === Number(formData.buyer_id)) || null;
  }, [formData.buyer_id, buyers]);

  // Separate Season Name & Season Year state (per SRS 3.1 & 3.2 requirements)
  const [seasonName, setSeasonName] = useState<string>("");
  const [seasonYear, setSeasonYear] = useState<string>("2026");

  // Synchronize combined formData.season_name whenever seasonName or seasonYear changes
  useEffect(() => {
    if (seasonName) {
      const combined = seasonYear && !seasonName.includes(seasonYear) ? `${seasonName} ${seasonYear}`.trim() : seasonName;
      setFormData((prev) => ({ ...prev, season_name: combined }));
    }
  }, [seasonName, seasonYear]);

  // Derive available season names (e.g. "Spring", "Summer", "Autumn/Winter", "Spring/Summer") based on buyer origin
  const availableSeasonNames = useMemo(() => {
    const list: string[] = [];

    // Determine regional season prefixes based on buyer origin
    const bCountry = (selectedBuyer?.country || "").toLowerCase();
    const bName = (selectedBuyer?.name || "").toLowerCase();
    const isUsBuyer =
      bCountry.includes("usa") ||
      bCountry.includes("united states") ||
      bCountry.includes("canada") ||
      bName.includes("target") ||
      bName.includes("walmart") ||
      bName.includes("gap") ||
      bName.includes("levi") ||
      bName.includes("kohl");

    const rawNames = isUsBuyer
      ? metadata.seasons?.us || DEFAULT_MASTER_METADATA.seasons.us
      : metadata.seasons?.eu || DEFAULT_MASTER_METADATA.seasons.eu;

    rawNames.forEach((s) => {
      if (!list.includes(s)) list.push(s);
    });

    return list;
  }, [selectedBuyer, metadata]);

  // Available Season Years
  const availableSeasonYears = useMemo(() => {
    return metadata.seasons?.years || ["2025", "2026", "2027", "2028", "2029", "2030"];
  }, [metadata]);

  // Load initial companies
  useEffect(() => {
    getOperationalCompanies()
      .then((cList) => {
        setCompanies(cList);
      })
      .catch(() => {});
  }, [mode]);

  // Load buyers filtered strictly by company
  useEffect(() => {
    if (!formData.company_id) {
      setBuyers([]);
      return;
    }

    getBuyers({ company_id: formData.company_id, per_page: 200 })
      .then((res) => setBuyers(res.data))
      .catch(() => setBuyers([]));
  }, [formData.company_id]);

  // Load styles filtered strictly by company and buyer
  useEffect(() => {
    if (!formData.company_id || !formData.buyer_id) {
      setStyles([]);
      return;
    }

    getStyles({
      company_id: formData.company_id,
      buyer_id: Number(formData.buyer_id),
      per_page: 200,
    })
      .then((res) => {
        setStyles(res.data);
      })
      .catch(() => setStyles([]));
  }, [formData.company_id, formData.buyer_id]);

  // Fetch Next Order Code whenever Company changes
  useEffect(() => {
    if (mode === "create") {
      if (formData.company_id) {
        getNextOrderCode(formData.company_id)
          .then((code) => setNextCode(code))
          .catch(() => setNextCode("—"));
      } else {
        setNextCode("Select Company First");
      }
    }
  }, [mode, formData.company_id]);

  // Load existing order on Edit Mode
  useEffect(() => {
    if (mode === "edit" && orderId) {
      setIsLoading(true);
      getPurchaseOrder(orderId)
        .then((res) => {
          const ord = res.data;
          setNextCode(ord.order_code);
          setFormData({
            company_id: ord.company_id,
            buyer_id: ord.buyer_id,
            style_id: ord.style_id,
            season_id: ord.season_id,
            order_code: ord.order_code,
            buyer_po_number: ord.buyer_po_number,
            department: ord.department || "",
            order_type: ord.order_type,
            total_order_qty: ord.total_order_qty,
            currency: ord.currency,
            unit_price: ord.unit_price,
            order_placement_date: ord.order_placement_date,
            factory_delivery_date: ord.factory_delivery_date,
            buyer_delivery_date: ord.buyer_delivery_date,
            shipment_mode: ord.shipment_mode,
            incoterm: ord.incoterm,
            payment_terms: ord.payment_terms || "LC at Sight",
            delivery_destination: ord.delivery_destination || "",
            po_document_url: ord.po_document_url || null,
            po_document_name: ord.po_document_name || null,
            po_document_size: ord.po_document_size || null,
            remarks: ord.remarks || "",
            status: ord.status,
            is_active: ord.is_active,
            breakdowns: ord.breakdowns || [],
          });

          // Parse existing season_name into seasonName and seasonYear
          if (ord.season_name) {
            const parts = ord.season_name.trim().split(" ");
            const lastPart = parts[parts.length - 1];
            if (/^\d{4}$/.test(lastPart)) {
              setSeasonYear(lastPart);
              setSeasonName(parts.slice(0, -1).join(" "));
            } else {
              setSeasonName(ord.season_name);
            }
          }

          // Populate 2D matrix
          const initialMatrix: Record<number, Record<number, number>> = {};
          (ord.breakdowns || []).forEach((b) => {
            if (!initialMatrix[b.style_color_id]) {
              initialMatrix[b.style_color_id] = {};
            }
            initialMatrix[b.style_color_id][b.style_size_id] = b.order_qty;
          });
          setMatrix(initialMatrix);
          setActiveTab("manual");
          if (ord.style) {
            setSelectedStyle(ord.style as unknown as WovenStyle);
          }
        })
        .catch((err) => {
          showToast("error", "Failed to Load Order", err.message || "Could not retrieve purchase order.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [mode, orderId]);

  // Synchronize selected style when style_id changes
  useEffect(() => {
    if (formData.style_id) {
      const match = styles.find((s) => s.id === Number(formData.style_id));
      if (match) {
        setSelectedStyle(match);
        if (!formData.buyer_id && match.buyer_id) {
          setFormData((prev) => ({ ...prev, buyer_id: match.buyer_id }));
        }
      }
    } else {
      setSelectedStyle(null);
    }
  }, [formData.style_id, styles, formData.buyer_id]);

  // Handle matrix quantity changes
  const handleMatrixChange = (colorId: number, sizeId: number, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setMatrix((prev) => ({
      ...prev,
      [colorId]: {
        ...(prev[colorId] || {}),
        [sizeId]: num,
      },
    }));
  };

  // Helper to calculate total for a specific matrix
  const getMatrixTotal = (m: Record<number, Record<number, number>>) => {
    let sum = 0;
    Object.values(m || {}).forEach((row) => {
      Object.values(row || {}).forEach((q) => {
        sum += Number(q) || 0;
      });
    });
    return sum;
  };

  // Compute breakdown total from matrix
  const matrixBreakdownTotal = useMemo(() => {
    return getMatrixTotal(matrix);
  }, [matrix]);

  // Color row totals
  const colorTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    if (!selectedStyle?.colors) return totals;
    selectedStyle.colors.forEach((c) => {
      const row = matrix[c.id!] || {};
      totals[c.id!] = Object.values(row).reduce((acc, q) => acc + (Number(q) || 0), 0);
    });
    return totals;
  }, [matrix, selectedStyle]);

  // Size column totals
  const sizeTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    if (!selectedStyle?.sizes) return totals;
    selectedStyle.sizes.forEach((s) => {
      let colSum = 0;
      Object.values(matrix).forEach((row) => {
        colSum += Number(row[s.id!]) || 0;
      });
      totals[s.id!] = colSum;
    });
    return totals;
  }, [matrix, selectedStyle]);

  // Total PO Quantity from input
  const targetTotalQty = Number(formData.total_order_qty) || 0;
  const qtyVariance = targetTotalQty - matrixBreakdownTotal;
  const isZeroBalance = targetTotalQty > 0 && qtyVariance === 0;

  // Multi-PO Combined metrics across all manual PO tabs (adhering strictly to SRS 3.6.2 & 3.6.3)
  const combinedAllPosTotal = useMemo(() => {
    if (manualPos.length <= 1) {
      return matrixBreakdownTotal;
    }
    return manualPos.reduce((sum, item, idx) => {
      if (idx === activeManualPoIndex) {
        return sum + matrixBreakdownTotal;
      }
      return sum + getMatrixTotal(item.matrix);
    }, 0);
  }, [manualPos, activeManualPoIndex, matrixBreakdownTotal]);

  // Master Order committed unassigned balance
  const unassignedMasterBalance = targetTotalQty - combinedAllPosTotal;
  const isMasterOrderBalanced = targetTotalQty > 0 && unassignedMasterBalance === 0;

  // Auto calculate total order value
  const computedTotalValue = useMemo(() => {
    const qty = targetTotalQty;
    const price = Number(formData.unit_price) || 0;
    return (qty * price).toFixed(2);
  }, [targetTotalQty, formData.unit_price]);

  // Lead time calculation in days between placement and factory delivery
  const leadTimeDays = useMemo(() => {
    if (!formData.order_placement_date || !formData.factory_delivery_date) return null;
    const start = new Date(formData.order_placement_date).getTime();
    const end = new Date(formData.factory_delivery_date).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }, [formData.order_placement_date, formData.factory_delivery_date]);

  // Quick Add Colorway on-the-fly
  const handleQuickAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.style_id) {
      showToast("error", "Style Required", "Please select a Style first.");
      return;
    }
    if (!newColorName.trim()) {
      showToast("error", "Color Name Required", "Please enter a colorway name.");
      return;
    }

    setIsSavingEntity(true);
    try {
      const res = await quickAddStyleColor(Number(formData.style_id), {
        color_name: newColorName.trim(),
        color_code: newColorCode.trim() || undefined,
      });

      const addedColor = res.data;
      if (selectedStyle) {
        const existingList = selectedStyle.colors || [];
        const alreadyInList = existingList.some(
          (c) => c.color_name.toLowerCase() === addedColor.color_name.toLowerCase()
        );
        if (!alreadyInList) {
          const updatedColors = [...existingList, addedColor];
          setSelectedStyle({
            ...selectedStyle,
            colors: updatedColors,
          });
        }
      }

      setNewColorName("");
      setNewColorCode("");
      setIsAddingColor(false);
      showToast("success", "Colorway Added", `Colorway '${addedColor.color_name}' added to style and matrix.`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast("error", "Failed to Add Color", errorObj.message || "Could not add colorway.");
    } finally {
      setIsSavingEntity(false);
    }
  };

  // Quick Add Size scale on-the-fly
  const handleQuickAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.style_id) {
      showToast("error", "Style Required", "Please select a Style first.");
      return;
    }
    if (!newSizeName.trim()) {
      showToast("error", "Size Name Required", "Please enter a size name (e.g. 38X32, 3XL).");
      return;
    }

    setIsSavingEntity(true);
    try {
      const res = await quickAddStyleSize(Number(formData.style_id), {
        size_name: newSizeName.trim().toUpperCase(),
      });

      const addedSize = res.data;
      if (selectedStyle) {
        const existingList = selectedStyle.sizes || [];
        const alreadyInList = existingList.some(
          (s) => s.size_name.toLowerCase() === addedSize.size_name.toLowerCase()
        );
        if (!alreadyInList) {
          const updatedSizes = [...existingList, addedSize];
          setSelectedStyle({
            ...selectedStyle,
            sizes: updatedSizes,
          });
        }
      }

      setNewSizeName("");
      setIsAddingSize(false);
      showToast("success", "Size Added", `Size '${addedSize.size_name}' added to style scale.`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast("error", "Failed to Add Size", errorObj.message || "Could not add size scale.");
    } finally {
      setIsSavingEntity(false);
    }
  };

  // Handle Template Download
  const handleDownloadTemplate = async () => {
    if (!formData.style_id) {
      showToast("error", "Select Style First", "Please select a Style to download its customized PO breakdown template.");
      return;
    }
    try {
      const filename = `${selectedStyle?.buyer_style_no || "style"}_PO_Breakdown_Template.xlsx`;
      await downloadOrderTemplate(Number(formData.style_id), filename);
      showToast("success", "Template Downloaded", "Excel breakdown matrix template downloaded successfully.");
    } catch {
      showToast("error", "Download Failed", "Could not generate PO breakdown template.");
    }
  };

  // Handle File Parse (.xlsx, .csv, .pdf)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.style_id) {
      showToast("error", "Style Required", "Please select a Style before parsing the PO breakdown file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsParsing(true);
    try {
      const result = await parsePoFile(file, Number(formData.style_id));
      if (result.multi_po_groups && result.multi_po_groups.length > 0) {
        setMultiPos(result.multi_po_groups);
      } else {
        setMultiPos([]);
      }

      setFormData((prev) => ({
        ...prev,
        buyer_po_number: result.buyer_po_number || prev.buyer_po_number,
        total_order_qty: result.total_order_qty || prev.total_order_qty,
        season_name: result.season_name || prev.season_name,
        currency: result.currency || prev.currency,
        unit_price: result.unit_price !== undefined && result.unit_price !== null ? result.unit_price : prev.unit_price,
        factory_delivery_date: result.factory_delivery_date || prev.factory_delivery_date,
        buyer_delivery_date: result.buyer_delivery_date || result.factory_delivery_date || prev.buyer_delivery_date,
        delivery_destination: result.delivery_destination || prev.delivery_destination,
      }));

      // If new colors or sizes were auto-provisioned, update selectedStyle so the 2D grid immediately renders them
      if (result.style_colors || result.style_sizes) {
        setSelectedStyle((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            colors: (result.style_colors as any) || prev.colors,
            sizes: (result.style_sizes as any) || prev.sizes,
          };
        });
      }

      if (result.matrix && Object.keys(result.matrix).length > 0) {
        setMatrix(result.matrix);
      }

      const addedSummary: string[] = [];
      if (result.new_colors_created && result.new_colors_created > 0) {
        addedSummary.push(`${result.new_colors_created} new color(s)`);
      }
      if (result.new_sizes_created && result.new_sizes_created > 0) {
        addedSummary.push(`${result.new_sizes_created} new size(s)`);
      }

      let successSubtitle = "Extracted PO header and matrix breakdown quantities.";
      if (result.multi_po_groups && result.multi_po_groups.length > 1) {
        successSubtitle = `Detected ${result.multi_po_groups.length} Purchase Orders in file. Multi-PO review enabled.`;
      } else if (addedSummary.length > 0) {
        successSubtitle = `Extracted PO header & matrix. Auto-added ${addedSummary.join(" and ")} to Style.`;
      }

      showToast("success", "File Parsed Successfully", successSubtitle);
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast("error", "Parsing Failed", e.message || "Could not parse purchase order file.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Official PO Document Upload (PDF, Excel, Scan)
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const res = await uploadPoDocument(file);
      setFormData((prev) => ({
        ...prev,
        po_document_url: res.file_url,
        po_document_name: res.file_name,
        po_document_size: res.file_size,
      }));
      showToast("success", "Document Attached", `${res.file_name} uploaded successfully.`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast("error", "Upload Failed", e.message || "Could not upload document.");
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  // Add another PO in Manual Mode (Multi PO / Multi Destination)
  const handleAddManualPo = () => {
    // If this is the very first time clicking "+ Add Another PO", turn the current form into PO #1
    let baseList = [...manualPos];
    if (baseList.length === 0) {
      const firstPoNumber = formData.buyer_po_number || `PO-${Date.now().toString().slice(-4)}-01`;
      baseList = [
        {
          id: `manual-po-1`,
          buyer_po_number: firstPoNumber,
          department: formData.department || "",
          destination_country: formData.delivery_destination || "",
          factory_delivery_date: formData.factory_delivery_date || "",
          buyer_delivery_date: formData.buyer_delivery_date || "",
          order_qty: formData.total_order_qty || (matrixBreakdownTotal > 0 ? matrixBreakdownTotal : ""),
          matrix: { ...matrix },
        },
      ];
    } else {
      // Sync current active PO's matrix and quantities before adding next
      baseList[activeManualPoIndex] = {
        ...baseList[activeManualPoIndex],
        buyer_po_number: formData.buyer_po_number,
        department: formData.department || "",
        destination_country: formData.delivery_destination || "",
        factory_delivery_date: formData.factory_delivery_date || "",
        buyer_delivery_date: formData.buyer_delivery_date || "",
        order_qty: formData.total_order_qty,
        matrix: { ...matrix },
      };
    }

    const nextIndex = baseList.length + 1;
    const newPoItem: ManualPoItem = {
      id: `manual-po-${Date.now()}`,
      buyer_po_number: formData.buyer_po_number ? `${formData.buyer_po_number}-${nextIndex}` : `PO-${nextIndex}`,
      department: formData.department || "",
      destination_country: "",
      factory_delivery_date: formData.factory_delivery_date || "",
      buyer_delivery_date: formData.buyer_delivery_date || "",
      order_qty: "",
      matrix: {},
    };

    const updatedList = [...baseList, newPoItem];
    setManualPos(updatedList);
    setActiveManualPoIndex(updatedList.length - 1);

    // Switch active form data & matrix to the newly added PO
    setFormData((prev) => ({
      ...prev,
      buyer_po_number: newPoItem.buyer_po_number,
      delivery_destination: "",
      total_order_qty: "",
    }));
    setMatrix({});
    showToast("success", "New PO Tab Added", `PO #${newPoItem.buyer_po_number} tab created for destination breakdown.`);
  };

  // Switch between Manual PO tabs
  const handleSwitchManualPo = (index: number) => {
    if (index === activeManualPoIndex) return;

    // Save current active PO data into manualPos
    const updated = [...manualPos];
    if (updated[activeManualPoIndex]) {
      updated[activeManualPoIndex] = {
        ...updated[activeManualPoIndex],
        buyer_po_number: formData.buyer_po_number,
        department: formData.department || "",
        destination_country: formData.delivery_destination || "",
        factory_delivery_date: formData.factory_delivery_date || "",
        buyer_delivery_date: formData.buyer_delivery_date || "",
        order_qty: formData.total_order_qty,
        matrix: { ...matrix },
      };
      setManualPos(updated);
    }

    const targetPo = updated[index];
    setActiveManualPoIndex(index);
    if (targetPo) {
      setFormData((prev) => ({
        ...prev,
        buyer_po_number: targetPo.buyer_po_number,
        department: targetPo.department || "",
        delivery_destination: targetPo.destination_country || "",
        factory_delivery_date: targetPo.factory_delivery_date || prev.factory_delivery_date,
        buyer_delivery_date: targetPo.buyer_delivery_date || prev.buyer_delivery_date,
        total_order_qty: targetPo.order_qty,
      }));
      setMatrix(targetPo.matrix || {});
    }
  };

  // Remove a Manual PO tab
  const handleRemoveManualPo = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (manualPos.length <= 1) {
      // Revert to single mode
      setManualPos([]);
      setActiveManualPoIndex(0);
      showToast("info", "Multi-PO Mode Reset", "Reverted to single Purchase Order entry mode.");
      return;
    }

    const remaining = manualPos.filter((_, idx) => idx !== indexToRemove);
    setManualPos(remaining);

    const newActiveIdx = indexToRemove >= remaining.length ? remaining.length - 1 : indexToRemove;
    setActiveManualPoIndex(newActiveIdx);
    const target = remaining[newActiveIdx];
    if (target) {
      setFormData((prev) => ({
        ...prev,
        buyer_po_number: target.buyer_po_number,
        department: target.department || "",
        delivery_destination: target.destination_country || "",
        factory_delivery_date: target.factory_delivery_date || prev.factory_delivery_date,
        buyer_delivery_date: target.buyer_delivery_date || prev.buyer_delivery_date,
        total_order_qty: target.order_qty,
      }));
      setMatrix(target.matrix || {});
    }
    showToast("info", "PO Tab Removed", "Removed purchase order tab.");
  };

  // Batch Form Submit Handler for Multiple POs (Supports both Excel Import batch & Manual Multi-PO batch)
  const handleBatchSubmit = async () => {
    if (!formData.company_id || !formData.buyer_id || !formData.style_id) {
      showToast("error", "Scope Required", "Company, Buyer, and Style must be selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      let ordersPayload: any[] = [];

      if (activeTab === "import" && multiPos.length > 0) {
        ordersPayload = multiPos.map((mPo) => {
          const breakdowns: PurchaseOrderFormData["breakdowns"] = [];
          Object.entries(mPo.matrix || matrix).forEach(([colorIdStr, sizesObj]) => {
            const colorId = Number(colorIdStr);
            Object.entries(sizesObj).forEach(([sizeIdStr, qty]) => {
              const sizeId = Number(sizeIdStr);
              if (qty > 0) {
                breakdowns.push({
                  style_color_id: colorId,
                  style_size_id: sizeId,
                  order_qty: qty,
                  excess_percentage: 3.0,
                  planned_cut_qty: Math.round(qty * 1.03),
                  delivery_date: mPo.delivery_date || formData.factory_delivery_date || null,
                  destination_country: mPo.destination_country || formData.delivery_destination || null,
                });
              }
            });
          });

          return {
            company_id: Number(formData.company_id),
            buyer_id: Number(formData.buyer_id),
            style_id: Number(formData.style_id),
            buyer_po_number: mPo.buyer_po_number,
            season_name: mPo.season_name || formData.season_name,
            order_qty: mPo.order_qty,
            unit_price: mPo.unit_price || Number(formData.unit_price) || 0,
            currency: mPo.currency || formData.currency,
            order_date: formData.order_placement_date,
            ex_factory_date: mPo.delivery_date || formData.factory_delivery_date,
            delivery_date: mPo.delivery_date || formData.buyer_delivery_date,
            shipment_mode: formData.shipment_mode,
            destination_port: mPo.destination_country || formData.delivery_destination,
            po_file_url: formData.po_document_url,
            po_file_name: formData.po_document_name,
            po_file_size: formData.po_document_size,
            entry_mode: "Excel_Import" as const,
            status: "Confirmed" as const,
            is_active: true,
            breakdowns,
          };
        });
      } else if (activeTab === "manual" && manualPos.length > 1) {
        // Save current active tab matrix first
        const currentList = [...manualPos];
        currentList[activeManualPoIndex] = {
          ...currentList[activeManualPoIndex],
          buyer_po_number: formData.buyer_po_number,
          department: formData.department || "",
          destination_country: formData.delivery_destination || "",
          factory_delivery_date: formData.factory_delivery_date || "",
          buyer_delivery_date: formData.buyer_delivery_date || "",
          order_qty: formData.total_order_qty || matrixBreakdownTotal,
          matrix: { ...matrix },
        };

        ordersPayload = currentList.map((mPo) => {
          const breakdowns: PurchaseOrderFormData["breakdowns"] = [];
          Object.entries(mPo.matrix || {}).forEach(([colorIdStr, sizesObj]) => {
            const colorId = Number(colorIdStr);
            Object.entries(sizesObj).forEach(([sizeIdStr, qty]) => {
              const sizeId = Number(sizeIdStr);
              if (qty > 0) {
                breakdowns.push({
                  style_color_id: colorId,
                  style_size_id: sizeId,
                  order_qty: qty,
                  excess_percentage: 3.0,
                  planned_cut_qty: Math.round(qty * 1.03),
                  delivery_date: mPo.factory_delivery_date || formData.factory_delivery_date || null,
                  destination_country: mPo.destination_country || formData.delivery_destination || null,
                });
              }
            });
          });

          const poQty = Number(mPo.order_qty) || getMatrixTotal(mPo.matrix);

          return {
            company_id: Number(formData.company_id),
            buyer_id: Number(formData.buyer_id),
            style_id: Number(formData.style_id),
            buyer_po_number: mPo.buyer_po_number,
            season_name: formData.season_name,
            order_qty: poQty,
            unit_price: Number(formData.unit_price) || 0,
            currency: formData.currency,
            order_date: formData.order_placement_date,
            ex_factory_date: mPo.factory_delivery_date || formData.factory_delivery_date,
            delivery_date: mPo.buyer_delivery_date || formData.buyer_delivery_date,
            shipment_mode: formData.shipment_mode,
            destination_port: mPo.destination_country || formData.delivery_destination,
            po_file_url: formData.po_document_url,
            po_file_name: formData.po_document_name,
            po_file_size: formData.po_document_size,
            entry_mode: "Manual_Matrix" as const,
            status: formData.status || "Confirmed",
            is_active: formData.is_active,
            breakdowns,
          };
        });
      }

      if (ordersPayload.length === 0) {
        showToast("error", "Empty Orders", "No purchase order breakdown items found to save.");
        return;
      }

      const res = await batchCreatePurchaseOrders({
        company_id: Number(formData.company_id),
        buyer_id: Number(formData.buyer_id),
        style_id: Number(formData.style_id),
        orders: ordersPayload,
      });

      showToast("success", "Batch Orders Created", `${res.length} Purchase Orders created successfully.`);
      setTimeout(() => onNavigate("/orders"), 1200);
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) setErrors(e.errors);
      showToast("error", "Batch Save Failed", e.message || "Could not save batch purchase orders.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (targetTotalQty > 0 && matrixBreakdownTotal !== targetTotalQty) {
      showToast(
        "error",
        "Mathematical Variance Detected",
        `Total PO Quantity (${targetTotalQty.toLocaleString()}) must match Matrix Breakdown Sum (${matrixBreakdownTotal.toLocaleString()}). Variance: ${qtyVariance}.`
      );
      return;
    }

    const breakdowns: PurchaseOrderFormData["breakdowns"] = [];
    Object.entries(matrix).forEach(([colorIdStr, sizesObj]) => {
      const colorId = Number(colorIdStr);
      Object.entries(sizesObj).forEach(([sizeIdStr, qty]) => {
        const sizeId = Number(sizeIdStr);
        if (qty > 0) {
          breakdowns.push({
            style_color_id: colorId,
            style_size_id: sizeId,
            order_qty: qty,
            excess_percentage: 3.0,
            planned_cut_qty: Math.round(qty * 1.03),
            delivery_date: formData.factory_delivery_date || null,
            destination_country: formData.delivery_destination || null,
          });
        }
      });
    });

    if (breakdowns.length === 0) {
      showToast("error", "Empty Breakdown", "At least one size/color quantity must be greater than zero.");
      return;
    }

    const payload: PurchaseOrderFormData = {
      ...formData,
      total_order_qty: targetTotalQty,
      unit_price: Number(formData.unit_price) || 0,
      breakdowns,
    };

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createPurchaseOrder(payload);
        showToast("success", "Order Created", `Purchase Order ${payload.buyer_po_number} created successfully.`);
      } else {
        await updatePurchaseOrder(orderId!, payload);
        showToast("success", "Order Updated", `Purchase Order ${payload.buyer_po_number} updated successfully.`);
      }
      setTimeout(() => onNavigate("/orders"), 1200);
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        setErrors(e.errors);
      }
      showToast("error", "Validation Error", e.message || "Please resolve form errors.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading purchase order data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Toast Alert */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tier 1: PageHeader */}
      <PageHeader
        title={mode === "create" ? "Create Purchase Order" : `Edit Purchase Order: ${formData.buyer_po_number || nextCode}`}
        badgeCount={nextCode}
        badgeLabel=""
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onNavigate("/orders")}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {multiPos.length > 1 || manualPos.length > 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleBatchSubmit}
                disabled={isSubmitting}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {isSubmitting
                  ? "Saving All..."
                  : `Save All (${multiPos.length > 1 ? multiPos.length : manualPos.length} Orders)`}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? "Saving..." : mode === "create" ? "Save Order" : "Save Changes"}
              </Button>
            )}
          </div>
        }
      />

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Golden 2/3 and 1/3 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2/3 Main Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Part 1: Order Master & Style Affiliation (Conforming strictly to SRS 3.1) */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FC] border border-[#C7E0F4] text-[#0066FF] flex items-center justify-center font-bold text-xs shadow-2xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Part 1: Order Master & Style Context</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Manufacturing company unit, master buyer contract, and style specification profile.</p>
                  </div>
                </div>
                {formData.company_id ? (
                  <Badge variant="code">{nextCode}</Badge>
                ) : (
                  <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Awaiting Company
                  </span>
                )}
              </div>

              {/* Sub-section 1: Contract & Commercial Affiliation */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Master Order / Job Code (1st Position: System Auto Identifier) */}
                  <FormField
                    label="Master Order No (Job No)"
                    systemAuto={true}
                    error={errors.order_code}
                    helperText="Intelligent job reference code [CompanyCode]-[YY]-[Seq]."
                  >
                    <div className="relative flex items-center">
                      <TextInput
                        value={formData.company_id ? nextCode : "Select Company First"}
                        readOnly
                        className={`bg-slate-50 font-mono font-semibold cursor-not-allowed border-slate-200 ${
                          formData.company_id ? "text-[#0066FF]" : "text-slate-400"
                        }`}
                      />
                    </div>
                  </FormField>

                  {/* Company Selection (2nd Position: Primary Operational Selector) */}
                  <FormField
                    label="Company"
                    required
                    error={errors.company_id}
                    helperText="Manufacturing operating unit responsible for contract execution."
                  >
                    <div className="relative flex items-center">
                      <select
                        value={formData.company_id || ""}
                        onChange={(e) => {
                          const cid = e.target.value ? Number(e.target.value) : 0;
                          setFormData((prev) => ({
                            ...prev,
                            company_id: cid,
                            buyer_id: "",
                            style_id: "",
                          }));
                          setMatrix({});
                          setSelectedStyle(null);
                          setParsedSummary(null);
                        }}
                        className={`w-full ${UI_TOKENS.input.select} ${errors.company_id ? UI_TOKENS.input.error : ""}`}
                        disabled={mode === "edit"}
                      >
                        <option value="">Select Company...</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buyer Selection (Dependent on Company) */}
                  <FormField
                    label="Buyer"
                    required
                    error={errors.buyer_id}
                    helperText={
                      !formData.company_id
                        ? "Select Company first to view affiliated buyers."
                        : buyers.length === 0
                        ? "No buyers registered under this Company."
                        : "Primary brand client issuing this order contract."
                    }
                  >
                    <select
                      value={formData.buyer_id || ""}
                      disabled={!formData.company_id || buyers.length === 0}
                      onChange={(e) => {
                        const bid = e.target.value ? Number(e.target.value) : "";
                        setFormData((prev) => ({
                          ...prev,
                          buyer_id: bid,
                          style_id: "",
                        }));
                        setMatrix({});
                        setSelectedStyle(null);
                        setParsedSummary(null);
                      }}
                      className={`w-full ${UI_TOKENS.input.select} ${
                        !formData.company_id || buyers.length === 0
                          ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                          : ""
                      } ${errors.buyer_id ? UI_TOKENS.input.error : ""}`}
                    >
                      <option value="">
                        {!formData.company_id
                          ? "Select Company First..."
                          : buyers.length === 0
                          ? "No Buyers Found"
                          : "Select Buyer..."}
                      </option>
                      {buyers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Style Selection (Dependent on Company + Buyer) */}
                  <FormField
                    label="Style Number & Item"
                    required
                    error={errors.style_id}
                    helperText={
                      !formData.company_id
                        ? "Select Company first."
                        : !formData.buyer_id
                        ? "Select Buyer to load affiliated styles."
                        : styles.length === 0
                        ? "No active styles found for this Company and Buyer."
                        : "Master style specification profile."
                    }
                  >
                    <select
                      value={formData.style_id || ""}
                      disabled={!formData.company_id || !formData.buyer_id || styles.length === 0}
                      onChange={(e) => {
                        const sid = e.target.value ? Number(e.target.value) : "";
                        const chosenStyle = styles.find((s) => s.id === sid);
                        setFormData((prev) => ({
                          ...prev,
                          style_id: sid,
                        }));
                        if (chosenStyle?.season) {
                          const parts = chosenStyle.season.trim().split(" ");
                          const lastPart = parts[parts.length - 1];
                          if (/^\d{4}$/.test(lastPart)) {
                            setSeasonYear(lastPart);
                            setSeasonName(parts.slice(0, -1).join(" "));
                          } else {
                            setSeasonName(chosenStyle.season);
                          }
                        }
                        setMatrix({});
                        setParsedSummary(null);
                      }}
                      className={`w-full ${UI_TOKENS.input.select} ${
                        !formData.company_id || !formData.buyer_id || styles.length === 0
                          ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                          : ""
                      } ${errors.style_id ? UI_TOKENS.input.error : ""}`}
                    >
                      <option value="">
                        {!formData.company_id
                          ? "Select Company First..."
                          : !formData.buyer_id
                          ? "Select Buyer First..."
                          : styles.length === 0
                          ? "No Styles Found"
                          : "Select Style..."}
                      </option>
                      {styles.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.buyer_style_no} — {s.style_name} ({s.product_category})
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Sub-section 2: Season & Production Volume */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Season Name (SRS 3.1 Separate Dropdown) */}
                  <FormField
                    label="Season Name"
                    required
                    error={errors.season_name}
                    helperText={
                      !formData.buyer_id
                        ? "Select Buyer to load season list."
                        : "Fashion buying collection."
                    }
                  >
                    <select
                      value={seasonName}
                      disabled={!formData.buyer_id}
                      onChange={(e) => setSeasonName(e.target.value)}
                      className={`w-full ${UI_TOKENS.input.select} ${
                        !formData.buyer_id ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
                      } ${errors.season_name ? UI_TOKENS.input.error : ""}`}
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

                  {/* Season Year (SRS 3.1 Separate Dropdown) */}
                  <FormField
                    label="Season Year"
                    required
                    helperText="Delivery calendar year."
                  >
                    <select
                      value={seasonYear}
                      disabled={!formData.buyer_id}
                      onChange={(e) => setSeasonYear(e.target.value)}
                      className={`w-full ${UI_TOKENS.input.select} ${
                        !formData.buyer_id ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
                      }`}
                    >
                      {availableSeasonYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Total Committed Quantity with Central UOM Dropdown */}
                  <FormField
                    label="Committed Quantity"
                    required
                    error={errors.total_order_qty}
                    helperText={
                      orderUom === "Dzn" && Number(formData.total_order_qty) > 0
                        ? `Equivalent: ${(Number(formData.total_order_qty) * 12).toLocaleString()} Pcs`
                        : `Contract volume across all POs.`
                    }
                  >
                    <UomQuantityInput
                      value={formData.total_order_qty}
                      uom={orderUom}
                      category="apparel"
                      onChangeQuantity={(qty) =>
                        setFormData((prev) => ({
                          ...prev,
                          total_order_qty: qty === "" ? "" : Number(qty),
                        }))
                      }
                      onChangeUom={(u) => setOrderUom(u as any)}
                      isError={Boolean(errors.total_order_qty)}
                      placeholder="e.g. 10000"
                    />
                  </FormField>
                </div>
              </div>

              {/* Selected Style Detail Strip */}
              {selectedStyle && (
                <div className="mt-4 p-3 bg-[#EFF6FC]/70 border border-[#C7E0F4] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white border border-blue-200 flex items-center justify-center text-[#0066FF] font-bold shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{selectedStyle.buyer_style_no}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-normal text-slate-600">{selectedStyle.style_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Category: <strong>{selectedStyle.product_category}</strong></span>
                        <span>•</span>
                        <span>Item: <strong>{selectedStyle.garment_item}</strong></span>
                        {selectedStyle.season && (
                          <>
                            <span>•</span>
                            <span>Season: <strong>{selectedStyle.season}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="info">{(selectedStyle.colors || []).length} Colorways</Badge>
                    <Badge variant="neutral">{(selectedStyle.sizes || []).length} Sizes</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Mode Selector Cards (Manual 2D Matrix vs Excel / PDF Import) */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#0066FF]" />
                    Select Order Entry Method
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose how you want to input order breakdown, pricing, and quantities.
                  </p>
                </div>
                {activeTab !== null && (
                  <span className="text-[11px] text-slate-500">
                    Active Mode: <strong className="text-[#0066FF]">{activeTab === "manual" ? "Manual 2D Matrix" : "Excel / PDF Import"}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Manual 2D Matrix */}
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    activeTab === "manual"
                      ? "border-[#0066FF] bg-blue-50/40 ring-1 ring-[#0066FF] shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    activeTab === "manual" ? "bg-[#0066FF] text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      Manual 2D Matrix
                      {activeTab === "manual" && <Check className="w-3.5 h-3.5 text-[#0066FF]" />}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Manually enter commercial terms, FOB pricing, milestone dates, and colorway-by-size ratio matrix.
                    </p>
                  </div>
                </button>

                {/* Option 2: Excel / PDF Import */}
                <button
                  type="button"
                  onClick={() => setActiveTab("import")}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    activeTab === "import"
                      ? "border-[#0066FF] bg-blue-50/40 ring-1 ring-[#0066FF] shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    activeTab === "import" ? "bg-[#0066FF] text-white" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      Excel / PDF Import
                      {activeTab === "import" && <Check className="w-3.5 h-3.5 text-[#0066FF]" />}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Upload buyer purchase order sheet (.xlsx / .pdf). Auto-extracts quantities, multi-POs, dates, and builds breakdown matrix.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Mode A Only: Part 2: PO Header, Commercial & Timeline */}
            {activeTab === "manual" && (
              <div className={UI_TOKENS.card.base}>
                <div className={UI_TOKENS.card.header}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-2xs">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className={UI_TOKENS.card.title}>Part 2: PO Header, Commercial & Delivery</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">PO number, destination country, FOB pricing, and critical milestone dates.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {leadTimeDays !== null && (
                      <Badge variant="purple" icon={<Clock className="w-3 h-3" />}>
                        {leadTimeDays} Days Lead Time
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddManualPo}
                      icon={<Plus className="w-3.5 h-3.5 text-[#0066FF]" />}
                      title="Add another PO / destination under this Master Order"
                    >
                      + Add Another PO
                    </Button>
                  </div>
                </div>

                {/* Multiple PO Tabs Bar in Part 2 (When 2 or more POs exist) */}
                {manualPos.length > 1 && (
                  <div className="mb-4 p-2.5 bg-blue-50/50 border border-blue-200/80 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#0066FF]" />
                        Multiple POs under Job ({manualPos.length} Purchase Orders):
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium">
                        Viewing: <strong className="text-[#0066FF]">PO #{activeManualPoIndex + 1} of {manualPos.length}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {manualPos.map((mItem, idx) => {
                        const tabTotal = idx === activeManualPoIndex ? matrixBreakdownTotal : getMatrixTotal(mItem.matrix);
                        return (
                          <div
                            key={mItem.id || idx}
                            className={`inline-flex items-center rounded-md text-xs font-semibold whitespace-nowrap transition-all border shadow-2xs ${
                              activeManualPoIndex === idx
                                ? "bg-[#0066FF] text-white border-[#0066FF]"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSwitchManualPo(idx)}
                              className="px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{mItem.buyer_po_number || `PO #${idx + 1}`}</span>
                              {mItem.destination_country && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                                  activeManualPoIndex === idx ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {mItem.destination_country}
                                </span>
                              )}
                              <span className={`font-mono text-[10.5px] ${
                                activeManualPoIndex === idx ? "text-blue-100" : "text-slate-500"
                              }`}>
                                [{tabTotal.toLocaleString()} pcs]
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleRemoveManualPo(idx, e)}
                              className={`pr-2 pl-0.5 hover:opacity-100 cursor-pointer ${
                                activeManualPoIndex === idx ? "text-blue-100 hover:text-white" : "text-slate-400 hover:text-rose-600"
                              }`}
                              title="Delete this PO"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* KPI Strip (Conforming to SRS 3.2 & 3.6 Live Multi-PO Breakdown Balance) */}
                <div className={`grid gap-3 mb-4 p-3 rounded-lg text-xs border ${
                  manualPos.length > 1
                    ? "grid-cols-2 sm:grid-cols-5 bg-blue-50/30 border-blue-200/70"
                    : "grid-cols-2 sm:grid-cols-4 bg-slate-50/70 border-slate-200/80"
                }`}>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Total Contract Value</span>
                    <p className="text-sm font-bold font-mono text-emerald-600 mt-0.5">
                      {formData.currency} {Number(computedTotalValue).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {manualPos.length > 1 ? "Job Committed Qty" : "Target Order Qty"}
                    </span>
                    <p className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                      {targetTotalQty > 0 ? `${targetTotalQty.toLocaleString()} pcs` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {manualPos.length > 1 ? `Active PO Breakdown` : "Matrix Breakdown Total"}
                    </span>
                    <p className={`text-sm font-bold font-mono mt-0.5 ${
                      matrixBreakdownTotal > 0 ? "text-[#0066FF]" : "text-slate-400"
                    }`}>
                      {matrixBreakdownTotal.toLocaleString()} pcs
                    </p>
                  </div>
                  {manualPos.length > 1 && (
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Combined All POs</span>
                      <p className={`text-sm font-bold font-mono mt-0.5 ${
                        isMasterOrderBalanced ? "text-emerald-600" : "text-indigo-600"
                      }`}>
                        {combinedAllPosTotal.toLocaleString()} pcs
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {manualPos.length > 1 ? "Unassigned Balance" : "Balance Status"}
                    </span>
                    <div className="mt-0.5">
                      {manualPos.length > 1 ? (
                        isMasterOrderBalanced ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <Check className="w-3.5 h-3.5" /> 100% Matched
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            unassignedMasterBalance < 0 ? "text-rose-700 font-bold" : "text-amber-700"
                          }`}>
                            {unassignedMasterBalance > 0
                              ? `+${unassignedMasterBalance.toLocaleString()} pcs Left`
                              : `${unassignedMasterBalance.toLocaleString()} pcs Over`}
                          </span>
                        )
                      ) : isZeroBalance ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <Check className="w-3.5 h-3.5" /> 100% Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          {qtyVariance !== 0 ? `${qtyVariance > 0 ? `+${qtyVariance}` : qtyVariance} pcs` : "Pending"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
                  {/* Buyer PO Number */}
                  <FormField
                    label="Buyer PO Number"
                    required
                    error={errors.buyer_po_number}
                    helperText="Official purchase order number from the buyer sheet."
                  >
                    <TextInput
                      value={formData.buyer_po_number}
                      isError={Boolean(errors.buyer_po_number)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, buyer_po_number: e.target.value }))
                      }
                      placeholder="e.g. PO-HM-2026-9901"
                    />
                  </FormField>

                  {/* Buyer Department */}
                  <FormField
                    label="Buyer Department"
                    error={errors.department}
                    helperText="Division or department (e.g. Menswear Denim, Kids 7-14)."
                  >
                    <TextInput
                      value={formData.department || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      placeholder="e.g. Menswear Casual, Division 04"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Currency */}
                  <FormField label="Currency" required error={errors.currency}>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, currency: e.target.value }))
                      }
                      className={`w-full ${UI_TOKENS.input.select}`}
                    >
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="GBP">GBP (£) — British Pound</option>
                      <option value="BDT">BDT (৳) — Bangladesh Taka</option>
                    </select>
                  </FormField>

                  {/* Unit Price */}
                  <FormField
                    label="Unit Price (FOB)"
                    required
                    error={errors.unit_price}
                    helperText="Contractual unit selling price per garment piece."
                  >
                    <TextInput
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.unit_price}
                      isError={Boolean(errors.unit_price)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          unit_price: e.target.value ? parseFloat(e.target.value) : "",
                        }))
                      }
                      placeholder="e.g. 8.45"
                    />
                  </FormField>

                  {/* Incoterm */}
                  <FormField label="Incoterm" required error={errors.incoterm}>
                    <select
                      value={formData.incoterm}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          incoterm: e.target.value as PurchaseOrderFormData["incoterm"],
                        }))
                      }
                      className={`w-full ${UI_TOKENS.input.select}`}
                    >
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                      <option value="CFR">CFR (Cost and Freight)</option>
                      <option value="EXW">EXW (Ex Works)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                    </select>
                  </FormField>

                  {/* Shipment Mode */}
                  <FormField label="Shipment Mode" required error={errors.shipment_mode}>
                    <select
                      value={formData.shipment_mode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shipment_mode: e.target.value as PurchaseOrderFormData["shipment_mode"],
                        }))
                      }
                      className={`w-full ${UI_TOKENS.input.select}`}
                    >
                      <option value="SEA">SEA — Ocean Vessel</option>
                      <option value="AIR">AIR — Air Freight</option>
                      <option value="ROAD">ROAD — Land Freight</option>
                      <option value="RAIL">RAIL — Railway Freight</option>
                      <option value="SEA_AIR">SEA-AIR — Multimodal</option>
                    </select>
                  </FormField>

                  {/* Order Placement Date */}
                  <FormField
                    label="Order Placement Date"
                    required
                    error={errors.order_placement_date}
                    helperText="Date contract was signed / confirmed."
                  >
                    <TextInput
                      type="date"
                      value={formData.order_placement_date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, order_placement_date: e.target.value }))
                      }
                    />
                  </FormField>

                  {/* Factory Delivery Date */}
                  <FormField
                    label="Factory Ex-Factory Date"
                    required
                    error={errors.factory_delivery_date}
                    helperText="Factory shipment deadline before freight."
                  >
                    <TextInput
                      type="date"
                      value={formData.factory_delivery_date}
                      isError={Boolean(errors.factory_delivery_date)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, factory_delivery_date: e.target.value }))
                      }
                    />
                  </FormField>

                  {/* Buyer Delivery Date */}
                  <FormField
                    label="Buyer In-Store Date"
                    required
                    error={errors.buyer_delivery_date}
                    helperText="Buyer warehouse receipt or in-store launch date."
                  >
                    <TextInput
                      type="date"
                      value={formData.buyer_delivery_date}
                      isError={Boolean(errors.buyer_delivery_date)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, buyer_delivery_date: e.target.value }))
                      }
                    />
                  </FormField>

                  {/* Delivery Destination Port / Country */}
                  <FormField
                    label="Destination Port / Country"
                    error={errors.destination_port || errors.delivery_destination}
                    helperText="Primary destination seaport / airport (e.g. Hamburg Port, Germany)."
                  >
                    <TextInput
                      value={formData.delivery_destination || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, delivery_destination: e.target.value }))
                      }
                      placeholder="e.g. Hamburg Port, Germany / New York, USA"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Section: Ratio Breakdown / Import Workspace (Shown only after choosing an entry mode) */}
            {activeTab !== null && (
              <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-2xs">
                    {activeTab === "manual" ? <Calculator className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#0066FF]" />}
                  </div>
                  <div>
                    <h2 className={UI_TOKENS.card.title}>
                      {activeTab === "manual"
                        ? manualPos.length > 1
                          ? `Part 3: Ratio Matrix for Active PO (${formData.buyer_po_number || `PO #${activeManualPoIndex + 1}`}${
                              formData.delivery_destination ? ` — ${formData.delivery_destination}` : ""
                            })`
                          : "Part 3: PO Breakdown & Color-Size Ratio Matrix"
                        : "Smart PO Import & Extraction Review"}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeTab === "manual"
                        ? manualPos.length > 1
                          ? `Color-size distribution for ${formData.buyer_po_number || `PO #${activeManualPoIndex + 1}`}. Tab breakdown is tracked independently.`
                          : "Colorways (Y) and size scale (X) physical manufacturing quantity distribution."
                        : "Upload buyer purchase order sheet to auto-fill commercial terms and breakdown matrix."}
                    </p>
                  </div>
                </div>
              </div>

              {activeTab === "import" ? (
                <div className="p-4 space-y-4">
                  {/* Smart PO Import Engine Drawer & Dropzone */}
                  <div className="p-4 rounded-lg bg-[#EFF6FC]/40 border border-[#C7E0F4] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          Smart PO Import Engine
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Upload buyer purchase order (.xlsx, .csv, .pdf) to auto-fill header details and breakdown matrix.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleDownloadTemplate}
                        icon={<Download className="w-3.5 h-3.5" />}
                        disabled={!selectedStyle}
                        title={!selectedStyle ? "Select a Style in Card 1 first to download template" : undefined}
                      >
                        Download Excel Template
                      </Button>
                    </div>

                    {/* Dropzone */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx,.xls,.csv,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          if (!formData.style_id) {
                            showToast("error", "Select Style First", "Please select Company, Buyer & Style in Section 1 before uploading PO file.");
                            return;
                          }
                          fileInputRef.current?.click();
                        }}
                        disabled={isParsing}
                        icon={<Upload className="w-3.5 h-3.5" />}
                      >
                        {isParsing ? "Analyzing & Parsing File..." : "Select PO File"}
                      </Button>
                      <span className="text-[11px] text-slate-500">
                        {!formData.style_id
                          ? "⚠ Select a Style above, then upload PO sheet (.xlsx, .csv, .pdf)"
                          : "Supported formats: .xlsx, .csv, .pdf (Max 20MB)"}
                      </span>
                    </div>

                    {/* Parsed Result Feedback */}
                    {parsedSummary && (
                      <div className="space-y-2">
                        <div className="p-3 bg-white border border-emerald-200 rounded-md text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-emerald-900">
                              File parsed successfully: {parsedSummary.breakdowns.length} breakdown records extracted.
                            </p>
                            {parsedSummary.buyer_po_number && (
                              <p className="text-[11px] text-slate-600">
                                Detected PO #: <strong>{parsedSummary.buyer_po_number}</strong> | Total Qty:{" "}
                                <strong>{Number(parsedSummary.total_order_qty).toLocaleString()} pcs</strong>
                                {parsedSummary.delivery_destination && (
                                  <> | Destination: <strong>{parsedSummary.delivery_destination}</strong></>
                                )}
                                {parsedSummary.factory_delivery_date && (
                                  <> | Ship Date: <strong>{parsedSummary.factory_delivery_date}</strong></>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Missing Entity Auto-Provision Notification */}
                        {((parsedSummary.new_colors_created ?? 0) > 0 || (parsedSummary.new_sizes_created ?? 0) > 0) && (
                          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-2 shadow-2xs">
                            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-semibold text-blue-950">
                                Style Library Auto-Expanded
                              </p>
                              <p className="text-[11px] text-blue-800">
                                Detected new items in buyer sheet:{" "}
                                {(parsedSummary.new_colors_created ?? 0) > 0 && <strong>{parsedSummary.new_colors_created} new Colorway(s) </strong>}
                                {(parsedSummary.new_sizes_created ?? 0) > 0 && <strong>{parsedSummary.new_sizes_created} new Size(s) </strong>}
                                were automatically created and added into this Style library.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Multi-PO Detected Switcher Tabs */}
                        {multiPos.length > 1 && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-amber-700" />
                                Multi-PO Batch Detected: {multiPos.length} Purchase Orders found in sheet
                              </p>
                              <Badge variant="neutral">Batch Import Mode</Badge>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {multiPos.map((mPo, idx) => (
                                <button
                                  key={mPo.buyer_po_number}
                                  type="button"
                                  onClick={() => {
                                    setActivePoTab(idx);
                                    setFormData((prev) => ({
                                      ...prev,
                                      buyer_po_number: mPo.buyer_po_number,
                                      total_order_qty: mPo.order_qty,
                                      delivery_destination: mPo.destination_country || prev.delivery_destination,
                                      factory_delivery_date: mPo.delivery_date || prev.factory_delivery_date,
                                      buyer_delivery_date: mPo.delivery_date || prev.buyer_delivery_date,
                                    }));
                                    if (mPo.matrix && Object.keys(mPo.matrix).length > 0) {
                                      setMatrix(mPo.matrix);
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    activePoTab === idx
                                      ? "bg-amber-600 text-white shadow-xs"
                                      : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/50"
                                  }`}
                                >
                                  PO #{mPo.buyer_po_number}
                                  {mPo.destination_country ? ` (${mPo.destination_country})` : ""}
                                  <span className="ml-1 opacity-80 font-mono text-[10px]">
                                    [{mPo.order_qty.toLocaleString()} pcs]
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* If parsed and style selected, show extracted preview matrix */}
                  {parsedSummary !== null && selectedStyle && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[170px]">
                                Colorway (Y-Axis)
                              </th>
                              {(selectedStyle.sizes || []).map((s) => (
                                <th
                                  key={s.id}
                                  className="py-2.5 px-2 text-center border-r border-slate-200 min-w-[70px]"
                                >
                                  {s.size_name}
                                </th>
                              ))}
                              <th className="py-2.5 px-3 text-right bg-slate-100/70 min-w-[90px]">
                                Color Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(selectedStyle.colors || []).map((c) => (
                              <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                                <td className="py-2 px-3 font-medium text-slate-800 border-r border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                      style={{
                                        backgroundColor:
                                          c.color_code.startsWith("#") ? c.color_code : "#64748b",
                                      }}
                                    />
                                    <span className="truncate">{c.color_name}</span>
                                  </div>
                                </td>
                                {(selectedStyle.sizes || []).map((s) => {
                                  const val = matrix[c.id!]?.[s.id!] ?? "";
                                  return (
                                    <td key={s.id} className="py-1 px-1.5 text-center border-r border-slate-100 font-mono font-semibold text-slate-900 bg-slate-50/40">
                                      {Boolean(val) ? Number(val).toLocaleString() : "—"}
                                    </td>
                                  );
                                })}
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 bg-slate-50/50">
                                  {Number(colorTotals[c.id!] || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[#F8FAFC] font-bold border-t-2 border-slate-200">
                            <tr>
                              <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                                Size Total (Pcs)
                              </td>
                              {(selectedStyle.sizes || []).map((s) => (
                                <td
                                  key={s.id}
                                  className="py-2.5 px-2 text-center font-mono text-slate-800 border-r border-slate-200"
                                >
                                  {Number(sizeTotals[s.id!] || 0).toLocaleString()}
                                </td>
                              ))}
                              <td className="py-2.5 px-3 text-right font-mono text-sm bg-[#EFF6FC] text-[#0066FF]">
                                {matrixBreakdownTotal.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Manual Mode */
                !selectedStyle ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/40 m-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Info className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">No Style Selected</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                      Select an approved Style in Section 1 to automatically load its active Colorways and Size Scale matrix.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {/* Manual 2D Matrix Controls Toolbar: Multi-PO Tabs & Quick Entity Builders */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">Ratio Matrix Builder:</span>
                          <Badge variant="info">{(selectedStyle.colors || []).length} Colors</Badge>
                          <Badge variant="neutral">{(selectedStyle.sizes || []).length} Sizes</Badge>
                          {manualPos.length > 1 && (
                            <Badge variant="success">
                              {manualPos.length} Purchase Orders ({manualPos.map(p => p.destination_country || "Pending").filter(Boolean).length} Destinations)
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Multi PO Add Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddManualPo}
                            icon={<Layers className="w-3.5 h-3.5 text-amber-600" />}
                            title="Split order into multiple POs or country destinations"
                          >
                            + Add Another PO / Destination
                          </Button>

                          {/* Add Colorway Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setIsAddingColor(true);
                              setIsAddingSize(false);
                            }}
                            icon={<Plus className="w-3.5 h-3.5 text-blue-600" />}
                          >
                            Add Colorway
                          </Button>

                          {/* Add Size Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setIsAddingSize(true);
                              setIsAddingColor(false);
                            }}
                            icon={<Plus className="w-3.5 h-3.5 text-indigo-600" />}
                          >
                            Add Size Scale
                          </Button>
                        </div>
                      </div>

                      {/* Manual Multi-PO Tabs Bar (Shown when multiple POs are added) */}
                      {manualPos.length > 1 && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-[#0066FF]" />
                              Purchase Order & Destination Tabs:
                            </span>
                            <span className="text-[10.5px] text-slate-500">
                              Active: <strong>Tab {activeManualPoIndex + 1} of {manualPos.length}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {manualPos.map((mItem, idx) => {
                              const tabTotal = idx === activeManualPoIndex ? matrixBreakdownTotal : getMatrixTotal(mItem.matrix);
                              return (
                                <div
                                  key={mItem.id || idx}
                                  className={`inline-flex items-center rounded text-xs font-semibold whitespace-nowrap transition-all border shadow-2xs ${
                                    activeManualPoIndex === idx
                                      ? "bg-[#0066FF] text-white border-[#0066FF]"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSwitchManualPo(idx)}
                                    className="px-2.5 py-1.5 cursor-pointer flex items-center gap-1.5"
                                  >
                                    <span>{mItem.buyer_po_number || `PO #${idx + 1}`}</span>
                                    {mItem.destination_country && (
                                      <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                                        activeManualPoIndex === idx ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                      }`}>
                                        {mItem.destination_country}
                                      </span>
                                    )}
                                    <span className={`font-mono text-[10.5px] ${
                                      activeManualPoIndex === idx ? "text-blue-100" : "text-slate-500"
                                    }`}>
                                      [{tabTotal.toLocaleString()} pcs]
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveManualPo(idx, e)}
                                    className={`pr-1.5 pl-0.5 hover:opacity-100 cursor-pointer ${
                                      activeManualPoIndex === idx ? "text-blue-100 hover:text-white" : "text-slate-400 hover:text-rose-600"
                                    }`}
                                    title="Remove this PO tab"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inline Quick Add Colorway Form */}
                    {isAddingColor && (
                      <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-blue-600" />
                            Add New Colorway to Style Library
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsAddingColor(false)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Color Name *
                            </label>
                            <input
                              type="text"
                              value={newColorName}
                              onChange={(e) => setNewColorName(e.target.value)}
                              placeholder="e.g. Olive Green, Washed Grey"
                              className={`w-full ${UI_TOKENS.input.base} text-xs`}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Color / Buyer Code (Optional)
                            </label>
                            <input
                              type="text"
                              value={newColorCode}
                              onChange={(e) => setNewColorCode(e.target.value)}
                              placeholder="e.g. CLR-09, #4B5320"
                              className={`w-full ${UI_TOKENS.input.base} text-xs`}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              onClick={handleQuickAddColor}
                              disabled={isSavingEntity || !newColorName.trim()}
                              icon={<Plus className="w-3.5 h-3.5" />}
                            >
                              {isSavingEntity ? "Adding..." : "Save Color"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setIsAddingColor(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline Quick Add Size Scale Form */}
                    {isAddingSize && (
                      <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            Add New Size to Style Scale
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsAddingSize(false)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Size Label / Scale *
                            </label>
                            <input
                              type="text"
                              value={newSizeName}
                              onChange={(e) => setNewSizeName(e.target.value)}
                              placeholder="e.g. 38X32, 3XL, 14Y"
                              className={`w-full ${UI_TOKENS.input.base} text-xs`}
                              autoFocus
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              onClick={handleQuickAddSize}
                              disabled={isSavingEntity || !newSizeName.trim()}
                              icon={<Plus className="w-3.5 h-3.5" />}
                            >
                              {isSavingEntity ? "Adding..." : "Save Size"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setIsAddingSize(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2D Matrix Table for Manual Input */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[170px]">
                                Colorway (Y-Axis)
                              </th>
                              {(selectedStyle.sizes || []).map((s) => (
                                <th
                                  key={s.id}
                                  className="py-2.5 px-2 text-center border-r border-slate-200 min-w-[70px]"
                                >
                                  {s.size_name}
                                </th>
                              ))}
                              <th className="py-2.5 px-3 text-right bg-slate-100/70 min-w-[90px]">
                                Color Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(selectedStyle.colors || []).map((c) => (
                              <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                                <td className="py-2 px-3 font-medium text-slate-800 border-r border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                      style={{
                                        backgroundColor:
                                          c.color_code.startsWith("#") ? c.color_code : "#64748b",
                                      }}
                                    />
                                    <span className="truncate">{c.color_name}</span>
                                  </div>
                                </td>
                                {(selectedStyle.sizes || []).map((s) => {
                                  const val = matrix[c.id!]?.[s.id!] ?? "";
                                  return (
                                    <td key={s.id} className="py-1 px-1.5 text-center border-r border-slate-100">
                                      <input
                                        type="number"
                                        min="0"
                                        value={val}
                                        onChange={(e) =>
                                          handleMatrixChange(c.id!, s.id!, e.target.value)
                                        }
                                        placeholder="0"
                                        className="w-full h-8 text-center font-mono text-xs rounded border border-slate-200 bg-white text-slate-900 focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors"
                                      />
                                    </td>
                                  );
                                })}
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 bg-slate-50/50">
                                  {Number(colorTotals[c.id!] || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[#F8FAFC] font-bold border-t-2 border-slate-200">
                            <tr>
                              <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                                Size Total (Pcs)
                              </td>
                              {(selectedStyle.sizes || []).map((s) => (
                                <td
                                  key={s.id}
                                  className="py-2.5 px-2 text-center font-mono text-slate-800 border-r border-slate-200"
                                >
                                  {Number(sizeTotals[s.id!] || 0).toLocaleString()}
                                </td>
                              ))}
                              <td className="py-2.5 px-3 text-right font-mono text-sm bg-[#EFF6FC] text-[#0066FF]">
                                {matrixBreakdownTotal.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Mathematical Zero-Balance Status Alert for Manual Mode (Conforming to SRS 3.2 & 3.6) */}
                    <div>
                      {manualPos.length > 1 ? (
                        /* Multi-PO Mode Live Balance Alert */
                        <div className={`p-3 rounded-md border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isMasterOrderBalanced
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : unassignedMasterBalance < 0
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : "bg-blue-50 border-blue-200 text-blue-900"
                        }`}>
                          <div className="flex items-center gap-2">
                            {isMasterOrderBalanced ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : unassignedMasterBalance < 0 ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <Layers className="w-4 h-4 text-[#0066FF] shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold">
                                {isMasterOrderBalanced
                                  ? "All POs 100% Balanced with Committed Job Volume!"
                                  : unassignedMasterBalance < 0
                                  ? `Over-Allocation Detected: Combined POs exceed Job Qty by ${Math.abs(unassignedMasterBalance).toLocaleString()} pcs!`
                                  : `Multi-PO Split in Progress: ${unassignedMasterBalance.toLocaleString()} pcs unassigned remaining.`}
                              </span>
                              <span className="block text-[11px] opacity-80 font-mono mt-0.5">
                                Active PO: <strong>{matrixBreakdownTotal.toLocaleString()} pcs</strong> | Combined {manualPos.length} POs:{" "}
                                <strong>{combinedAllPosTotal.toLocaleString()} pcs</strong> / Committed:{" "}
                                <strong>{targetTotalQty.toLocaleString()} pcs</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {targetTotalQty === 0 && combinedAllPosTotal > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    total_order_qty: combinedAllPosTotal,
                                  }))
                                }
                                className="px-2.5 py-1 text-xs font-semibold bg-[#0066FF] text-white rounded hover:bg-[#0052cc] transition-colors cursor-pointer"
                              >
                                Set Job Qty to {combinedAllPosTotal.toLocaleString()} pcs
                              </button>
                            )}
                          </div>
                        </div>
                      ) : targetTotalQty === 0 ? (
                        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-slate-400" />
                            <span>
                              Enter <strong>Total Order Quantity</strong> above, or fill the matrix and click <strong>"Sync Total"</strong>.
                            </span>
                          </div>
                          {matrixBreakdownTotal > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  total_order_qty: matrixBreakdownTotal,
                                }))
                              }
                              className="px-2.5 py-1 text-xs font-semibold bg-[#0066FF] text-white rounded hover:bg-[#0052cc] transition-colors cursor-pointer"
                            >
                              Set Total Qty to {matrixBreakdownTotal.toLocaleString()} pcs
                            </button>
                          )}
                        </div>
                      ) : isZeroBalance ? (
                        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold">
                              Mathematical Validation Passed: Breakdown sum equals Total Order Quantity (100% Balanced).
                            </span>
                          </div>
                          <span className="font-mono font-bold">
                            {matrixBreakdownTotal.toLocaleString()} / {targetTotalQty.toLocaleString()} pcs
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <div>
                              <span className="font-semibold">
                                Mathematical Variance Detected: Matrix total ({matrixBreakdownTotal.toLocaleString()}) does not match Total Order Qty ({targetTotalQty.toLocaleString()})!
                              </span>
                              <span className="block text-[11px] text-rose-700 font-mono mt-0.5">
                                Variance: {qtyVariance > 0 ? `+${qtyVariance}` : qtyVariance} pcs — Matrix breakdown sum must exactly equal Total Order Quantity.
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {matrixBreakdownTotal > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    total_order_qty: matrixBreakdownTotal,
                                  }))
                                }
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-700 text-white rounded hover:bg-rose-800 transition-colors cursor-pointer"
                                title="Update Header Total Order Qty to match current Matrix Breakdown Sum"
                              >
                                Sync Total to Matrix ({matrixBreakdownTotal.toLocaleString()} pcs)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
            )}
          </div>

          {/* Right 1/3 Sidebar */}
          <div className="space-y-4">
            {/* Sidebar Card 1: Order Workflow & Status */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <h3 className={UI_TOKENS.card.title}>Order Workflow & Status</h3>
              </div>

              <div className="space-y-4">
                {/* Order Status */}
                <FormField
                  label="Lifecycle Status"
                  required
                  error={errors.status}
                  helperText="Current milestone in the merchandising pipeline."
                >
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as PurchaseOrderFormData["status"],
                      }))
                    }
                    className={`w-full ${UI_TOKENS.input.select}`}
                  >
                    <option value="Draft">Draft — Initial Data Entry</option>
                    <option value="Confirmed">Confirmed — Ready for Planning</option>
                    <option value="In_Production">In Production — Active on Floor</option>
                    <option value="Shipped">Shipped — Factory Handover</option>
                    <option value="Cancelled">Cancelled — Order Dropped</option>
                    <option value="Closed">Closed — Commercial Finalized</option>
                  </select>
                </FormField>

                {/* Order Type */}
                <FormField
                  label="Order Type"
                  required
                  error={errors.order_type}
                  helperText="Manufacturing volume classification."
                >
                  <select
                    value={formData.order_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order_type: e.target.value as PurchaseOrderFormData["order_type"],
                      }))
                    }
                    className={`w-full ${UI_TOKENS.input.select}`}
                  >
                    <option value="Regular">Regular (Full Commercial Run)</option>
                    <option value="Repeat">Repeat (Re-order of existing style)</option>
                    <option value="Sample">Sample (Salesman / Fit sample)</option>
                    <option value="Promo">Promo (Promotional capsule run)</option>
                    <option value="Test">Test (Fabric / Washing pilot)</option>
                  </select>
                </FormField>

                {/* Active Toggle */}
                <div className="pt-3 border-t border-slate-100">
                  <Toggle
                    label="Operational Active"
                    description="Active orders appear in production planning, BOM allocation, and cut orders."
                    checked={formData.is_active}
                    onChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Card 2: Official Buyer PO Document Attachment */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0066FF]" />
                  <h3 className={UI_TOKENS.card.title}>Attached Buyer PO Sheet</h3>
                </div>
              </div>

              <div className="space-y-3">
                {formData.po_document_url ? (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-xs shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                          {formData.po_document_name || "Buyer_PO_Sheet"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            po_document_url: null,
                            po_document_name: null,
                            po_document_size: null,
                          }))
                        }
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsPreviewOpen(true)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Preview Document
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 hover:border-[#0066FF] hover:bg-blue-50/40 transition-all rounded-lg p-4 text-center group cursor-pointer shadow-2xs">
                    <input
                      type="file"
                      ref={docInputRef}
                      accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                      onChange={handleDocUpload}
                      className="hidden"
                      disabled={isUploadingDoc}
                    />
                    <div
                      onClick={() => docInputRef.current?.click()}
                      className="space-y-1"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-[#0066FF] transition-colors">
                        {isUploadingDoc ? "Uploading document..." : "Click to attach Buyer PO file"}
                      </p>
                      <p className="text-[10.5px] text-slate-400">
                        Supports PDF, Excel, Scan (Max 25MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Card 3: Logistics & Production Notes */}
            <div className={UI_TOKENS.card.base}>
              <div className={UI_TOKENS.card.header}>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0066FF]" />
                  <h3 className={UI_TOKENS.card.title}>Logistics & Instructions</h3>
                </div>
              </div>

              <div className="space-y-3">
                <FormField
                  label="Delivery Destination Port"
                  error={errors.delivery_destination}
                  helperText="Sea/Air destination port or DC hub."
                >
                  <TextInput
                    value={formData.delivery_destination || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, delivery_destination: e.target.value }))
                    }
                    placeholder="e.g. Rotterdam, Hamburg, Los Angeles"
                  />
                </FormField>

                <FormField
                  label="Payment Terms"
                  helperText="L/C, TT or open account terms."
                >
                  <TextInput
                    value={formData.payment_terms || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, payment_terms: e.target.value }))
                    }
                    placeholder="e.g. LC at Sight 90 Days"
                  />
                </FormField>

                <FormField
                  label="Production Remarks"
                  helperText="Special washing, packing ratio, or barcode notes."
                >
                  <textarea
                    rows={3}
                    value={formData.remarks || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    placeholder="Enter ratio packing, special carton labeling, or finishing instructions..."
                    className={UI_TOKENS.input.base}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Document Preview Modal */}
      {isPreviewOpen && formData.po_document_url && (
        <TechPackPreviewModal
          isOpen={isPreviewOpen}
          fileUrl={formData.po_document_url}
          fileName={formData.po_document_name || "PO_Document"}
          fileSize={formData.po_document_size || undefined}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};
