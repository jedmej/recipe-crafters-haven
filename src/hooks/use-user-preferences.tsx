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

// Storage key for localStorage
const STORAGE_KEY = 'recipe_crafters_user_preferences';

// Create a context for user preferences
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  loading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Helper function to check if language code is valid
const isValidLanguage = (lang: string): lang is LanguageCode => {
  return ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'].includes(lang);
};

// Provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  // Initialize with localStorage values if available, otherwise use defaults
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const savedPrefs = localStorage.getItem(STORAGE_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error);
    }
    return defaultPreferences;
  });
  
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
          setPreferences(prev => {
            const newPrefs = { ...prev, ...updatedPreferences };
            // Save to localStorage
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
            } catch (e) {
              console.error('Error saving preferences to localStorage:', e);
            }
            return newPrefs;
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreferences();
  }, []);

  // Update preferences function
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving preferences to localStorage:', e);
      }
      
      return updated;
    });

    // Sync with Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updateData: Record<string, any> = {};
        
        // Map preferences to profile fields
        if (newPreferences.language) {
          updateData.language = newPreferences.language;
        }
        
        if (newPreferences.unitSystem) {
          updateData.measurement_system = newPreferences.unitSystem;
        }
        
        // Only update if we have data to update
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);
            
          if (error) {
            console.error('Error updating profile preferences:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing preferences with Supabase:', error);
    }
  };

  // Apply preferences globally
  useEffect(() => {
    // Apply language preference
    document.documentElement.lang = preferences.language;
    
    // Always use light theme for now
    document.documentElement.classList.remove('dark');
    
    // More effects can be added here
  }, [preferences]);

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