import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import * as fal from '@fal-ai/serverless-client';
import { BaseService } from './baseService';

// Configure the fal.ai client
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

// Constants for image generation
const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds

// Helper function for adding delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Types
export interface CharacterAttributes {
  gender?: string;
  hairColor?: string;
  eyeColor?: string;
  style?: string;
  accessories?: string;
  additionalDetails?: string;
}

class AvatarService extends BaseService {
  /**
   * Uploads an avatar image to the storage bucket
   */
  async uploadAvatarImage(file: File, fileName: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('avatar-images')
        .upload(`${Date.now()}-${fileName}`, file);

      if (error) {
        throw error;
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('avatar-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar image:', error);
      throw new Error('Failed to upload avatar image');
    }
  }

  /**
   * Generates a prompt for avatar image generation based on character attributes
   */
  generatePrompt(attributes: CharacterAttributes, userName?: string): string {
    const { gender, hairColor, eyeColor, style, accessories, additionalDetails } = attributes;
    
    let prompt = `professional profile avatar: ${userName || 'person'}`;
    
    if (gender) prompt += `, ${gender.toLowerCase()}`;
    if (hairColor) prompt += `, ${hairColor.toLowerCase()} hair`;
    if (eyeColor) prompt += `, ${eyeColor.toLowerCase()} eyes`;
    if (accessories) prompt += `, wearing ${accessories}`;
    if (additionalDetails) prompt += `, ${additionalDetails}`;
    
    prompt += `, stylized character portrait, friendly expression, clean background, high quality, detailed`;
    
    if (style) prompt += `, ${style.toLowerCase()} style`;
    
    // Add instructions to ensure no text in the image
    prompt += `, no text, no words, no writing, no labels, no watermarks`;
    
    return prompt;
  }

  /**
   * Generates an avatar using AI image generation
   */
  async generateAvatar(
    attributes: CharacterAttributes, 
    userName?: string, 
    onProgressUpdate?: (message: string) => void
  ): Promise<string | null> {
    const prompt = this.generatePrompt(attributes, userName);
    let lastError: any = null;

    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            console.log(`Avatar generation attempt ${attempt} - Waiting ${delay/1000}s before retry...`);
            await sleep(delay);
          }

          console.log(`Starting avatar generation attempt ${attempt} with prompt:`, prompt);
          
          const result = await fal.subscribe('fal-ai/recraft-20b', {
            input: {
              prompt: prompt,
              image_size: "square_hd",
              style: "realistic_image",
              negative_prompt: "text, watermark, label, logo, title, words, letters, numbers, signature, date, writing, typography, font, caption, inscription, handwriting, calligraphy, script, alphabet, character, symbol, glyph"
            },
            pollInterval: 1000,
            logs: true,
            onQueueUpdate: (update) => {
              if (update.status === "IN_PROGRESS") {
                const latestMessage = update.logs[update.logs.length - 1]?.message;
                if (latestMessage && onProgressUpdate) {
                  console.log('Avatar generation progress:', latestMessage);
                  onProgressUpdate(latestMessage);
                }
              }
            }
          });

          console.log('Avatar generation result:', result);

          // Check if result exists and has the expected structure
          if (!result) {
            throw new Error('No response from image generation service');
          }

          // Access the image URL from the correct path in the response
          const imageUrl = result?.images?.[0]?.url;
          if (!imageUrl) {
            throw new Error('No image URL in response');
          }

          return imageUrl;
        } catch (error) {
          console.error(`Avatar generation attempt ${attempt} failed:`, error);
          lastError = error;
          
          if (attempt === MAX_RETRIES) {
            throw new Error(lastError.message || 'Failed to generate avatar. Please try again.');
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Avatar generation failed:', error);
      throw error;
    }
  }

  /**
   * Update user's avatar in the profile
   */
  async updateUserAvatar(userId: string, avatarUrl: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw new Error('Failed to update avatar');
    }
  }

  /**
   * Delete avatar from storage
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extract file path from the URL
      const urlParts = avatarUrl.split('/');
      const filePath = urlParts[urlParts.length - 1];
      
      const { error } = await supabase.storage
        .from('avatar-images')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw new Error('Failed to delete avatar');
    }
  }
}

export const avatarService = new AvatarService(); 