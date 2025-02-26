import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Navigation = () => {
  const location = useLocation();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const links = [
    { href: "/recipes", label: "Recipes" },
    { href: "/grocery-lists", label: "Grocery Lists" },
  ];

  // Add a refresh trigger state to force profile refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Set up an interval to periodically check for profile updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        // Get user's profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(profile);
      } catch (error) {
        console.error('Error fetching profile for navigation:', error);
      }
    };

    fetchUserAndProfile();
  }, [refreshTrigger, location.pathname]); // Re-fetch when location changes or refresh is triggered

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name[0].toUpperCase();
    } else if (profile?.username) {
      return profile.username[0].toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    } else if (profile?.full_name) {
      // Get first name only
      return profile.full_name.split(' ')[0];
    } else if (user?.email) {
      // Get part before @ in email
      return user.email.split('@')[0];
    }
    return "there";
  };

  return (
    <>
      {/* Mobile Profile Icon */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Link 
          to="/profile"
          className={cn(
            "flex items-center justify-center transition-all duration-200",
            location.pathname.startsWith("/profile")
              ? "opacity-100"
              : "opacity-90 hover:opacity-100"
          )}
        >
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className={cn(
              location.pathname.startsWith("/profile")
                ? "bg-primary/10 text-primary"
                : "bg-background/80 text-muted-foreground"
            )}>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="nav-modern fixed w-full z-50 bg-background/80 backdrop-blur-md border-b hidden md:block">
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
            
            <div className="flex items-center gap-4">
              <Link 
                to="/profile"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg",
                  location.pathname.startsWith("/profile")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span>{getDisplayName()}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation; 