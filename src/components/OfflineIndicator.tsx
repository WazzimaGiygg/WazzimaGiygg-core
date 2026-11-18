/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 bg-amber-600 text-white border-2 border-[#141414] px-3 py-2 text-xs font-mono font-bold shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline — Acervo em cache local ativo</span>
    </div>
  );
};
