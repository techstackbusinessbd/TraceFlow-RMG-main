import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure worker using unpkg CDN matching pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface TechPackPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
  fileSize?: number | null;
  styleCode?: string;
}

export const TechPackPreviewModal: React.FC<TechPackPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName = "Tech-Pack Document",
  fileSize,
  styleCode,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [canvasNode, setCanvasNode] = useState<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const isPdf =
    fileUrl.toLowerCase().endsWith(".pdf") || fileName.toLowerCase().endsWith(".pdf");
  const isImage =
    fileUrl.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/) ||
    fileName.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Load PDF Document via PDF.js as ArrayBuffer to bypass IDM interception
  useEffect(() => {
    if (!isOpen || !fileUrl || !isPdf) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentPage(1);
    setScale(1.1);
    setRotation(0);
    setPdfDoc(null);

    const loadPdf = async () => {
      try {
        // Route through stream-techpack endpoint if stored in public/storage/techpacks to guarantee CORS
        let fetchUrl = fileUrl;
        if (fileUrl.includes('/storage/techpacks/')) {
          const filename = fileUrl.split('/storage/techpacks/').pop();
          if (filename) {
            const apiBase = fileUrl.startsWith('http') ? new URL(fileUrl).origin : '';
            fetchUrl = `${apiBase}/api/v1/styles/stream-techpack/${filename}`;
          }
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to load document (${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("PDF.js load error:", err);
        setErrorMsg(err.message || "Failed to render PDF specification.");
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fileUrl, isPdf]);

  // Render current page to HTML5 Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasNode || !isPdf) return;

    let cancelRender = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        if (cancelRender) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasNode;
        const context = canvas.getContext("2d");

        if (!context) return;

        // Support crisp rendering on high-DPI displays
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("PDF render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      cancelRender = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, canvasNode, currentPage, scale, rotation, isPdf]);

  if (!isOpen || !fileUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-2xl ring-1 ring-slate-900/10 border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0 font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 truncate max-w-md" title={fileName}>
                  {fileName}
                </h3>
                {styleCode && (
                  <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold shrink-0">
                    {styleCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB • ` : ""}
                Interactive Tech-Pack Document Inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="Open full document in external tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Open Tab</span>
            </a>

            <a
              href={fileUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Navigation & Zoom Controls Toolbar */}
        {isPdf && !isLoading && !errorMsg && numPages > 0 && (
          <div className="px-5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0 select-none">
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200">
                Page {currentPage} of {numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom & Rotation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))))}
                className="p-1 rounded hover:bg-slate-200 cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <span className="font-mono text-[11px] w-12 text-center text-slate-600 font-semibold">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
                className="p-1 rounded hover:bg-slate-200 cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 rounded hover:bg-slate-200 cursor-pointer transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: Document Viewer Canvas */}
        <div className="flex-1 bg-slate-200/80 relative overflow-auto p-4 md:p-6 flex flex-col items-center">
          {isPdf ? (
            <>
              {isLoading && (
                <div className="flex flex-col items-center gap-2 text-slate-500 my-auto py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0066FF]" />
                  <p className="text-xs font-medium">Rendering PDF Specification...</p>
                </div>
              )}

              {errorMsg && (
                <div className="p-6 text-center max-w-sm bg-white rounded-lg border border-rose-200 shadow-xs my-auto">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-800">Could Not Preview PDF</h4>
                  <p className="text-[11px] text-slate-500 mt-1 mb-4 leading-relaxed">{errorMsg}</p>
                  <a
                    href={fileUrl}
                    download={fileName}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0066FF] text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File Directly</span>
                  </a>
                </div>
              )}

              {!errorMsg && (
                <div className="m-auto block">
                  <canvas
                    ref={setCanvasNode}
                    className="bg-white shadow-xl rounded-sm ring-1 ring-slate-900/10 block"
                  />
                </div>
              )}
            </>
          ) : isImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-md shadow-md border border-slate-200 bg-white"
              />
            </div>
          ) : (
            <div className="p-8 text-center max-w-sm bg-white rounded-lg border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Preview Not Supported in Browser</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                This document format (e.g. XLSX, DOCX, ZIP) cannot be directly rendered inside the browser frame.
              </p>
              <a
                href={fileUrl}
                download={fileName}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066FF] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download File Directly</span>
              </a>
            </div>
          )}
        </div>

        {/* Sleek Modal Footer */}
        <div className="px-5 py-2 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700">ESC</kbd> to close viewer
          </span>
          <span>TraceFlow RMG Secure Document Delivery</span>
        </div>
      </div>
    </div>
  );
};
