import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '2rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <Globe size={18} color="var(--text-secondary)" />
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontWeight: '500',
          cursor: 'pointer',
          appearance: 'none',
          paddingRight: '0.5rem'
        }}
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="mr">मराठी (Marathi)</option>
      </select>
    </div>
  );
}
