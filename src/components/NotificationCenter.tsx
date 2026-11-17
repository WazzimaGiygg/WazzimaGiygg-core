/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Maximize2,
  Newspaper,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import {
  NotificationCategory,
  UserNotification,
  clearReadNotifications,
  dismissNotification,
  markAllNotificationsAsRead,
  setNotificationReadState
} from "../firebase";

export interface NotificationPreferences {
  soundEnabled: boolean;
  desktopPushEnabled: boolean;
  enabledCategories: Record<NotificationCategory, boolean>;
}

const PREFS_STORAGE_KEY = "wzzm_notif_preferences_v1";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  desktopPushEnabled: false,
  enabledCategories: {
    sistema: true,
    alerta: true,
    noticia: true,
    comunidade: true
  }
};

function loadPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: parsed.soundEnabled ?? true,
      desktopPushEnabled: parsed.desktopPushEnabled ?? false,
      enabledCategories: {
        ...DEFAULT_PREFERENCES.enabledCategories,
        ...(parsed.enabledCategories || {})
      }
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function savePreferences(prefs: NotificationPreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota errors
  }
}

function playSubtleNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09); // A5
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 350);
  } catch {
    // Audio context blocked or unavailable
  }
}

interface NotificationCenterProps {
  notifications: UserNotification[];
  userId: string;
  isAdmin: boolean;
  onNavigateAction?: (notif: UserNotification) => void;
  onOpenAdminComposer?: () => void;
  showToast?: (msg: string, isError?: boolean) => void;
}

type FilterTab = "todas" | "nao_lidas" | NotificationCategory;

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; badgeClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  alerta: {
    label: "Alerta",
    badgeClass: "bg-red-100 text-red-900 border-red-400 dark:bg-red-950/70 dark:text-red-200 dark:border-red-700",
    Icon: ShieldAlert
  },
  noticia: {
    label: "Editorial",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-700",
    Icon: Newspaper
  },
  comunidade: {
    label: "Comunidade",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700",
    Icon: Sparkles
  },
  sistema: {
    label: "Sistema",
    badgeClass: "bg-stone-200 text-stone-900 border-stone-400 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600",
    Icon: Bell
  }
};

export default function NotificationCenter({
  notifications,
  userId,
  isAdmin,
  onNavigateAction,
  onOpenAdminComposer,
  showToast
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [showPrefsPanel, setShowPrefsPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => loadPreferences());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return window.Notification.permission;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Filter notifications by user's category preferences
  const visibleNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const cat: NotificationCategory = n.tipo || "sistema";
      return prefs.enabledCategories[cat] !== false;
    });
  }, [notifications, prefs.enabledCategories]);

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.lida).length,
    [visibleNotifications]
  );

  const hasUnreadUrgent = useMemo(
    () => visibleNotifications.some((n) => !n.lida && (n.tipo === "alerta" || n.prioridade === "alert")),
    [visibleNotifications]
  );

  // Detect brand-new incoming notifications while app is open
  useEffect(() => {
    if (!initializedRef.current) {
      notifications.forEach((n) => knownIdsRef.current.add(n.id));
      initializedRef.current = true;
      return;
    }

    const newlyArrived = notifications.filter(
      (n) => !knownIdsRef.current.has(n.id) && !n.lida
    );
    notifications.forEach((n) => knownIdsRef.current.add(n.id));

    if (newlyArrived.length > 0) {
      const latest = newlyArrived[0];
      const cat: NotificationCategory = latest.tipo || "sistema";
      if (prefs.enabledCategories[cat] !== false) {
        if (prefs.soundEnabled) {
          playSubtleNotificationChime();
        }
        if (
          prefs.desktopPushEnabled &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission === "granted"
        ) {
          try {
            new window.Notification(`WazzimaGiygg • ${latest.titulo}`, {
              body: latest.mensagem,
              tag: latest.id
            });
          } catch {
            // Browser prevented constructor in current context
          }
        }
      }
    }
  }, [notifications, prefs.desktopPushEnabled, prefs.enabledCategories, prefs.soundEnabled]);

  // Close popover on outside click or Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsFullModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const updatePrefs = (updater: (prev: NotificationPreferences) => NotificationPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      savePreferences(next);
      return next;
    });
  };

  const handleRequestBrowserPush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast?.("Este navegador não suporta notificações de área de trabalho.", true);
      return;
    }
    try {
      const result = await window.Notification.requestPermission();
      setBrowserPermission(result);
      if (result === "granted") {
        updatePrefs((prev) => ({ ...prev, desktopPushEnabled: true }));
        showToast?.("✓ Notificações no navegador ativadas com sucesso!");
        try {
          new window.Notification("WazzimaGiygg • Notificações Ativas", {
            body: "Você receberá alertas importantes em tempo real."
          });
        } catch {
          // Ignore constructor block
        }
      } else {
        updatePrefs((prev) => ({ ...prev, desktopPushEnabled: false }));
        showToast?.("Permissão de notificações no navegador não concedida.", true);
      }
    } catch {
      showToast?.("Não foi possível solicitar permissão de notificação neste contexto.", true);
    }
  };

  const filteredList = useMemo(() => {
    let list = visibleNotifications;
    if (activeFilter === "nao_lidas") {
      list = list.filter((n) => !n.lida);
    } else if (activeFilter !== "todas") {
      list = list.filter((n) => (n.tipo || "sistema") === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.titulo.toLowerCase().includes(q) ||
          n.mensagem.toLowerCase().includes(q)
      );
    }
    return list;
  }, [visibleNotifications, activeFilter, searchQuery]);

  const handleNotificationItemClick = async (notif: UserNotification) => {
    if (!notif.lida) {
      await setNotificationReadState(notif, userId, true);
    }
    if (notif.actionUid || notif.actionTab) {
      onNavigateAction?.(notif);
      setIsOpen(false);
      setIsFullModalOpen(false);
    }
  };

  const renderNotificationCard = (n: UserNotification) => {
    const cat: NotificationCategory = n.tipo || "sistema";
    const meta = CATEGORY_META[cat] || CATEGORY_META.sistema;
    const CatIcon = meta.Icon;
    const isUrgent = n.prioridade === "alert" || cat === "alerta";

    return (
      <div
        key={n.id}
        className={`group p-3 border transition-colors ${
          n.lida
            ? "bg-stone-50 dark:bg-[#242320] border-stone-200 dark:border-[#34332F]"
            : isUrgent
              ? "bg-red-50/90 dark:bg-red-950/40 border-red-400 dark:border-red-700"
              : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!n.lida && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${isUrgent ? "bg-red-600" : "bg-amber-600"}`}
                title="Não lida"
              />
            )}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-mono font-bold uppercase ${meta.badgeClass}`}>
              <CatIcon className="w-2.5 h-2.5" />
              <span>{meta.label}</span>
            </span>
            <span className="font-mono font-bold text-[11px] text-stone-900 dark:text-stone-100 leading-tight">
              {n.titulo}
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 shrink-0">
            {n.timestamp}
          </span>
        </div>

        <p
          onClick={() => handleNotificationItemClick(n)}
          className={`text-[11px] text-stone-700 dark:text-stone-300 leading-snug ${
            n.actionUid || n.actionTab ? "cursor-pointer hover:underline" : "cursor-pointer"
          }`}
        >
          {n.mensagem}
        </p>

        <div className="mt-2 pt-1.5 border-t border-stone-200/70 dark:border-stone-700/60 flex items-center justify-between gap-2 text-[10px] font-mono">
          <div>
            {(n.actionUid || n.actionTab) && (
              <button
                type="button"
                onClick={() => handleNotificationItemClick(n)}
                className="inline-flex items-center gap-1 font-bold uppercase text-blue-700 dark:text-amber-300 hover:underline cursor-pointer"
              >
                <span>{n.actionLabel || "Abrir"}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNotificationReadState(n, userId, !n.lida);
              }}
              className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white cursor-pointer"
              title={n.lida ? "Marcar como não lida" : "Marcar como lida"}
            >
              {n.lida ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{n.lida ? "Não lida" : "Lida"}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(n, userId);
              }}
              className="inline-flex items-center gap-0.5 text-stone-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
              title="Dispensar notificação"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative p-1 transition-colors flex items-center cursor-pointer ${
            hasUnreadUrgent
              ? "text-amber-300 hover:text-white"
              : "text-stone-300 hover:text-white"
          }`}
          title={`Central de Notificações (${unreadCount} não lidas)`}
          aria-expanded={isOpen}
          aria-label="Abrir central de notificações"
        >
          {hasUnreadUrgent ? (
            <BellRing className="w-3.5 h-3.5 animate-pulse" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 text-white font-bold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-black ${
                hasUnreadUrgent ? "bg-red-600" : "bg-amber-600"
              }`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Quick Popover */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-[min(92vw,24rem)] bg-white dark:bg-[#1A1A18] text-[#141414] dark:text-[#F5F4F0] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] z-50">
            {/* Popover Header */}
            <div className="p-3 border-b-2 border-[#141414] dark:border-[#3E3D38] bg-[#F4F2EC] dark:bg-[#22211E] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span className="font-bold text-xs uppercase tracking-wider font-mono">
                  Notificações ({unreadCount}/{visibleNotifications.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updatePrefs((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  className="p-1 border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                  title={prefs.soundEnabled ? "Silenciar alerta sonoro" : "Ativar alerta sonoro"}
                >
                  {prefs.soundEnabled ? (
                    <Volume2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3 h-3 text-stone-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsFullModalOpen(true);
                  }}
                  className="p-1 border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                  title="Expandir Central Completa"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Filter Pills + Bulk Read */}
            <div className="px-3 py-2 border-b border-stone-200 dark:border-[#2E2D28] flex items-center justify-between gap-2 bg-white dark:bg-[#1A1A18]">
              <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase">
                {[
                  { id: "todas" as const, label: "Todas" },
                  { id: "nao_lidas" as const, label: `Não lidas (${unreadCount})` },
                  { id: "alerta" as const, label: "Alertas" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2 py-0.5 border cursor-pointer transition-colors ${
                      activeFilter === tab.id
                        ? "bg-[#141414] text-amber-300 border-[#141414]"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead(visibleNotifications, userId)}
                  className="text-[10px] text-amber-800 dark:text-amber-400 hover:underline font-mono font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Ler todas</span>
                </button>
              )}
            </div>

            {/* Popover Items */}
            <div className="max-h-72 overflow-y-auto p-3 space-y-2">
              {filteredList.length === 0 ? (
                <div className="py-6 text-center space-y-1.5">
                  <BellOff className="w-6 h-6 mx-auto text-stone-400" />
                  <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
                    Nenhuma notificação neste filtro.
                  </p>
                </div>
              ) : (
                filteredList.slice(0, 8).map(renderNotificationCard)
              )}
            </div>

            {/* Popover Footer */}
            <div className="p-2.5 border-t border-stone-200 dark:border-[#2E2D28] bg-[#F8F7F4] dark:bg-[#22211E] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsFullModalOpen(true);
                }}
                className="font-bold uppercase text-stone-800 dark:text-stone-200 hover:underline cursor-pointer flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Central &amp; Preferências</span>
              </button>

              {browserPermission === "default" ? (
                <button
                  type="button"
                  onClick={handleRequestBrowserPush}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-2 py-0.5 border border-[#141414] font-bold uppercase cursor-pointer"
                >
                  Ativar Push
                </button>
              ) : isAdmin && onOpenAdminComposer ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAdminComposer();
                  }}
                  className="bg-red-700 hover:bg-red-800 text-white px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-2.5 h-2.5" />
                  <span>Transmitir</span>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* FULL NOTIFICATION CENTER MODAL                                      */}
      {/* =================================================================== */}
      {isFullModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1A1A18] text-[#141414] dark:text-[#F5F4F0] border-4 border-[#141414] dark:border-[#4A4942] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-[#141414] text-white px-5 py-4 flex items-center justify-between gap-3 border-b-2 border-[#141414]">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-editorial text-xl font-bold leading-none">
                    Central de Notificações WazzimaGiygg
                  </h2>
                  <p className="text-[10px] font-mono text-stone-400 mt-1">
                    {unreadCount} não lida(s) • {visibleNotifications.length} registrada(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && onOpenAdminComposer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullModalOpen(false);
                      onOpenAdminComposer();
                    }}
                    className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-red-400"
                  >
                    <Send className="w-3 h-3" />
                    <span>Transmitir Comunicado</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowPrefsPanel((p) => !p)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border ${
                    showPrefsPanel
                      ? "bg-amber-500 text-stone-950 border-amber-300"
                      : "bg-stone-800 text-stone-200 border-stone-600 hover:bg-stone-700"
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Preferências</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-white cursor-pointer"
                  aria-label="Fechar central de notificações"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preferences Drawer (Optional) */}
            {showPrefsPanel && (
              <div className="p-4 bg-[#F7F5EE] dark:bg-[#23221F] border-b-2 border-[#141414] dark:border-[#3E3D38] space-y-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold uppercase text-[11px]">
                      Notificações do Navegador (Desktop)
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Status atual:{" "}
                      <span className="font-bold">
                        {browserPermission === "granted"
                          ? "Permitido"
                          : browserPermission === "denied"
                            ? "Bloqueado nas configurações do navegador"
                            : browserPermission === "unsupported"
                              ? "Não suportado neste navegador"
                              : "Aguardando permissão"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {browserPermission === "granted" ? (
                      <button
                        type="button"
                        onClick={() =>
                          updatePrefs((prev) => ({
                            ...prev,
                            desktopPushEnabled: !prev.desktopPushEnabled
                          }))
                        }
                        className={`px-3 py-1.5 border border-[#141414] font-bold uppercase text-[10px] cursor-pointer ${
                          prefs.desktopPushEnabled
                            ? "bg-emerald-600 text-white"
                            : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                        }`}
                      >
                        {prefs.desktopPushEnabled ? "Push Ativado" : "Push Pausado"}
                      </button>
                    ) : browserPermission === "default" ? (
                      <button
                        type="button"
                        onClick={handleRequestBrowserPush}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 border border-[#141414] font-bold uppercase text-[10px] cursor-pointer"
                      >
                        Permitir Notificações
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        const nextSound = !prefs.soundEnabled;
                        updatePrefs((prev) => ({ ...prev, soundEnabled: nextSound }));
                        if (nextSound) playSubtleNotificationChime();
                      }}
                      className="px-3 py-1.5 border border-[#141414] bg-white dark:bg-stone-800 font-bold uppercase text-[10px] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {prefs.soundEnabled ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Som: Ativo</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                          <span>Som: Mudo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-300 dark:border-stone-700 flex flex-wrap items-center gap-3">
                  <span className="font-bold uppercase text-[10px] text-stone-600 dark:text-stone-400">
                    Categorias visíveis:
                  </span>
                  {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => {
                    const active = prefs.enabledCategories[cat] !== false;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          updatePrefs((prev) => ({
                            ...prev,
                            enabledCategories: {
                              ...prev.enabledCategories,
                              [cat]: !active
                            }
                          }))
                        }
                        className={`px-2.5 py-1 border text-[10px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer ${
                          active
                            ? "bg-[#141414] text-amber-300 border-[#141414]"
                            : "bg-stone-200 dark:bg-stone-800 text-stone-500 border-stone-400 line-through"
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                        <span>{CATEGORY_META[cat].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & Category Tabs Bar */}
            <div className="p-4 border-b border-stone-200 dark:border-[#2E2D28] space-y-3 bg-[#FAF9F5] dark:bg-[#1E1D1A]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar notificações por título ou conteúdo..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white dark:bg-[#141414] border border-[#141414] dark:border-stone-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] font-bold uppercase">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead(visibleNotifications, userId)}
                      className="px-3 py-2 bg-[#141414] text-amber-300 hover:bg-stone-800 border border-[#141414] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar Todas Lidas</span>
                    </button>
                  )}

                  {visibleNotifications.some((n) => n.lida) && (
                    <button
                      type="button"
                      onClick={() => clearReadNotifications(visibleNotifications, userId)}
                      className="px-3 py-2 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-red-50 dark:hover:bg-red-950/50 border border-[#141414] dark:border-stone-600 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                      <span>Limpar Lidas</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase">
                {[
                  { id: "todas" as const, label: `Todas (${visibleNotifications.length})` },
                  { id: "nao_lidas" as const, label: `Não lidas (${unreadCount})` },
                  { id: "alerta" as const, label: "Alertas" },
                  { id: "sistema" as const, label: "Sistema" },
                  { id: "noticia" as const, label: "Editorial" },
                  { id: "comunidade" as const, label: "Comunidade" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2.5 py-1 border cursor-pointer transition-colors ${
                      activeFilter === tab.id
                        ? "bg-[#141414] text-amber-300 border-[#141414]"
                        : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-[#141414]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <BellOff className="w-10 h-10 mx-auto text-stone-400" />
                  <p className="font-editorial text-lg font-bold text-stone-700 dark:text-stone-300">
                    Nenhuma notificação encontrada
                  </p>
                  <p className="font-mono text-xs text-stone-500">
                    Altere os filtros ou limpe o campo de busca para visualizar outros avisos.
                  </p>
                </div>
              ) : (
                filteredList.map(renderNotificationCard)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
