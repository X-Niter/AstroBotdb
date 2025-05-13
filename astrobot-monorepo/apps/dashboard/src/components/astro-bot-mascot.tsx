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
  onActivate?: () => void;
  onAnimationComplete?: () => void;
}

// Size configuration for different viewports
const SIZE_CONFIG = {
  small: {
    scale: 0.5,
    width: 120,
    height: 120,
  },
  default: {
    scale: 0.8,
    width: 150,
    height: 150,
  },
  large: {
    scale: 1,
    width: 180,
    height: 180,
  },
  xlarge: {
    scale: 1.2,
    width: 220,
    height: 220,
  },
};

export function AstroBotMascot({ 
  size = "default", 
  showText = false, // Default to not showing text as requested
  animate = true,
  showParticles = "temporary", 
  animationSequence = null, // Allow direct control of animation sequence
  onActivate,
  onAnimationComplete
}: AstroBotMascotProps) {
  // State management
  const [currentSequence, setCurrentSequence] = useState(ANIMATION_SEQUENCES.IDLE);
  const [hologramText, setHologramText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hologramParticles, setHologramParticles] = useState<{ x: number, y: number, r: number, delay: number }[]>([]);
  
  // Animation controls
  const headControls = useAnimation();
  const bodyControls = useAnimation();
  const eyesControls = useAnimation();
  const antennaControls = useAnimation();
  const hoveredRef = useRef(false);
  
  // Size based on the prop
  const dimensions = SIZE_CONFIG[size];
  
  // Update animation sequence when prop changes
  useEffect(() => {
    if (animationSequence !== null) {
      setCurrentSequence(animationSequence);
    }
  }, [animationSequence]);
  
  // Create hologram particle effects (temporary animation effects)
  useEffect(() => {
    if (currentSequence === ANIMATION_SEQUENCES.HOLOGRAM && showParticles !== "none") {
      const newParticles = Array.from({ length: 15 }, () => ({
        x: 20 + Math.random() * 70,
        y: 30 + Math.random() * 30,
        r: 0.5 + Math.random() * 1,
        delay: Math.random() * 2
      }));
      setHologramParticles(newParticles);
      
      // If particles should be temporary, clean them up after the animation
      if (showParticles === "temporary") {
        const timerId = setTimeout(() => {
          setHologramParticles([]);
        }, 3000);
        return () => clearTimeout(timerId);
      }
    }
    
    return undefined;
  }, [currentSequence, showParticles]);
  
  // Reset animation sequence after completion
  const resetAfterDelay = useCallback((delay = 3000) => {
    // If no delay, don't schedule a reset
    if (delay <= 0) return;
    
    const timer = setTimeout(() => {
      setCurrentSequence(ANIMATION_SEQUENCES.IDLE);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [onAnimationComplete]);
  
  // Handle button click to cycle through animations
  const handleClick = useCallback(() => {
    if (!animate) return;
    
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      const animations = [
        ANIMATION_SEQUENCES.GREETING,
        ANIMATION_SEQUENCES.WAVE,
        ANIMATION_SEQUENCES.JUMP,
        ANIMATION_SEQUENCES.BUILD,
        ANIMATION_SEQUENCES.REPAIR,
        ANIMATION_SEQUENCES.SCAN, 
        ANIMATION_SEQUENCES.THINK,
        ANIMATION_SEQUENCES.HOLOGRAM
      ];
      
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setCurrentSequence(randomAnimation);
      
      if (randomAnimation === ANIMATION_SEQUENCES.HOLOGRAM) {
        const messages = [
          "Hello! I'm AstroBot!",
          "Need any assistance?",
          "I can help with your server!",
          "Let's build something cool!",
          "Running diagnostics...",
          "Systems operational!"
        ];
        setHologramText(messages[Math.floor(Math.random() * messages.length)]);
      }
      
      if (randomAnimation === ANIMATION_SEQUENCES.THINK) {
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 2500);
      }
      
      // Notify parent component if provided
      if (onActivate) {
        onActivate();
      }
    } else {
      setCurrentSequence(ANIMATION_SEQUENCES.IDLE);
    }
  }, [animate, currentSequence, onActivate]);
  
  // Reset to idle after animation completes
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    
    switch (currentSequence) {
      case ANIMATION_SEQUENCES.GREETING:
        headControls.start({
          rotate: [0, -10, 0, 10, 0],
          transition: { duration: 1.5 }
        });
        cleanupFn = resetAfterDelay(2000);
        break;
        
      case ANIMATION_SEQUENCES.WAVE:
        headControls.start({
          rotate: [0, -5, 0, -5, 0],
          transition: { duration: 1.5, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        // Arms animation handled in the SVG
        cleanupFn = resetAfterDelay(5000);
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
        cleanupFn = resetAfterDelay(4000);
        break;
        
      case ANIMATION_SEQUENCES.THINK:
        // Thinking animation with a thought bubble handled in SVG
        antennaControls.start({
          opacity: [1, 0.5, 1],
          scale: [1, 1.2, 1],
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
          transition: { duration: 1, repeat: 2, repeatType: "reverse" }
        });
        cleanupFn = resetAfterDelay(4500);
        break;
        
      case ANIMATION_SEQUENCES.HOLOGRAM:
        // Hologram effect with text handled in SVG
        cleanupFn = resetAfterDelay(4000);
        break;
        
      default:
        // Reset controls for idle state
        headControls.start({ rotate: 0, y: 0 });
        bodyControls.start({ y: 0 });
        eyesControls.start({ opacity: 1, scale: 1, filter: "brightness(1)" });
        antennaControls.start({ opacity: 1, scale: 1, filter: "brightness(1)" });
        break;
    }
    
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [currentSequence, headControls, bodyControls, eyesControls, antennaControls, resetAfterDelay]);
  
  // Hover animations for interactive feel
  const handleHoverStart = useCallback(() => {
    if (!animate) return;
    
    hoveredRef.current = true;
    
    headControls.start({
      y: -3,
      transition: { duration: 0.3 }
    });
  }, [animate, headControls]);
  
  const handleHoverEnd = useCallback(() => {
    if (!animate) return;
    
    hoveredRef.current = false;
    
    // Only reset if not in another animation
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      headControls.start({
        y: 0,
        transition: { duration: 0.3 }
      });
    }
  }, [animate, currentSequence, headControls]);
  
  // Automatic idle animations for liveliness
  useEffect(() => {
    if (!animate) return undefined;
    
    // Only add idle animations when in IDLE state
    if (currentSequence !== ANIMATION_SEQUENCES.IDLE) return undefined;
    
    const interval = setInterval(() => {
      // Don't interrupt if user is hovering or another animation is playing
      if (hoveredRef.current || currentSequence !== ANIMATION_SEQUENCES.IDLE) return;
      
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
      clearInterval(interval);
    };
  }, [animate, currentSequence, headControls, eyesControls]);
  
  return (
    <div 
      className="relative inline-flex items-center"
      style={{ height: dimensions.height, cursor: animate ? 'pointer' : 'default' }}
      onClick={handleClick}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <svg 
        viewBox="0 0 120 160" 
        width={dimensions.width} 
        height={dimensions.height}
        style={{ transform: `scale(${dimensions.scale})` }}
      >
        {/* Gradient and filter definitions */}
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c5d4e8" />
            <stop offset="40%" stopColor="#a8b8d0" />
            <stop offset="70%" stopColor="#8296b2" />
            <stop offset="100%" stopColor="#637a9c" />
          </linearGradient>
          
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c5d4e8" />
            <stop offset="20%" stopColor="#a8b8d0" />
            <stop offset="50%" stopColor="#8296b2" />
            <stop offset="80%" stopColor="#637a9c" />
            <stop offset="100%" stopColor="#4c5f7d" />
          </linearGradient>
          
          <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#25EDFF" />
            <stop offset="100%" stopColor="#79E6FF" />
          </linearGradient>
          
          <linearGradient id="antennaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a9b8c7" />
            <stop offset="60%" stopColor="#7d91a9" />
            <stop offset="100%" stopColor="#5a6d88" />
          </linearGradient>
          
          <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(76, 162, 249, 0.8)" />
            <stop offset="100%" stopColor="rgba(120, 200, 255, 0.4)" />
          </linearGradient>
          
          <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d2dbe5" />
            <stop offset="30%" stopColor="#a9b8c7" />
            <stop offset="60%" stopColor="#7d91a9" />
            <stop offset="100%" stopColor="#5a6d88" />
          </linearGradient>
          
          <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a5a70" />
            <stop offset="100%" stopColor="#2c3a4f" />
          </linearGradient>
          
          <linearGradient id="legJointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#657c96" />
            <stop offset="50%" stopColor="#526a85" />
            <stop offset="100%" stopColor="#3e5269" />
          </linearGradient>
          
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
        
        <motion.g animate={bodyControls}>
          {/* Completely redesigned realistic 3D droid body based on reference images */}
          <motion.g animate={bodyControls} style={{ scale: 1.15, y: -5 }}>
            {/* Legs - with proper dynamic animation */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.JUMP 
                  ? { y: [-8, 0, -5, 0] }
                  : currentSequence === ANIMATION_SEQUENCES.WAVE
                  ? { rotate: [-2, 2, -2, 2, 0] }
                  : {}
              }
              transition={{ duration: 1, repeat: currentSequence === ANIMATION_SEQUENCES.WAVE ? 2 : 0 }}
              style={{ transformOrigin: '60px 115px' }}
            >
              {/* Enhanced left leg with HD details and realistic metallic finish */}
              <motion.g
                animate={
                  currentSequence === ANIMATION_SEQUENCES.WAVE
                    ? { rotate: [0, 15, -15, 15, 0] }
                    : {}
                }
                transition={{ duration: 1.2 }}
                style={{ transformOrigin: '52px 112px' }}
                filter="url(#legShadow)"
              >
                {/* Upper thigh with enhanced metallic finish */}
                <motion.rect
                  x="48"
                  y="106"
                  width="8"
                  height="16"
                  rx="3"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 190, 220, 0.8)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Upper leg tech details */}
                <motion.path
                  d="M50 109 L54 109 M50 112 L54 112 M50 115 L54 115 M50 118 L54 118"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* Realistic knee joint with enhanced 3D details */}
                <motion.g>
                  <motion.circle 
                    cx="52" 
                    cy="122" 
                    r="3" 
                    fill="url(#legJointGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.3" 
                  />
                  
                  <motion.circle 
                    cx="52" 
                    cy="122" 
                    r="2" 
                    fill="rgba(30, 40, 80, 0.6)"
                    stroke="rgba(180, 220, 255, 0.7)"
                    strokeWidth="0.2" 
                  />
                  
                  <motion.circle 
                    cx="52" 
                    cy="122" 
                    r="1" 
                    fill="none"
                    stroke="rgba(220, 240, 255, 0.6)"
                    strokeWidth="0.2"
                    strokeDasharray="1 0.5" 
                  />
                </motion.g>
                
                {/* Enhanced lower leg with more realistic detail */}
                <motion.rect
                  x="48"
                  y="122"
                  width="8"
                  height="18"
                  rx="2.5"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 190, 220, 0.8)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Lower leg tech details */}
                <motion.path
                  d="M50 125 L54 125 M50 128 L54 128 M50 131 L54 131 M50 134 L54 134 M50 137 L54 137"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* Enhanced ankle joint */}
                <motion.circle
                  cx="52"
                  cy="140"
                  r="1.5"
                  fill="url(#legJointGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                {/* Enhanced foot with realistic 3D shape */}
                <motion.path
                  d="M48 140 L57 140 L58 143 L47 143 Z"
                  fill="url(#shadowGradient)"
                  stroke="rgba(180, 190, 220, 0.8)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Foot details */}
                <motion.path
                  d="M49 141.5 L56 141.5"
                  stroke="rgba(220, 240, 255, 0.4)"
                  strokeWidth="0.2"
                />
              </motion.g>
              
              {/* Enhanced right leg with HD details matching the left leg */}
              <motion.g
                animate={
                  currentSequence === ANIMATION_SEQUENCES.WAVE
                    ? { rotate: [0, -15, 15, -15, 0] }
                    : {}
                }
                transition={{ duration: 1.2 }}
                style={{ transformOrigin: '68px 112px' }}
                filter="url(#legShadow)"
              >
                {/* Upper thigh with enhanced metallic finish */}
                <motion.rect
                  x="64"
                  y="106"
                  width="8"
                  height="16" 
                  rx="3"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 190, 220, 0.8)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Upper leg tech details */}
                <motion.path
                  d="M66 109 L70 109 M66 112 L70 112 M66 115 L70 115 M66 118 L70 118"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* Realistic knee joint with enhanced 3D details */}
                <motion.g>
                  <motion.circle 
                    cx="68" 
                    cy="122" 
                    r="3" 
                    fill="url(#legJointGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.3" 
                  />
                  
                  <motion.circle 
                    cx="68" 
                    cy="122" 
                    r="2" 
                    fill="rgba(30, 40, 80, 0.6)"
                    stroke="rgba(180, 220, 255, 0.7)"
                    strokeWidth="0.2" 
                  />
                  
                  <motion.circle 
                    cx="68" 
                    cy="122" 
                    r="1" 
                    fill="none"
                    stroke="rgba(220, 240, 255, 0.6)"
                    strokeWidth="0.2"
                    strokeDasharray="1 0.5" 
                  />
                </motion.g>
                
                {/* Enhanced lower leg with more realistic detail */}
                <motion.rect
                  x="64"
                  y="122"
                  width="8"
                  height="18"
                  rx="2.5"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 190, 220, 0.8)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Lower leg tech details */}
                <motion.path
                  d="M66 125 L70 125 M66 128 L70 128 M66 131 L70 131 M66 134 L70 134 M66 137 L70 137"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* Enhanced ankle joint */}
                <motion.circle
                  cx="68"
                  cy="140"
                  r="1.5"
                  fill="url(#legJointGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                {/* Enhanced foot with realistic 3D shape */}
                <motion.path
                  d="M64 140 L73 140 L74 143 L63 143 Z"
                  fill="url(#shadowGradient)"
                  stroke="rgba(180, 190, 220, 0.8)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Foot details */}
                <motion.path
                  d="M65 141.5 L72 141.5"
                  stroke="rgba(220, 240, 255, 0.4)"
                  strokeWidth="0.2"
                />
              </motion.g>
            </motion.g>
            
            {/* Main metallic body chassis with 3D look */}
            <motion.path
              d="M45 65 C45 65, 45 65, 48 65 L72 65 C75 65, 75 65, 75 70 
                 L75 100 C75 103, 72 105, 70 105 L50 105 C48 105, 45 103, 45 100 Z"
              fill="url(#metallicGradient)"
              filter="url(#glowTiny)"
              stroke="rgba(220, 230, 255, 0.7)"
              strokeWidth="0.3"
            />
            
            {/* 3D effect highlights for body */}
            <motion.path
              d="M47 68 L73 68 L73 95 C73 97, 72 98, 70 98 L50 98 C48 98, 47 97, 47 95 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="0.3"
            />
            
            {/* Detailed armor plating seams and panel lines for 3D effect */}
            <motion.path
              d="M45 75 L75 75 M45 85 L75 85 M45 95 L75 95"
              stroke="rgba(180, 200, 255, 0.7)"
              strokeWidth="0.4"
            />
            
            {/* Side 3D panel detailing with metallic accents */}
            <motion.path
              d="M45 75 L47 75 L47 95 L45 95"
              fill="none"
              stroke="rgba(190, 210, 255, 0.8)"
              strokeWidth="0.5"
            />
            
            <motion.path
              d="M75 75 L73 75 L73 95 L75 95"
              fill="none"
              stroke="rgba(190, 210, 255, 0.8)"
              strokeWidth="0.5"
            />
            
            {/* Central reactor core with enhanced pulsing energy effect */}
            <motion.circle
              cx="60"
              cy="85"
              r="7"
              fill="rgba(76, 172, 249, 0.3)"
              stroke="rgba(120, 240, 255, 0.7)"
              strokeWidth="0.5"
              animate={{ 
                opacity: [0.8, 1, 0.8],
                r: [7, 7.5, 7],
                fill: ["rgba(76, 182, 249, 0.3)", "rgba(76, 202, 249, 0.4)", "rgba(76, 182, 249, 0.3)"]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              filter="url(#glowMedium)"
            />
            
            {/* Reactor core inner glow with HD detail */}
            <motion.circle
              cx="60"
              cy="85"
              r="4"
              fill="rgba(40, 230, 255, 0.8)"
              filter="url(#glowMedium)"
              animate={{ 
                opacity: [0.8, 1, 0.8],
                r: [4, 4.5, 4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            {/* HD inner reactor core with bright center */}
            <motion.circle
              cx="60"
              cy="85"
              r="2"
              fill="rgba(210, 255, 255, 0.9)"
              animate={{ 
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            {/* Realistic droid shoulder plates with metallic finish */}
            <motion.path
              d="M45 72 Q45 65, 50 65 L70 65 Q75 65, 75 72 L75 75 L45 75 Z"
              fill="url(#metallicGradient)"
              stroke="rgba(180, 200, 255, 0.7)"
              strokeWidth="0.5"
            />
            
            {/* Shoulder tech panel with lights */}
            <motion.rect
              x="48"
              y="68"
              width="24"
              height="4"
              rx="1"
              fill="rgba(30, 40, 90, 0.7)"
              stroke="rgba(140, 210, 255, 0.7)"
              strokeWidth="0.4"
            />
            
            {/* Indicator lights on shoulder panel */}
            <motion.circle
              cx="52"
              cy="70"
              r="1"
              fill="rgba(0, 255, 180, 0.8)"
              animate={{ opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <motion.circle
              cx="58"
              cy="70"
              r="1"
              fill="rgba(120, 220, 255, 0.8)"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            
            <motion.circle
              cx="64"
              cy="70"
              r="1"
              fill="rgba(255, 100, 255, 0.8)"
              animate={{ opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </motion.g>
          
          {/* Enhanced 3D droid head with better metallic details */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 50px" }}
          >
            {/* Enhanced neck with more realistic details */}
            <motion.path
              d="M54 60 
                 C54 59, 55 58, 60 58
                 C65 58, 66 59, 66 60
                 L66 65 L54 65 Z"
              fill="url(#headGradient)"
              stroke="rgba(220, 230, 255, 0.7)"
              strokeWidth="0.5"
            />
            
            {/* Neck joint details */}
            <motion.path
              d="M57 60 L57 64 M60 59 L60 64 M63 60 L63 64"
              stroke="rgba(180, 200, 240, 0.6)"
              strokeWidth="0.3"
              strokeLinecap="round"
            />
            
            {/* Head base with realistic 3D shape following the reference image */}
            <motion.path
              d="M45 35 
                 C45 25, 50 20, 60 20 
                 C70 20, 75 25, 75 35
                 C75 45, 70 55, 60 55
                 C50 55, 45 45, 45 35
                 Z"
              fill="url(#headGradient)"
              stroke="rgba(220, 230, 255, 0.7)"
              strokeWidth="0.5"
              filter="url(#glowTiny)"
            />
            
            {/* Head panels with HD detail */}
            <motion.path
              d="M46 35
                 C46 26, 51 21, 60 21
                 C69 21, 74 26, 74 35
                 C74 44, 69 52, 60 52
                 C51 52, 46 44, 46 35
                 Z"
              fill="none"
              stroke="rgba(180, 220, 255, 0.6)"
              strokeWidth="0.2"
              strokeDasharray="0.5 0.5"
            />
            
            {/* Face plate with metallic details matching reference */}
            <motion.path
              d="M48 32
                 C48 28, 53 24, 60 24
                 C67 24, 72 28, 72 32
                 C72 42, 67 49, 60 49
                 C53 49, 48 42, 48 32
                 Z"
              fill="url(#headGradient)"
              stroke="rgba(180, 200, 255, 0.7)"
              strokeWidth="0.4"
              filter="url(#glowTiny)"
            />
            
            {/* Additional head detail lines */}
            <motion.path
              d="M48 32 L72 32 M48 36 L72 36"
              stroke="rgba(220, 240, 255, 0.5)"
              strokeWidth="0.3"
              strokeDasharray="1 0.5"
            />
            
            {/* Top head panel with tech details */}
            <motion.path
              d="M49 27 
                 C52 24, 56 22, 60 22
                 C64 22, 68 24, 71 27
                 L70 25
                 C66 22, 63 21, 60 21
                 C57 21, 54 22, 50 25
                 Z"
              fill="rgba(40, 50, 120, 0.7)"
              stroke="rgba(180, 200, 255, 0.5)"
              strokeWidth="0.3"
            />
            
            {/* Advanced eye system with holographic projector matching reference image */}
            <motion.g animate={eyesControls}>
              {/* Enhanced eye socket with bevel effect */}
              <motion.rect
                x="49"
                y="29"
                width="22"
                height="12"
                rx="6"
                fill="rgba(20, 30, 50, 0.9)"
                stroke="rgba(100, 140, 255, 0.7)"
                strokeWidth="0.5"
                filter="url(#glowTiny)"
              />
              
              {/* Eye visor details */}
              <motion.rect
                x="50"
                y="30"
                width="20"
                height="10"
                rx="5"
                fill="none"
                stroke="rgba(160, 190, 255, 0.6)"
                strokeWidth="0.3"
                strokeDasharray="0.8 0.8"
              />
              
              {/* Left eye with enhanced inner glow and details */}
              <motion.g>
                <motion.circle
                  cx="55"
                  cy="35"
                  r="4"
                  fill="url(#eyeGradient)"
                  filter="url(#glowSmall)"
                  stroke="rgba(150, 230, 255, 0.8)"
                  strokeWidth="0.3"
                />
                
                {/* Iris detail - concentric rings */}
                <motion.circle
                  cx="55"
                  cy="35"
                  r="3"
                  fill="none"
                  stroke="rgba(80, 200, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                <motion.circle
                  cx="55"
                  cy="35"
                  r="2"
                  fill="none"
                  stroke="rgba(80, 200, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                {/* Pupil with dynamic animation */}
                <motion.circle
                  cx="55"
                  cy="35"
                  r="1.2"
                  fill="rgba(240, 250, 255, 0.9)"
                  animate={{ r: [1.2, 1.4, 1.2] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              </motion.g>
              
              {/* Right eye with enhanced inner glow and details */}
              <motion.g>
                <motion.circle
                  cx="65"
                  cy="35"
                  r="4"
                  fill="url(#eyeGradient)"
                  filter="url(#glowSmall)"
                  stroke="rgba(150, 230, 255, 0.8)"
                  strokeWidth="0.3"
                />
                
                {/* Iris detail - concentric rings */}
                <motion.circle
                  cx="65"
                  cy="35"
                  r="3"
                  fill="none"
                  stroke="rgba(80, 200, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                <motion.circle
                  cx="65"
                  cy="35"
                  r="2"
                  fill="none"
                  stroke="rgba(80, 200, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                {/* Pupil with dynamic animation */}
                <motion.circle
                  cx="65"
                  cy="35"
                  r="1.2"
                  fill="rgba(240, 250, 255, 0.9)"
                  animate={{ r: [1.2, 1.4, 1.2] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.3
                  }}
                />
              </motion.g>
              
              {/* Eye highlights for enhanced 3D look */}
              <motion.circle
                cx="54"
                cy="34"
                r="1"
                fill="rgba(255, 255, 255, 0.9)"
              />
              
              <motion.circle
                cx="64"
                cy="34"
                r="1"
                fill="rgba(255, 255, 255, 0.9)"
              />
              
              {/* Tech scanlines in the visor */}
              <motion.path
                d="M52 32 L68 32 M52 38 L68 38"
                stroke="rgba(100, 210, 255, 0.4)"
                strokeWidth="0.3"
                strokeDasharray="0.8 0.8"
              />
            </motion.g>
            
            {/* Ultra-detailed HD antenna with advanced futuristic tech features and scanning capabilities */}
            <motion.g 
              animate={antennaControls}
              whileHover={{ 
                rotateZ: [0, 5, -5, 0],
                transition: { duration: 2, repeat: Infinity }
              }}
            >
              {/* Advanced multi-segment shaft with realistic metallic connections */}
              <motion.path
                d="M59 15 
                   C59 15, 59 15, 59 16
                   L59 22
                   C59 22, 59 22, 59 22"
                fill="url(#antennaGradient)"
                stroke="rgba(180, 220, 255, 0.7)"
                strokeWidth="0.3"
                filter="url(#glowTiny)"
              />
              
              <motion.path
                d="M61 15 
                   C61 15, 61 15, 61 16
                   L61 22
                   C61 22, 61 22, 61 22"
                fill="url(#antennaGradient)"
                stroke="rgba(180, 220, 255, 0.7)"
                strokeWidth="0.3"
                filter="url(#glowTiny)"
              />
              
              {/* Enhanced antenna base connector with more detailed tech appearance */}
              <motion.path
                d="M57.5 21
                   C57.5 21, 57.5 21, 58 21
                   L62 21
                   C62.5 21, 62.5 21, 62.5 21.5
                   L62.5 22.5
                   C62.5 23, 62.5 23, 62 23
                   L58 23
                   C57.5 23, 57.5 23, 57.5 22.5
                   Z"
                fill="url(#metallicGradient)"
                stroke="rgba(180, 220, 255, 0.7)"
                strokeWidth="0.3"
                filter="url(#glowTiny)"
              />
              
              {/* Advanced tech segment rings along the antenna shaft */}
              <motion.g>
                {/* Ring 1 */}
                <motion.rect
                  x="58.5"
                  y="16.5"
                  width="3"
                  height="0.8"
                  rx="0.4"
                  fill="rgba(30, 40, 70, 0.8)"
                  stroke="rgba(180, 220, 255, 0.8)"
                  strokeWidth="0.2"
                />
                
                {/* Ring 2 */}
                <motion.rect
                  x="58.5"
                  y="18.5"
                  width="3"
                  height="0.8"
                  rx="0.4"
                  fill="rgba(30, 40, 70, 0.8)"
                  stroke="rgba(180, 220, 255, 0.8)"
                  strokeWidth="0.2"
                />
                
                {/* Ring 3 */}
                <motion.rect
                  x="58.5"
                  y="20.5"
                  width="3"
                  height="0.8"
                  rx="0.4"
                  fill="rgba(30, 40, 70, 0.8)"
                  stroke="rgba(180, 220, 255, 0.8)"
                  strokeWidth="0.2"
                />
              </motion.g>
              
              {/* Antenna detailed tech panels and scan lines */}
              <motion.path
                d="M59 17 L61 17 M59 19 L61 19"
                stroke="rgba(180, 220, 255, 0.8)"
                strokeWidth="0.3"
              />
              
              {/* Middle multi-layer tech ring with dynamic animation */}
              <motion.g>
                <motion.circle
                  cx="60"
                  cy="18"
                  r="2.2"
                  fill="rgba(20, 30, 60, 0.6)"
                  stroke="rgba(120, 200, 255, 0.8)"
                  strokeWidth="0.4"
                />
                
                <motion.circle
                  cx="60"
                  cy="18"
                  r="1.6"
                  fill="none"
                  stroke="rgba(100, 180, 255, 0.9)"
                  strokeWidth="0.3"
                  animate={{ 
                    opacity: [0.6, 0.9, 0.6],
                    rotate: [0, 180]
                  }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                  }}
                />
                
                <motion.circle
                  cx="60"
                  cy="18"
                  r="1.2"
                  fill="none"
                  stroke="rgba(140, 220, 255, 0.9)"
                  strokeWidth="0.2"
                  strokeDasharray="0.8 0.8"
                  animate={{ 
                    rotate: [0, -180]
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </motion.g>
              
              {/* Enhanced advanced glowing tip with sophisticated pulsing and scanning effect */}
              <motion.circle
                cx="60"
                cy="14"
                r="2.5"
                fill="rgba(20, 220, 255, 0.7)"
                stroke="rgba(150, 230, 255, 0.8)"
                strokeWidth="0.4"
                filter="url(#glowMedium)"
                animate={{ 
                  opacity: [0.7, 1, 0.7],
                  r: [2.5, 2.8, 2.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              {/* Inner dynamic glowing tip core with advanced particle effect */}
              <motion.g>
                <motion.circle
                  cx="60"
                  cy="14"
                  r="1.5"
                  fill="rgba(180, 250, 255, 0.9)"
                  filter="url(#glowSmall)"
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                {/* Central bright dot */}
                <motion.circle
                  cx="60"
                  cy="14"
                  r="0.6"
                  fill="rgba(240, 255, 255, 1)"
                  filter="url(#glowSmall)"
                  animate={{ 
                    opacity: [0.9, 1, 0.9]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                {/* Scanning energy beam - visible only during SCAN animation */}
                {currentSequence === ANIMATION_SEQUENCES.SCAN && (
                  <motion.path
                    d="M59 12 L61 12 L65 8 L55 8 Z"
                    fill="rgba(100, 220, 255, 0.2)"
                    stroke="rgba(150, 230, 255, 0.3)"
                    strokeWidth="0.2"
                    filter="url(#glowMedium)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                )}
              </motion.g>
            </motion.g>
          </motion.g>
          
          {/* 3D Droid Arms - always visible like in reference images */}
          <motion.g style={{ scale: 1.15, y: -5 }}>
            {/* Left arm with enhanced HD 3D metallic finish and properly connected joints matching reference */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.WAVE 
                ? { 
                    rotate: [0, -20, 0, -20, 0],
                    translateX: -3,
                    translateY: 3
                  }
                : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                  currentSequence === ANIMATION_SEQUENCES.REPAIR
                ? {
                    rotate: [0, -10, -5, -10, 0],
                    translateY: [0, 3, 2, 3, 0]
                  }
                : { rotate: 0 }
              }
              transition={
                currentSequence === ANIMATION_SEQUENCES.WAVE
                ? { 
                    duration: 1.5,
                    repeat: 3,
                    repeatType: "loop"
                  }
                : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                  currentSequence === ANIMATION_SEQUENCES.REPAIR
                ? {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }
                : {}
              }
              style={{ originX: "100%", originY: 0 }}
            >
              {/* Enhanced 3D arm segment with seamless metallic finish */}
              <motion.g>
                {/* Seamless arm connector to shoulder with continuous metallic surface */}
                <motion.path
                  d="M46 75
                     C45 75, 45 76, 45 77
                     L45 79
                     C45 79, 45 79, 44.5 79.5"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Enhanced 3D upper arm with metallic finish */}
                <motion.path
                  d="M35 78 
                     C35 76, 36 75, 38 75 
                     L41 75 
                     C43 75, 44 76, 44 78
                     L44 92
                     C44 94, 43 95, 41 95
                     L38 95
                     C36 95, 35 94, 35 92
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(220, 230, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* 3D arm panel details */}
                <motion.path
                  d="M37 80 L42 80 M37 85 L42 85 M37 90 L42 90"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* 3D highlight for arm creating realistic shadow and light */}
                <motion.path
                  d="M36 77 
                     C36 76.5, 36.5 76, 37 76 
                     L42 76 
                     C42.5 76, 43 76.5, 43 77
                     L43 93
                     C43 93.5, 42.5 94, 42 94
                     L37 94
                     C36.5 94, 36 93.5, 36 93
                     Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="0.2"
                />
                
                {/* Expanded seamless metallic 3D elbow joint connector with continuous surface to forearm */}
                <motion.path
                  d="M35 93.5
                     C35 93.5, 38 90, 41 92
                     Q43 93, 41 95
                     C41 97, 39 98, 37 98
                     Q35 98, 35 96
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* Enhanced joint details with tech pattern */}
                <motion.circle
                  cx="39.5"
                  cy="95"
                  r="2.5"
                  fill="none"
                  stroke="rgba(220, 240, 255, 0.6)"
                  strokeWidth="0.2"
                  strokeDasharray="1 0.5"
                />
                
                <motion.circle
                  cx="39.5"
                  cy="95"
                  r="1.5"
                  fill="rgba(30, 40, 80, 0.6)"
                  stroke="rgba(180, 220, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                {/* Joint connector to forearm - ensuring seamless connection */}
                <motion.path
                  d="M38.5 97
                     C38.5 98, 38.5 99, 39 99.5
                     Q39.5 100, 40 99.5"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
              </motion.g>
              
              {/* Forearm segment with realistic articulation and enhanced connection to elbow */}
              <motion.g
                animate={
                  currentSequence === ANIMATION_SEQUENCES.WAVE
                  ? { rotate: [0, -40, 0, -40, 0] }
                  : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                    currentSequence === ANIMATION_SEQUENCES.REPAIR
                  ? { rotate: [0, -15, -30, -15, 0] }
                  : { rotate: -5 } // Default slight bend for more natural pose
                }
                transition={
                  currentSequence === ANIMATION_SEQUENCES.WAVE
                  ? { 
                      duration: 1.5,
                      repeat: 3,
                      repeatType: "loop",
                      delay: 0.1
                    }
                  : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                    currentSequence === ANIMATION_SEQUENCES.REPAIR
                  ? {
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "mirror"
                    }
                  : {}
                }
                style={{ originX: "50%", originY: 0, x: 39.5, y: 95 }}
              >
                {/* Enhanced 3D Forearm with seamless connection */}
                <motion.path
                  d="M36 0 
                     C36 0, 36 0, 38 0 
                     L41 0 
                     C43 0, 43 0, 43 2
                     L43 13
                     C43 15, 43 15, 41 15
                     L38 15
                     C36 15, 36 15, 36 13
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(220, 230, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* Forearm tech details */}
                <motion.path
                  d="M37 4 L42 4 M37 8 L42 8 M37 12 L42 12"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* Enhanced forearm highlight for realism */}
                <motion.path
                  d="M37 1 
                     L42 1 
                     L42 14
                     L37 14
                     Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="0.2"
                />
                
                {/* HD Hand component with enhanced tech details and seamless wrist connection */}
                <motion.path
                  d="M35 15
                     C35 15, 35 15, 36 15
                     L44 15
                     C45 15, 45 15, 45 16
                     L45 20
                     C45 21, 45 21, 44 21
                     L36 21
                     C35 21, 35 21, 35 20
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* Hand panel tech details */}
                <motion.path
                  d="M37 17 L43 17 M37 19 L43 19"
                  stroke="rgba(180, 220, 255, 0.5)"
                  strokeWidth="0.2"
                />
                
                {/* Enhanced realistic fingers with better articulation */}
                <motion.g>
                  {/* First finger with detailed joint */}
                  <motion.rect
                    x="36"
                    y="21"
                    width="2"
                    height="4"
                    rx="1"
                    fill="url(#metallicGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.2"
                    filter="url(#glowTiny)"
                  />
                  
                  {/* Second finger with detailed joint */}
                  <motion.rect
                    x="39"
                    y="21"
                    width="2"
                    height="5"
                    rx="1"
                    fill="url(#metallicGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.2"
                    filter="url(#glowTiny)"
                  />
                  
                  {/* Third finger with detailed joint */}
                  <motion.rect
                    x="42"
                    y="21"
                    width="2"
                    height="4"
                    rx="1"
                    fill="url(#metallicGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.2"
                    filter="url(#glowTiny)"
                  />
                  
                  {/* Finger joint details */}
                  <motion.path
                    d="M37 23 L37 23.5 M40 23 L40 23.5 M43 23 L43 23.5"
                    stroke="rgba(220, 240, 255, 0.6)"
                    strokeWidth="0.2"
                  />
                </motion.g>
              </motion.g>
            </motion.g>
            
            {/* Right arm with enhanced HD 3D metallic finish and properly connected joints matching reference */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.THINK
                ? { 
                    rotate: [0, 20, 15, 20, 0],
                    translateX: 3,
                    translateY: -3
                  }
                : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                  currentSequence === ANIMATION_SEQUENCES.REPAIR
                ? {
                    rotate: [0, 10, 5, 10, 0],
                    translateY: [0, 3, 2, 3, 0]
                  }
                : {}
              }
              transition={
                currentSequence === ANIMATION_SEQUENCES.THINK
                ? { 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }
                : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                  currentSequence === ANIMATION_SEQUENCES.REPAIR
                ? {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.5
                  }
                : {}
              }
              style={{ originX: 0, originY: 0 }}
            >
              {/* Enhanced 3D arm segment with seamless metallic finish */}
              <motion.g>
                {/* Seamless arm connector to shoulder with continuous metallic surface */}
                <motion.path
                  d="M74 75
                     C75 75, 75 76, 75 77
                     L75 79
                     C75 79, 75 79, 75.5 79.5"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.5"
                  filter="url(#glowTiny)"
                />
                
                {/* Enhanced 3D upper arm with metallic finish */}
                <motion.path
                  d="M76 78 
                     C76 76, 77 75, 79 75 
                     L82 75 
                     C84 75, 85 76, 85 78
                     L85 92
                     C85 94, 84 95, 82 95
                     L79 95
                     C77 95, 76 94, 76 92
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(220, 230, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* 3D arm panel details */}
                <motion.path
                  d="M78 80 L83 80 M78 85 L83 85 M78 90 L83 90"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* 3D highlight for arm creating realistic shadow and light */}
                <motion.path
                  d="M77 77 
                     C77 76.5, 77.5 76, 78 76 
                     L83 76 
                     C83.5 76, 84 76.5, 84 77
                     L84 93
                     C84 93.5, 83.5 94, 83 94
                     L78 94
                     C77.5 94, 77 93.5, 77 93
                     Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="0.2"
                />
                
                {/* Expanded seamless metallic 3D elbow joint connector with continuous surface to forearm */}
                <motion.path
                  d="M85 93.5
                     C85 93.5, 82 90, 79 92
                     Q77 93, 79 95
                     C79 97, 81 98, 83 98
                     Q85 98, 85 96
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* Enhanced joint details with tech pattern */}
                <motion.circle
                  cx="80.5"
                  cy="95"
                  r="2.5"
                  fill="none"
                  stroke="rgba(220, 240, 255, 0.6)"
                  strokeWidth="0.2"
                  strokeDasharray="1 0.5"
                />
                
                <motion.circle
                  cx="80.5"
                  cy="95"
                  r="1.5"
                  fill="rgba(30, 40, 80, 0.6)"
                  stroke="rgba(180, 220, 255, 0.7)"
                  strokeWidth="0.2"
                />
                
                {/* Joint connector to forearm - ensuring seamless connection */}
                <motion.path
                  d="M81.5 97
                     C81.5 98, 81.5 99, 81 99.5
                     Q80.5 100, 80 99.5"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
              </motion.g>
              
              {/* Forearm segment with realistic articulation and enhanced connection to elbow */}
              <motion.g
                animate={
                  currentSequence === ANIMATION_SEQUENCES.THINK
                  ? { rotate: [0, 30, 40, 30, 0] }
                  : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                    currentSequence === ANIMATION_SEQUENCES.REPAIR
                  ? { rotate: [0, 20, 10, 20, 0] }
                  : { rotate: 5 } // Default slight bend for natural pose
                }
                transition={
                  currentSequence === ANIMATION_SEQUENCES.THINK
                  ? { 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 0.2
                    }
                  : currentSequence === ANIMATION_SEQUENCES.BUILD || 
                    currentSequence === ANIMATION_SEQUENCES.REPAIR
                  ? {
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 0.6
                    }
                  : {}
                }
                style={{ originX: "50%", originY: 0, x: 80.5, y: 95 }}
              >
                {/* Enhanced 3D Forearm with seamless connection */}
                <motion.path
                  d="M77 0 
                     C77 0, 77 0, 79 0 
                     L82 0 
                     C84 0, 84 0, 84 2
                     L84 13
                     C84 15, 84 15, 82 15
                     L79 15
                     C77 15, 77 15, 77 13
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(220, 230, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* Forearm tech details */}
                <motion.path
                  d="M78 4 L83 4 M78 8 L83 8 M78 12 L83 12"
                  stroke="rgba(180, 220, 255, 0.4)"
                  strokeWidth="0.2"
                  strokeDasharray="0.5 0.5"
                />
                
                {/* Enhanced forearm highlight for realism */}
                <motion.path
                  d="M78 1 
                     L83 1 
                     L83 14
                     L78 14
                     Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="0.2"
                />
                
                {/* HD Hand component with enhanced tech details and seamless wrist connection */}
                <motion.path
                  d="M76 15
                     C76 15, 76 15, 77 15
                     L85 15
                     C86 15, 86 15, 86 16
                     L86 20
                     C86 21, 86 21, 85 21
                     L77 21
                     C76 21, 76 21, 76 20
                     Z"
                  fill="url(#metallicGradient)"
                  stroke="rgba(180, 200, 255, 0.7)"
                  strokeWidth="0.3"
                  filter="url(#glowTiny)"
                />
                
                {/* Hand panel tech details */}
                <motion.path
                  d="M77 17 L84 17 M77 19 L84 19"
                  stroke="rgba(180, 220, 255, 0.5)"
                  strokeWidth="0.2"
                />
                
                {/* Enhanced realistic fingers with better articulation */}
                <motion.g>
                  {/* First finger with detailed joint */}
                  <motion.rect
                    x="77"
                    y="21"
                    width="2"
                    height="4"
                    rx="1"
                    fill="url(#metallicGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.2"
                    filter="url(#glowTiny)"
                  />
                  
                  {/* Second finger with detailed joint */}
                  <motion.rect
                    x="80"
                    y="21"
                    width="2"
                    height="5"
                    rx="1"
                    fill="url(#metallicGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.2"
                    filter="url(#glowTiny)"
                  />
                  
                  {/* Third finger with detailed joint */}
                  <motion.rect
                    x="83"
                    y="21"
                    width="2"
                    height="4"
                    rx="1"
                    fill="url(#metallicGradient)"
                    stroke="rgba(180, 200, 255, 0.7)"
                    strokeWidth="0.2"
                    filter="url(#glowTiny)"
                  />
                  
                  {/* Finger joint details */}
                  <motion.path
                    d="M78 23 L78 23.5 M81 23 L81 23.5 M84 23 L84 23.5"
                    stroke="rgba(220, 240, 255, 0.6)"
                    strokeWidth="0.2"
                  />
                </motion.g>
              </motion.g>
            </motion.g>
          </motion.g>
          
          {/* Enhanced 3D hologram dialog that appears from the side of mascot's head */}
          <AnimatePresence>
            {currentSequence === ANIMATION_SEQUENCES.HOLOGRAM && (
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hologram beam emanating from eye - appears only temporarily */}
                <motion.path
                  d="M65 35 L85 35 L105 27 L95 15 Z"
                  fill="rgba(120, 230, 255, 0.2)"
                  filter="url(#hologramGlow)"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ 
                    opacity: [0, 0.7, 0], 
                    scaleX: [0, 1, 1]
                  }}
                  transition={{ 
                    opacity: { duration: 1, times: [0, 0.3, 1] },
                    scaleX: { duration: 0.5 }
                  }}
                  style={{ transformOrigin: "65px 35px" }}
                />
                
                {/* Hologram dialog bubble - appears after beam effect */}
                <motion.g
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    opacity: { duration: 0.5, delay: 0.7 },
                    x: { duration: 0.5, delay: 0.7 }
                  }}
                  style={{ transformOrigin: "115px 25px" }}
                >
                  {/* Main hologram display panel with 3D effect - positioned further to the side */}
                  <motion.rect
                    x="95"
                    y="15"
                    width="40"
                    height="20"
                    rx="4"
                    fill="rgba(76, 162, 249, 0.2)"
                    stroke="rgba(120, 220, 255, 0.8)"
                    strokeWidth="0.5"
                    filter="url(#hologramGlow)"
                  />
                  
                  {/* 3D volumetric grid pattern inside display */}
                  <motion.path
                    d="M95 20 L135 20 M95 25 L135 25 M95 30 L135 30
                       M105 15 L105 35 M115 15 L115 35 M125 15 L125 35"
                    stroke="rgba(120, 220, 255, 0.3)"
                    strokeWidth="0.3"
                    strokeDasharray="2 2"
                  />
                  
                  {/* Advanced holographic UI elements */}
                  <motion.g>
                    {/* Data line separator */}
                    <motion.rect
                      x="100"
                      y="18"
                      width="30"
                      height="0.5"
                      fill="rgba(100, 200, 255, 0.9)"
                      animate={{ opacity: [0.4, 0.9, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      filter="url(#hologramGlow)"
                    />
                    
                    {/* Animated data bars - like in sci-fi interfaces */}
                    <motion.rect
                      x="100"
                      y="22"
                      width="8"
                      height="1.5"
                      rx="0.5"
                      fill="rgba(0, 255, 180, 0.7)"
                      initial={{ scaleX: 0.2, opacity: 0 }}
                      animate={{ 
                        scaleX: [0.2, 0.8, 0.5, 1, 0.7],
                        opacity: 0.9
                      }}
                      transition={{ 
                        scaleX: { duration: 3, repeat: Infinity, times: [0, 0.2, 0.4, 0.8, 1] },
                        opacity: { duration: 0.5, delay: 0.2 }
                      }}
                      style={{ transformOrigin: "left" }}
                    />
                    
                    <motion.rect
                      x="110"
                      y="22"
                      width="8"
                      height="1.5"
                      rx="0.5"
                      fill="rgba(120, 220, 255, 0.7)"
                      initial={{ scaleX: 0.2, opacity: 0 }}
                      animate={{ 
                        scaleX: [0.2, 0.7, 1, 0.6, 0.9],
                        opacity: 0.9
                      }}
                      transition={{ 
                        scaleX: { duration: 3, repeat: Infinity, times: [0, 0.3, 0.5, 0.7, 1] },
                        opacity: { duration: 0.5, delay: 0.3 }
                      }}
                      style={{ transformOrigin: "left" }}
                    />
                    
                    <motion.rect
                      x="120"
                      y="22"
                      width="8"
                      height="1.5"
                      rx="0.5"
                      fill="rgba(255, 100, 200, 0.7)"
                      initial={{ scaleX: 0.2, opacity: 0 }}
                      animate={{ 
                        scaleX: [0.2, 1, 0.6, 0.8, 0.4],
                        opacity: 0.9
                      }}
                      transition={{ 
                        scaleX: { duration: 3, repeat: Infinity, times: [0, 0.2, 0.6, 0.8, 1] },
                        opacity: { duration: 0.5, delay: 0.4 }
                      }}
                      style={{ transformOrigin: "left" }}
                    />
                  </motion.g>
                  
                  {/* Hologram text animated with typing effect */}
                  <motion.text
                    x="115"
                    y="28"
                    textAnchor="middle"
                    fill="rgba(180, 255, 255, 0.9)"
                    fontSize="3.5"
                    filter="url(#hologramGlow)"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                    }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.0 
                    }}
                  >
                    {hologramText}
                  </motion.text>
                </motion.g>
                
                {/* Hologram particles with improved effect */}
                {hologramParticles.map((particle) => (
                  <motion.circle
                    key={`${particle.x}-${particle.y}`}
                    cx={particle.x}
                    cy={particle.y}
                    r={particle.r}
                    fill="rgba(150, 220, 255, 0.7)"
                    filter="url(#glowTiny)"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0, 0.7, 0],
                      y: [particle.y, particle.y - 10]
                    }}
                    transition={{ 
                      opacity: { 
                        duration: 2, 
                        delay: particle.delay,
                        repeat: showParticles === "temporary" ? 0 : Infinity,
                        repeatDelay: 1
                      },
                      y: { 
                        duration: 2, 
                        delay: particle.delay,
                        repeat: showParticles === "temporary" ? 0 : Infinity,
                        repeatDelay: 1
                      }
                    }}
                  />
                ))}
              </motion.g>
            )}
          </AnimatePresence>
          
          {/* Thinking mode with realistic thought bubble */}
          <AnimatePresence>
            {isThinking && (
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Thought bubble connector */}
                <motion.g>
                  <motion.circle
                    cx="75"
                    cy="25"
                    r="1.5"
                    fill="rgba(255, 255, 255, 0.7)"
                  />
                  <motion.circle
                    cx="78"
                    cy="22"
                    r="2"
                    fill="rgba(255, 255, 255, 0.7)"
                  />
                </motion.g>
                
                {/* Main thought bubble */}
                <motion.circle
                  cx="85"
                  cy="15"
                  r="8"
                  fill="rgba(255, 255, 255, 0.9)"
                  filter="url(#glowSmall)"
                />
                
                {/* Thinking symbols */}
                <motion.g
                  animate={{
                    opacity: [1, 0.7, 1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }}
                >
                  <motion.text
                    x="85"
                    y="13"
                    fontSize="5"
                    fontWeight="bold"
                    fill="#3944B5"
                    textAnchor="middle"
                  >
                    ?
                  </motion.text>
                  <motion.text
                    x="87"
                    y="18"
                    fontSize="5"
                    fontWeight="bold"
                    fill="#3944B5"
                    textAnchor="middle"
                  >
                    !
                  </motion.text>
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>
        </motion.g>
        
        {/* Bot name text */}
        {showText && (
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.text
              x="60"
              y="120"
              fontFamily="monospace"
              fontSize="10"
              fontWeight="bold"
              fill="#25EDFF"
              textAnchor="middle"
              filter="url(#glowTiny)"
            >
              AstroBot
            </motion.text>
            <motion.text
              x="60"
              y="130"
              fontFamily="monospace"
              fontSize="6"
              fill="rgba(255, 255, 255, 0.9)"
              textAnchor="middle"
            >
              AI Assistant
            </motion.text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}