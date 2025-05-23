
import { useToast } from "@/hooks/use-toast";

// Utility types for event handlers
export type AsyncHandler<T extends unknown[]> = (...args: T) => Promise<void>;
export type SyncHandler<T extends unknown[]> = (...args: T) => void;

// Error handling utility
export interface ErrorHandlerOptions {
  toast: ReturnType<typeof useToast>['toast'];
  title?: string;
  description?: string;
  logError?: boolean;
}

export const handleError = (error: unknown, options: ErrorHandlerOptions): Error => {
  const { toast, title = "Error", description = "An unexpected error occurred. Please try again.", logError = true } = options;
  
  if (logError) {
    console.error(error);
  }
  
  toast({
    variant: "destructive",
    title,
    description,
  });
  
  return error instanceof Error ? error : new Error(String(error));
};

// Image validation utilities
export interface ValidateImageUrlOptions {
  toast: ReturnType<typeof useToast>['toast'];
}

export const validateImageUrl = async (url: string, options: ValidateImageUrlOptions): Promise<boolean> => {
  const { toast } = options;
  
  try {
    // Check if URL is valid
    new URL(url);
    
    // Check if image exists and can be loaded
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "Invalid Image URL",
        description: "The URL does not point to a valid image. Please check and try again.",
      });
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid Image URL",
        description: "The URL does not point to an image. Please provide a direct link to an image file.",
      });
      return false;
    }
    
    return true;
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Invalid URL",
      description: "Please enter a valid URL.",
    });
    return false;
  }
};

export const createAsyncHandler = <T extends unknown[]>(
  handler: AsyncHandler<T>,
  errorOptions: ErrorHandlerOptions
): AsyncHandler<T> => {
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (error) {
      handleError(error, errorOptions);
    }
  };
};
