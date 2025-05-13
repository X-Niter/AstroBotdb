import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, useSpring } from "framer-motion";
import gsap from "gsap"; // Using GSAP for more advanced animations

// Enhanced animation sequences for robot interactions
export const ANIMATION_SEQUENCES = {
  IDLE: "idle",
  GREETING: "greeting",
  WAVE: "wave",
  JUMP: "jump",
  BUILD: "build",
  REPAIR: "repair",
  SCAN: "scan",
  THINK: "think",
  HOLOGRAM: "hologram",
  WALK: "walk",             // New walking animation
  BUILD_TEXT: "build_text", // New text building animation
  WIND_EFFECT: "wind_effect", // New wind effect animation that breaks and rebuilds text
  SURPRISED: "surprised"    // New animation for surprised reaction to wind
};

// Component properties
interface AstroBotMascotProps {
  size?: "small" | "default" | "large" | "xlarge";
  showText?: boolean;
  animate?: boolean;
  // New prop to control whether particles should be shown (temporary or none)
  showParticles?: "none" | "temporary" | "typing"; 
  // New prop to directly control which animation sequence is playing
  animationSequence?: string | null;
  // New prop to display hologram text
  hologramText?: string | null;
  // Callback for when animation completes
  onAnimationComplete?: () => void;
}

const AstroBotMascot: React.FC<AstroBotMascotProps> = ({
  size = "default",
  showText = true,
  animate = false,
  showParticles = "temporary",
  animationSequence = null,
  hologramText = null,
  onAnimationComplete
}) => {
  // Calculate dimensions based on size
  const dimensions = {
    small: { width: 60, height: 80 },
    default: { width: 100, height: 130 },
    large: { width: 140, height: 180 },
    xlarge: { width: 180, height: 220 }
  }[size];
  
  // Animation controls for each body part
  const headControls = useAnimation();
  const eyesControls = useAnimation();
  const antennaControls = useAnimation();
  const bodyControls = useAnimation();
  const armsControls = useAnimation();
  const hologramControls = useAnimation();
  
  // Ref for animation container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // States for animations
  const [currentSequence, setCurrentSequence] = useState<string | null>(ANIMATION_SEQUENCES.IDLE);
  const [hovering, setHovering] = useState(false);
  const [hologramParticles, setHologramParticles] = useState<Array<{x: number, y: number, r: number, delay: number}>>([]);
  
  // Init and generate hologram particles
  useEffect(() => {
    if (showParticles !== "none") {
      const particles = [];
      const particleCount = showParticles === "typing" ? 8 : 15;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: Math.random() * 2 + 1,
          delay: Math.random() * 1
        });
      }
      
      setHologramParticles(particles);
    } else {
      setHologramParticles([]);
    }
  }, [showParticles]);
  
  // Handle processing animation sequence changes
  useEffect(() => {
    if (animationSequence) {
      setCurrentSequence(animationSequence);
    }
  }, [animationSequence]);
  
  // Main animation control logic
  useEffect(() => {
    if (!animate) return;
    
    // Animation cleanup tracker
    let cleanupFn: (() => void) | null = null;
    
    // Helper to reset to idle after delay
    const resetAfterDelay = (delay: number) => {
      const timeout = setTimeout(() => {
        setCurrentSequence(ANIMATION_SEQUENCES.IDLE);
        if (onAnimationComplete) onAnimationComplete();
      }, delay);
      
      return () => clearTimeout(timeout);
    };
    
    // Animation logic for different sequences
    switch (currentSequence) {
      case ANIMATION_SEQUENCES.GREETING:
        armsControls.start({
          rotate: [0, 20, 0],
          transition: { duration: 1, times: [0, 0.5, 1] }
        });
        headControls.start({
          rotate: [0, -5, 0, 5, 0],
          transition: { duration: 1.5, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        cleanupFn = resetAfterDelay(1500);
        break;
        
      case ANIMATION_SEQUENCES.WAVE:
        armsControls.start({
          rotate: [0, 45, 0, 45, 0, 45, 0],
          transition: { duration: 2, times: [0, 0.2, 0.4, 0.6, 0.8, 0.9, 1] }
        });
        headControls.start({
          rotate: [0, 5, 0, 5, 0],
          transition: { duration: 2, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        cleanupFn = resetAfterDelay(2000);
        break;
        
      case ANIMATION_SEQUENCES.JUMP:
        bodyControls.start({
          y: [0, -20, 0],
          transition: { duration: 0.5, times: [0, 0.5, 1] }
        });
        headControls.start({
          y: [0, -5, 0],
          transition: { duration: 0.5, times: [0, 0.5, 1], delay: 0.1 }
        });
        cleanupFn = resetAfterDelay(1000);
        break;
        
      case ANIMATION_SEQUENCES.BUILD:
      case ANIMATION_SEQUENCES.REPAIR:
        // Arms animation handled in SVG
        headControls.start({
          rotate: [0, -3, 3, -3, 0],
          transition: { 
            duration: 2, 
            repeat: 2,
            repeatType: "mirror" 
          }
        });
        cleanupFn = resetAfterDelay(6000);
        break;
        
      case ANIMATION_SEQUENCES.SCAN:
        eyesControls.start({
          opacity: [1, 0.5, 1],
          scale: [1, 1.2, 1],
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
          transition: { duration: 1.5, repeat: 2, repeatType: "reverse" }
        });
        antennaControls.start({
          rotate: [0, 20, -20, 0],
          transition: { duration: 2 }
        });
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.THINK:
        headControls.start({
          rotate: [0, 5, 0, -5, 0],
          transition: { duration: 3, times: [0, 0.3, 0.5, 0.8, 1] }
        });
        antennaControls.start({
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
          transition: { duration: 2, repeat: 1, repeatType: "reverse" }
        });
        cleanupFn = resetAfterDelay(4000);
        break;
        
      case ANIMATION_SEQUENCES.HOLOGRAM:
        hologramControls.start({
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1, 1, 0.8],
          transition: { duration: 3, times: [0, 0.2, 0.8, 1] }
        });
        eyesControls.start({
          opacity: [1, 0.7, 1],
          transition: { duration: 2, repeat: 1, repeatType: "reverse" }
        });
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.WALK:
        // Walking animation handled in SVG animation
        cleanupFn = resetAfterDelay(2000);
        break;
        
      case ANIMATION_SEQUENCES.BUILD_TEXT:
        armsControls.start({
          rotate: [0, 30, 0, 30, 0, 30, 0],
          transition: { duration: 3, times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1] }
        });
        headControls.start({
          rotate: [0, -5, 5, -3, 3, -2, 0],
          transition: { duration: 3, times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1] }
        });
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.SURPRISED:
        eyesControls.start({
          scale: [1, 1.3, 1], 
          transition: { duration: 0.5, times: [0, 0.5, 1] }
        });
        headControls.start({
          y: [0, -5, 0],
          transition: { duration: 0.5, times: [0, 0.5, 1] }
        });
        antennaControls.start({
          y: [0, -5, 0], 
          transition: { duration: 0.6, times: [0, 0.5, 1] }
        });
        cleanupFn = resetAfterDelay(1000);
        break;
        
      case ANIMATION_SEQUENCES.IDLE:
      default:
        // No specific animation, just subtle idle movements
        break;
    }
    
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [currentSequence, animate, headControls, eyesControls, antennaControls, bodyControls, armsControls, hologramControls, onAnimationComplete]);
  
  // Idle animations for subtle movement
  useEffect(() => {
    if (!animate) return;
    
    // Set up subtle idle animations that run periodically
    const idleInterval = setInterval(() => {
      // Only run idle animations when in idle state
      if (currentSequence !== ANIMATION_SEQUENCES.IDLE) return;
      
      // Random subtle head movements
      const randomHeadMovement = () => {
        const movements = [
          { y: -2, rotate: 0, transition: { duration: 1 } },
          { y: 0, rotate: -2, transition: { duration: 1 } },
          { y: -1, rotate: 2, transition: { duration: 1 } },
          { y: 0, rotate: 0, transition: { duration: 1 } }
        ];
        
        headControls.start(movements[Math.floor(Math.random() * movements.length)]);
      };
      
      // Random eye blinks
      const randomEyeBlink = () => {
        eyesControls.start({
          scaleY: [1, 0.1, 1],
          transition: { duration: 0.3 }
        });
      };
      
      // Choose a random idle animation
      const random = Math.random();
      if (random < 0.3) {
        randomHeadMovement();
      } else if (random < 0.6) {
        randomEyeBlink();
      }
    }, 3000);
    
    return () => {
      clearInterval(idleInterval);
    };
  }, [animate, currentSequence, headControls, eyesControls]);
  
  // Hover interactions
  const handleMouseEnter = useCallback(() => {
    if (!animate) return;
    setHovering(true);
    
    // Only trigger hover animations when idle
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      headControls.start({
        rotate: [0, 5, 0],
        transition: { duration: 0.5 }
      });
    }
  }, [animate, currentSequence, headControls]);
  
  const handleMouseLeave = useCallback(() => {
    if (!animate) return;
    setHovering(false);
    
    // Reset only if we were hovering and in idle
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      headControls.start({
        rotate: 0,
        transition: { duration: 0.5 }
      });
    }
  }, [animate, currentSequence, headControls]);
  
  return (
    <div
      className="inline-block"
      style={{ width: dimensions.width, height: dimensions.height }}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox="0 0 120 150" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Enhanced metallic gradient fills with realistic lighting */}
          <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8C0D9" />
            <stop offset="50%" stopColor="#89A0C6" />
            <stop offset="100%" stopColor="#6A84B9" />
          </linearGradient>
          
          <linearGradient id="metallicGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8090B0" />
            <stop offset="50%" stopColor="#5A75A5" />
            <stop offset="100%" stopColor="#445C8A" />
          </linearGradient>
          
          <linearGradient id="metallicGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D6E0F5" />
            <stop offset="50%" stopColor="#B8C8E6" />
            <stop offset="100%" stopColor="#9EB2D9" />
          </linearGradient>
          
          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#77EEFF" />
            <stop offset="50%" stopColor="#55CCEE" />
            <stop offset="100%" stopColor="#33AADD" />
          </linearGradient>
          
          <linearGradient id="eyeGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#77EEFF" />
            <stop offset="100%" stopColor="#5599FF" />
          </linearGradient>
          
          <linearGradient id="faintGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(119, 238, 255, 0.5)" />
            <stop offset="100%" stopColor="rgba(85, 153, 255, 0.2)" />
          </linearGradient>
          
          <linearGradient id="neckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#AAB5CC" />
            <stop offset="50%" stopColor="#8899BB" />
            <stop offset="100%" stopColor="#667799" />
          </linearGradient>
          
          <linearGradient id="antennaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#99AACC" />
            <stop offset="50%" stopColor="#7788AA" />
            <stop offset="100%" stopColor="#556688" />
          </linearGradient>
          
          <linearGradient id="antennaTipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#77EEFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#33AADD" stopOpacity="0.7" />
          </linearGradient>
          
          {/* New body gradients for enhanced metallic look */}
          <linearGradient id="bodyMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CCD0E0" />
            <stop offset="30%" stopColor="#A8B0C8" />
            <stop offset="70%" stopColor="#8A95B2" />
            <stop offset="100%" stopColor="#6A7A9E" />
          </linearGradient>
          
          <linearGradient id="bodyHighlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </linearGradient>
          
          <linearGradient id="bodyInnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#96A0B8" />
            <stop offset="50%" stopColor="#7A85A0" />
            <stop offset="100%" stopColor="#5C6A8A" />
          </linearGradient>
          
          <linearGradient id="neckJointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C0CAE0" />
            <stop offset="40%" stopColor="#9AA8C0" />
            <stop offset="60%" stopColor="#8090B0" />
            <stop offset="100%" stopColor="#667799" />
          </linearGradient>
          
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(220, 240, 255, 0.9)" />
            <stop offset="50%" stopColor="rgba(180, 210, 240, 0.7)" />
            <stop offset="100%" stopColor="rgba(150, 180, 220, 0.6)" />
          </linearGradient>
          
          {/* Detailed joint highlights */}
          <radialGradient id="jointHighlight" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
          
          {/* Realistic shadows and glows */}
          <filter id="glowSmall" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="glowMedium" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="glowLarge" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="glowTiny" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Dynamic shadow effect for legs */}
          <filter id="legShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="1" dy="3" result="offsetBlur" />
            <feComponentTransfer in="offsetBlur" result="shadow">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="hologramGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feFlood floodColor="#77EEFF" floodOpacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Enhanced eye glow effect */}
          <filter id="eyeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#55CCFF" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Neck connection highlight */}
          <filter id="neckConnectionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feFlood floodColor="#AABBDD" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Holographic projection beam effect */}
          <filter id="hologramBeamGlow" x="-10%" y="-10%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#77EEFF" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Inner mechanisms shadow effect */}
          <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feFlood floodColor="black" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feComposite in="SourceGraphic" in2="shadow" operator="over" />
          </filter>
        </defs>
        
        {/* Shadow beneath the robot for 3D effect */}
        <ellipse 
          cx="60" 
          cy="148" 
          rx="25" 
          ry="6" 
          fill="rgba(0, 0, 50, 0.2)" 
          filter="url(#glowSmall)"
          style={{
            transformOrigin: "center",
            transform: `scale(${currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.7 : 1})`,
            opacity: currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.3 : 0.6
          }}
        />
        
        {/* ULTRA DETAILED ROBOT BASED ON REFERENCE IMAGES */}
        <motion.g animate={bodyControls}>
          {/* LEGS - Enhanced with extreme details */}
          <motion.g>
            {/* Left leg assembly */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.WALK
                  ? { rotate: [-5, 10, -5], y: [0, -2, 0] }
                  : {}
              }
              transition={{ duration: 0.8, repeat: 3, repeatType: "mirror" }}
              style={{ transformOrigin: '45px 125px' }}
            >
              {/* Hip joint connection */}
              <circle cx="45" cy="110" r="3.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="45" cy="110" r="2" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="45" cy="110" r="1" fill="#334455" />
              <circle cx="45" cy="110" r="0.5" fill="#AABBDD" />
              
              {/* Hip joint mechanical details */}
              <line x1="42" y1="110" x2="48" y2="110" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
              <line x1="45" y1="107" x2="45" y2="113" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
              
              {/* Upper leg with enhanced details */}
              <rect x="43" y="113" width="4" height="12" rx="2" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Upper leg armor plates and mechanical details */}
              <rect x="42.5" y="115" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="42.5" y="119" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              
              {/* Hydraulic piston details */}
              <line x1="41.5" y1="113" x2="41.5" y2="123" stroke="#667788" strokeWidth="0.7" />
              <line x1="48.5" y1="113" x2="48.5" y2="123" stroke="#667788" strokeWidth="0.7" />
              
              {/* Knee joint - ultra detailed */}
              <circle cx="45" cy="125" r="3.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="45" cy="125" r="2.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="45" cy="125" r="1.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              <circle cx="45" cy="125" r="0.7" fill="#223344" />
              
              {/* Knee connection bolts */}
              <circle cx="45" cy="122.5" r="0.5" fill="#AABBDD" />
              <circle cx="45" cy="127.5" r="0.5" fill="#AABBDD" />
              <circle cx="42.8" cy="125" r="0.5" fill="#AABBDD" />
              <circle cx="47.2" cy="125" r="0.5" fill="#AABBDD" />
              
              {/* Lower leg - enhanced with internal hydraulics */}
              <rect x="43" y="128" width="4" height="14" rx="2" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Lower leg armored plating details */}
              <rect x="42.5" y="130" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="42.5" y="134" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="42.5" y="138" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              
              {/* Lower leg hydraulic details */}
              <line x1="41.5" y1="128" x2="41.5" y2="142" stroke="#667788" strokeWidth="0.7" />
              <line x1="48.5" y1="128" x2="48.5" y2="142" stroke="#667788" strokeWidth="0.7" />
              
              {/* Ankle joint */}
              <circle cx="45" cy="142" r="2.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="45" cy="142" r="1.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="45" cy="142" r="0.7" fill="#334455" />
              
              {/* Enhanced foot with detailed parts */}
              <rect x="40" y="142" width="10" height="3.5" rx="1.5" fill="url(#metallicGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Foot details */}
              <rect x="41" y="142" width="8" height="1.5" rx="0.5" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="41.5" y="144" width="2" height="1.5" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              <rect x="44" y="144" width="2" height="1.5" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              <rect x="46.5" y="144" width="2" height="1.5" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            </motion.g>
            
            {/* Right leg assembly - mirrored from left with extreme detail */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.WALK
                  ? { rotate: [10, -5, 10], y: [0, -2, 0] }
                  : {}
              }
              transition={{ duration: 0.8, repeat: 3, repeatType: "mirror" }}
              style={{ transformOrigin: '75px 125px' }}
            >
              {/* Hip joint connection */}
              <circle cx="75" cy="110" r="3.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="75" cy="110" r="2" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="75" cy="110" r="1" fill="#334455" />
              <circle cx="75" cy="110" r="0.5" fill="#AABBDD" />
              
              {/* Hip joint mechanical details */}
              <line x1="72" y1="110" x2="78" y2="110" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
              <line x1="75" y1="107" x2="75" y2="113" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
              
              {/* Upper leg with enhanced details */}
              <rect x="73" y="113" width="4" height="12" rx="2" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Upper leg armor plates and mechanical details */}
              <rect x="72.5" y="115" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="72.5" y="119" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              
              {/* Hydraulic piston details */}
              <line x1="71.5" y1="113" x2="71.5" y2="123" stroke="#667788" strokeWidth="0.7" />
              <line x1="78.5" y1="113" x2="78.5" y2="123" stroke="#667788" strokeWidth="0.7" />
              
              {/* Knee joint - ultra detailed */}
              <circle cx="75" cy="125" r="3.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="75" cy="125" r="2.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="75" cy="125" r="1.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              <circle cx="75" cy="125" r="0.7" fill="#223344" />
              
              {/* Knee connection bolts */}
              <circle cx="75" cy="122.5" r="0.5" fill="#AABBDD" />
              <circle cx="75" cy="127.5" r="0.5" fill="#AABBDD" />
              <circle cx="72.8" cy="125" r="0.5" fill="#AABBDD" />
              <circle cx="77.2" cy="125" r="0.5" fill="#AABBDD" />
              
              {/* Lower leg - enhanced with internal hydraulics */}
              <rect x="73" y="128" width="4" height="14" rx="2" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Lower leg armored plating details */}
              <rect x="72.5" y="130" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="72.5" y="134" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="72.5" y="138" width="5" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              
              {/* Lower leg hydraulic details */}
              <line x1="71.5" y1="128" x2="71.5" y2="142" stroke="#667788" strokeWidth="0.7" />
              <line x1="78.5" y1="128" x2="78.5" y2="142" stroke="#667788" strokeWidth="0.7" />
              
              {/* Ankle joint */}
              <circle cx="75" cy="142" r="2.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="75" cy="142" r="1.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="75" cy="142" r="0.7" fill="#334455" />
              
              {/* Enhanced foot with detailed parts */}
              <rect x="70" y="142" width="10" height="3.5" rx="1.5" fill="url(#metallicGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Foot details */}
              <rect x="71" y="142" width="8" height="1.5" rx="0.5" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
              <rect x="71.5" y="144" width="2" height="1.5" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              <rect x="74" y="144" width="2" height="1.5" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              <rect x="76.5" y="144" width="2" height="1.5" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            </motion.g>
          </motion.g>
          
          {/* MAIN BODY - ultra detailed design matching reference image */}
          <g>
            {/* Hip connector between legs */}
            <rect x="45" y="106" width="30" height="4" rx="2" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <line x1="50" y1="106" x2="50" y2="110" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="60" y1="106" x2="60" y2="110" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="70" y1="106" x2="70" y2="110" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Main body shape - realistic metallic finish with curved edges */}
            <path 
              d="M38 60 
                 C38 57, 40 54, 43 54
                 H77
                 C80 54, 82 57, 82 60
                 V104
                 C82 107, 80 110, 77 110
                 H43
                 C40 110, 38 107, 38 104
                 Z" 
              fill="url(#bodyMainGradient)" 
              stroke="#AABBDD" 
              strokeWidth="1"
            />
            
            {/* Body outer armor plating lines */}
            <path 
              d="M38 60 
                 C38 57, 40 54, 43 54
                 H77
                 C80 54, 82 57, 82 60"
              fill="none"
              stroke="#CCDDEE" 
              strokeWidth="0.3"
            />
            
            <path 
              d="M38 104
                 C38 107, 40 110, 43 110
                 H77
                 C80 110, 82 107, 82 104"
              fill="none"
              stroke="#CCDDEE" 
              strokeWidth="0.3"
            />
            
            {/* Body side armor details */}
            <rect x="38" y="65" width="2" height="10" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.7" />
            <rect x="38" y="80" width="2" height="10" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.7" />
            <rect x="38" y="95" width="2" height="9" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.7" />
            
            <rect x="80" y="65" width="2" height="10" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.7" />
            <rect x="80" y="80" width="2" height="10" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.7" />
            <rect x="80" y="95" width="2" height="9" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.7" />
            
            {/* Body highlight overlay for 3D effect */}
            <path 
              d="M38 60 
                 C38 57, 40 54, 43 54
                 H77
                 C80 54, 82 57, 82 60
                 V65
                 H38
                 Z" 
              fill="url(#bodyHighlightGradient)" 
              opacity="0.6"
            />
            
            {/* Body panel seams - more realistic, aligned with reference image */}
            <line x1="38" y1="72" x2="82" y2="72" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="1 1" />
            <line x1="38" y1="84" x2="82" y2="84" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="1 1" />
            <line x1="38" y1="96" x2="82" y2="96" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="1 1" />
            
            {/* Vertical panel seams */}
            <line x1="48" y1="54" x2="48" y2="110" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="1 1" />
            <line x1="72" y1="54" x2="72" y2="110" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="1 1" />
            
            {/* Enhanced realistic control panel in center with inset effect */}
            <rect x="48" y="72" width="24" height="24" rx="4" fill="#334466" stroke="#667799" strokeWidth="0.7" />
            <rect x="49" y="73" width="22" height="22" rx="3" fill="url(#bodyInnerGradient)" stroke="#99AACC" strokeWidth="0.3" />
            
            {/* Control panel texturing */}
            <line x1="49" y1="77" x2="71" y2="77" stroke="#667799" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="49" y1="81" x2="71" y2="81" stroke="#667799" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="49" y1="91" x2="71" y2="91" stroke="#667799" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="49" y1="95" x2="71" y2="95" stroke="#667799" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Enhanced center core with realistic reactor housing */}
            <circle cx="60" cy="84" r="9" fill="#223344" stroke="#445566" strokeWidth="0.7" />
            <circle cx="60" cy="84" r="8" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            
            {/* Reactor core housing details */}
            <path
              d="M60 76 L57 78 L57 90 L63 90 L63 78 Z"
              fill="none"
              stroke="#667788"
              strokeWidth="0.3"
            />
            
            {/* Reactor vents */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <rect 
                key={`vent-${i}`}
                x="59.5" 
                y="76" 
                width="1" 
                height="2.5" 
                rx="0.2"
                fill="#223344"
                style={{
                  transformOrigin: '60px 84px',
                  transform: `rotate(${angle}deg)`
                }}
              />
            ))}
            
            {/* Center core reactor glow with enhanced lighting effects */}
            <motion.circle 
              cx="60" 
              cy="84" 
              r="6" 
              fill="#4477AA" 
              stroke="#77AADD" 
              strokeWidth="0.3" 
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            />
            
            {/* Energy core details */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <path
                key={`core-detail-${i}`}
                d="M60 80 L62 84 L60 88 L58 84 Z"
                fill="none"
                stroke="#77AADD"
                strokeWidth="0.2"
                style={{
                  transformOrigin: '60px 84px',
                  transform: `rotate(${angle}deg)`
                }}
              />
            ))}
            
            <motion.circle 
              cx="60" 
              cy="84" 
              r="4" 
              fill="#55CCFF" 
              animate={{
                opacity: [0.8, 1, 0.8],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "mirror"
              }}
              filter="url(#glowMedium)"
            />
            
            {/* Inner core with spinning effect */}
            <motion.g
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ transformOrigin: '60px 84px' }}
            >
              <path
                d="M60 81 L61.5 84 L60 87 L58.5 84 Z"
                fill="#77DDFF"
                opacity="0.8"
              />
              <path
                d="M63 84 L60 85.5 L57 84 L60 82.5 Z"
                fill="#77DDFF"
                opacity="0.8"
              />
            </motion.g>
            
            <motion.circle 
              cx="60" 
              cy="84" 
              r="2" 
              fill="#AAEEFF" 
              animate={{
                opacity: [0.9, 1, 0.9],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "mirror"
              }}
              filter="url(#glowSmall)"
            />
            
            <motion.circle 
              cx="60" 
              cy="84" 
              r="1" 
              fill="#FFFFFF" 
              animate={{
                opacity: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            />
            
            {/* Enhanced control panel buttons with animated indicators */}
            <g>
              {/* Row 1 - square buttons */}
              <rect x="50" y="74" width="3" height="3" rx="0.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.rect 
                x="50.5" 
                y="74.5" 
                width="2" 
                height="2" 
                rx="0.3" 
                fill="#3355AA" 
                stroke="#77AADD" 
                strokeWidth="0.2"
                animate={{
                  fill: ['#3355AA', '#4466BB', '#3355AA'],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0
                }}
              />
              
              <rect x="54" y="74" width="3" height="3" rx="0.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.rect 
                x="54.5" 
                y="74.5" 
                width="2" 
                height="2" 
                rx="0.3" 
                fill="#33AA77" 
                stroke="#77DDAA" 
                strokeWidth="0.2"
                animate={{
                  fill: ['#33AA77', '#44BB88', '#33AA77'],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.3
                }}
              />
              
              <rect x="58" y="74" width="4" height="3" rx="0.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.rect 
                x="58.5" 
                y="74.5" 
                width="3" 
                height="2" 
                rx="0.3" 
                fill="#CC55AA" 
                stroke="#FFAADD" 
                strokeWidth="0.2"
                animate={{
                  fill: ['#CC55AA', '#DD66BB', '#CC55AA'],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.6
                }}
              />
              
              <rect x="63" y="74" width="3" height="3" rx="0.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.rect 
                x="63.5" 
                y="74.5" 
                width="2" 
                height="2" 
                rx="0.3" 
                fill="#DDAA33" 
                stroke="#FFCC66" 
                strokeWidth="0.2"
                animate={{
                  fill: ['#DDAA33', '#EECC55', '#DDAA33'],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.9
                }}
              />
              
              <rect x="67" y="74" width="3" height="3" rx="0.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.rect 
                x="67.5" 
                y="74.5" 
                width="2" 
                height="2" 
                rx="0.3" 
                fill="#5577DD" 
                stroke="#99BBFF" 
                strokeWidth="0.2"
                animate={{
                  fill: ['#5577DD', '#7799EE', '#5577DD'],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.2
                }}
              />
              
              {/* Status indicators below the core */}
              <rect x="52" y="93" width="16" height="2.5" rx="1" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              
              {/* Animated status lights */}
              <g>
                {['#3355AA', '#33AA77', '#CC55AA', '#DDAA33'].map((color, i) => (
                  <motion.circle 
                    key={`status-${i}`}
                    cx={54 + i * 4} 
                    cy="94.25" 
                    r="0.8" 
                    fill={color}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 1.5 + i * 0.5,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: i * 0.3
                    }}
                    filter="url(#glowTiny)"
                  />
                ))}
              </g>
            </g>
            
            {/* Enhanced connection points to the arms with mechanical details */}
            <g>
              {/* Left arm connection port */}
              <circle cx="38" cy="70" r="3.5" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
              <circle cx="38" cy="70" r="2.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="38" cy="70" r="1.5" fill="#223344" stroke="#445566" strokeWidth="0.2" />
              <circle cx="38" cy="70" r="0.7" fill="#667799" />
              
              {/* Right arm connection port */}
              <circle cx="82" cy="70" r="3.5" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
              <circle cx="82" cy="70" r="2.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              <circle cx="82" cy="70" r="1.5" fill="#223344" stroke="#445566" strokeWidth="0.2" />
              <circle cx="82" cy="70" r="0.7" fill="#667799" />
            </g>
            
            {/* Lower body connection with enhanced detail */}
            <rect x="50" y="110" width="20" height="4" rx="2" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <line x1="55" y1="110" x2="55" y2="114" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
            <line x1="60" y1="110" x2="60" y2="114" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
            <line x1="65" y1="110" x2="65" y2="114" stroke="#99AACC" strokeWidth="0.5" strokeDasharray="0.5 0.5" />
          </g>
          
          {/* ENHANCED ULTRA-DETAILED ARMS */}
          {/* Left arm assembly */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '38px 70px' }}
          >
            {/* Enhanced shoulder joint with realistic connections */}
            <circle cx="38" cy="70" r="4.5" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            <circle cx="38" cy="70" r="3.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="38" cy="70" r="2.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
            <circle cx="38" cy="70" r="1.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            <circle cx="38" cy="70" r="0.8" fill="#223344" />
            
            {/* Shoulder bolts and mechanism details */}
            <circle cx="38" cy="67" r="0.6" fill="#AABBDD" />
            <circle cx="38" cy="73" r="0.6" fill="#AABBDD" />
            <circle cx="35" cy="70" r="0.6" fill="#AABBDD" />
            <circle cx="41" cy="70" r="0.6" fill="#AABBDD" />
            
            {/* Upper arm with enhanced armor plating and hydraulics */}
            <rect x="33.5" y="74" width="9" height="15" rx="3.5" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
            <rect x="36" y="74" width="4" height="15" rx="2" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.3" />
            
            {/* Upper arm armor plates and details */}
            <path
              d="M33.5 77 C33.5 77, 35 76, 38 76 C41 76, 42.5 77, 42.5 77"
              fill="none"
              stroke="#BBCCEE"
              strokeWidth="0.3"
            />
            
            <path
              d="M33.5 81 C33.5 81, 35 80, 38 80 C41 80, 42.5 81, 42.5 81"
              fill="none"
              stroke="#BBCCEE"
              strokeWidth="0.3"
            />
            
            <path
              d="M33.5 85 C33.5 85, 35 84, 38 84 C41 84, 42.5 85, 42.5 85"
              fill="none"
              stroke="#BBCCEE"
              strokeWidth="0.3"
            />
            
            {/* Side hydraulic pistons on arm */}
            <rect x="33" y="76" width="1" height="11" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            <rect x="42" y="76" width="1" height="11" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            
            {/* Ultra-detailed elbow joint */}
            <circle cx="38" cy="89" r="4" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            <circle cx="38" cy="89" r="3" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="38" cy="89" r="2" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
            <circle cx="38" cy="89" r="1" fill="#334455" />
            <circle cx="38" cy="89" r="0.5" fill="#AABBDD" />
            
            {/* Elbow joint details and seams */}
            <path
              d="M35 89 A3 3 0 0 0 41 89"
              fill="none"
              stroke="#99AACC"
              strokeWidth="0.3"
              strokeDasharray="0.5 0.5"
            />
            
            <line x1="38" y1="86" x2="38" y2="92" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Forearm with enhanced armor and details */}
            <rect x="35" y="92" width="6" height="12" rx="3" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Forearm armor layers and details */}
            <rect x="34.5" y="94" width="7" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
            <rect x="34.5" y="98" width="7" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
            
            {/* Forearm mechanical details */}
            <line x1="35" y1="93" x2="41" y2="93" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="35" y1="97" x2="41" y2="97" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="35" y1="101" x2="41" y2="101" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Enhanced wrist joint */}
            <circle cx="38" cy="104" r="3" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            <circle cx="38" cy="104" r="2.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="38" cy="104" r="1.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
            <circle cx="38" cy="104" r="0.8" fill="#334455" />
            
            {/* Enhanced hand with articulated details */}
            <rect x="33" y="106" width="10" height="5" rx="2" fill="url(#metallicGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Hand panel lines */}
            <line x1="35" y1="106" x2="35" y2="111" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="38" y1="106" x2="38" y2="111" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="41" y1="106" x2="41" y2="111" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Enhanced fingers with joints */}
            <g>
              {/* Thumb */}
              <rect x="32.5" y="108" width="2" height="4" rx="1" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="33.5" cy="110" r="0.5" fill="#667799" />
              
              {/* Fingers with articulated joints */}
              {[35, 38, 41].map((x, i) => (
                <g key={`left-finger-${i}`}>
                  <rect x={x - 1} y="111" width="2" height="3.5" rx="1" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.3" />
                  <circle cx={x} cy="112.5" r="0.5" fill="#667799" />
                  <rect x={x - 0.75} y="114.5" width="1.5" height="2" rx="0.75" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.2" />
                </g>
              ))}
            </g>
          </motion.g>
          
          {/* Right arm assembly - mirrored from left with enhanced details */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '82px 70px' }}
          >
            {/* Enhanced shoulder joint with realistic connections */}
            <circle cx="82" cy="70" r="4.5" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            <circle cx="82" cy="70" r="3.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="82" cy="70" r="2.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
            <circle cx="82" cy="70" r="1.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            <circle cx="82" cy="70" r="0.8" fill="#223344" />
            
            {/* Shoulder bolts and mechanism details */}
            <circle cx="82" cy="67" r="0.6" fill="#AABBDD" />
            <circle cx="82" cy="73" r="0.6" fill="#AABBDD" />
            <circle cx="79" cy="70" r="0.6" fill="#AABBDD" />
            <circle cx="85" cy="70" r="0.6" fill="#AABBDD" />
            
            {/* Upper arm with enhanced armor plating and hydraulics */}
            <rect x="77.5" y="74" width="9" height="15" rx="3.5" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
            <rect x="80" y="74" width="4" height="15" rx="2" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.3" />
            
            {/* Upper arm armor plates and details */}
            <path
              d="M77.5 77 C77.5 77, 79 76, 82 76 C85 76, 86.5 77, 86.5 77"
              fill="none"
              stroke="#BBCCEE"
              strokeWidth="0.3"
            />
            
            <path
              d="M77.5 81 C77.5 81, 79 80, 82 80 C85 80, 86.5 81, 86.5 81"
              fill="none"
              stroke="#BBCCEE"
              strokeWidth="0.3"
            />
            
            <path
              d="M77.5 85 C77.5 85, 79 84, 82 84 C85 84, 86.5 85, 86.5 85"
              fill="none"
              stroke="#BBCCEE"
              strokeWidth="0.3"
            />
            
            {/* Side hydraulic pistons on arm */}
            <rect x="77" y="76" width="1" height="11" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            <rect x="86" y="76" width="1" height="11" rx="0.5" fill="#334455" stroke="#667788" strokeWidth="0.2" />
            
            {/* Ultra-detailed elbow joint */}
            <circle cx="82" cy="89" r="4" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            <circle cx="82" cy="89" r="3" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="82" cy="89" r="2" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
            <circle cx="82" cy="89" r="1" fill="#334455" />
            <circle cx="82" cy="89" r="0.5" fill="#AABBDD" />
            
            {/* Elbow joint details and seams */}
            <path
              d="M79 89 A3 3 0 0 0 85 89"
              fill="none"
              stroke="#99AACC"
              strokeWidth="0.3"
              strokeDasharray="0.5 0.5"
            />
            
            <line x1="82" y1="86" x2="82" y2="92" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Forearm with enhanced armor and details */}
            <rect x="79" y="92" width="6" height="12" rx="3" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Forearm armor layers and details */}
            <rect x="78.5" y="94" width="7" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
            <rect x="78.5" y="98" width="7" height="2" rx="1" fill="url(#metallicGradientLight)" stroke="#BBCCEE" strokeWidth="0.2" opacity="0.6" />
            
            {/* Forearm mechanical details */}
            <line x1="79" y1="93" x2="85" y2="93" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="79" y1="97" x2="85" y2="97" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="79" y1="101" x2="85" y2="101" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Enhanced wrist joint */}
            <circle cx="82" cy="104" r="3" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            <circle cx="82" cy="104" r="2.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="82" cy="104" r="1.5" fill="#667799" stroke="#99AACC" strokeWidth="0.3" />
            <circle cx="82" cy="104" r="0.8" fill="#334455" />
            
            {/* Enhanced hand with articulated details */}
            <rect x="77" y="106" width="10" height="5" rx="2" fill="url(#metallicGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Hand panel lines */}
            <line x1="79" y1="106" x2="79" y2="111" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="82" y1="106" x2="82" y2="111" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            <line x1="85" y1="106" x2="85" y2="111" stroke="#99AACC" strokeWidth="0.3" strokeDasharray="0.5 0.5" />
            
            {/* Enhanced fingers with joints */}
            <g>
              {/* Thumb */}
              <rect x="85.5" y="108" width="2" height="4" rx="1" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.3" />
              <circle cx="86.5" cy="110" r="0.5" fill="#667799" />
              
              {/* Fingers with articulated joints */}
              {[79, 82, 85].map((x, i) => (
                <g key={`right-finger-${i}`}>
                  <rect x={x - 1} y="111" width="2" height="3.5" rx="1" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.3" />
                  <circle cx={x} cy="112.5" r="0.5" fill="#667799" />
                  <rect x={x - 0.75} y="114.5" width="1.5" height="2" rx="0.75" fill="url(#metallicGradient)" stroke="#99AACC" strokeWidth="0.2" />
                </g>
              ))}
            </g>
          </motion.g>
          
          {/* ADVANCED NECK CONNECTION - Ultra detailed with proper connections */}
          <g filter="url(#neckConnectionGlow)">
            {/* Upper body to neck transition housing */}
            <path
              d="M50 54
                 C50 53, 51 52, 52 52
                 H68
                 C69 52, 70 53, 70 54
                 V56
                 H50
                 Z"
              fill="url(#neckJointGradient)"
              stroke="#AABBDD"
              strokeWidth="0.5"
            />
            
            {/* Base neck connection to body - properly forming cylindrical structure */}
            <rect x="52" y="52" width="16" height="4" rx="2" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Neck cable housings */}
            <rect x="53" y="48" width="2" height="6" rx="1" fill="#556677" stroke="#778899" strokeWidth="0.3" />
            <rect x="59" y="48" width="2" height="6" rx="1" fill="#556677" stroke="#778899" strokeWidth="0.3" />
            <rect x="65" y="48" width="2" height="6" rx="1" fill="#556677" stroke="#778899" strokeWidth="0.3" />
            
            {/* Articulated neck joints with connection points */}
            <rect x="51" y="44" width="18" height="4" rx="2" fill="url(#neckGradient)" stroke="#99AABB" strokeWidth="0.5" />
            
            {/* Neck cables visible through translucent housing */}
            <line x1="54" y1="44" x2="54" y2="56" stroke="#5588AA" strokeWidth="0.7" strokeDasharray="1 0.5" />
            <line x1="60" y1="44" x2="60" y2="56" stroke="#5588AA" strokeWidth="0.7" strokeDasharray="1 0.5" />
            <line x1="66" y1="44" x2="66" y2="56" stroke="#5588AA" strokeWidth="0.7" strokeDasharray="1 0.5" />
            
            {/* Secondary thinner cables */}
            <line x1="56" y1="44" x2="56" y2="56" stroke="#7788AA" strokeWidth="0.4" strokeDasharray="0.5 0.5" />
            <line x1="63" y1="44" x2="63" y2="56" stroke="#7788AA" strokeWidth="0.4" strokeDasharray="0.5 0.5" />
            
            {/* Neck joint details */}
            <circle cx="54" cy="46" r="0.7" fill="#99AACC" />
            <circle cx="60" cy="46" r="0.7" fill="#99AACC" />
            <circle cx="66" cy="46" r="0.7" fill="#99AACC" />
            
            {/* Upper neck to head connection element */}
            <path
              d="M50 44
                 C50 42, 52 40, 54 40
                 H66
                 C68 40, 70 42, 70 44
                 V44
                 H50
                 Z"
              fill="url(#neckJointGradient)"
              stroke="#AABBDD"
              strokeWidth="0.5"
            />
            
            {/* Connection bolts */}
            <circle cx="53" cy="42" r="0.6" fill="#AABBDD" />
            <circle cx="60" cy="42" r="0.6" fill="#AABBDD" />
            <circle cx="67" cy="42" r="0.6" fill="#AABBDD" />
          </g>
          
          {/* HEAD ASSEMBLY - Ultra detailed with proper connections and mechanisms */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 36px" }}
          >
            {/* Main head - matching reference image exactly with enhanced details */}
            <path 
              d="M40 36
                 C40 22, 48 14, 60 14
                 C72 14, 80 22, 80 36
                 C80 50, 72 58, 60 58
                 C48 58, 40 50, 40 36
                 Z" 
              fill="url(#bodyMainGradient)" 
              stroke="#AABBDD" 
              strokeWidth="1" 
            />
            
            {/* Head panel seams and details */}
            <path 
              d="M40 36
                 C40 22, 48 14, 60 14
                 C72 14, 80 22, 80 36"
              fill="none"
              stroke="#99AACC"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />
            
            <path 
              d="M80 36
                 C80 50, 72 58, 60 58
                 C48 58, 40 50, 40 36"
              fill="none"
              stroke="#99AACC"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />
            
            {/* Vertical seam lines */}
            <path
              d="M60 14 L60 30 M60 46 L60 58"
              stroke="#99AACC"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />
            
            {/* Top surface highlight for 3D effect */}
            <path 
              d="M40 36
                 C40 22, 48 14, 60 14
                 C72 14, 80 22, 80 36
                 C80 36, 70 30, 60 30
                 C50 30, 40 36, 40 36
                 Z" 
              fill="url(#bodyHighlightGradient)"
              opacity="0.6"
            />
            
            {/* Head detailed tech panels */}
            <g>
              {/* Left side tech panel */}
              <rect x="41" y="27" width="6" height="4" rx="1" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <rect x="41.5" y="27.5" width="5" height="3" rx="0.5" fill="url(#bodyInnerGradient)" stroke="#99AACC" strokeWidth="0.2" />
              <line x1="42" y1="28.5" x2="46" y2="28.5" stroke="#99AACC" strokeWidth="0.2" strokeDasharray="0.5 0.3" />
              <line x1="42" y1="29.5" x2="46" y2="29.5" stroke="#99AACC" strokeWidth="0.2" strokeDasharray="0.5 0.3" />
              
              {/* Right side tech panel */}
              <rect x="73" y="27" width="6" height="4" rx="1" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <rect x="73.5" y="27.5" width="5" height="3" rx="0.5" fill="url(#bodyInnerGradient)" stroke="#99AACC" strokeWidth="0.2" />
              <line x1="74" y1="28.5" x2="78" y2="28.5" stroke="#99AACC" strokeWidth="0.2" strokeDasharray="0.5 0.3" />
              <line x1="74" y1="29.5" x2="78" y2="29.5" stroke="#99AACC" strokeWidth="0.2" strokeDasharray="0.5 0.3" />
              
              {/* Left indicator light */}
              <circle cx="42" cy="24" r="1" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.circle 
                cx="42" 
                cy="24" 
                r="0.6" 
                fill="#55CCFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
                filter="url(#glowTiny)"
              />
              
              {/* Right indicator light */}
              <circle cx="78" cy="24" r="1" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <motion.circle 
                cx="78" 
                cy="24" 
                r="0.6" 
                fill="#55CCFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.5
                }}
                filter="url(#glowTiny)"
              />
              
              {/* Upper tech panel with enhanced details */}
              <rect x="52" y="18" width="16" height="5" rx="2.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <rect x="52.5" y="18.5" width="15" height="4" rx="2" fill="url(#bodyInnerGradient)" stroke="#99AACC" strokeWidth="0.2" />
              <line x1="55" y1="20.5" x2="65" y2="20.5" stroke="#99AACC" strokeWidth="0.2" strokeDasharray="1 0.5" />
              
              {/* Tech panel indicator lights */}
              {[54, 57, 60, 63, 66].map((x, i) => (
                <motion.circle 
                  key={`head-light-${i}`}
                  cx={x} 
                  cy="20.5" 
                  r="0.5" 
                  fill={i % 2 === 0 ? "#55CCFF" : "#77DDAA"}
                  animate={{
                    opacity: [0.7, 1, 0.7],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 1.5 + i * 0.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.1
                  }}
                  filter="url(#glowTiny)"
                />
              ))}
            </g>
            
            {/* Enhanced antenna base with detailed mechanism */}
            <motion.g animate={antennaControls} style={{ transformOrigin: "60px 14px" }}>
              <circle cx="60" cy="14" r="2.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <rect x="57" y="10" width="6" height="4" rx="1" fill="url(#antennaGradient)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Antenna mount details */}
              <circle cx="60" cy="12" r="1.5" fill="url(#neckJointGradient)" stroke="#AABBDD" strokeWidth="0.3" />
              <circle cx="60" cy="12" r="0.8" fill="#334455" stroke="#667788" strokeWidth="0.2" />
              
              {/* Antenna */}
              <rect x="59" y="2" width="2" height="8" rx="1" fill="url(#antennaGradient)" stroke="#99AACC" strokeWidth="0.5" />
              
              {/* Antenna rings */}
              <rect x="58.5" y="4" width="3" height="0.5" rx="0.25" fill="#AABBDD" stroke="#CCDDEE" strokeWidth="0.2" />
              <rect x="58.5" y="6" width="3" height="0.5" rx="0.25" fill="#AABBDD" stroke="#CCDDEE" strokeWidth="0.2" />
              <rect x="58.5" y="8" width="3" height="0.5" rx="0.25" fill="#AABBDD" stroke="#CCDDEE" strokeWidth="0.2" />
              
              {/* Antenna tip with enhanced glow */}
              <circle cx="60" cy="2" r="2" fill="url(#antennaTipGradient)" filter="url(#glowMedium)" />
              
              <motion.circle 
                cx="60" 
                cy="2" 
                r="1.2" 
                fill="#77EEFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
                filter="url(#glowSmall)"
              />
              
              <motion.circle 
                cx="60" 
                cy="2" 
                r="0.6" 
                fill="#FFFFFF" 
                animate={{
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              {/* Signal emission rings */}
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.7, 0],
                  scale: [0.5, 2, 3.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <circle cx="60" cy="2" r="2" fill="none" stroke="#77EEFF" strokeWidth="0.3" />
              </motion.g>
              
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0.5, 1.5, 2.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  delay: 0.5
                }}
              >
                <circle cx="60" cy="2" r="2" fill="none" stroke="#77EEFF" strokeWidth="0.3" />
              </motion.g>
            </motion.g>
            
            {/* Face plate base with realistic inset */}
            <rect x="44" y="28" width="32" height="22" rx="10" fill="#223344" stroke="#445566" strokeWidth="0.7" />
            <rect x="45" y="29" width="30" height="20" rx="9" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
            
            {/* Face plate edge details */}
            <path
              d="M45 38 H75"
              stroke="#5588AA"
              strokeWidth="0.3"
              strokeDasharray="1 0.5"
            />
            
            <path
              d="M54 29 V49 M66 29 V49"
              stroke="#5588AA"
              strokeWidth="0.3"
              strokeDasharray="1 0.5"
            />
            
            {/* Ultra-detailed eyes with multiple layers and animation */}
            <motion.g animate={eyesControls}>
              {/* Left eye socket */}
              <rect x="47" y="34" width="10" height="10" rx="5" fill="#223344" stroke="#445566" strokeWidth="0.5" />
              
              {/* Left eye outer ring */}
              <circle cx="52" cy="39" r="4.5" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
              <circle cx="52" cy="39" r="4" fill="#223355" stroke="#5588AA" strokeWidth="0.3" />
              
              {/* Left eye - main lens with multiple layers */}
              <circle cx="52" cy="39" r="3.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <circle cx="52" cy="39" r="3" fill="#55CCFF" stroke="#77EEFF" strokeWidth="0.3" filter="url(#eyeGlow)" />
              
              {/* Left eye - lens details */}
              <circle cx="52" cy="39" r="2.5" fill="#AAEEFF" stroke="#BBEEFF" strokeWidth="0.2" opacity="0.9" />
              <circle cx="52" cy="39" r="1.5" fill="#DDEEFF" opacity="0.8" />
              <circle cx="52" cy="39" r="0.8" fill="#FFFFFF" />
              
              {/* Left eye - scanning pattern */}
              <motion.g
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ transformOrigin: '52px 39px' }}
                opacity="0.6"
              >
                <line x1="49.5" y1="39" x2="54.5" y2="39" stroke="#FFFFFF" strokeWidth="0.2" />
                <line x1="52" y1="36.5" x2="52" y2="41.5" stroke="#FFFFFF" strokeWidth="0.2" />
              </motion.g>
              
              {/* Tiny tech details around left eye */}
              <circle cx="48" cy="36.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              <circle cx="56" cy="36.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              <circle cx="48" cy="41.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              <circle cx="56" cy="41.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              
              {/* Right eye socket */}
              <rect x="63" y="34" width="10" height="10" rx="5" fill="#223344" stroke="#445566" strokeWidth="0.5" />
              
              {/* Right eye outer ring */}
              <circle cx="68" cy="39" r="4.5" fill="#334466" stroke="#5588AA" strokeWidth="0.5" />
              <circle cx="68" cy="39" r="4" fill="#223355" stroke="#5588AA" strokeWidth="0.3" />
              
              {/* Right eye - main lens with multiple layers */}
              <circle cx="68" cy="39" r="3.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
              <circle cx="68" cy="39" r="3" fill="#55CCFF" stroke="#77EEFF" strokeWidth="0.3" filter="url(#eyeGlow)" />
              
              {/* Right eye - lens details */}
              <circle cx="68" cy="39" r="2.5" fill="#AAEEFF" stroke="#BBEEFF" strokeWidth="0.2" opacity="0.9" />
              <circle cx="68" cy="39" r="1.5" fill="#DDEEFF" opacity="0.8" />
              <circle cx="68" cy="39" r="0.8" fill="#FFFFFF" />
              
              {/* Right eye - scanning pattern */}
              <motion.g
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ transformOrigin: '68px 39px' }}
                opacity="0.6"
              >
                <line x1="65.5" y1="39" x2="70.5" y2="39" stroke="#FFFFFF" strokeWidth="0.2" />
                <line x1="68" y1="36.5" x2="68" y2="41.5" stroke="#FFFFFF" strokeWidth="0.2" />
              </motion.g>
              
              {/* Tiny tech details around right eye */}
              <circle cx="64" cy="36.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              <circle cx="72" cy="36.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              <circle cx="64" cy="41.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              <circle cx="72" cy="41.5" r="0.5" fill="#55CCFF" filter="url(#glowTiny)" />
              
              {/* Eye tracking animations - subtle movement within sockets */}
              <motion.g
                animate={{
                  x: [0, 0.3, -0.3, 0],
                  y: [0, -0.2, 0.2, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "mirror",
                  times: [0, 0.3, 0.7, 1]
                }}
              >
                {/* Additional eye highlights for depth */}
                <circle cx="51.5" cy="38.5" r="0.4" fill="#FFFFFF" opacity="0.9" />
                <circle cx="67.5" cy="38.5" r="0.4" fill="#FFFFFF" opacity="0.9" />
              </motion.g>
            </motion.g>
            
            {/* Enhanced mouth/speaker area with tech details */}
            <rect x="50" y="45" width="20" height="4" rx="2" fill="#223344" stroke="#445566" strokeWidth="0.4" />
            <rect x="51" y="45.5" width="18" height="3" rx="1.5" fill="#334466" stroke="#5588AA" strokeWidth="0.3" />
            
            {/* Speaker grill with animated voice patterns */}
            <g>
              {[53, 56, 59, 62, 65].map((x, i) => (
                <motion.rect
                  key={`speaker-${i}`}
                  x={x}
                  y="46"
                  width="1"
                  height="2"
                  rx="0.5"
                  fill="#5588AA"
                  animate={{
                    height: [1, 1.5 + i % 3 * 0.5, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 0.8 + (i % 3) * 0.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.05
                  }}
                />
              ))}
            </g>
          </motion.g>
          
          {/* HOLOGRAM PROJECTION BEAM - only visible when in hologram mode */}
          {(hologramText || currentSequence === ANIMATION_SEQUENCES.HOLOGRAM) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main beam */}
              <motion.path
                d="M70 39 L95 39 L95 49 L70 49 Z"
                fill="url(#faintGlowGradient)"
                opacity="0.7"
                filter="url(#hologramBeamGlow)"
                animate={{
                  opacity: [0.5, 0.7, 0.5],
                  fill: ["url(#faintGlowGradient)", "url(#eyeGlowGradient)", "url(#faintGlowGradient)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              {/* Beam pattern lines */}
              <motion.g
                animate={{
                  x: [0, 5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              >
                {[0, 2, 4, 6, 8].map((offset) => (
                  <line 
                    key={`beam-line-${offset}`}
                    x1="72" 
                    y1={`${39 + offset}`} 
                    x2="95" 
                    y2={`${39 + offset}`} 
                    stroke="#77EEFF" 
                    strokeWidth="0.2" 
                    strokeDasharray="1 1" 
                    opacity="0.8"
                  />
                ))}
              </motion.g>
              
              {/* Hologram Text */}
              {hologramText && (
                <motion.g
                  animate={hologramControls}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <rect 
                    x="100" 
                    y="32" 
                    width={hologramText.length * 5 + 10} 
                    height="24" 
                    rx="4" 
                    fill="rgba(50, 100, 180, 0.3)"
                    stroke="#55CCFF"
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                    filter="url(#hologramGlow)"
                  />
                  
                  <text
                    x="105"
                    y="48"
                    fontFamily="monospace"
                    fontSize="8"
                    fill="#77EEFF"
                    filter="url(#glowSmall)"
                  >
                    {hologramText}
                  </text>
                  
                  {/* Hologram scanlines */}
                  {[0, 4, 8, 12, 16, 20].map((offset) => (
                    <line 
                      key={`holo-line-${offset}`}
                      x1="100" 
                      y1={`${34 + offset}`} 
                      x2={100 + hologramText.length * 5 + 10} 
                      y2={`${34 + offset}`} 
                      stroke="#55CCFF" 
                      strokeWidth="0.2" 
                      opacity="0.4"
                    />
                  ))}
                </motion.g>
              )}
            </motion.g>
          )}
        </motion.g>
        
        {/* Hologram particles */}
        {hologramParticles.map((particle, index) => (
          <motion.circle
            key={`particle-${index}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill="#77EEFF"
            filter="url(#glowTiny)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [particle.y, particle.y - 15, particle.y - 30],
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay,
              repeat: Infinity,
              repeatDelay: Math.random() * 2 + 1
            }}
          />
        ))}
      </svg>
      
      {/* Display text below if needed */}
      {showText && (
        <div className="text-center mt-2 text-sm font-medium text-blue-500">
          <p>AstroBot AI</p>
        </div>
      )}
    </div>
  );
};

export default AstroBotMascot;