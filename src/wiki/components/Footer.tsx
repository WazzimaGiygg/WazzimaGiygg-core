import React from 'react';
import {
  ExternalLink,
  Heart,
  Shield,
  Lock,
  FileText,
  Globe2,
  History,
  AlertTriangle,
  ShieldCheck,
  LifeBuoy,
  Smartphone,
  Monitor,
  Gavel,
  AlertOctagon,
  ShieldAlert,
  Tv,
  Palette,
  Sparkles,
  Pickaxe,
  Gamepad2,
  Award,
  BookOpen,
  GraduationCap,
  Newspaper,
  Scale,
} from 'lucide-react';
import { ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { playHalfLifeHEVBeep, playHalfLifeGeiger } from '../utils/halfLifeAudio';
import { FooterBadges } from './FooterBadges';
import { formatExternalUrl } from '../utils/linkUtils';
import { GoogleReaderRevenueDonation } from './GoogleReaderRevenueDonation';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  theme?: AppTheme;
  deviceMode?: DeviceMode;
  onToggleDeviceMode?: (mode: DeviceMode) => void;
  onOpenLanguagesModal?: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onRebootWin7?: () => void;
  onRebootWin10?: () => void;
  onRebootWinXP?: () => void;
  onRebootWin95?: () => void;
  onOpenChromeRecommendation?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  theme = 'light',
  deviceMode = 'auto',
  onToggleDeviceMode,
  onOpenLanguagesModal,
  onSetTheme,
  onRebootWin7,
  onRebootWin10,
  onRebootWinXP,
  onRebootWin95,
  onOpenChromeRecommendation,
}) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <footer className="mt-12 bg-[#f8f9fa] dark:bg-[#0b0f17] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 py-6 pb-24 md:pb-6 transition-colors select-none font-sans no-print print:hidden w-full max-w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 min-w-0">
        {/* R.E.P.O. Semiwork Tactical Contractor Mission Footer Strip */}
        {theme === 'repo' && (
          <div className="p-3 bg-[#070a0e] border border-[#f59e0b]/50 rounded text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-2 text-[#f59e0b]">
              <AlertTriangle size={15} className="animate-pulse" />
              <span className="font-bold">CONTRATO DE SALVAMENTO SEMIWORK // DIRETRIZ DE OPERAÇÃO</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>STATUS: SUCATA COLETADA</span>
              <span className="text-[#22d3ee]">TRANSMISSÃO TELEMÉTRICA SEGURA</span>
              <span className="text-amber-400 font-bold">R.E.P.O. v1.0.4</span>
            </div>
          </div>
        )}

        {/* Minecraft Survival Edition World Seed Footer Strip */}
        {theme === 'minecraft' && (
          <div className="p-3 bg-[#191512] border-2 border-[#55ff55]/50 rounded-xs text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_12px_rgba(85,255,85,0.15)]">
            <div className="flex items-center gap-2 text-[#55ff55]">
              <Pickaxe size={15} className="text-[#55ff55]" />
              <span className="font-bold">MINECRAFT SURVIVAL // SEED DO MUNDO: -48291039572910</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="text-[#ffaa00]">DIFICULDADE: DIFÍCIL</span>
              <span className="text-[#55ffff]">MODO HARDCORE ATIVO</span>
              <span className="text-[#55ff55] font-bold">MINECRAFT v1.21</span>
            </div>
          </div>
        )}

        {/* Roblox Experience Footer Strip */}
        {theme === 'roblox' && (
          <div className="p-3 bg-[#14151a] border border-[#00b06f]/50 rounded-lg text-xs font-sans text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_12px_rgba(0,176,111,0.15)]">
            <div className="flex items-center gap-2 text-[#00b06f]">
              <Gamepad2 size={15} className="text-[#00b06f]" />
              <span className="font-bold">ROBLOX CORPORATION // EXPERIÊNCIA WIKIZERO PLACE</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-sans">
              <span className="text-[#00a2ff]">STATUS: JOGANDO COM 14.8K AMIGOS</span>
              <span className="text-emerald-400 font-semibold">98% AVALIAÇÃO POSITIVA</span>
              <span className="text-white font-bold">ROBLOX ENGINE v624</span>
            </div>
          </div>
        )}

        {/* Nokia 3310 Monochromatic LCD Footer Strip */}
        {theme === 'nokia3310' && (
          <div className="p-3 bg-[#b4c995] border-2 border-[#1f281b] rounded-none text-xs font-mono text-[#1f281b] flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_#1f281b]">
            <div className="flex items-center gap-2 text-[#1f281b]">
              <Smartphone size={15} className="text-[#1f281b]" />
              <span className="font-bold">NOKIA 3310 // DISPLAY MONOCROMÁTICO 84×48 LCD</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span>SINAL: [||||]</span>
              <span>BATERIA: [||||]</span>
              <span className="bg-[#1f281b] text-[#c2d6a4] px-1.5 py-0.5">SNAKE II PRONTO</span>
              <span>CONNECTING PEOPLE</span>
            </div>
          </div>
        )}

        {/* Half-Life Black Mesa Terminal Footer Strip */}
        {theme === 'halflife' && (
          <div className="p-3 bg-[#131613] border-2 border-[#ff9900]/70 rounded-lg text-xs font-mono text-[#ff9900] flex flex-wrap items-center justify-between gap-3 shadow-[0_0_16px_rgba(255,153,0,0.18)]">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full border border-[#ff9900] bg-[#1a1f1a] flex items-center justify-center font-bold text-xs text-[#ff9900]">
                λ
              </span>
              <span className="font-bold tracking-wide">
                BLACK MESA RESEARCH FACILITY // TERMINAL ACCESS LEVEL 4 • SECTOR C
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
              <span className="text-[#33ff33] font-bold">[+] 100 HEALTH</span>
              <span className="text-[#ff9900] font-bold">⚡ 100 SUIT</span>
              <button
                type="button"
                onClick={() => playHalfLifeHEVBeep(0.35)}
                className="px-2 py-0.5 rounded bg-[#ff9900]/20 text-[#ffaa22] border border-[#ff9900]/50 hover:bg-[#ff9900] hover:text-black transition-colors font-bold cursor-pointer"
                title="Tocar Alerta HEV Suit"
              >
                HEV Chime 🔊
              </button>
              <button
                type="button"
                onClick={() => playHalfLifeGeiger(5, 0.25)}
                className="px-2 py-0.5 rounded bg-[#ff9900]/20 text-[#ffaa22] border border-[#ff9900]/50 hover:bg-[#ff9900] hover:text-black transition-colors font-bold cursor-pointer"
                title="Tocar Contador Geiger"
              >
                Geiger ☢
              </button>
            </div>
          </div>
        )}

        {/* Windows XP Taskbar / Luna strip */}
        {theme === 'winxp' && (
          <div className="winxp-taskbar p-2 rounded-t-lg text-xs font-sans text-white flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRebootWinXP?.()}
                className="winxp-start-button flex items-center gap-1.5 px-3 py-1 font-bold text-sm tracking-wide text-white italic shadow-sm cursor-pointer"
                title="Clique para reiniciar e rever o boot clássico do Windows XP"
              >
                <svg className="w-4 h-4 not-italic" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M2 3h9v9H2z" />
                  <path fill="#7fba00" d="M13 3h9v9h-9z" />
                  <path fill="#00a4ef" d="M2 13h9v9H2z" />
                  <path fill="#ffb900" d="M13 13h9v9h-9z" />
                </svg>
                <span className="lowercase font-black">iniciar</span>
              </button>
              <span className="text-xs text-blue-100 font-medium hidden sm:inline ml-2">
                Microsoft Windows XP Professional [Versão 5.1.2600 Service Pack 3]
              </span>
            </div>
            <div className="winxp-tray flex items-center gap-3 px-3 py-1 rounded-sm text-[11px] font-medium">
              <span className="text-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conectado: 100,0 Mbps
              </span>
              <span className="text-blue-200 hidden xs:inline">Volume: 100%</span>
              <span className="bg-[#0b388f] px-2 py-0.5 rounded border border-[#1b58bf] text-white font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Windows 7 Aero Glass Superbar */}
        {theme === 'win7' && (
          <div className="win7-superbar p-2 rounded-t-lg text-xs font-sans text-white flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3">
              {/* The iconic Start Orb */}
              <button
                type="button"
                onClick={() => onRebootWin7?.()}
                className="win7-start-orb cursor-pointer"
                title="Clique para reiniciar e rever a animação de inicialização do Windows 7"
              >
                <svg className="w-5 h-5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" viewBox="0 0 160 160">
                  <path d="M 28 34 C 44 26, 62 46, 75 40 C 75 58, 74 76, 74 88 C 60 94, 44 74, 27 82 Z" fill="#f25022" />
                  <path d="M 83 39 C 97 33, 115 48, 133 42 C 132 60, 130 78, 129 90 C 114 96, 97 78, 83 87 Z" fill="#7fba00" />
                  <path d="M 26 89 C 43 82, 60 100, 74 95 C 73 112, 72 130, 71 142 C 58 147, 41 129, 25 137 Z" fill="#00a4ef" />
                  <path d="M 82 94 C 96 88, 114 103, 128 97 C 127 114, 125 131, 124 144 C 110 150, 94 132, 81 141 Z" fill="#ffb900" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                <div className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>WikiWorldWeb 7</span>
                </div>
                <span className="text-xs text-sky-200 font-medium hidden sm:inline ml-1">
                  Windows 7 Ultimate [Service Pack 1 - 64-bit]
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-1 rounded bg-black/20 border border-white/10 text-[11px] font-medium text-sky-100">
                <span className="flex items-center gap-1 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Rede: Internet Ativa
                </span>
                <span className="font-mono text-white">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {/* Aero Peek button on the right */}
              <div
                className="win7-aero-peek"
                title="Mostrar Área de Trabalho (Aero Peek)"
                onClick={() => onRebootWin7?.()}
              />
            </div>
          </div>
        )}

        {/* Windows 10 Fluent Dark Taskbar */}
        {theme === 'win10' && (
          <div className="win10-taskbar px-2 py-1 text-xs font-sans text-white flex flex-wrap items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-2">
              {/* Windows 10 Start Button */}
              <button
                type="button"
                onClick={() => onRebootWin10?.()}
                className="win10-start-btn p-1.5 hover:bg-white/10 transition rounded-none cursor-pointer"
                title="Iniciar - Clique para reiniciar e rever o Boot do Windows 10"
              >
                <svg className="w-4 h-4" viewBox="0 0 115 119" fill="none">
                  <path d="M0 16.5L45.4 10.3V56.4H0V16.5Z" fill="#00adef" />
                  <path d="M50.6 9.6L114.7 0V55.7H50.6V9.6Z" fill="#00adef" />
                  <path d="M0 62.4H45.4V108.5L0 102.3V62.4Z" fill="#00adef" />
                  <path d="M50.6 62.4H114.7V118.1L50.6 108.5V62.4Z" fill="#00adef" />
                </svg>
              </button>

              {/* Cortana / Taskbar Search Box */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/15 border border-transparent hover:border-white/20 text-slate-300 text-xs w-48 transition cursor-text">
                <span className="w-2 h-2 rounded-full border border-sky-400"></span>
                <span className="text-[11px] text-slate-400">Digite aqui para pesquisar</span>
              </div>

              {/* Active Pinned App with bottom accent line */}
              <div className="relative px-3 py-1.5 bg-white/15 border border-white/10 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-[#00adef]"></span>
                <span>WikiWorldWeb 10 Pro</span>
                {/* Windows 10 Active App Underline */}
                <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#00adef]"></div>
              </div>
            </div>

            {/* System Tray */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 px-2 py-1 text-[11px] text-slate-300">
                <span className="hidden md:inline text-emerald-400 text-[10px]">● Conectado</span>
                <div className="flex flex-col text-right leading-tight font-mono text-[11px] text-slate-200">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[9px] text-slate-400">{new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Windows 10 Action Center Icon */}
              <div
                onClick={() => onRebootWin10?.()}
                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition cursor-pointer text-slate-400 hover:text-white"
                title="Central de Ações / Reiniciar Boot Win 10"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>

              {/* Windows 10 Peek Desktop Line */}
              <div
                className="win10-peek-line"
                title="Mostrar Área de Trabalho"
                onClick={() => onRebootWin10?.()}
              />
            </div>
          </div>
        )}

        {/* Wikidiota / Wikiomite Foundation Native Wikipedia Vector Footer */}
        {theme === 'wikidiota' && (
          <div className="wikidiota-footer-box bg-[#f8f9fa] border border-[#a2a9b1] p-4 rounded-xs text-[#202122] text-xs font-sans select-none mb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <p className="text-[11px] text-[#54595d] leading-relaxed">
                  Esta página foi editada pela última vez às {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                  Este texto é disponibilizado nos termos da <strong>Licença Creative Commons Atribuição-CompartilhaIgual (CC BY-SA 4.0)</strong>;
                  pode estar sujeito a termos adicionais e estatutos de idiotice da <strong>Wikiomite Foundation</strong>.
                </p>
                <p className="text-[10px] text-[#72777d]">
                  A <strong>Wikiomite Foundation</strong> é uma organização sem fins de bom senso, mantenedora da Wikidiota, Wikidicionário Idiota, WikiQuotes Sem Sentido e outros projetos de enciclopédia paródica.
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#0645ad] pt-1">
                  <span className="hover:underline cursor-pointer" onClick={() => onNavigate('privacy')}>Política de privacidade</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer" onClick={() => onNavigate('terms')}>Sobre a Wikidiota</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer" onClick={() => onNavigate('donation')}>Avisos gerais da Wikiomite</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer" onClick={() => onNavigate('beta')}>Código de conduta</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer" onClick={() => onNavigate('site-updates')}>Desenvolvedores</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer" onClick={() => onNavigate('offline')}>Estatísticas de idiotice</span>
                </div>
              </div>

              {/* MediaWiki / Wikiomite Badges */}
              <div className="flex items-center gap-2 shrink-0 self-center md:self-auto">
                <div className="border border-[#c8ccd1] bg-white p-1 rounded-xs flex items-center gap-1.5 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-[#3366cc] flex items-center justify-center text-white font-serif font-black text-xs">
                    W
                  </div>
                  <div className="text-[9px] leading-tight font-sans text-left">
                    <span className="text-[#54595d] block">A PROJECT OF</span>
                    <strong className="text-[#0645ad] font-bold">WIKIOMITE</strong>
                  </div>
                </div>
                <div className="border border-[#c8ccd1] bg-white p-1 rounded-xs flex items-center gap-1.5 shadow-2xs">
                  <div className="w-6 h-6 bg-[#006699] text-white flex items-center justify-center font-mono font-bold text-[10px]">
                    [MW]
                  </div>
                  <div className="text-[9px] leading-tight font-sans text-left">
                    <span className="text-[#54595d] block">POWERED BY</span>
                    <strong className="text-[#202122] font-bold">Wikiomite Engine</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Windows 1.0 (1985) MS-DOS Executive Bottom Icon Area */}
        {theme === 'win1' && (
          <div className="p-2 bg-[#008080] border-t-2 border-b-2 border-black font-mono text-xs flex flex-wrap items-center justify-between gap-3 select-none text-white">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-cyan-200 tracking-wider">
                ÁREA DE ÍCONES (1985):
              </span>

              {/* Minimized Program Tiles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>⏰</span>
                  <span>CLOCK.EXE</span>
                </div>
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>♟️</span>
                  <span>REVERSI.EXE</span>
                </div>
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>📝</span>
                  <span>NOTEPAD.EXE</span>
                </div>
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>🎨</span>
                  <span>PAINT.EXE</span>
                </div>
                <div className="border-2 border-black bg-[#0000aa] text-white px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>📖</span>
                  <span>WIKIZERO.EXE [ATIVO]</span>
                </div>
              </div>
            </div>

            <div className="border-2 border-black bg-black text-emerald-400 font-mono text-[11px] px-2.5 py-1 flex items-center gap-3">
              <span>RAM: 640 KB TOTAL</span>
              <span>•</span>
              <span className="text-cyan-300">MODO REAL 8086</span>
              <span>•</span>
              <span className="text-white font-bold">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Windows 95 Retrô Taskbar Strip */}
        {theme === 'win95' && (
          <div className="p-1.5 bg-[#c0c0c0] border-t-2 border-white border-b-2 border-black font-sans text-xs flex flex-wrap items-center justify-between gap-2 select-none shadow-inner">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="win95-button flex items-center gap-1.5 px-3 py-1 font-bold text-xs"
                title="Menu Iniciar do Windows 95"
              >
                <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                  <div className="bg-[#ff0000]" />
                  <div className="bg-[#00aa00]" />
                  <div className="bg-[#0000ff]" />
                  <div className="bg-[#ffff00]" />
                </div>
                <span>Iniciar</span>
              </button>

              <div className="win95-sunken px-3 py-1 text-black font-bold text-[11px] flex items-center gap-1.5">
                <span className="text-[#000080]">📖</span>
                <span>WikiZero 95</span>
              </div>

              <div className="win95-sunken px-2.5 py-1 text-black text-[11px] flex items-center gap-1.5 bg-[#ffffcc]">
                <span>📎</span>
                <span className="font-semibold text-blue-900">Clippy (Bot Ativo)</span>
              </div>

              {onRebootWin95 && (
                <button
                  type="button"
                  onClick={onRebootWin95}
                  className="win95-button flex items-center gap-1 text-[11px] px-2 py-1 font-bold cursor-pointer"
                  title="Reiniciar e rever a tela de inicialização clássica do Windows 95"
                >
                  <span>🔄</span>
                  <span>Boot Win95</span>
                </button>
              )}
            </div>

            <div className="win95-sunken px-2.5 py-1 text-black font-mono text-[11px] flex items-center gap-2">
              <span className="text-emerald-700 font-bold" title="Modem Dial-up 28.8k conectado">
                MODEM: 28.8K
              </span>
              <span>•</span>
              <span className="font-bold">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Official Wikimedia-style Mobile / Desktop View Selector Bar */}
        <div className="bg-slate-200/70 dark:bg-slate-850 p-2 rounded-lg flex flex-wrap items-center justify-between gap-2 border border-slate-300/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Modo de Exibição:
            </span>
            <span className="text-[10px] text-slate-500">
              (Escolha como deseja visualizar a enciclopédia)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-footer-mobile-view"
              onClick={() => onToggleDeviceMode?.('mobile')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                deviceMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
              title="Ativar layout e navegação otimizados para smartphones e telas touch"
            >
              <Smartphone size={13} />
              <span>Versão móvel</span>
              {deviceMode === 'mobile' && <span className="text-[9px] bg-blue-500 text-white px-1 rounded-xs uppercase">Ativo</span>}
            </button>

            <button
              id="btn-footer-desktop-view"
              onClick={() => onToggleDeviceMode?.('desktop')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
              title="Ativar layout completo e painéis de computador"
            >
              <Monitor size={13} />
              <span>Versão para computador</span>
              {deviceMode === 'desktop' && <span className="text-[9px] bg-blue-500 text-white px-1 rounded-xs uppercase">Ativo</span>}
            </button>

            <button
              id="btn-footer-tv-view"
              onClick={() => {
                onToggleDeviceMode?.('tv');
                onNavigate('smart-tv');
              }}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                deviceMode === 'tv'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
              title="Ativar interface 10-foot otimizada para Smart TVs e controle remoto"
            >
              <Tv size={13} />
              <span>Modo Smart TV</span>
              {deviceMode === 'tv' && <span className="text-[9px] bg-indigo-500 text-white px-1 rounded-xs uppercase">Ativo</span>}
            </button>

            {/* Link to Dedicated Centralized Appearance & Themes Page */}
            <button
              id="btn-footer-appearance-page"
              onClick={() => onNavigate('appearance')}
              className="px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs"
              title="Abrir página de personalização de aparência, temas e tipografia"
            >
              <Palette size={13} className="text-amber-500" />
              <span>Aparência & Temas</span>
            </button>
          </div>
        </div>

        {/* Frase Principal da Wiki (Lema Oficial) */}
        <div className="py-2.5 px-4 rounded-lg bg-blue-50/80 dark:bg-slate-900/90 border border-blue-200/80 dark:border-slate-800 text-center shadow-2xs">
          <p className="font-serif italic text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200">
            «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-0.5">
            <strong className="text-blue-700 dark:text-blue-400">Frase Principal da Wiki</strong> • "Não, o Tempo não é o senhor do conhecimento!"
          </p>
        </div>

        {/* Google Reader Revenue Manager Donation CTA Banner */}
        <div className="pt-1">
          <GoogleReaderRevenueDonation
            variant="banner"
            title="Apoie o Conhecimento Livre (Google Reader Revenue Manager)"
            description="Mantenha a enciclopédia no ar, rápida e sem anúncios. Clique para abrir o botão de doação oficial do Google."
          />
        </div>

        {/* Bottom Legal & MediaWiki-Style Badges Row */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="space-y-1 text-center md:text-left text-[10px] text-slate-400 font-mono">
            <p>
              O texto está disponível sob a licença{' '}
              <a
                href={formatExternalUrl("https://creativecommons.org/licenses/by-sa/4.0/")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)
              </a>
              {' '}e{' '}
              <a
                href={formatExternalUrl("https://www.gnu.org/licenses/gpl-3.0.html")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                GNU GPL v3.0
              </a>
              .
            </p>
            <p className="text-slate-500 dark:text-slate-500">
              WikiWorldWeb Enciclopédia Aberta © 2026. Infraestrutura e Banco de Dados alimentados por{' '}
              <a
                href={formatExternalUrl("https://firebase.google.com/products/firestore")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                Google Firebase (Cloud Firestore DB)
              </a>
              {' '}• Domínio via{' '}
              <a
                href={formatExternalUrl("https://www.godaddy.com")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                GoDaddy
              </a>
              {' '}• Central de Suporte & Tickets:{' '}
              <a
                href={formatExternalUrl("https://support.wazzimagiygg.com/")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                support.wazzimagiygg.com
              </a>
              {' '}• Em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong> e o <strong>Marco Civil (Lei nº 12.965/2014)</strong>. DPO: pedrohenriquecardonaperes@gmail.com
            </p>
          </div>

          {/* 88x31 px MediaWiki, LGPD & MCI, Google AI Studio, Creative Commons & DeepSeek Badges */}
          <FooterBadges onNavigate={onNavigate} />
        </div>
      </div>
    </footer>
  );
};


