
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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="flex justify-end mb-8">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Recipe Management & Meal Planning</h1>
          <p className="text-xl text-gray-600">Start organizing your recipes today!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Button
            onClick={() => navigate("/recipes")}
            size="lg"
            className="h-32 text-lg"
          >
            <Book className="mr-2 h-6 w-6" />
            My Recipes
          </Button>
          <Button
            onClick={() => navigate("/grocery-lists")}
            size="lg"
            className="h-32 text-lg"
            variant="outline"
          >
            <List className="mr-2 h-6 w-6" />
            Grocery Lists
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Index;
