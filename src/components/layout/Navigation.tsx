import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const location = useLocation();
  
  const links = [
    { href: "/recipes", label: "Recipes" },
    { href: "/grocery-lists", label: "Grocery Lists" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="nav-modern fixed w-full z-50 hidden md:block bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-gradient hover:opacity-90 transition-opacity">
              Recipe Crafters Haven
            </Link>
            <div className="flex gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-all duration-200",
                    location.pathname.startsWith(link.href)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {link.icon}
                  {link.label}
                  <span className={cn(
                    "h-0.5 bg-primary transition-all duration-200",
                    location.pathname.startsWith(link.href)
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  )} />
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              to="/profile"
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-all duration-200",
                location.pathname.startsWith("/profile")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 