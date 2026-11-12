import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Home, Wrench } from 'lucide-react';

interface CustomContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onTools: () => void;
}

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  isOpen,
  x,
  y,
  onClose,
  onRefresh,
  onHome,
  onTools,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reposiciona o menu para não vazar pelas bordas da janela
  useEffect(() => {
    if (!isOpen) return;

    const menuWidth = 62;
    const menuHeight = 158;
    const padding = 12;

    let targetX = x;
    let targetY = y;

    if (targetX + menuWidth + padding > window.innerWidth) {
      targetX = Math.max(padding, window.innerWidth - menuWidth - padding);
    }
    if (targetY + menuHeight + padding > window.innerHeight) {
      targetY = Math.max(padding, window.innerHeight - menuHeight - padding);
    }

    setAdjustedPos({ x: targetX, y: targetY });
  }, [isOpen, x, y]);

  // Fechar ao clicar fora, ao rolar a página ou pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onClose();
      onRefresh();
    }, 280);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    onHome();
  };

  const handleToolsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    onTools();
  };

  return (
    <div
      ref={menuRef}
      id="wiki-custom-context-menu"
      role="menu"
      aria-label="Menu de Ações Rápidas por Símbolos"
      className="fixed z-[999999] flex flex-col items-center p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl transition-transform duration-150 animate-in fade-in zoom-in-95 select-none"
      style={{
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Símbolo: Atualizar */}
      <button
        id="context-menu-refresh"
        role="menuitem"
        type="button"
        onClick={handleRefreshClick}
        title="Atualizar"
        aria-label="Atualizar"
        className="relative group p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 active:scale-95 transition-all flex items-center justify-center focus:outline-hidden"
      >
        <RefreshCw
          size={20}
          className={`transition-transform duration-300 ${
            isRefreshing ? 'animate-spin text-blue-600' : 'group-hover:rotate-180'
          }`}
        />
        {/* Tooltip discreto no hover sem renderizar palavra no botão */}
        <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Atualizar
        </span>
      </button>

      <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-1" />

      {/* 2. Símbolo: Página Inicial */}
      <button
        id="context-menu-home"
        role="menuitem"
        type="button"
        onClick={handleHomeClick}
        title="Página Inicial"
        aria-label="Página Inicial"
        className="relative group p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 active:scale-95 transition-all flex items-center justify-center focus:outline-hidden"
      >
        <Home size={20} className="transition-transform duration-200 group-hover:scale-110" />
        {/* Tooltip discreto no hover sem renderizar palavra no botão */}
        <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Página Inicial
        </span>
      </button>

      <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-1" />

      {/* 3. Símbolo: Ferramentas */}
      <button
        id="context-menu-tools"
        role="menuitem"
        type="button"
        onClick={handleToolsClick}
        title="Ferramentas"
        aria-label="Ferramentas"
        className="relative group p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 active:scale-95 transition-all flex items-center justify-center focus:outline-hidden"
      >
        <Wrench size={20} className="transition-transform duration-200 group-hover:rotate-45" />
        {/* Tooltip discreto no hover sem renderizar palavra no botão */}
        <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Ferramentas
        </span>
      </button>
    </div>
  );
};
