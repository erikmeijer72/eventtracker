
import React, { createContext, useContext, ReactNode } from 'react';
import { translations, TranslationKey } from '../i18n';

type Language = 'nl';

interface LanguageContextType {
  language: Language;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const language: Language = 'nl';

  const t = (key: TranslationKey, ...args: (string | number)[]) => {
    let translation = translations['nl'][key];
    if (!translation) return key;
    if (args.length > 0) {
        args.forEach((arg, index) => {
            translation = translation.replace(`{${index}}`, String(arg));
        });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
