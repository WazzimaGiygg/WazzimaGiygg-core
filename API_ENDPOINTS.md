# WazzimaGiygg API Routes & Static Fallback Architecture

This document catalogs every `/api/*` endpoint handled by the Express server (`server.ts`) and the exact static/client-side fallback paths used automatically when the app is deployed as a static bundle (`npm run build` / `dist/`) without Node.js running.

---

## 1. Runtime Backend Detection & Zero-404 Guard

All frontend API requests pass through `isBackendApiAvailable()` and `safeApiFetch()` (`src/utils/apiClient.ts`, re-exported from `src/firebase.ts`):

1. **Single Health Probe**: `isBackendApiAvailable()` makes a single `GET /api/health` request (cached for 60 seconds) and checks both `res.ok`, `Content-Type: application/json`, and `json.status === "ok"`.
2. **Dynamic Full-Stack Mode** (`npm run dev` / `npm start` / `tsx server.ts`): When Express responds with JSON `{ status: "ok" }`, `safeApiFetch()` routes requests to the Express endpoints below. Unmapped `/api/*` routes hit the `app.all('/api/*', ...)` JSON 404 handler in `server.ts` so they never fall through to `index.html`.
3. **Static SPA / CDN Mode** (e.g., static preview or Firebase Hosting without `server.ts`): When `/api/health` fails or returns HTML/404, `safeApiFetch()` short-circuits cleanly and returns `null` without firing additional `/api/*` network requests, routing operations to Firebase Firestore, bundled JSON assets, or `localStorage`.

---

## 2. Express Endpoints & Static Fallback Matrix

### A. Portal Health, Menu & Editorial Collections
| Endpoint | Methods | Purpose | Static / Client Fallback Path |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Express & Firestore cluster status check | Client reports `{ status: "static", database: { provider: "Firebase Firestore", projectId: "wzzm-ce3fc" } }` |
| `/api/menu` | `GET` | Portal navigation links & tools | `src/data/menu.json` |
| `/api/news` | `GET` | Curated portal news feed | `src/data/noticias.json` |
| `/api/academic` | `GET` | Curated academic subjects catalog | `src/data/json/artigos.json` |
| `/api/sanctions` | `GET` | Sanctioned cities & compliance audit list | `getStaticSanctionsFallback()` (`src/data/cidades_sancionadas.json`) |
| `/api/articles` | `GET`, `POST` | Query/create articles across `wikiworldweb`, `academico`, `materiadeensaio`, `uwgbooks`, `materia`, `all` | Direct Firestore collection query (`db/<collection>`) -> `getStaticCollectionArticles()` (`noticias.json`, `artigos.json`, curated defaults) |
| `/api/articles/:id` | `GET`, `PUT`, `DELETE` | Read, update, or remove individual article | Direct Firestore document write/read; static seed fallback |
| `/api/stats` | `GET` | Aggregated article, user, ticket, and message counts | Computed client-side from loaded collections |

### B. Support Tickets, Chat & Forensic Logs
| Endpoint | Methods | Purpose | Static / Client Fallback Path |
| :--- | :--- | :--- | :--- |
| `/api/jsonbin/messages` | `GET`, `PUT` | Community chat channel sync (JSONBin-compatible shape) | `localStorage` (`wzzm_chat_messages`) |
| `/api/tickets` | `GET`, `POST` | Contact, LGPD & Marco Civil support tickets | Firestore collection `tickets` + `localStorage` (`wzzm_tickets`) |
| `/api/tickets/:id` | `PUT`, `DELETE` | Admin status updates & cleanup | `localStorage` (`wzzm_tickets`) + local React state |
| `/api/logs` | `POST` | Audit & access telemetry logging | Direct Firestore collection `checkuser` (via `registerAuditLog`) |

### C. Administration & LGPD Compliance
| Endpoint | Methods | Purpose | Static / Client Fallback Path |
| :--- | :--- | :--- | :--- |
| `/api/admin/elevate` | `POST` | Bureaucrat master passkey elevation | Verified against authorized bureaucrat account + Firestore `users` |
| `/api/admin/users` | `GET`, `POST` | User directory & manual account creation | Firestore `users` (when signed in as authorized publisher) + `localStorage` (`wzzm_local_session_profile`) |
| `/api/admin/users/:uid/toggle-admin` | `PUT` | Toggle admin/bureaucrat flag | Direct Firestore update on `users/{uid}` and `usuários/{uid}` |
| `/api/admin/users/:uid/toggle-ban` | `PUT` | Toggle ban status & reason | Direct Firestore update on `users/{uid}` and `usuários/{uid}` |
| `/api/admin/users/:uid/toggle-teacher` | `PUT` | Toggle educator/teacher role | Direct Firestore update on `users/{uid}` and `usuários/{uid}` |
| `/api/admin/users/:uid` | `DELETE` | Remove user record | Direct Firestore update (`isDeleted: true`) |
| `/api/admin/articles/:id` | `DELETE` | Administrative article removal | Direct Firestore `deleteDoc(doc(db, collection, id))` |
| `/api/admin/sanctions`, `/api/admin/sanctions/:index` | `POST`, `DELETE` | Manage sanctioned cities list | `localStorage` (`wzzm_sanctions_override`) + `cidades_sancionadas.json` |
| `/api/admin/deletion-requests`, `/api/admin/deletion-requests/:id` | `GET`, `PUT` | LGPD deletion workflow | Direct Firestore `deletion_requests` |
| `/api/admin/costs`, `/api/admin/costs/:id` | `GET`, `POST`, `DELETE` | Transparency cost records | `INITIAL_COSTS` (`src/data/ferramentasData.ts`) |
| `/api/admin/redirects`, `/api/admin/redirects/:id` | `GET`, `POST`, `DELETE` | Internal link redirects | `INITIAL_REDIRECTS` (`src/data/ferramentasData.ts`) |
| `/api/admin/forum`, `/api/admin/forum/:id/toggle`, `/api/admin/forum/:id` | `GET`, `POST`, `PUT`, `DELETE` | Forum governance topics | `INITIAL_FORUM_TOPICS` (`src/data/ferramentasData.ts`) |
| `/api/admin/surveys` | `GET`, `POST` | Research surveys & investigative reports | `INITIAL_SURVEYS` (`src/data/ferramentasData.ts`) |
| `/api/admin/blog` | `GET`, `POST` | Official editorial blog posts | `INITIAL_BLOG_POSTS` (`src/data/ferramentasData.ts`) |
| `/api/admin/pages` | `GET` | Site pages directory | `SITE_PAGES_DIRECTORY` (`src/data/ferramentasData.ts`) |

### D. NotMediaWiki Content & Extensions Engine
| Endpoint | Methods | Purpose | Static / Client Fallback Path |
| :--- | :--- | :--- | :--- |
| `/api/v1/content/articles`, `/api/v1/content/articles/:slug` | `GET`, `POST`, `DELETE` | Wiki articles CRUD | Firestore `wiki_articles` + `SEED_WIKI_ARTICLES` + `localStorage` (`wzzm_wiki_articles`) |
| `/api/v1/content/articles/:slug/rendered` | `GET` | Server-rendered Wikitext HTML | Client-side `parseWikitextToHtml()` |
| `/api/v1/content/stats` | `GET` | Wiki stats summary | Computed from loaded wiki articles |
| `/api/v1/parsoid/parse` | `POST` | Wikitext to HTML parser | Client-side `parseWikitextToHtml()` |
| `/api/v1/revisions/article/:slug`, `/api/v1/revisions/diff/:fromRevId/:toRevId`, `/api/v1/revisions/:slug/rollback` | `GET`, `POST` | Revision history, diff & rollback | Firestore `wiki_revisions` + `computeWikitextDiff()` |
| `/api/v1/events/history` | `GET` | Editorial audit event log | Firestore `wiki_events` |
| `/api/v1/extensions`, `/api/v1/extensions/:id`, `/api/v1/extensions/:id/toggle`, `/api/v1/extensions/:id/config`, `/api/v1/extensions/:id/quarantine`, `/api/v1/extensions/catalog`, `/api/v1/extensions/catalog/add`, `/api/v1/extensions/security/scan`, `/api/v1/extensions/security/sync`, `/api/v1/domains` | `GET`, `POST`, `PUT`, `DELETE` | Zero-trust wiki extensions & malware scanner | `SEED_WIKI_EXTENSIONS` + `EXISTING_EXTENSIONS_CATALOG` + Firestore (`wiki_extensions`, `extensions_integrity_registry`) + `localStorage` (`wzzm_extensions_state`, `wzzm_extensions_config_overrides`) + client `scanExtensionCodeForMalware()` |

### E. Bem-Te-Vi Social Network
| Endpoint | Methods | Purpose | Static / Client Fallback Path |
| :--- | :--- | :--- | :--- |
| `/api/bemtevi/posts`, `/api/bemtevi/posts/:id` | `GET`, `POST`, `PUT`, `DELETE` | Social posts feed, 127-char validation, `#hashtag` extraction, edits & article shares | Firestore `bemtevi_posts` + `localStorage` (`wzzm_bemtevi_posts`, `wzzm_bemtevi_deleted_posts`) + `SEED_BEMTEVI_POSTS` |
| `/api/bemtevi/posts/:id/like` | `POST` | Toggle like & counter | Firestore `bemtevi_posts` + `localStorage` (`wzzm_bemtevi_posts`) |
| `/api/bemtevi/posts/:postId/comments` | `GET`, `POST` | Post comments | Firestore `bemtevi_comments` + `localStorage` (`wzzm_bemtevi_comments_<postId>`) |
| `/api/bemtevi/communities`, `/api/bemtevi/communities/:id/join` | `GET`, `POST` | Communities & membership | Firestore `bemtevi_communities` + `localStorage` (`wzzm_bemtevi_communities`) |
| `/api/bemtevi/trending` | `GET` | Dynamic trending hashtags | Computed client-side via `computeTrendingTopicsFromDbPosts()` |
| `/api/bemtevi/users` | `GET` | Community member directory | Firestore `users` (if authorized) + post-author derivation |
| `/api/bemtevi/messages` | `GET`, `POST` | Direct messages | Firestore `bemtevi_messages` (authenticated participant) + `localStorage` (`wzzm_bemtevi_messages`) |

### F. Security IP / VPN Verification & Gemini AI
| Endpoint | Methods | Purpose | Static / Client Fallback Path |
| :--- | :--- | :--- | :--- |
| `/api/auth/check-wikimedia-ip` | `GET` | Verify if IP belongs to Wikimedia AS14907 | Client-side `getClientIp()` + `checkIfWikimediaIp()` (`src/wiki/utils/wikimediaIpChecker.ts`) |
| `/api/security/check-vpn` | `GET` | Detect VPN / Proxy / Tor / Datacenter IPs (`?ip=` optional) | Client-side `getClientIp()` + `evaluateIpLocally()` (`src/wiki/utils/vpnChecker.ts`) |
| `/api/gemini/status` | `GET` | Check server `GEMINI_API_KEY` availability | Reports unconfigured/offline status cleanly |
| `/api/gemini/chat` | `POST` | Wiki assistant chat via `@google/genai` | Informs user that server-side Express proxy is required |
| `/api/gemini/generate-article` | `POST` | Generate Wikitext article via `@google/genai` | Returns clear offline message (requires `server.ts` + `GEMINI_API_KEY`) |
| `/api/gemini/generate-collection` | `POST` | Generate collection metadata via `@google/genai` | Returns clear offline message (requires `server.ts` + `GEMINI_API_KEY`) |
| `/api/gemini/notebook-synthesize` | `POST` | Synthesize notebook sources via `@google/genai` | Returns clear offline message (requires `server.ts` + `GEMINI_API_KEY`) |
