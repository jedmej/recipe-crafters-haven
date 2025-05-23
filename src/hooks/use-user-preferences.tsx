
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MeasurementSystem } from '@/features/recipes/types';
import { supabase } from '@/integrations/supabase/client';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'ru' | 'uk';

export interface UserPreferences {
  language: LanguageCode;
  uiLanguage: LanguageCode;
  measurementSystem: MeasurementSystem;
  full_name?: string;
  username?: string;
  avatar_url?: string;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setLanguage: (language: LanguageCode) => void;
  setUILanguage: (language: LanguageCode) => void;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  fetchUserPreferences: () => Promise<void>;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  language: 'en',
  uiLanguage: 'en',
  measurementSystem: 'metric',
  full_name: '',
  username: '',
  avatar_url: '',
};

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPreferences,
  setLanguage: () => {},
  setUILanguage: () => {},
  setMeasurementSystem: () => {},
  updatePreferences: async () => {},
  isLoading: false,
  error: null,
  fetchUserPreferences: async () => {},
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  const setMeasurementSystem = (measurementSystem: MeasurementSystem) => {
    setPreferences(prev => ({ ...prev, measurementSystem }));
  };
  
  const fetchUserPreferences = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated user');
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (dbError) throw dbError;

      if (data) {
        setPreferences(prev => ({
          ...prev,
          full_name: data.full_name || '',
          username: data.username || '',
          avatar_url: data.avatar_url || '',
          measurementSystem: (data.measurement_system || 'metric') as MeasurementSystem,
          language: (data.recipe_language || 'en') as LanguageCode,
          uiLanguage: (data.ui_language || 'en') as LanguageCode,
        }));
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      setIsLoading(true);
      
      // First update local state
      setPreferences(prev => ({ ...prev, ...prefs }));
      
      // Then sync with database if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const dbPrefs: Record<string, any> = {};
        
        if (prefs.language) dbPrefs.recipe_language = prefs.language;
        if (prefs.uiLanguage) dbPrefs.ui_language = prefs.uiLanguage;
        if (prefs.measurementSystem) dbPrefs.measurement_system = prefs.measurementSystem;
        if (prefs.full_name) dbPrefs.full_name = prefs.full_name;
        if (prefs.username) dbPrefs.username = prefs.username;
        if (prefs.avatar_url) dbPrefs.avatar_url = prefs.avatar_url;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(dbPrefs)
          .eq('id', session.user.id);
        
        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err : new Error('Failed to update preferences'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserPreferencesContext.Provider 
      value={{ 
        preferences, 
        setLanguage, 
        setUILanguage, 
        setMeasurementSystem,
        updatePreferences,
        isLoading,
        error,
        fetchUserPreferences
      }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => useContext(UserPreferencesContext);
