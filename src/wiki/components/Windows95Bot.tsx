import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minus,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  HelpCircle,
  BookOpen,
  Shuffle,
  FileCode,
  Music,
  RotateCcw,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { GeminiChatbotService } from '../services/geminiChatbotService';
import { GeminiChatMessage } from '../types';
import { playClippyPop, playWin95Ding, playWin95Tada } from '../utils/win95Audio';

interface Windows95BotProps {
  onRandomArticle?: () => void;
  onOpenSearch?: () => void;
  onOpenGeminiFull?: () => void;
  currentArticleTitle?: string;
}

const NOSTALGIC_TIPS = [
  'Parece que você está navegando na WikiZero no Windows 95! Sabia que este sistema operacional foi lançado em 24 de agosto de 1995?',
  'Dica do Clippy: Você pode salvar qualquer artigo para leitura offline usando o botão de cache da enciclopédia!',
  'Sabia que em 1995 um computador comum tinha apenas 8MB de memória RAM e rodava direto de um disco rígido de 540MB?',
  'Curiosidade: O famoso som de abertura do Windows 95 foi composto pelo músico britânico Brian Eno em um sintetizador!',
  'Dica de Wikitext: Para criar títulos de seções, use == Título ==. Para negrito, use \'\'\'texto\'\'\'!',
  'Em 1995, conectar-se à internet exigia um modem discado de 14.4kbps ou 28.8kbps. Hoje você acessa toda a enciclopédia instantaneamente!',
  'Dica de Navegação: Clique no botão Iniciar no canto inferior esquerdo para acessar todos os recursos da WikiZero Retrô.',
  'Dica do Clippy: Use o botão "Artigo Aleatório" para descobrir novos verbetes que você talvez nunca encontrasse!',
];

export const Windows95Bot: React.FC<Windows95BotProps> = ({
  onRandomArticle,
  onOpenSearch,
  onOpenGeminiFull,
  currentArticleTitle,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem('wikizero_win95_clippy_minimized') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('wikizero_win95_clippy_sound') !== 'false';
  });

  const [isEntering, setIsEntering] = useState(true);
  const [activeTab, setActiveTab] = useState<'tips' | 'chat' | 'wikitext'>('tips');
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);
  const [clippyMood, setClippyMood] = useState<'idle' | 'talking' | 'thinking' | 'happy'>('happy');

  // Entrance animation whenever component mounts / page is updated
  useEffect(() => {
    setIsEntering(true);
    setClippyMood('happy');
    if (soundEnabled) {
      const popTimer = setTimeout(() => {
        playClippyPop(0.3);
      }, 350);
      return () => clearTimeout(popTimer);
    }
    const moodTimer = setTimeout(() => {
      setClippyMood('talking');
    }, 900);
    const endTimer = setTimeout(() => {
      setIsEntering(false);
      setClippyMood('idle');
    }, 2500);
    return () => {
      clearTimeout(moodTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const replayEntrance = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsEntering(true);
    setClippyMood('happy');
    if (soundEnabled) playClippyPop(0.32);
    setTimeout(() => setClippyMood('talking'), 800);
    setTimeout(() => {
      setIsEntering(false);
      setClippyMood('idle');
    }, 2400);
  };

  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'clippy'; text: string; time: string }>>([
    {
      sender: 'clippy',
      text: 'Olá! Eu sou o Clippy, seu assistente do Windows 95 na WikiZero. Em que posso te ajudar hoje?',
      time: '12:00',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Periodic subtle eye animation / blinking
  useEffect(() => {
    const interval = setInterval(() => {
      if (clippyMood === 'idle') {
        setClippyMood('happy');
        setTimeout(() => setClippyMood('idle'), 600);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [clippyMood]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('wikizero_win95_clippy_sound', String(next));
    if (next) playWin95Ding();
  };

  const toggleMinimize = (min: boolean) => {
    setIsMinimized(min);
    localStorage.setItem('wikizero_win95_clippy_minimized', String(min));
    if (soundEnabled) {
      if (min) playClippyPop(0.2);
      else playWin95Ding(0.25);
    }
    if (!min) {
      setClippyMood('happy');
      setTimeout(() => setClippyMood('idle'), 800);
    }
  };

  const handleNextTip = () => {
    if (soundEnabled) playClippyPop(0.2);
    setClippyMood('talking');
    setCurrentTipIndex((prev) => (prev + 1) % NOSTALGIC_TIPS.length);
    setTimeout(() => setClippyMood('idle'), 1000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || isThinking) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: prompt, time: userTime }]);
    setChatInput('');
    setIsThinking(true);
    setClippyMood('thinking');
    if (soundEnabled) playClippyPop(0.25);

    try {
      const systemInstruction = `Você é o Clippy (Clippit), o simpático e clássico assistente do Windows 95 e Office 97, agora prestando suporte na enciclopédia digital WikiZero.
Seja carismático, prestativo e com um toque nostálgico bem-humorado dos anos 90 (mencione termos como disquetes, janelas cinzas, atalhos do Windows 95 se couber naturalmente).
Responda sempre em Português com precisão factual enciclopédica! Mantenha a resposta concisa (2 a 4 parágrafos curtos) para caber bem no balão de diálogo.
${currentArticleTitle ? `O usuário está atualmente lendo o artigo: "${currentArticleTitle}".` : ''}`;

      const history: GeminiChatMessage[] = chatMessages.slice(-6).map((m, idx) => ({
        id: `clippy-msg-${idx}-${Date.now()}`,
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
        timestamp: new Date().toISOString(),
      }));

      const res = await GeminiChatbotService.sendMessage({
        message: prompt,
        configOverride: {
          systemInstruction,
        },
        context: {
          mode: 'general',
          currentArticle: currentArticleTitle ? { titulo: currentArticleTitle } : undefined,
        },
        history,
      });

      const clippyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'clippy',
          text: res.reply || 'Parece que encontrei um erro de rede no modem dial-up! Tente novamente.',
          time: clippyTime,
        },
      ]);
      setClippyMood('happy');
      if (soundEnabled) playWin95Ding(0.25);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'clippy',
          text: 'Oops! Meu modem discado de 28.8kbps perdeu a conexão temporariamente. Mas posso ajudar você a navegar pelos artigos ou consultar a sintaxe do Wikitext!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setClippyMood('idle');
    } finally {
      setIsThinking(false);
      setTimeout(() => setClippyMood('idle'), 1500);
    }
  };

  const handleCopyText = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    if (soundEnabled) playClippyPop(0.18);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <aside
      aria-label="Assistente do Windows 95 Clippy"
      className="fixed bottom-12 sm:bottom-14 right-3 sm:right-6 z-40 select-none pointer-events-auto flex flex-col items-end"
    >
      {/* Minimized Desktop Widget */}
      {isMinimized ? (
        <button
          type="button"
          onClick={() => toggleMinimize(false)}
          className="win95-button flex items-center gap-2 px-3 py-1.5 shadow-md hover:bg-slate-200 transition-all font-mono text-xs cursor-pointer group"
          title="Abrir o Clippy (Assistente do Windows 95)"
        >
          {/* Mini Clippy SVG */}
          <div className="w-5 h-6 relative shrink-0">
            <svg viewBox="0 0 40 60" className="w-full h-full drop-shadow-xs" fill="none">
              {/* Outer Loop */}
              <path
                d="M 16 12 C 16 5, 30 5, 30 15 L 30 45 C 30 53, 10 53, 10 43 L 10 20 C 10 13, 23 13, 23 20 L 23 42"
                stroke="#4a4a4a"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 16 12 C 16 5, 30 5, 30 15 L 30 45 C 30 53, 10 53, 10 43 L 10 20 C 10 13, 23 13, 23 20 L 23 42"
                stroke="#c0c0c0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Eyes */}
              <circle cx="16" cy="18" r="4" fill="white" stroke="#222" strokeWidth="1.2" />
              <circle cx="24" cy="18" r="4" fill="white" stroke="#222" strokeWidth="1.2" />
              <circle cx="16.5" cy="18" r="1.8" fill="#111" />
              <circle cx="24.5" cy="18" r="1.8" fill="#111" />
            </svg>
          </div>
          <span className="font-bold text-[#000080]">Clippy (Win95 Bot)</span>
          <span className="text-[10px] text-slate-600 bg-white/70 px-1 border border-slate-400">
            Abrir
          </span>
        </button>
      ) : (
        /* Full Expanded Windows 95 Bot with Character & Yellow Dialog Baloon */
        <div className={`flex flex-col items-end gap-2 ${isEntering ? 'clippy-entrance-anim' : 'animate-in fade-in slide-in-from-bottom-3 duration-200'}`}>
          {/* Authentic Yellow Post-it Speech Bubble Dialog */}
          <div
            className="w-[320px] sm:w-[360px] bg-[#ffffcc] text-black border border-black shadow-[4px_4px_0px_#000000] rounded-sm font-sans flex flex-col overflow-hidden text-xs"
            style={{ fontFamily: "'Tahoma', 'MS Sans Serif', Geneva, sans-serif" }}
          >
            {/* Title Bar in classic pale yellow with controls */}
            <div className="bg-[#ffeb9c] border-b border-black/40 px-2.5 py-1.5 flex items-center justify-between font-bold text-[11px] text-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📎</span>
                <span>Assistente do Windows 95</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={replayEntrance}
                  className="w-4 h-4 flex items-center justify-center hover:bg-[#ebd578] rounded text-slate-700"
                  title="Repetir animação do Clippy"
                >
                  <RotateCcw size={10} className={isEntering ? 'animate-spin text-amber-700' : ''} />
                </button>
                <button
                  type="button"
                  onClick={toggleSound}
                  className="w-4 h-4 flex items-center justify-center hover:bg-[#ebd578] rounded text-slate-700"
                  title={soundEnabled ? 'Silenciar som do Clippy' : 'Ativar som do Clippy'}
                >
                  {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMinimize(true)}
                  className="w-4 h-4 flex items-center justify-center hover:bg-[#ebd578] rounded text-slate-700 font-bold"
                  title="Minimizar"
                >
                  <Minus size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleMinimize(true)}
                  className="w-4 h-4 flex items-center justify-center hover:bg-red-200 rounded text-red-700 font-bold ml-0.5"
                  title="Fechar"
                >
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* Notification badge on page update / entrance */}
            {isEntering && (
              <div className="bg-[#fff3ad] border-b border-black/30 px-3 py-1 text-[10px] text-amber-950 font-bold flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Clippy reinicializado com sucesso!</span>
                </div>
                <span className="text-[9px] text-amber-800 font-mono">Win95 OS</span>
              </div>
            )}

            {/* Navigation tabs inside the assistant */}
            <div className="flex border-b border-black/20 bg-[#fff5b8] text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tips');
                  if (soundEnabled) playClippyPop(0.15);
                }}
                className={`flex-1 py-1 px-2 border-r border-black/20 text-center transition ${
                  activeTab === 'tips' ? 'bg-[#ffffcc] font-bold text-blue-900 border-b-2 border-b-[#ffffcc]' : 'hover:bg-[#ffefa8] text-slate-700'
                }`}
              >
                💡 Dicas Win95
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  if (soundEnabled) playClippyPop(0.15);
                }}
                className={`flex-1 py-1 px-2 border-r border-black/20 text-center transition ${
                  activeTab === 'chat' ? 'bg-[#ffffcc] font-bold text-blue-900' : 'hover:bg-[#ffefa8] text-slate-700'
                }`}
              >
                💬 Chat Gemini
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('wikitext');
                  if (soundEnabled) playClippyPop(0.15);
                }}
                className={`flex-1 py-1 px-2 text-center transition ${
                  activeTab === 'wikitext' ? 'bg-[#ffffcc] font-bold text-blue-900' : 'hover:bg-[#ffefa8] text-slate-700'
                }`}
              >
                📝 Sintaxe
              </button>
            </div>

            {/* Tab 1: Nostalgic Tips & Quick Actions */}
            {activeTab === 'tips' && (
              <div className="p-3 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
                <div className="text-[12px] leading-relaxed text-slate-900 bg-white/60 p-2.5 rounded border border-amber-300 shadow-inner">
                  <p className="font-semibold text-blue-950 mb-1 flex items-center gap-1">
                    <span>💡 Sabia disso?</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Dica #{currentTipIndex + 1} de {NOSTALGIC_TIPS.length})
                    </span>
                  </p>
                  <p>{NOSTALGIC_TIPS[currentTipIndex]}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleNextTip}
                    className="win95-button flex items-center gap-1 text-[11px] py-1"
                    title="Ver outra dica do Clippy"
                  >
                    <RotateCcw size={11} />
                    <span>Outra Dica</span>
                  </button>

                  {onRandomArticle && (
                    <button
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playWin95Ding(0.2);
                        onRandomArticle();
                      }}
                      className="win95-button flex items-center gap-1 text-[11px] py-1 font-bold text-blue-900"
                      title="Navegar para um artigo aleatório da enciclopédia"
                    >
                      <Shuffle size={11} />
                      <span>Artigo Aleatório</span>
                    </button>
                  )}

                  {onOpenSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playClippyPop(0.2);
                        onOpenSearch();
                      }}
                      className="win95-button flex items-center gap-1 text-[11px] py-1"
                      title="Pesquisar na enciclopédia"
                    >
                      <BookOpen size={11} />
                      <span>Buscar Artigo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playWin95Tada(0.3);
                      else playWin95Ding();
                    }}
                    className="win95-button flex items-center gap-1 text-[11px] py-1"
                    title="Tocar a fanfarra clássica Ta-da do Windows 95"
                  >
                    <Music size={11} />
                    <span>Som Ta-da!</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('chat');
                      if (soundEnabled) playClippyPop(0.2);
                    }}
                    className="win95-button flex items-center gap-1 text-[11px] py-1 text-purple-900 font-bold"
                    title="Fazer uma pergunta ao Clippy com Inteligência Artificial"
                  >
                    <Sparkles size={11} className="text-amber-600" />
                    <span>Perguntar ao Clippy</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Retro Chat with Clippy (Gemini Powered) */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-[280px]">
                <div className="flex-1 p-2.5 overflow-y-auto space-y-2 bg-[#fffff0]">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 px-1">
                        <span>{msg.sender === 'user' ? 'Você' : '📎 Clippy'}</span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`p-2 rounded max-w-[90%] text-[11.5px] leading-relaxed break-words relative group ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white border border-blue-800'
                            : 'bg-white text-slate-900 border border-slate-400 shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.sender === 'clippy' && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(idx, msg.text)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-600 transition"
                            title="Copiar texto"
                          >
                            {copiedIndex === idx ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-center gap-2 p-2 bg-white/70 border border-amber-300 rounded text-xs text-slate-600 italic">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Clippy está consultando a base de dados...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-2 border-t border-black/20 bg-[#fff5b8] flex gap-1.5 items-center"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Pergunte algo ao Clippy..."
                    disabled={isThinking}
                    className="flex-1 win95-input px-2 py-1 text-xs focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isThinking || !chatInput.trim()}
                    className="win95-button flex items-center gap-1 font-bold text-xs disabled:opacity-50 py-1"
                  >
                    <span>Enviar</span>
                    <Send size={11} />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Quick Wikitext Syntax Guide */}
            {activeTab === 'wikitext' && (
              <div className="p-3 max-h-[280px] overflow-y-auto space-y-2 text-[11px]">
                <p className="font-bold text-blue-950">Guia Rápido de Wikitext:</p>
                <table className="w-full border-collapse border border-slate-400 bg-white text-left">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-400 font-bold text-slate-800">
                      <th className="p-1 border-r border-slate-400">Formatação</th>
                      <th className="p-1">Sintaxe Wikitext</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-bold border-r border-slate-300">Negrito</td>
                      <td className="p-1 font-mono text-[10px]">\'\'\'palavra\'\'\'</td>
                    </tr>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="p-1 italic border-r border-slate-300">Itálico</td>
                      <td className="p-1 font-mono text-[10px]">\'\'palavra\'\'</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 border-r border-slate-300">Título Nível 2</td>
                      <td className="p-1 font-mono text-[10px]">== Título ==</td>
                    </tr>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="p-1 border-r border-slate-300">Link Interno</td>
                      <td className="p-1 font-mono text-[10px]">[[Nome do Artigo]]</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">Lista com pontos</td>
                      <td className="p-1 font-mono text-[10px]">* Item da lista</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-600">
                  Você pode usar essas marcas no editor Wikitext da enciclopédia para construir artigos completos.
                </p>
              </div>
            )}

            {/* Bottom Status bar */}
            <div className="bg-[#ebd578] border-t border-black/30 px-2.5 py-1 text-[10px] text-slate-700 flex justify-between items-center">
              <span>Status: Pronto para ajudar</span>
              {onOpenGeminiFull && (
                <button
                  type="button"
                  onClick={() => {
                    toggleMinimize(true);
                    onOpenGeminiFull();
                  }}
                  className="text-blue-900 underline font-semibold hover:text-blue-700"
                >
                  Abrir IA Completa &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Triangular Tail of Speech Bubble */}
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-black mr-12 -mt-2 drop-shadow-xs relative z-10" />

          {/* Interactive Animated Clippy Character */}
          <div
            onClick={(e) => {
              replayEntrance(e);
              handleNextTip();
            }}
            className={`w-20 h-24 sm:w-24 sm:h-28 relative cursor-pointer filter drop-shadow-[2px_4px_6px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-95 transition-transform ${isEntering ? 'clippy-wiggle' : ''}`}
            title="Clippy (Clique para interagir, ver dica ou repetir animação!)"
          >
            <svg
              viewBox="0 0 100 130"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Metallic Gradients */}
              <defs>
                <linearGradient id="clippy-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#d4d4d4" />
                  <stop offset="50%" stopColor="#9e9e9e" />
                  <stop offset="75%" stopColor="#757575" />
                  <stop offset="100%" stopColor="#e0e0e0" />
                </linearGradient>
                <linearGradient id="clippy-metal-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#9e9e9e" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Shadow underneath */}
              <ellipse cx="48" cy="122" rx="30" ry="6" fill="rgba(0,0,0,0.25)" />

              {/* Main Paperclip Metallic Body Curve (Classic coiled clip geometry) */}
              <g className={`transition-transform duration-300 ${clippyMood === 'talking' ? 'animate-bounce' : ''}`}>
                {/* Outer Backing outline */}
                <path
                  d="M 38 32 C 38 12, 70 12, 70 34 L 70 94 C 70 114, 26 114, 26 94 L 26 44 C 26 28, 54 28, 54 44 L 54 88"
                  stroke="#1a1a1a"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Metallic Silver Tube */}
                <path
                  d="M 38 32 C 38 12, 70 12, 70 34 L 70 94 C 70 114, 26 114, 26 94 L 26 44 C 26 28, 54 28, 54 44 L 54 88"
                  stroke="url(#clippy-metal)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Metallic Highlight Line */}
                <path
                  d="M 38 32 C 38 12, 70 12, 70 34 L 70 94 C 70 114, 26 114, 26 94 L 26 44 C 26 28, 54 28, 54 44 L 54 88"
                  stroke="url(#clippy-metal-highlight)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Clippy Cartoon Eyes and Eyebrows */}
              <g className="filter drop-shadow-sm">
                {/* Left Eyebrow */}
                <path
                  d={
                    clippyMood === 'thinking'
                      ? 'M 32 30 Q 42 22 48 26'
                      : clippyMood === 'happy'
                      ? 'M 32 26 Q 40 18 48 24'
                      : 'M 33 28 Q 41 24 49 28'
                  }
                  stroke="#1a1a1a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right Eyebrow */}
                <path
                  d={
                    clippyMood === 'thinking'
                      ? 'M 54 24 Q 62 16 70 20'
                      : clippyMood === 'happy'
                      ? 'M 54 24 Q 62 18 70 26'
                      : 'M 53 28 Q 61 24 69 28'
                  }
                  stroke="#1a1a1a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Left Eye White */}
                <circle cx="41" cy="38" r="9.5" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
                {/* Right Eye White */}
                <circle cx="61" cy="38" r="9.5" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />

                {/* Left Pupil (Moves depending on mood) */}
                <circle
                  cx={clippyMood === 'thinking' ? 42 : clippyMood === 'talking' ? 40 : 42}
                  cy={clippyMood === 'thinking' ? 33 : 39}
                  r="4.2"
                  fill="#111"
                />
                {/* Left Pupil Highlight */}
                <circle
                  cx={clippyMood === 'thinking' ? 43.5 : 43}
                  cy={clippyMood === 'thinking' ? 32 : 37.5}
                  r="1.4"
                  fill="white"
                />

                {/* Right Pupil */}
                <circle
                  cx={clippyMood === 'thinking' ? 62 : clippyMood === 'talking' ? 60 : 62}
                  cy={clippyMood === 'thinking' ? 33 : 39}
                  r="4.2"
                  fill="#111"
                />
                {/* Right Pupil Highlight */}
                <circle
                  cx={clippyMood === 'thinking' ? 63.5 : 63}
                  cy={clippyMood === 'thinking' ? 32 : 37.5}
                  r="1.4"
                  fill="white"
                />

                {/* Light reflection gleam when happy */}
                {clippyMood === 'happy' && (
                  <path
                    d="M 46 52 Q 52 57 58 52"
                    stroke="#1a1a1a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </g>
            </svg>
          </div>
        </div>
      )}
    </aside>
  );
};
