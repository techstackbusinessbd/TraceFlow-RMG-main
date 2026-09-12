import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Lock, User, AlertCircle } from "lucide-react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { TextInput } from "../../components/common/TextInput";
import { UI_TOKENS } from "../../config/designTokens";
import { useAuthStore } from "../../store/authStore";
import { navigationService } from "../../services/navigationService";

export const LoginPage: React.FC = () => {
  const { isAuthenticated, setAuth } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Authenticated users must not access /login
  React.useEffect(() => {
    if (isAuthenticated) {
      window.location.replace("/dashboard");
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return null;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
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
          setGeneralError(data.message || "Invalid credentials. Please verify your Employee ID / Username and password.");
        }
        return;
      }

      // Success
      navigationService.clearCache();
      setAuth(data.data.user, data.data.token);
      window.location.href = "/dashboard";
    } catch {
      setGeneralError("Cannot connect to TraceFlow API server. Please ensure backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={UI_TOKENS.authLayout.wrapper}>
      {/* Brand Header */}
      <div className={UI_TOKENS.authLayout.headerWrapper}>
        <div className={UI_TOKENS.authLayout.logoBox}>
          TF
        </div>
        <h2 className={UI_TOKENS.authLayout.appTitle}>
          TraceFlow RMG
        </h2>
        <p className={UI_TOKENS.authLayout.appSubtitle}>
          Garment Traceability & Manufacturing ERP
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className={UI_TOKENS.authLayout.card}>
        <div className={UI_TOKENS.authLayout.cardHeader}>
          <h3 className={UI_TOKENS.authLayout.cardTitle}>
            Sign In to Enterprise Workspace
          </h3>
          <p className={UI_TOKENS.authLayout.cardSubtitle}>
            Enter your factory biometric ID, username, or corporate email.
          </p>
        </div>

        {generalError && (
          <div className={UI_TOKENS.authLayout.generalAlert}>
            <AlertCircle className={UI_TOKENS.authLayout.alertIcon} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Pure Server-Side Validation: STRICT noValidate on form */}
        <form noValidate onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Tri-Identifier Field using FormField & TextInput Primitives */}
          <FormField
            label="Employee ID / Username / Email"
            required
            error={errors.login_identifier}
          >
            <TextInput
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 255776, superadmin, or it@traceflow.com"
              leftIcon={<User className="h-4 w-4" />}
              isError={!!errors.login_identifier}
            />
          </FormField>

          {/* Password Field using FormField & TextInput Primitives */}
          <FormField
            label="Password"
            required
            error={errors.password}
            helperText="Default password: password"
          >
            <TextInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              isError={!!errors.password}
            />
          </FormField>

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

        <div className={UI_TOKENS.authLayout.footerAudit}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected by Hardware Fingerprinting & WORM Audit Vault</span>
        </div>
      </div>

      {/* Quick Credentials Info Box for Testing */}
      <div className={UI_TOKENS.authLayout.testCredentialsBox}>
        <span className="font-semibold text-slate-700">Default Test Credentials:</span>
        <div className={UI_TOKENS.authLayout.testCredentialsGrid}>
          <div className={UI_TOKENS.authLayout.testCredentialItem}>
            <span className="text-blue-700 font-mono font-bold">255776</span>
            <span className="block text-[10px] text-slate-500">superadmin</span>
          </div>
          <div className={UI_TOKENS.authLayout.testCredentialItem}>
            <span className="text-emerald-700 font-mono font-bold">100492</span>
            <span className="block text-[10px] text-slate-500">admin</span>
          </div>
          <div className={UI_TOKENS.authLayout.testCredentialItem}>
            <span className="text-amber-700 font-mono font-bold">883015</span>
            <span className="block text-[10px] text-slate-500">standarduser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
