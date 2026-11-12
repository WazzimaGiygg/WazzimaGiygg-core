import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  Search, 
  Sparkles, 
  BookOpen, 
  Share2, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Monitor, 
  Smartphone, 
  Info, 
  Clock, 
  Check, 
  Layers, 
  Cast, 
  ExternalLink,
  Sliders,
  Type,
  HelpCircle,
  X
} from 'lucide-react';
import { WikiArticle, WikiPage, UserProfile } from '../types';

interface SmartTVViewProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  currentUser: UserProfile | null;
  onExitTVMode: () => void;
  onSelectArticleInDesktop?: (articleId: string) => void;
}

export const SmartTVView: React.FC<SmartTVViewProps> = ({
  articles,
  pages,
  currentUser,
  onExitTVMode,
  onSelectArticleInDesktop,
}) => {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<'home' | 'reader' | 'search' | 'categories' | 'guide'>('home');
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(articles[0] || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // TV Reader State
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [narrationRate, setNarrationRate] = useState<number>(1.0);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<'lento' | 'medio' | 'rapido'>('lento');
  const [tvTheme, setTvTheme] = useState<'cinema' | 'midnight' | 'oled'>('cinema');
  const [tvFontSize, setTvFontSize] = useState<'normal' | 'grande' | 'extra'>('grande');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  
  // Real-time TV Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Spatial Grid Navigation State for Remote Control
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const readerScrollRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio feedback blip for remote control movements
  const playAudioCue = (type: 'move' | 'select' | 'back' = 'move') => {
    if (!audioFeedback || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'select') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'back') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // AudioContext unavailable or blocked by browser gesture policies
    }
  };

  // Text-To-Speech (Narração por Voz na TV)
  const stopNarration = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsNarrating(false);
  };

  const toggleNarration = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !selectedArticle) return;

    if (isNarrating) {
      stopNarration();
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare clean reading text from article wikitext
    const cleanText = selectedArticle.descricao
      .replace(/={1,6}[^=]+={1,6}/g, '')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\{\{[^}]+\}\}/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[*#_`>~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const fullNarration = `${selectedArticle.titulo}. ${selectedArticle.resumo || ''}. ${cleanText}`.slice(0, 4000);

    const utterance = new SpeechSynthesisUtterance(fullNarration);
    utterance.lang = 'pt-BR';
    utterance.rate = narrationRate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsNarrating(false);
    };
    utterance.onerror = () => {
      setIsNarrating(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsNarrating(true);
    playAudioCue('select');
  };

  // Auto-scroll loop for TV Teleprompter
  useEffect(() => {
    if (!isAutoScroll || currentSection !== 'reader' || !readerScrollRef.current) return;
    
    const intervalMs = autoScrollSpeed === 'lento' ? 60 : autoScrollSpeed === 'medio' ? 40 : 20;
    const scrollStep = 1;

    const interval = setInterval(() => {
      if (readerScrollRef.current) {
        readerScrollRef.current.scrollTop += scrollStep;
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isAutoScroll, currentSection, autoScrollSpeed]);

  // Clean up speech on unmount or article change
  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, [selectedArticle]);

  // Filtered articles list
  const filteredArticles = useMemo(() => {
    const safeArticles = Array.isArray(articles) ? articles : [];
    return safeArticles.filter((a) => {
      if (!a) return false;
      const matchCat = selectedCategory === 'Todas' || a.categoria === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        (a.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.descricao || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    const safeArticles = Array.isArray(articles) ? articles : [];
    safeArticles.forEach((a) => {
      if (a?.categoria) set.add(a.categoria);
    });
    return ['Todas', ...Array.from(set)];
  }, [articles]);

  // Remote Control Keyboard Event Handler (D-Pad, Arrows, Enter, Back, Media keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in the search box
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          playAudioCue('move');
          setFocusedIndex((prev) => prev + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playAudioCue('move');
          setFocusedIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          playAudioCue('move');
          if (currentSection === 'reader' && readerScrollRef.current) {
            readerScrollRef.current.scrollBy({ top: 180, behavior: 'smooth' });
          } else {
            setFocusedIndex((prev) => prev + 4);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          playAudioCue('move');
          if (currentSection === 'reader' && readerScrollRef.current) {
            readerScrollRef.current.scrollBy({ top: -180, behavior: 'smooth' });
          } else {
            setFocusedIndex((prev) => Math.max(0, prev - 4));
          }
          break;
        case 'Enter':
          e.preventDefault();
          playAudioCue('select');
          if (currentSection === 'home' && filteredArticles.length > 0) {
            const art = filteredArticles[focusedIndex % filteredArticles.length];
            if (art) {
              setSelectedArticle(art);
              setCurrentSection('reader');
            }
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          playAudioCue('back');
          if (currentSection !== 'home') {
            stopNarration();
            setCurrentSection('home');
          } else {
            onExitTVMode();
          }
          break;
        case ' ':
        case 'MediaPlayPause':
          e.preventDefault();
          if (currentSection === 'reader') {
            toggleNarration();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, focusedIndex, filteredArticles, isNarrating, selectedArticle, audioFeedback]);

  // Clean article preview text
  const cleanSummary = (text: string, maxChars = 220) => {
    const clean = text
      .replace(/={1,6}[^=]+={1,6}/g, '')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\{\{[^}]+\}\}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.length > maxChars ? clean.slice(0, maxChars) + '...' : clean;
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://wikizero.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    selectedArticle ? `${currentUrl}#article-${selectedArticle.id}` : currentUrl
  )}`;

  // Theme styles
  const themeClasses = {
    cinema: 'bg-slate-950 text-slate-100',
    midnight: 'bg-[#0b1329] text-blue-50',
    oled: 'bg-black text-white',
  }[tvTheme];

  return (
    <div 
      id="smart-tv-app-root" 
      className={`fixed inset-0 z-[999] overflow-hidden select-none flex flex-col font-sans ${themeClasses} transition-colors duration-300`}
    >
      {/* 1. TV 10-Foot Top Navigation & Ambient Bar */}
      <header className="shrink-0 px-8 lg:px-14 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Brand & Mode Badges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">WikiWorldWeb TV</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  10-Foot UI
                </span>
              </div>
              <p className="text-xs text-slate-400">Enciclopédia Otimizada para Smart TV & Controle Remoto</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 ml-6 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                playAudioCue('select');
                setCurrentSection('home');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentSection === 'home'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Início / Vitrine
            </button>
            <button
              onClick={() => {
                playAudioCue('select');
                setCurrentSection('categories');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentSection === 'categories'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Categorias
            </button>
            <button
              onClick={() => {
                playAudioCue('select');
                setCurrentSection('search');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentSection === 'search'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Pesquisar
            </button>
            <button
              onClick={() => {
                playAudioCue('select');
                setCurrentSection('guide');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentSection === 'guide'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Guia Smart TV
            </button>
          </nav>
        </div>

        {/* Right Info: Clock, Audio, Remote Tips & Exit Button */}
        <div className="flex items-center gap-4">
          {/* Digital Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold font-mono">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{currentTime}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            title={audioFeedback ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
          >
            {audioFeedback ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Exit TV Mode */}
          <button
            onClick={() => {
              playAudioCue('back');
              stopNarration();
              onExitTVMode();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition text-xs font-semibold cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Sair do Modo TV</span>
          </button>
        </div>
      </header>

      {/* 2. Main TV Body Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 lg:px-14 py-6 scroll-smooth">
        {/* ===================================================================== */}
        {/* SECTION: HOME / VITRINE                                               */}
        {/* ===================================================================== */}
        {currentSection === 'home' && (
          <div className="space-y-10 pb-16">
            {/* TV Hero Banner - Featured Article */}
            {selectedArticle && (
              <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-r from-blue-900/60 via-slate-900/90 to-indigo-950/70 p-8 lg:p-12 shadow-2xl">
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500 text-white shadow-sm">
                      ★ Artigo em Destaque na TV
                    </span>
                    <span className="text-xs text-blue-200 font-medium">
                      Categoria: {selectedArticle.categoria || 'Geral'}
                    </span>
                  </div>

                  <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    {selectedArticle.titulo}
                  </h1>

                  <p className="text-base lg:text-lg text-slate-300 leading-relaxed line-clamp-3">
                    {cleanSummary(selectedArticle.descricao, 280)}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        playAudioCue('select');
                        setCurrentSection('reader');
                      }}
                      className="px-6 py-3.5 rounded-2xl bg-white text-slate-950 font-bold text-base hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 cursor-pointer"
                    >
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Ler na TV (Tela Cheia)</span>
                    </button>

                    <button
                      onClick={toggleNarration}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600/30 hover:bg-blue-600 text-white border border-blue-400/40 font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 cursor-pointer"
                    >
                      {isNarrating ? (
                        <>
                          <Pause className="w-5 h-5 text-amber-300" />
                          <span>Pausar Narração</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-5 h-5 text-blue-300" />
                          <span>Ouvir Narração por Voz</span>
                        </>
                      )}
                    </button>

                    {onSelectArticleInDesktop && (
                      <button
                        onClick={() => onSelectArticleInDesktop(selectedArticle.id)}
                        className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-sm font-semibold transition cursor-pointer flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir Modo Web Tradicional</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content Row 1: Principais Artigos da Enciclopédia */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                    Catálogo de Conhecimento WikiWorldWeb
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  {filteredArticles.length} artigos disponíveis para navegação
                </span>
              </div>

              {/* Grid of Articles Optimized for 10-Foot Remote Navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredArticles.map((art, idx) => {
                  const isSelected = selectedArticle?.id === art.id;
                  const isFocused = focusedIndex % filteredArticles.length === idx;

                  return (
                    <div
                      key={art.id}
                      onClick={() => {
                        playAudioCue('select');
                        setSelectedArticle(art);
                        setCurrentSection('reader');
                      }}
                      onMouseEnter={() => {
                        setSelectedArticle(art);
                        setFocusedIndex(idx);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group ${
                        isSelected || isFocused
                          ? 'bg-blue-900/40 border-blue-400 scale-[1.03] shadow-2xl shadow-blue-500/20 ring-2 ring-blue-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-blue-300">
                            {art.categoria || 'Artigo'}
                          </span>
                          {art.visualizacoes !== undefined && (
                            <span className="text-[10px] text-slate-400">
                              {art.visualizacoes} views
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-200 line-clamp-2 leading-snug">
                          {art.titulo}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                          {cleanSummary(art.descricao, 120)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
                        <span>Pressione OK para ler</span>
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick TV Features Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Narração por Voz na TV</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Ouça qualquer artigo lido em voz alta pelo sintetizador da sua Smart TV enquanto relaxa no sofá.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Navegação Espacial D-Pad</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Use as setas do controle remoto físico da Smart TV para navegar fluidamente entre artigos e seções.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Controle pelo Celular</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Aponte a câmera do celular para o QR Code para transferir a leitura da TV direto para o smartphone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: READER (LEITOR DE ARTIGO PARA TV)                            */}
        {/* ===================================================================== */}
        {currentSection === 'reader' && selectedArticle && (
          <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
            {/* Top Reader Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md sticky top-0 z-20">
              <button
                onClick={() => {
                  playAudioCue('back');
                  stopNarration();
                  setCurrentSection('home');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Vitrine (Esc)</span>
              </button>

              {/* Speech Narration Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleNarration}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition cursor-pointer ${
                    isNarrating
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isNarrating ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isNarrating ? 'Pausar Voz' : 'Ouvir Artigo na TV'}</span>
                </button>

                {/* Auto Scroll Toggle */}
                <button
                  onClick={() => setIsAutoScroll(!isAutoScroll)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isAutoScroll
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <span>Auto-Rolagem: {isAutoScroll ? 'Ativa' : 'Desligada'}</span>
                </button>

                {/* Font Size Selector */}
                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 text-xs">
                  <button
                    onClick={() => setTvFontSize('normal')}
                    className={`px-2.5 py-1 rounded-lg transition ${tvFontSize === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setTvFontSize('grande')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${tvFontSize === 'grande' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setTvFontSize('extra')}
                    className={`px-2.5 py-1 rounded-lg font-black transition ${tvFontSize === 'extra' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    A++
                  </button>
                </div>
              </div>
            </div>

            {/* Article Content Container */}
            <div 
              ref={readerScrollRef} 
              className="p-8 lg:p-12 rounded-3xl bg-white/5 border border-white/10 shadow-2xl max-h-[72vh] overflow-y-auto space-y-6"
            >
              {/* Header Title */}
              <div className="border-b border-white/10 pb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {selectedArticle.categoria || 'Geral'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Última edição: {new Date(selectedArticle.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                  {selectedArticle.titulo}
                </h1>
              </div>

              {/* Text Body with Configurable 10-Foot Typography */}
              <div 
                className={`leading-relaxed space-y-6 text-slate-200 ${
                  tvFontSize === 'normal'
                    ? 'text-lg lg:text-xl'
                    : tvFontSize === 'grande'
                    ? 'text-xl lg:text-2xl'
                    : 'text-2xl lg:text-3xl font-medium'
                }`}
              >
                {selectedArticle.descricao.split('\n\n').map((paragraph, pIdx) => {
                  const cleanPara = paragraph
                    .replace(/={1,6}[^=]+={1,6}/g, '')
                    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
                    .replace(/\{\{[^}]+\}\}/g, '')
                    .trim();

                  if (!cleanPara) return null;

                  return (
                    <p key={pIdx} className="leading-relaxed">
                      {cleanPara}
                    </p>
                  );
                })}
              </div>

              {/* Mobile QR Transfer Card at end of article */}
              <div className="mt-12 p-6 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-400 font-bold text-sm">
                    <Smartphone className="w-5 h-5" />
                    <span>Continuar Lendo no Celular</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-md">
                    Aponte a câmera do seu smartphone para o QR Code para abrir este mesmo artigo e editar referências.
                  </p>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                  <img src={qrCodeUrl} alt="QR Code Artigo" className="w-28 h-28" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: CATEGORIES                                                  */}
        {/* ===================================================================== */}
        {currentSection === 'categories' && (
          <div className="space-y-6 pb-20">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white">Explorar por Categorias</h2>
              <p className="text-sm text-slate-400 mt-1">Selecione uma categoria para filtrar o acervo na Smart TV.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    playAudioCue('select');
                    setSelectedCategory(cat);
                  }}
                  className={`px-5 py-3 rounded-2xl text-base font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => {
                    playAudioCue('select');
                    setSelectedArticle(art);
                    setCurrentSection('reader');
                  }}
                  className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400 cursor-pointer transition-all space-y-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {art.categoria || 'Geral'}
                  </span>
                  <h4 className="text-base font-bold text-white">{art.titulo}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{cleanSummary(art.descricao, 90)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: SEARCH                                                       */}
        {/* ===================================================================== */}
        {currentSection === 'search' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white">Pesquisa na Smart TV</h2>
              <p className="text-sm text-slate-400 mt-1">Digite ou use a busca por voz do controle remoto.</p>
            </div>

            {/* TV Search Input */}
            <div className="relative">
              <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar artigos da enciclopédia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => {
                    playAudioCue('select');
                    setSelectedArticle(art);
                    setCurrentSection('reader');
                  }}
                  className="p-5 rounded-2xl bg-white/5 hover:bg-blue-900/30 border border-white/10 hover:border-blue-400 cursor-pointer transition space-y-2"
                >
                  <h4 className="text-base font-bold text-white">{art.titulo}</h4>
                  <p className="text-xs text-slate-300 line-clamp-3">{cleanSummary(art.descricao, 110)}</p>
                </div>
              ))}
              {filteredArticles.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  Nenhum artigo encontrado para a busca "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION: SMART TV INSTALLATION & COMPATIBILITY GUIDE                  */}
        {/* ===================================================================== */}
        {currentSection === 'guide' && (
          <div className="max-w-4xl mx-auto space-y-8 pb-24">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Tv className="w-8 h-8 text-blue-400" />
                <span>Como Usar e Instalar na sua Smart TV</span>
              </h2>
              <p className="text-base text-slate-300 mt-2">
                O WikiWorldWeb suporta os principais sistemas operacionais de televisores inteligentes do mercado.
              </p>
            </div>

            {/* Smart TV Platforms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Samsung Tizen */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs">
                    Samsung Tizen
                  </div>
                  <span className="text-xs text-slate-400">Smart TVs Samsung 2017+</span>
                </div>
                <h4 className="text-lg font-bold text-white">Navegador Samsung Internet TV</h4>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Abra o aplicativo <strong>Internet</strong> na sua TV Samsung.</li>
                  <li>Acesse o endereço da WikiWorldWeb e clique no botão <strong>"Modo Smart TV"</strong>.</li>
                  <li>Toque no ícone de <strong>Estrela (Favoritos)</strong> e escolha <strong>"Fixar na Barra de Início"</strong>.</li>
                </ol>
              </div>

              {/* LG webOS */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs">
                    LG webOS
                  </div>
                  <span className="text-xs text-slate-400">Smart TVs LG com Magic Remote</span>
                </div>
                <h4 className="text-lg font-bold text-white">Navegador Web LG webOS</h4>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>No menu da TV LG, abra o aplicativo <strong>Navegador da Web</strong>.</li>
                  <li>Digite o endereço da enciclopédia e ative a visualização TV em tela cheia.</li>
                  <li>Adicione aos <strong>Marcadores Rápidos</strong> para abrir com 1 clique usando o Magic Remote.</li>
                </ol>
              </div>

              {/* Android TV & Google TV */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    Android TV / Google TV
                  </div>
                  <span className="text-xs text-slate-400">Sony, TCL, Philips, Chromecast</span>
                </div>
                <h4 className="text-lg font-bold text-white">Instalação PWA Direta</h4>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Abra o navegador (ex: JioPages, Chrome ou TV Bro) na sua Android TV.</li>
                  <li>Acesse a WikiWorldWeb e clique em <strong>"Instalar Aplicativo PWA"</strong>.</li>
                  <li>O app aparecerá como um ícone nativo na linha de aplicativos da sua TV.</li>
                </ol>
              </div>

              {/* Fire TV Stick */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs">
                    Amazon Fire TV
                  </div>
                  <span className="text-xs text-slate-400">Fire TV Stick & Edições 4K</span>
                </div>
                <h4 className="text-lg font-bold text-white">Amazon Silk Browser</h4>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Inicie o navegador <strong>Silk</strong> no Fire TV Stick.</li>
                  <li>Abra o site e pressione o botão <strong>Menu (três linhas)</strong> do controle remoto.</li>
                  <li>Escolha <strong>"Fixar na Página Inicial"</strong> para acesso instantâneo pelo controle.</li>
                </ol>
              </div>
            </div>

            {/* Direct QR Link */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="text-lg font-bold text-white">Abrir o Link na TV via Celular</h4>
                <p className="text-xs text-slate-300 max-w-lg">
                  Use o recurso de "Transmitir" ou "Enviar para Dispositivo" do seu smartphone ou digite a URL exibida no navegador da sua TV.
                </p>
                <div className="font-mono text-xs text-blue-300 bg-black/40 px-3 py-2 rounded-lg inline-block">
                  {currentUrl}
                </div>
              </div>
              <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                <img src={qrCodeUrl} alt="QR Code TV" className="w-32 h-32" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. TV Bottom Remote Control Helper Bar (Fixed on Screen) */}
      <footer className="shrink-0 px-8 lg:px-14 py-3 bg-black/70 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-5 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-300">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-white/10 text-white font-mono text-[10px] border border-white/20">▲ ▼ ◄ ►</kbd>
            <span>Navegar</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <kbd className="px-2 py-0.5 rounded-sm bg-blue-600 text-white font-mono text-[10px] font-bold">OK / Enter</kbd>
            <span>Selecionar / Abrir</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-white/10 text-white font-mono text-[10px] border border-white/20">Voltar / Esc</kbd>
            <span>Retornar</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <kbd className="px-2 py-0.5 rounded-sm bg-white/10 text-white font-mono text-[10px] border border-white/20">Espaço</kbd>
            <span>Narrar por Voz</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-blue-400 font-medium">
            WikiWorldWeb Smart TV Edition v3.3
          </span>
        </div>
      </footer>
    </div>
  );
};
