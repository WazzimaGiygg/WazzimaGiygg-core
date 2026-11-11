import {
  WikiFile,
  WikiFileVersion,
  WikiFileLicense,
  UploadFileInput,
  UserProfile,
  WikiArticle,
} from '../types';

const STORAGE_KEY_FILES = 'wikizero_files_v3';
const STORAGE_KEY_FIREBASE_PLAN = 'wikizero_firebase_storage_plan_v3';

// Regras oficiais e mandatórias de carregamento de ficheiros da WikiZero
export const WIKIZERO_UPLOAD_RULES = {
  title: 'Regras de Carregamento e Política de Independência de Mídias',
  bannedSources: [
    'Wikimedia Commons (commons.wikimedia.org)',
    'Wikipédia e projetos irmãos da Wikimedia Foundation (Wikisource, Wikiquote, Wikidata, etc.)',
    'Espelhos ou clones automatizados de repositórios da Wikimedia',
  ],
  allowedSources: [
    'Trabalho Próprio / Fotografia Autoral do Colaborador',
    'Acervos Públicos Independentes e Museus (Domínio Público Comprovado)',
    'Dados e Mídias Abertas de Órgãos Governamentais Oficiais',
    'Obras sob Licença Livre (CC BY / CC BY-SA) com Fontes Primárias Independentes',
    'Uso Justo (Fair Use) com Justificativa Rigorosa para Fins Educacionais',
  ],
  legalDisclaimer:
    'A WikiZero é uma enciclopédia autônoma e independente. É estritamente proibido importar, clonar ou transpor imagens, textos e metadados de projetos da Wikimedia Foundation. O colaborador assume responsabilidade legal e editorial pela veracidade das fontes declaradas.',
};

// Informações detalhadas e padronizadas das licenças
export const LICENSE_DEFINITIONS: Record<
  WikiFileLicense,
  {
    code: WikiFileLicense;
    label: string;
    badge: string;
    isFree: boolean;
    requiresJustification: boolean;
    description: string;
    legalText: string;
    url?: string;
  }
> = {
  'cc-by-sa-4.0': {
    code: 'cc-by-sa-4.0',
    label: 'Creative Commons Atribuição-CompartilhaIgual 4.0 (CC BY-SA 4.0)',
    badge: 'CC BY-SA 4.0',
    isFree: true,
    requiresJustification: false,
    description: 'Permite compartilhar, adaptar e criar obras derivadas, desde que atribuído o autor original e sob a mesma licença.',
    legalText: 'Este ficheiro está licenciado sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional.',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  'cc-by-4.0': {
    code: 'cc-by-4.0',
    label: 'Creative Commons Atribuição 4.0 (CC BY 4.0)',
    badge: 'CC BY 4.0',
    isFree: true,
    requiresJustification: false,
    description: 'Permite redistribuição e modificação mesmo comercial, desde que com os devidos créditos ao autor.',
    legalText: 'Este ficheiro está licenciado sob a licença Creative Commons Atribuição 4.0 Internacional.',
    url: 'https://creativecommons.org/licenses/by-4.0/',
  },
  'cc0-public-domain': {
    code: 'cc0-public-domain',
    label: 'Domínio Público / CC0 1.0 Universal',
    badge: 'Domínio Público',
    isFree: true,
    requiresJustification: false,
    description: 'A obra foi dedicada ao domínio público ou seus direitos patrimoniais expiraram. Sem restrições de direitos autorais.',
    legalText: 'Esta obra está no Domínio Público mundialmente por ter seus direitos patrimoniais expirados ou dedicados sob a CC0.',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  gfdl: {
    code: 'gfdl',
    label: 'GNU Free Documentation License (GFDL)',
    badge: 'GFDL 1.3',
    isFree: true,
    requiresJustification: false,
    description: 'Licença de documentação livre da Free Software Foundation para textos e esquemas técnicos autônomos.',
    legalText: 'É concedida permissão para copiar, distribuir e/ou modificar este documento sob os termos da GNU Free Documentation License.',
    url: 'https://www.gnu.org/licenses/fdl-1.3.html',
  },
  'fair-use': {
    code: 'fair-use',
    label: 'Uso Justo / Fair Use (Conteúdo Restrito com Justificativa)',
    badge: 'Uso Justo / Fair Use',
    isFree: false,
    requiresJustification: true,
    description: 'Material protegido por direitos autorais utilizado sob o princípio do uso justo estritamente para fins educacionais, ilustrativos ou de crítica.',
    legalText: 'Este ficheiro é protegido por direitos autorais e seu uso na WikiZero qualifica-se como Uso Justo (Fair Use) nos termos da legislação aplicável.',
  },
  'own-work': {
    code: 'own-work',
    label: 'Trabalho Próprio do Autor (Licenciado sob CC BY-SA 4.0)',
    badge: 'Trabalho Próprio',
    isFree: true,
    requiresJustification: false,
    description: 'Ficheiro criado pessoalmente pelo usuário que fez o upload e disponibilizado livremente à comunidade enciclopédica.',
    legalText: 'Eu, titular dos direitos autorais desta obra, publico-a sob a licença livre Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional.',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  'copyrighted-permission': {
    code: 'copyrighted-permission',
    label: 'Material com Autorização Expressa do Titular',
    badge: 'Autorização Formal',
    isFree: false,
    requiresJustification: true,
    description: 'Obra protegida cujo detentor concedeu autorização formal e documentada para uso na enciclopédia.',
    legalText: 'O uso deste ficheiro foi expressamente autorizado pelo titular dos direitos patrimoniais e de imagem.',
  },
};

// Imagens semente com miniaturas pré-calculadas e fontes 100% independentes (sem vínculos com a Wikimedia)
const SEED_FILES: WikiFile[] = [
  {
    id: 'file-bandeira-brasil',
    name: 'Bandeira_do_Brasil.png',
    title: 'Arquivo:Bandeira_do_Brasil.png',
    description: 'Bandeira nacional da República Federativa do Brasil adotada pelo Decreto nº 4 em 19 de novembro de 1889, composta pela base verde, losango amarelo, esfera celeste azul com 27 estrelas e a faixa branca com o lema "Ordem e Progresso".',
    license: 'cc0-public-domain',
    licenseDetails: 'Símbolo oficial nacional da República Federativa do Brasil, em domínio público conforme a Lei nº 9.610/98 (Art. 8º).',
    author: 'Raimundo Teixeira Mendes, Décio Villares e Miguel Lemos',
    source: 'Arquivo Nacional e Acervo Oficial da Presidência da República do Brasil',
    mimeType: 'image/png',
    sizeBytes: 142800,
    width: 1200,
    height: 840,
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    thumbnails: {
      sm: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=200&q=70',
      md: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
      lg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
    },
    uploadedBy: 'WazzimaGiygg',
    uploadedByUid: 'wazzima_owner',
    uploadedAt: '2026-08-20T10:00:00Z',
    storageProvider: 'local_fallback',
    firebasePlan: 'blaze',
    categories: ['Símbolos Nacionais do Brasil', 'Bandeiras', 'Imagens em Domínio Público'],
    history: [
      {
        id: 'ver-bandeira-1',
        versionNumber: 1,
        url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
        thumbnails: {
          sm: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=200&q=70',
          md: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
          lg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
        },
        sizeBytes: 142800,
        width: 1200,
        height: 840,
        uploadedBy: 'WazzimaGiygg',
        uploadedByUid: 'wazzima_owner',
        uploadedAt: '2026-08-20T10:00:00Z',
        comment: 'Versão de alta definição da Bandeira Nacional do Brasil a partir de acervo público.',
      },
    ],
  },
  {
    id: 'file-metro-sp-mapa',
    name: 'Metro_Sao_Paulo_Esquema.png',
    title: 'Arquivo:Metro_Sao_Paulo_Esquema.png',
    description: 'Esquema operacional da rede de transporte metropolitano sobre trilhos de São Paulo (Metrô e CPTM), ilustrando as linhas 1-Azul, 2-Verde, 3-Vermelha, 4-Amarela, 5-Lilás e 15-Prata com integração tarifária.',
    license: 'cc-by-sa-4.0',
    licenseDetails: 'Trabalho derivado de dados públicos da Companhia do Metropolitano de São Paulo.',
    author: 'Metrofilo_SP & Equipe WikiZero',
    source: 'Dados abertos da Secretaria dos Transportes Metropolitanos de SP',
    mimeType: 'image/png',
    sizeBytes: 258000,
    width: 1400,
    height: 980,
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    thumbnails: {
      sm: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=70',
      md: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
      lg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    },
    uploadedBy: 'Metrofilo_SP',
    uploadedByUid: 'user_metrofilo',
    uploadedAt: '2026-08-25T14:30:00Z',
    storageProvider: 'local_fallback',
    firebasePlan: 'blaze',
    categories: ['Metrô de São Paulo', 'Transporte Ferroviário', 'Mapas de Trânsito'],
    history: [
      {
        id: 'ver-metro-1',
        versionNumber: 1,
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        thumbnails: {
          sm: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=70',
          md: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          lg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        },
        sizeBytes: 258000,
        width: 1400,
        height: 980,
        uploadedBy: 'Metrofilo_SP',
        uploadedByUid: 'user_metrofilo',
        uploadedAt: '2026-08-25T14:30:00Z',
        comment: 'Upload inicial do diagrama do sistema metroviário.',
      },
    ],
  },
  {
    id: 'file-tuneladora-cora-coralina',
    name: 'Tuneladora_Cora_Coralina.jpg',
    title: 'Arquivo:Tuneladora_Cora_Coralina.jpg',
    description: 'Fotografia da tuneladora Cora Coralina ("Tatuzão"), com 10,99 metros de diâmetro, utilizada na escavação da expansão da Linha 2-Verde entre o Poço Falchi Gianini e a Estação Penha.',
    license: 'fair-use',
    fairUseJustification: 'Uso de imagem institucional informativa em baixa resolução para fins documentais e educacionais sobre obras públicas de infraestrutura no Brasil.',
    licenseDetails: 'Imagem de divulgação institucional da Companhia do Metrô sob critérios de Uso Justo.',
    author: 'Assessoria de Imprensa do Metrô de São Paulo',
    source: 'Relatório Oficial de Obras da Linha 2-Verde 2026',
    mimeType: 'image/jpeg',
    sizeBytes: 189000,
    width: 1280,
    height: 853,
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    thumbnails: {
      sm: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=70',
      md: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      lg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    },
    uploadedBy: 'WazzimaGiygg',
    uploadedByUid: 'wazzima_owner',
    uploadedAt: '2026-08-27T16:00:00Z',
    storageProvider: 'local_fallback',
    firebasePlan: 'blaze',
    categories: ['Engenharia Civil', 'Metrô de São Paulo', 'Tuneladoras'],
    history: [
      {
        id: 'ver-tuneladora-1',
        versionNumber: 1,
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
        thumbnails: {
          sm: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=70',
          md: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
          lg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        },
        sizeBytes: 189000,
        width: 1280,
        height: 853,
        uploadedBy: 'WazzimaGiygg',
        uploadedByUid: 'wazzima_owner',
        uploadedAt: '2026-08-27T16:00:00Z',
        comment: 'Fotografia de alta fidelidade do equipamento de tunelação.',
      },
    ],
  },
  {
    id: 'file-wikizero-emblema',
    name: 'Logo_WikiZero.svg',
    title: 'Arquivo:Logo_WikiZero.svg',
    description: 'Logotipo e emblema oficial da enciclopédia WikiZero em forma de cubo isométrico com relevo e padrões de labirinto geométrico.',
    license: 'own-work',
    licenseDetails: 'Logotipo oficial da WikiZero disponibilizado sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0.',
    author: 'WikiZero',
    source: 'Logotipo Oficial da WikiZero',
    mimeType: 'image/png',
    sizeBytes: 264192,
    width: 512,
    height: 512,
    url: '/logo.png',
    thumbnails: {
      sm: '/logo.png',
      md: '/logo.png',
      lg: '/logo.png',
    },
    uploadedBy: 'WikiZero',
    uploadedByUid: 'wikizero_official',
    uploadedAt: '2026-10-02T16:00:00Z',
    storageProvider: 'local_fallback',
    firebasePlan: 'blaze',
    categories: ['Identidade Visual da WikiZero', 'Logotipos', 'Trabalho Próprio'],
    history: [
      {
        id: 'ver-logo-1',
        versionNumber: 1,
        url: '/logo.png',
        thumbnails: {
          sm: '/logo.png',
          md: '/logo.png',
          lg: '/logo.png',
        },
        sizeBytes: 264192,
        width: 512,
        height: 512,
        uploadedBy: 'WikiZero',
        uploadedByUid: 'wikizero_official',
        uploadedAt: '2026-10-02T16:00:00Z',
        comment: 'Logotipo oficial do cubo WikiZero adicionado.',
      },
    ],
  },
  {
    id: 'file-wikizero-emblema-alt',
    name: 'WikiZero_Emblema.svg',
    title: 'Arquivo:WikiZero_Emblema.svg',
    description: 'Logotipo e emblema oficial da enciclopédia aberta WikiZero, simbolizando a preservação do conhecimento livre, soberania informacional e transparência editorial.',
    license: 'own-work',
    licenseDetails: 'Logotipo oficial da WikiZero disponibilizado sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0.',
    author: 'Equipe de Design WazzimaGiygg / WikiZero',
    source: 'Repositório Oficial do Projeto WikiZero',
    mimeType: 'image/png',
    sizeBytes: 264192,
    width: 512,
    height: 512,
    url: '/logo.png',
    thumbnails: {
      sm: '/logo.png',
      md: '/logo.png',
      lg: '/logo.png',
    },
    uploadedBy: 'WikiZero',
    uploadedByUid: 'wikizero_official',
    uploadedAt: '2026-10-02T16:00:00Z',
    storageProvider: 'local_fallback',
    firebasePlan: 'blaze',
    categories: ['Identidade Visual da WikiZero', 'Logotipos', 'Trabalho Próprio'],
    history: [
      {
        id: 'ver-logo-2',
        versionNumber: 1,
        url: '/logo.png',
        thumbnails: {
          sm: '/logo.png',
          md: '/logo.png',
          lg: '/logo.png',
        },
        sizeBytes: 264192,
        width: 512,
        height: 512,
        uploadedBy: 'WikiZero',
        uploadedByUid: 'wikizero_official',
        uploadedAt: '2026-10-02T16:00:00Z',
        comment: 'Vetor de identidade visual oficial atualizado para o logotipo do cubo.',
      },
    ],
  },
];

// Helper: inicializa localStorage
function initializeFilesStorage() {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(SEED_FILES));
    } else {
      try {
        const files: WikiFile[] = JSON.parse(raw);
        let changed = false;
        const logo1 = files.find(f => f.name === 'Logo_WikiZero.svg');
        if (!logo1) {
          files.unshift(SEED_FILES[0]);
          changed = true;
        } else if (logo1.url !== '/logo.png') {
          logo1.url = '/logo.png';
          logo1.thumbnails = { sm: '/logo.png', md: '/logo.png', lg: '/logo.png' };
          changed = true;
        }
        const logo2 = files.find(f => f.name === 'WikiZero_Emblema.svg');
        if (logo2 && logo2.url !== '/logo.png') {
          logo2.url = '/logo.png';
          logo2.thumbnails = { sm: '/logo.png', md: '/logo.png', lg: '/logo.png' };
          changed = true;
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
        }
      } catch {}
    }
  }
}

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  initializeFilesStorage();
}

export const FileStorageService = {
  // === GERENCIAMENTO DE PLANO FIREBASE (SPARK VS BLAZE) ===

  /**
   * Obtém o status do plano de faturamento configurado para o Firebase Storage.
   * Por padrão em contas sem cobrança, é 'spark' (plano gratuito).
   */
  getFirebasePlan(): 'spark' | 'blaze' {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_PLAN);
    if (saved === 'blaze' || saved === 'spark') {
      return saved;
    }
    // Padrão: 'spark'
    return 'spark';
  },

  /**
   * Define o plano do Firebase (permite simulação ou configuração do plano Blaze)
   */
  setFirebasePlan(plan: 'spark' | 'blaze'): void {
    localStorage.setItem(STORAGE_KEY_FIREBASE_PLAN, plan);
  },

  /**
   * Retorna a mensagem de erro padronizada do servidor quando o plano Spark recusar o armazenamento.
   */
  getSparkPlanErrorMessage(): string {
    return `[FirebaseStorageError: 402 Payment Required / Spark Plan Quota] Upload recusado pelo servidor: O armazenamento persistente de ficheiros multimídia no Firebase Cloud Storage exige o plano Firebase Blaze (Pay as you go). O plano Spark atual recusa uploads no bucket de armazenamento 'wzzm-ce3fc.firebasestorage.app'. Ative o plano Blaze no console do Firebase para habilitar o armazenamento na nuvem. (Código de Erro: FIREBASE_STORAGE_SPARK_LIMIT_REACHED)`;
  },

  // === CONSULTAS E CRUD DE ARQUIVOS ===

  /**
   * Retorna todos os ficheiros cadastrados na WikiZero
   */
  async getFiles(): Promise<WikiFile[]> {
    initializeFilesStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FILES);
      return raw ? JSON.parse(raw) : SEED_FILES;
    } catch (e) {
      console.warn('Erro ao carregar ficheiros:', e);
      return SEED_FILES;
    }
  },

  /**
   * Obtém um arquivo pelo nome normalizado (ex: "Bandeira_do_Brasil.png" ou "Arquivo:Bandeira_do_Brasil.png")
   */
  async getFileByName(rawName: string): Promise<WikiFile | null> {
    if (!rawName) return null;
    const files = await this.getFiles();
    const clean = rawName
      .replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .trim();

    return (
      files.find((f) => {
        const fileClean = f.name.replace(/\s+/g, '_').toLowerCase();
        return fileClean === clean;
      }) || null
    );
  },

  /**
   * Busca sincrônica por nome (utilizada no parser de wikitexto para renderização ágil)
   */
  getFileByNameSync(rawName: string): WikiFile | null {
    if (!rawName) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FILES);
      const files: WikiFile[] = raw ? JSON.parse(raw) : SEED_FILES;
      const clean = rawName
        .replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .trim();

      return (
        files.find((f) => {
          const fileClean = f.name.replace(/\s+/g, '_').toLowerCase();
          return fileClean === clean;
        }) || null
      );
    } catch {
      return null;
    }
  },

  /**
   * Obtém um arquivo pelo ID
   */
  async getFileById(id: string): Promise<WikiFile | null> {
    const files = await this.getFiles();
    return files.find((f) => f.id === id) || null;
  },

  /**
   * Realiza o Upload de um novo ficheiro ou nova versão de ficheiro existente.
   * Valida obrigatoriedade de licença, atribuição e respeita a restrição do Plano Spark do Firebase.
   */
  async uploadFile(
    input: UploadFileInput,
    user: UserProfile | null,
    enforceFirebaseCloud = false
  ): Promise<{ success: boolean; file?: WikiFile; error?: string }> {
    // 1. Validação de usuário
    if (!user || user.role === 'convidado') {
      return {
        success: false,
        error: 'É necessário estar autenticado com uma conta de editor ou administrador para carregar ficheiros.',
      };
    }

    // 2. Validação da Licença & Atribuição (Obrigatório)
    if (!input.license) {
      return {
        success: false,
        error: 'O campo de licença e direitos autorais é obrigatório conforme a política de conteúdo da WikiZero.',
      };
    }

    const licenseDef = LICENSE_DEFINITIONS[input.license];
    if (licenseDef && licenseDef.requiresJustification) {
      if (input.license === 'fair-use' && (!input.fairUseJustification || input.fairUseJustification.trim().length < 15)) {
        return {
          success: false,
          error: 'Para a licença de Uso Justo (Fair Use), é obrigatório fornecer uma justificativa fundamentada de uso aceitável (mínimo 15 caracteres).',
        };
      }
    }

    if (!input.author || input.author.trim().length < 2) {
      return {
        success: false,
        error: 'O campo de Autor / Criador original da obra é obrigatório para garantir os créditos da licença.',
      };
    }

    if (!input.source || input.source.trim().length < 2) {
      return {
        success: false,
        error: 'O campo de Fonte / Origem do ficheiro é obrigatório.',
      };
    }

    // 3. Verificação Estrita das Regras de Independência da WikiZero (Vetado Wikimedia Commons / Wikipédia)
    const combinedContent = `${input.source} ${input.author} ${input.description || ''} ${input.licenseDetails || ''} ${input.comment || ''} ${input.targetName || ''}`.toLowerCase();
    const bannedPatterns = [
      /wikimedia/i,
      /commons\.wikimedia/i,
      /upload\.wikimedia/i,
      /wikipedia/i,
      /wikipédia/i,
      /wikimedia foundation/i,
      /wiki commons/i,
      /wikicommons/i,
      /wikisource/i,
      /wikiquote/i,
      /wikidata/i,
      /wikivoyage/i,
      /wikinews/i,
      /wiktionary/i,
      /mediawiki\.org/i,
    ];

    const hasBannedPattern = bannedPatterns.some((pattern) => pattern.test(combinedContent));
    if (hasBannedPattern) {
      return {
        success: false,
        error:
          'Violação da Política de Carregamento da WikiZero: É expressamente proibido carregar ficheiros importados do Wikimedia Commons, ou copiar textos e metadados da Wikipédia ou de qualquer projeto da Wikimedia Foundation. A WikiZero exige fontes independentes, fotos autorais, acervos governamentais ou domínio público primário.',
      };
    }

    // 4. Verificação do Plano Spark vs Blaze do Firebase
    const currentPlan = this.getFirebasePlan();
    if (enforceFirebaseCloud && currentPlan === 'spark') {
      return {
        success: false,
        error: this.getSparkPlanErrorMessage(),
      };
    }

    // 4. Normalização do nome do arquivo
    let targetName = (input.targetName || input.file.name)
      .trim()
      .replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '')
      .replace(/\s+/g, '_')
      .replace(/[/\\#?%<>[\]|^`{}]/g, '');

    // Garante extensão
    const extMatch = input.file.name.match(/\.([a-zA-Z0-9]+)$/);
    const fileExt = extMatch ? extMatch[1].toLowerCase() : 'png';
    if (!targetName.toLowerCase().endsWith(`.${fileExt}`)) {
      targetName = `${targetName}.${fileExt}`;
    }

    // 5. Conversão e Geração Automática de Miniaturas via Canvas
    try {
      const dataUrl = await this.fileToDataUrl(input.file);
      const dimensions = await this.readImageDimensions(dataUrl, input.file.type);
      const thumbnails = await this.generateThumbnails(dataUrl, dimensions.width, dimensions.height);

      const files = await this.getFiles();
      const existingIndex = files.findIndex(
        (f) => f.name.toLowerCase() === targetName.toLowerCase()
      );

      const now = new Date().toISOString();
      const uploaderName = user.displayName || user.username || user.email.split('@')[0];

      let resultFile: WikiFile;

      if (existingIndex >= 0) {
        // Nova versão do ficheiro existente
        const existing = files[existingIndex];
        const newVersionNumber = (existing.history?.length || 1) + 1;
        const newHistoryItem: WikiFileVersion = {
          id: `ver-${Date.now()}-${newVersionNumber}`,
          versionNumber: newVersionNumber,
          url: dataUrl,
          thumbnails,
          sizeBytes: input.file.size,
          width: dimensions.width,
          height: dimensions.height,
          uploadedBy: uploaderName,
          uploadedByUid: user.uid,
          uploadedAt: now,
          comment: input.comment || 'Carregamento de nova versão do ficheiro.',
        };

        resultFile = {
          ...existing,
          description: input.description || existing.description,
          license: input.license || existing.license,
          licenseDetails: input.licenseDetails || existing.licenseDetails,
          fairUseJustification: input.fairUseJustification || existing.fairUseJustification,
          author: input.author || existing.author,
          source: input.source || existing.source,
          mimeType: input.file.type || existing.mimeType,
          sizeBytes: input.file.size,
          width: dimensions.width,
          height: dimensions.height,
          url: dataUrl,
          thumbnails,
          uploadedBy: uploaderName,
          uploadedByUid: user.uid,
          updatedAt: now,
          firebasePlan: currentPlan,
          categories: input.categories && input.categories.length > 0 ? input.categories : existing.categories,
          history: [newHistoryItem, ...(existing.history || [])],
        };

        files[existingIndex] = resultFile;
      } else {
        // Novo ficheiro
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const historyItem: WikiFileVersion = {
          id: `ver-${Date.now()}-1`,
          versionNumber: 1,
          url: dataUrl,
          thumbnails,
          sizeBytes: input.file.size,
          width: dimensions.width,
          height: dimensions.height,
          uploadedBy: uploaderName,
          uploadedByUid: user.uid,
          uploadedAt: now,
          comment: input.comment || 'Envio inicial do ficheiro.',
        };

        resultFile = {
          id: fileId,
          name: targetName,
          title: `Arquivo:${targetName}`,
          description: input.description || `Ficheiro ${targetName} carregado na WikiZero.`,
          license: input.license,
          licenseDetails: input.licenseDetails,
          fairUseJustification: input.fairUseJustification,
          author: input.author,
          source: input.source,
          mimeType: input.file.type || 'image/png',
          sizeBytes: input.file.size,
          width: dimensions.width,
          height: dimensions.height,
          url: dataUrl,
          thumbnails,
          uploadedBy: uploaderName,
          uploadedByUid: user.uid,
          uploadedAt: now,
          updatedAt: now,
          storageProvider: currentPlan === 'blaze' ? 'firebase_storage' : 'local_fallback',
          firebasePlan: currentPlan,
          categories: input.categories || ['Ficheiros da WikiZero'],
          history: [historyItem],
        };

        files.unshift(resultFile);
      }

      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));

      return {
        success: true,
        file: resultFile,
      };
    } catch (err: any) {
      console.error('Erro no processamento do upload:', err);
      return {
        success: false,
        error: `Falha ao processar e comprimir imagem: ${err.message || 'Erro desconhecido'}`,
      };
    }
  },

  /**
   * Salva alterações em metadados do arquivo
   */
  async updateFileMetadata(
    id: string,
    updates: Partial<Pick<WikiFile, 'description' | 'license' | 'licenseDetails' | 'fairUseJustification' | 'author' | 'source' | 'categories'>>,
    _user: UserProfile | null
  ): Promise<WikiFile | null> {
    const files = await this.getFiles();
    const index = files.findIndex((f) => f.id === id);
    if (index < 0) return null;

    const file = files[index];
    const updated: WikiFile = {
      ...file,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    files[index] = updated;
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
    return updated;
  },

  /**
   * Exclui um arquivo da enciclopédia
   */
  async deleteFile(id: string, user: UserProfile | null): Promise<boolean> {
    if (!user || (user.role !== 'admin' && user.role !== 'moderador')) {
      throw new Error('Apenas Administradores e Moderadores podem excluir ficheiros.');
    }

    const files = await this.getFiles();
    const filtered = files.filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(filtered));
    return true;
  },

  // === RASTREAMENTO DE USO GLOBAL (PÁGINAS QUE USAM ESTE FICHEIRO) ===

  /**
   * Varre todos os artigos da WikiZero e localiza ocorrências de sintaxe wikitexto
   * como [[Arquivo:nome.png]], [[Ficheiro:nome.png]], [[File:nome.png]] ou [[Imagem:nome.png]]
   */
  getFileUsage(fileName: string, articles: WikiArticle[]): { article: WikiArticle; snippet: string; count: number }[] {
    if (!fileName || !articles) return [];
    const cleanName = fileName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').trim();
    const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[_ ]');

    // Regex para identificar [[(Arquivo|Ficheiro|File|Imagem|Image):nome...]]
    const regex = new RegExp(`\\[\\[(?:Arquivo|Ficheiro|File|Imagem|Image):\\s*${escaped}(?:\\|[^\\]]*)?\\]\\]`, 'gi');

    const results: { article: WikiArticle; snippet: string; count: number }[] = [];

    articles.forEach((art) => {
      const content = art.descricao || '';
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        // Extrai o primeiro snippet de contexto
        const firstMatchIndex = content.search(regex);
        const start = Math.max(0, firstMatchIndex - 50);
        const end = Math.min(content.length, firstMatchIndex + matches[0].length + 50);
        let snippet = content.slice(start, end).replace(/\n/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';

        results.push({
          article: art,
          snippet,
          count: matches.length,
        });
      }
    });

    return results;
  },

  // === AUXILIARES DE PROCESSAMENTO DE IMAGEM & CANVAS ===

  /**
   * Converte File para Base64 Data URL
   */
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Lê as dimensões naturais de uma imagem
   */
  readImageDimensions(dataUrl: string, mimeType: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      if (mimeType === 'image/svg+xml') {
        // SVGs podem ter viewBox padrão
        resolve({ width: 800, height: 600 });
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      };
      img.onerror = () => resolve({ width: 800, height: 600 });
      img.src = dataUrl;
    });
  },

  /**
   * Gera miniaturas em 3 tamanhos padrão (sm 150px, md 320px, lg 800px) usando Canvas HTML5
   */
  generateThumbnails(
    dataUrl: string,
    originalWidth: number,
    originalHeight: number
  ): Promise<{ sm: string; md: string; lg: string }> {
    return new Promise((resolve) => {
      // Se for SVG ou URL externa, reutiliza
      if (dataUrl.startsWith('data:image/svg+xml') || !dataUrl.startsWith('data:image/')) {
        resolve({
          sm: dataUrl,
          md: dataUrl,
          lg: dataUrl,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const createThumb = (maxDim: number, quality: number): string => {
            const aspect = originalWidth / originalHeight;
            let targetW = originalWidth;
            let targetH = originalHeight;

            if (originalWidth > originalHeight) {
              if (originalWidth > maxDim) {
                targetW = maxDim;
                targetH = Math.round(maxDim / aspect);
              }
            } else {
              if (originalHeight > maxDim) {
                targetH = maxDim;
                targetW = Math.round(maxDim * aspect);
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, targetW);
            canvas.height = Math.max(1, targetH);
            const ctx = canvas.getContext('2d');
            if (!ctx) return dataUrl;

            // Suavização de imagem
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetW, targetH);

            return canvas.toDataURL('image/jpeg', quality);
          };

          const sm = createThumb(180, 0.75);
          const md = createThumb(380, 0.82);
          const lg = createThumb(800, 0.88);

          resolve({ sm, md, lg });
        } catch {
          resolve({ sm: dataUrl, md: dataUrl, lg: dataUrl });
        }
      };

      img.onerror = () => {
        resolve({ sm: dataUrl, md: dataUrl, lg: dataUrl });
      };

      img.src = dataUrl;
    });
  },

  /**
   * Formata bytes para exibição legível (KB, MB, GB)
   */
  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
};
