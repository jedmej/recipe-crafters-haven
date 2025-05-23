
import { useState, useContext, createContext, useCallback, ReactNode } from 'react';
import { MeasurementSystem } from '@/features/recipes/types';
import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  full_name: string;
  username: string;
  avatar_url: string;
  measurementSystem: MeasurementSystem;
  language: string;
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
          language: data.recipe_language || 'en'
        });
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <UserPreferencesContext.Provider 
      value={{ 
        preferences, 
        isLoading, 
        error,
        fetchUserPreferences
      }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => useContext(UserPreferencesContext);
