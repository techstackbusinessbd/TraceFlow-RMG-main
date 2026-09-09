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
} from "lucide-react";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
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
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-slate-900 mb-4" />
        <p className="text-sm text-slate-500">Loading buying agent profile...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm mb-4">
          {error || "Buying agent profile not found."}
        </div>
        <Button variant="secondary" onClick={() => onNavigate("/master/agents")}>
          Back to Agents Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => onNavigate("/master/agents")}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{agent.name}</h1>
              <Badge variant="code">{agent.code}</Badge>
              <Badge variant={agent.is_active ? "success" : "danger"}>
                {agent.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Company: {agent.company?.name || "Platform Owner"} ({agent.company?.code || "PLT"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="primary"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => onNavigate(`/master/agents/${agent.id}/edit`)}
            >
              Edit Agent
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Details & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left 2 Columns: Core Profile Information */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Corporate Details
            </h2>

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
                <span className="text-slate-400 block mb-0.5">Company Affiliation</span>
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
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Contact & Liaison Office
            </h2>

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
                    <a href={`mailto:${agent.email}`} className="text-blue-600 hover:underline">
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
        <div className="space-y-5">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
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
                    className="p-3 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-colors"
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
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                No buyers are currently registered via this agent.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
