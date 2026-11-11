import React from 'react';
import { formatExternalUrl } from '../utils/linkUtils';

export const GoogleAIStudioBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://aistudio.google.com/")}
    target="_blank"
    rel="noopener noreferrer"
    title="Powered by Google AI Studio - Tecnologia de Inteligência Artificial Google Gemini"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-white to-blue-50/40 dark:from-[#131b2e] dark:to-[#0f172a] border border-blue-200 dark:border-blue-900/60 hover:border-blue-500 dark:hover:border-blue-400 rounded transition p-1 shadow-xs group"
  >
    {/* Google AI Studio 4-Color Sparkle Star */}
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <path
        d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z"
        fill="url(#google-ai-gradient)"
      />
      <circle cx="17.5" cy="6.5" r="1.5" fill="#4285F4" />
      <defs>
        <linearGradient id="google-ai-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.33" stopColor="#9B72CB" />
          <stop offset="0.66" stopColor="#D96570" />
          <stop offset="1" stopColor="#F4B400" />
        </linearGradient>
      </defs>
    </svg>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-blue-600 dark:text-blue-400 font-bold uppercase">
        POWERED BY
      </span>
      <span className="text-[7.5px] font-sans font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight">
        Google AI
      </span>
    </div>
  </a>
);

export const CreativeCommonsBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://creativecommons.org/licenses/by-sa/4.0/")}
    target="_blank"
    rel="noopener noreferrer"
    title="Conteúdo licenciado sob Creative Commons Atribuição-CompartilhaIgual (CC BY-SA 4.0)"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-[#f8f9fa] dark:bg-[#1a202c] border border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-400 rounded transition p-1 shadow-xs group"
  >
    {/* Creative Commons CC + BY + SA circles */}
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {/* CC Icon */}
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-9c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5H8v-4h1.5zm0 1.5H8.75v1H9.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5zm5.5-1.5c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5H13.5v-4H15zm0 1.5h-.75v1H15c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z" />
      </svg>
      {/* BY Icon */}
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" transform="scale(0.8) translate(3, 1)" />
      </svg>
    </div>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-sans tracking-tighter text-slate-500 dark:text-slate-400 font-bold uppercase">
        CREATIVE
      </span>
      <span className="text-[7.5px] font-sans font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
        CC BY-SA
      </span>
    </div>
  </a>
);

export const DeepSeekIABadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://www.deepseek.com/")}
    target="_blank"
    rel="noopener noreferrer"
    title="Powered by DeepSeek IA - Modelos de Raciocínio e Inteligência Artificial Aberta"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-[#0c1829] to-[#040d1a] border border-cyan-800/80 hover:border-cyan-400 rounded transition p-1 shadow-xs group"
  >
    {/* DeepSeek Whale / Wave Logo */}
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <path
        d="M4 14.5C4 9.5 8 5.5 13 5.5C18 5.5 21 8.5 21 11.5C21 14.5 18 18 13 18C10 18 8 17 6.5 16L4 18.5V14.5Z"
        fill="#00B4D8"
      />
      <circle cx="14" cy="9.5" r="1.5" fill="#FFFFFF" />
      <path
        d="M8.5 13C10 14.5 13.5 14.5 15.5 13"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-cyan-400 font-bold uppercase">
        POWERED BY
      </span>
      <span className="text-[7.5px] font-sans font-bold text-white group-hover:text-cyan-300 tracking-tight">
        DeepSeek IA
      </span>
    </div>
  </a>
);

export const GitHubBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://github.com/WazzimaGiygg/Wiki-alternative")}
    target="_blank"
    rel="noopener noreferrer"
    title="Código-fonte aberto e repositório oficial no GitHub: WazzimaGiygg/Wiki-alternative"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-[#24292e] to-[#181a1f] dark:from-[#1b1f24] dark:to-[#0d1117] border border-slate-700 hover:border-slate-400 rounded transition p-1 shadow-xs group"
  >
    {/* GitHub Octocat Logo */}
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 text-white fill-current">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-slate-400 font-bold uppercase">
        OPEN SOURCE
      </span>
      <span className="text-[7.5px] font-sans font-bold text-white group-hover:text-slate-200 tracking-tight">
        GitHub
      </span>
    </div>
  </a>
);

export const WazzimaDossierBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://wazzimagiygg.com/averdade/")}
    target="_blank"
    rel="noopener noreferrer"
    title="Investigação e Dossiê dos abusos da Wikipédia contra WazzimaGiygg: https://wazzimagiygg.com/averdade/"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-amber-950 via-slate-900 to-black border border-amber-500/60 hover:border-amber-400 rounded transition p-1 shadow-xs group"
  >
    {/* Alert / Truth Document Icon */}
    <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
        <path d="M12 2L1 21h22L12 2zm0 3.5l7.53 13.5H4.47L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
      </svg>
    </div>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-amber-400 font-bold uppercase">
        DOSSIÊ WIKI
      </span>
      <span className="text-[7.5px] font-sans font-bold text-amber-100 group-hover:text-white tracking-tight">
        A Verdade
      </span>
    </div>
  </a>
);

export const FirebaseBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://firebase.google.com/products/firestore")}
    target="_blank"
    rel="noopener noreferrer"
    title="Banco de Dados e Infraestrutura Cloud fornecidos por Google Firebase Firestore"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-[#1a140b] via-[#241a0d] to-[#0f0c08] border border-amber-500/50 hover:border-amber-400 rounded transition p-1 shadow-xs group"
  >
    {/* Firebase Flame Vector Logo */}
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
      <path
        d="M5.4 17.5L8.2 2.8C8.3 2.3 9 2.1 9.4 2.5L13.1 9.3L5.4 17.5Z"
        fill="#FFA000"
      />
      <path
        d="M13.1 9.3L15.3 5.3C15.6 4.8 16.3 4.9 16.5 5.5L18.8 17.5L13.1 9.3Z"
        fill="#F57C00"
      />
      <path
        d="M3.2 19.8L5.4 17.5L13.1 9.3L15.3 13.5L3.8 20.3C3.3 20.6 2.8 20.2 3.2 19.8Z"
        fill="#FFCA28"
      />
      <path
        d="M18.8 17.5L15.3 13.5L13.1 9.3L9.4 2.5C9 2.1 8.3 2.3 8.2 2.8L3.2 19.8C2.9 20.9 3.9 21.8 4.9 21.3L12 17.3L19.1 21.3C20.1 21.8 21.1 20.9 20.8 19.8L18.8 17.5Z"
        fill="#FFA000"
      />
      <path
        d="M12 17.3L4.9 21.3C3.9 21.8 2.9 20.9 3.2 19.8L3.8 20.3C3.3 20.2 2.8 20.6 3.2 19.8L4.9 21.3L12 17.3Z"
        fill="#FF8F00"
      />
    </svg>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-amber-400 font-bold uppercase">
        POWERED BY
      </span>
      <span className="text-[7.5px] font-sans font-bold text-amber-200 group-hover:text-amber-100 tracking-tight">
        Firebase DB
      </span>
    </div>
  </a>
);

export const GoDaddyBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://www.godaddy.com")}
    target="_blank"
    rel="noopener noreferrer"
    title="Domínio oficial registrado e adquirido via GoDaddy: https://www.godaddy.com"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-[#003734] via-[#002725] to-[#011413] border border-emerald-500/60 hover:border-emerald-400 rounded transition p-1 shadow-xs group"
  >
    {/* GoDaddy 'GO' Heart/Logo Vector Icon */}
    <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-400/10 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-[#00A4A6]">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
      </svg>
    </div>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-emerald-400 font-bold uppercase">
        DOMÍNIO
      </span>
      <span className="text-[7.5px] font-sans font-bold text-emerald-100 group-hover:text-white tracking-tight">
        GoDaddy
      </span>
    </div>
  </a>
);

export const LgpdMarcoCivilBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Conformidade integral com a LGPD (Lei nº 13.709/2018) e Marco Civil da Internet (Lei nº 12.965/2014) no Brasil"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-[#062c1e] via-[#051f15] to-[#02100b] border border-emerald-500/70 hover:border-emerald-400 rounded transition p-1 shadow-xs group cursor-pointer text-left"
  >
    {/* Shield with Brazil-inspired checkmark/lock */}
    <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-emerald-400">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    </div>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.2px] font-mono tracking-tighter text-emerald-400 font-bold uppercase">
        CONFORME
      </span>
      <span className="text-[7.5px] font-sans font-bold text-emerald-100 group-hover:text-white tracking-tight">
        LGPD & MCI
      </span>
    </div>
  </button>
);

export const WazzimaSupportBadge: React.FC = () => (
  <a
    href={formatExternalUrl("https://support.wazzimagiygg.com/")}
    target="_blank"
    rel="noopener noreferrer"
    title="Central de Suporte, Tickets e Atendimento dos Serviços WazzimaGiygg: https://support.wazzimagiygg.com/"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#020617] border border-indigo-500/70 hover:border-indigo-400 rounded transition p-1 shadow-xs group"
  >
    {/* Headset / Lifebuoy / Ticket Support Icon */}
    <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-indigo-300">
        <path d="M12 2C6.48 2 2 6.48 2 12v6c0 1.1.9 2 2 2h3v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-3v8h3c1.1 0 2-.9 2-2v-6c0-5.52-4.48-10-10-10zm-6 12H4v-2h2v2zm14 0h-2v-2h2v2z" />
      </svg>
    </div>
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.2px] font-mono tracking-tighter text-indigo-400 font-bold uppercase">
        SUPORTE
      </span>
      <span className="text-[7.5px] font-sans font-bold text-indigo-100 group-hover:text-white tracking-tight">
        Tickets 24h
      </span>
    </div>
  </a>
);

export const WikiZeroBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="WikiZero - Enciclopédia Aberta e Livre"
    className="inline-flex items-center justify-between w-[88px] h-[31px] bg-gradient-to-br from-slate-900 via-slate-800 to-black border border-slate-700 hover:border-blue-500 rounded transition p-1 shadow-xs group cursor-pointer"
  >
    <img src="/logo.png" alt="WikiZero" className="w-5 h-5 object-contain rounded-xs shrink-0" />
    <div className="flex flex-col text-right leading-none pr-0.5">
      <span className="text-[5.5px] font-mono tracking-tighter text-blue-400 font-bold uppercase">
        OFFICIAL
      </span>
      <span className="text-[7.5px] font-sans font-bold text-white group-hover:text-blue-300 tracking-tight">
        WikiZero
      </span>
    </div>
  </button>
);

export const FooterBadges: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-1">
      <WikiZeroBadge onClick={() => onNavigate && onNavigate('hub')} />
      <WazzimaSupportBadge />
      <LgpdMarcoCivilBadge onClick={() => onNavigate && onNavigate('privacy')} />
      <FirebaseBadge />
      <GoDaddyBadge />
      <GoogleAIStudioBadge />
      <WazzimaDossierBadge />
      <GitHubBadge />
      <CreativeCommonsBadge />
      <DeepSeekIABadge />
    </div>
  );
};
