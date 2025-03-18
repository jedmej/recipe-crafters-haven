import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserPreferencesProvider } from '@/hooks/use-user-preferences';
import { SupabaseProvider } from '@/lib/supabase/supabase-provider';
import { useLanguageSync } from '@/hooks/use-language-sync';
import '@/i18n'; // Import i18next configuration
import Routes from '@/routes';

// Create a client
const queryClient = new QueryClient();

function AppContent() {
  useLanguageSync(); // Use the language sync hook
  return <Routes />;
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UserPreferencesProvider>
            <SupabaseProvider>
              <AppContent />
              <Toaster />
            </SupabaseProvider>
          </UserPreferencesProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
