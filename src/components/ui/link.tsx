import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface LinkProps extends RouterLinkProps {
  className?: string;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <RouterLink
        className={cn(
          "text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = "Link";

export default Link; 