"use client"

import { useState, useEffect } from "react";
import { ArrowLeft, LogOut, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { MeasurementSystem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterAttributesInput, CharacterAttributes } from "@/components/profile/CharacterAttributesInput";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { LanguageFlag } from "@/components/profile/LanguageFlag";

const LANGUAGE_OPTIONS = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  pl: 'Polish',
  ru: 'Russian',
  uk: 'Ukrainian'
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
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { updatePreferences } = useUserPreferences();
  const [characterAttributes, setCharacterAttributes] = useState<CharacterAttributes>({});
  const [isGenerating, setIsGenerating] = useState(false);

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
        setAvatarUrl(profile.avatar_url);
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
          avatar_url: avatarUrl,
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

  const handleAvatarSelected = (url: string | null, isGenerated = false) => {
    setAvatarUrl(url);
    if (url && !isGenerated) {
      setIsAvatarDialogOpen(false);
    }
  };

  const handleSaveAvatar = async (url: string) => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: url,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update the local profile state
      setProfile({
        ...profile,
        avatar_url: url,
      });
      
      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAvatar = async (attributes: CharacterAttributes) => {
    setIsGenerating(true);
    try {
      // Call your character generation API here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Once you have the generated URL, update it
      // const generatedUrl = await generateCharacterAvatar(attributes);
      // setAvatarUrl(generatedUrl);
      // handleSaveAvatar(generatedUrl);
      
      toast({
        title: "Success",
        description: "Character avatar generated successfully",
      });
      setIsAvatarDialogOpen(false);
    } catch (error) {
      console.error('Error generating avatar:', error);
      toast({
        title: "Error",
        description: "Failed to generate character avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-6 pl-0 text-gray-600 hover:text-gray-900 hover:bg-transparent"
          aria-label="Back to recipes"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back to recipes</span>
        </Button>

        <Card className="border-0 bg-white rounded-[48px] overflow-hidden shadow-none">
          <CardHeader className="pb-6 border-b border-gray-100 p-6 sm:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Profile Settings</CardTitle>
            <CardDescription className="mt-2 text-base">
              Manage your profile information and preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Avatar section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-24 w-24 border-2 border-white">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile picture" />
                <AvatarFallback>
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-full px-6 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50 shadow-none"
                onClick={() => setIsAvatarDialogOpen(true)}
              >
                Change Avatar
              </Button>
            </div>

            {/* Form fields */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  aria-describedby="email-description"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  value={profile?.username || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                  className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  aria-describedby="username-description"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  placeholder="Enter your full name"
                  aria-describedby="fullname-description"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="measurement" className="block text-sm font-medium text-gray-700">
                  Measurement System
                </label>
                <Select 
                  value={profile?.measurement_system} 
                  onValueChange={(value: MeasurementSystem) => 
                    setProfile(prev => prev ? { ...prev, measurement_system: value } : null)
                  }
                >
                  <SelectTrigger
                    id="measurement"
                    className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  >
                    <SelectValue placeholder="Select measurement system" />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Choose your preferred units for recipes.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <Select 
                  value={profile?.language}
                  onValueChange={(value: LanguageCode) => 
                    setProfile(prev => prev ? { ...prev, language: value } : null)
                  }
                >
                  <SelectTrigger
                    id="language"
                    className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  >
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        <LanguageFlag languageCode={code} languageName={name} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Choose your preferred language for recipe generation.</p>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-100 p-6 sm:p-8">
            <Button 
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#FA8922] hover:bg-[#e87d1f] text-white rounded-[500px] px-8 py-3 font-medium shadow-none text-base"
            >
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
              variant="outline"
              className="w-full sm:w-auto text-[#1a1d2b] border-gray-200 hover:bg-gray-50 rounded-[500px] px-8 py-3 font-medium shadow-none text-base"
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
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>

        {/* Avatar Change Dialog */}
        <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 bg-white rounded-[32px] border-0">
            <DialogHeader className="p-6 sm:p-8 border-b border-gray-100">
              <DialogTitle className="text-2xl font-bold">Change Avatar</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Upload a new profile picture or generate a unique character
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="upload" className="p-6 sm:p-8">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="upload"
                  className="data-[state=active]:bg-[#FA8922] data-[state=active]:text-white"
                >
                  Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="generate"
                  className="data-[state=active]:bg-[#FA8922] data-[state=active]:text-white"
                >
                  Generate
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-0">
                <AvatarUploader 
                  onImageSelected={(url) => handleAvatarSelected(url)}
                  initialImage={profile?.avatar_url || undefined}
                />
              </TabsContent>
              
              <TabsContent value="generate" className="mt-0">
                <CharacterAttributesInput
                  initialAttributes={characterAttributes}
                  onAttributesChange={setCharacterAttributes}
                  onImageSelected={(url) => handleAvatarSelected(url, true)}
                  onGenerate={handleGenerateAvatar}
                  userName={profile?.full_name || profile?.username || user?.email}
                  initialImage={profile?.avatar_url || undefined}
                  isGenerating={isGenerating}
                />
              </TabsContent>

              <footer className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full px-6 py-2 text-sm font-medium border-gray-200 hover:bg-gray-50 shadow-none"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="button"
                  className="rounded-full px-6 py-2 text-sm font-medium bg-[#FA8922] hover:bg-[#e87d1f] text-white shadow-none"
                  onClick={() => {
                    handleSaveAvatar(avatarUrl || '');
                    setIsAvatarDialogOpen(false);
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Avatar'
                  )}
                </Button>
              </footer>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
} 