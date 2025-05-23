
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

export interface ValidateImageUrlOptions {
  toast: ReturnType<typeof useToast>['toast'];
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

// Added validateImageUrl function that returns a Promise
export const validateImageUrl = async (url: string, options: ValidateImageUrlOptions): Promise<boolean> => {
  if (!url) {
    options.toast({
      variant: "destructive",
      title: "Invalid URL",
      description: "Please provide a valid image URL.",
    });
    return false;
  }
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      options.toast({
        variant: "destructive",
        title: "Invalid Image URL",
        description: "The provided URL does not point to a valid image.",
      });
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      options.toast({
        variant: "destructive",
        title: "Invalid Image",
        description: "The provided URL does not point to a valid image.",
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating image URL:', error);
    options.toast({
      variant: "destructive",
      title: "Error Validating URL",
      description: "Failed to validate the image URL. Please try again.",
    });
    return false;
  }
};
