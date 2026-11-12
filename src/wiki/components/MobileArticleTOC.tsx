import React, { useState } from 'react';
import { List, X, ChevronRight, Type, Volume2, VolumeX, Share2, Star, Check } from 'lucide-react';
import { TocItem } from '../utils/wikitextParser';

interface MobileArticleTOCProps {
  toc: TocItem[];
  fontSize: number;
  isPlayingAudio: boolean;
  isWatched: boolean;
  onFontSizeChange: (size: number) => void;
  onToggleSpeech: () => void;
  onToggleWatch: () => void;
  onShare: () => void;
}

export const MobileArticleTOC: React.FC<MobileArticleTOCProps> = ({
  toc,
  fontSize,
  isPlayingAudio,
  isWatched,
  onFontSizeChange,
  onToggleSpeech,
  onToggleWatch,
  onShare,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (toc.length === 0) return null;

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Action Trigger for Mobile */}
      <div className="fixed bottom-16 right-4 z-30 md:hidden flex flex-col items-end gap-2">
        <button
          id="btn-mobile-floating-toc"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-600/95 hover:bg-blue-700 text-white text-xs font-bold shadow-lg backdrop-blur-xs transition active:scale-95 border border-blue-400/30"
          aria-label="Abrir sumário de seções do artigo"
        >
          <List size={15} />
          <span>Sumário ({toc.length})</span>
        </button>
      </div>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center md:hidden animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-h-[80vh] bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={17} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-serif-heading font-bold text-sm text-slate-900 dark:text-white">
                  Seções do Artigo
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Reader Controls Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              {/* Font Size controls */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Texto:</span>
                <button
                  onClick={() => onFontSizeChange(Math.max(12, fontSize - 1))}
                  className="w-7 h-7 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95"
                  title="Diminuir fonte"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono px-1">{fontSize}px</span>
                <button
                  onClick={() => onFontSizeChange(Math.min(22, fontSize + 1))}
                  className="w-7 h-7 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95"
                  title="Aumentar fonte"
                >
                  A+
                </button>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleSpeech}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition ${
                    isPlayingAudio
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                  title={isPlayingAudio ? 'Parar leitura' : 'Ouvir artigo em voz'}
                >
                  {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                  onClick={onToggleWatch}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                    isWatched
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                  title={isWatched ? 'Vigiado' : 'Vigiar artigo'}
                >
                  <Star size={14} className={isWatched ? 'fill-current' : ''} />
                </button>

                <button
                  onClick={onShare}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  title="Compartilhar"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            {/* TOC Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleJump(item.id)}
                  className={`w-full text-left py-2 px-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                    item.level === 1
                      ? 'font-bold text-slate-900 dark:text-white'
                      : item.level === 2
                      ? 'pl-5 text-slate-700 dark:text-slate-300 font-medium'
                      : 'pl-8 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      {item.number}
                    </span>
                    <span className="truncate">{item.text || (item as any).title}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
