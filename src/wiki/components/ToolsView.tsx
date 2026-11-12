import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calculator,
  Clock,
  Keyboard,
  Globe,
  Sun,
  Moon,
  RotateCcw,
  Copy,
  Check,
  Search,
  Sparkles,
  History,
  CheckCircle2,
  Info,
  ArrowRight,
  Sliders,
  Calendar,
  Volume2,
  Trash2,
  ExternalLink,
  Laptop,
  CheckCircle,
  AlertCircle,
  CloudSun,
  GraduationCap,
  Monitor,
  Wrench,
  Puzzle,
} from 'lucide-react';
import { AppTheme, CustomToolConfig, UserProfile } from '../types';
import { WeatherTool } from './WeatherTool';
import { GoogleScholarTool } from './GoogleScholarTool';
import { ChromeAppTool } from './ChromeAppTool';
import { CalculatorTool } from './CalculatorTool';
import { WorldClockTool } from './WorldClockTool';
import { GeminiStudioTool } from './GeminiStudioTool';
import { CustomInteractiveToolRunner } from './CustomInteractiveToolRunner';
import { ExtensionManager } from '../core/ExtensionManager';

interface ToolsViewProps {
  theme?: AppTheme;
  initialTab?: ToolTab;
  onNavigateHome?: () => void;
  onOpenEditor?: (title?: string) => void;
  onNavigateToExtensions?: () => void;
  currentUser?: UserProfile | null;
}

export type ToolTab =
  | 'weather'
  | 'scholar'
  | 'calculator'
  | 'world-clock'
  | 'keyboard-checker'
  | 'chrome-app'
  | 'gemini-studio'
  | 'gemini-assistant';

export const ToolExtensionDisabledNotice: React.FC<{
  extensionName: string;
  toolName: string;
  onNavigateToExtensions?: () => void;
}> = ({ extensionName, toolName, onNavigateToExtensions }) => (
  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-xs">
    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
      <Wrench className="w-7 h-7" />
    </div>
    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
      Extensão de Ferramenta Desativada
    </span>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3 mb-2 font-serif-heading">
      {toolName} ({extensionName})
    </h3>
    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
      Esta ferramenta foi configurada como uma extensão modular independente do tipo <strong>Ferramenta</strong> e está atualmente desativada no sistema.
      Conforme as diretrizes constitucionais da WikiWorldWeb, apenas usuários com prerrogativas de <strong>Burocrata</strong> podem ativar ou desativar extensões em <code>Special:Extensions</code>.
    </p>
    {onNavigateToExtensions && (
      <button
        onClick={onNavigateToExtensions}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm"
      >
        <Puzzle className="w-4 h-4" />
        <span>Abrir Gerenciamento de Extensões (Special:Extensions)</span>
      </button>
    )}
  </div>
);

// ==========================================
// 3. VERIFICADOR DE TIPO DE TECLADO & TESTER
// ==========================================

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  location: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  timestamp: string;
}

const KeyboardCheckerTab: React.FC<{ theme?: AppTheme }> = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [lastKeyInfo, setLastKeyInfo] = useState<KeyInfo | null>(null);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);
  const [testText, setTestText] = useState<string>('');
  const [detectedLayout, setDetectedLayout] = useState<{
    type: 'ABNT2' | 'US-International' | 'ISO' | 'Indeterminado';
    confidence: string;
    details: string;
    hasCedilla: boolean;
    hasAltGr: boolean;
    hasSlashQuestionKey: boolean;
  }>({
    type: 'ABNT2',
    confidence: 'Estimado',
    details: 'Padrão brasileiro ABNT2 com tecla física Ç e AltGr para terceira função.',
    hasCedilla: false,
    hasAltGr: false,
    hasSlashQuestionKey: false,
  });

  // Ouve teclas globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });

      setTestedKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });

      // Detecção de Caps Lock
      if (typeof e.getModifierState === 'function') {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }

      // Detecção de layout em tempo de execução
      if (e.code === 'Semicolon' && e.key.toLowerCase() === 'ç') {
        setDetectedLayout((prev) => ({
          ...prev,
          type: 'ABNT2',
          confidence: 'Confirmado (100%)',
          details: 'A tecla física Ç foi pressionada diretamente, confirmando o layout nacional ABNT2.',
          hasCedilla: true,
        }));
      } else if (e.code === 'IntlRo' || e.code === 'Slash' && e.key === ';') {
        setDetectedLayout((prev) => ({
          ...prev,
          hasSlashQuestionKey: true,
        }));
      }

      if (e.code === 'AltRight') {
        setDetectedLayout((prev) => ({
          ...prev,
          hasAltGr: true,
        }));
      }

      setLastKeyInfo({
        key: e.key === ' ' ? 'Space' : e.key,
        code: e.code,
        keyCode: e.keyCode,
        location: e.location,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });

      if (typeof e.getModifierState === 'function') {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Layout visual de teclas (ABNT2 completo)
  const KEYBOARD_ROWS = [
    // F-Keys
    [
      { code: 'Escape', label: 'Esc', w: 'w-10' },
      { code: 'F1', label: 'F1' },
      { code: 'F2', label: 'F2' },
      { code: 'F3', label: 'F3' },
      { code: 'F4', label: 'F4' },
      { code: 'F5', label: 'F5' },
      { code: 'F6', label: 'F6' },
      { code: 'F7', label: 'F7' },
      { code: 'F8', label: 'F8' },
      { code: 'F9', label: 'F9' },
      { code: 'F10', label: 'F10' },
      { code: 'F11', label: 'F11' },
      { code: 'F12', label: 'F12' },
      { code: 'PrintScreen', label: 'PrtSc', w: 'w-11' },
      { code: 'Delete', label: 'Del', w: 'w-10' },
    ],
    // Number row
    [
      { code: 'Quote', label: "' \"", w: 'w-9' },
      { code: 'Digit1', label: '1 !' },
      { code: 'Digit2', label: '2 @' },
      { code: 'Digit3', label: '3 #' },
      { code: 'Digit4', label: '4 $' },
      { code: 'Digit5', label: '5 %' },
      { code: 'Digit6', label: '6 ¨' },
      { code: 'Digit7', label: '7 &' },
      { code: 'Digit8', label: '8 *' },
      { code: 'Digit9', label: '9 (' },
      { code: 'Digit0', label: '0 )' },
      { code: 'Minus', label: '- _' },
      { code: 'Equal', label: '= +' },
      { code: 'Backspace', label: 'Backspace', w: 'w-18' },
    ],
    // QWERTY row
    [
      { code: 'Tab', label: 'Tab', w: 'w-14' },
      { code: 'KeyQ', label: 'Q' },
      { code: 'KeyW', label: 'W' },
      { code: 'KeyE', label: 'E' },
      { code: 'KeyR', label: 'R' },
      { code: 'KeyT', label: 'T' },
      { code: 'KeyY', label: 'Y' },
      { code: 'KeyU', label: 'U' },
      { code: 'KeyI', label: 'I' },
      { code: 'KeyO', label: 'O' },
      { code: 'KeyP', label: 'P' },
      { code: 'BracketLeft', label: '´ `' },
      { code: 'BracketRight', label: '[ {' },
      { code: 'Enter', label: 'Enter', w: 'w-14' },
    ],
    // ASDF row
    [
      { code: 'CapsLock', label: 'Caps', w: 'w-16' },
      { code: 'KeyA', label: 'A' },
      { code: 'KeyS', label: 'S' },
      { code: 'KeyD', label: 'D' },
      { code: 'KeyF', label: 'F' },
      { code: 'KeyG', label: 'G' },
      { code: 'KeyH', label: 'H' },
      { code: 'KeyJ', label: 'J' },
      { code: 'KeyK', label: 'K' },
      { code: 'KeyL', label: 'L' },
      { code: 'Semicolon', label: 'Ç', sub: 'ABNT2' },
      { code: 'Backquote', label: '~ ^' },
      { code: 'Backslash', label: '] }' },
    ],
    // ZXCV row
    [
      { code: 'ShiftLeft', label: 'Shift', w: 'w-18' },
      { code: 'IntlBackslash', label: '\\ |' },
      { code: 'KeyZ', label: 'Z' },
      { code: 'KeyX', label: 'X' },
      { code: 'KeyC', label: 'C' },
      { code: 'KeyV', label: 'V' },
      { code: 'KeyB', label: 'B' },
      { code: 'KeyN', label: 'N' },
      { code: 'KeyM', label: 'M' },
      { code: 'Comma', label: ', <' },
      { code: 'Period', label: '. >' },
      { code: 'Slash', label: '; :' },
      { code: 'IntlRo', label: '/ ?', sub: 'ABNT2' },
      { code: 'ShiftRight', label: 'Shift', w: 'w-16' },
    ],
    // Space bar row
    [
      { code: 'ControlLeft', label: 'Ctrl', w: 'w-12' },
      { code: 'MetaLeft', label: 'Win', w: 'w-10' },
      { code: 'AltLeft', label: 'Alt', w: 'w-10' },
      { code: 'Space', label: 'Barra de Espaço', w: 'flex-1 min-w-[140px]' },
      { code: 'AltRight', label: 'AltGr', w: 'w-12' },
      { code: 'MetaRight', label: 'Win', w: 'w-10' },
      { code: 'ContextMenu', label: 'Menu', w: 'w-10' },
      { code: 'ControlRight', label: 'Ctrl', w: 'w-12' },
    ],
  ];

  const handleResetTest = () => {
    setTestedKeys(new Set());
    setPressedKeys(new Set());
    setLastKeyInfo(null);
  };

  return (
    <div className="space-y-6">
      {/* Diagnóstico do Layout Detectado */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Keyboard size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Layout Físico / Lógico Detectado:
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  {detectedLayout.type}
                </span>
                <span className="text-[10px] text-slate-400">({detectedLayout.confidence})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {detectedLayout.details}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetTest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              <RotateCcw size={13} />
              <span>Resetar Teste</span>
            </button>
          </div>
        </div>

        {/* Indicadores de Características */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                detectedLayout.hasCedilla ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              Tecla Ç Dedicada: <strong>{detectedLayout.hasCedilla ? 'Confirmada' : 'Aguardando toque'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                detectedLayout.hasAltGr ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              Tecla AltGr (3ª função): <strong>{detectedLayout.hasAltGr ? 'Detectada' : 'Aguardando'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                capsLockActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              Caps Lock: <strong>{capsLockActive ? 'ATIVADO' : 'Desativado'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">
              Teclas Testadas: <strong>{testedKeys.size}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Teclado Visual Interativo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Pressione as teclas do seu teclado físico para iluminá-las na tela:
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Pressionada Agora
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Já Testada (OK)
            </span>
          </div>
        </div>

        <div className="space-y-1.5 min-w-[760px] select-none p-3 bg-slate-100/70 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center">
              {row.map((k) => {
                const isPressed = pressedKeys.has(k.code);
                const isTested = testedKeys.has(k.code);

                return (
                  <div
                    key={k.code}
                    className={`h-10 px-2 rounded-lg text-[11px] font-mono font-bold flex flex-col items-center justify-center transition-all ${
                      k.w || 'w-10'
                    } ${
                      isPressed
                        ? 'bg-blue-600 text-white scale-95 shadow-inner'
                        : isTested
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 shadow-xs'
                    }`}
                  >
                    <span>{k.label}</span>
                    {k.sub && (
                      <span className="text-[7px] uppercase opacity-70 leading-none">{k.sub}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Painel de Informações do Evento da Última Tecla Pressionada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">
            <Info size={16} className="text-blue-500" />
            <span>Dados Técnicos do Último Evento (Key Event)</span>
          </div>

          {lastKeyInfo ? (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">event.key:</span>
                <strong className="text-blue-600 dark:text-blue-400 text-sm">{lastKeyInfo.key}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">event.code:</span>
                <strong className="text-slate-800 dark:text-slate-200">{lastKeyInfo.code}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">keyCode / which:</span>
                <strong className="text-slate-800 dark:text-slate-200">{lastKeyInfo.keyCode}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">location:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {lastKeyInfo.location === 0 ? 'Standard (0)' : lastKeyInfo.location === 1 ? 'Left (1)' : lastKeyInfo.location === 2 ? 'Right (2)' : 'Numpad (3)'}
                </strong>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Pressione qualquer tecla para inspecionar os códigos do evento.
            </div>
          )}
        </div>

        {/* Campo de Teste Rápido de Acentuação e Digitação */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Área de Teste de Acentuação & Teclas Mortas</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Digite palavras com acentos e caracteres especiais para confirmar se o mapa do seu sistema operacional está alinhado (ex: <code>não</code>, <code>coração</code>, <code>você</code>, <code>água</code>, <code>¹²³</code>).
            </p>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Clique aqui e digite: Ação, você, café, interrogação /?..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{testText.length} caracteres digitados</span>
            {testText && (
              <button
                onClick={() => setTestText('')}
                className="text-rose-500 hover:underline font-semibold"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL TOOLSVIEW
// ==========================================

export const ToolsView: React.FC<ToolsViewProps> = ({
  theme,
  initialTab = 'weather',
  onNavigateHome,
  onOpenEditor,
  onNavigateToExtensions,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>(initialTab);
  const extensionManager = ExtensionManager.getInstance();

  const [extensionStates, setExtensionStates] = useState({
    weather: extensionManager.isExtensionLoaded('WikiWeatherForecastTool'),
    calculator: extensionManager.isExtensionLoaded('WikiCalculatorTool'),
    clock: extensionManager.isExtensionLoaded('WikiWorldClockTool'),
    gemini: extensionManager.isExtensionLoaded('WikiGeminiStudioTool'),
  });

  const [customTools, setCustomTools] = useState<CustomToolConfig[]>(() =>
    extensionManager.getActiveCustomTools()
  );

  useEffect(() => {
    const unsub = extensionManager.subscribe(() => {
      setExtensionStates({
        weather: extensionManager.isExtensionLoaded('WikiWeatherForecastTool'),
        calculator: extensionManager.isExtensionLoaded('WikiCalculatorTool'),
        clock: extensionManager.isExtensionLoaded('WikiWorldClockTool'),
        gemini: extensionManager.isExtensionLoaded('WikiGeminiStudioTool'),
      });
      setCustomTools(extensionManager.getActiveCustomTools());
    });
    return () => unsub();
  }, [extensionManager]);

  // Sincroniza se a aba inicial mudar externamente por URL router
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div id="tools-view" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho da Página de Ferramentas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={15} />
              <span>WikiWorldWeb Utilities & Academic Tools</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Ferramentas Comuns de Uso
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Utilitários essenciais e rápidos para o dia a dia: previsão do tempo ao vivo com radar estendido, integração completa de pesquisa ao Google Acadêmico, calculadora científica com histórico, fusos horários mundiais e verificador de teclado físico.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToExtensions && (
              <button
                onClick={onNavigateToExtensions}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition flex items-center gap-1.5"
                title="Gerenciar extensões e permissões de ferramentas em Special:Extensions"
              >
                <Puzzle size={14} />
                <span>Extensões do Sistema</span>
              </button>
            )}

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="self-start md:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Voltar ao Início
              </button>
            )}
          </div>
        </div>

        {/* Seletor das 7 Ferramentas Principais e Utilitários de Extensão */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Aba 1: Previsão do Tempo */}
          <button
            id="tab-btn-weather"
            onClick={() => setActiveTab('weather')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer relative ${
              activeTab === 'weather'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'weather'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CloudSun size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold truncate">Previsão Tempo</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  extensionStates.weather ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'
                }`}>
                  {extensionStates.weather ? 'Ext' : 'Off'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Ao Vivo e 7 Dias
              </div>
            </div>
          </button>

          {/* Aba 2: Google Acadêmico */}
          <button
            id="tab-btn-scholar"
            onClick={() => setActiveTab('scholar')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'scholar'
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'scholar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Google Acadêmico</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Pesquisa Científica
              </div>
            </div>
          </button>

          {/* Aba 3: Calculadora */}
          <button
            id="tab-btn-calculator"
            onClick={() => setActiveTab('calculator')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'calculator'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'calculator'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Calculator size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold truncate">Calculadora</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  extensionStates.calculator ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'
                }`}>
                  {extensionStates.calculator ? 'Ext' : 'Off'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Científica e Histórico
              </div>
            </div>
          </button>

          {/* Aba 4: Horário Certo Mundial */}
          <button
            id="tab-btn-worldclock"
            onClick={() => setActiveTab('world-clock')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'world-clock'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'world-clock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Clock size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold truncate">Horário Mundial</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  extensionStates.clock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'
                }`}>
                  {extensionStates.clock ? 'Ext' : 'Off'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Fusos e Conversor
              </div>
            </div>
          </button>

          {/* Aba 5: Verificador de Teclado */}
          <button
            id="tab-btn-keyboard"
            onClick={() => setActiveTab('keyboard-checker')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'keyboard-checker'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'keyboard-checker'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Keyboard size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Teclado Físico</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                ABNT2/ANSI e Teste
              </div>
            </div>
          </button>

          {/* Aba 6: App Chrome & Computador */}
          <button
            id="tab-btn-chrome-app"
            onClick={() => setActiveTab('chrome-app')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'chrome-app'
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-400/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeTab === 'chrome-app'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Monitor size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">App Chrome/PC</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Web Store & Desktop
              </div>
            </div>
          </button>

          {/* Abas dinâmicas registradas por extensões customizadas */}
          {customTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id as any)}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                activeTab === tool.id
                  ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-400/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  activeTab === tool.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Wrench size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold truncate">{tool.title}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60">
                    Ext
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {tool.subtitle || tool.description || 'Ferramenta Customizada'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da Ferramenta Selecionada com verificação de status de extensão */}
      {activeTab === 'weather' && (
        extensionStates.weather ? (
          <WeatherTool theme={theme} />
        ) : (
          <ToolExtensionDisabledNotice
            extensionName="WikiWeatherForecastTool"
            toolName="Previsão do Tempo"
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {activeTab === 'scholar' && <GoogleScholarTool theme={theme} onOpenEditor={onOpenEditor} />}

      {activeTab === 'calculator' && (
        extensionStates.calculator ? (
          <CalculatorTool theme={theme} />
        ) : (
          <ToolExtensionDisabledNotice
            extensionName="WikiCalculatorTool"
            toolName="Calculadora Multiuso"
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {activeTab === 'world-clock' && (
        extensionStates.clock ? (
          <WorldClockTool theme={theme} />
        ) : (
          <ToolExtensionDisabledNotice
            extensionName="WikiWorldClockTool"
            toolName="Horário Mundial e Fusos"
            onNavigateToExtensions={onNavigateToExtensions}
          />
        )
      )}

      {activeTab === 'keyboard-checker' && <KeyboardCheckerTab theme={theme} />}
      {activeTab === 'chrome-app' && <ChromeAppTool theme={theme} />}

      {/* Renderização de Ferramentas Interativas Criadas por Extensões */}
      {customTools.map((tool) => {
        if (activeTab === tool.id) {
          return (
            <CustomInteractiveToolRunner
              key={tool.id}
              tool={tool}
              theme={theme}
              onNavigateToExtensions={onNavigateToExtensions}
            />
          );
        }
        return null;
      })}
    </div>
  );
};
