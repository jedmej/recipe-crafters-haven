import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  active?: boolean;
  badgeCount?: number;
  className?: string;
}

export function ActionButton({
  label,
  mobileLabel,
  icon: Icon,
  onClick,
  variant = "outline",
  active = false,
  badgeCount,
  className
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        "h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-none shadow-sm",
        active ? "bg-gray-100 hover:bg-gray-100" : "bg-white hover:bg-gray-50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="hidden sm:inline font-medium">{label}</span>
        {mobileLabel && <span className="sm:hidden font-medium">{mobileLabel}</span>}
        {typeof badgeCount === 'number' && badgeCount > 0 && (
          <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
            {badgeCount}
          </div>
        )}
      </div>
    </Button>
  );
} 