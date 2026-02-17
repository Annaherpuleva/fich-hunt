import React, { createContext, useContext, useMemo, useState } from 'react';
import { translations } from '../locales/translations';

type Language = 'en' | 'ru';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
    }>({ language: 'ru', setLanguage: () => {}, t: translations['ru'] });

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'ru';
  const stored = window.localStorage?.getItem('cryptofish:language');
  if (stored === 'ru' || stored === 'en') return stored;
  return 'ru';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageState, setLanguageState] = useState<Language>(getInitialLanguage);
  const language = languageState;
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('cryptofish:language', lang);
      (window as any).__cryptofishLang = lang;
    }
  };
  if (typeof window !== 'undefined') {
    (window as any).__cryptofishLang = language;
  }
  const t = useMemo(() => translations[language], [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
