import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Book, List, LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-end mb-8">
          <Button variant="outline" onClick={handleSignOut} className="hover:shadow-sm transition-all">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Recipe Management & Meal Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Organize your recipes and plan your meals with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Button
            onClick={() => navigate("/recipes")}
            size="lg"
            className="h-40 text-lg bg-white text-gray-900 border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <Book className="mr-3 h-6 w-6" />
            My Recipes
          </Button>
          <Button
            onClick={() => navigate("/grocery-lists")}
            size="lg"
            className="h-40 text-lg bg-white text-gray-900 border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <List className="mr-3 h-6 w-6" />
            Grocery Lists
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Index;
