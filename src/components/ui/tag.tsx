import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const tagVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary hover:bg-primary/20",
        meal: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        dietary: "bg-green-100 text-green-800 hover:bg-green-200",
        difficulty: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        cuisine: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        cooking: "bg-red-100 text-red-800 hover:bg-red-200",
        occasion: "bg-pink-100 text-pink-800 hover:bg-pink-200",
        course: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        taste: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      },
      size: {
        default: "h-8",
        sm: "h-7 px-2.5",
        lg: "h-9 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  icon?: React.ReactNode;
}

export function Tag({ className, variant, size, icon, children, ...props }: TagProps) {
  return (
    <span className={cn(tagVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  );
} 