/**
 * ESTRUTURA DA PÁGINA DE AJUDA GERAL DA WIKI (Requisito 3.05.8.a)
 * 
 * Localização: Diretório da extensão (src/extensions/general-help/defaultHelpContent.ts)
 * Editável pelo Burocrata diretamente nos arquivos locais e através da interface
 * integrada de edição de conteúdo da extensão.
 */

export interface WikiHelpShortcut {
  key: string;
  action: string;
  status: 'active' | 'blocked' | 'custom';
  description: string;
  category: 'navegacao' | 'sistema' | 'edicao' | 'seguranca';
}

export interface WikiHelpTopic {
  id: string;
  title: string;
  content: string; // Markdown / Wikitext amigável
  summary?: string;
  tags?: string[];
  badge?: string;
  tips?: string[];
  shortcuts?: WikiHelpShortcut[];
}

export interface WikiHelpSection {
  id: string;
  title: string;
  icon: string; // Nome do ícone Lucide
  description: string;
  topics: WikiHelpTopic[];
}

export interface WikiHelpStructure {
  version: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  lastEditedBy: string;
  sections: WikiHelpSection[];
  globalShortcuts: WikiHelpShortcut[];
}

export const DEFAULT_HELP_STRUCTURE: WikiHelpStructure = {
  version: '3.05.8',
  title: 'Central de Ajuda Geral & Manual do Usuário WikiZero',
  subtitle: 'Guia completo de navegação, atalhos de teclado, edição de artigos e diretrizes da enciclopédia livre',
  lastUpdated: '2026-10-15T00:00:00Z',
  lastEditedBy: 'Conselho de Burocratas (Arquivos Locais da Extensão)',
  globalShortcuts: [
    {
      key: 'F1',
      action: 'Abrir / Fechar Ajuda Geral',
      status: 'active',
      description: 'Abre este manual e central de ajuda geral da Wiki. Pode ser habilitado ou desabilitado pelo Burocrata na extensão GeneralHelpExtension.',
      category: 'navegacao',
    },
    {
      key: 'F11',
      action: 'Alternar Modo Tela Cheia',
      status: 'active',
      description: 'Entra ou sai do modo de tela cheia do Wiki-Site sem sair do ambiente da enciclopédia.',
      category: 'sistema',
    },
    {
      key: 'F7',
      action: 'Navegação por Cursor (Caret Browsing)',
      status: 'blocked',
      description: 'Bloqueado por padrão no WikiZero para evitar desconfiguração visual de texto e garantir experiência imersiva de leitura.',
      category: 'seguranca',
    },
    {
      key: 'F12',
      action: 'Ferramentas de Desenvolvedor (DevTools)',
      status: 'blocked',
      description: 'Bloqueado preventivamente pelas diretrizes de segurança da Wiki para manter a integridade do ambiente seguro.',
      category: 'seguranca',
    },
    {
      key: 'Ctrl + K  /  /',
      action: 'Busca Rápida de Artigos',
      status: 'active',
      description: 'Foca imediatamente a barra de pesquisa rápida de verbetes e artigos enciclopédicos.',
      category: 'navegacao',
    },
    {
      key: 'Esc',
      action: 'Fechar Modais & Menus',
      status: 'active',
      description: 'Fecha o modal ativo, central de ajuda, visualizadores de mídia ou menus abertos.',
      category: 'sistema',
    },
    {
      key: 'Alt + Shift + E',
      action: 'Editar Artigo Atual',
      status: 'active',
      description: 'Abre o artigo corrente diretamente no editor de wikitexto e sintaxe rápida.',
      category: 'edicao',
    },
    {
      key: 'Ctrl + Shift + L',
      action: 'Alternar Tema Claro / Escuro',
      status: 'active',
      description: 'Alterna a paleta de cores entre Light Mode e Dark Mode adaptado.',
      category: 'sistema',
    },
  ],
  sections: [
    {
      id: 'primeiros-passos',
      title: 'Primeiros Passos & Navegação',
      icon: 'Compass',
      description: 'Aprenda a pesquisar, explorar categorias e navegar pela maior enciclopédia livre.',
      topics: [
        {
          id: 'como-pesquisar',
          title: 'Como Pesquisar Artigos e Conteúdos',
          summary: 'Técnicas de busca rápida e busca avançada por operadores booleanos e categorias.',
          content: `### Pesquisa Inteligente na WikiZero

Você pode pesquisar conteúdos de três maneiras:
1. **Barra Superior**: Pressione **Ctrl + K** ou digite qualquer termo na barra de busca do cabeçalho.
2. **Busca Avançada**: Acesse a aba **Busca Avançada** no menu para filtrar por namespaces (Artigo, Discussão, Ajuda, Usuário), período de tempo e ordenação por relevância.
3. **Página Aleatória**: Clique no ícone de dados (🎲) na barra superior para descobrir um verbete aleatório do acervo.`,
          tags: ['pesquisa', 'busca', 'navegacao'],
          tips: ['Pressione a barra "/" a qualquer momento para pesquisar sem usar o mouse.'],
        },
        {
          id: 'indices-e-categorias',
          title: 'Índice Alfabético e Categorias Temáticas',
          summary: 'Explore o acervo navegando de A a Z ou por tópicos como Ciência, História e Tecnologia.',
          content: `### Explorando por Categorias

No final de cada artigo e na barra lateral, você encontra as **Categorias** associadas. Ao clicar em uma categoria:
- Você visualiza todos os verbetes correlatos.
- Pode filtrar por subcategorias especializadas.
- No modo de impressão e exportação em PDF, as categorias são organizadas de maneira limpa e profissional.`,
          tags: ['categorias', 'indice', 'acervo'],
        },
      ],
    },
    {
      id: 'atalhos-e-bloqueios',
      title: 'Atalhos de Teclado & Teclas do Sistema',
      icon: 'Keyboard',
      description: 'Controle rápido por teclas e detalhamento dos comandos bloqueados (F7, F11, F12).',
      topics: [
        {
          id: 'comandos-bloqueados',
          title: 'Bloqueio de Teclas do Navegador (F7, F11, F12)',
          summary: 'Entenda os motivos de segurança e usabilidade para a interceptação de comandos de teclas.',
          content: `### Segurança & Controle de Comandos de Teclas (Requisito 3.05.7.a)

Para oferecer uma experiência de quiosque confiável e livre de interferências, a WikiZero implementa a interceptação e bloqueio de teclas funcionais do navegador:

* **Tecla F7 (Caret Browsing / Navegação por Cursor)**:
  * **Status**: Bloqueada preventivamente.
  * **Motivo**: A navegação por cursor insere um cursor piscante no texto comum que pode quebrar a seleção de blocos, o leitor de artigos e formulários interativos.
* **Tecla F11 (Tela Cheia Nativa do Navegador)**:
  * **Status**: Interceptada e convertida para a **Tela Cheia Integrada do Wiki-Site**.
  * **Motivo**: Em vez de depender das barras desajustadas do navegador hospedeiro, a WikiZero aciona sua própria API de tela cheia imersiva, com controles e menus acessíveis.
* **Tecla F12 (DevTools / Inspecionar Elemento)**:
  * **Status**: Bloqueada.
  * **Motivo**: Protege o estado da sessão local, evita injeções de scripts acidentais e mantém o cumprimento das políticas de integridade do conselho de burocratas.`,
          tags: ['atalhos', 'f7', 'f11', 'f12', 'seguranca'],
          tips: [
            'Para abrir a ajuda geral a qualquer momento, basta pressionar **F1**.',
            'Para alternar a tela cheia da Wiki, utilize **F11** ou o botão do cabeçalho.',
          ],
        },
        {
          id: 'tecla-f1-extensao',
          title: 'Tecla F1 e a Extensão GeneralHelpExtension',
          summary: 'Como funciona o acionamento de ajuda por F1 e o controle de permissão pelo Burocrata.',
          content: `### Atalho F1 & Extensão Sincronizada no Firebase (Requisito 3.05.3.ad)

Ao pressionar **F1**:
1. O navegador não abre o suporte genérico do sistema operacional; em vez disso, ele abre diretamente este **Manual de Ajuda Geral da WikiZero**.
2. Esta função é gerenciada pela extensão **GeneralHelpExtension**.
3. O **Conselho de Burocratas** tem a prerrogativa de habilitar ou desabilitar o atalho F1 e o manual de ajuda geral através do painel de extensões com sincronização imediata no **Firebase Firestore**.
4. Quando desativada pelo Burocrata, uma notificação informativa orienta os usuários sobre a suspensão temporária do recurso.`,
          tags: ['f1', 'extensao', 'burocrata', 'firebase'],
        },
      ],
    },
    {
      id: 'tela-cheia',
      title: 'Modo Tela Cheia no Wiki-Site',
      icon: 'Maximize',
      description: 'Como utilizar o modo imersivo de tela cheia (3.05.8.b) pelo cabeçalho ou tecla F11.',
      topics: [
        {
          id: 'recurso-tela-cheia',
          title: 'Como Ativar e Sair da Tela Cheia',
          summary: 'Instruções para navegação imersiva em desktops, notebooks, Smart TVs e tablets.',
          content: `### Modo Tela Cheia Integrado (Requisito 3.05.8.b)

A WikiZero conta com um recurso nativo de tela cheia que expande a área útil de leitura e edição:

1. **Pelo Teclado**: Pressione a tecla **F11** a qualquer momento.
2. **Pelo Cabeçalho**: Clique no botão **Tela Cheia** (ícone de expansão) localizado na barra de navegação superior, ao lado do seletor de tema claro/escuro.
3. **Pelo Menu de Ferramentas**: Acesse Ferramentas > Interface > Alternar Modo Tela Cheia.

#### Como Sair da Tela Cheia:
* Pressione **F11** novamente, ou pressione **Esc**, ou clique no botão **Sair da Tela Cheia** no cabeçalho.
* Todas as preferências de fonte, tema (Sépia, Dark, OLED, Windows 95) e leitura permanecem intactas ao entrar e sair da tela cheia.`,
          tags: ['tela cheia', 'fullscreen', 'f11', 'imersao'],
          tips: ['A tela cheia é ideal para leitura contínua de artigos longos e projeção em salas de aula ou Smart TVs.'],
        },
      ],
    },
    {
      id: 'edicao-e-artigos',
      title: 'Edição de Artigos & Sintaxe Wikitexto',
      icon: 'Edit3',
      description: 'Aprenda a formatar cabeçalhos, links internos, predefinições, caixas informativas e notas de rodapé.',
      topics: [
        {
          id: 'sintaxe-basica',
          title: 'Guia Rápido de Sintaxe Wikitexto',
          summary: 'Tabela de referência rápida dos códigos de formatação mais utilizados.',
          content: `### Tabela de Sintaxe Rápida

| O que você digita | O que a Wiki renderiza |
| :--- | :--- |
| \`'''Texto em Negrito'''\` | **Texto em Negrito** |
| \`''Texto em Itálico''\` | *Texto em Itálico* |
| \`== Seção Principal ==\` | Título de Seção H2 com âncora automática |
| \`=== Subseção ===\` | Subtítulo H3 |
| \`[[Nome do Artigo]]\` | Link interno direto para outro artigo da Wiki |
| \`[[Nome do Artigo|Texto Visível]]\` | Link com texto âncora customizado |
| \`[https://exemplo.org Site Externo]\` | Link para referência externa confiável |
| \`* Item com marcador\` | Lista de tópicos com marcadores |
| \`# Item numerado\` | Lista ordenada com numeração |
| \`<ref>Fonte bibliográfica</ref>\` | Nota de rodapé automática com índice |`,
          tags: ['wikitexto', 'edicao', 'formatacao', 'sintaxe'],
        },
        {
          id: 'predefinicoes-e-infoboxes',
          title: 'Predefinições e Caixas Informativas (Infoboxes)',
          summary: 'Como inserir quadros laterais resumidos com dados biográficos, geográficos ou técnicos.',
          content: `### Utilizando Infoboxes

Você pode enriquecer qualquer artigo incluindo predefinições estruturadas:
\`\`\`wikitext
{{Info/Biografia
| nome = Alan Turing
| nascimento = 23 de junho de 1912
| ocupacao = Matemático, Criptoanalista, Cientista da Computação
| nacionalidade = Britânico
}}
\`\`\`
Essas caixas são adaptadas automaticamente para todos os temas, incluindo alto contraste e leitura em smartphones.`,
          tags: ['infobox', 'predefinicoes', 'templates'],
        },
      ],
    },
    {
      id: 'comunidade-e-governanca',
      title: 'Comunidade, Burocratas & Governança',
      icon: 'Shield',
      description: 'Diretrizes éticas, mediação, Conselho de Burocratas e gestão de extensões.',
      topics: [
        {
          id: 'papel-do-burocrata',
          title: 'O Papel do Burocrata & Gerenciamento de Extensões',
          summary: 'Privilégios e responsabilidades dos membros do Conselho de Burocratas.',
          content: `### O Conselho de Burocratas (Bureaucrats)

Na WikiZero, o **Burocrata** é o nível máximo de confiança da comunidade técnica e editorial:
* **Controle de Extensões**: Habilitar e desabilitar módulos como Chat em Tempo Real, Ajuda Geral (F1), Temas Especiais e Backup com sincronização na nuvem Firebase.
* **Edição dos Arquivos de Ajuda (3.05.8.a)**: O Burocrata pode editar diretamente o conteúdo e a estrutura deste manual de ajuda através dos arquivos locais da extensão e do editor administrativo integrado.
* **Mediação & Segurança**: Avaliação de pedidos de promoção de usuários, desbloqueios e coordenação do Comitê de Arbitragem (ArbCom).`,
          tags: ['burocrata', 'governanca', 'extensoes', 'administracao'],
        },
      ],
    },
    {
      id: 'faq-e-suporte',
      title: 'Dúvidas Frequentes & Suporte LGPD',
      icon: 'HelpCircle',
      description: 'Perguntas comuns, portabilidade de dados e canal direto com o encarregado DPO.',
      topics: [
        {
          id: 'perguntas-frequentes',
          title: 'Perguntas Frequentes (FAQ)',
          summary: 'Respostas para as principais dúvidas dos novos membros.',
          content: `### FAQ - Dúvidas Comuns

**P: Meus artigos salvos ficam visíveis para outros usuários?**
R: Sim! Artigos publicados são sincronizados em nuvem e ficam disponíveis publicamente para consulta e colaboração.

**P: Como salvar artigos para ler sem internet?**
R: Clique no botão "Ler Depois" ou "Exportar PDF" no topo de qualquer verbete.

**P: Como entrar em contato com o suporte?**
R: Acesse a seção *Fale com a Administração* ou o canal de suporte técnico no menu lateral.`,
          tags: ['faq', 'duvidas', 'suporte'],
        },
      ],
    },
  ],
};

const HELP_STORAGE_KEY = 'wikizero_custom_help_content_v3058';

/**
 * Carrega a estrutura de ajuda atual:
 * Prioriza customizações salvas localmente pelo Burocrata, utilizando os dados padrão
 * dos arquivos locais da extensão como base.
 */
export function getHelpContent(): WikiHelpStructure {
  if (typeof window === 'undefined') {
    return DEFAULT_HELP_STRUCTURE;
  }

  try {
    const raw = localStorage.getItem(HELP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[GeneralHelp] Erro ao carregar customizações de ajuda locais:', err);
  }

  return DEFAULT_HELP_STRUCTURE;
}

/**
 * Salva customizações na estrutura de ajuda realizadas pelo Burocrata.
 */
export function saveCustomHelpContent(content: WikiHelpStructure): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const updated: WikiHelpStructure = {
      ...content,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(HELP_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('[GeneralHelp] Erro ao salvar ajuda personalizada:', err);
    return false;
  }
}

/**
 * Restaura a estrutura de ajuda para os padrões originais dos arquivos locais da extensão.
 */
export function resetHelpContentToDefault(): WikiHelpStructure {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HELP_STORAGE_KEY);
  }
  return DEFAULT_HELP_STRUCTURE;
}

/**
 * Gera o código TypeScript formatado para que o Burocrata possa copiar e salvar diretamente
 * no arquivo local `src/extensions/general-help/defaultHelpContent.ts` (Requisito 3.05.8.a).
 */
export function generateHelpContentTsCode(content: WikiHelpStructure): string {
  const json = JSON.stringify(content, null, 2);
  return `import { WikiHelpStructure } from './defaultHelpContent';\n\n// Código gerado pelo Editor de Ajuda do Burocrata (Requisito 3.05.8.a)\nexport const DEFAULT_HELP_STRUCTURE: WikiHelpStructure = ${json};\n`;
}
