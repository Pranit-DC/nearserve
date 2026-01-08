'use client';

import { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Check if Google Translate has set a language
    const checkLanguage = () => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        setCurrentLang(select.value || 'en');
      }
    };
    
    // Check periodically for language changes
    const interval = setInterval(checkLanguage, 500);
    return () => clearInterval(interval);
  }, []);

  const changeLanguage = (langCode: string) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      setCurrentLang(langCode);
      
      // Store language preference in localStorage
      localStorage.setItem('preferredLanguage', langCode);
    }
  };
  
  // Restore language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== 'en') {
      // Wait for Google Translate to load
      const interval = setInterval(() => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select) {
          changeLanguage(savedLang);
          clearInterval(interval);
        }
      }, 100);
      
      // Clear interval after 5 seconds if not found
      setTimeout(() => clearInterval(interval), 5000);
    }
  }, []);

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Languages className="h-4 w-4" />
        <span>Language</span>
      </div>
      <div className="space-y-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              currentLang === lang.code
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">{lang.code === 'en' ? '🇬🇧' : lang.code === 'hi' ? '🇮🇳' : '🇮🇳'}</span>
            <div className="flex flex-col items-start">
              <span>{lang.native}</span>
              {lang.code !== 'en' && (
                <span className="text-xs opacity-70">{lang.name}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
