
import { useState, useContext, createContext, useCallback, ReactNode } from 'react';
import { MeasurementSystem } from '@/features/recipes/types';
import { supabase } from '@/integrations/supabase/client';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'ru' | 'uk';

export interface UserPreferences {
  full_name: string;
  username: string;
  avatar_url: string;
  measurementSystem: MeasurementSystem;
  language: LanguageCode;
}

const defaultPreferences: UserPreferences = {
  full_name: '',
  username: '',
  avatar_url: '',
  measurementSystem: 'metric',
  language: 'en'
};

export interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  error: Error | null;
  fetchUserPreferences: () => Promise<void>;
  updatePreferences?: (preferences: Partial<UserPreferences>) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPreferences,
  isLoading: false,
  error: null,
  fetchUserPreferences: async () => {}
});

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          full_name: data.full_name || '',
          username: data.username || '',
          avatar_url: data.avatar_url || '',
          measurementSystem: (data.measurement_system || 'metric') as MeasurementSystem,
          language: (data.recipe_language || 'en') as LanguageCode
        });
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated user');
      }

      // Map from our preference model to the database model
      const dbPreferences: Record<string, any> = {};
      if (newPreferences.language !== undefined) {
        dbPreferences.recipe_language = newPreferences.language;
      }
      if (newPreferences.measurementSystem !== undefined) {
        dbPreferences.measurement_system = newPreferences.measurementSystem;
      }
      if (newPreferences.full_name !== undefined) {
        dbPreferences.full_name = newPreferences.full_name;
      }
      if (newPreferences.username !== undefined) {
        dbPreferences.username = newPreferences.username;
      }
      if (newPreferences.avatar_url !== undefined) {
        dbPreferences.avatar_url = newPreferences.avatar_url;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbPreferences)
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      setPreferences(prev => ({
        ...prev,
        ...newPreferences
      }));
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create value object for the context
  const contextValue: UserPreferencesContextType = {
    preferences,
    isLoading,
    error,
    fetchUserPreferences,
    updatePreferences
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => useContext(UserPreferencesContext);
