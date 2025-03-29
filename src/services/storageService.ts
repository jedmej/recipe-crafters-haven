import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./baseService";

export class StorageService extends BaseService {
  /**
   * Upload a file to Supabase storage
   * @param file The file to upload
   * @param bucket The storage bucket name
   * @param path The path within the bucket
   */
  async uploadFile(file: File, bucket: string, path: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${path}${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return this.handleError(uploadError, "Failed to upload file");
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { publicUrl, data };
    } catch (error) {
      return this.handleError(error, "Failed to upload file");
    }
  }

  /**
   * Get the public URL for a file
   * @param bucket The storage bucket name
   * @param path The path to the file within the bucket
   */
  getPublicUrl(bucket: string, path: string) {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return publicUrl;
  }

  /**
   * Delete a file from storage
   * @param bucket The storage bucket name
   * @param path The path to the file within the bucket
   */
  async deleteFile(bucket: string, path: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
        
      if (error) {
        return this.handleError(error, "Failed to delete file");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to delete file");
    }
  }
} 