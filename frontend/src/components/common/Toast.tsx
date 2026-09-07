import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { UI_TOKENS } from "../../config/designTokens";

export interface ToastProps {
  id?: string;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type = "success",
  title,
  message,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      style: UI_TOKENS.toast.success,
      icon: <CheckCircle2 className={UI_TOKENS.toast.iconSuccess} />,
      defaultTitle: "Changes Saved",
    },
    error: {
      style: UI_TOKENS.toast.error,
      icon: <AlertCircle className={UI_TOKENS.toast.iconError} />,
      defaultTitle: "Action Failed",
    },
    info: {
      style: UI_TOKENS.toast.info,
      icon: <Info className={UI_TOKENS.toast.iconInfo} />,
      defaultTitle: "Notification",
    },
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${UI_TOKENS.toast.base} ${typeConfig.style} animate-in fade-in slide-in-from-top-2`}
    >
      {typeConfig.icon}
      <div className={UI_TOKENS.toast.content}>
        <h4 className={UI_TOKENS.toast.title}>{title || typeConfig.defaultTitle}</h4>
        <p className={UI_TOKENS.toast.message}>{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className={UI_TOKENS.toast.closeBtn}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
