import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserPreferences } from './use-user-preferences';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { preferences, loading } = useUserPreferences();

  const changeLanguage = useCallback(async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      document.documentElement.lang = language;
    } catch (error) {
      console.error('Error changing language:', error);
      // Retry once after a short delay
      setTimeout(async () => {
        try {
          await i18n.changeLanguage(language);
          document.documentElement.lang = language;
        } catch (retryError) {
          console.error('Error retrying language change:', retryError);
        }
      }, 1000);
    }
  }, [i18n]);

  useEffect(() => {
    if (!loading && preferences.uiLanguage && preferences.uiLanguage !== i18n.language) {
      changeLanguage(preferences.uiLanguage);
    }
  }, [preferences.uiLanguage, i18n.language, loading, changeLanguage]);

  return null;
}; 