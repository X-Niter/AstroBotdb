import { Variants } from "framer-motion";

// Staggered fade-in animation for lists and grids
export const staggeredFadeIn = (
  staggerAmount = 0.1, 
  duration = 0.5
): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: staggerAmount,
      duration,
    },
  },
});

// Staggered item animation for children
export const fadeInItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Slide up and fade in animation
export const slideUpFadeIn: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Slide in from right animation
export const slideInRight: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeIn",
    },
  },
};

// Space-themed floating animation
export const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// Pulse glow animation
export const pulseGlow: Variants = {
  initial: { opacity: 0.7, boxShadow: "0 0 10px rgba(93, 72, 255, 0.5)" },
  animate: {
    opacity: [0.7, 0.9, 0.7],
    boxShadow: [
      "0 0 10px rgba(93, 72, 255, 0.5)", 
      "0 0 20px rgba(93, 72, 255, 0.8)", 
      "0 0 10px rgba(93, 72, 255, 0.5)"
    ],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// Star twinkle animation for space-themed UIs
export const starTwinkle: Variants = {
  initial: { opacity: 0.1, scale: 0.8 },
  animate: {
    opacity: [0.1, 0.8, 0.1],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: Math.random() * 5,
    },
  },
};

// Page transition animation
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Cosmic button hover animation
export const cosmicButtonHover: Variants = {
  initial: { 
    boxShadow: "0 4px 12px rgba(93, 72, 255, 0.3)",
    scale: 1,
  },
  hover: { 
    boxShadow: "0 8px 25px rgba(93, 72, 255, 0.6)",
    scale: 1.03,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};