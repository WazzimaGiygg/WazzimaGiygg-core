import crypto from 'crypto';
import net from 'net';
import type { NextFunction, Request, Response } from 'express';

export const FIREBASE_PROJECT_ID = 'wzzm-ce3fc';
export const AUTHORIZED_BUROCRATA_EMAIL = 'pedrohenriquecardonaperes@gmail.com';
export const AUTHORIZED_PUBLISHER_EMAILS = [
  'wazzimagiygg@gmail.com',
  'pedrohenriquecardonaperes@gmail.com',
] as const;

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  signInProvider?: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: VerifiedAuthUser;
}

// Cached Google public X.509 certs for Firebase ID Token verification
let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;
let certsFetchPromise: Promise<Record<string, string>> | null = null;
let testPublicCertsOverride: Record<string, string> | null = null;

/**
 * Strictly gated test hook (active ONLY when WZZM_SECURITY_TEST === '1')
 * so automated security tests can verify full RS256 cryptographic signature enforcement offline.
 */
export function setTestPublicCertsForSecurityTests(certs: Record<string, string> | null): void {
  if (process.env.WZZM_SECURITY_TEST !== '1') {
    throw new Error('Test cert override is strictly forbidden outside WZZM_SECURITY_TEST mode.');
  }
  testPublicCertsOverride = certs;
}

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  if (process.env.WZZM_SECURITY_TEST === '1' && testPublicCertsOverride) {
    return testPublicCertsOverride;
  }

  const now = Date.now();
  if (Object.keys(cachedCerts).length > 0 && now < certsExpiresAt) {
    return cachedCerts;
  }
  if (certsFetchPromise) {
    return certsFetchPromise;
  }

  certsFetchPromise = (async () => {
    try {
      const response = await fetch(FIREBASE_CERTS_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = (await response.json()) as Record<string, string>;
      const cacheControl = response.headers.get('cache-control') || '';
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
      const maxAgeSec = maxAgeMatch ? Math.min(Math.max(parseInt(maxAgeMatch[1], 10), 60), 86400) : 3600;
      cachedCerts = json;
      certsExpiresAt = Date.now() + maxAgeSec * 1000;
      return cachedCerts;
    } catch (err) {
      if (Object.keys(cachedCerts).length > 0) {
        return cachedCerts;
      }
      throw err;
    } finally {
      certsFetchPromise = null;
    }
  })();

  return certsFetchPromise;
}

function decodeBase64UrlToBuffer(segment: string): Buffer {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

function decodeBase64UrlJson<T = any>(segment: string): T {
  const raw = decodeBase64UrlToBuffer(segment).toString('utf8');
  return JSON.parse(raw) as T;
}

/**
 * Cryptographically verifies a Firebase Auth ID token (RS256) against Google's official X.509 certificates.
 * Validates signature, algorithm, key ID, audience, issuer, expiration, issued-at, and subject UID.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedAuthUser> {
  if (!idToken || typeof idToken !== 'string' || idToken.length > 8192) {
    throw new Error('Token inválido.');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato JWT inválido.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string; typ?: string }>(headerB64);
  const payload = decodeBase64UrlJson<Record<string, any>>(payloadB64);

  if (header.alg !== 'RS256' || !header.kid || typeof header.kid !== 'string') {
    throw new Error('Algoritmo ou identificador de chave inválido.');
  }

  const certs = await getFirebasePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    // Force refresh once in case keys rotated
    if (process.env.WZZM_SECURITY_TEST !== '1') {
      certsExpiresAt = 0;
      const refreshedCerts = await getFirebasePublicCerts();
      if (!refreshedCerts[header.kid]) {
        throw new Error('Chave pública do token não reconhecida.');
      }
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${headerB64}.${payloadB64}`);
      verifier.end();
      const sigBuf = decodeBase64UrlToBuffer(signatureB64);
      if (!verifier.verify(refreshedCerts[header.kid], sigBuf)) {
        throw new Error('Assinatura criptográfica do token inválida.');
      }
    } else {
      throw new Error('Chave pública de teste não encontrada.');
    }
  } else {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const sigBuf = decodeBase64UrlToBuffer(signatureB64);
    if (!verifier.verify(certPem, sigBuf)) {
      throw new Error('Assinatura criptográfica do token inválida.');
    }
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Audience (aud) do token inválida.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Emissor (iss) do token inválido.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Token expirado.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Data de emissão (iat) inválida.');
  }
  if (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + 300) {
    throw new Error('Tempo de autenticação inválido.');
  }
  if (typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 128) {
    throw new Error('UID (sub) do token inválido.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified === true;
  const signInProvider =
    typeof payload.firebase?.sign_in_provider === 'string'
      ? payload.firebase.sign_in_provider
      : undefined;

  return {
    uid: payload.sub.trim(),
    email,
    emailVerified,
    name: typeof payload.name === 'string' ? payload.name.trim() : undefined,
    signInProvider,
  };
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function isVerifiedBurocrata(user?: VerifiedAuthUser | null): boolean {
  if (!user || !user.emailVerified || !user.email) return false;
  return user.email.toLowerCase().trim() === AUTHORIZED_BUROCRATA_EMAIL;
}

export function isVerifiedPublisher(user?: VerifiedAuthUser | null): boolean {
  if (!user || !user.emailVerified || !user.email) return false;
  return AUTHORIZED_PUBLISHER_EMAILS.some((allowed) => allowed === user.email.toLowerCase().trim());
}

/**
 * Attaches req.authUser if a valid Bearer token is present; never rejects anonymous requests.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }
  try {
    (req as AuthenticatedRequest).authUser = await verifyFirebaseIdToken(token);
  } catch {
    // Leave authUser undefined for optional public routes
  }
  next();
}

/**
 * Requires a cryptographically verified Firebase Auth ID token.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Autenticação obrigatória (Bearer token ausente).' });
    return;
  }
  try {
    (req as AuthenticatedRequest).authUser = await verifyFirebaseIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}

/**
 * Requires verified Firebase Auth identity belonging to an authorized publisher account.
 */
export async function requirePublisher(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Autenticação obrigatória para publicação editorial.' });
    return;
  }
  try {
    const authUser = await verifyFirebaseIdToken(token);
    (req as AuthenticatedRequest).authUser = authUser;
    if (!isVerifiedPublisher(authUser)) {
      res.status(403).json({
        error:
          'Acesso negado: Qualquer publicação ou edição oficial exige conta verificada de publicador autorizado.',
      });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

/**
 * Requires verified Firebase Auth identity belonging strictly to the official Burocrata.
 */
export async function requireBurocrata(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Autenticação administrativa obrigatória.' });
    return;
  }
  try {
    const authUser = await verifyFirebaseIdToken(token);
    (req as AuthenticatedRequest).authUser = authUser;
    if (!isVerifiedBurocrata(authUser)) {
      res.status(403).json({
        error: 'Acesso negado: Operação restrita ao Burocrata oficial com e-mail verificado.',
      });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Credencial administrativa inválida ou expirada.' });
  }
}

/**
 * Constant-time verification against environment-configured elevation secret.
 * Never falls back to hardcoded secrets.
 */
export function verifyElevationSecret(inputPasskey: unknown): { configured: boolean; valid: boolean } {
  const expected = process.env.BUROCRATA_ELEVATION_SECRET?.trim();
  if (!expected) {
    return { configured: false, valid: false };
  }
  if (typeof inputPasskey !== 'string' || !inputPasskey.trim()) {
    return { configured: true, valid: false };
  }
  const expectedDigest = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const actualDigest = crypto.createHash('sha256').update(inputPasskey.trim(), 'utf8').digest();
  return {
    configured: true,
    valid: crypto.timingSafeEqual(expectedDigest, actualDigest),
  };
}

// ============================================
// CORS ALLOWLIST & SECURITY HEADERS
// ============================================

function getConfiguredAppOrigin(): string | null {
  const raw = process.env.APP_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin: string): boolean {
  if (!origin || typeof origin !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  const normalized = parsed.origin.toLowerCase();
  const exactAllowed = new Set<string>([
    'https://wazzimagiygg.com',
    'https://www.wazzimagiygg.com',
    'https://core.wazzimagiygg.com',
    'https://notmediawiki.wazzimagiygg.com',
    'https://bemtevi.wazzimagiygg.com',
    'https://support.wazzimagiygg.com',
  ]);

  const configuredOrigin = getConfiguredAppOrigin();
  if (configuredOrigin) {
    exactAllowed.add(configuredOrigin.toLowerCase());
  }

  if (exactAllowed.has(normalized)) {
    return true;
  }

  // Subdomains of official WazzimaGiygg, Vercel preview/prod, Cloud Run, AI Studio iframe
  if (parsed.protocol === 'https:') {
    const host = parsed.hostname.toLowerCase();
    if (
      host.endsWith('.wazzimagiygg.com') ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.run.app') ||
      host === 'aistudio.google.com' ||
      host.endsWith('.googleusercontent.com')
    ) {
      return true;
    }
  }

  // Development localhost allowlist
  if (process.env.NODE_ENV !== 'production') {
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol === 'http:' &&
      (host === 'localhost' || host === '127.0.0.1') &&
      (parsed.port === '3000' || parsed.port === '')
    ) {
      return true;
    }
  }

  return false;
}

export function createCorsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    res.setHeader('Vary', 'Origin');

    if (origin) {
      if (isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '600');
      } else if (req.method === 'OPTIONS' || req.path.startsWith('/api/')) {
        res.status(403).json({ error: 'Origem não autorizada pela política CORS.' });
        return;
      }
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}

export function createSecurityHeadersMiddleware(isDev: boolean) {
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com"
    : "'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com";

  const connectSrc = isDev
    ? "'self' ws: wss: http://localhost:* https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.github.com https://api.ipify.org"
    : "'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.github.com https://api.ipify.org";

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://wzzm-ce3fc.firebaseapp.com https://accounts.google.com https://*.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.googleusercontent.com",
  ].join('; ');

  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Content-Security-Policy', csp);

    if (!isDev || req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}

// ============================================
// SAFE CLIENT IP & RATE LIMITING
// ============================================

/**
 * Extracts validated client IP using Express trust proxy configuration (app.set('trust proxy', 1))
 * rather than blindly reading arbitrary X-Forwarded-For headers.
 */
export function getSafeClientIp(req: Request): string {
  const raw = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const cleaned = raw.replace(/^::ffff:/, '').trim();
  return net.isIP(cleaned) !== 0 ? cleaned : '127.0.0.1';
}

export function maskIpForDisplay(ip: string): string {
  const cleaned = (ip || '').replace(/^::ffff:/, '').trim();
  if (net.isIPv4(cleaned)) {
    const parts = cleaned.split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  if (net.isIPv6(cleaned)) {
    const parts = cleaned.split(':');
    return `${parts.slice(0, 2).join(':')}:xxxx:xxxx`;
  }
  return 'não-registrado';
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
}

const rateBuckets = new Map<string, number[]>();

export function resetRateLimitBucketsForTests(): void {
  if (process.env.WZZM_SECURITY_TEST === '1') {
    rateBuckets.clear();
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix, message = 'Muitas requisições. Aguarde antes de tentar novamente.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const cutoff = now - windowMs;
    const ip = getSafeClientIp(req);
    const key = `${keyPrefix}:${ip}`;

    // Memory-exhaustion guard
    if (rateBuckets.size > 5000) {
      for (const [k, stamps] of rateBuckets.entries()) {
        const recent = stamps.filter((t) => t > cutoff);
        if (recent.length === 0) {
          rateBuckets.delete(k);
        } else {
          rateBuckets.set(k, recent);
        }
      }
      if (rateBuckets.size > 5000) {
        rateBuckets.clear();
      }
    }

    const timestamps = (rateBuckets.get(key) || []).filter((t) => t > cutoff);
    if (timestamps.length >= max) {
      const oldest = timestamps[0] || now;
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', '0');
      res.status(429).json({ error: message, retryAfterSeconds: retryAfterSec });
      return;
    }

    timestamps.push(now);
    rateBuckets.set(key, timestamps);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - timestamps.length)));
    next();
  };
}

// ============================================
// VALIDATION & SANITIZATION HELPERS
// ============================================

export function escapeHtml(unsafe: unknown): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeHttpUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidEmail(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.length < 3 || trimmed.length > 200) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function isValidId(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  return raw.length >= 1 && raw.length <= 128 && /^[a-zA-Z0-9_\-:.]+$/.test(raw);
}

export function clampString(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, maxLen);
}

export function sanitizePlainObject<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => sanitizePlainObject(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input as Record<string, any>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = sanitizePlainObject(v);
    }
    return out as T;
  }
  return input;
}
