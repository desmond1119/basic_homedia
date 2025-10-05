import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    void i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-white hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl py-2 z-20"
            >
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  whileHover={{ x: 4 }}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    currentLanguage.code === lang.code ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm text-white flex-1 text-left">{lang.name}</span>
                  {currentLanguage.code === lang.code && (
                    <CheckIcon className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
