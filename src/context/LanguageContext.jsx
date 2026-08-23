import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Load from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('krishi_language') || 'en';
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('krishi_language', language);
  }, [language]);

  // Translation hook
  const t = (key, variables = {}) => {
    let str = translations[language]?.[key] ?? translations['en']?.[key] ?? key;
    
    // Replace variables e.g. {name} -> 'John'
    Object.keys(variables).forEach(varKey => {
      str = str.replace(`{${varKey}}`, variables[varKey]);
    });
    
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
