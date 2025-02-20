import type { AppProps } from 'next/app';
import { SupabaseProvider } from '@/lib/supabase/supabase-provider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <Component {...pageProps} />
      <Toaster />
    </SupabaseProvider>
  );
} 