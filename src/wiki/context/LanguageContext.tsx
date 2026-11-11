import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, ALL_LANGUAGES, DEFAULT_LANGUAGE, getLanguageByCode } from '../utils/languages';
import { TranslationKey, getTranslation } from '../utils/translations';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language | string) => void;
  t: (key: TranslationKey) => string;
  allLanguages: Language[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  allLanguages: ALL_LANGUAGES,
  isRTL: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wikizero_language');
    if (saved) {
      return getLanguageByCode(saved);
    }
    // Check browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'pt';
    return getLanguageByCode(browserLang);
  });

  const setLanguage = (lang: Language | string) => {
    const targetLang = typeof lang === 'string' ? getLanguageByCode(lang) : lang;
    setCurrentLanguageState(targetLang);
    localStorage.setItem('wikizero_language', targetLang.code);

    // Update document HTML attributes
    document.documentElement.lang = targetLang.code;
    document.documentElement.dir = targetLang.dir || 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage.code;
    document.documentElement.dir = currentLanguage.dir || 'ltr';
  }, [currentLanguage]);

  const t = (key: TranslationKey): string => {
    return getTranslation(key, currentLanguage.code);
  };

  const isRTL = currentLanguage.dir === 'rtl';

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        allLanguages: ALL_LANGUAGES,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
