import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Trash, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";

export interface CharacterAttributes {
  gender?: string;
  hairColor?: string;
  eyeColor?: string;
  style?: string;
  accessories?: string;
  additionalDetails?: string;
}

interface CharacterAttributesInputProps {
  initialAttributes?: CharacterAttributes;
  onAttributesChange: (attributes: CharacterAttributes) => void;
  onImageSelected: (imageUrl: string) => void;
  userName?: string;
  initialImage?: string;
}

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Androgynous"];
const HAIR_COLOR_OPTIONS = ["Black", "Brown", "Blonde", "Red", "White", "Gray", "Blue", "Green", "Purple", "Pink"];
const EYE_COLOR_OPTIONS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Violet"];
const STYLE_OPTIONS = ["Realistic", "Cartoon", "Anime", "Pixel Art", "Watercolor", "Oil Painting", "3D Render"];

export function CharacterAttributesInput({ 
  initialAttributes = {}, 
  onAttributesChange,
  onImageSelected,
  userName,
  initialImage
}: CharacterAttributesInputProps) {
  const [attributes, setAttributes] = useState<CharacterAttributes>(initialAttributes);
  const [generatedImage, setGeneratedImage] = useState<string | null>(initialImage || null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const { generateImage, isLoading: isGeneratingImage } = useImageGeneration();
  const generationInProgressRef = useRef(false);

  useEffect(() => {
    if (initialAttributes) {
      setAttributes(initialAttributes);
    }
  }, [initialAttributes]);

  useEffect(() => {
    if (initialImage) {
      setGeneratedImage(initialImage);
    }
  }, [initialImage]);

  const handleChange = (field: keyof CharacterAttributes, value: string) => {
    const updatedAttributes = { ...attributes, [field]: value };
    setAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
  };

  const generatePrompt = () => {
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
  };

  const handleGenerateAvatar = async () => {
    if (generationInProgressRef.current) {
      return; // Prevent double generation
    }

    try {
      generationInProgressRef.current = true;
      const prompt = generatePrompt();
      
      const imageUrl = await generateImage(prompt, 'avatar');
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        onImageSelected(imageUrl);
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      toast({
        title: "Error",
        description: "Failed to generate avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      generationInProgressRef.current = false;
    }
  };

  const handleRemoveImage = () => {
    setGeneratedImage(null);
    onImageSelected('');
    setIsEditMode(false);
  };

  const renderImagePreview = () => {
    if (!generatedImage) return null;
    
    return (
      <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg">
        <img
          src={generatedImage}
          alt="Generated avatar"
          className="w-full rounded-lg"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
            type="button"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            type="button"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderLoadingState = () => {
    if (!isGeneratingImage) return null;
    
    return (
      <div className="flex flex-col items-center gap-2 my-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Generating Avatar...
        </p>
      </div>
    );
  };

  // Only show the form if there's no generated image or we're in edit mode
  if (generatedImage && !isEditMode) {
    return (
      <div className="space-y-4">
        <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg">
          <img
            src={generatedImage}
            alt="Generated avatar"
            className="w-full rounded-lg"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              type="button"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              type="button"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          type="button" 
          onClick={() => setIsEditMode(true)}
          className="w-full"
          variant="outline"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Character Attributes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Character Attributes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={attributes.gender}
            onValueChange={(value) => handleChange("gender", value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="hairColor">Hair Color</Label>
          <Select
            value={attributes.hairColor}
            onValueChange={(value) => handleChange("hairColor", value)}
          >
            <SelectTrigger id="hairColor">
              <SelectValue placeholder="Select hair color" />
            </SelectTrigger>
            <SelectContent>
              {HAIR_COLOR_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="eyeColor">Eye Color</Label>
          <Select
            value={attributes.eyeColor}
            onValueChange={(value) => handleChange("eyeColor", value)}
          >
            <SelectTrigger id="eyeColor">
              <SelectValue placeholder="Select eye color" />
            </SelectTrigger>
            <SelectContent>
              {EYE_COLOR_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="style">Art Style</Label>
          <Select
            value={attributes.style}
            onValueChange={(value) => handleChange("style", value)}
          >
            <SelectTrigger id="style">
              <SelectValue placeholder="Select art style" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="sm:col-span-2">
          <Label htmlFor="accessories">Accessories/Clothing</Label>
          <Input
            id="accessories"
            placeholder="E.g., glasses, hat, suit, etc."
            value={attributes.accessories || ""}
            onChange={(e) => handleChange("accessories", e.target.value)}
          />
        </div>
        
        <div className="sm:col-span-2">
          <Label htmlFor="additionalDetails">Additional Details</Label>
          <Input
            id="additionalDetails"
            placeholder="Any other details you'd like to include"
            value={attributes.additionalDetails || ""}
            onChange={(e) => handleChange("additionalDetails", e.target.value)}
          />
        </div>
      </div>
      
      {renderLoadingState() || (
        <Button 
          type="button" 
          onClick={handleGenerateAvatar}
          className="w-full"
          variant="secondary"
          disabled={isGeneratingImage}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Avatar with These Attributes
        </Button>
      )}
      
      {generatedImage && renderImagePreview()}
    </div>
  );
} 