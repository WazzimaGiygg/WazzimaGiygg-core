import React, { useState, useMemo } from 'react';
import { Globe2, Search, X, Check, MapPin, Sparkles } from 'lucide-react';
import { ALL_LANGUAGES, Language } from '../utils/languages';
import { useLanguage } from '../context/LanguageContext';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const regions = [
    { id: 'All', label: 'Todos' },
    { id: 'Americas', label: 'Américas' },
    { id: 'Europe', label: 'Europa' },
    { id: 'Asia', label: 'Ásia & Pacífico' },
    { id: 'MiddleEastAfrica', label: 'Oriente Médio & África' },
    { id: 'Universal', label: 'Universais & Históricos' },
  ];

  const filteredLanguages = useMemo(() => {
    return ALL_LANGUAGES.filter((lang) => {
      const matchesRegion = selectedRegion === 'All' || lang.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q);
      return matchesRegion && matchesSearch;
    });
  }, [searchQuery, selectedRegion]);

  if (!isOpen) return null;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none font-sans">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xl overflow-hidden animate-in zoom-in-95 text-xs flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <Globe2 size={18} className="text-blue-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                {t('modal.languages_title')}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Selecione entre mais de 45 idiomas globais com suporte completo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Region Filters */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2 flex-shrink-0">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('modal.languages_search')}
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedRegion === reg.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language Grid List */}
        <div className="p-3 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {filteredLanguages.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 space-y-1">
              <Globe2 size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
              <p className="font-semibold">Nenhum idioma encontrado com "{searchQuery}"</p>
              <p className="text-[11px] text-slate-500">Tente buscar pelo nome nativo, inglês ou código ISO.</p>
            </div>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = currentLanguage.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang)}
                  className={`flex items-center justify-between p-2 rounded border text-left transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs truncate">
                          {lang.nativeName}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          {lang.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {lang.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 ml-1">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-shrink-0 font-mono">
          <div>
            Total: <span className="font-bold text-slate-900 dark:text-white">{filteredLanguages.length}</span> idiomas listados
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
