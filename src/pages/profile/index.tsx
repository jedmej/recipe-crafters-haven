import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MeasurementSystem } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserPreferences } from '@/hooks/use-user-preferences';

const LANGUAGE_OPTIONS = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  pl: 'Polish'
} as const;

type LanguageCode = keyof typeof LANGUAGE_OPTIONS;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    measurement_system: MeasurementSystem;
    language: LanguageCode;
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { updatePreferences } = useUserPreferences();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');
        setUser(user);

        // Get user's profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          username: profile.username,
          measurement_system: profile.measurement_system,
          language: profile.language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      // Update in-memory user preferences to match profile settings
      updatePreferences({
        language: profile.language,
        unitSystem: profile.measurement_system === 'metric' ? 'metric' : 'imperial',
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to update profile";
      if (error?.message?.includes('schema cache')) {
        errorMessage = "Database schema sync error. Please try refreshing the page.";
      } else if (error?.message?.includes('duplicate key')) {
        errorMessage = "Username already taken. Please choose a different one.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your profile information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                >
                  Change Avatar
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Measurement System
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Choose your preferred units for recipes
                    </p>
                    <Select
                      value={profile?.measurement_system}
                      onValueChange={(value: MeasurementSystem) => 
                        setProfile(prev => prev ? { ...prev, measurement_system: value } : null)
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select measurement system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric</SelectItem>
                        <SelectItem value="imperial">Imperial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Language
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Choose your preferred language for recipe generation
                    </p>
                    <Select
                      value={profile?.language}
                      onValueChange={(value: LanguageCode) => 
                        setProfile(prev => prev ? { ...prev, language: value } : null)
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      toast({
                        title: "Success",
                        description: "You have been logged out successfully",
                      });
                    } catch (error) {
                      console.error('Error signing out:', error);
                      toast({
                        title: "Error",
                        description: "Failed to sign out",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 