import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface RecipeImportFormProps {
  url: string;
  language: string;
  isImporting: boolean;
  onUrlChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RecipeImportForm({
  url,
  language,
  isImporting,
  onUrlChange,
  onLanguageChange,
  onSubmit,
}: RecipeImportFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="Paste a recipe URL here..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-4">
        <Select
          value={language}
          onValueChange={onLanguageChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="pl">Polish</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isImporting} className="flex-1">
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Recipe'
          )}
        </Button>
      </div>
    </form>
  );
} 