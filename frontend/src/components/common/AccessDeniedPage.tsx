import React from "react";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "./Button";
import { UI_TOKENS } from "../../config/designTokens";

interface AccessDeniedPageProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
  requiredPermission?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  currentPath,
  onNavigate,
  requiredPermission,
}) => {
  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-200 shadow-xs">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>

        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded mb-2">
          HTTP 403 — Forbidden / Access Denied
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Unauthorized Access
        </h1>

        <p className="text-sm text-slate-600 max-w-md mb-2">
          You do not have the required administrative role or security permissions to access this page
          {currentPath && (
            <> (<code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-xs">{currentPath}</code>)</>
          )}.
        </p>

        {requiredPermission && (
          <p className="text-xs text-slate-400 font-mono mb-6">
            Required Permission: <span className="text-slate-600">{requiredPermission}</span>
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            icon={<Home className="w-4 h-4" />}
            onClick={() => onNavigate("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
