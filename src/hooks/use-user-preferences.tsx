import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define language codes type
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko';

// Define the structure of user preferences
interface UserPreferences {
  language: LanguageCode;
  theme: 'light' | 'dark' | 'system';
  unitSystem: 'metric' | 'imperial';
  autoGenerateImages: boolean;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  language: 'en',
  theme: 'light',
  unitSystem: 'metric',
  autoGenerateImages: true,
};

// Create a context for user preferences
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  loading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  // Fetch user preferences from Supabase on initial load
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('language, measurement_system')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // Map profile values to user preferences
          const updatedPreferences: Partial<UserPreferences> = {};

          // Map language
          if (profile.language && isValidLanguage(profile.language)) {
            updatedPreferences.language = profile.language as LanguageCode;
          }

          // Map measurement system
          if (profile.measurement_system) {
            updatedPreferences.unitSystem = profile.measurement_system as 'metric' | 'imperial';
          }

          // Update preferences with values from profile
          setPreferences(prev => ({
            ...prev,
            ...updatedPreferences
          }));
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreferences();
  }, []);

  // Helper function to check if language code is valid
  const isValidLanguage = (lang: string): lang is LanguageCode => {
    return ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'].includes(lang);
  };

  // Update preferences function
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      return updated;
    });
  };

  useEffect(() => {
    // Set document language attribute based on language preference
    document.documentElement.lang = preferences.language;
    
    // Always use light theme
    document.documentElement.classList.remove('dark');
    
    // Comment out the theme-switching logic for now
    /*
    // Apply theme preference
    const applyTheme = () => {
      const theme = preferences.theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : preferences.theme;
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    
    // Listen for system theme changes if set to 'system'
    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    */
  }, [preferences.language]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// Hook to use user preferences
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
} 