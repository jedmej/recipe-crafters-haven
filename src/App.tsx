
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import AuthPage from "./pages/auth";
import NotFound from "./pages/NotFound";
import RecipesPage from "./pages/recipes";
import RecipeDetailPage from "./pages/recipes/[id]";
import NewRecipePage from "./pages/recipes/new";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Index />
              </AuthGuard>
            }
          />
          <Route
            path="/recipes"
            element={
              <AuthGuard>
                <RecipesPage />
              </AuthGuard>
            }
          />
          <Route
            path="/recipes/new"
            element={
              <AuthGuard>
                <NewRecipePage />
              </AuthGuard>
            }
          />
          <Route
            path="/recipes/:id"
            element={
              <AuthGuard>
                <RecipeDetailPage />
              </AuthGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
