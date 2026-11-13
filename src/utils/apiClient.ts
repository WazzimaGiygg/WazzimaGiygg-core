/**
 * Lightweight API availability probe and safe fetch wrapper.
 * Probes /api/health once (cached 60s) so static SPA deployments (without server.ts)
 * gracefully switch to Firestore/local/static fallbacks without repeated 404 console errors.
 */

let backendApiCache: { available: boolean; checkedAt: number } | null = null;
let backendProbePromise: Promise<boolean> | null = null;

export async function isBackendApiAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  if (backendApiCache && now - backendApiCache.checkedAt < 60000) {
    return backendApiCache.available;
  }
  if (backendProbePromise) {
    return backendProbePromise;
  }

  backendProbePromise = (async () => {
    try {
      const res = await fetch("/api/health", {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const json = await res.json().catch(() => null);
        const available = Boolean(json && json.status === "ok");
        backendApiCache = { available, checkedAt: Date.now() };
        return available;
      }
      backendApiCache = { available: false, checkedAt: Date.now() };
      return false;
    } catch {
      backendApiCache = { available: false, checkedAt: Date.now() };
      return false;
    } finally {
      backendProbePromise = null;
    }
  })();

  return backendProbePromise;
}

export async function safeApiFetch(url: string, options?: RequestInit): Promise<Response | null> {
  const available = await isBackendApiAvailable();
  if (!available) return null;
  try {
    return await fetch(url, options);
  } catch {
    return null;
  }
}
