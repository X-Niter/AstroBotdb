"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// Space theme variants
const inputVariants = {
  default: "border-border shadow-sm ring-offset-background focus-visible:ring-ring",
  cosmic: "border-cosmic-600 focus:border-cosmic-400 shadow-cosmic-sm focus:shadow-cosmic",
};

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  theme?: keyof typeof inputVariants;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, theme = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          inputVariants[theme],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Cosmic version with space-themed glowing effect
export interface CosmicInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const CosmicInput = React.forwardRef<HTMLInputElement, CosmicInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-cosmic-700/50 bg-background/30 backdrop-blur-sm px-3 py-2 text-sm shadow-cosmic-sm placeholder:text-cosmic-300/70 focus:border-cosmic-500 focus:outline-none focus:shadow-cosmic transition-all duration-300",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cosmic-500/10 to-space-500/10 -z-10"></div>
      </div>
    );
  }
);
CosmicInput.displayName = "CosmicInput";

// Glass version with space-themed transparency
export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-glass-border bg-glass-card backdrop-blur-glass px-3 py-2 text-sm shadow-glass placeholder:text-white/50 focus:border-white/30 focus:outline-none focus:shadow-cosmic-sm transition-all duration-300",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";

export { Input, CosmicInput, GlassInput };