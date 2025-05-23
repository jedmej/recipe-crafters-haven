
import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'ru' | 'uk';

export interface UserPreferences {
  language: LanguageCode;
  uiLanguage: LanguageCode;
  measurementSystem: 'metric' | 'imperial';
  // Add any other user preferences here
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setLanguage: (language: LanguageCode) => void;
  setUILanguage: (language: LanguageCode) => void;
  setMeasurementSystem: (system: 'metric' | 'imperial') => void;
  // Add setters for any other user preferences here
}

// Default preferences
const defaultPreferences: UserPreferences = {
  language: 'en',
  uiLanguage: 'en',
  measurementSystem: 'metric',
};

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPreferences,
  setLanguage: () => {},
  setUILanguage: () => {},
  setMeasurementSystem: () => {},
});

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Try to load preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        return JSON.parse(savedPreferences);
      } catch (e) {
        console.error('Failed to parse saved preferences', e);
      }
    }
    return defaultPreferences;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const setLanguage = (language: LanguageCode) => {
    setPreferences(prev => ({ ...prev, language }));
  };

  const setUILanguage = (uiLanguage: LanguageCode) => {
    setPreferences(prev => ({ ...prev, uiLanguage }));
  };

  const setMeasurementSystem = (measurementSystem: 'metric' | 'imperial') => {
    setPreferences(prev => ({ ...prev, measurementSystem }));
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, setLanguage, setUILanguage, setMeasurementSystem }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => useContext(UserPreferencesContext);
