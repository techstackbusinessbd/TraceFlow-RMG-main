import React from "react";
import {
  Shirt,
  Scissors,
  Layers,
  CheckCircle2,
  TrendingUp,
  Download,
  Activity,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { UI_TOKENS } from "../../config/designTokens";
import { useAuthStore } from "../../store/authStore";

interface LineStatus {
  line: string;
  floor: string;
  buyer: string;
  style: string;
  target: number;
  actual: number;
  efficiency: number;
  status: "Normal" | "Warning" | "Critical";
}

const RUNNING_LINES: LineStatus[] = [
  { line: "Line 01", floor: "Floor 2", buyer: "H&M Hennes & Mauritz", style: "AWL-STY-2026-001 (Polo Shirt)", target: 1200, actual: 1180, efficiency: 84.2, status: "Normal" },
  { line: "Line 02", floor: "Floor 2", buyer: "Zara (Inditex Group)", style: "AWL-STY-2026-004 (Slim Trouser)", target: 1000, actual: 950, efficiency: 79.5, status: "Normal" },
  { line: "Line 03", floor: "Floor 3", buyer: "Marks & Spencer (M&S)", style: "AWL-STY-2026-002 (Formal Shirt)", target: 1400, actual: 1210, efficiency: 68.0, status: "Warning" },
  { line: "Line 04", floor: "Floor 3", buyer: "PVH Corp (Tommy Hilfiger)", style: "AWL-STY-2026-005 (Denim Jacket)", target: 800, actual: 790, efficiency: 82.1, status: "Normal" },
  { line: "Line 05", floor: "Floor 4", buyer: "Next Retail Ltd", style: "AWL-STY-2026-003 (Basic Chino)", target: 1100, actual: 860, efficiency: 59.4, status: "Critical" },
];

export const ExecutiveDashboard: React.FC = () => {
  const { canAccessWidget } = useAuthStore();

  // Granular widget permissions
  const canViewOrders = canAccessWidget(
    ["merchandising.styles.view", "orders.pos.view", "master_data.styles.profile.view"],
    ["superadmin", "admin", "merchandiser", "standarduser"]
  );
  const canViewCutting = canAccessWidget(
    ["cutting.bundles.view", "cutting.planning.view", "cutting.*"],
    ["superadmin", "admin", "cutting_manager"]
  );
  const canViewSewing = canAccessWidget(
    ["sewing.lines.view", "sewing.tracking.view", "master_data.lines.setup.view"],
    ["superadmin", "admin", "floor_supervisor", "production_manager", "standarduser"]
  );
  const canViewQuality = canAccessWidget(
    ["quality.inspections.view", "qc.*", "quality.*"],
    ["superadmin", "admin", "qc_auditor", "qc_manager"]
  );
  const canViewAlerts = canAccessWidget(
    ["sewing.lines.view", "quality.inspections.view", "master_data.lines.setup.view"],
    ["superadmin", "admin", "floor_supervisor", "qc_auditor", "standarduser"]
  );
  const canViewQuickLinks = canAccessWidget(
    ["master.buyers.view", "master_data.buyers.profile.view", "master_data.buyers.*"],
    ["superadmin", "admin", "merchandiser", "standarduser"]
  );

  const visibleCardsCount = [canViewOrders, canViewCutting, canViewSewing, canViewQuality].filter(Boolean).length;
  const hasLeftSection = canViewSewing;
  const hasRightSection = canViewAlerts || canViewQuickLinks;
  const hasAnyBottomSection = hasLeftSection || hasRightSection;

  const getMetricsGridClass = () => {
    if (visibleCardsCount === 1) return "grid grid-cols-1 max-w-sm gap-3.5";
    if (visibleCardsCount === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-3.5";
    if (visibleCardsCount === 3) return "grid grid-cols-1 sm:grid-cols-3 gap-3.5";
    return UI_TOKENS.dashboard.metricsGrid;
  };

  return (
    <div className="space-y-4">
      {/* Tier 1: Page Header */}
      <PageHeader
        title="Executive Dashboard"
        badgeCount="Live"
        badgeLabel="Operations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>
              Export KPI
            </Button>
            <Button variant="primary" icon={<Activity className="h-3.5 w-3.5" />}>
              Live Feed
            </Button>
          </div>
        }
      />

      {/* KPI Top Metrics Grid - Completely hidden if no cards permitted */}
      {visibleCardsCount > 0 && (
        <div className={getMetricsGridClass()}>
          {/* Metric 1: Orders (Merchandising) */}
          {canViewOrders && (
            <div className={UI_TOKENS.dashboard.metricCard}>
              <div className={UI_TOKENS.dashboard.metricTop}>
                <span className={UI_TOKENS.dashboard.metricLabel}>Running Orders</span>
                <div className={UI_TOKENS.dashboard.metricIconBox}>
                  <Shirt className="w-4 h-4 text-[#0066FF]" />
                </div>
              </div>
              <div>
                <div className={UI_TOKENS.dashboard.metricValue}>48 Styles</div>
                <div className={UI_TOKENS.dashboard.metricSubtext}>
                  <Badge variant="success">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +8.4%
                  </Badge>
                  <span>Across 6 Global Buyers</span>
                </div>
              </div>
            </div>
          )}

          {/* Metric 2: Cutting Output */}
          {canViewCutting && (
            <div className={UI_TOKENS.dashboard.metricCard}>
              <div className={UI_TOKENS.dashboard.metricTop}>
                <span className={UI_TOKENS.dashboard.metricLabel}>Today's Cutting Output</span>
                <div className={UI_TOKENS.dashboard.metricIconBox}>
                  <Scissors className="w-4 h-4 text-[#0066FF]" />
                </div>
              </div>
              <div>
                <div className={UI_TOKENS.dashboard.metricValue}>24,850 Pcs</div>
                <div className={UI_TOKENS.dashboard.metricSubtext}>
                  <Badge variant="success">113%</Badge>
                  <span>Target: 22,000 Pcs</span>
                </div>
              </div>
            </div>
          )}

          {/* Metric 3: Sewing Line Efficiency */}
          {canViewSewing && (
            <div className={UI_TOKENS.dashboard.metricCard}>
              <div className={UI_TOKENS.dashboard.metricTop}>
                <span className={UI_TOKENS.dashboard.metricLabel}>Sewing Line Efficiency</span>
                <div className={UI_TOKENS.dashboard.metricIconBox}>
                  <Layers className="w-4 h-4 text-[#0066FF]" />
                </div>
              </div>
              <div>
                <div className={UI_TOKENS.dashboard.metricValue}>78.6% Avg</div>
                <div className={UI_TOKENS.dashboard.metricSubtext}>
                  <Badge variant="info">18 Lines</Badge>
                  <span>Floor 2, 3 & 4 Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Metric 4: Quality & Audit */}
          {canViewQuality && (
            <div className={UI_TOKENS.dashboard.metricCard}>
              <div className={UI_TOKENS.dashboard.metricTop}>
                <span className={UI_TOKENS.dashboard.metricLabel}>Quality DHU Audit</span>
                <div className={UI_TOKENS.dashboard.metricIconBox}>
                  <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                </div>
              </div>
              <div>
                <div className={UI_TOKENS.dashboard.metricValue}>98.8% Pass</div>
                <div className={UI_TOKENS.dashboard.metricSubtext}>
                  <Badge variant="success">A-Grade</Badge>
                  <span>ASTM 4-Point Compliant</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Floor Status Grid - Completely hidden if no bottom widgets permitted */}
      {hasAnyBottomSection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Left: Active Sewing Lines Status */}
          {hasLeftSection && (
            <div className={hasRightSection ? "lg:col-span-2 space-y-3.5" : "lg:col-span-3 space-y-3.5"}>
              <div className={UI_TOKENS.dashboard.panelCard}>
                <div className={UI_TOKENS.dashboard.panelHeader}>
                  <h3 className={UI_TOKENS.dashboard.panelTitle}>
                    <Activity className="w-4 h-4 text-[#0066FF]" />
                    Real-Time Sewing Lines Performance
                  </h3>
                  <span className="text-[11px] text-slate-400">Updated 2 mins ago</span>
                </div>

                <div className="overflow-x-auto">
                  <table className={UI_TOKENS.table.table}>
                    <thead className={UI_TOKENS.table.thead}>
                      <tr>
                        <th className={UI_TOKENS.table.th}>Line / Floor</th>
                        <th className={UI_TOKENS.table.th}>Buyer & Style</th>
                        <th className={UI_TOKENS.table.th}>Target</th>
                        <th className={UI_TOKENS.table.th}>Actual</th>
                        <th className={UI_TOKENS.table.th}>Efficiency</th>
                        <th className={UI_TOKENS.table.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody className={UI_TOKENS.table.tbody}>
                      {RUNNING_LINES.map((row) => (
                        <tr key={row.line} className={UI_TOKENS.table.tr}>
                          <td className={UI_TOKENS.table.td}>
                            <span className="font-semibold text-slate-900 block">{row.line}</span>
                            <span className="text-[11px] text-slate-400">{row.floor}</span>
                          </td>
                          <td className={UI_TOKENS.table.td}>
                            <span className="font-medium text-slate-800 block">{row.buyer}</span>
                            <span className="text-[11px] text-slate-500">{row.style}</span>
                          </td>
                          <td className={UI_TOKENS.table.td}>{row.target.toLocaleString()}</td>
                          <td className={UI_TOKENS.table.td}>
                            <span className="font-semibold text-slate-900">{row.actual.toLocaleString()}</span>
                          </td>
                          <td className={UI_TOKENS.table.td}>
                            <span
                              className={`font-semibold ${
                                row.efficiency >= 75
                                  ? "text-emerald-600"
                                  : row.efficiency >= 65
                                  ? "text-amber-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {row.efficiency}%
                            </span>
                          </td>
                          <td className={UI_TOKENS.table.td}>
                            {row.status === "Normal" && <Badge variant="success">Normal</Badge>}
                            {row.status === "Warning" && <Badge variant="warning">Warning</Badge>}
                            {row.status === "Critical" && <Badge variant="danger">Critical</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Right: Operational Alerts & Traceability Highlights */}
          {hasRightSection && (
            <div className={hasLeftSection ? "space-y-3.5" : "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3.5 space-y-0"}>
              {canViewAlerts && (
                <div className={UI_TOKENS.dashboard.panelCard}>
                  <div className={UI_TOKENS.dashboard.panelHeader}>
                    <h3 className={UI_TOKENS.dashboard.panelTitle}>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Floor Critical Alerts
                    </h3>
                    <Badge variant="warning">2 Actionable</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md text-xs space-y-1">
                      <div className="font-semibold text-amber-900 flex items-center justify-between">
                        <span>Sewing Line 05 Bottleneck</span>
                        <span className="text-[10px] text-amber-700">14m ago</span>
                      </div>
                      <p className="text-amber-800 text-[11px]">
                        Output 59.4% below 70% threshold. Collar attach machine breakdown reported on Floor 4.
                      </p>
                    </div>

                    <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-md text-xs space-y-1">
                      <div className="font-semibold text-rose-900 flex items-center justify-between">
                        <span>Fabric Roll Shade Variation</span>
                        <span className="text-[10px] text-rose-700">32m ago</span>
                      </div>
                      <p className="text-rose-800 text-[11px]">
                        Roll <span className="font-mono font-semibold">AWL-ROL-0092</span> flagged for shade band deviation during ASTM 4-Point audit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {canViewQuickLinks && (
                <div className={UI_TOKENS.dashboard.panelCard}>
                  <div className={UI_TOKENS.dashboard.panelHeader}>
                    <h3 className={UI_TOKENS.dashboard.panelTitle}>
                      <ArrowUpRight className="w-4 h-4 text-[#0066FF]" />
                      Direct Navigation
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, "", "/master/buyers");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-[#0066FF] transition-colors border border-slate-100 cursor-pointer"
                    >
                      <span>View Registered Buyers & Brands</span>
                      <span className="font-mono text-slate-400">→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Graceful Fallback if User has no active widgets assigned */}
      {visibleCardsCount === 0 && !hasAnyBottomSection && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-slate-200/90 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#0066FF] mb-3 border border-blue-100">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Welcome to TraceFlow RMG
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            You are logged in, but there are currently no operational KPI widgets or floor feeds assigned to your role permissions.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Role-Based Dashboard Active</Badge>
          </div>
        </div>
      )}
    </div>
  );
};
