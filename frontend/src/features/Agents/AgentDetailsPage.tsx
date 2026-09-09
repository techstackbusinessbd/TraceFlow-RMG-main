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
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { UI_TOKENS } from "../../config/designTokens";
import { getAgentById, type Agent } from "../../services/agentService";
import { useAuthStore } from "../../store/authStore";

interface AgentDetailsPageProps {
  agentId: number;
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
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

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
              Back to List
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                icon={<Edit2 className="h-3.5 w-3.5" />}
                onClick={() => onNavigate(`/master/agents/${agent.id}/edit`)}
              >
                Edit Agent
              </Button>
            )}
          </div>
        }
      />

      {/* Grid: Details & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Core Profile Information */}
        <div className="lg:col-span-2 space-y-4">
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Corporate Details</h2>
              <Badge variant={agent.is_active ? "success" : "danger"}>
                {agent.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Agent Legal Name</span>
                <span className="font-semibold text-slate-800">{agent.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Headquarter Country</span>
                <span className="font-semibold text-slate-800">{agent.country}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Company</span>
                <div className="mt-0.5">
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {agent.company?.code || "PLT"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Agency Commission Rate</span>
                {agent.commission_rate !== null && agent.commission_rate !== undefined ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                    <Percent className="w-3 h-3" />
                    {Number(agent.commission_rate).toFixed(2)}% FOB
                  </span>
                ) : (
                  <span className="text-slate-400">Standard / None</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={UI_TOKENS.card.title}>Contact & Liaison Office</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block">Key Contact Person</span>
                  <span className="font-medium text-slate-800">{agent.contact_person || "—"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block">Official Email</span>
                  {agent.email ? (
                    <a href={`mailto:${agent.email}`} className="text-[#0066FF] hover:underline">
                      {agent.email}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block">Hotline / Mobile</span>
                  <span className="font-mono">{agent.phone || "—"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block">Office Address</span>
                  <span>{agent.address || "No office address registered."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Associated Buyers Under This Agent */}
        <div className="space-y-4">
          <div className={UI_TOKENS.card.base}>
            <div className={UI_TOKENS.card.header}>
              <h2 className={`${UI_TOKENS.card.title} flex items-center gap-2`}>
                <Layers className="w-4 h-4 text-slate-500" />
                Linked Buyers
              </h2>
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
                    className="p-3 border border-slate-200 rounded-md hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-slate-700">{b.code}</span>
                      <Badge variant={b.is_active ? "success" : "danger"}>
                        {b.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{b.name}</div>
                    <div className="text-xs text-slate-500">{b.country}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-md text-center text-xs text-slate-500">
                No buyers are currently registered via this agent.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
