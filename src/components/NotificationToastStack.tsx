/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X, ArrowRight } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
  durationMs: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    container: string;
    badge: string;
    progress: string;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  success: {
    container: "bg-[#141414] text-white border-emerald-500",
    badge: "bg-emerald-600 text-white",
    progress: "bg-emerald-400",
    label: "Concluído",
    Icon: CheckCircle2
  },
  error: {
    container: "bg-red-700 text-white border-[#141414]",
    badge: "bg-red-950 text-red-100",
    progress: "bg-amber-300",
    label: "Erro",
    Icon: AlertOctagon
  },
  warning: {
    container: "bg-amber-50 text-stone-950 border-amber-700",
    badge: "bg-amber-600 text-white",
    progress: "bg-amber-600",
    label: "Aviso",
    Icon: AlertTriangle
  },
  info: {
    container: "bg-[#141414] text-white border-[#141414]",
    badge: "bg-stone-700 text-amber-300",
    progress: "bg-amber-400",
    label: "Sistema",
    Icon: Info
  }
};

function ToastCard({
  toast,
  onDismiss
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState(toast.durationMs);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    lastTickRef.current = Date.now();
    if (isPaused) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setRemainingMs((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          window.clearInterval(interval);
          onDismiss(toast.id);
          return 0;
        }
        return next;
      });
    }, 80);

    return () => window.clearInterval(interval);
  }, [isPaused, onDismiss, toast.id]);

  const cfg = VARIANT_CONFIG[toast.variant] || VARIANT_CONFIG.info;
  const Icon = cfg.Icon;
  const progressPct = Math.max(0, Math.min(100, (remainingMs / toast.durationMs) * 100));

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        lastTickRef.current = Date.now();
        setIsPaused(false);
      }}
      className={`pointer-events-auto relative overflow-hidden border-2 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-200 ${cfg.container}`}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={`p-1.5 shrink-0 mt-0.5 ${cfg.badge}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
              {toast.title || cfg.label}
            </span>
          </div>
          <p className="text-xs font-mono leading-snug break-words">{toast.message}</p>

          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider underline underline-offset-2 hover:opacity-80 cursor-pointer"
            >
              <span>{toast.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Fechar aviso"
          className="p-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="h-1 w-full bg-black/20">
        <div
          className={`h-full transition-[width] duration-75 ${cfg.progress}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

export default function NotificationToastStack({
  toasts,
  onDismiss
}: NotificationToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 flex flex-col gap-2.5 pointer-events-none"
      aria-label="Notificações rápidas"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
