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
        viewBox="0 0 120 160" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Enhanced metallic gradient fills with realistic lighting */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAEEF5" />
            <stop offset="50%" stopColor="#D0D8E8" />
            <stop offset="100%" stopColor="#B8C0D9" />
          </linearGradient>
          
          <linearGradient id="bodyGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C0C8D8" />
            <stop offset="50%" stopColor="#A8B0C8" />
            <stop offset="100%" stopColor="#8090B0" />
          </linearGradient>
          
          <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8E0F0" />
            <stop offset="50%" stopColor="#B8C8E0" />
            <stop offset="100%" stopColor="#99AACC" />
          </linearGradient>
          
          <linearGradient id="metallicGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B0B8D0" />
            <stop offset="50%" stopColor="#8898B8" />
            <stop offset="100%" stopColor="#6A7A9E" />
          </linearGradient>
          
          <linearGradient id="metallicGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8F0FF" />
            <stop offset="50%" stopColor="#D0E0F5" />
            <stop offset="100%" stopColor="#B8CCE6" />
          </linearGradient>
          
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(220, 240, 255, 0.9)" />
            <stop offset="50%" stopColor="rgba(180, 210, 240, 0.7)" />
            <stop offset="100%" stopColor="rgba(150, 180, 220, 0.6)" />
          </linearGradient>
          
          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#55DDFF" />
            <stop offset="50%" stopColor="#33CCFF" />
            <stop offset="100%" stopColor="#00AAFF" />
          </linearGradient>
          
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33CCFF" />
            <stop offset="50%" stopColor="#00AAFF" />
            <stop offset="100%" stopColor="#0088DD" />
          </linearGradient>
          
          <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#55DDFF" />
            <stop offset="100%" stopColor="#00AAFF" />
          </linearGradient>
          
          <linearGradient id="antennaTipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#66DDFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00AAFF" stopOpacity="0.7" />
          </linearGradient>
          
          <linearGradient id="faceGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(40, 60, 100, 0.9)" />
            <stop offset="50%" stopColor="rgba(20, 40, 80, 0.8)" />
            <stop offset="100%" stopColor="rgba(10, 20, 50, 0.7)" />
          </linearGradient>
          
          {/* Detailed joint highlights */}
          <radialGradient id="jointHighlight" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
          
          {/* Panel gradients */}
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#556688" />
            <stop offset="50%" stopColor="#445577" />
            <stop offset="100%" stopColor="#334466" />
          </linearGradient>
          
          {/* Button gradients */}
          <linearGradient id="buttonGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33DD77" />
            <stop offset="100%" stopColor="#00AA55" />
          </linearGradient>
          
          <linearGradient id="buttonBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33BBEE" />
            <stop offset="100%" stopColor="#0088CC" />
          </linearGradient>
          
          <linearGradient id="buttonPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CC55DD" />
            <stop offset="100%" stopColor="#9933AA" />
          </linearGradient>
          
          <linearGradient id="buttonYellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFCC44" />
            <stop offset="100%" stopColor="#DDAA22" />
          </linearGradient>
          
          <linearGradient id="buttonOrangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8844" />
            <stop offset="100%" stopColor="#DD6622" />
          </linearGradient>
          
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
          
          {/* Joint shadow effects */}
          <filter id="jointShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
            <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
            <feComponentTransfer in="offsetBlur" result="shadow">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Enhanced eye glow effect */}
          <filter id="eyeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#33CCFF" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Holographic projection beam effect */}
          <filter id="hologramBeamGlow" x="-10%" y="-10%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#33CCFF" floodOpacity="0.6" result="color" />
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
          cy="155" 
          rx="25" 
          ry="5" 
          fill="rgba(0, 0, 50, 0.2)" 
          filter="url(#glowSmall)"
          style={{
            transformOrigin: "center",
            transform: `scale(${currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.7 : 1})`,
            opacity: currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.3 : 0.6
          }}
        />
        
        {/* ROBOT MATCHING REFERENCE IMAGE WITH BALANCED PROPORTIONS */}
        <motion.g animate={bodyControls}>
          {/* LEGS WITH PROPER PROPORTIONS */}
          <motion.g>
            {/* Left leg assembly */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.WALK
                  ? { rotate: [-5, 10, -5], y: [0, -2, 0] }
                  : {}
              }
              transition={{ duration: 0.8, repeat: 3, repeatType: "mirror" }}
              style={{ transformOrigin: '50px 130px' }}
            >
              {/* Upper leg */}
              <rect x="47" y="115" width="6" height="15" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              
              {/* Knee joint */}
              <circle cx="50" cy="130" r="3" fill="url(#bodyGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
              <circle cx="50" cy="130" r="1.5" fill="#D8E0F0" />
              
              {/* Lower leg */}
              <rect x="47" y="130" width="6" height="15" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              
              {/* Ankle joint */}
              <circle cx="50" cy="145" r="3" fill="url(#bodyGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
              <circle cx="50" cy="145" r="1.5" fill="#D8E0F0" />
              
              {/* Foot */}
              <rect x="46" y="145" width="8" height="5" rx="2" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              
              {/* Foot details */}
              <rect x="47" y="147" width="6" height="1" rx="0.5" fill="#99AACC" opacity="0.6" />
            </motion.g>
            
            {/* Right leg assembly */}
            <motion.g
              animate={
                currentSequence === ANIMATION_SEQUENCES.WALK
                  ? { rotate: [10, -5, 10], y: [0, -2, 0] }
                  : {}
              }
              transition={{ duration: 0.8, repeat: 3, repeatType: "mirror" }}
              style={{ transformOrigin: '70px 130px' }}
            >
              {/* Upper leg */}
              <rect x="67" y="115" width="6" height="15" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              
              {/* Knee joint */}
              <circle cx="70" cy="130" r="3" fill="url(#bodyGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
              <circle cx="70" cy="130" r="1.5" fill="#D8E0F0" />
              
              {/* Lower leg */}
              <rect x="67" y="130" width="6" height="15" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              
              {/* Ankle joint */}
              <circle cx="70" cy="145" r="3" fill="url(#bodyGradientDark)" stroke="#99AACC" strokeWidth="0.5" />
              <circle cx="70" cy="145" r="1.5" fill="#D8E0F0" />
              
              {/* Foot */}
              <rect x="66" y="145" width="8" height="5" rx="2" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
              
              {/* Foot details */}
              <rect x="67" y="147" width="6" height="1" rx="0.5" fill="#99AACC" opacity="0.6" />
            </motion.g>
          </motion.g>
          
          {/* MAIN BODY - SMALLER AND MORE BALANCED */}
          <g>
            {/* Lower body connection plate */}
            <rect x="40" y="115" width="40" height="3" rx="1.5" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Main torso - matching reference image with more rounded form */}
            <rect x="40" y="85" width="40" height="30" rx="5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="1" />
            
            {/* Subtle panel lines */}
            <line x1="40" y1="95" x2="80" y2="95" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="1 2" />
            <line x1="40" y1="105" x2="80" y2="105" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="1 2" />
            
            {/* Center panel with reactor */}
            <rect x="45" y="90" width="30" height="20" rx="3" fill="url(#panelGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Reactor core with glow */}
            <circle cx="60" cy="100" r="7" fill="#223344" stroke="#445566" strokeWidth="0.4" />
            <circle cx="60" cy="100" r="6" fill="url(#coreGradient)" filter="url(#glowMedium)" />
            
            <motion.circle 
              cx="60" 
              cy="100" 
              r="5" 
              fill="#33CCFF" 
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror"
              }}
              filter="url(#glowSmall)"
            />
            
            <motion.circle 
              cx="60" 
              cy="100" 
              r="3" 
              fill="#66EEFF" 
              animate={{
                opacity: [0.8, 1, 0.8],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            />
            
            <motion.circle 
              cx="60" 
              cy="100" 
              r="1.5" 
              fill="white" 
              animate={{
                opacity: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            />
            
            {/* Control panel button row */}
            <g>
              {[
                { x: 48, color: "url(#buttonGreenGradient)" },
                { x: 53, color: "url(#buttonBlueGradient)" },
                { x: 58, color: "url(#buttonPurpleGradient)" },
                { x: 63, color: "url(#buttonYellowGradient)" },
                { x: 68, color: "url(#buttonOrangeGradient)" }
              ].map((button, i) => (
                <motion.rect
                  key={`button-${i}`}
                  x={button.x}
                  y="110"
                  width="3"
                  height="3"
                  rx="1"
                  fill={button.color}
                  stroke="#AABBDD"
                  strokeWidth="0.2"
                  animate={{
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 1.5 + i * 0.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.2
                  }}
                  filter="url(#glowTiny)"
                />
              ))}
            </g>
          </g>
          
          {/* ARM CONNECTIONS WITH PROPER PROPORTIONS */}
          {/* Left arm assembly */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '40px 85px' }}
          >
            {/* Shoulder joint */}
            <circle cx="40" cy="85" r="4" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="40" cy="85" r="2" fill="#D8E0F0" />
            
            {/* Upper arm */}
            <rect x="37" y="89" width="6" height="12" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Elbow joint */}
            <circle cx="40" cy="101" r="3" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="40" cy="101" r="1.5" fill="#D8E0F0" />
            
            {/* Forearm */}
            <rect x="37" y="101" width="6" height="12" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Wrist joint */}
            <circle cx="40" cy="113" r="3" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="40" cy="113" r="1.5" fill="#D8E0F0" />
            
            {/* Hand */}
            <rect x="37" y="113" width="6" height="7" rx="2" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Finger details */}
            <rect x="38" y="120" width="1" height="2" rx="0.5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.2" />
            <rect x="39.5" y="120" width="1" height="2" rx="0.5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.2" />
            <rect x="41" y="120" width="1" height="2" rx="0.5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.2" />
          </motion.g>
          
          {/* Right arm assembly */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '80px 85px' }}
          >
            {/* Shoulder joint */}
            <circle cx="80" cy="85" r="4" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="80" cy="85" r="2" fill="#D8E0F0" />
            
            {/* Upper arm */}
            <rect x="77" y="89" width="6" height="12" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Elbow joint */}
            <circle cx="80" cy="101" r="3" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="80" cy="101" r="1.5" fill="#D8E0F0" />
            
            {/* Forearm */}
            <rect x="77" y="101" width="6" height="12" rx="3" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Wrist joint */}
            <circle cx="80" cy="113" r="3" fill="url(#bodyGradientDark)" stroke="#AABBDD" strokeWidth="0.5" />
            <circle cx="80" cy="113" r="1.5" fill="#D8E0F0" />
            
            {/* Hand */}
            <rect x="77" y="113" width="6" height="7" rx="2" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            {/* Finger details */}
            <rect x="78" y="120" width="1" height="2" rx="0.5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.2" />
            <rect x="79.5" y="120" width="1" height="2" rx="0.5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.2" />
            <rect x="81" y="120" width="1" height="2" rx="0.5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.2" />
          </motion.g>
          
          {/* NECK CONNECTION - SHORTER FOR BETTER PROPORTIONS */}
          <rect x="50" y="75" width="20" height="10" rx="5" fill="url(#bodyGradient)" stroke="#AABBDD" strokeWidth="0.5" />
          
          {/* HEAD ASSEMBLY - LARGER AND ROUNDER */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 45px" }}
          >
            {/* Main head - much larger and rounder */}
            <ellipse 
              cx="60" 
              cy="45" 
              rx="30" 
              ry="30" 
              fill="url(#bodyGradient)" 
              stroke="#AABBDD" 
              strokeWidth="1"
            />
            
            {/* Surface details and panel lines */}
            <ellipse 
              cx="60" 
              cy="45" 
              rx="29" 
              ry="29" 
              fill="none" 
              stroke="#CCDDEE" 
              strokeWidth="0.3" 
              strokeDasharray="2 2"
            />
            
            <line x1="40" y1="45" x2="80" y2="45" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="60" y1="25" x2="60" y2="65" stroke="#AABBDD" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {/* Side panels with details */}
            <rect x="32" y="40" width="6" height="10" rx="1" fill="url(#panelGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            <rect x="82" y="40" width="6" height="10" rx="1" fill="url(#panelGradient)" stroke="#AABBDD" strokeWidth="0.5" />
            
            <circle cx="35" cy="35" r="1.5" fill="#33CCFF" filter="url(#glowTiny)" />
            <circle cx="85" cy="35" r="1.5" fill="#33CCFF" filter="url(#glowTiny)" />
            
            {/* Antenna at top */}
            <motion.g animate={antennaControls} style={{ transformOrigin: "60px 15px" }}>
              <rect x="58" y="15" width="4" height="4" rx="1" fill="url(#bodyGradientDark)" stroke="#99AACC" strokeWidth="0.3" />
              <rect x="59" y="5" width="2" height="10" rx="1" fill="url(#bodyGradientDark)" stroke="#99AACC" strokeWidth="0.3" />
              
              {/* Antenna light with glow */}
              <circle cx="60" cy="5" r="2" fill="url(#coreGradient)" filter="url(#glowMedium)" />
              
              <motion.circle 
                cx="60" 
                cy="5" 
                r="1.5" 
                fill="#33CCFF" 
                animate={{
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
                filter="url(#glowSmall)"
              />
            </motion.g>
            
            {/* Face plate - black glass area */}
            <rect x="40" y="35" width="40" height="20" rx="10" fill="url(#faceGlassGradient)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Top panel with tech details */}
            <rect x="45" y="25" width="30" height="5" rx="2.5" fill="url(#panelGradient)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Status lights on top panel */}
            <g>
              {[48, 52, 56, 60, 64, 68, 72].map((x, i) => (
                <motion.circle 
                  key={`status-light-${i}`}
                  cx={x} 
                  cy="27.5" 
                  r="1" 
                  fill={i % 2 === 0 ? "#33CCFF" : "#33DD77"}
                  animate={{
                    opacity: [0.7, 1, 0.7],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 1.5 + i * 0.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.2
                  }}
                  filter="url(#glowTiny)"
                />
              ))}
            </g>
            
            {/* Eyes with animation - matching reference image */}
            <motion.g animate={eyesControls}>
              {/* Left eye */}
              <circle cx="50" cy="45" r="6" fill="#223344" stroke="#445566" strokeWidth="0.5" />
              <circle cx="50" cy="45" r="5" fill="url(#coreGradient)" filter="url(#glowMedium)" />
              
              <motion.circle 
                cx="50" 
                cy="45" 
                r="4" 
                fill="#33CCFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
                filter="url(#glowSmall)"
              />
              
              <motion.circle 
                cx="50" 
                cy="45" 
                r="2" 
                fill="#66EEFF" 
                animate={{
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="50" 
                cy="45" 
                r="1" 
                fill="white" 
                animate={{
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              {/* Right eye */}
              <circle cx="70" cy="45" r="6" fill="#223344" stroke="#445566" strokeWidth="0.5" />
              <circle cx="70" cy="45" r="5" fill="url(#coreGradient)" filter="url(#glowMedium)" />
              
              <motion.circle 
                cx="70" 
                cy="45" 
                r="4" 
                fill="#33CCFF" 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
                filter="url(#glowSmall)"
              />
              
              <motion.circle 
                cx="70" 
                cy="45" 
                r="2" 
                fill="#66EEFF" 
                animate={{
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="70" 
                cy="45" 
                r="1" 
                fill="white" 
                animate={{
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
            </motion.g>
            
            {/* Bottom mouth/speaker panel */}
            <rect x="45" y="52" width="30" height="3" rx="1.5" fill="url(#panelGradient)" stroke="#99AACC" strokeWidth="0.5" />
            
            {/* Speaker details */}
            <g>
              {[48, 52, 56, 60, 64, 68, 72].map((x, i) => (
                <motion.rect
                  key={`speaker-${i}`}
                  x={x - 0.5}
                  y="52.5"
                  width="1"
                  height="2"
                  rx="0.5"
                  fill="#AABBDD"
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
                d="M75 45 L95 45 L95 55 L75 55 Z"
                fill="url(#coreGradient)"
                opacity="0.5"
                filter="url(#hologramBeamGlow)"
                animate={{
                  opacity: [0.4, 0.6, 0.4],
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
                    x1="75" 
                    y1={`${45 + offset}`} 
                    x2="95" 
                    y2={`${45 + offset}`} 
                    stroke="#33CCFF" 
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
                    y="40" 
                    width={hologramText.length * 5 + 10} 
                    height="20" 
                    rx="3" 
                    fill="rgba(30, 60, 100, 0.3)"
                    stroke="#33CCFF"
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                    filter="url(#glowSmall)"
                  />
                  
                  <text
                    x="105"
                    y="53"
                    fontFamily="monospace"
                    fontSize="8"
                    fill="#33CCFF"
                    filter="url(#glowSmall)"
                  >
                    {hologramText}
                  </text>
                  
                  {/* Hologram scanlines */}
                  {[0, 4, 8, 12, 16].map((offset) => (
                    <line 
                      key={`holo-line-${offset}`}
                      x1="100" 
                      y1={`${42 + offset}`} 
                      x2={100 + hologramText.length * 5 + 10} 
                      y2={`${42 + offset}`} 
                      stroke="#33CCFF" 
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
            fill="#33CCFF"
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