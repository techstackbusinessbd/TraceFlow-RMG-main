import React, { useState } from 'react';
import { ShellBar } from './ShellBar';
import { NavigationRail } from './NavigationRail';
import { AppLauncherModal } from './AppLauncherModal';
import { ChevronRight } from 'lucide-react';
import { UI_TOKENS } from '../../config/designTokens';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  currentModuleId?: string;
  onSelectModule?: (id: string) => void;
  statusBadge?: React.ReactNode;
  activeCategory?: string | null;
  hideRail?: boolean;
  onProfileClick?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Master Data", href: "/master" },
    { label: "Companies", active: true },
  ],
  currentModuleId = 'master-companies',
  onSelectModule,
  statusBadge,
  activeCategory,
  hideRail = false,
  onProfileClick,
}) => {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [launcherSearchQuery, setLauncherSearchQuery] = useState('');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const handleOpenSearch = (query: string = '') => {
    setLauncherSearchQuery(query);
    setIsLauncherOpen(true);
  };

  return (
    <div className={UI_TOKENS.appLayout.wrapper}>
      {/* 1. Microsoft Power Automate Fluent 2 Top ShellBar (48px) */}
      <ShellBar
        onLauncherClick={() => handleOpenSearch('')}
        onSearchClick={(query) => handleOpenSearch(query || '')}
        onSearchSubmit={(query) => handleOpenSearch(query)}
        onProfileClick={onProfileClick}
      />

      {/* Applications & Flows Launchpad Modal */}
      <AppLauncherModal
        isOpen={isLauncherOpen}
        initialSearchQuery={launcherSearchQuery}
        onClose={() => {
          setIsLauncherOpen(false);
          setLauncherSearchQuery('');
        }}
        onSelectApp={(modId) => {
          onSelectModule?.(modId);
        }}
      />

      {/* 2. Main Body Container with Left Rail */}
      <div className={UI_TOKENS.appLayout.body}>
        {/* Left Collapsible Rail (240px to 56px) - Hidden when hideRail is true */}
        {!hideRail && (
          <NavigationRail
            currentModuleId={currentModuleId}
            onSelectModule={onSelectModule}
            collapsed={isNavCollapsed}
            onToggleCollapse={() => setIsNavCollapsed(!isNavCollapsed)}
            activeCategory={activeCategory}
            hideCategories={hideRail}
          />
        )}

        {/* 3. High-Density Scrollable Workspace - Exact matching margin */}
        <div
          className={
            hideRail
              ? UI_TOKENS.appLayout.workspaceFull
              : isNavCollapsed
              ? UI_TOKENS.appLayout.workspaceCollapsed
              : UI_TOKENS.appLayout.workspaceOpen
          }
        >
          {/* Sub-Header: Global Breadcrumb & Quick Workflow Bar (40px) */}
          <div className={UI_TOKENS.appLayout.subHeader}>
            <nav className={UI_TOKENS.appLayout.breadcrumbNav}>
              {breadcrumbs.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className={UI_TOKENS.appLayout.breadcrumbSeparator} />}
                  {item.active ? (
                    <span className={UI_TOKENS.appLayout.breadcrumbActive}>{item.label}</span>
                  ) : (
                    <a
                      href={item.href || '#'}
                      className={UI_TOKENS.appLayout.breadcrumbLink}
                    >
                      {item.label}
                    </a>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Contextual Status / Workflow Badge */}
            {statusBadge && <div>{statusBadge}</div>}
          </div>

          {/* Main Power Automate Fluent Canvas */}
          <main className={UI_TOKENS.appLayout.main}>
            <div className={UI_TOKENS.appLayout.mainContent}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
