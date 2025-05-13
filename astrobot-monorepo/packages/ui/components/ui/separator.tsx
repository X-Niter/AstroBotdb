"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "../../lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    variant?: "default" | "gradient";
  }
>(
  (
    { className, orientation = "horizontal", decorative = true, variant = "default", ...props },
    ref
  ) => {
    const variantClasses = {
      default: "bg-border opacity-50",
      gradient: orientation === "horizontal" 
        ? "bg-gradient-to-r from-transparent via-cosmic-500/30 to-transparent" 
        : "bg-gradient-to-b from-transparent via-cosmic-500/30 to-transparent"
    };

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };