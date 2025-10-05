/**
 * i18n Configuration
 * Internationalization setup with react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import zhTW from '../locales/zh-TW.json';
import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';

const resources = {
  'zh-TW': {
    translation: zhTW,
  },
  en: {
    translation: en,
  },
  'zh-CN': {
    translation: zhCN,
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'translation',
    fallbackLng: 'zh-TW',
    lng: 'zh-TW',
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
