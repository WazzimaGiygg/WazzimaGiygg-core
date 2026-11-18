/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gerenciador de Permissões de Notificações Push do Navegador
 * e Alertas de Novos Artigos Publicados no Portal WazzimaGiygg / NotMediaWiki.
 */

export type PortalAlertChannel =
  | "wikiworldweb"
  | "materiadeensaio"
  | "academico"
  | "materia"
  | "uwgbooks"
  | "notmediawiki";

export const PORTAL_ALERT_CHANNEL_META: Record<
  PortalAlertChannel,
  { label: string; shortLabel: string; description: string }
> = {
  wikiworldweb: {
    label: "WikiWorldWeb (Notícias)",
    shortLabel: "Notícias",
    description: "Reportagens, atualizações editoriais e alertas de imprensa."
  },
  materiadeensaio: {
    label: "Matéria de Ensaio",
    shortLabel: "Ensaios",
    description: "Ensaios analíticos, opiniões e pareceres jurídicos."
  },
  academico: {
    label: "Acervo Acadêmico",
    shortLabel: "Acadêmico",
    description: "Artigos científicos, monografias e pesquisas revisadas."
  },
  materia: {
    label: "Matérias Didáticas",
    shortLabel: "Didáticas",
    description: "Materiais de referência e guias educacionais."
  },
  uwgbooks: {
    label: "UWG Books",
    shortLabel: "UWG Books",
    description: "Livros, compêndios e publicações da editora."
  },
  notmediawiki: {
    label: "NotMediaWiki",
    shortLabel: "NotMediaWiki",
    description: "Novos verbetes enciclopédicos e páginas principais."
  }
};

export interface PushSubscriptionPreferences {
  enabled: boolean;
  newArticlesEnabled: boolean;
  channels: Record<PortalAlertChannel, boolean>;
  promptDismissedAt?: number;
  updatedAt: number;
}

export interface BrowserPushStatus {
  supported: boolean;
  secureContext: boolean;
  isEmbeddedIframe: boolean;
  permission: NotificationPermission | "unsupported";
  preferences: PushSubscriptionPreferences;
  canTriggerPush: boolean;
}

export interface NewArticlePushPayload {
  id: string;
  title: string;
  summary?: string;
  collection: string;
  sector?: string;
  author?: string;
  isWiki?: boolean;
}

export interface RequestPushPermissionResult {
  granted: boolean;
  permission: NotificationPermission | "unsupported";
  reason: string;
}

const PUSH_PREFS_PREFIX = "wzzm_push_prefs_v1";
const SENT_ARTICLES_KEY = "wzzm_push_sent_articles_v1";
export const BROWSER_PUSH_EVENT = "wzzm:push-prefs-updated";

const DEFAULT_CHANNELS: Record<PortalAlertChannel, boolean> = {
  wikiworldweb: true,
  materiadeensaio: true,
  academico: true,
  materia: true,
  uwgbooks: true,
  notmediawiki: true
};

export const DEFAULT_PUSH_PREFERENCES: PushSubscriptionPreferences = {
  enabled: false,
  newArticlesEnabled: true,
  channels: { ...DEFAULT_CHANNELS },
  updatedAt: 0
};

function getPrefsStorageKey(userId?: string): string {
  return `${PUSH_PREFS_PREFIX}_${userId || "all"}`;
}

export function normalizePortalAlertChannel(collectionName?: string, isWiki?: boolean): PortalAlertChannel {
  if (isWiki) return "notmediawiki";
  const raw = (collectionName || "").toLowerCase().trim();
  if (raw === "materiadeensaio") return "materiadeensaio";
  if (raw === "academico") return "academico";
  if (raw === "materia") return "materia";
  if (raw === "uwgbooks") return "uwgbooks";
  if (raw === "notmediawiki" || raw === "wiki_articles") return "notmediawiki";
  return "wikiworldweb";
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) return "unsupported";
  try {
    return window.Notification.permission;
  } catch {
    return "unsupported";
  }
}

export function loadBrowserPushPreferences(userId?: string): PushSubscriptionPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PUSH_PREFERENCES, channels: { ...DEFAULT_CHANNELS } };
  }
  try {
    const raw =
      window.localStorage.getItem(getPrefsStorageKey(userId)) ||
      (userId && userId !== "all" ? window.localStorage.getItem(getPrefsStorageKey("all")) : null);
    if (!raw) {
      const perm = getBrowserNotificationPermission();
      return {
        ...DEFAULT_PUSH_PREFERENCES,
        enabled: perm === "granted",
        channels: { ...DEFAULT_CHANNELS }
      };
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : getBrowserNotificationPermission() === "granted",
      newArticlesEnabled: parsed.newArticlesEnabled !== false,
      channels: {
        ...DEFAULT_CHANNELS,
        ...(parsed.channels || {})
      },
      promptDismissedAt: typeof parsed.promptDismissedAt === "number" ? parsed.promptDismissedAt : undefined,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now()
    };
  } catch {
    return { ...DEFAULT_PUSH_PREFERENCES, channels: { ...DEFAULT_CHANNELS } };
  }
}

function emitBrowserPushChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BROWSER_PUSH_EVENT));
  }
}

export function saveBrowserPushPreferences(
  updates: Partial<PushSubscriptionPreferences>,
  userId?: string
): PushSubscriptionPreferences {
  const current = loadBrowserPushPreferences(userId);
  const next: PushSubscriptionPreferences = {
    ...current,
    ...updates,
    channels: {
      ...current.channels,
      ...(updates.channels || {})
    },
    updatedAt: Date.now()
  };

  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(next);
      window.localStorage.setItem(getPrefsStorageKey(userId), serialized);
      if (userId && userId !== "all") {
        window.localStorage.setItem(getPrefsStorageKey("all"), serialized);
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  emitBrowserPushChange();
  return next;
}

export function getBrowserPushStatus(userId?: string): BrowserPushStatus {
  const supported = isBrowserNotificationSupported();
  const permission = getBrowserNotificationPermission();
  const preferences = loadBrowserPushPreferences(userId);
  const secureContext = typeof window !== "undefined" ? Boolean(window.isSecureContext) : false;
  let isEmbeddedIframe = false;
  try {
    isEmbeddedIframe = typeof window !== "undefined" && window.self !== window.top;
  } catch {
    isEmbeddedIframe = true;
  }

  return {
    supported,
    secureContext,
    isEmbeddedIframe,
    permission,
    preferences,
    canTriggerPush: supported && permission === "granted" && preferences.enabled
  };
}

/**
 * Inscreve listener reativo para mudanças de preferência ou permissão no navegador.
 */
export function subscribeBrowserPushChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustom = () => onChange();
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PUSH_PREFS_PREFIX)) {
      onChange();
    }
  };

  window.addEventListener(BROWSER_PUSH_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);

  let permStatus: PermissionStatus | null = null;
  let cancelled = false;

  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        permStatus = status;
        permStatus.onchange = () => onChange();
      })
      .catch(() => {
        // Browser does not expose notifications in Permissions API
      });
  }

  return () => {
    cancelled = true;
    window.removeEventListener(BROWSER_PUSH_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
    if (permStatus) {
      permStatus.onchange = null;
    }
  };
}

/**
 * Solicita permissão de Notificações Push no navegador com tratamento de contexto seguro,
 * iframes e estados granted/denied/default.
 */
export async function requestBrowserPushPermission(options?: {
  userId?: string;
  sendConfirmation?: boolean;
}): Promise<RequestPushPermissionResult> {
  if (!isBrowserNotificationSupported()) {
    return {
      granted: false,
      permission: "unsupported",
      reason: "Este navegador não oferece suporte à API de Notificações Push."
    };
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      granted: false,
      permission: getBrowserNotificationPermission(),
      reason: "As notificações push exigem conexão segura (HTTPS ou localhost)."
    };
  }

  const currentPerm = getBrowserNotificationPermission();
  if (currentPerm === "denied") {
    saveBrowserPushPreferences({ enabled: false }, options?.userId);
    return {
      granted: false,
      permission: "denied",
      reason:
        "As notificações estão bloqueadas no navegador. Clique no ícone de cadeado/configurações na barra de endereço e altere Notificações para 'Permitir'."
    };
  }

  try {
    let result: NotificationPermission;
    if (window.Notification.requestPermission.length > 0) {
      result = await new Promise<NotificationPermission>((resolve) => {
        const ret = window.Notification.requestPermission((perm) => resolve(perm));
        if (ret && typeof (ret as Promise<NotificationPermission>).then === "function") {
          (ret as Promise<NotificationPermission>).then(resolve).catch(() => resolve("denied"));
        }
      });
    } else {
      result = await window.Notification.requestPermission();
    }

    if (result === "granted") {
      saveBrowserPushPreferences(
        { enabled: true, newArticlesEnabled: true },
        options?.userId
      );

      if (options?.sendConfirmation !== false) {
        try {
          const welcomeNotif = new window.Notification("WazzimaGiygg • Alertas Push Ativados", {
            body: "Você receberá notificações sempre que novos artigos forem publicados no portal.",
            icon: "/logo.png",
            badge: "/favicom.png",
            tag: "wzzm-push-welcome"
          });
          window.setTimeout(() => welcomeNotif.close(), 7000);
        } catch {
          // Ignore constructor constraints inside restricted iframes
        }
      }

      return {
        granted: true,
        permission: "granted",
        reason: "Notificações push ativadas para novos artigos publicados no portal."
      };
    }

    saveBrowserPushPreferences({ enabled: false }, options?.userId);
    return {
      granted: false,
      permission: result,
      reason:
        result === "denied"
          ? "Permissão negada. Você pode liberar as notificações nas configurações de privacidade do site no navegador."
          : "Solicitação de notificação dispensada antes da confirmação."
    };
  } catch {
    return {
      granted: false,
      permission: getBrowserNotificationPermission(),
      reason:
        "O navegador bloqueou a solicitação de notificação neste contexto (ex.: janela incorporada restrita). Abra o site em uma aba dedicada para autorizar."
    };
  }
}

export function toggleBrowserPushPause(enabled: boolean, userId?: string): PushSubscriptionPreferences {
  return saveBrowserPushPreferences({ enabled }, userId);
}

export function toggleNewArticleAlertsEnabled(
  newArticlesEnabled: boolean,
  userId?: string
): PushSubscriptionPreferences {
  return saveBrowserPushPreferences({ newArticlesEnabled }, userId);
}

export function togglePortalChannelAlert(
  channel: PortalAlertChannel,
  enabled: boolean,
  userId?: string
): PushSubscriptionPreferences {
  const current = loadBrowserPushPreferences(userId);
  return saveBrowserPushPreferences(
    {
      channels: {
        ...current.channels,
        [channel]: enabled
      }
    },
    userId
  );
}

export function dismissPushOptInBanner(userId?: string): void {
  saveBrowserPushPreferences({ promptDismissedAt: Date.now() }, userId);
}

function getAlreadyDispatchedArticleIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SENT_ARTICLES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markArticleAsDispatchedForPush(articleId: string): void {
  if (typeof window === "undefined" || !articleId) return;
  try {
    const existing = getAlreadyDispatchedArticleIds().filter((id) => id !== articleId);
    const next = [articleId, ...existing].slice(0, 150);
    window.localStorage.setItem(SENT_ARTICLES_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

export function hasArticleBeenDispatchedForPush(articleId: string): boolean {
  if (!articleId) return false;
  return getAlreadyDispatchedArticleIds().includes(articleId);
}

/**
 * Dispara uma notificação push nativa do navegador para um novo artigo publicado no portal,
 * respeitando a permissão do navegador, as preferências do usuário e deduplicação por ID.
 */
export function dispatchNewArticlePushNotification(
  article: NewArticlePushPayload,
  options?: {
    userId?: string;
    onClickNavigate?: (targetId: string, collection: string, isWiki?: boolean) => void;
  }
): boolean {
  const status = getBrowserPushStatus(options?.userId);
  if (!status.canTriggerPush || !status.preferences.newArticlesEnabled) {
    return false;
  }

  const channel = normalizePortalAlertChannel(article.collection, article.isWiki);
  if (status.preferences.channels[channel] === false) {
    return false;
  }

  if (article.id && hasArticleBeenDispatchedForPush(article.id)) {
    return false;
  }

  const channelMeta = PORTAL_ALERT_CHANNEL_META[channel];
  const cleanSummary = (article.summary || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  const bodyParts = [`Coleção: ${channelMeta.label}`];
  if (article.sector) bodyParts.push(`Setor: ${article.sector}`);
  if (cleanSummary) bodyParts.push(cleanSummary);

  try {
    const notif = new window.Notification(
      `Novo artigo em ${channelMeta.shortLabel}: ${article.title}`,
      {
        body: bodyParts.join(" • "),
        icon: "/logo.png",
        badge: "/favicom.png",
        tag: `wzzm-article-${article.id || Date.now()}`,
        requireInteraction: false
      }
    );

    if (article.id) {
      markArticleAsDispatchedForPush(article.id);
    }

    notif.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      if (article.id) {
        options?.onClickNavigate?.(article.id, article.collection, article.isWiki);
      }
      notif.close();
    };

    window.setTimeout(() => {
      try {
        notif.close();
      } catch {
        // ignore
      }
    }, 12000);

    return true;
  } catch {
    return false;
  }
}

/**
 * Envia uma notificação de teste imediata para o usuário validar os alertas no navegador.
 */
export function sendTestPushNotification(onOpenPortal?: () => void): boolean {
  if (!isBrowserNotificationSupported() || getBrowserNotificationPermission() !== "granted") {
    return false;
  }
  try {
    const notif = new window.Notification("WazzimaGiygg • Teste de Novo Artigo", {
      body: "Exemplo de alerta push para novas publicações nas coleções do portal e NotMediaWiki.",
      icon: "/logo.png",
      badge: "/favicom.png",
      tag: `wzzm-push-test-${Date.now()}`
    });
    notif.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      onOpenPortal?.();
      notif.close();
    };
    window.setTimeout(() => notif.close(), 8000);
    return true;
  } catch {
    return false;
  }
}
