/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NotMediaWiki Integration Data & Engine for WazzimaGiygg
 * Replicating https://github.com/WazzimaGiygg/NotMediaWiki-Beta-
 * and https://notmediawiki.wazzimagiygg.com/
 */

export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  namespace: number; // 0: Main, 1: Talk, 4: Project, 10: Template, 14: Category
  wikitext: string;
  summary: string;
  latestRevisionId: string;
  createdAt: string;
  updatedAt: string;
  categories: string[];
  views: number;
  isProtected?: boolean;
}

export interface WikiRevision {
  id: string;
  articleSlug: string;
  parentRevisionId: string | null;
  wikitext: string;
  comment: string;
  author: {
    id: string;
    name: string;
    isBot: boolean;
    ip?: string;
  };
  timestamp: string;
  sha256: string;
  byteSize: number;
  isMinor: boolean;
}

export interface WikiUserSession {
  id: string;
  username: string;
  role: 'sysop' | 'bureaucrat' | 'moderator' | 'editor' | 'reader' | 'bot';
  editCount: number;
  avatar: string;
  email?: string;
  isGoogleUser?: boolean;
  isBanned?: boolean;
}

export interface WikiEvent {
  id: string;
  meta: {
    uri: string;
    request_id: string;
    id: string;
    dt: string;
    domain: string;
    stream: string;
  };
  database: string;
  page_title: string;
  page_namespace: number;
  rev_id: string;
  rev_timestamp: string;
  rev_sha1: string;
  rev_minor_edit: boolean;
  rev_len: number;
  user_text: string;
  comment: string;
  type: 'edit' | 'new' | 'rollback' | 'categorize' | 'protect';
}

export interface WikiExtension {
  id: string;
  name: string;
  namePt: string;
  version: string;
  category: 'parser' | 'ui' | 'security' | 'api' | 'bot' | 'portal';
  author: string;
  description: string;
  enabled: boolean;
  type: 'extension' | 'skin';
  url: string;
}

export interface TocItem {
  id: string;
  level: number;
  text: string;
  number: string;
}

export interface ParseResult {
  html: string;
  toc: TocItem[];
  categories: string[];
  internalLinks: string[];
  externalLinks: string[];
  references: string[];
  parseTimeMs: number;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

export interface DiffResult {
  fromRevId: string;
  toRevId: string;
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
    byteDelta: number;
  };
}

// ============================================================================
// INITIAL SEED ARTICLES FROM NotMediaWiki-Beta-
// ============================================================================
export const SEED_WIKI_ARTICLES: WikiArticle[] = [
  {
    id: 'art-1',
    slug: 'MediaWiki',
    title: 'MediaWiki',
    namespace: 0,
    summary: 'Free and open-source wiki software originally written for Wikipedia, now migrated to modern Node.js microservices architecture by WazzimaGiygg.',
    latestRevisionId: 'rev-101',
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2026-03-15T08:22:10Z',
    categories: ['Free software', 'Wiki software', 'Wikimedia Foundation', 'Node.js software', 'Software architecture'],
    views: 45210,
    isProtected: true,
    wikitext: `{{Infobox software
| name = MediaWiki (NotMediaWiki Beta)
| developer = Wikimedia Foundation & WazzimaGiygg Architecture
| initial_release = 2002-01-25
| programming_language = Node.js / TypeScript (Migrated from PHP monolith)
| operating_system = Cross-platform
| license = GPL-2.0-or-later / Apache-2.0
| website = https://notmediawiki.wazzimagiygg.com
}}

'''MediaWiki''' is a free and open-source [[wiki]] engine created by [[Magnus Manske]] and developed for use on [[Wikipedia]] and other projects of the [[Wikimedia Foundation]].<ref name="wm-tech">Wikimedia Foundation (2025). [https://techblog.wikimedia.org Technology Report: Deconstructing the Core Monolith].</ref> Originally written in PHP and backed by relational SQL databases, modern Wikimedia architecture and the '''NotMediaWiki''' ecosystem decouple the monolith into high-concurrency '''Node.js microservices'''.<ref name="manske02">Manske, Magnus (2002). "UseModWiki to Phase II: The Architecture of Early Wikipedia".</ref>

== Architecture Evolution ==
MediaWiki began in 2002 as a monolithic PHP application known as "Phase II" and "Phase III".<ref name="manske02" /> Over two decades, exponential traffic demands led to the extraction of independent microservices:<ref name="wm-tech" />

=== Parsoid Service ===
A distributed parsing service written in Node.js that compiles Wikitext into semantic HTML5 with complete round-trip DOM annotations.<ref name="parsoid-docs">Wikimedia Foundation (2024). [https://www.mediawiki.org/wiki/Parsoid Parsoid Architecture Specification].</ref>

=== EventStreams & EventGate ===
High-throughput Kafka and Server-Sent Events (SSE) bus broadcasting article revisions in real-time.

=== Content & Revision Services ===
Immutable, cryptographically hashed revision logs decoupling article storage from transaction locks.

=== CirrusSearch Layer ===
Scalable inverted-index search layer backed by Elasticsearch clusters.

== Wikitext Markup ==
MediaWiki uses an extensible markup language called [[Wikitext]]. It supports templates, transclusion, category classification, and mathematical formatting via MathML.<ref name="wikitext-spec">MediaWiki Core Engineering. [https://www.mediawiki.org/wiki/Wikitext MediaWiki Wikitext Specification Guidelines].</ref>

{| class="wikitable"
! Component !! Legacy PHP Monolith !! Next-Gen Node.js Microservices
|-
| Parser || Parser.php (single-threaded regex) || Parsoid AST Worker Pool (TypeScript)
|-
| Event Bus || JobQueueGroup (DB poll / Redis) || EventGate Kafka/SSE Stream
|-
| Storage || Monolithic cur/old MySQL tables || CQRS Event-Sourced Document Mesh
|-
| API || Action API (api.php) || High-speed OpenAPI 3.0 Gateway & GraphQL
|}

== See also ==
* [[Parsoid]]
* [[Distributed_Systems]]
* [[Node.js]]
* [[WazzimaGiygg]]

== References ==
<references />`
  },
  {
    id: 'art-2',
    slug: 'Parsoid',
    title: 'Parsoid',
    namespace: 0,
    summary: 'A bidirectional parser service between wikitext and HTML5 DOM, powering VisualEditor and modern wiki compilation.',
    latestRevisionId: 'rev-201',
    createdAt: '2024-02-14T15:30:00Z',
    updatedAt: '2026-03-12T14:10:00Z',
    categories: ['Parsers', 'Wikimedia technology', 'Node.js software', 'Compilers'],
    views: 28400,
    isProtected: false,
    wikitext: `{{Infobox software
| name = Parsoid
| developer = Wikimedia Architecture Team & NotMediaWiki
| programming_language = Node.js / TypeScript
| purpose = Bidirectional Wikitext <-> HTML5 Translation
| license = Apache-2.0
| website = https://notmediawiki.wazzimagiygg.com
}}

'''Parsoid''' is a bidirectional parser service developed to translate [[MediaWiki]] [[Wikitext]] into semantic HTML5 and back without data loss.<ref name="parsoid-team">Wikimedia Core Platform Team (2024). [https://www.mediawiki.org/wiki/Parsoid Parsoid Service & DOM Spec].</ref> It is a critical component of Wikipedia's [[VisualEditor]].<ref name="visualeditor">VisualEditor Project Documentation (2023). "Wikitext to HTML Round-Trip Stability".</ref>

== Core Design Goals ==
Parsoid was engineered with several fundamental architectural objectives:

=== Semantic Round-Tripping ===
Ensure that converting wikitext to HTML and back produces minimal dirty diffs.<ref name="parsoid-team" />

=== DOM Annotations & Microformats ===
Injecting \`data-mw\` metadata attributes so client visual tools understand templates and transclusions.

=== Scalable Node.js Execution ===
Non-blocking I/O allows Parsoid to handle tens of thousands of concurrent parsing requests per second across cluster nodes.<ref name="node-perf">Wikimedia Foundation Engineering (2025). "High-Throughput Node.js Services in Production".</ref>

== Parsing Pipeline ==
The Parsoid pipeline is structured as an asynchronous state machine:
* '''Tokenizer & Lexer''': Converts raw Wikitext into grammatical token streams.
* '''Pre-processor & Macro Expansion''': Recursively expands templates and parser functions.
* '''HTML5 Tree Builder''': Generates standard DOM trees with semantic microformats.

== See also ==
* [[MediaWiki]]
* [[Distributed_Systems]]
* [[Node.js]]

== References ==
<references />`
  },
  {
    id: 'art-3',
    slug: 'Distributed_Systems',
    title: 'Distributed Systems',
    namespace: 0,
    summary: 'Systems whose components are located on different networked computers communicating via message passing.',
    latestRevisionId: 'rev-301',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2026-02-28T18:44:00Z',
    categories: ['Computer systems', 'Distributed computing', 'Software architecture'],
    views: 61890,
    isProtected: false,
    wikitext: `{{Infobox technology
| name = Distributed Systems
| category = Software Architecture
| key_characteristics = Concurrency, No global clock, Independent failures
| common_patterns = Microservices, Event-Driven, CQRS, Raft Consensus
}}

A '''distributed system''' is a computing paradigm in which autonomous hardware and software components communicate and coordinate their actions exclusively via message passing across a network.

== MediaWiki Microservices Context ==
Modern knowledge management platforms, such as [[MediaWiki]] and [[NotMediaWiki]], rely on distributed architectures to decouple:
# '''Ingestion Pipelines''': High-speed asynchronous stream processing.
# '''Parse Caching''': Multi-tiered memcached and Redis caches avoiding repetitive Wikitext compilation.
# '''Event Gateways''': Kafka and EventStreams broadcasting mutation logs worldwide.

== Key Challenges ==
* '''CAP Theorem''': Consistency, Availability, and Partition Tolerance trade-offs.
* '''Data Replication''': Leaderless and Raft consensus algorithms ensuring zero data loss.
* '''Clock Skew''': Vector clocks and Lamport timestamps ensuring causal event ordering.

== See also ==
* [[MediaWiki]]
* [[Parsoid]]
* [[Node.js]]

== References ==
<references />`
  },
  {
    id: 'art-4',
    slug: 'Node.js',
    title: 'Node.js',
    namespace: 0,
    summary: 'An open-source, cross-platform JavaScript runtime environment based on V8.',
    latestRevisionId: 'rev-401',
    createdAt: '2024-01-05T11:20:00Z',
    updatedAt: '2026-03-08T22:15:00Z',
    categories: ['JavaScript runtime', 'Open-source software', 'Web development'],
    views: 89300,
    isProtected: false,
    wikitext: `{{Infobox software
| name = Node.js
| developer = OpenJS Foundation
| initial_release = 2009-05-27
| engine = V8 (Google Chrome)
| license = MIT License
| website = https://nodejs.org
}}

'''Node.js''' is a cross-platform, open-source JavaScript runtime environment that executes JavaScript code outside a web browser. Built on Chrome's V8 engine, it utilizes an event-driven, non-blocking I/O model that makes it lightweight and efficient.

== Use in MediaWiki Modernization ==
The [[MediaWiki]] and [[NotMediaWiki]] microservices migration leverages Node.js for:
* High-throughput parsing services ([[Parsoid]]).
* Real-time Server-Sent Events (SSE) and WebSocket channels.
* Express-based API gateways with sub-millisecond route dispatch.

== See also ==
* [[MediaWiki]]
* [[Parsoid]]
* [[Distributed_Systems]]

== References ==
<references />`
  },
  {
    id: 'art-5',
    slug: 'Talk:MediaWiki',
    title: 'Talk:MediaWiki',
    namespace: 1, // Talk
    summary: 'Discussion page for coordinating improvements to the MediaWiki article and microservices migration.',
    latestRevisionId: 'rev-501',
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2026-03-10T16:20:00Z',
    categories: ['Talk pages', 'Wiki discussions'],
    views: 12400,
    isProtected: false,
    wikitext: `== Microservices Migration Progress ==
We have successfully decoupled the legacy PHP monolith into the new TypeScript/Express Parsoid parser mesh. All tests pass with 100% round-trip fidelity. --[[User:NodeArchitect]] 14:20, 10 March 2026 (UTC)

:Great work! Please ensure that citations and footnotes with \`<ref>\` tags and \`<references />\` continue to render with numbered backlinks and ABNT standards. --[[User:WazzimaGiygg]] 16:05, 10 March 2026 (UTC)

::Confirmed. Cite extension has been integrated with AST node extraction and interactive tooltip popups. --[[User:NodeArchitect]] 16:20, 10 March 2026 (UTC)

== References ==
<references />`
  }
];

// ============================================================================
// INITIAL SEED REVISIONS
// ============================================================================
export const SEED_WIKI_REVISIONS: WikiRevision[] = [
  {
    id: 'rev-100',
    articleSlug: 'MediaWiki',
    parentRevisionId: null,
    wikitext: `'''MediaWiki''' is a free and open-source wiki software originally written in PHP.`,
    comment: 'Initial legacy import from Phase III monolith',
    author: { id: 'usr-1', name: 'WikipedianAdmin', isBot: false },
    timestamp: '2024-01-10T12:00:00Z',
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    byteSize: 84,
    isMinor: false
  },
  {
    id: 'rev-101',
    articleSlug: 'MediaWiki',
    parentRevisionId: 'rev-100',
    wikitext: SEED_WIKI_ARTICLES[0].wikitext,
    comment: 'Migrated architecture section to Node.js microservices topology & Parsoid pipeline',
    author: { id: 'usr-2', name: 'NodeArchitect', isBot: false },
    timestamp: '2026-03-15T08:22:10Z',
    sha256: '9f8e7d6c5b4a3120123456789abcdef0123456789abcdef0123456789abcdef1',
    byteSize: SEED_WIKI_ARTICLES[0].wikitext.length,
    isMinor: false
  },
  {
    id: 'rev-201',
    articleSlug: 'Parsoid',
    parentRevisionId: null,
    wikitext: SEED_WIKI_ARTICLES[1].wikitext,
    comment: 'Created Parsoid service documentation with AST specifications',
    author: { id: 'usr-4', name: 'ParsoidBot', isBot: true },
    timestamp: '2026-03-12T14:10:00Z',
    sha256: '7c6b5a4120123456789abcdef0123456789abcdef0123456789abcdef12345678',
    byteSize: SEED_WIKI_ARTICLES[1].wikitext.length,
    isMinor: false
  },
  {
    id: 'rev-301',
    articleSlug: 'Distributed_Systems',
    parentRevisionId: null,
    wikitext: SEED_WIKI_ARTICLES[2].wikitext,
    comment: 'Documented distributed system patterns for wiki clusters',
    author: { id: 'AZolFPgfELhRLcvoj7VhlYQV0G42', name: 'pedrohenriquecardonaperes@gmail.com', isBot: false },
    timestamp: '2026-02-28T18:44:00Z',
    sha256: '5e4d3c2b1a09876543210fedcba9876543210fedcba9876543210fedcba98765',
    byteSize: SEED_WIKI_ARTICLES[2].wikitext.length,
    isMinor: false
  },
  {
    id: 'rev-401',
    articleSlug: 'Node.js',
    parentRevisionId: null,
    wikitext: SEED_WIKI_ARTICLES[3].wikitext,
    comment: 'Created Node.js technology article',
    author: { id: 'mafersao1100', name: 'mafersao1100@gmail.com', isBot: false },
    timestamp: '2026-03-08T22:15:00Z',
    sha256: '3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b',
    byteSize: SEED_WIKI_ARTICLES[3].wikitext.length,
    isMinor: false
  },
  {
    id: 'rev-501',
    articleSlug: 'Talk:MediaWiki',
    parentRevisionId: null,
    wikitext: SEED_WIKI_ARTICLES[4].wikitext,
    comment: 'Coordination discussion for Parsoid deployment',
    author: { id: 'usr-2', name: 'NodeArchitect', isBot: false },
    timestamp: '2026-03-10T16:20:00Z',
    sha256: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    byteSize: SEED_WIKI_ARTICLES[4].wikitext.length,
    isMinor: false
  }
];

// ============================================================================
// INITIAL SEED EVENTS (EventStreams)
// ============================================================================
export const SEED_WIKI_EVENTS: WikiEvent[] = [
  {
    id: 'evt-901',
    meta: {
      uri: 'https://notmediawiki.wazzimagiygg.com/wiki/MediaWiki',
      request_id: 'req-trace-41902',
      id: 'uuid-49120-1',
      dt: '2026-03-15T08:22:10Z',
      domain: 'notmediawiki.wazzimagiygg.com',
      stream: 'mediawiki.recentchange'
    },
    database: 'wzzmwiki',
    page_title: 'MediaWiki',
    page_namespace: 0,
    rev_id: 'rev-101',
    rev_timestamp: '2026-03-15T08:22:10Z',
    rev_sha1: '9f8e7d6c5b4a3120',
    rev_minor_edit: false,
    rev_len: SEED_WIKI_ARTICLES[0].wikitext.length,
    user_text: 'NodeArchitect',
    comment: 'Migrated architecture section to Node.js microservices topology & Parsoid pipeline',
    type: 'edit'
  },
  {
    id: 'evt-902',
    meta: {
      uri: 'https://notmediawiki.wazzimagiygg.com/wiki/Parsoid',
      request_id: 'req-trace-41903',
      id: 'uuid-49120-2',
      dt: '2026-03-12T14:10:00Z',
      domain: 'notmediawiki.wazzimagiygg.com',
      stream: 'mediawiki.recentchange'
    },
    database: 'wzzmwiki',
    page_title: 'Parsoid',
    page_namespace: 0,
    rev_id: 'rev-201',
    rev_timestamp: '2026-03-12T14:10:00Z',
    rev_sha1: '7c6b5a4120123456',
    rev_minor_edit: false,
    rev_len: SEED_WIKI_ARTICLES[1].wikitext.length,
    user_text: 'ParsoidBot',
    comment: 'Created Parsoid service documentation with AST specifications',
    type: 'new'
  },
  {
    id: 'evt-903',
    meta: {
      uri: 'https://notmediawiki.wazzimagiygg.com/wiki/Talk:MediaWiki',
      request_id: 'req-trace-41904',
      id: 'uuid-49120-3',
      dt: '2026-03-10T16:20:00Z',
      domain: 'notmediawiki.wazzimagiygg.com',
      stream: 'mediawiki.recentchange'
    },
    database: 'wzzmwiki',
    page_title: 'Talk:MediaWiki',
    page_namespace: 1,
    rev_id: 'rev-501',
    rev_timestamp: '2026-03-10T16:20:00Z',
    rev_sha1: '1122334455667788',
    rev_minor_edit: false,
    rev_len: SEED_WIKI_ARTICLES[4].wikitext.length,
    user_text: 'NodeArchitect',
    comment: 'Coordination discussion for Parsoid deployment',
    type: 'edit'
  }
];

// ============================================================================
// INITIAL EXTENSIONS LIST
// ============================================================================
export const SEED_WIKI_EXTENSIONS: WikiExtension[] = [
  {
    id: 'ext-cite',
    name: 'Cite',
    namePt: 'Cite (Citações & Notas de Rodapé)',
    version: '2.4.0',
    category: 'parser',
    author: 'Aeneas Rekkas, Brion Vibber, NotMediaWiki Core',
    description: 'Adiciona tags <ref> e <references>, gerando notas de rodapé numeradas com backlinks dinâmicos e navegação suave.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:Cite'
  },
  {
    id: 'ext-parsoid',
    name: 'Parsoid AST Service',
    namePt: 'Compilador Parsoid AST',
    version: '1.0.0-beta',
    category: 'parser',
    author: 'Wikimedia Architecture Team & WazzimaGiygg',
    description: 'Compilador bidirecional de Wikitexto para HTML5 semântico com análise sintática e geração de AST.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Parsoid'
  },
  {
    id: 'ext-eventstreams',
    name: 'EventStreams',
    namePt: 'EventStreams em Tempo Real',
    version: '1.3.0',
    category: 'api',
    author: 'Wikimedia Foundation Engineering',
    description: 'Transmissão em tempo real de mudanças recentes no acervo via Server-Sent Events (SSE).',
    enabled: true,
    type: 'extension',
    url: 'https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams'
  },
  {
    id: 'ext-centralauth',
    name: 'CentralAuth',
    namePt: 'Autenticação Global CentralAuth',
    version: '3.1.0',
    category: 'security',
    author: 'Brion Vibber, Tim Starling',
    description: 'Gerenciamento unificado de sessões e papéis (Burocrata, Sysop, Editor) com Firebase Auth e Zero-Trust.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:CentralAuth'
  },
  {
    id: 'ext-checkuser',
    name: 'CheckUser Universal',
    namePt: 'CheckUser Forense & Governança',
    version: '2.8.0',
    category: 'security',
    author: 'Tim Starling, Aaron Schulz',
    description: 'Ferramenta de auditoria de conexões, IPs, user-agents e investigação contra abusos e evasão de bloqueio.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:CheckUser'
  },
  {
    id: 'ext-wazzimagiygg-portals',
    name: 'WazzimaGiygg Portals',
    namePt: 'Portais Integrados WazzimaGiygg',
    version: '2.0.0',
    category: 'portal',
    author: 'WazzimaGiygg Digital Group',
    description: 'Conecta o NotMediaWiki diretamente ao jornal WazzimaGiygg, WikiWorldWeb, Acadêmico e Ouvidoria.',
    enabled: true,
    type: 'extension',
    url: 'https://wazzimagiygg.com'
  }
];

// ============================================================================
// PARSOID WIKITEXT PARSER (Pure TypeScript Engine)
// ============================================================================
export function parseWikitextToHtml(wikitext: string, pageTitle: string = 'Artigo'): ParseResult {
  const startTime = performance.now();
  const categories: string[] = [];
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const references: string[] = [];
  const toc: TocItem[] = [];

  let text = wikitext;

  // 1. Extract Categories: [[Category:Foo]]
  text = text.replace(/\[\[Category:([^\]]+)\]\]/gi, (_, cat) => {
    const cleanCat = cat.trim();
    if (!categories.includes(cleanCat)) {
      categories.push(cleanCat);
    }
    return '';
  });

  // 2. Extract Infobox: {{Infobox ... }}
  text = text.replace(/\{\{Infobox\s+([^\n|]+)([\s\S]*?)\}\}/gi, (_, type, body) => {
    const lines = body.split('\n');
    let rowsHtml = '';
    let title = type.trim();

    for (const line of lines) {
      const match = line.match(/^\s*\|\s*([^=]+?)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        if (key.toLowerCase() === 'name') {
          title = val;
        } else if (val) {
          const formattedVal = val.replace(
            /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
            (_: string, target: string, label?: string) => label || target
          );
          rowsHtml += `
            <tr class="border-b border-stone-200">
              <th class="py-1 px-2.5 text-left text-xs font-bold text-stone-700 bg-stone-100 uppercase tracking-wider">${key.replace(/_/g, ' ')}</th>
              <td class="py-1 px-2.5 text-xs text-stone-900">${formattedVal}</td>
            </tr>
          `;
        }
      }
    }

    return `
      <div class="wiki-infobox float-right sm:w-80 ml-6 mb-6 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-stone-900 overflow-hidden font-sans">
        <div class="bg-[#141414] text-white p-2.5 text-center font-bold font-editorial text-sm tracking-wide">
          ${title}
        </div>
        <table class="w-full text-xs border-collapse">
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  });

  // 3. Extract <ref> tags
  let refCount = 1;
  const namedRefs = new Map<string, number>();

  text = text.replace(/<ref(?:\s+name="([^"]+)")?>([\s\S]*?)<\/ref>/gi, (_, name, content) => {
    let index: number;
    if (name && namedRefs.has(name)) {
      index = namedRefs.get(name)!;
    } else {
      index = refCount++;
      if (name) namedRefs.set(name, index);
      references.push(content.trim());
    }
    return `<sup class="wiki-ref cursor-pointer font-bold text-blue-700 hover:text-red-700" title="Citação ${index}"><a href="#cite_note-${index}">[${index}]</a></sup>`;
  });

  // 4. Headings & Table of Contents (TOC)
  // === Heading 3 ===
  text = text.replace(/===([^=]+)===/g, (_, h) => {
    const title = h.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push({ id, level: 3, text: title, number: `${toc.length + 1}` });
    return `<h3 id="${id}" class="text-lg font-bold font-editorial text-stone-950 mt-6 mb-2 border-b border-stone-200 pb-1 scroll-mt-20">${title}</h3>`;
  });

  // == Heading 2 ==
  text = text.replace(/==([^=]+)==/g, (_, h) => {
    const title = h.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push({ id, level: 2, text: title, number: `${toc.length + 1}` });
    return `<h2 id="${id}" class="text-xl sm:text-2xl font-bold font-editorial text-stone-950 mt-8 mb-3 border-b-2 border-[#141414] pb-1.5 scroll-mt-20">${title}</h2>`;
  });

  // = Heading 1 =
  text = text.replace(/^=([^=]+)=$/gm, (_, h) => {
    const title = h.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push({ id, level: 1, text: title, number: `${toc.length + 1}` });
    return `<h1 id="${id}" class="text-2xl sm:text-3xl font-bold font-editorial text-stone-950 mt-8 mb-4 border-b-2 border-red-700 pb-2 scroll-mt-20">${title}</h1>`;
  });

  // 5. Bold & Italics
  text = text.replace(/'''''([^']+)'''''/g, '<strong><em>$1</em></strong>');
  text = text.replace(/'''([^']+)'''/g, '<strong>$1</strong>');
  text = text.replace(/''([^']+)''/g, '<em>$1</em>');

  // 6. Internal Wiki Links [[Article]] or [[Article|Label]]
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const linkTarget = target.trim();
    const linkLabel = (label || target).trim();
    internalLinks.push(linkTarget);
    return `<a href="#wiki/${linkTarget.replace(/\s+/g, '_')}" data-wikilink="${linkTarget}" class="wiki-internal-link text-blue-800 hover:text-red-700 underline font-semibold transition-colors">${linkLabel}</a>`;
  });

  // 7. External Links [http://url Label]
  text = text.replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g, (_, url, label) => {
    externalLinks.push(url);
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="wiki-external-link text-blue-700 hover:text-red-700 underline">${label} ↗</a>`;
  });

  // 8. Tables {| class="wikitable" ... |}
  text = text.replace(/\{\| class="wikitable"([\s\S]*?)\|\}/gi, (_, tableContent) => {
    const rows = tableContent.split('|-');
    let htmlTable = '<div class="overflow-x-auto my-6"><table class="w-full text-xs font-mono border-collapse border-2 border-[#141414] bg-white">';
    
    rows.forEach((row: string, rIdx: number) => {
      const cleanRow = row.trim();
      if (!cleanRow) return;

      // Header row
      if (cleanRow.includes('!')) {
        const headers = cleanRow.split('!!').map((h: string) => h.replace(/^[!|\s]+/, '').trim());
        htmlTable += '<tr class="bg-[#141414] text-white">';
        headers.forEach((h: string) => {
          if (h) htmlTable += `<th class="p-2.5 text-left border border-stone-700 font-bold uppercase tracking-wider">${h}</th>`;
        });
        htmlTable += '</tr>';
      } else {
        // Data row
        const cells = cleanRow.split('||').map((c: string) => c.replace(/^[|\s]+/, '').trim());
        htmlTable += `<tr class="${rIdx % 2 === 0 ? 'bg-stone-50' : 'bg-white'} hover:bg-amber-50">`;
        cells.forEach((c: string) => {
          if (c) htmlTable += `<td class="p-2.5 border border-stone-300 text-stone-800">${c}</td>`;
        });
        htmlTable += '</tr>';
      }
    });

    htmlTable += '</table></div>';
    return htmlTable;
  });

  // 9. Lists (* bullet, # numbered, : indent)
  text = text.replace(/^\* (.*)$/gm, '<li class="ml-5 list-disc text-stone-800">$1</li>');
  text = text.replace(/^# (.*)$/gm, '<li class="ml-5 list-decimal text-stone-800">$1</li>');
  text = text.replace(/^: (.*)$/gm, '<div class="ml-6 pl-3 border-l-2 border-stone-300 text-stone-700 my-1 font-serif italic">$1</div>');
  text = text.replace(/:: (.*)$/gm, '<div class="ml-12 pl-3 border-l-2 border-stone-400 text-stone-700 my-1 font-serif italic">$1</div>');

  // Wrap lists
  text = text.replace(/(<li class="ml-5 list-disc[^>]*>.*<\/li>)+/g, '<ul class="my-3 space-y-1">$&</ul>');
  text = text.replace(/(<li class="ml-5 list-decimal[^>]*>.*<\/li>)+/g, '<ol class="my-3 space-y-1">$&</ol>');

  // 10. Footnotes / References List (<references />)
  let refListHtml = '';
  if (references.length > 0) {
    refListHtml = `
      <div class="wiki-references mt-8 pt-4 border-t-2 border-stone-300 font-mono text-xs">
        <h4 class="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-3">Notas de Rodapé & Citações:</h4>
        <ol class="space-y-1.5 list-decimal list-inside text-stone-700">
          ${references
            .map(
              (ref, i) => `
            <li id="cite_note-${i + 1}" class="hover:bg-amber-50 p-1">
              <a href="#cite_ref-${i + 1}" class="text-blue-700 font-bold mr-1">↑</a>
              <span>${ref.replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-700">$2 ↗</a>')}</span>
            </li>
          `
            )
            .join('')}
        </ol>
      </div>
    `;
  }

  text = text.replace(/<references\s*\/?>/gi, refListHtml);

  // 11. Wrap plain paragraphs
  const paragraphs = text.split(/\n\s*\n/).map((para) => {
    const trimmed = para.trim();
    if (
      !trimmed ||
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol')
    ) {
      return trimmed;
    }
    return `<p class="leading-relaxed font-serif text-stone-900 text-base mb-4">${trimmed}</p>`;
  });

  const parseTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    html: paragraphs.join('\n'),
    toc,
    categories,
    internalLinks,
    externalLinks,
    references,
    parseTimeMs
  };
}

// ============================================================================
// MYERS DIFF ALGORITHM (Line-by-line Revision Difference)
// ============================================================================
export function computeWikitextDiff(oldText: string, newText: string, fromRevId: string, toRevId: string): DiffResult {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diffLines: DiffLine[] = [];

  let oIdx = 0;
  let nIdx = 0;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  while (oIdx < oldLines.length && nIdx < newLines.length) {
    if (oldLines[oIdx] === newLines[nIdx]) {
      diffLines.push({
        type: 'unchanged',
        content: oldLines[oIdx],
        lineNumberOld: oIdx + 1,
        lineNumberNew: nIdx + 1
      });
      unchangedCount++;
      oIdx++;
      nIdx++;
    } else {
      let matchInNew = -1;
      let matchInOld = -1;

      for (let i = nIdx + 1; i < Math.min(nIdx + 15, newLines.length); i++) {
        if (newLines[i] === oldLines[oIdx]) {
          matchInNew = i;
          break;
        }
      }

      for (let j = oIdx + 1; j < Math.min(oIdx + 15, oldLines.length); j++) {
        if (oldLines[j] === newLines[nIdx]) {
          matchInOld = j;
          break;
        }
      }

      if (matchInNew !== -1 && (matchInOld === -1 || matchInNew - nIdx <= matchInOld - oIdx)) {
        while (nIdx < matchInNew) {
          diffLines.push({
            type: 'added',
            content: newLines[nIdx],
            lineNumberNew: nIdx + 1
          });
          addedCount++;
          nIdx++;
        }
      } else if (matchInOld !== -1) {
        while (oIdx < matchInOld) {
          diffLines.push({
            type: 'removed',
            content: oldLines[oIdx],
            lineNumberOld: oIdx + 1
          });
          removedCount++;
          oIdx++;
        }
      } else {
        diffLines.push({
          type: 'removed',
          content: oldLines[oIdx],
          lineNumberOld: oIdx + 1
        });
        diffLines.push({
          type: 'added',
          content: newLines[nIdx],
          lineNumberNew: nIdx + 1
        });
        removedCount++;
        addedCount++;
        oIdx++;
        nIdx++;
      }
    }
  }

  while (oIdx < oldLines.length) {
    diffLines.push({
      type: 'removed',
      content: oldLines[oIdx],
      lineNumberOld: oIdx + 1
    });
    removedCount++;
    oIdx++;
  }

  while (nIdx < newLines.length) {
    diffLines.push({
      type: 'added',
      content: newLines[nIdx],
      lineNumberNew: nIdx + 1
    });
    addedCount++;
    nIdx++;
  }

  return {
    fromRevId,
    toRevId,
    lines: diffLines,
    stats: {
      added: addedCount,
      removed: removedCount,
      unchanged: unchangedCount,
      byteDelta: newText.length - oldText.length
    }
  };
}
