import { Button } from "@/components/ui/button";
import { Search, Bot, Sparkles, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NewRecipeActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "AI Search",
      mobileLabel: "Search",
      icon: Search,
      path: "/recipes/ai-search"
    },
    {
      label: "Import from URL",
      mobileLabel: "Import",
      icon: Bot,
      path: "/recipes/import-ai"
    },
    {
      label: "Inspire Me",
      icon: Sparkles,
      path: "/recipes/inspire"
    },
    {
      label: "Add Recipe",
      icon: Plus,
      path: "/recipes/new",
      primary: true
    }
  ];

  return (
    <div className="mb-16 p-6 sm:p-8 bg-gray-50 rounded-3xl shadow-sm">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 sm:mb-8">New Recipe</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl">
        {actions.map((action) => (
          <Button 
            key={action.path}
            onClick={() => navigate(action.path)} 
            variant={action.primary ? "default" : "outline"} 
            className={`gap-2 h-14 px-4 sm:px-6 text-base rounded-xl ${action.primary ? 'bg-gray-900 hover:bg-gray-800' : ''}`}
          >
            <action.icon className="h-5 w-5" />
            <span className={action.mobileLabel ? "hidden sm:inline" : ""}>{action.label}</span>
            {action.mobileLabel && <span className="sm:hidden">{action.mobileLabel}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
} 