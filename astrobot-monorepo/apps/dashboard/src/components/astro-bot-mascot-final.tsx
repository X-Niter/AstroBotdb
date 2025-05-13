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
  WALK: "walk",             // Walking animation
  BUILD_TEXT: "build_text", // Text building animation
  WIND_EFFECT: "wind_effect", // Wind effect animation that breaks and rebuilds text
  SURPRISED: "surprised",   // Surprised reaction
  HOVER: "hover"            // Hover effect for interactive elements
};

// Component properties
interface AstroBotMascotProps {
  size?: "small" | "default" | "large" | "xlarge";
  showText?: boolean;
  animate?: boolean;
  showParticles?: "none" | "temporary" | "typing"; 
  animationSequence?: string | null;
  hologramText?: string | null;
  interactive?: boolean;
  onAnimationComplete?: () => void;
}

const AstroBotMascot: React.FC<AstroBotMascotProps> = ({
  size = "default",
  showText = true,
  animate = false,
  showParticles = "temporary",
  animationSequence = null,
  hologramText = null,
  interactive = false,
  onAnimationComplete
}) => {
  // Calculate dimensions based on size
  const dimensions = {
    small: { width: 80, height: 120 },
    default: { width: 120, height: 180 },
    large: { width: 160, height: 240 },
    xlarge: { width: 200, height: 300 }
  }[size];
  
  // Animation controls for each body part
  const headControls = useAnimation();
  const eyesControls = useAnimation();
  const antennaControls = useAnimation();
  const bodyControls = useAnimation();
  const armsControls = useAnimation();
  const legsControls = useAnimation();
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
        legsControls.start({
          x: [-5, 5, -5],
          transition: { duration: 0.8, repeat: 4, repeatType: "mirror" }
        });
        bodyControls.start({
          y: [0, -3, 0, -3, 0],
          transition: { duration: 1.6, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        cleanupFn = resetAfterDelay(3200);
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
        
      case ANIMATION_SEQUENCES.HOVER:
        bodyControls.start({
          y: [0, -5, 0],
          transition: { 
            duration: 2,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
          }
        });
        // No cleanup for hover - it continues until changed
        break;
        
      case ANIMATION_SEQUENCES.IDLE:
      default:
        // Reset all animations to default state
        bodyControls.start({ y: 0, x: 0, rotate: 0 });
        headControls.start({ y: 0, x: 0, rotate: 0 });
        armsControls.start({ rotate: 0 });
        legsControls.start({ x: 0 });
        break;
    }
    
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [currentSequence, animate, headControls, eyesControls, antennaControls, bodyControls, armsControls, legsControls, hologramControls, onAnimationComplete]);
  
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
      
      // Random antenna movements
      const randomAntennaMovement = () => {
        antennaControls.start({
          rotate: [-2, 2, 0],
          transition: { duration: 1.5 }
        });
      };
      
      // Choose a random idle animation
      const random = Math.random();
      if (random < 0.3) {
        randomHeadMovement();
      } else if (random < 0.6) {
        randomEyeBlink();
      } else {
        randomAntennaMovement();
      }
    }, 3000);
    
    return () => {
      clearInterval(idleInterval);
    };
  }, [animate, currentSequence, headControls, eyesControls, antennaControls]);
  
  // Hover interactions
  const handleMouseEnter = useCallback(() => {
    if (!animate || !interactive) return;
    setHovering(true);
    
    // Only trigger hover animations when idle
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      headControls.start({
        rotate: [0, 5, 0],
        transition: { duration: 0.5 }
      });
      
      eyesControls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.5 }
      });
    }
  }, [animate, interactive, currentSequence, headControls, eyesControls]);
  
  const handleMouseLeave = useCallback(() => {
    if (!animate || !interactive) return;
    setHovering(false);
    
    // Reset only if we were hovering and in idle
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      headControls.start({
        rotate: 0,
        transition: { duration: 0.5 }
      });
      
      eyesControls.start({
        scale: 1,
        transition: { duration: 0.5 }
      });
    }
  }, [animate, interactive, currentSequence, headControls, eyesControls]);
  
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
        viewBox="0 0 120 180" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main robot body gradients - lighter colors matching reference image */}
          <linearGradient id="robotBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F2F4F8" />
            <stop offset="100%" stopColor="#E6EAF2" />
          </linearGradient>
          
          <linearGradient id="robotBodyShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6EAF2" />
            <stop offset="50%" stopColor="#DCE0E8" />
            <stop offset="100%" stopColor="#CCD2E0" />
          </linearGradient>
          
          {/* Face plate gradients */}
          <linearGradient id="facePlateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#303C56" />
            <stop offset="100%" stopColor="#1A2438" />
          </linearGradient>
          
          {/* Blue glowing elements - brighter blue matching reference */}
          <linearGradient id="blueGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33DDFF" />
            <stop offset="70%" stopColor="#22BBEE" />
            <stop offset="100%" stopColor="#0099CC" />
          </linearGradient>
          
          {/* Green button gradient */}
          <linearGradient id="greenButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#44FF88" />
            <stop offset="100%" stopColor="#22CC66" />
          </linearGradient>
          
          {/* Purple button gradient */}
          <linearGradient id="purpleButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DD66EE" />
            <stop offset="100%" stopColor="#BB44CC" />
          </linearGradient>
          
          {/* Yellow/Orange button gradient */}
          <linearGradient id="yellowButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFCC44" />
            <stop offset="100%" stopColor="#FFAA22" />
          </linearGradient>
          
          {/* Panel Details */}
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8899BB" />
            <stop offset="100%" stopColor="#667799" />
          </linearGradient>
          
          {/* Various glow effects */}
          <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#33DDFF" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="brightGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#33DDFF" floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="smallGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="tinyGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Shadow beneath robot */}
        <ellipse 
          cx="60" 
          cy="175" 
          rx="28" 
          ry="5" 
          fill="rgba(0, 0, 50, 0.15)" 
          style={{
            transformOrigin: "center",
            transform: `scale(${currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.7 : 1})`,
            opacity: currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.3 : 0.6
          }}
        />
        
        {/* ROBOT MATCHING THE REFERENCE IMAGE WITH PROPER HUMANOID PROPORTIONS */}
        <motion.g animate={bodyControls}>
          {/* LEGS - Properly proportioned to body */}
          <motion.g animate={legsControls}>
            {/* Left leg - height ~1/4 of total height */}
            <rect x="49" y="130" width="6" height="35" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Left foot */}
            <rect x="47" y="165" width="10" height="5" rx="2" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Leg joint details */}
            <circle cx="52" cy="135" r="2" fill="#DCE0E8" />
            <circle cx="52" cy="155" r="2" fill="#DCE0E8" />
            
            {/* Right leg - height ~1/4 of total height */}
            <rect x="65" y="130" width="6" height="35" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Right foot */}
            <rect x="63" y="165" width="10" height="5" rx="2" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Leg joint details */}
            <circle cx="68" cy="135" r="2" fill="#DCE0E8" />
            <circle cx="68" cy="155" r="2" fill="#DCE0E8" />
          </motion.g>
          
          {/* MAIN BODY - White rectangular shape with rounded corners - 1/3 of total height */}
          <rect x="40" y="90" width="40" height="40" rx="6" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="1" />
          
          {/* Body center blue core */}
          <circle cx="60" cy="110" r="10" fill="url(#facePlateGradient)" stroke="#8899BB" strokeWidth="0.5" />
          <circle cx="60" cy="110" r="8" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
          
          <motion.circle 
            cx="60" 
            cy="110" 
            r="6" 
            fill="#33DDFF" 
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          />
          
          <motion.circle 
            cx="60" 
            cy="110" 
            r="3" 
            fill="#FFFFFF" 
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          />
          
          {/* Body panel details */}
          <rect x="45" y="95" width="30" height="4" rx="2" fill="#8899BB" opacity="0.3" />
          
          {/* Bottom control panel with colorful buttons */}
          <rect x="45" y="123" width="30" height="5" rx="2" fill="#8899BB" opacity="0.3" />
          
          {/* Colorful buttons - matches reference image */}
          <g>
            {[
              { x: 48, fill: "url(#greenButtonGradient)" },
              { x: 54, fill: "url(#purpleButtonGradient)" },
              { x: 60, fill: "url(#yellowButtonGradient)" },
              { x: 66, fill: "url(#blueGlowGradient)" },
              { x: 72, fill: "url(#greenButtonGradient)" }
            ].map((button, i) => (
              <motion.circle
                key={`button-${i}`}
                cx={button.x}
                cy="125.5"
                r="1.8"
                fill={button.fill}
                animate={{
                  opacity: [0.85, 1, 0.85]
                }}
                transition={{
                  duration: 1.5 + i * 0.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: i * 0.2
                }}
                filter="url(#tinyGlow)"
              />
            ))}
          </g>
          
          {/* Bottom connector */}
          <rect x="48" y="130" width="24" height="3" rx="1.5" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
          
          {/* ARMS - Properly proportioned */}
          {/* Left arm */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '40px 95px' }}
          >
            {/* Upper arm */}
            <rect x="34" y="95" width="6" height="20" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Arm joint */}
            <circle cx="37" cy="95" r="3" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
            <circle cx="37" cy="95" r="1.2" fill="#E6EAF2" />
            
            {/* Arm joint detail */}
            <circle cx="37" cy="115" r="2.5" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
            <circle cx="37" cy="115" r="1" fill="#E6EAF2" />
            
            {/* Lower arm */}
            <rect x="34" y="115" width="6" height="20" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Hand */}
            <rect x="33" y="135" width="8" height="5" rx="2" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Finger details - subtle definition */}
            <rect x="34" y="138" width="1.5" height="2" rx="0.75" fill="#DCE0E8" opacity="0.5" />
            <rect x="36.5" y="138" width="1.5" height="2" rx="0.75" fill="#DCE0E8" opacity="0.5" />
            <rect x="39" y="138" width="1.5" height="2" rx="0.75" fill="#DCE0E8" opacity="0.5" />
          </motion.g>
          
          {/* Right arm */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '80px 95px' }}
          >
            {/* Upper arm */}
            <rect x="80" y="95" width="6" height="20" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Arm joint */}
            <circle cx="83" cy="95" r="3" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
            <circle cx="83" cy="95" r="1.2" fill="#E6EAF2" />
            
            {/* Arm joint detail */}
            <circle cx="83" cy="115" r="2.5" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
            <circle cx="83" cy="115" r="1" fill="#E6EAF2" />
            
            {/* Lower arm */}
            <rect x="80" y="115" width="6" height="20" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Hand */}
            <rect x="79" y="135" width="8" height="5" rx="2" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
            
            {/* Finger details - subtle definition */}
            <rect x="80" y="138" width="1.5" height="2" rx="0.75" fill="#DCE0E8" opacity="0.5" />
            <rect x="82.5" y="138" width="1.5" height="2" rx="0.75" fill="#DCE0E8" opacity="0.5" />
            <rect x="85" y="138" width="1.5" height="2" rx="0.75" fill="#DCE0E8" opacity="0.5" />
          </motion.g>
          
          {/* NECK - Simple connector with appropriate height */}
          <rect x="52" y="80" width="16" height="10" rx="3" fill="url(#robotBodyGradient)" stroke="#DCE0E8" strokeWidth="0.5" />
          
          {/* HEAD ASSEMBLY - Properly sized circular head */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 55px" }}
          >
            {/* Main head - Circle with white color, ~1/3 of total height */}
            <circle 
              cx="60" 
              cy="55" 
              r="25" 
              fill="url(#robotBodyGradient)" 
              stroke="#DCE0E8" 
              strokeWidth="1"
            />
            
            {/* Face plate - Dark blue area for eyes - not too large */}
            <rect x="45" y="45" width="30" height="20" rx="10" fill="url(#facePlateGradient)" stroke="#8899BB" strokeWidth="0.5" />
            
            {/* Left side tech panel */}
            <rect x="35" y="50" width="6" height="10" rx="1" fill="#8899BB" opacity="0.3" />
            
            {/* Right side tech panel */}
            <rect x="79" y="50" width="6" height="10" rx="1" fill="#8899BB" opacity="0.3" />
            
            {/* Top indicator lights panel */}
            <rect x="48" y="30" width="24" height="5" rx="2.5" fill="#8899BB" opacity="0.3" />
            
            {/* Top indicator lights */}
            <g>
              {[50, 54, 58, 62, 66, 70].map((x, i) => (
                <motion.circle 
                  key={`light-${i}`}
                  cx={x} 
                  cy="32.5" 
                  r="1.5" 
                  fill={i % 2 === 0 ? "#33DDFF" : "#22BBEE"}
                  animate={{
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 1.5 + i * 0.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.2
                  }}
                  filter="url(#tinyGlow)"
                />
              ))}
            </g>
            
            {/* Antenna - more defined and matching reference */}
            <motion.g animate={antennaControls} style={{ transformOrigin: "60px 20px" }}>
              <rect x="58" y="23" width="4" height="7" rx="2" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
              <rect x="59" y="15" width="2" height="8" rx="1" fill="url(#robotBodyShadow)" stroke="#DCE0E8" strokeWidth="0.5" />
              
              {/* Antenna light - brighter glow */}
              <circle cx="60" cy="15" r="3" fill="url(#blueGlowGradient)" filter="url(#brightGlow)" />
              
              <motion.circle 
                cx="60" 
                cy="15" 
                r="2" 
                fill="#33DDFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="60" 
                cy="15" 
                r="1" 
                fill="#FFFFFF" 
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
            </motion.g>
            
            {/* EYES - Bright glowing blue circles matching reference */}
            <motion.g animate={eyesControls}>
              {/* Left eye */}
              <circle cx="52" cy="55" r="6" fill="#1A2438" stroke="#8899BB" strokeWidth="0.5" />
              <circle cx="52" cy="55" r="5" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
              
              <motion.circle 
                cx="52" 
                cy="55" 
                r="4" 
                fill="#33DDFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="52" 
                cy="55" 
                r="2" 
                fill="#FFFFFF" 
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              {/* Right eye */}
              <circle cx="68" cy="55" r="6" fill="#1A2438" stroke="#8899BB" strokeWidth="0.5" />
              <circle cx="68" cy="55" r="5" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
              
              <motion.circle 
                cx="68" 
                cy="55" 
                r="4" 
                fill="#33DDFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="68" 
                cy="55" 
                r="2" 
                fill="#FFFFFF" 
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
            </motion.g>
            
            {/* Mouth/control panel */}
            <rect x="52" y="64" width="16" height="2" rx="1" fill="#8899BB" opacity="0.5" />
            
            <g>
              {[54, 56, 58, 60, 62, 64, 66].map((x, i) => (
                <rect
                  key={`mouth-${i}`}
                  x={x-0.5}
                  y="64"
                  width="1"
                  height="2"
                  rx="0.5"
                  fill={i % 2 === 0 ? "#33DDFF" : "#22BBEE"}
                  opacity="0.8"
                />
              ))}
            </g>
          </motion.g>
          
          {/* HOLOGRAM PROJECTION BEAM */}
          {(hologramText || currentSequence === ANIMATION_SEQUENCES.HOLOGRAM) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main beam from eye */}
              <motion.path
                d="M74 55 L95 55 L95 65 L74 65 Z"
                fill="url(#blueGlowGradient)"
                opacity="0.4"
                filter="url(#smallGlow)"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
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
                  x: [0, 2, 0]
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
                    x1="74" 
                    y1={`${55 + offset}`} 
                    x2="95" 
                    y2={`${55 + offset}`} 
                    stroke="#33DDFF" 
                    strokeWidth="0.2" 
                    strokeDasharray="1 1" 
                    opacity="0.6"
                  />
                ))}
              </motion.g>
              
              {/* Hologram Text */}
              {hologramText && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1
                  }}
                >
                  <rect 
                    x="100" 
                    y="50" 
                    width={hologramText.length * 5 + 10} 
                    height="20" 
                    rx="3" 
                    fill="rgba(30, 60, 100, 0.3)"
                    stroke="#33DDFF"
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                    filter="url(#tinyGlow)"
                  />
                  
                  <text
                    x="105"
                    y="63"
                    fontFamily="monospace"
                    fontSize="8"
                    fill="#33DDFF"
                    filter="url(#tinyGlow)"
                  >
                    {hologramText}
                  </text>
                  
                  {/* Hologram scanlines */}
                  {[0, 4, 8, 12, 16].map((offset) => (
                    <line 
                      key={`holo-line-${offset}`}
                      x1="100" 
                      y1={`${52 + offset}`} 
                      x2={100 + hologramText.length * 5 + 10} 
                      y2={`${52 + offset}`} 
                      stroke="#33DDFF" 
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
            fill="#33DDFF"
            filter="url(#tinyGlow)"
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