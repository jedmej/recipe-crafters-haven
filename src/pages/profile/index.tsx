"use client"

import { useState, useEffect } from "react";
import { ArrowLeft, LogOut, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { profileService, authService, avatarService } from "@/services";
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { MeasurementSystem } from "@/lib/types";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    measurement_system: MeasurementSystem;
    ui_language: LanguageCode;
    recipe_language: LanguageCode;
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
        // Get current user and profile using profileService
        const { user, profile } = await profileService.getUserAndProfile();
        
        setUser(user);
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
      const updatedProfile = await profileService.updateProfile({
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: avatarUrl,
        measurement_system: profile.measurement_system,
        ui_language: profile.ui_language,
        recipe_language: profile.recipe_language
      });

      // Update in-memory user preferences to match profile settings
      updatePreferences({
        uiLanguage: updatedProfile.ui_language,
        recipeLanguage: updatedProfile.recipe_language,
        unitSystem: updatedProfile.measurement_system === 'metric' ? 'metric' : 'imperial',
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
      // Update the user's avatar using avatarService
      const updatedProfile = await avatarService.updateUserAvatar(user.id, url);
      
      // Update the local profile state
      setProfile(updatedProfile);
      
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

  const handleGenerateAvatar = async (attributes: any) => {
    setIsGenerating(true);
    try {
      // Generate avatar using avatarService
      const generatedUrl = await avatarService.generateAvatar(
        attributes, 
        profile?.username || profile?.full_name || user?.email,
        (message) => {
          toast({
            title: "Generating Avatar",
            description: message,
            duration: 2000,
          });
        }
      );
      
      if (generatedUrl) {
        setAvatarUrl(generatedUrl);
        await handleSaveAvatar(generatedUrl);
        
        toast({
          title: "Success",
          description: "Character avatar generated successfully",
        });
      }
      
      setIsAvatarDialogOpen(false);
    } catch (error: any) {
      console.error('Error generating avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate character avatar. Please try again.",
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
          aria-label={t('navigation.backToRecipes')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('navigation.backToRecipes')}</span>
        </Button>

        <Card className="border-0 bg-[#F5F5F5] rounded-[48px] overflow-hidden shadow-none">
          <CardHeader className="pb-6 border-b border-gray-100 p-6 sm:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold">{t('title')}</CardTitle>
            <CardDescription className="mt-2 text-base">
              {t('description')}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Avatar section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-24 w-24 border-2 border-white">
                <AvatarImage src={profile?.avatar_url || undefined} alt={t('fields.avatar.alt')} />
                <AvatarFallback>
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-full px-6 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50 shadow-none"
                onClick={() => setIsAvatarDialogOpen(true)}
              >
                {t('fields.avatar.change')}
              </Button>
            </div>

            {/* Form fields */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('fields.email.label')}
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
                  {t('fields.username.label')}
                </label>
                <Input
                  id="username"
                  value={profile?.username || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                  className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  placeholder={t('fields.username.placeholder')}
                  aria-describedby="username-description"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  {t('fields.fullName.label')}
                </label>
                <Input
                  id="fullName"
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  placeholder={t('fields.fullName.placeholder')}
                  aria-describedby="fullname-description"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ui-language" className="block text-sm font-medium text-gray-700">
                  {t('fields.uiLanguage.label')}
                </label>
                <Select 
                  value={profile?.ui_language}
                  onValueChange={(value: LanguageCode) => 
                    setProfile(prev => prev ? { ...prev, ui_language: value } : null)
                  }
                >
                  <SelectTrigger
                    id="ui-language"
                    className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  >
                    <SelectValue placeholder={t('fields.uiLanguage.placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        <LanguageFlag languageCode={code} languageName={name} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{t('fields.uiLanguage.description')}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="recipe-language" className="block text-sm font-medium text-gray-700">
                  {t('fields.recipeLanguage.label')}
                </label>
                <Select 
                  value={profile?.recipe_language}
                  onValueChange={(value: LanguageCode) => 
                    setProfile(prev => prev ? { ...prev, recipe_language: value } : null)
                  }
                >
                  <SelectTrigger
                    id="recipe-language"
                    className="w-full rounded-xl border-gray-200 focus:border-gray-300 shadow-none"
                  >
                    <SelectValue placeholder={t('fields.recipeLanguage.placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        <LanguageFlag languageCode={code} languageName={name} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{t('fields.recipeLanguage.description')}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="measurement" className="block text-sm font-medium text-gray-700">
                  {t('fields.measurementSystem.label')}
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
                    <SelectValue placeholder={t('fields.measurementSystem.placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="metric">{t('fields.measurementSystem.options.metric')}</SelectItem>
                    <SelectItem value="imperial">{t('fields.measurementSystem.options.imperial')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{t('fields.measurementSystem.description')}</p>
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
                  {t('actions.saving')}
                </>
              ) : (
                t('actions.saveChanges')
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto text-[#1a1d2b] border-gray-200 hover:bg-gray-50 rounded-[500px] px-8 py-3 font-medium shadow-none text-base"
              onClick={async () => {
                try {
                  await authService.signOut();
                  toast({
                    title: t('messages.signOut.success.title'),
                    description: t('messages.signOut.success.description'),
                  });
                } catch (error) {
                  console.error('Error signing out:', error);
                  toast({
                    title: t('messages.signOut.error.title'),
                    description: t('messages.signOut.error.description'),
                    variant: "destructive",
                  });
                }
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {t('actions.signOut')}
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