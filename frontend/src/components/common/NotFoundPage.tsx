import React from "react";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "./Button";
import { UI_TOKENS } from "../../config/designTokens";

interface NotFoundPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ currentPath, onNavigate }) => {
  return (
    <div className={UI_TOKENS.appLayout.mainContent}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
          <FileQuestion className="w-8 h-8 text-slate-500" />
        </div>

        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded mb-2">
          HTTP 404 — Page Not Found
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Route Not Found
        </h1>

        <p className="text-sm text-slate-600 max-w-md mb-6">
          The requested path <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-xs">{currentPath}</code> does not exist or has been moved.
        </p>

        <div className="flex items-center gap-3">
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
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
