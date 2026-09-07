/**
 * TraceFlow RMG — Centralized Design Tokens
 * Strictly follows docs/04_Frontend_Developer/Design_System_Tokens.md
 * and AGENTS.md UI/UX Engineering Rules.
 * 
 * Gradient buttons are strictly prohibited.
 * Only flat, solid, high-contrast, enterprise-grade tokens are defined here.
 */

export const UI_TOKENS = {
  typography: {
    fontFamily: "'Inter', sans-serif",
    sizes: {
      xs: "text-xs", // 12px
      sm: "text-sm", // 14px (base)
      base: "text-sm",
      lg: "text-lg", // 18px (card title)
      xl: "text-xl",
      "2xl": "text-2xl font-bold text-slate-900 tracking-tight", // 24px
    },
  },
  colors: {
    bg: {
      app: "bg-slate-50",
      card: "bg-white",
      tableHeader: "bg-slate-100",
      subtle: "bg-slate-50",
    },
    text: {
      primary: "text-slate-900",
      secondary: "text-slate-600",
      muted: "text-slate-500",
      disabled: "text-slate-400",
    },
    border: "border-slate-200",
  },
  button: {
    base: "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-md px-3.5 py-2 cursor-pointer",
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 shadow-xs",
    secondary: "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 focus:ring-slate-400 shadow-2xs",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-xs",
    success: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white focus:ring-emerald-500 shadow-xs",
    icon: "p-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer",
    tableAction: "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer",
  },
  badge: {
    base: "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
    neutral: "bg-slate-100 text-slate-800 border border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  input: {
    base: "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
    select: "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
    readonly: "bg-slate-100 border-slate-200 text-slate-600 font-mono text-xs cursor-not-allowed",
    error: "border-red-500 focus:border-red-500 focus:ring-red-500",
  },
  filter: {
    container: "bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3 mb-4",
    subline: "flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500",
  },
  table: {
    container: "w-full bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden",
    table: "w-full text-left border-collapse text-sm",
    thead: "bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider",
    th: "px-4 py-3.5",
    tbody: "divide-y divide-slate-100 bg-white",
    tr: "hover:bg-slate-50/75 transition-colors",
    trAlt: "even:bg-slate-50/40",
    td: "px-4 py-3 text-slate-700 align-middle",
    footer: "flex flex-wrap items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600",
  },
  card: {
    base: "bg-white border border-slate-200 rounded-lg p-5 shadow-2xs",
    header: "flex items-center justify-between border-b border-slate-100 pb-3 mb-4",
    title: "text-base font-semibold text-slate-900",
  },
} as const;
