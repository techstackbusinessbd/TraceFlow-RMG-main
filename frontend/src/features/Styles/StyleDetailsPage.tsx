import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Scissors,
  Palette,
  Layers,
  Building2,
  Calendar,
  Sparkles,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Toast } from "../../components/common/Toast";
import { TechPackPreviewModal } from "../../components/common/TechPackPreviewModal";
import { UI_TOKENS } from "../../config/designTokens";
import { getStyleById, toggleStyleStatus, type WovenStyle } from "../../services/styleService";
import { useAuthStore } from "../../store/authStore";

interface StyleDetailsPageProps {
  styleId: string | number;
  onNavigate: (path: string) => void;
}

export const StyleDetailsPage: React.FC<StyleDetailsPageProps> = ({ styleId, onNavigate }) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canEdit = hasRole("superadmin") || hasPermission("master_data.styles.profile.update");

  const [style, setStyle] = useState<WovenStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [isTechPackModalOpen, setIsTechPackModalOpen] = useState(false);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchStyle = async () => {
      setIsLoading(true);
      try {
        const data = await getStyleById(styleId);
        setStyle(data);
      } catch {
        showToast("error", "Not Found", "Could not load style profile.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStyle();
  }, [styleId]);

  const handleToggleStatus = async () => {
    if (!style) return;
    try {
      const res = await toggleStyleStatus(style.uuid || style.id);
      setStyle((prev) => (prev ? { ...prev, is_active: res.data.is_active } : null));
      showToast("success", "Status Updated", res.message);
    } catch {
      showToast("error", "Error", "Failed to update status.");
    }
  };

  if (isLoading) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            <span>Loading Style Profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!style) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-4">Style profile could not be found.</p>
          <Button variant="secondary" onClick={() => onNavigate("/master/styles")}>
            Back to Style Library
          </Button>
        </div>
      </div>
    );
  }

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
        title={style.style_name}
        badgeLabel="Style Code"
        badgeCount={style.code}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/master/styles")}
            >
              Back to Library
            </Button>
            {canEdit && (
              <>
                <Button variant="secondary" onClick={handleToggleStatus}>
                  {style.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="primary"
                  icon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => onNavigate(`/master/styles/${style.uuid || style.id}/edit`)}
                >
                  Edit Style
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Tier 2: 2-Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2/3 Main Information Canvas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1: Core Identity */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Garment Identification & Specifications</h2>
              </div>
              <Badge variant={style.is_active ? "success" : "danger"}>
                {style.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">System Style Code</p>
                <Badge variant="code">{style.code}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Buyer Official Style No</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{style.buyer_style_no}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Commercial Style Name</p>
                <p className="text-sm font-semibold text-slate-800">{style.style_name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Woven Category</p>
                <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {style.product_category}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Garment Item</p>
                <p className="text-sm text-slate-800">{style.garment_item}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fabric Construction</p>
                <p className="text-sm font-medium text-slate-800">{style.fabric_type}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Industrial Wash Process</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {style.wash_type ? (
                    style.wash_type.split(",").map((wt, i) => (
                      <Badge key={i} variant="info">{wt.trim()}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None / Raw</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Target Season</p>
                <div className="flex items-center gap-1.5 text-sm text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{style.season}</span>
                </div>
              </div>
            </div>

            {style.description && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Styling Details & Workmanship</p>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{style.description}</p>
              </div>
            )}
          </div>

          {/* Card 2: Colorways Grid */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Approved Colorways ({(style.colors || []).length})</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(style.colors || []).map((color) => (
                <div key={color.id} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded-md">
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: color.hex_code || "#1f2937" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{color.color_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {color.color_code} {color.pantone_ref ? `• ${color.pantone_ref}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Size Scale Matrix */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Size Scale Breakdown ({(style.sizes || []).length})</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(style.sizes || []).map((sz) => (
                <span
                  key={sz.id}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-md shadow-2xs font-mono text-xs font-semibold text-slate-800"
                >
                  {sz.size_name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1/3 Summary Sidebar */}
        <div className="space-y-4">
          {/* Sidebar Card 1: Production Metrics & IE */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Industrial Engineering (IE)</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Base SMV (SAM):</span>
                <span className="font-mono text-base font-bold text-[#0066FF]">{Number(style.base_smv).toFixed(2)} min</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Lifecycle Status:</span>
                <Badge variant={style.status === "Bulk_Approved" ? "success" : "neutral"}>
                  {style.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hourly Target (100%):</span>
                <span className="font-mono font-semibold text-slate-800">
                  {style.base_smv && Number(style.base_smv) > 0
                    ? `${Math.round(60 / Number(style.base_smv))} Pcs / Line Op`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Card 2: Client & Entity Context */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Commercial Client</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Buyer Legal Entity:</span>
                <button
                  type="button"
                  onClick={() => onNavigate(`/master/buyers/${style.buyer?.uuid || style.buyer?.id}`)}
                  className="font-semibold text-[#0066FF] hover:underline cursor-pointer"
                >
                  {style.buyer?.name}
                </button>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Buyer Code:</span>
                <Badge variant="code">{style.buyer?.code || "—"}</Badge>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Buyer Country:</span>
                <span className="font-medium text-slate-800">{style.buyer?.country || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Manufacturing Company:</span>
                <span className="font-mono font-semibold text-slate-800">{style.company?.code}</span>
              </div>
            </div>
          </div>

          {/* Sidebar Card 3: Tech-Pack Specification Document */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Tech-Pack Document</h2>
              </div>
              {style.techpack_file_url ? (
                <Badge variant="success">Attached</Badge>
              ) : (
                <Badge variant="neutral">Not Attached</Badge>
              )}
            </div>

            {style.techpack_file_url ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate" title={style.techpack_file_name || "Tech-Pack Spec"}>
                      {style.techpack_file_name || "Tech-Pack Spec"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {style.techpack_file_size
                        ? `${(style.techpack_file_size / (1024 * 1024)).toFixed(2)} MB`
                        : "Uploaded Document"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTechPackModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0066FF] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Tech-Pack
                  </button>

                  <a
                    href={style.techpack_file_url}
                    download={style.techpack_file_name || "techpack.pdf"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                    title="Direct Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
                <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-600">No Tech-Pack Attached</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tech-Pack spec was not uploaded for this style (optional).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enterprise Tech-Pack PDF / Document Inspector Modal */}
      {style?.techpack_file_url && (
        <TechPackPreviewModal
          isOpen={isTechPackModalOpen}
          onClose={() => setIsTechPackModalOpen(false)}
          fileUrl={style.techpack_file_url}
          fileName={style.techpack_file_name || "Style_Tech_Pack"}
          fileSize={style.techpack_file_size}
          styleCode={style.code}
        />
      )}
    </div>
  );
};
