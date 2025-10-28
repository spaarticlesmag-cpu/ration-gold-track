import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ml from '../locales/ml.json';
import kn from '../locales/kn.json';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      hi: {
        translation: hi,
      },
      ml: {
        translation: ml,
      },
      kn: {
        translation: kn,
      },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: false, // set to true for debugging
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
  });

// Export the i18n instance
export default i18n;
