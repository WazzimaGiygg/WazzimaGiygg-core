import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Settings,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  FileText,
  Sliders,
  ExternalLink,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  HelpCircle,
  Code,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Edit3,
  Search,
} from 'lucide-react';
import {
  AppTheme,
  GeminiChatMessage,
  GeminiChatbotConfig,
  UserProfile,
} from '../types';
import {
  GeminiChatbotService,
  DEFAULT_GEMINI_CHATBOT_CONFIG,
} from '../services/geminiChatbotService';
import { StorageService } from '../services/storageService';

export interface GeminiStudioToolProps {
  theme?: AppTheme;
  onOpenEditor?: (title?: string) => void;
  onNavigateToExtensions?: () => void;
  currentUser?: UserProfile | null;
}

const PROMPT_SUGGESTIONS = [
  {
    label: 'Criar Verbete Completo',
    prompt: 'Escreva um artigo enciclopédico neutro, completo e formatado em Wikitext sobre: ',
    mode: 'article' as const,
  },
  {
    label: 'Explicar Conceito Científico',
    prompt: 'Explique de forma clara, didática e rigorosa os fundamentos de: ',
    mode: 'general' as const,
  },
  {
    label: 'Gerar Tabela Wikitext',
    prompt: 'Crie uma tabela comparativa no padrão MediaWiki ({| class="wikitable") sobre: ',
    mode: 'article' as const,
  },
  {
    label: 'Sintetizar Linha do Tempo',
    prompt: 'Estruture uma cronologia histórica detalhada em tópicos sobre os principais marcos de: ',
    mode: 'general' as const,
  },
  {
    label: 'Revisar Neutralidade (NPOV)',
    prompt: 'Analise o seguinte texto sob a ótica de neutralidade enciclopédica, verificabilidade e ausência de vieses: ',
    mode: 'general' as const,
  },
];

export const GeminiStudioTool: React.FC<GeminiStudioToolProps> = ({
  theme,
  onOpenEditor,
  onNavigateToExtensions,
  currentUser: propUser,
}) => {
  const currentUser = propUser || StorageService.getCurrentUser();
  const [config, setConfig] = useState<GeminiChatbotConfig>(DEFAULT_GEMINI_CHATBOT_CONFIG);
  const [messages, setMessages] = useState<GeminiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_gemini_tool_messages');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: 'Olá! Sou o **Assistente IA Gemini Studio**, operando como extensão oficial de ferramentas do WikiWorldWeb.\n\nPosso auxiliá-lo na pesquisa, redação de verbetes com formatação Wikitext, elaboração de tabelas e infoboxes, revisão de neutralidade e síntese de fontes acadêmicas.\n\nSelecione uma sugestão abaixo ou faça sua consulta diretamente:',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'general' | 'article' | 'collection'>('article');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Configurações personalizadas da sessão
  const [customModel, setCustomModel] = useState<string>('gemini-2.5-flash');
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(
    DEFAULT_GEMINI_CHATBOT_CONFIG.systemInstruction || ''
  );
  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega configuração salva
  useEffect(() => {
    GeminiChatbotService.getConfig().then((cfg) => {
      setConfig(cfg);
      if (cfg.model) setCustomModel(cfg.model);
      if (cfg.systemInstruction) setCustomSystemInstruction(cfg.systemInstruction);
    });
  }, []);

  // Persiste mensagens localmente
  useEffect(() => {
    try {
      localStorage.setItem('wikizero_gemini_tool_messages', JSON.stringify(messages.slice(-30)));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopyText = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleCopyAllChat = () => {
    const fullTranscript = messages
      .map((m) => `[${m.sender === 'user' ? 'USUÁRIO' : 'GEMINI STUDIO'} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.text}\n`)
      .join('\n---\n\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullTranscript);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Tem certeza de que deseja limpar todo o histórico de conversas do assistente?')) {
      const initial: GeminiChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          content: 'Histórico limpo. Como posso ajudar com sua pesquisa ou artigo agora?',
          sender: 'bot',
          text: 'Histórico limpo. Como posso ajudar com sua pesquisa ou artigo agora?',
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(initial);
      localStorage.removeItem('wikizero_gemini_tool_messages');
    }
  };

  const handleExportMarkdown = () => {
    const mdContent = `# Registro de Conversa - Assistente IA Gemini Studio (WikiWorldWeb)\nData: ${new Date().toLocaleString('pt-BR')}\nModelo: ${customModel}\n\n---\n\n` +
      messages.map((m) => `### ${m.sender === 'user' ? '👤 Usuário' : '✨ Gemini Studio'} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.text}\n`).join('\n---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-studio-chat-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSpeakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta a Web Speech API para reprodução de áudio.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~]/g, '').replace(/<[^>]+>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if (!messageText || isLoading) return;

    const userMsg: GeminiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      sender: 'user',
      content: messageText,
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await GeminiChatbotService.sendMessage({
        message: messageText,
        history: messages.slice(-10),
        context: { mode: currentMode },
        user: currentUser,
        configOverride: {
          model: customModel,
          systemInstruction: customSystemInstruction,
        },
      });

      const botMsg: GeminiChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        sender: 'bot',
        content: response.reply,
        text: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorText = `⚠️ **Erro na comunicação com o Google AI Studio:**\n\n${err?.message || 'Falha ao processar requisição com a API do Gemini. Verifique a conexão ou tente novamente.'}`;
      const errorMsg: GeminiChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        sender: 'bot',
        content: errorText,
        text: errorText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Extrai possível título enciclopédico de uma mensagem gerada
  const extractArticleTitle = (text: string): string => {
    const titleMatch = text.match(/==+\s*([^=]+?)\s*==+/) || text.match(/#+\s*(.+)/);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    return 'Novo Verbete Gemini';
  };

  const handleSaveConfig = async () => {
    try {
      const updated = await GeminiChatbotService.saveConfig({
        model: customModel,
        systemInstruction: customSystemInstruction,
      }, currentUser?.email || 'Burocrata');
      setConfig(updated);
      setSavedSettingsNotice('Parâmetros salvos com sucesso!');
      setTimeout(() => setSavedSettingsNotice(null), 3000);
    } catch (e: any) {
      setSavedSettingsNotice(`Erro ao salvar: ${e?.message || 'Falha'}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in select-text">
      {/* Extension Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Assistente IA Gemini Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Extensão: WikiGeminiStudioTool (v1.0.0)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {customModel}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Módulo de inteligência artificial soberano integrado ao barramento de ferramentas da WikiWorldWeb.
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showSettings
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Ajustar parâmetros de modelo, instrução de sistema e temperatura"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Parâmetros</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllChat}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Copiar histórico integral da conversa"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedAll ? 'Copiado' : 'Copiar Chat'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Exportar conversa em formato Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar MD</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 transition"
            title="Limpar histórico da sessão"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onNavigateToExtensions && (
            <button
              type="button"
              onClick={onNavigateToExtensions}
              className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition flex items-center gap-1"
              title="Gerenciar no painel de extensões"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Especial:Extensões</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Drawer Panel */}
      {showSettings && (
        <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-slate-900/80 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-purple-800/40">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Parâmetros do Modelo & Configurações de IA
              </h3>
            </div>
            {savedSettingsNotice && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {savedSettingsNotice}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Modelo Oficial do Google AI Studio
              </label>
              <select
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Padrão Recomendado - Rápido e Preciso)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Modo Padrão de Contexto
              </label>
              <select
                value={currentMode}
                onChange={(e) => setCurrentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="article">Redação e Formatação de Artigos (Wikitext)</option>
                <option value="general">Assistência Geral e Consultoria de Conteúdo</option>
                <option value="collection">Criação e Estruturação de Coleções Temáticas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instrução de Sistema Customizada (System Instruction)
            </label>
            <textarea
              value={customSystemInstruction}
              onChange={(e) => setCustomSystemInstruction(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 font-mono">
              Applet AI Studio ID: {config.chatbotId}
            </span>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              Salvar Parâmetros
            </button>
          </div>
        </div>
      )}

      {/* Mode Selector Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
          Foco da Consulta:
        </span>
        <button
          type="button"
          onClick={() => setCurrentMode('article')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            currentMode === 'article'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Redação de Artigos (Wikitext)</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentMode('general')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            currentMode === 'general'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Consultoria & Fatos</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentMode('collection')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            currentMode === 'collection'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Coleções & Metadados</span>
        </button>
      </div>

      {/* Preset Suggestions Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {PROMPT_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputPrompt(sug.prompt);
                setCurrentMode(sug.mode);
                textareaRef.current?.focus();
              }}
              className="px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800/80 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-800 dark:text-purple-300 text-xs font-semibold whitespace-nowrap transition shadow-2xs flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>{sug.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col h-[560px] overflow-hidden">
        {/* Messages List Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-purple-600 text-white'
                      : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble & Content */}
                <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                    <span className="font-bold">
                      {isUser ? currentUser?.displayName || currentUser?.username || 'Você' : 'Gemini Studio IA'}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap select-text break-words font-sans space-y-2">
                      {msg.text}
                    </div>

                    {/* Actions on Assistant Messages */}
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text || msg.content || '')}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 transition flex items-center gap-1"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copiado!' : 'Copiar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSpeakText(msg.id, msg.text || msg.content || '')}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition flex items-center gap-1 ${
                            isSpeaking
                              ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-800 dark:text-amber-200'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100'
                          }`}
                          title={isSpeaking ? 'Parar leitura por voz' : 'Ouvir resposta sintetizada'}
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeaking ? 'Parar Voz' : 'Ouvir'}</span>
                        </button>

                        {onOpenEditor && (
                          <button
                            type="button"
                            onClick={() => {
                              const suggestedTitle = extractArticleTitle(msg.text || msg.content || '');
                              onOpenEditor(suggestedTitle);
                            }}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition flex items-center gap-1"
                            title="Abrir conteúdo diretamente no editor de wikitexto"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Abrir no Editor</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-xs animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                </div>
                <span className="font-semibold text-purple-700 dark:text-purple-400">
                  Gemini Studio processando conhecimento enciclopédico...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte ao Gemini Studio ou solicite a redação de um verbete (Pressione Enter para enviar, Shift+Enter para quebra)..."
                rows={2}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
              title="Enviar consulta ao Gemini Studio"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
            <span>
              Google AI Studio • Modelo <strong>{customModel}</strong> • Licença CC BY-SA 4.0
            </span>
            <span className="font-mono">
              {inputPrompt.length} caracteres
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
