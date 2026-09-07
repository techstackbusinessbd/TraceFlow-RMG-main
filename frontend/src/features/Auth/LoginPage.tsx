import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Lock, User, AlertCircle } from "lucide-react";
import { Button } from "../../components/common/Button";
import { useAuthStore } from "../../store/authStore";

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          login_identifier: identifier,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setErrors(data.errors);
        } else {
          setGeneralError(data.message || "Invalid credentials. Please try again.");
        }
        return;
      }

      // Success
      setAuth(data.data.user, data.data.token);
      window.location.href = "/";
    } catch {
      // If backend is not running on port 8000 in dev, offer helpful guidance
      setGeneralError("Cannot connect to TraceFlow API server. Please ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white font-bold text-xl shadow-lg mb-3">
          TF
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          TraceFlow RMG
        </h2>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
          Precision Fabric-to-Freight Garment Intelligence
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h3 className="text-base font-semibold text-white">
            Sign In to Enterprise Workspace
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your factory biometric ID, username, or corporate email.
          </p>
        </div>

        {generalError && (
          <div className="mb-5 p-3 rounded-md bg-rose-950/60 border border-rose-800 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Pure Server-Side Validation: STRICT noValidate on form */}
        <form noValidate onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Tri-Identifier Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Employee ID / Username / Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 255776, superadmin, or it@traceflow.com"
                className={`w-full rounded-md border ${
                  errors.login_identifier ? "border-rose-500 focus:ring-rose-500" : "border-slate-700 focus:border-blue-500"
                } bg-slate-950 px-3 py-2 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1`}
              />
            </div>
            {errors.login_identifier && (
              <p className="text-xs font-medium text-rose-400 mt-1.5">
                {errors.login_identifier[0]}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <span className="text-[11px] text-slate-500">
                Default: SuperAdmin#2026!
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full rounded-md border ${
                  errors.password ? "border-rose-500 focus:ring-rose-500" : "border-slate-700 focus:border-blue-500"
                } bg-slate-950 px-3 py-2 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-rose-400 mt-1.5">
                {errors.password[0]}
              </p>
            )}
          </div>

          {/* Flat Crisp Solid Blue Button */}
          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="w-full py-2.5 mt-2"
          >
            {isLoading ? (
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying Credentials...</span>
              </div>
            ) : (
              "Sign In to Workspace"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected by Hardware Fingerprinting & WORM Audit Vault</span>
        </div>
      </div>

      {/* Quick Credentials Info Box for Testing */}
      <div className="mt-4 max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 flex flex-col gap-1">
        <span className="font-semibold text-slate-300">Default Test Credentials:</span>
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
          <div className="bg-slate-950 p-1.5 rounded">
            <span className="text-blue-400 font-mono">255776</span>
            <span className="block text-[10px] text-slate-500">superadmin</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded">
            <span className="text-emerald-400 font-mono">100492</span>
            <span className="block text-[10px] text-slate-500">admin</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded">
            <span className="text-amber-400 font-mono">883015</span>
            <span className="block text-[10px] text-slate-500">standarduser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
