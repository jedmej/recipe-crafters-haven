import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorStateProps {
  message: string;
  onBack: () => void;
}

export function ErrorState({ message, onBack }: ErrorStateProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      
      <Button variant="outline" onClick={onBack}>
        Go Back
      </Button>
    </div>
  );
} 