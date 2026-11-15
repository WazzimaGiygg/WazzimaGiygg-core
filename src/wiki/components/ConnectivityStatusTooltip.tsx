import React, { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Clock,
  Activity,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Zap,
  X,
} from 'lucide-react';

export interface ConnectivityStatusTooltipProps {
  status: 'online' | 'offline';
  latencyMs: number | null;
  lastCheckedAt: number | null;
  statusCode?: number | null;
  error?: string | null;
  targetUrl?: string;
  isStable?: boolean;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'right' | 'left';
}

export const ConnectivityStatusTooltip: React.FC<ConnectivityStatusTooltipProps> = ({
  status,
  latencyMs,
  lastCheckedAt,
  statusCode,
  error,
  targetUrl = 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative',
  isStable = true,
  children,
  position = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o tooltip quando o usuário clica ou toca fora (essencial para dispositivos móveis)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const formattedTime = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Ainda não verificado';

  const formattedDate = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
    : '';

  const isOnline = status === 'online';

  const handleToggle = (e: React.MouseEvent) => {
    // Permite toque direto em telas móveis sem quebrar cliques em desktop
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      onClick={handleToggle}
      role="tooltip"
      aria-label="Detalhes de Conectividade com o GitHub"
    >
      {/* Elemento gatilho (ícone) */}
      {children}

      {/* Balão do Tooltip Otimizado para Mobile e Desktop */}
      {isOpen && (
        <div
          data-testid="connectivity-tooltip-popover"
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 pointer-events-auto sm:pointer-events-none w-72 max-w-[calc(100vw-2rem)] p-3.5 rounded-2xl shadow-2xl border text-xs font-sans transition-all duration-150 animate-in fade-in zoom-in-95 ${
            position === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-2.5'
              : position === 'bottom'
              ? 'top-full left-1/2 -translate-x-1/2 mt-2.5'
              : position === 'right'
              ? 'left-full top-1/2 -translate-y-1/2 ml-2.5'
              : 'right-full top-1/2 -translate-y-1/2 mr-2.5'
          } bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border-slate-700/80`}
        >
          {/* Seta do Tooltip */}
          <div
            className={`hidden sm:block absolute w-2.5 h-2.5 rotate-45 bg-slate-900 dark:bg-slate-950 border-slate-700/80 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-1.5 border-r border-b'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-l border-t'
                : position === 'right'
                ? 'right-full top-1/2 -translate-y-1/2 -mr-1.5 border-l border-b'
                : 'left-full top-1/2 -translate-y-1/2 -ml-1.5 border-r border-t'
            }`}
          />

          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                </div>
              ) : (
                <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
                  <WifiOff className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="font-bold text-[11px] tracking-wide text-slate-200 uppercase">
                Diagnóstico GitHub
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 ${
                  isOnline
                    ? isStable
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? (isStable ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-rose-400'
                  }`}
                />
                {isOnline ? (isStable ? 'Estável' : 'Lenta') : 'Offline'}
              </span>

              {/* Botão fechar em toque mobile */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="sm:hidden p-1 text-slate-400 hover:text-white rounded-md active:bg-slate-800 transition"
                aria-label="Fechar detalhes"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Corpo com métricas */}
          <div className="py-2.5 space-y-2 text-[11px]">
            {/* Tempo de resposta */}
            <div className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/50">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Tempo de Resposta:
              </span>
              <span
                data-testid="tooltip-latency"
                className={`font-mono font-bold ${
                  latencyMs === null
                    ? 'text-slate-400'
                    : latencyMs <= 250
                    ? 'text-emerald-400'
                    : latencyMs <= 500
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {latencyMs !== null ? `${latencyMs} ms` : 'calculando...'}
              </span>
            </div>

            {/* Última verificação */}
            <div className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/50">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Última Verificação:
              </span>
              <span data-testid="tooltip-last-checked" className="font-mono text-slate-200">
                {formattedTime} {formattedDate ? `(${formattedDate})` : ''}
              </span>
            </div>

            {/* Código HTTP */}
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>Status HTTP da Rota:</span>
              <span className="font-mono text-slate-300">
                {statusCode ? `HTTP ${statusCode} ${statusCode === 200 ? 'OK' : ''}` : isOnline ? 'HTTP 200 OK' : 'Sem resposta'}
              </span>
            </div>

            {/* URL alvo */}
            <div className="pt-1 text-[10px] text-slate-400 truncate border-t border-slate-800/80">
              <span className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Globe className="w-3 h-3 text-slate-400" />
                Alvo Consultado:
              </span>
              <p className="font-mono text-[9px] text-slate-300 truncate" title={targetUrl}>
                {targetUrl}
              </p>
            </div>

            {/* Mensagem / Diagnóstico */}
            {error && !isOnline && (
              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-[10px] text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span className="break-words">{error}</span>
              </div>
            )}
          </div>

          {/* Rodapé com Dica */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              OnlineStatusExtension
            </span>
            <span className="text-slate-500">Tempo real</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectivityStatusTooltip;
