import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // not needed for React
    },

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        // Add cache busting
        cache: 'no-store',
      },
      // Add retry logic
      retries: 3,
      retryCodes: [500, 404, 408, 429],
    },

    // Default namespace
    defaultNS: 'common',
    ns: ['common', 'profile', 'recipes'],

    // Add loading callback for debugging
    load: 'languageOnly', // Only load language without region (e.g., 'en' instead of 'en-US')
  }, (err, t) => {
    if (err) {
      console.error('i18next initialization error:', err);
    }
  });

// Add event listeners for debugging
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});

i18n.on('loaded', (loaded) => {
  console.log('i18next loaded:', loaded);
});

i18n.on('failedLoading', (lng, ns, msg) => {
  console.error('i18next failed loading:', { lng, ns, msg });
});

export default i18n; 