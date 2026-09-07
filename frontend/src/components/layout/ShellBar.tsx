import React, { useState, useEffect, useRef } from 'react';
import { UI_TEXT } from '../../config/uiTextConstants';
import { UI_TOKENS } from '../../config/designTokens';
import { Search, Bell, LayoutGrid, Settings, HelpCircle, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ShellBarProps {
  currentCompany?: string;
  onCompanySwitch?: () => void;
  onSearchClick?: (query?: string) => void;
  onLauncherClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onProfileClick?: () => void;
}

/**
 * Authentic Microsoft Power Automate Web Portal Header (make.powerautomate.com)
 * - Exact height: 48px
 * - Pure White surface (#FFFFFF) with crisp #EDEBE9 border
 * - Official Power Automate Logo SVG
 * - Power Automate Pill Search (#F3F2F1 background)
 * - Microsoft 365 Environment Switcher Button
 */
export const ShellBar: React.FC<ShellBarProps> = ({
  currentCompany,
  onCompanySwitch,
  onSearchClick,
  onLauncherClick,
  onSearchSubmit,
  onProfileClick,
}) => {
  const { user, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [searchVal, setSearchVal] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeCompany = user?.company_name || currentCompany || "Platform Owner";
  const userFullName = user?.name || "Nur-e-Alam";
  const userRole = user?.roles?.[0] || "Operations Lead";
  const userEmail = user?.email || "alam.n@standardgroup.com";
  const empId = user?.emp_id || "255776";

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchVal);
    } else if (onSearchClick) {
      onSearchClick(searchVal);
    }
  };

  return (
    <header className={UI_TOKENS.powerShell.header}>
      {/* Left: 9-Dot Waffle + Brand Name */}
      <div className={UI_TOKENS.powerShell.brandWrapper}>
        <button
          type="button"
          onClick={onLauncherClick}
          className={UI_TOKENS.powerShell.waffleButton}
          title="App launcher"
        >
          <LayoutGrid className={UI_TOKENS.powerNav.iconMd} />
        </button>

        {/* Brand Name & System Version */}
        <div className={UI_TOKENS.powerShell.brandTitleClickable} onClick={() => window.location.href = "/dashboard"}>
          <span className={UI_TOKENS.powerShell.brandText}>
            TraceFlow <span className={UI_TOKENS.powerShell.brandAccent}>RMG</span>
          </span>
          <span className={UI_TOKENS.powerShell.versionBadge} title="TraceFlow RMG Production Build Version">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Middle: Power Automate Portal Live Search Bar */}
      <div className={UI_TOKENS.powerShell.searchContainer}>
        <form onSubmit={handleSubmit} className={UI_TOKENS.powerShell.searchForm}>
          <Search className={UI_TOKENS.powerShell.searchIconAbsolute} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => {
              // Clicking or focusing opens launcher with current search if desired or ready to type
            }}
            placeholder="Search for modules, orders, buyers or styles..."
            className={UI_TOKENS.powerShell.searchInput}
          />
          {searchVal ? (
            <button
              type="button"
              onClick={() => {
                setSearchVal('');
                searchInputRef.current?.focus();
              }}
              className={UI_TOKENS.powerShell.searchClearButton}
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className={UI_TOKENS.powerShell.searchKbdAbsolute}>
              /
            </kbd>
          )}
        </form>
      </div>

      {/* Right: Telemetry & Profile Flyout Trigger */}
      <div className={UI_TOKENS.powerShell.rightContainer}>
        {/* Action Icons */}
        <div className={UI_TOKENS.powerShell.actionIconsGroup}>
          {/* Settings */}
          <button
            type="button"
            className={UI_TOKENS.powerShell.actionButton}
            title="Settings"
          >
            <Settings className={UI_TOKENS.powerNav.iconSm} />
          </button>

          {/* Help & Support */}
          <button
            type="button"
            className={UI_TOKENS.powerShell.actionButton}
            title="Help"
          >
            <HelpCircle className={UI_TOKENS.powerNav.iconSm} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            className={UI_TOKENS.powerShell.actionButton}
            title={UI_TEXT.SHELL.NOTIFICATIONS}
          >
            <Bell className={UI_TOKENS.powerNav.iconSm} />
            <span className={UI_TOKENS.powerShell.notificationDot}></span>
          </button>
        </div>

        {/* User Avatar & Flyout Trigger */}
        <div className={UI_TOKENS.powerShell.avatarMenuContainer}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={UI_TOKENS.powerShell.avatarButton}
            title="Account manager for Nur-e-Alam"
          >
            {userFullName.charAt(0)}
          </button>

          {/* Microsoft 365 / Power Automate Signature Profile Card Flyout */}
          {isProfileOpen && (
            <>
              {/* Backdrop */}
              <div 
                className={UI_TOKENS.powerShell.flyoutBackdrop} 
                onClick={() => setIsProfileOpen(false)}
              />

              {/* Flyout Card - Subtle Microsoft 365 Flat Corners */}
              <div className={UI_TOKENS.powerShell.flyoutCard}>
                {/* Header: Company Name & Sign Out Link */}
                <div className={UI_TOKENS.powerShell.flyoutHeader}>
                  <span 
                    onClick={onCompanySwitch}
                    className={`${UI_TOKENS.powerShell.flyoutCompany} ${onCompanySwitch ? 'cursor-pointer hover:text-[#0066FF]' : ''}`}
                    title={onCompanySwitch ? "Click to switch factory unit" : undefined}
                  >
                    {activeCompany}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      window.location.href = "/login";
                    }}
                    className={UI_TOKENS.powerShell.flyoutSignOut}
                  >
                    Sign out
                  </button>
                </div>

                {/* Profile Details Row */}
                <div className={UI_TOKENS.powerShell.flyoutBody}>
                  <div className={UI_TOKENS.powerShell.flyoutAvatar}>
                    {userFullName.charAt(0)}
                  </div>
                  <div className={UI_TOKENS.powerShell.flyoutDetails}>
                    <h4 className={UI_TOKENS.powerShell.flyoutName}>
                      {userFullName}
                    </h4>
                    <p className={UI_TOKENS.powerShell.flyoutEmail}>
                      {userEmail}
                    </p>
                    <div className={UI_TOKENS.powerShell.flyoutLinks}>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (onProfileClick) {
                            onProfileClick();
                          } else {
                            window.location.href = "/profile";
                          }
                        }}
                        className={`${UI_TOKENS.powerShell.flyoutLink} text-left font-medium cursor-pointer`}
                      >
                        View account ({empId})
                      </button>
                      <div className="text-[11px] text-slate-500 pt-0.5">
                        Role: <span className="font-semibold text-slate-700">{userRole}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
