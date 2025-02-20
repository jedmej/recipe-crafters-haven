import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Navigation from "@/components/layout/Navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { SphereBackgroundGroup } from "@/components/ui/sphere-background";
import { SupabaseProvider } from '@/lib/supabase/supabase-provider';

// Page imports
import AuthPage from "./pages/auth";
import NotFound from "./pages/NotFound";
import RecipesPage from "./pages/recipes";
import RecipeDetailPage from "./pages/recipes/[id]";
import EditRecipePage from "./pages/recipes/edit";
import NewRecipePage from "./pages/recipes/new";
import ImportRecipeAIPage from "./pages/recipes/import-ai";
import AIRecipeSearchPage from "./pages/recipes/ai-search";
import GroceryListsPage from "./pages/grocery-lists";
import GroceryListDetailPage from "./pages/grocery-lists/[id]";
import NewGroceryListPage from "./pages/grocery-lists/new";
import GenerateImagePage from "./pages/generate-image";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-white relative overflow-hidden">
      <Navigation />
      <main className="flex-1 pt-4 md:pt-20 pb-20 md:pb-4 px-4 md:px-6 relative">
        <div className="max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
      <SphereBackgroundGroup />
    </div>
  </AuthGuard>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupabaseProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/"
                element={
                  <AuthenticatedLayout>
                    <RecipesPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/recipes"
                element={
                  <AuthenticatedLayout>
                    <RecipesPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/recipes/new"
                element={
                  <AuthenticatedLayout>
                    <NewRecipePage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/recipes/import-ai"
                element={
                  <AuthenticatedLayout>
                    <ImportRecipeAIPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/recipes/ai-search"
                element={
                  <AuthenticatedLayout>
                    <AIRecipeSearchPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/recipes/:id"
                element={
                  <AuthenticatedLayout>
                    <RecipeDetailPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/recipes/:id/edit"
                element={
                  <AuthenticatedLayout>
                    <EditRecipePage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/grocery-lists"
                element={
                  <AuthenticatedLayout>
                    <GroceryListsPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/grocery-lists/new"
                element={
                  <AuthenticatedLayout>
                    <NewGroceryListPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/grocery-lists/:id"
                element={
                  <AuthenticatedLayout>
                    <GroceryListDetailPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/generate-image"
                element={
                  <AuthenticatedLayout>
                    <GenerateImagePage />
                  </AuthenticatedLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </BrowserRouter>
      </SupabaseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
