import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Mail,
  MapPin,
  Phone,
  User,
  Percent,
  Layers,
  Building2,
  RefreshCw,
  Globe,
  Calendar,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { UI_TOKENS } from "../../config/designTokens";
import { getAgentById, type Agent } from "../../services/agentService";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { useAuthStore } from "../../store/authStore";

interface AgentDetailsPageProps {
  agentId: string | number;
  onNavigate: (path: string) => void;
}

export const AgentDetailsPage: React.FC<AgentDetailsPageProps> = ({
  agentId,
  onNavigate,
}) => {
  const { hasRole, hasPermission } = useAuthStore();
  const canEdit = hasRole("superadmin") || hasPermission("master_data.agents.profile.update");

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAgentById(agentId);
        setAgent(data);
      } catch {
        setError("Could not load buying agent details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [agentId]);

  if (loading) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading buying agent profile...
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className={UI_TOKENS.appLayout.mainContent}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Building2 className="w-10 h-10 text-slate-300" />
          <p className="text-sm text-slate-600">{error || "Buying agent profile not found."}</p>
          <Button variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onNavigate("/master/agents")}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      {/* Tier 1: Page Header */}
      <PageHeader
        title={agent.name}
        badgeCount={agent.code}
        badgeLabel="Agent Code"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => onNavigate("/master/agents")}
            >
              Back to Directory
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                icon={<Edit2 className="h-3.5 w-3.5" />}
                onClick={() => onNavigate(`/master/agents/${agent.uuid || agent.id}/edit`)}
              >
                Edit Agent
              </Button>
            )}
          </div>
        }
      />

      {/* Grid: 2/3 Main Canvas + 1/3 Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Core Profile Information */}
        <div className="lg:col-span-2 space-y-4">
          {/* Corporate Details */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Corporate Identity</h2>
              </div>
              <Badge variant={agent.is_active ? "success" : "danger"}>
                {agent.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Agent Code</p>
                <Badge variant="code">{agent.code}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Agent Legal Name</p>
                <p className="text-sm font-bold text-slate-900">{agent.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Headquarter Country
                </p>
                <p className="text-sm font-medium text-slate-800">{agent.country}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Company</p>
                <div className="mt-0.5">
                  <Badge variant="neutral">{agent.company?.name || "Platform Unit"} ({agent.company?.code || "PLT"})</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Agency Commission Rate</p>
                {agent.commission_rate !== null && agent.commission_rate !== undefined ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Percent className="w-3 h-3" />
                    {Number(agent.commission_rate).toFixed(2)}% FOB
                  </span>
                ) : (
                  <p className="text-sm text-slate-400">Standard / None</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Registered On
                </p>
                <p className="text-sm text-slate-700">{formatDate(agent.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Contact & Liaison Office */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Contact & Liaison Office</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3 h-3" /> Contact Person
                </p>
                <p className="text-sm font-medium text-slate-800">{agent.contact_person || <span className="text-slate-400">Not provided</span>}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Official Email
                </p>
                {agent.email ? (
                  <a href={`mailto:${agent.email}`} className="text-sm text-[#0066FF] hover:underline font-medium block truncate">
                    {agent.email}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">Not provided</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone Number
                </p>
                <p className="text-sm font-mono text-slate-800">
                  {agent.phone ? formatPhoneNumber(agent.phone) : <span className="text-slate-400 font-sans">Not provided</span>}
                </p>
              </div>

              <div className="md:col-span-2 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Office Address
                </p>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  {agent.address || <span className="text-slate-400">No office address registered.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Summary & Linked Buyers */}
        <div className="space-y-4">
          {/* Operational Summary */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Operational Summary</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Operational Status</span>
                <Badge variant={agent.is_active ? "success" : "danger"}>
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Commission Rate</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {agent.commission_rate !== null && agent.commission_rate !== undefined
                    ? `${Number(agent.commission_rate).toFixed(2)}%`
                    : "0.00%"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-600">Linked Buyers</span>
                <Badge variant="neutral">{agent.buyers?.length || 0} Buyers</Badge>
              </div>
            </div>
          </div>

          {/* Linked Buyers Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0066FF]" />
                <h2 className={UI_TOKENS.card.title}>Linked Buyers</h2>
              </div>
              <Badge variant="neutral">
                {agent.buyers?.length || 0}
              </Badge>
            </div>

            {agent.buyers && agent.buyers.length > 0 ? (
              <div className="space-y-2">
                {agent.buyers.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onNavigate(`/master/buyers/${b.id}`)}
                    className="p-2.5 border border-slate-200 rounded-md hover:border-[#0066FF] hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-700">{b.code}</span>
                      <Badge variant={b.is_active ? "success" : "danger"}>
                        {b.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-xs font-semibold text-slate-900">{b.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{b.country}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                No buyers are currently registered via this agent.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

