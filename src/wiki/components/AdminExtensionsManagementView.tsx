import React, { useState, useEffect, useMemo } from 'react';
import {
  Puzzle,
  Shield,
  Crown,
  Search,
  CheckCircle2,
  XCircle,
  Power,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Code,
  Sliders,
  Layers,
  Info,
  Clock,
  BookOpen,
  Sigma,
  FileCode,
  Layout,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  History,
  Download,
  Filter,
  Eye,
  Check,
  Zap,
  Wrench,
  Calculator,
  Volume2,
  Edit3,
  Trophy,
  Share2,
  FileText,
  Settings,
  Upload,
  Play,
  Sparkles,
  Palette,
  CheckSquare,
  Globe,
  Bookmark,
  ListFilter,
  Tag,
  Copy,
} from 'lucide-react';
import { UserProfile, InstalledExtensionMeta, ExtensionCategory, ExtensionActionLog } from '../types';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';
import { StorageService } from '../services/storageService';

interface AdminExtensionsManagementViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onBack?: () => void;
}

export const AdminExtensionsManagementView: React.FC<AdminExtensionsManagementViewProps> = ({
  currentUser,
  onNavigateToUser,
  onBack,
}) => {
  const extensionManager = ExtensionManager.getInstance();

  const [extensions, setExtensions] = useState<InstalledExtensionMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'core' | 'custom'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showHooksModal, setShowHooksModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [inspectingExtension, setInspectingExtension] = useState<InstalledExtensionMeta | null>(null);
  const [extensionToDelete, setExtensionToDelete] = useState<InstalledExtensionMeta | null>(null);

  // Notifications / feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // New extension form state
  const [addMode, setAddMode] = useState<'form' | 'catalog' | 'json'>('catalog');
  const [newExtName, setNewExtName] = useState<string>('');
  const [newExtVersion, setNewExtVersion] = useState<string>('1.0.0');
  const [newExtDesc, setNewExtDesc] = useState<string>('');
  const [newExtCategory, setNewExtCategory] = useState<ExtensionCategory>('utility');
  const [newExtAuthor, setNewExtAuthor] = useState<string>('');
  const [newExtWebsite, setNewExtWebsite] = useState<string>('');
  const [newExtScript, setNewExtScript] = useState<string>('');
  const [newExtEnabled, setNewExtEnabled] = useState<boolean>(true);
  const [jsonManifest, setJsonManifest] = useState<string>('');

  // Template selector & sandbox testing state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [scriptTestResult, setScriptTestResult] = useState<{
    success: boolean;
    message: string;
    hooksRegistered?: { filters: string[]; actions: string[] };
  } | null>(null);

  // Export / Import Backup modals
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showImportBackupModal, setShowImportBackupModal] = useState<boolean>(false);
  const [backupJsonText, setBackupJsonText] = useState<string>('');
  const [copiedManifest, setCopiedManifest] = useState<boolean>(false);

  // Extension Settings Modal & Form
  const [activeInspectTab, setActiveInspectTab] = useState<'info' | 'settings'>('info');
  const [extensionSettingsForm, setExtensionSettingsForm] = useState<Record<string, any>>({});

  // Bureaucrat status
  const userIsBureaucrat = isUserBureaucrat(currentUser);

  // Load extensions list
  const refreshList = () => {
    const list = extensionManager.getAllInstalledExtensions();
    setExtensions(list);
  };

  useEffect(() => {
    refreshList();
    // Subscribe to extension manager events
    const unsubscribe = extensionManager.subscribe(() => {
      refreshList();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Toggle Activation / Deactivation
  const handleToggleExtension = async (ext: InstalledExtensionMeta) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas usuários com a prerrogativa de Burocrata podem ativar ou desativar extensões.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (ext.enabled) {
        const res = extensionManager.deactivateExtension(ext.name, currentUser);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      } else {
        const res = extensionManager.activateExtension(ext.name, currentUser);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
      refreshList();
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao alterar estado: ${err?.message || 'Desconhecido'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Remove Extension
  const handleConfirmDelete = async () => {
    if (!extensionToDelete) return;
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas possuem autorização para desinstalar extensões da Wiki.',
      });
      setExtensionToDelete(null);
      return;
    }

    setIsProcessing(true);
    try {
      const res = extensionManager.removeExtension(extensionToDelete.name, currentUser);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setExtensionToDelete(null);
      refreshList();
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao remover extensão: ${err?.message || 'Desconhecido'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Add Custom Extension
  const handleCreateExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Ação bloqueada: Apenas Burocratas podem adicionar novas extensões.',
      });
      return;
    }

    if (!newExtName.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe o nome da extensão.' });
      return;
    }

    const res = extensionManager.addExtension(
      {
        name: newExtName.trim(),
        version: newExtVersion.trim() || '1.0.0',
        description: newExtDesc.trim(),
        category: newExtCategory,
        author: newExtAuthor.trim() || currentUser?.displayName || currentUser?.username || 'Burocrata',
        website: newExtWebsite.trim() || undefined,
        customScript: newExtScript.trim() || undefined,
        enabled: newExtEnabled,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      resetAddForm();
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Handle Quick Install from Catalog
  const handleInstallFromCatalog = (catalogItem: {
    name: string;
    version: string;
    description: string;
    category: ExtensionCategory;
    author: string;
    hooks: string[];
    script?: string;
  }) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas podem instalar extensões do catálogo.',
      });
      return;
    }

    const res = extensionManager.addExtension(
      {
        name: catalogItem.name,
        version: catalogItem.version,
        description: catalogItem.description,
        category: catalogItem.category,
        author: catalogItem.author,
        hooks: catalogItem.hooks,
        customScript: catalogItem.script,
        enabled: true,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Handle Import JSON Manifest
  const handleImportJson = () => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas podem importar manifestos de extensões.',
      });
      return;
    }

    try {
      const parsed = JSON.parse(jsonManifest);
      if (!parsed.name) {
        setFeedback({ type: 'error', message: 'O JSON deve conter ao menos o campo "name".' });
        return;
      }

      const res = extensionManager.addExtension(
        {
          name: parsed.name,
          version: parsed.version || '1.0.0',
          description: parsed.description || '',
          category: parsed.category || 'utility',
          author: parsed.author || currentUser?.displayName || 'Burocrata',
          website: parsed.website,
          customScript: parsed.customScript || parsed.script,
          hooks: Array.isArray(parsed.hooks) ? parsed.hooks : ['render:wikitext'],
          enabled: parsed.enabled !== false,
        },
        currentUser
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowAddModal(false);
        setJsonManifest('');
        refreshList();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: `JSON inválido: ${e?.message || 'Formato incorreto'}` });
    }
  };

  const resetAddForm = () => {
    setNewExtName('');
    setNewExtVersion('1.0.0');
    setNewExtDesc('');
    setNewExtCategory('utility');
    setNewExtAuthor('');
    setNewExtWebsite('');
    setNewExtScript('');
    setNewExtEnabled(true);
    setJsonManifest('');
    setSelectedTemplate('blank');
    setScriptTestResult(null);
  };

  // Handler para troca de modelo / template de código
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setScriptTestResult(null);
    const targetName = newExtName.trim() || 'MinhaExtensao';

    switch (templateId) {
      case 'text_filter':
        setNewExtCategory('formatting');
        setNewExtDesc('Filtra e aprimora marcações e expressões dentro do wikitexto.');
        setNewExtScript(`// Hook de Filtro de Wikitexto (render:wikitext)
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  // Substitui termos ou aplica formatações inline
  return text.replace(/\\b(Rascunho|WIP)\\b/gi, '<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">RASCUNHO</span>');
}, 12, extensionName);`);
        break;

      case 'html_modifier':
        setNewExtCategory('rendering');
        setNewExtDesc('Manipula a árvore de HTML pós-renderização do artigo.');
        setNewExtScript(`// Hook de Modificação de HTML (render:html)
hooks.addFilter('render:html', function(html) {
  if (!html) return html;
  // Envolve ou decora blocos de conteúdo
  return '<div class="wiki-enhanced-block">' + html + '</div>';
}, 20, extensionName);`);
        break;

      case 'editor_button':
        setNewExtCategory('editor');
        setNewExtDesc('Disponibiliza novo botão de atalho ou snippet na barra de ferramentas do editor.');
        setNewExtScript(`// Registra botão dinâmico na barra de ferramentas do editor
api.registerEditorPlugin({
  buttonId: 'btn-' + extensionName.toLowerCase(),
  label: 'Snippet ' + extensionName,
  tooltip: 'Inserir seção padronizada ' + extensionName,
  snippetTemplate: '== Seção Especial ==\\n\\n* Ponto de Destaque 1\\n* Ponto de Destaque 2\\n'
});`);
        break;

      case 'article_action':
        setNewExtCategory('social');
        setNewExtDesc('Adiciona botão de ação direta no cabeçalho interativo do artigo.');
        setNewExtScript(`// Registra ação dinâmica no topo dos artigos
api.registerArticleAction({
  id: 'action-' + extensionName.toLowerCase(),
  label: 'Ação ' + extensionName,
  tooltip: 'Disparar funcionalidade da extensão',
  badge: 'Novo',
  onClick: function(ctx) {
    var title = ctx.article.titulo;
    if (navigator.clipboard) {
      navigator.clipboard.writeText('Compartilhado: ' + title + ' - ' + window.location.href);
    }
    alert('Ação disparada com sucesso para o artigo: ' + title);
  }
});`);
        break;

      case 'article_widget':
        setNewExtCategory('gamification');
        setNewExtDesc('Insere um painel interativo de widget ao final do artigo.');
        setNewExtScript(`// Registra widget renderizado ao final do verbete
api.registerWidget({
  id: 'widget-' + extensionName.toLowerCase(),
  title: 'Painel ' + extensionName,
  render: function(article) {
    return React.createElement('div', {
      className: 'p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between'
    },
      React.createElement('span', { className: 'font-semibold' }, 'Extensão ativa: ' + article.titulo),
      React.createElement('span', { className: 'font-mono text-[10px] bg-purple-200 dark:bg-purple-900 px-2 py-0.5 rounded' }, article.descricao.length + ' bytes')
    );
  }
});`);
        break;

      case 'custom_tool':
        setNewExtCategory('ferramenta');
        setNewExtDesc('Cria utilitário interativo com formulário e cálculo exibido em Special:Tools.');
        setNewExtScript(`// Registra ferramenta interativa na central Special:Tools
api.registerCustomTool({
  id: 'tool-' + extensionName.toLowerCase(),
  name: extensionName,
  title: 'Calculadora ' + extensionName,
  subtitle: 'Utilitário interativo com entradas dinâmicas',
  description: 'Calcula resultados matemáticos imediatos a partir dos parâmetros informados.',
  inputs: [
    { id: 'parametroA', label: 'Primeiro Fator', type: 'number', defaultValue: 10 },
    { id: 'parametroB', label: 'Segundo Fator', type: 'number', defaultValue: 5 }
  ],
  calculationFormula: 'inputs.parametroA * inputs.parametroB',
  unitSuffix: 'pts'
});`);
        break;

      case 'security_guard':
        setNewExtCategory('security');
        setNewExtDesc('Filtro de validação antes de permitir salvar o artigo no banco de dados.');
        setNewExtScript(`// Filtro de segurança pré-salvamento (Anti-Spam / Regras)
hooks.addFilter('editor:before_save', function(state, data) {
  if (!state || !state.allow) return state;
  var text = (data.titulo + ' ' + data.descricao).toLowerCase();
  if (text.indexOf('spam-proibido') !== -1) {
    return { allow: false, reason: 'Bloqueado por filtro de integridade ' + extensionName };
  }
  return state;
}, 5, extensionName);`);
        break;

      default:
        break;
    }
  };

  // Testador de script em sandbox
  const handleTestScript = () => {
    if (!newExtScript.trim()) {
      setScriptTestResult({
        success: false,
        message: 'Por favor, escreva algum código no campo de script antes de testar.',
      });
      return;
    }

    const testName = newExtName.trim() || 'SandboxExtension';
    const res = extensionManager.testCustomScript(newExtScript, testName);
    setScriptTestResult(res);
  };

  // Salvar configurações personalizadas de uma extensão
  const handleSaveSettings = (extName: string) => {
    if (!userIsBureaucrat) {
      setFeedback({ type: 'error', message: 'Apenas burocratas podem alterar configurações de extensões.' });
      return;
    }

    const res = extensionManager.saveExtensionSettings(extName, extensionSettingsForm, currentUser);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Importar pacote de extensões via JSON
  const handleImportBackup = () => {
    if (!userIsBureaucrat) {
      setFeedback({ type: 'error', message: 'Apenas burocratas podem importar pacotes de extensões.' });
      return;
    }

    if (!backupJsonText.trim()) {
      setFeedback({ type: 'error', message: 'Cole o manifesto JSON para importar.' });
      return;
    }

    const res = extensionManager.importExtensionsManifest(backupJsonText, currentUser);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowImportBackupModal(false);
      setBackupJsonText('');
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Abertura do modal de inspeção e configurações
  const handleOpenInspect = (ext: InstalledExtensionMeta) => {
    setInspectingExtension(ext);
    setActiveInspectTab('info');
    setExtensionSettingsForm(extensionManager.getExtensionSettings(ext.name) || {});
  };

  // Filtered extensions
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      // Category filter
      if (selectedCategory !== 'all' && ext.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !ext.enabled) return false;
      if (statusFilter === 'inactive' && ext.enabled) return false;
      if (statusFilter === 'core' && !ext.isCore) return false;
      if (statusFilter === 'custom' && ext.isCore) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ext.name.toLowerCase().includes(q);
        const matchesDesc = ext.description.toLowerCase().includes(q);
        const matchesAuthor = ext.author.toLowerCase().includes(q);
        const matchesHooks = ext.hooks.some((h) => h.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesAuthor && !matchesHooks) {
          return false;
        }
      }
      return true;
    });
  }, [extensions, selectedCategory, statusFilter, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = extensions.length;
    const active = extensions.filter((e) => e.enabled).length;
    const inactive = total - active;
    const core = extensions.filter((e) => e.isCore).length;
    const custom = total - core;
    const allHooksCount = extensionManager.getHooksAudit().length;
    return { total, active, inactive, core, custom, allHooksCount };
  }, [extensions]);

  // Pre-configured catalog extensions for quick installation
  const catalogExtensions = [
    {
      name: 'DynamicTableFilter',
      version: '1.0.4',
      description: 'Adiciona caixas de busca e ordenação instantânea por coluna em tabelas Wikitext ({| class="wikitable").',
      category: 'interface' as ExtensionCategory,
      author: 'Equipe de Dados WikiZero',
      hooks: ['render:wikitext', 'render:html'],
      script: `// Hook de aprimoramento de tabelas
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text.replace(/class="wikitable"/g, 'class="wikitable sortable-table shadow-xs"');
}, 11, extensionName);`,
    },
    {
      name: 'AbbreviationGlossary',
      version: '1.1.0',
      description: 'Detecta siglas comuns (e.g. ONU, OMS, IA, USP) e anexa tooltips com significado por extenso automaticamente.',
      category: 'content' as ExtensionCategory,
      author: 'Linguística & Vocabulário',
      hooks: ['render:wikitext'],
      script: `// Glossário dinâmico de abreviaturas
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text.replace(/\\b(ONU|OMS|UNESCO|LGBTQIA\\+|IA|MEC|SUS)\\b/g, '<abbr title="Termo Enciclopédico" class="underline decoration-dotted font-semibold cursor-help">$1</abbr>');
}, 14, extensionName);`,
    },
    {
      name: 'PrintOptimizationCleanView',
      version: '1.2.1',
      description: 'Remove elementos de navegação e ajusta margens e fontes para geração limpa de documentos PDF e impressão física.',
      category: 'formatting' as ExtensionCategory,
      author: 'Publicações WikiWorldWeb',
      hooks: ['render:html'],
      script: `// Otimizador de impressão
hooks.addFilter('render:html', function(html) {
  return '<div class="wiki-clean-print">' + html + '</div>';
}, 25, extensionName);`,
    },
    {
      name: 'ScientificNotationFormatter',
      version: '1.0.2',
      description: 'Formata expoentes científicos e unidades do Sistema Internacional (SI) no padrão tipográfico internacional.',
      category: 'rendering' as ExtensionCategory,
      author: 'Física & Metrologia',
      hooks: ['render:wikitext'],
      script: `// Formatação de grandezas
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text.replace(/(\\d+)\\s*(m\\/s²|km\\/h|m²|m³|cm²)/g, '$1 <span class="font-mono text-xs">$2</span>');
}, 15, extensionName);`,
    },
    {
      name: 'UnitConverterInteractiveTool',
      version: '1.3.0',
      description: 'Ferramenta interativa de conversão de grandezas físicas (Temperatura, Comprimento e Massa) integrada a Special:Tools.',
      category: 'ferramenta' as ExtensionCategory,
      author: 'Laboratório de Ciências Exatas',
      hooks: ['tools:custom_configs'],
      script: `// Registra ferramenta interativa na central Special:Tools
api.registerCustomTool({
  id: 'unit-converter',
  name: 'Conversor de Unidades',
  title: 'Conversor Métrico & Imperial',
  subtitle: 'Conversor instantâneo de temperatura e grandezas físicas',
  description: 'Converte valores métricos (°C) em Fahrenheit (°F) usando a fórmula termodinâmica oficial.',
  inputs: [
    { id: 'temperatura', label: 'Temperatura em Celsius (°C)', type: 'number', defaultValue: 25 },
    { id: 'fator', label: 'Fator Multiplicador (1.8 padrão)', type: 'number', defaultValue: 1.8 }
  ],
  calculationFormula: '(inputs.temperatura * inputs.fator) + 32',
  unitSuffix: '°F'
});`,
    },
    {
      name: 'CitationQuickHelper',
      version: '1.0.5',
      description: 'Adiciona botão na barra de ferramentas do editor de wikitexto para inclusão imediata de referências no padrão ABNT NBR 6023.',
      category: 'editor' as ExtensionCategory,
      author: 'Comitê Editorial & Metodologia',
      hooks: ['editor:plugins'],
      script: `// Registra botão dinâmico no editor
api.registerEditorPlugin({
  buttonId: 'btn-citation-abnt',
  label: 'Citação ABNT',
  tooltip: 'Inserir modelo rápido de citação acadêmica ABNT',
  snippetTemplate: '<ref>{{Citação|autor=SOBRENOME, Nome|titulo=Título do Livro|ano=2024|editora=Editora}}</ref>'
});`,
    },
    {
      name: 'SocialCardShareAction',
      version: '1.1.2',
      description: 'Adiciona ação no topo do verbete para gerar e copiar link e cartão de citação para redes sociais e divulgação científica.',
      category: 'social' as ExtensionCategory,
      author: 'Comunicação WikiZero',
      hooks: ['article:actions'],
      script: `// Registra ação dinâmica no topo dos artigos
api.registerArticleAction({
  id: 'action-social-card',
  label: 'Card Social',
  tooltip: 'Copiar texto formatado para compartilhamento acadêmico',
  badge: 'Social',
  onClick: function(ctx) {
    var shareMsg = '📖 Verbete Enciclopédico: ' + ctx.article.titulo + '\\n🔗 Leia na íntegra no WikiWorldWeb: ' + window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMsg);
    }
    alert('Mensagem copiada para a área de transferência:\\n\\n' + shareMsg);
  }
});`,
    },
    {
      name: 'ArticleQuizWidget',
      version: '1.2.0',
      description: 'Insere um widget de perguntas e fixação de leitura (Gamificação) ao final dos artigos enciclopédicos.',
      category: 'gamification' as ExtensionCategory,
      author: 'Educação & Pedagogia Digital',
      hooks: ['article:widgets'],
      script: `// Widget de fixação ao fim dos artigos
api.registerWidget({
  id: 'widget-article-quiz',
  title: 'Desafio de Fixação da Leitura',
  render: function(article) {
    return React.createElement('div', {
      className: 'p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 text-xs space-y-2'
    },
      React.createElement('div', { className: 'font-bold flex items-center gap-1.5' }, '⭐ Quiz Rápido sobre: ' + article.titulo),
      React.createElement('p', null, 'Você concluiu a leitura deste verbete com sucesso! Teste seus conhecimentos respondendo às questões comunitárias.'),
      React.createElement('button', {
        type: 'button',
        className: 'px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs',
        onClick: function() { alert('Parabéns pela leitura de ' + article.titulo + '! Você ganhou +10 pontos enciclopédicos.'); }
      }, 'Iniciar Teste de Conhecimento')
    );
  }
});`,
    },
    {
      name: 'TypographyAutoNormalizer',
      version: '1.0.8',
      description: 'Bot de automação que normaliza aspas inglesas (" ") em aspas angulares (« »), elipses (...) e travessões longos (—).',
      category: 'automation' as ExtensionCategory,
      author: 'Revisão & Estilo Linguístico',
      hooks: ['render:wikitext'],
      script: `// Correção automática de pontuação tipográfica
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text
    .replace(/--/g, '—')
    .replace(/\\.\\.\\./g, '…');
}, 13, extensionName);`,
    },
    {
      name: 'LexicalComplexityAnalyzer',
      version: '1.1.0',
      description: 'Widget analítico de complexidade vocabular, densidade lexical e estimativa de nível de instrução para o leitor.',
      category: 'analytics' as ExtensionCategory,
      author: 'Métricas & Cienciometria',
      hooks: ['article:widgets'],
      script: `// Widget de análise de densidade lexical
api.registerWidget({
  id: 'widget-lexical-analyzer',
  title: 'Métricas de Complexidade & Densidade Lexical',
  render: function(article) {
    var raw = (article.descricao || '').replace(/<[^>]+>/g, '');
    var words = raw.split(/\\s+/).filter(Boolean);
    var wordCount = words.length;
    var uniqueWords = new Set(words.map(function(w) { return w.toLowerCase(); })).size;
    var density = wordCount > 0 ? ((uniqueWords / wordCount) * 100).toFixed(1) : 0;
    return React.createElement('div', {
      className: 'grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 text-xs'
    },
      React.createElement('div', null, React.createElement('div', { className: 'text-[10px] text-teal-600 uppercase font-mono' }, 'Palavras Totais'), React.createElement('div', { className: 'text-base font-bold' }, wordCount)),
      React.createElement('div', null, React.createElement('div', { className: 'text-[10px] text-teal-600 uppercase font-mono' }, 'Vocábulos Únicos'), React.createElement('div', { className: 'text-base font-bold' }, uniqueWords)),
      React.createElement('div', null, React.createElement('div', { className: 'text-[10px] text-teal-600 uppercase font-mono' }, 'Densidade Lexical'), React.createElement('div', { className: 'text-base font-bold' }, density + '%'))
    );
  }
});`,
    },
  ];

  // Render Category Icon
  const getCategoryIcon = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'ferramenta':
      case 'tool':
        return <Wrench className="w-4 h-4 text-cyan-500" />;
      case 'rendering':
        return <Sigma className="w-4 h-4 text-indigo-500" />;
      case 'formatting':
        return <FileCode className="w-4 h-4 text-purple-500" />;
      case 'content':
        return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'utility':
        return <Sliders className="w-4 h-4 text-amber-500" />;
      case 'interface':
        return <Layout className="w-4 h-4 text-blue-500" />;
      case 'security':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'editor':
        return <Edit3 className="w-4 h-4 text-emerald-500" />;
      case 'multimedia':
        return <Volume2 className="w-4 h-4 text-pink-500" />;
      case 'gamification':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'social':
        return <Share2 className="w-4 h-4 text-sky-500" />;
      case 'automation':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'analytics':
        return <Activity className="w-4 h-4 text-teal-500" />;
      default:
        return <Puzzle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'ferramenta':
      case 'tool':
        return 'Ferramenta Interativa';
      case 'rendering':
        return 'Renderização & LaTeX';
      case 'formatting':
        return 'Formatação & Tipografia';
      case 'content':
        return 'Conteúdo & Referências';
      case 'utility':
        return 'Utilitários & Métricas';
      case 'interface':
        return 'Interface & Mobile';
      case 'security':
        return 'Segurança & Moderação';
      case 'editor':
        return 'Editor & Snippets';
      case 'multimedia':
        return 'Multimídia & Áudio';
      case 'gamification':
        return 'Gamificação & Quizzes';
      case 'social':
        return 'Social & Compartilhamento';
      case 'automation':
        return 'Automação & Corretores';
      case 'analytics':
        return 'Análise & Estatísticas';
      default:
        return cat;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Special:Extensions
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Barramento de Módulos & Ganchos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Gerenciamento de Extensões da Wiki
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Painel soberano de controle de extensões do WikiZero. De acordo com as diretrizes constitucionais,
            <strong> apenas burocratas do Conselho</strong> possuem atribuição para adicionar, remover, ativar ou desativar extensões.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHooksModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
            title="Inspecionar filtros e ações registrados no HookRegistry"
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Barramento de Hooks ({stats.allHooksCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
            title="Histórico de ativações e remoções de extensões"
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>Auditoria</span>
          </button>

          <button
            type="button"
            onClick={() => {
              refreshList();
              setFeedback({ type: 'info', message: 'Lista de extensões atualizada.' });
            }}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Recarregar catálogo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* EXPORT EXTENSIONS MANIFEST */}
          <button
            type="button"
            onClick={() => {
              setCopiedManifest(false);
              setShowExportModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
            title="Exportar manifesto e backup completo de extensões instaladas"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exportar Pacote</span>
          </button>

          {/* IMPORT EXTENSIONS MANIFEST (BUREAUCRAT ONLY) */}
          {userIsBureaucrat && (
            <button
              type="button"
              onClick={() => {
                setBackupJsonText('');
                setShowImportBackupModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
              title="Importar ou restaurar extensões a partir de manifesto JSON"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Importar Pacote</span>
            </button>
          )}

          {/* ADD EXTENSION BUTTON (BUREAUCRAT ONLY) */}
          <button
            type="button"
            onClick={() => {
              if (!userIsBureaucrat) {
                setFeedback({
                  type: 'error',
                  message: 'Acesso restrito: Apenas Burocratas podem adicionar novas extensões.',
                });
                return;
              }
              setShowAddModal(true);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg shadow-sm transition ${
              userIsBureaucrat
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            }`}
            title={
              userIsBureaucrat
                ? 'Adicionar nova extensão à Wiki'
                : 'Apenas Burocratas podem adicionar extensões'
            }
          >
            {userIsBureaucrat ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>Nova Extensão</span>
          </button>
        </div>
      </div>

      {/* Bureaucrat Authentication Status Banner */}
      <div className="mt-4">
        {userIsBureaucrat ? (
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 flex items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-100">
                  Prerrogativas de Burocrata Reconhecidas:
                </span>{' '}
                <span>
                  Você está autenticado como <strong>{currentUser?.displayName || currentUser?.username || currentUser?.email}</strong>{' '}
                  ({currentUser?.group || currentUser?.role}). Você possui poderes plenos para <strong>ativar, desativar, adicionar ou remover</strong> extensões do sistema.
                </span>
              </div>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
              Operador Autorizado
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-600 text-white shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-100">
                  Modo de Somente Leitura (Consulta Pública):
                </span>{' '}
                <span>
                  Você está visualizando o catálogo de extensões instaladas. Por governança constitucional, apenas usuários com a atribuição de{' '}
                  <strong>Burocrata (Bureaucrat)</strong> podem modificar o estado das extensões.
                </span>
              </div>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              Somente Leitura
            </span>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <Info className="w-4 h-4 text-blue-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Instaladas</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ativas / Operantes
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-200 mt-1">
            {stats.active}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Desativadas</div>
          <div className="text-2xl font-bold font-mono text-slate-600 dark:text-slate-400 mt-1">
            {stats.inactive}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">Extensões Core</div>
          <div className="text-2xl font-bold font-mono text-purple-800 dark:text-purple-200 mt-1">
            {stats.core}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">Personalizadas</div>
          <div className="text-2xl font-bold font-mono text-indigo-800 dark:text-indigo-200 mt-1">
            {stats.custom}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Ganchos Ativos</div>
          <div className="text-2xl font-bold font-mono text-blue-800 dark:text-blue-200 mt-1">
            {stats.allHooksCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, descrição, gancho (e.g. render:wikitext)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="ferramenta">Ferramentas Interativas</option>
            <option value="rendering">Renderização & LaTeX</option>
            <option value="formatting">Formatação & Tipografia</option>
            <option value="content">Conteúdo & Referências</option>
            <option value="utility">Utilitários & Métricas</option>
            <option value="interface">Interface & Mobile</option>
            <option value="security">Segurança & Moderação</option>
            <option value="editor">Editor & Snippets</option>
            <option value="multimedia">Multimídia & Áudio</option>
            <option value="gamification">Gamificação & Quizzes</option>
            <option value="social">Social & Compartilhamento</option>
            <option value="automation">Automação & Corretores</option>
            <option value="analytics">Análise & Estatísticas</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativas ({stats.active})</option>
            <option value="inactive">Apenas Desativadas ({stats.inactive})</option>
            <option value="core">Apenas Nativas (Core)</option>
            <option value="custom">Apenas Personalizadas</option>
          </select>

          {/* View Layout Toggle */}
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded text-xs font-semibold ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização em Grade"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded text-xs font-semibold ${
                viewLayout === 'table'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização em Tabela"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Extensions Listing */}
      <div className="mt-6">
        {filteredExtensions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40">
            <Puzzle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhuma extensão encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Nenhuma extensão corresponde aos critérios de busca ou filtros selecionados.
            </p>
            {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
                className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : viewLayout === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.name}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs ${
                  ext.enabled
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                    : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 opacity-80'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {getCategoryIcon(ext.category)}
                        <span>{getCategoryLabel(ext.category)}</span>
                      </span>

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        v{ext.version}
                      </span>

                      {ext.isCore ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Core
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ext.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          Desativada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {ext.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mantido por: <span className="font-medium text-slate-700 dark:text-slate-300">{ext.author}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                    {ext.description}
                  </p>

                  {/* Registered Hooks Tags */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Pontos de Gancho (Hooks)</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">{ext.hooks.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ext.hooks.map((hook) => (
                        <span
                          key={hook}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {hook}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenInspect(ext)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-2 py-1 rounded transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalhes</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* BUREAUCRAT ONLY: REMOVE BUTTON (Only for non-core extensions) */}
                    {!ext.isCore && (
                      <button
                        type="button"
                        disabled={!userIsBureaucrat || isProcessing}
                        onClick={() => {
                          if (!userIsBureaucrat) {
                            setFeedback({
                              type: 'error',
                              message: 'Apenas Burocratas podem remover extensões instaladas.',
                            });
                            return;
                          }
                          setExtensionToDelete(ext);
                        }}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          userIsBureaucrat
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700'
                            : 'text-slate-400 opacity-50 cursor-not-allowed'
                        }`}
                        title={
                          userIsBureaucrat
                            ? 'Desinstalar e remover extensão'
                            : 'Apenas Burocratas podem remover extensões'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* BUREAUCRAT ONLY: TOGGLE SWITCH (ATIVAR / DESATIVAR) */}
                    <button
                      type="button"
                      disabled={!userIsBureaucrat || isProcessing}
                      onClick={() => handleToggleExtension(ext)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        !userIsBureaucrat
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : ext.enabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                      title={
                        userIsBureaucrat
                          ? ext.enabled
                            ? 'Clique para desativar a extensão'
                            : 'Clique para ativar a extensão'
                          : 'Apenas Burocratas podem ativar/desativar extensões'
                      }
                    >
                      {!userIsBureaucrat ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Bloqueado</span>
                        </>
                      ) : ext.enabled ? (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Ativa</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5 opacity-60" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  <tr>
                    <th className="px-4 py-3 font-bold">Extensão</th>
                    <th className="px-3 py-3 font-bold">Categoria</th>
                    <th className="px-3 py-3 font-bold">Versão</th>
                    <th className="px-3 py-3 font-bold">Autor</th>
                    <th className="px-3 py-3 font-bold">Ganchos</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Ação do Burocrata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredExtensions.map((ext) => (
                    <tr
                      key={ext.name}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {ext.name}
                          {ext.isCore && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Core
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                          {ext.description}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          {getCategoryIcon(ext.category)}
                          <span>{getCategoryLabel(ext.category)}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-purple-700 dark:text-purple-300 font-bold">
                        v{ext.version}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400">
                        {ext.author}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {ext.hooks.length} ganchos
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        {ext.enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Desativada
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenInspect(ext)}
                            className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title="Ver detalhes e configurações"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!ext.isCore && (
                            <button
                              type="button"
                              disabled={!userIsBureaucrat || isProcessing}
                              onClick={() => {
                                if (!userIsBureaucrat) {
                                  setFeedback({
                                    type: 'error',
                                    message: 'Apenas Burocratas podem remover extensões instaladas.',
                                  });
                                  return;
                                }
                                setExtensionToDelete(ext);
                              }}
                              className={`p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 ${
                                !userIsBureaucrat ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                              title={
                                userIsBureaucrat
                                  ? 'Remover extensão'
                                  : 'Apenas Burocratas podem remover extensões'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={!userIsBureaucrat || isProcessing}
                            onClick={() => handleToggleExtension(ext)}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition inline-flex items-center gap-1 ${
                              !userIsBureaucrat
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : ext.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {!userIsBureaucrat ? (
                              <Lock className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Power className="w-3 h-3" />
                            )}
                            <span>{ext.enabled ? 'Ativa' : 'Ativar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / INSTALL EXTENSION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Instalar Nova Extensão na Wiki
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prerrogativa exclusiva do Burocrata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setAddMode('catalog')}
                className={`py-3 px-4 border-b-2 transition ${
                  addMode === 'catalog'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                1. Catálogo Oficial
              </button>
              <button
                type="button"
                onClick={() => setAddMode('form')}
                className={`py-3 px-4 border-b-2 transition ${
                  addMode === 'form'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                2. Extensão Personalizada
              </button>
              <button
                type="button"
                onClick={() => setAddMode('json')}
                className={`py-3 px-4 border-b-2 transition ${
                  addMode === 'json'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                3. Importar JSON
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {addMode === 'catalog' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Selecione um pacote de extensão pré-validado pelo Conselho de Burocratas para instalação imediata:
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {catalogExtensions.map((item) => {
                      const alreadyInstalled = extensions.some((e) => e.name === item.name);
                      return (
                        <div
                          key={item.name}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                                v{item.version}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {getCategoryLabel(item.category)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              {item.hooks.map((h) => (
                                <span
                                  key={h}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={alreadyInstalled || !userIsBureaucrat}
                            onClick={() => handleInstallFromCatalog(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                              alreadyInstalled
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                            }`}
                          >
                            {alreadyInstalled ? 'Já Instalada' : 'Instalar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {addMode === 'form' && (
                <form onSubmit={handleCreateExtension} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome da Extensão (Sem espaços) *
                      </label>
                      <input
                        type="text"
                        value={newExtName}
                        onChange={(e) => setNewExtName(e.target.value.replace(/\s+/g, ''))}
                        placeholder="Ex: CitationValidator"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Versão (SemVer)
                      </label>
                      <input
                        type="text"
                        value={newExtVersion}
                        onChange={(e) => setNewExtVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Categoria da Extensão *
                      </label>
                      <select
                        value={newExtCategory}
                        onChange={(e) => setNewExtCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="ferramenta">Ferramenta Interativa</option>
                        <option value="rendering">Renderização & LaTeX</option>
                        <option value="formatting">Formatação & Tipografia</option>
                        <option value="content">Conteúdo & Referências</option>
                        <option value="utility">Utilitários & Métricas</option>
                        <option value="interface">Interface & Mobile</option>
                        <option value="security">Segurança & Moderação</option>
                        <option value="editor">Editor & Snippets</option>
                        <option value="multimedia">Multimídia & Áudio</option>
                        <option value="gamification">Gamificação & Quizzes</option>
                        <option value="social">Social & Compartilhamento</option>
                        <option value="automation">Automação & Corretores</option>
                        <option value="analytics">Análise & Estatísticas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Autor / Mantenedor
                      </label>
                      <input
                        type="text"
                        value={newExtAuthor}
                        onChange={(e) => setNewExtAuthor(e.target.value)}
                        placeholder={currentUser?.displayName || 'Burocrata'}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição da Funcionalidade *
                    </label>
                    <textarea
                      value={newExtDesc}
                      onChange={(e) => setNewExtDesc(e.target.value)}
                      placeholder="Explique o propósito enciclopédico desta extensão..."
                      rows={2}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Template de Inicialização de Código */}
                  <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Carregar Modelo de Código (Template)</span>
                      </label>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                        Preenche a estrutura automaticamente
                      </span>
                    </div>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="blank">Personalizado (Em Branco)</option>
                      <option value="text_filter">Filtro de Texto (render:wikitext) - Substituição de termos</option>
                      <option value="html_modifier">Modificador de HTML (render:html) - Decoração de blocos</option>
                      <option value="editor_button">Botão do Editor (api.registerEditorPlugin) - Inserção de snippets</option>
                      <option value="article_action">Ação no Artigo (api.registerArticleAction) - Botão interativo no topo</option>
                      <option value="article_widget">Widget no Fim do Artigo (api.registerWidget) - Painel ao final</option>
                      <option value="custom_tool">Ferramenta Interativa de Cálculo (api.registerCustomTool) - Special:Tools</option>
                      <option value="security_guard">Guardião de Segurança (editor:before_save) - Validação pré-salvamento</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Código do Gancho / Script (JavaScript)
                      </label>
                      <button
                        type="button"
                        onClick={handleTestScript}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-[11px] transition shadow-2xs"
                        title="Executa o script em sandbox seguro para verificar sintaxe e ganchos registrados"
                      >
                        <Play className="w-3 h-3 text-blue-600" />
                        <span>Testar no Sandbox</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5 font-mono">
                      Variáveis disponíveis: <code>hooks</code>, <code>extensionName</code>, <code>api</code> (registerEditorPlugin, registerArticleAction, registerWidget, registerCustomTool).
                    </p>
                    <textarea
                      value={newExtScript}
                      onChange={(e) => {
                        setNewExtScript(e.target.value);
                        setScriptTestResult(null);
                      }}
                      placeholder={`hooks.addFilter('render:wikitext', function(text) {\n  return text;\n}, 10, extensionName);`}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 leading-relaxed"
                    />

                    {/* Test result feedback banner */}
                    {scriptTestResult && (
                      <div
                        className={`mt-2 p-2.5 rounded-lg border text-[11px] font-mono flex items-start gap-2 ${
                          scriptTestResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                        }`}
                      >
                        {scriptTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <span className="font-bold">
                            {scriptTestResult.success ? 'Sandbox Validação: OK' : 'Sandbox Falha:'}
                          </span>{' '}
                          <span>{scriptTestResult.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enabledCheck"
                      checked={newExtEnabled}
                      onChange={(e) => setNewExtEnabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <label htmlFor="enabledCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                      Ativar extensão imediatamente após o registro
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!userIsBureaucrat}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                    >
                      Registrar Extensão
                    </button>
                  </div>
                </form>
              )}

              {addMode === 'json' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Cole o manifesto JSON da extensão que deseja importar:
                  </p>
                  <textarea
                    value={jsonManifest}
                    onChange={(e) => setJsonManifest(e.target.value)}
                    placeholder={`{\n  "name": "CustomHeaderBanner",\n  "version": "1.0.0",\n  "description": "Exibe aviso no cabeçalho dos artigos",\n  "category": "interface",\n  "author": "Equipe WikiZero",\n  "hooks": ["render:html"]\n}`}
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 text-purple-300 font-mono text-xs border border-slate-700 leading-relaxed"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!jsonManifest.trim() || !userIsBureaucrat}
                      onClick={handleImportJson}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                    >
                      Importar e Instalar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HOOKS INSPECTOR */}
      {showHooksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Inspeção do Barramento de Ganchos (HookRegistry)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ouvintes ativos para filtros e ações em tempo de execução
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHooksModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Nome do Gancho</th>
                      <th className="px-3 py-2.5">Extensão Proprietária</th>
                      <th className="px-3 py-2.5">Prioridade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {extensionManager.getHooksAudit().map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'filter'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                          {item.hookName}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-sans">
                          {item.extensionName}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{item.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT LOGS */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Histórico de Auditoria de Extensões
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro de ações tomadas por burocratas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {StorageService.getExtensionActionLogs().length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhuma alteração registrada até o momento.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {StorageService.getExtensionActionLogs().map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              log.action === 'activated'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : log.action === 'deactivated'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : log.action === 'added'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.extensionName}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {log.details}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Operador: <span className="font-semibold text-slate-600 dark:text-slate-300">{log.operatorUsername}</span> ({log.operatorRole})
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAILS & SETTINGS INSPECTOR */}
      {inspectingExtension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(inspectingExtension.category)}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {inspectingExtension.name}
                </h3>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  v{inspectingExtension.version}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingExtension(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Tab switch inside Inspector */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold px-4">
              <button
                type="button"
                onClick={() => setActiveInspectTab('info')}
                className={`py-2.5 px-3 border-b-2 transition ${
                  activeInspectTab === 'info'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Informações & Ganchos
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectTab('settings')}
                className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
                  activeInspectTab === 'settings'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configurações & Parâmetros</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {activeInspectTab === 'info' ? (
                <>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Descrição
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {inspectingExtension.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                        Categoria
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {getCategoryLabel(inspectingExtension.category)}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                        Status
                      </span>
                      <span
                        className={`font-bold ${
                          inspectingExtension.enabled
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {inspectingExtension.enabled ? 'Ativa no Barramento' : 'Desativada'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                        Autor
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {inspectingExtension.author}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                        Tipo de Componente
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {inspectingExtension.isCore ? 'Nativo do Sistema (Core)' : 'Personalizado'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1.5">
                      Ganchos Conectados (Hooks)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectingExtension.hooks.map((h) => (
                        <span
                          key={h}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-purple-700 dark:text-purple-300 font-bold"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {inspectingExtension.website && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                        Documentação Externa
                      </span>
                      <a
                        href={inspectingExtension.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>{inspectingExtension.website}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 text-xs">
                    <p className="text-slate-700 dark:text-slate-300">
                      Configure parâmetros dinâmicos persistidos para <strong>{inspectingExtension.name}</strong>.
                      Alterações feitas por burocratas são salvas em tempo real no armazenamento e notificam os ganchos da extensão.
                    </p>
                  </div>

                  {/* Settings fields */}
                  {inspectingExtension.settingsSchema && inspectingExtension.settingsSchema.length > 0 ? (
                    <div className="space-y-3">
                      {inspectingExtension.settingsSchema.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="block font-bold text-slate-700 dark:text-slate-300">
                            {field.label}
                          </label>
                          {field.description && (
                            <p className="text-[11px] text-slate-500">{field.description}</p>
                          )}
                          {field.type === 'boolean' ? (
                            <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={!!extensionSettingsForm[field.key]}
                                onChange={(e) =>
                                  setExtensionSettingsForm((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.checked,
                                  }))
                                }
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">Ativado</span>
                            </label>
                          ) : field.type === 'select' && field.options ? (
                            <select
                              value={extensionSettingsForm[field.key] ?? field.defaultValue}
                              onChange={(e) =>
                                setExtensionSettingsForm((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            >
                              {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              value={extensionSettingsForm[field.key] ?? field.defaultValue ?? ''}
                              onChange={(e) =>
                                setExtensionSettingsForm((prev) => ({
                                  ...prev,
                                  [field.key]:
                                    field.type === 'number' ? Number(e.target.value) : e.target.value,
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Configurações Personalizadas (Objeto JSON)
                        </label>
                        <p className="text-[11px] text-slate-500 mb-1.5 font-mono">
                          Defina parâmetros de customização consumidos pelo script via <code>api.getSetting()</code>.
                        </p>
                        <textarea
                          value={JSON.stringify(extensionSettingsForm, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setExtensionSettingsForm(parsed);
                            } catch {
                              // aguarda digitação completa
                            }
                          }}
                          rows={6}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700"
                        />
                      </div>
                    </div>
                  )}

                  {userIsBureaucrat && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveSettings(inspectingExtension.name)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar Configurações</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {inspectingExtension.id}
              </span>
              <button
                type="button"
                onClick={() => setInspectingExtension(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXPORT MANIFEST (BACKUP) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Exportar Pacote de Extensões & Manifesto
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Backup completo das extensões personalizadas, estados de ativação e configurações
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Copie ou baixe o manifesto JSON abaixo para replicar o ecossistema de extensões em outro ambiente:
              </p>
              <textarea
                readOnly
                value={extensionManager.exportAllExtensionsManifest()}
                rows={12}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 leading-relaxed select-all"
              />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                {extensions.length} extensões no catálogo
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = extensionManager.exportAllExtensionsManifest();
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(text);
                      setCopiedManifest(true);
                      setTimeout(() => setCopiedManifest(false), 3000);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedManifest ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = extensionManager.exportAllExtensionsManifest();
                    const blob = new Blob([text], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `wiki-extensions-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo .json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT BACKUP (RESTORE) */}
      {showImportBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Importar Pacote de Extensões
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instalação em lote via manifesto JSON de extensões
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportBackupModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Cole abaixo o conteúdo do arquivo de manifesto exportado:
              </p>
              <textarea
                value={backupJsonText}
                onChange={(e) => setBackupJsonText(e.target.value)}
                placeholder={`{\n  "manifestVersion": "2.0.0",\n  "customExtensions": [...]\n}`}
                rows={10}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 text-purple-300 font-mono text-xs border border-slate-700 leading-relaxed"
              />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportBackupModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!backupJsonText.trim() || !userIsBureaucrat}
                onClick={handleImportBackup}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Processar e Instalar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {extensionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800 shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Desinstalar Extensão
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você tem certeza de que deseja remover a extensão{' '}
              <strong className="text-slate-900 dark:text-white">{extensionToDelete.name}</strong>?
              Todos os ganchos e configurações associados serão expurgados da Wiki.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setExtensionToDelete(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
