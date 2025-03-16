import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComponentProps, ReactNode } from "react";

interface RoundButtonProps extends Omit<ComponentProps<typeof Button>, 'className'> {
  icon: ReactNode;
  label?: string;
  active?: boolean;
  className?: string;
}

export function RoundButton({
  icon,
  label,
  active,
  className,
  ...props
}: RoundButtonProps) {
  return (
    <Button
      {...props}
      variant={active ? "default" : "outline"}
      className={cn(
        "group relative w-12 h-12 p-0 rounded-full",
        // Only apply hover styles on desktop devices
        "md:hover:w-[140px] md:transition-all md:duration-200",
        "overflow-hidden",
        active && "bg-[#FA8923] text-white hover:bg-[#FA8923]/90",
        !active && "bg-white hover:bg-gray-50",
        className
      )}
    >
      <div className="absolute left-3">{icon}</div>
      {label && (
        <span className="hidden opacity-0 md:block md:group-hover:opacity-100 ml-8 md:transition-opacity md:duration-200">
          {label}
        </span>
      )}
    </Button>
  );
} 