/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, Globe, GraduationCap, MessageCircle } from 'lucide-react';
import type { PortalTabId } from '../hooks/useUidNavigation';
import { PWAInstallButton } from './PWAInstallButton';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileAppBottomNavProps {
  currentTab: PortalTabId;
  onSelectTab: (tab: PortalTabId) => void;
  showToast?: (msg: string, isError?: boolean) => void;
}

export const MobileAppBottomNav: React.FC<MobileAppBottomNavProps> = ({
  currentTab,
  onSelectTab,
  showToast,
}) => {
  const { isInstalled } = usePWAInstall();

  const items: Array<{ id: PortalTabId; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'wikiworldweb', label: 'Notícias', Icon: Globe },
    { id: 'notmediawiki', label: 'Wiki', Icon: Database },
    { id: 'academico', label: 'Acadêmico', Icon: GraduationCap },
    { id: 'bemtevi', label: 'Bemtevi', Icon: MessageCircle },
  ];

  return (
    <nav
      aria-label="Navegação rápida do aplicativo móvel"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF9F5]/95 dark:bg-[#141414]/95 backdrop-blur-md border-t-2 border-[#141414] dark:border-[#3E3D38] pb-[env(safe-area-inset-bottom)]"
    >
      <div className={`grid ${isInstalled ? 'grid-cols-4' : 'grid-cols-5'} items-center`}>
        {items.map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelectTab(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#141414] dark:bg-stone-100 text-amber-300 dark:text-stone-950'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-full">{label}</span>
            </button>
          );
        })}
        {!isInstalled && <PWAInstallButton variant="mobile" showToast={showToast} />}
      </div>
    </nav>
  );
};
