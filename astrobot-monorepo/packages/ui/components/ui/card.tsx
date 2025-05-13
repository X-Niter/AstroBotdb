"use client";

import * as React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

// Animation variants
const cardVariants = {
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(93, 72, 255, 0.6)",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  initial: {
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

// Motion version of the Card component with animations
const MotionCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & MotionProps
>(({ className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      whileHover="hover"
      initial="initial"
      variants={cardVariants}
      {...props}
    />
  );
});
MotionCard.displayName = "MotionCard";

// Glass Card that looks like space glass
const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-glass-card backdrop-blur-glass border border-glass-border shadow-glass p-4",
        className
      )}
      {...props}
    />
  );
});
GlassCard.displayName = "GlassCard";

// Motion version of the Glass Card
const MotionGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & MotionProps
>(({ className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-xl bg-glass-card backdrop-blur-glass border border-glass-border shadow-glass p-4",
        className
      )}
      whileHover="hover"
      initial="initial"
      variants={cardVariants}
      {...props}
    />
  );
});
MotionGlassCard.displayName = "MotionGlassCard";

// Cosmic Card (purple/blue space theme)
const CosmicCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-gradient-to-br from-space-800 to-cosmic-900 text-white border border-space-700 shadow-cosmic p-4",
        className
      )}
      {...props}
    />
  );
});
CosmicCard.displayName = "CosmicCard";

// Special animated card header with a glow effect
const CardGlowHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6 relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-space-500/20 to-cosmic-500/20 animate-pulse-glow -z-10 rounded-t-lg" />
      {children}
    </div>
  );
});
CardGlowHeader.displayName = "CardGlowHeader";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  MotionCard,
  GlassCard,
  MotionGlassCard,
  CosmicCard,
  CardHeader,
  CardGlowHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};