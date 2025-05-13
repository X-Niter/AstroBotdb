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
          {/* Main robot body gradients */}
          <linearGradient id="robotBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F6FF" />
            <stop offset="80%" stopColor="#E5E8F5" />
            <stop offset="100%" stopColor="#D5DAE5" />
          </linearGradient>
          
          <linearGradient id="robotBodyShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8DCE8" />
            <stop offset="80%" stopColor="#C8CCDA" />
            <stop offset="100%" stopColor="#B8C0CC" />
          </linearGradient>
          
          {/* Face plate gradients */}
          <linearGradient id="facePlateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B4A6B" />
            <stop offset="100%" stopColor="#1E2A45" />
          </linearGradient>
          
          {/* Blue glowing elements */}
          <linearGradient id="blueGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33D2FF" />
            <stop offset="70%" stopColor="#25A5D9" />
            <stop offset="100%" stopColor="#1C89BA" />
          </linearGradient>
          
          {/* Green button gradient */}
          <linearGradient id="greenButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33DD77" />
            <stop offset="100%" stopColor="#22AA55" />
          </linearGradient>
          
          {/* Purple button gradient */}
          <linearGradient id="purpleButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CC55DD" />
            <stop offset="100%" stopColor="#AA33BB" />
          </linearGradient>
          
          {/* Yellow/Orange button gradient */}
          <linearGradient id="yellowButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFBB33" />
            <stop offset="100%" stopColor="#FF9900" />
          </linearGradient>
          
          {/* Panel Details */}
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7788AA" />
            <stop offset="100%" stopColor="#556688" />
          </linearGradient>
          
          {/* Various glow effects */}
          <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#33D2FF" floodOpacity="0.7" result="color" />
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
          cy="155" 
          rx="25" 
          ry="5" 
          fill="rgba(0, 0, 50, 0.15)" 
          style={{
            transformOrigin: "center",
            transform: `scale(${currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.7 : 1})`,
            opacity: currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.3 : 0.6
          }}
        />
        
        {/* ROBOT MATCHING THE LATEST REFERENCE IMAGE */}
        <motion.g animate={bodyControls}>
          {/* LEGS */}
          <motion.g>
            {/* Left leg - simplified to match reference */}
            <rect x="49" y="115" width="5" height="25" rx="2.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Left foot */}
            <rect x="47" y="140" width="9" height="3" rx="1.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Leg joint detail */}
            <circle cx="51.5" cy="117" r="1.5" fill="#D8DCE8" />
            <circle cx="51.5" cy="135" r="1.5" fill="#D8DCE8" />
            
            {/* Right leg - simplified to match reference */}
            <rect x="66" y="115" width="5" height="25" rx="2.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Right foot */}
            <rect x="64" y="140" width="9" height="3" rx="1.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Leg joint detail */}
            <circle cx="68.5" cy="117" r="1.5" fill="#D8DCE8" />
            <circle cx="68.5" cy="135" r="1.5" fill="#D8DCE8" />
          </motion.g>
          
          {/* MAIN BODY - White rectangular shape with rounded corners */}
          <rect x="40" y="80" width="40" height="35" rx="5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="1" />
          
          {/* Body center blue core - matches reference */}
          <circle cx="60" cy="97" r="9" fill="url(#facePlateGradient)" stroke="#7788AA" strokeWidth="0.5" />
          <circle cx="60" cy="97" r="7" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
          
          <motion.circle 
            cx="60" 
            cy="97" 
            r="5" 
            fill="#33D2FF" 
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
            cy="97" 
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
          
          {/* Body panel details */}
          <rect x="45" y="85" width="30" height="4" rx="2" fill="#7788AA" opacity="0.3" />
          
          {/* Bottom control panel with colorful buttons */}
          <rect x="45" y="107" width="30" height="6" rx="2" fill="#7788AA" opacity="0.3" />
          
          {/* Colorful buttons - matches reference image */}
          <g>
            {[
              { x: 48, fill: "url(#greenButtonGradient)" },
              { x: 53, fill: "url(#purpleButtonGradient)" },
              { x: 58, fill: "url(#yellowButtonGradient)" },
              { x: 63, fill: "url(#blueGlowGradient)" },
              { x: 68, fill: "url(#greenButtonGradient)" }
            ].map((button, i) => (
              <motion.circle
                key={`button-${i}`}
                cx={button.x}
                cy="110"
                r="1.5"
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
          <rect x="45" y="115" width="30" height="3" rx="1.5" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
          
          {/* ARMS */}
          {/* Left arm */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '40px 85px' }}
          >
            {/* Upper arm */}
            <rect x="37" y="85" width="5" height="15" rx="2.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Arm joint */}
            <circle cx="39.5" cy="85" r="2.5" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
            <circle cx="39.5" cy="85" r="1" fill="#D8DCE8" />
            
            {/* Arm joint detail */}
            <circle cx="39.5" cy="100" r="2" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
            <circle cx="39.5" cy="100" r="0.75" fill="#D8DCE8" />
            
            {/* Lower arm */}
            <rect x="37" y="100" width="5" height="15" rx="2.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Hand */}
            <rect x="36" y="115" width="7" height="3" rx="1.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
          </motion.g>
          
          {/* Right arm */}
          <motion.g
            animate={armsControls}
            style={{ transformOrigin: '80px 85px' }}
          >
            {/* Upper arm */}
            <rect x="78" y="85" width="5" height="15" rx="2.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Arm joint */}
            <circle cx="80.5" cy="85" r="2.5" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
            <circle cx="80.5" cy="85" r="1" fill="#D8DCE8" />
            
            {/* Arm joint detail */}
            <circle cx="80.5" cy="100" r="2" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
            <circle cx="80.5" cy="100" r="0.75" fill="#D8DCE8" />
            
            {/* Lower arm */}
            <rect x="78" y="100" width="5" height="15" rx="2.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
            
            {/* Hand */}
            <rect x="77" y="115" width="7" height="3" rx="1.5" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
          </motion.g>
          
          {/* NECK - Simple connector */}
          <rect x="52" y="70" width="16" height="10" rx="3" fill="url(#robotBodyGradient)" stroke="#D8DCE8" strokeWidth="0.5" />
          
          {/* HEAD ASSEMBLY - Circle shape with details */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 45px" }}
          >
            {/* Main head - Circle with light gray/white color */}
            <circle 
              cx="60" 
              cy="45" 
              r="25" 
              fill="url(#robotBodyGradient)" 
              stroke="#D8DCE8" 
              strokeWidth="1"
            />
            
            {/* Face plate - Dark blue area for eyes and mouth */}
            <rect x="45" y="35" width="30" height="20" rx="10" fill="url(#facePlateGradient)" stroke="#7788AA" strokeWidth="0.5" />
            
            {/* Left side tech panel */}
            <rect x="35" y="40" width="6" height="10" rx="1" fill="#7788AA" opacity="0.3" />
            
            {/* Right side tech panel */}
            <rect x="79" y="40" width="6" height="10" rx="1" fill="#7788AA" opacity="0.3" />
            
            {/* Top indicator lights panel */}
            <rect x="48" y="20" width="24" height="5" rx="2.5" fill="#7788AA" opacity="0.3" />
            
            {/* Top indicator lights */}
            <g>
              {[50, 54, 58, 62, 66, 70].map((x, i) => (
                <motion.circle 
                  key={`light-${i}`}
                  cx={x} 
                  cy="22.5" 
                  r="1.5" 
                  fill={i % 2 === 0 ? "#33D2FF" : "#22A5D9"}
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
            
            {/* Antenna */}
            <motion.g animate={antennaControls} style={{ transformOrigin: "60px 15px" }}>
              <rect x="58" y="14" width="4" height="6" rx="2" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
              <rect x="59" y="7" width="2" height="7" rx="1" fill="url(#robotBodyShadow)" stroke="#D8DCE8" strokeWidth="0.5" />
              
              {/* Antenna light */}
              <circle cx="60" cy="7" r="2.5" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
              
              <motion.circle 
                cx="60" 
                cy="7" 
                r="1.5" 
                fill="#33D2FF" 
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
                cy="7" 
                r="0.7" 
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
            
            {/* EYES - Glowing blue circles */}
            <motion.g animate={eyesControls}>
              {/* Left eye */}
              <circle cx="52" cy="45" r="6" fill="#1E2A45" stroke="#7788AA" strokeWidth="0.5" />
              <circle cx="52" cy="45" r="5" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
              
              <motion.circle 
                cx="52" 
                cy="45" 
                r="3.5" 
                fill="#33D2FF" 
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
                cy="45" 
                r="1.5" 
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
              <circle cx="68" cy="45" r="6" fill="#1E2A45" stroke="#7788AA" strokeWidth="0.5" />
              <circle cx="68" cy="45" r="5" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
              
              <motion.circle 
                cx="68" 
                cy="45" 
                r="3.5" 
                fill="#33D2FF" 
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
                cy="45" 
                r="1.5" 
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
            <rect x="52" y="54" width="16" height="2" rx="1" fill="#7788AA" opacity="0.5" />
            
            <g>
              {[54, 56, 58, 60, 62, 64, 66].map((x, i) => (
                <rect
                  key={`mouth-${i}`}
                  x={x-0.5}
                  y="54"
                  width="1"
                  height="2"
                  rx="0.5"
                  fill={i % 2 === 0 ? "#33D2FF" : "#22A5D9"}
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
                d="M74 45 L95 45 L95 55 L74 55 Z"
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
                    y1={`${45 + offset}`} 
                    x2="95" 
                    y2={`${45 + offset}`} 
                    stroke="#33D2FF" 
                    strokeWidth="0.2" 
                    strokeDasharray="1 1" 
                    opacity="0.6"
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
                    stroke="#33D2FF"
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                    filter="url(#tinyGlow)"
                  />
                  
                  <text
                    x="105"
                    y="53"
                    fontFamily="monospace"
                    fontSize="8"
                    fill="#33D2FF"
                    filter="url(#tinyGlow)"
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
                      stroke="#33D2FF" 
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
            fill="#33D2FF"
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