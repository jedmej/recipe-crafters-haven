import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

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
  theme: 'system',
  unitSystem: 'metric',
  autoGenerateImages: true,
};

// Create a context for user preferences
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load preferences from localStorage if available
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        return { ...defaultPreferences, ...JSON.parse(savedPreferences) };
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  // Update preferences function
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    // Set document language attribute based on language preference
    document.documentElement.lang = preferences.language;
    
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
  }, [preferences.language, preferences.theme]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences }}>
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