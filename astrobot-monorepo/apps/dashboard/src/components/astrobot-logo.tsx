"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import gsap from "gsap";
import { SplitText } from "gsap/dist/SplitText";

// Make sure to register the plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText);
}

export function AstroBotLogo({ 
  size = "default",
  animationTrigger = false,
  windEffectTrigger = false,
  onAnimationComplete,
  className = ""
}: { 
  size?: "small" | "default" | "large",
  animationTrigger?: boolean,
  windEffectTrigger?: boolean,
  onAnimationComplete?: () => void,
  className?: string
}) {
  // Determine dimensions based on size
  const dimensions = {
    small: { container: "h-8 w-8", text: "text-lg" },
    default: { container: "h-12 w-12", text: "text-xl" },
    large: { container: "h-16 w-16", text: "text-3xl" }
  }[size];
  
  const textRef = useRef<HTMLSpanElement>(null);
  const splitTextRef = useRef<any>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // Animation for building the logo text letter by letter
  useEffect(() => {
    if (!textRef.current || typeof window === 'undefined') return;
    
    // Reset any existing animations
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    // Create the SplitText instance if it doesn't exist
    if (!splitTextRef.current && textRef.current) {
      splitTextRef.current = new SplitText(textRef.current, {
        type: "chars,words",
        charsClass: "astrobot-logo-char"
      });
    }
    
    const chars = splitTextRef.current?.chars || [];
    
    // Create a new timeline
    const tl = gsap.timeline({
      paused: true, 
      onComplete: () => onAnimationComplete?.()
    });
    
    // Initial state - all characters invisible
    tl.set(chars, { opacity: 0, y: 20 });
    
    // Add characters one by one with a typing effect
    chars.forEach((char: HTMLElement, index: number) => {
      tl.to(char, {
        opacity: 1,
        y: 0,
        duration: 0.1,
        ease: "power2.out"
      }, index * 0.05);
    });
    
    // Store the timeline reference
    timelineRef.current = tl;
    
    // If animation trigger is active, play the animation
    if (animationTrigger) {
      tl.play();
    } else {
      // Otherwise, show all characters immediately
      tl.progress(1);
    }
    
    return () => {
      tl.kill();
    };
  }, [animationTrigger, onAnimationComplete]);
  
  // Wind effect animation
  useEffect(() => {
    if (!windEffectTrigger || !textRef.current || !splitTextRef.current) return;
    
    const chars = splitTextRef.current.chars;
    if (!chars.length) return;
    
    const windTl = gsap.timeline();
    
    // Initial wind effect
    windTl.to(chars, {
      x: (i) => 10 + Math.random() * 40 * (i % 2 ? 1 : -1),
      y: (i) => -5 + Math.random() * -30,
      opacity: (i) => 0.2 + Math.random() * 0.5,
      rotationZ: (i) => (Math.random() > 0.5 ? 90 : -90) * Math.random(),
      duration: 0.6,
      ease: "power2.out",
      stagger: {
        each: 0.02,
        from: "random"
      }
    });
    
    // Return to normal
    windTl.to(chars, {
      x: 0,
      y: 0,
      opacity: 1,
      rotationZ: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
      stagger: {
        each: 0.03,
        from: "start"
      }
    }, "+=0.1");
    
    return () => {
      windTl.kill();
    };
  }, [windEffectTrigger]);
  
  // Determine className based on size
  const textClass = `font-bold ${dimensions.text} text-white ${className}`;

  return (
    <Link href="/" className="flex items-center">
      <div className="relative flex items-center">
        {/* Text logo with enhanced animation capabilities */}
        <motion.span 
          ref={textRef}
          className={textClass}
          initial={{ opacity: animationTrigger ? 0 : 1 }}
        >
          AstroBot AI
        </motion.span>
      </div>
    </Link>
  );
}