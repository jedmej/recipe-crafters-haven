import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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
    <nav className="nav-modern fixed w-full z-50">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-gradient">
              Recipe Crafters Haven
            </Link>
            <div className="flex gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-all duration-200 hover:text-primary relative group",
                    location.pathname.startsWith(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full",
                    location.pathname.startsWith(link.href) && "w-full"
                  )} />
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleSignOut} className="hover:shadow-sm transition-all">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            {/* Sphere accent */}
            <div className="sphere-accent opacity-20 top-[-150px] right-[-150px]" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 