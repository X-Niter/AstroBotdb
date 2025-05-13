import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, useSpring } from "framer-motion";
import gsap from "gsap";

// Advanced animation sequences for lifelike robot interactions
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
  WALK: "walk",
  BUILD_TEXT: "build_text",
  WIND_EFFECT: "wind_effect",
  SURPRISED: "surprised",
  HOVER: "hover",
  BLINK: "blink",
  LOOK_AROUND: "look_around",
  PROCESSING: "processing",
  ALERT: "alert",
  HAPPY: "happy",
  SAD: "sad",
  CONFUSED: "confused",
  EXPLAIN: "explain",
  TYPING: "typing"
};

// Component properties with expanded animation options
interface AstroBotMascotProps {
  size?: "small" | "default" | "large" | "xlarge";
  showText?: boolean;
  animate?: boolean;
  showParticles?: "none" | "temporary" | "typing" | "intense"; 
  animationSequence?: string | null;
  hologramText?: string | null;
  interactive?: boolean;
  emotionalState?: "neutral" | "happy" | "thinking" | "alert" | "sad" | "confused";
  metalType?: "gold" | "silver" | "copper" | "bronze" | "titanium";
  onAnimationComplete?: () => void;
  onInteraction?: (type: string) => void;
}

const AstroBotMascot: React.FC<AstroBotMascotProps> = ({
  size = "default",
  showText = true,
  animate = true,
  showParticles = "temporary",
  animationSequence = null,
  hologramText = null,
  interactive = true,
  emotionalState = "neutral",
  metalType = "gold",
  onAnimationComplete,
  onInteraction
}) => {
  // Calculate dimensions based on size
  const dimensions = {
    small: { width: 120, height: 180 },
    default: { width: 200, height: 300 },
    large: { width: 280, height: 420 },
    xlarge: { width: 360, height: 540 }
  }[size];
  
  // Animation controls for each body part
  const headControls = useAnimation();
  const eyesControls = useAnimation();
  const eyeGlowControls = useAnimation();
  const irisesControls = useAnimation();
  const pupilsControls = useAnimation();
  const eyelidsControls = useAnimation();
  const antennaControls = useAnimation();
  const bodyControls = useAnimation();
  const armsControls = useAnimation();
  const leftArmControls = useAnimation();
  const rightArmControls = useAnimation();
  const leftLegControls = useAnimation();
  const rightLegControls = useAnimation();
  const fingerControls = useAnimation();
  const hologramControls = useAnimation();
  const mouthControls = useAnimation();
  const cheekLightsControls = useAnimation();
  const panelLightsControls = useAnimation();
  const energyCoreControls = useAnimation();
  const reflectionControls = useAnimation();
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // States for animations and interactions
  const [currentSequence, setCurrentSequence] = useState<string | null>(animationSequence || ANIMATION_SEQUENCES.IDLE);
  const [hovering, setHovering] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [hologramParticles, setHologramParticles] = useState<Array<{x: number, y: number, r: number, delay: number, speed: number}>>([]);
  const [reflectionParticles, setReflectionParticles] = useState<Array<{x: number, y: number, r: number, opacity: number, delay: number}>>([]);
  const [lookingAt, setLookingAt] = useState({ x: 0, y: 0 });
  const [robotState, setRobotState] = useState({
    energyLevel: 100,
    processingLoad: 0,
    isWatching: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false
  });
  
  // Metal type configuration - colors, gradients, and reflections based on metal type
  const metalConfig = {
    gold: {
      primary: "#D4AF37",
      light: "#F7EF8A",
      medium: "#E5C100",
      dark: "#996515",
      shadow: "#705A00",
      highlight: "#FFF3B0",
      gradientLight: "#FFF3B0",
      gradientMedium: "#E6C44C",
      gradientDark: "#A67C00",
      eyeColor: "#50EEFF",
      eyeGlow: "#33DDFF"
    },
    silver: {
      primary: "#C0C0C0",
      light: "#FFFFFF",
      medium: "#D8D8D8",
      dark: "#A0A0A0",
      shadow: "#707070",
      highlight: "#F5F5F5",
      gradientLight: "#F8F8F8",
      gradientMedium: "#D0D0D0",
      gradientDark: "#A8A8A8",
      eyeColor: "#33DDFF",
      eyeGlow: "#22BBEE"
    },
    copper: {
      primary: "#B87333",
      light: "#FFC1A1",
      medium: "#D98859",
      dark: "#8C4A1E",
      shadow: "#5D3112",
      highlight: "#FFD9C2",
      gradientLight: "#FFD9C2",
      gradientMedium: "#D98859",
      gradientDark: "#8C4A1E",
      eyeColor: "#FF9933",
      eyeGlow: "#FF7700"
    },
    bronze: {
      primary: "#CD7F32",
      light: "#FFC87D",
      medium: "#E09348",
      dark: "#9C5D21",
      shadow: "#633A10",
      highlight: "#FFDCB5",
      gradientLight: "#FFDCB5",
      gradientMedium: "#E09348",
      gradientDark: "#9C5D21",
      eyeColor: "#FF9933",
      eyeGlow: "#FF7700"
    },
    titanium: {
      primary: "#878681",
      light: "#E5E4E2",
      medium: "#BFC0BF",
      dark: "#5E5E5C",
      shadow: "#3F3F3D",
      highlight: "#FFFFFF",
      gradientLight: "#E5E4E2",
      gradientMedium: "#BFC0BF",
      gradientDark: "#5E5E5C",
      eyeColor: "#7FFFFF",
      eyeGlow: "#00FFFF"
    }
  }[metalType];
  
  // Generate particles for hologram effects
  useEffect(() => {
    if (showParticles !== "none") {
      const particles = [];
      const particleCount = 
        showParticles === "typing" ? 15 : 
        showParticles === "intense" ? 30 : 20;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * 120,
          y: Math.random() * 180,
          r: Math.random() * 2 + 0.5,
          delay: Math.random() * 2,
          speed: Math.random() * 1.5 + 0.5
        });
      }
      
      setHologramParticles(particles);
    } else {
      setHologramParticles([]);
    }
  }, [showParticles]);
  
  // Generate reflection particles for the metal surfaces
  useEffect(() => {
    const particles = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 120,
        y: Math.random() * 180,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        delay: Math.random() * 10
      });
    }
    
    setReflectionParticles(particles);
  }, [metalType]);
  
  // Handle animation sequence changes
  useEffect(() => {
    if (animationSequence) {
      setCurrentSequence(animationSequence);
    }
  }, [animationSequence]);

  // Emotional state effects
  useEffect(() => {
    if (!animate) return;
    
    // Eye color/glow changes based on emotional state
    const applyEyeEffects = (glowIntensity: number, pulseSpeed: number) => {
      eyeGlowControls.start({
        filter: `blur(${glowIntensity}px)`,
        opacity: [0.7, 0.9, 0.7],
        transition: { 
          duration: pulseSpeed, 
          repeat: Infinity,
          repeatType: "mirror"
        }
      });
    };
    
    switch(emotionalState) {
      case "happy":
        pupilsControls.start({
          scale: 1.1,
          transition: { duration: 0.3 }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,42 32,38", 
          transition: { duration: 0.3 } 
        });
        cheekLightsControls.start({
          opacity: 0.7,
          scale: 1.1,
          transition: { duration: 0.5 }
        });
        applyEyeEffects(5, 2);
        break;
      
      case "thinking":
        pupilsControls.start({
          scale: 0.8,
          transition: { duration: 0.3 }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,37 32,37", 
          transition: { duration: 0.3 } 
        });
        cheekLightsControls.start({
          opacity: 0.4,
          scale: 1.0,
          transition: { duration: 0.5 }
        });
        applyEyeEffects(3, 3);
        break;
      
      case "alert":
        pupilsControls.start({
          scale: 0.7,
          transition: { duration: 0.3 }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,36 32,38", 
          transition: { duration: 0.3 } 
        });
        cheekLightsControls.start({
          opacity: [0.5, 0.9, 0.5],
          scale: [1, 1.2, 1],
          transition: { duration: 1.5, times: [0, 0.5, 1], repeat: Infinity }
        });
        applyEyeEffects(6, 1);
        break;
      
      case "sad":
        pupilsControls.start({
          scale: 0.9,
          transition: { duration: 0.3 }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,35 32,38", 
          transition: { duration: 0.3 } 
        });
        cheekLightsControls.start({
          opacity: 0.3,
          scale: 0.95,
          transition: { duration: 0.5 }
        });
        applyEyeEffects(2, 4);
        break;
      
      case "confused":
        pupilsControls.start({
          scale: 0.9,
          transition: { duration: 0.3 }
        });
        mouthControls.start({ 
          d: "M18,38 Q22,36 32,38", 
          transition: { duration: 0.3 } 
        });
        cheekLightsControls.start({
          opacity: [0.4, 0.6, 0.4],
          scale: [0.95, 1.05, 0.95],
          transition: { duration: 2, times: [0, 0.5, 1], repeat: Infinity }
        });
        applyEyeEffects(4, 2.5);
        break;
      
      case "neutral":
      default:
        pupilsControls.start({
          scale: 1,
          transition: { duration: 0.3 }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,38 32,38", 
          transition: { duration: 0.3 } 
        });
        cheekLightsControls.start({
          opacity: 0.5,
          scale: 1,
          transition: { duration: 0.5 }
        });
        applyEyeEffects(3, 3);
        break;
    }
  }, [emotionalState, animate, eyeGlowControls, pupilsControls, mouthControls, cheekLightsControls]);
  
  // Main animation control logic for sequences
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
        // Combined arm wave
        const armWaveSequence = async () => {
          await Promise.all([
            rightArmControls.start({
              rotate: [0, 30, 0],
              transition: { duration: 1, times: [0, 0.5, 1], ease: "easeInOut" }
            }),
            headControls.start({
              rotate: [0, -5, 0, 5, 0],
              transition: { duration: 1.5, times: [0, 0.25, 0.5, 0.75, 1] }
            }),
            // Synchronize eye movements with head
            irisesControls.start({
              translateX: [0, 2, 0, -2, 0],
              transition: { duration: 1.5, times: [0, 0.25, 0.5, 0.75, 1] }
            }),
            // Friendly expression
            mouthControls.start({ 
              d: "M18,38 Q25,42 32,38", 
              transition: { duration: 0.5 } 
            })
          ]);
        };
        
        armWaveSequence();
        cleanupFn = resetAfterDelay(1800);
        break;
        
      case ANIMATION_SEQUENCES.WAVE:
        // More elaborate wave with finger movement
        const complexWaveSequence = async () => {
          // Prep movement
          await Promise.all([
            rightArmControls.start({
              rotate: 15,
              transition: { duration: 0.3 }
            }),
            fingerControls.start({
              rotate: 0,
              transition: { duration: 0.3 }
            })
          ]);
          
          // Wave motion
          for (let i = 0; i < 3; i++) {
            await Promise.all([
              rightArmControls.start({
                rotate: [15, 45, 15],
                transition: { duration: 0.6, times: [0, 0.5, 1] }
              }),
              // Synchronize fingers with wave
              fingerControls.start({
                rotate: [0, -10, 0, -10, 0],
                transition: { duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] }
              }),
              // Head follows slightly
              headControls.start({
                rotate: i % 2 === 0 ? 3 : -3,
                transition: { duration: 0.6 }
              })
            ]);
          }
          
          // Return to position
          await Promise.all([
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.4 }
            }),
            headControls.start({
              rotate: 0,
              transition: { duration: 0.4 }
            })
          ]);
        };
        
        complexWaveSequence();
        // Friendly expression
        mouthControls.start({ 
          d: "M18,38 Q25,42 32,38", 
          transition: { duration: 0.3 } 
        });
        
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.JUMP:
        // Physics-based jumping animation
        const jumpSequence = async () => {
          // Pre-jump crouch
          await Promise.all([
            bodyControls.start({
              y: 5,
              scaleY: 0.95,
              transition: { duration: 0.2 }
            }),
            leftLegControls.start({
              scaleY: 0.9,
              transition: { duration: 0.2 }
            }),
            rightLegControls.start({
              scaleY: 0.9,
              transition: { duration: 0.2 }
            }),
            // Anticipation in arms
            leftArmControls.start({
              rotate: -5,
              transition: { duration: 0.2 }
            }),
            rightArmControls.start({
              rotate: 5,
              transition: { duration: 0.2 }
            })
          ]);
          
          // Jump up with easing
          await Promise.all([
            bodyControls.start({
              y: -25,
              scaleY: 1.05,
              transition: { 
                duration: 0.4, 
                ease: [0.2, 0.8, 0.7, 1] // Custom spring-like ease
              }
            }),
            leftLegControls.start({
              scaleY: 1.1,
              rotate: -5,
              transition: { duration: 0.4 }
            }),
            rightLegControls.start({
              scaleY: 1.1,
              rotate: 5,
              transition: { duration: 0.4 }
            }),
            // Arms extend during jump
            leftArmControls.start({
              rotate: -15,
              transition: { duration: 0.4 }
            }),
            rightArmControls.start({
              rotate: 15,
              transition: { duration: 0.4 }
            }),
            headControls.start({
              y: -5,
              transition: { duration: 0.4, delay: 0.05 }
            }),
            // Eyes look up
            irisesControls.start({
              translateY: -2,
              transition: { duration: 0.4 }
            })
          ]);
          
          // Hang time
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Fall down with gravity
          await Promise.all([
            bodyControls.start({
              y: 8,
              scaleY: 0.85,
              transition: { 
                duration: 0.5, 
                ease: [0.33, 1, 0.68, 1] // Heavy landing
              }
            }),
            leftLegControls.start({
              scaleY: 0.75,
              rotate: 0,
              transition: { duration: 0.5 }
            }),
            rightLegControls.start({
              scaleY: 0.75,
              rotate: 0,
              transition: { duration: 0.5 }
            }),
            // Arms react to landing
            leftArmControls.start({
              rotate: 5,
              transition: { duration: 0.5 }
            }),
            rightArmControls.start({
              rotate: -5,
              transition: { duration: 0.5 }
            }),
            headControls.start({
              y: 5,
              transition: { duration: 0.5 }
            }),
            // Eyes look down with landing
            irisesControls.start({
              translateY: 2,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Return to normal with slight bounce
          await Promise.all([
            bodyControls.start({
              y: 0,
              scaleY: 1,
              transition: { 
                duration: 0.3,
                type: "spring",
                stiffness: 300
              }
            }),
            leftLegControls.start({
              scaleY: 1,
              transition: { duration: 0.3 }
            }),
            rightLegControls.start({
              scaleY: 1,
              transition: { duration: 0.3 }
            }),
            // Reset arms
            leftArmControls.start({
              rotate: 0,
              transition: { duration: 0.3 }
            }),
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.3 }
            }),
            headControls.start({
              y: 0,
              transition: { duration: 0.3 }
            }),
            // Reset eye position
            irisesControls.start({
              translateY: 0,
              transition: { duration: 0.3 }
            })
          ]);
        };
        
        jumpSequence();
        cleanupFn = resetAfterDelay(2000);
        break;
        
      case ANIMATION_SEQUENCES.SCAN:
        // Advanced scanning animation with detailed head and eye movements
        const scanSequence = async () => {
          // Initiate scan mode - eyes brighten
          await Promise.all([
            eyeGlowControls.start({
              filter: "blur(6px)",
              opacity: 0.9,
              transition: { duration: 0.5 }
            }),
            // Eyes narrow slightly for focusing
            pupilsControls.start({
              scale: 0.8,
              transition: { duration: 0.5 }
            }),
            // Antenna activates for scanning
            antennaControls.start({
              scale: 1.2,
              filter: "brightness(1.5)",
              transition: { duration: 0.5 }
            })
          ]);
          
          // Horizontal scan pattern
          await Promise.all([
            headControls.start({
              rotate: [-10, 10, -10],
              transition: { duration: 3, times: [0, 0.5, 1] }
            }),
            // Eyes track with more precision than head
            irisesControls.start({
              translateX: [-5, 5, -5],
              transition: { duration: 3, times: [0, 0.5, 1] }
            }),
            // Pupils adjust focus constantly during scan
            pupilsControls.start({
              scale: [0.7, 0.8, 0.7, 0.9, 0.7],
              transition: { duration: 3, times: [0, 0.25, 0.5, 0.75, 1] }
            })
          ]);
          
          // Vertical scan pattern
          await Promise.all([
            headControls.start({
              rotateX: [-5, 5, -5],
              transition: { duration: 2, times: [0, 0.5, 1] }
            }),
            // Eyes track vertical movement
            irisesControls.start({
              translateY: [-3, 3, -3],
              transition: { duration: 2, times: [0, 0.5, 1] }
            })
          ]);
          
          // Complete scan - return to normal
          await Promise.all([
            headControls.start({
              rotate: 0,
              rotateX: 0,
              transition: { duration: 0.5 }
            }),
            irisesControls.start({
              translateX: 0,
              translateY: 0,
              transition: { duration: 0.5 }
            }),
            pupilsControls.start({
              scale: 1,
              transition: { duration: 0.5 }
            }),
            eyeGlowControls.start({
              filter: "blur(3px)",
              opacity: 0.7,
              transition: { duration: 0.5 }
            }),
            antennaControls.start({
              scale: 1,
              filter: "brightness(1)",
              transition: { duration: 0.5 }
            })
          ]);
        };
        
        // Change appearance during scan
        energyCoreControls.start({
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 1, times: [0, 0.5, 1], repeat: 6 }
        });
        
        scanSequence();
        setRobotState(prev => ({...prev, isProcessing: true}));
        
        cleanupFn = () => {
          resetAfterDelay(6000);
          setRobotState(prev => ({...prev, isProcessing: false}));
        };
        break;
        
      case ANIMATION_SEQUENCES.HOLOGRAM:
        // Projection animation
        hologramControls.start({
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1, 1, 0.8],
          transition: { duration: 4, times: [0, 0.15, 0.85, 1] }
        });
        
        // Coordinated eye and head movements
        const projectionSequence = async () => {
          // Focus on creating hologram
          await Promise.all([
            headControls.start({
              rotate: 5,
              transition: { duration: 0.5 }
            }),
            irisesControls.start({
              translateX: 3,
              transition: { duration: 0.5 }
            }),
            pupilsControls.start({
              scale: 0.9,
              transition: { duration: 0.5 }
            }),
            // Energy pattern for projection
            energyCoreControls.start({
              scale: 1.15,
              opacity: 1,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Maintain projection
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Return to normal
          await Promise.all([
            headControls.start({
              rotate: 0,
              transition: { duration: 0.5 }
            }),
            irisesControls.start({
              translateX: 0,
              transition: { duration: 0.5 }
            }),
            pupilsControls.start({
              scale: 1,
              transition: { duration: 0.5 }
            }),
            energyCoreControls.start({
              scale: 1,
              opacity: 0.8,
              transition: { duration: 0.5 }
            })
          ]);
        };
        
        projectionSequence();
        cleanupFn = resetAfterDelay(4500);
        break;
        
      case ANIMATION_SEQUENCES.HOVER:
        // Gentle floating hover animation
        bodyControls.start({
          y: [0, -5, 0],
          transition: { 
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
          }
        });
        
        // Subtle arm and head movements while hovering
        leftArmControls.start({
          rotate: [0, -2, 0],
          transition: { 
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: 0.5
          }
        });
        
        rightArmControls.start({
          rotate: [0, 2, 0],
          transition: { 
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: 0.5
          }
        });
        
        headControls.start({
          rotate: [0, 1, 0, -1, 0],
          transition: { 
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
          }
        });
        
        // Subtle reflection animation
        reflectionControls.start({
          opacity: [0.2, 0.4, 0.2],
          transition: {
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror"
          }
        });
        
        // No cleanup for hover - it continues until changed
        break;
        
      // Additional animation sequences...
      case ANIMATION_SEQUENCES.IDLE:
      default:
        // Reset all animations to default state
        bodyControls.start({ 
          y: 0, x: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, scaleY: 1 
        });
        headControls.start({ 
          y: 0, x: 0, rotate: 0, rotateX: 0, rotateY: 0 
        });
        leftArmControls.start({ 
          rotate: 0, y: 0 
        });
        rightArmControls.start({ 
          rotate: 0, y: 0 
        });
        leftLegControls.start({ 
          rotate: 0, y: 0, scaleY: 1 
        });
        rightLegControls.start({ 
          rotate: 0, y: 0, scaleY: 1 
        });
        
        // Apply idle reflections
        reflectionControls.start({
          opacity: 0.3,
          transition: { duration: 0.5 }
        });
        
        break;
    }
    
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [
    currentSequence, animate, headControls, eyesControls, eyeGlowControls, 
    irisesControls, pupilsControls, eyelidsControls, antennaControls, 
    bodyControls, armsControls, leftArmControls, rightArmControls, 
    leftLegControls, rightLegControls, fingerControls, mouthControls, 
    energyCoreControls, panelLightsControls, hologramControls, reflectionControls,
    emotionalState, onAnimationComplete
  ]);
  
  // Idle animations for lifelike behavior
  useEffect(() => {
    if (!animate) return;
    
    // Set up natural idle animations
    const idleInterval = setInterval(() => {
      // Only run idle animations when in idle state
      if (currentSequence !== ANIMATION_SEQUENCES.IDLE) return;
      
      // Random subtle movements
      const random = Math.random();
      
      if (random < 0.15) {
        // Head movement
        headControls.start({
          rotate: [-1, 1, 0][Math.floor(Math.random() * 3)],
          y: [-1, 0, 1][Math.floor(Math.random() * 3)],
          transition: { duration: 1, ease: "easeInOut" }
        });
      } else if (random < 0.3) {
        // Eye movement
        irisesControls.start({
          translateX: [-2, 0, 2][Math.floor(Math.random() * 3)],
          translateY: [-1, 0, 1][Math.floor(Math.random() * 3)],
          transition: { duration: 0.7, ease: "easeInOut" }
        });
      } else if (random < 0.4) {
        // Blinking
        if (!blinking) {
          setBlinking(true);
          eyelidsControls.start({
            scaleY: [0, 1, 0],
            opacity: [0, 1, 0],
            transition: { duration: 0.2, times: [0, 0.5, 1] }
          }).then(() => setBlinking(false));
        }
      } else if (random < 0.5) {
        // Antenna movement
        antennaControls.start({
          rotate: [-2, 2, 0][Math.floor(Math.random() * 3)],
          scale: [0.95, 1, 1.05][Math.floor(Math.random() * 3)],
          transition: { duration: 1.5, ease: "easeInOut" }
        });
      } else if (random < 0.65) {
        // Energy core pulse
        energyCoreControls.start({
          scale: [1, 1.1, 1],
          opacity: [0.8, 0.9, 0.8],
          transition: { duration: 2, times: [0, 0.5, 1], ease: "easeInOut" }
        });
      } else if (random < 0.75) {
        // Arm micro-movements
        const armIndex = Math.random() > 0.5 ? 0 : 1;
        if (armIndex === 0) {
          leftArmControls.start({
            rotate: [-1, 0, 1][Math.floor(Math.random() * 3)],
            transition: { duration: 1.5, ease: "easeInOut" }
          });
        } else {
          rightArmControls.start({
            rotate: [-1, 0, 1][Math.floor(Math.random() * 3)],
            transition: { duration: 1.5, ease: "easeInOut" }
          });
        }
      } else {
        // Sometimes do multiple animations together
        if (Math.random() > 0.7) {
          irisesControls.start({
            translateX: [-1, 0, 1][Math.floor(Math.random() * 3)],
            transition: { duration: 0.7, ease: "easeInOut" }
          });
          
          headControls.start({
            rotate: [-0.5, 0, 0.5][Math.floor(Math.random() * 3)],
            transition: { duration: 1, ease: "easeInOut" }
          });
        }
      }
      
      // Regular blinking regardless of other movements
      if (Math.random() < 0.1 && !blinking) {
        setBlinking(true);
        eyelidsControls.start({
          scaleY: [0, 1, 0],
          opacity: [0, 1, 0],
          transition: { duration: 0.2, times: [0, 0.5, 1] }
        }).then(() => setBlinking(false));
      }
      
    }, 2500);
    
    // Constant subtle "breathing" for the robot's body
    const breathingAnimation = () => {
      bodyControls.start({
        y: [0, -0.7, 0],
        scaleY: [1, 1.007, 1],
        transition: { 
          duration: 4, 
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut" 
        }
      });
    };
    
    // Subtle reflection animation
    const reflectionAnimation = () => {
      reflectionControls.start({
        opacity: [0.2, 0.3, 0.2],
        x: [0, 1, 0],
        y: [0, -1, 0],
        transition: { 
          duration: 8, 
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut" 
        }
      });
    };
    
    // Start the subtle animations if in idle state
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      breathingAnimation();
      reflectionAnimation();
    }
    
    return () => {
      clearInterval(idleInterval);
    };
  }, [
    animate, currentSequence, blinking, headControls, irisesControls, 
    eyelidsControls, antennaControls, bodyControls, leftArmControls,
    rightArmControls, energyCoreControls, reflectionControls
  ]);
  
  // Mouse tracking for interactive eye following
  useEffect(() => {
    if (!animate || !interactive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !svgRef.current) return;
      
      // Get mouse position relative to the svg container
      const svgRect = svgRef.current.getBoundingClientRect();
      const centerX = svgRect.left + svgRect.width / 2;
      const centerY = svgRect.top + svgRect.height / 2;
      
      // Calculate how far cursor is from center (normalized between -1 and 1)
      const deltaX = (e.clientX - centerX) / (svgRect.width / 2);
      const deltaY = (e.clientY - centerY) / (svgRect.height / 2);
      
      // Only update if cursor position has changed significantly
      if (
        Math.abs(deltaX - lastMousePosition.x) > 0.05 ||
        Math.abs(deltaY - lastMousePosition.y) > 0.05
      ) {
        setLastMousePosition({ x: deltaX, y: deltaY });
        
        // Only apply tracking during appropriate states
        if (
          currentSequence === ANIMATION_SEQUENCES.IDLE || 
          currentSequence === ANIMATION_SEQUENCES.HOVER
        ) {
          // Limit motion range
          const limitedDeltaX = Math.max(-1, Math.min(1, deltaX)) * 3;
          const limitedDeltaY = Math.max(-1, Math.min(1, deltaY)) * 2;
          
          // Smooth eye tracking with easing
          irisesControls.start({
            translateX: limitedDeltaX,
            translateY: limitedDeltaY,
            transition: { duration: 0.3, ease: "easeOut" }
          });
          
          // Subtle head turning to follow cursor
          headControls.start({
            rotate: limitedDeltaX * 2,
            rotateX: -limitedDeltaY * 1.5,
            transition: { duration: 0.5, ease: "easeOut" }
          });
          
          // Metal reflection changes with head position
          reflectionControls.start({
            x: -limitedDeltaX * 2,
            y: -limitedDeltaY * 2,
            transition: { duration: 0.5 }
          });
          
          setLookingAt({ x: limitedDeltaX, y: limitedDeltaY });
          setRobotState(prev => ({...prev, isWatching: true}));
        }
      }
    };
    
    // Add mouse move listener to window
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      setRobotState(prev => ({...prev, isWatching: false}));
    };
  }, [animate, interactive, currentSequence, lastMousePosition, headControls, irisesControls, reflectionControls]);
  
  // Hover and interaction behaviors
  const handleMouseEnter = useCallback(() => {
    if (!animate || !interactive) return;
    setHovering(true);
    
    // Only trigger hover animations when in idle state
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      setCurrentSequence(ANIMATION_SEQUENCES.HOVER);
      
      // Interested expression
      pupilsControls.start({
        scale: 1.1,
        transition: { duration: 0.4 }
      });
      
      // Brighten eyes
      eyeGlowControls.start({
        filter: "blur(5px)",
        opacity: 0.9,
        transition: { duration: 0.5 }
      });
      
      // Energy core brightens
      energyCoreControls.start({
        scale: 1.1,
        opacity: 0.9,
        transition: { duration: 0.5 }
      });
      
      // If there's an interaction callback
      if (onInteraction) {
        onInteraction('hover_start');
      }
    }
  }, [animate, interactive, currentSequence, pupilsControls, eyeGlowControls, energyCoreControls, onInteraction]);
  
  const handleMouseLeave = useCallback(() => {
    if (!animate || !interactive) return;
    setHovering(false);
    
    // Reset only if we were hovering
    if (currentSequence === ANIMATION_SEQUENCES.HOVER) {
      setCurrentSequence(ANIMATION_SEQUENCES.IDLE);
      
      // Reset eye position
      irisesControls.start({
        translateX: 0,
        translateY: 0,
        transition: { duration: 0.4 }
      });
      
      // Reset expressions
      pupilsControls.start({
        scale: 1,
        transition: { duration: 0.4 }
      });
      
      // Reset eye glow
      eyeGlowControls.start({
        filter: "blur(3px)",
        opacity: 0.7,
        transition: { duration: 0.5 }
      });
      
      // Reset energy core
      energyCoreControls.start({
        scale: 1,
        opacity: 0.8,
        transition: { duration: 0.5 }
      });
      
      // If there's an interaction callback
      if (onInteraction) {
        onInteraction('hover_end');
      }
    }
  }, [
    animate, interactive, currentSequence, irisesControls, 
    pupilsControls, eyeGlowControls, energyCoreControls, onInteraction
  ]);
  
  const handleClick = useCallback(() => {
    if (!animate || !interactive) return;
    
    // Trigger a sequence based on current state
    if (currentSequence === ANIMATION_SEQUENCES.IDLE || currentSequence === ANIMATION_SEQUENCES.HOVER) {
      // Randomize between greeting animations
      const sequences = [ANIMATION_SEQUENCES.GREETING, ANIMATION_SEQUENCES.WAVE, ANIMATION_SEQUENCES.JUMP];
      const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
      
      setCurrentSequence(randomSequence);
      
      // If there's an interaction callback
      if (onInteraction) {
        onInteraction('click');
      }
    }
  }, [animate, interactive, currentSequence, onInteraction]);
  
  return (
    <div
      className="inline-block select-none"
      style={{ width: dimensions.width, height: dimensions.height }}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <svg 
        ref={svgRef}
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox="0 0 120 180" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Enhanced metal gradients for realistic materials */}
          <linearGradient id="primaryMetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalConfig.light} />
            <stop offset="40%" stopColor={metalConfig.primary} />
            <stop offset="70%" stopColor={metalConfig.medium} />
            <stop offset="100%" stopColor={metalConfig.dark} />
          </linearGradient>
          
          <linearGradient id="secondaryMetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalConfig.medium} />
            <stop offset="50%" stopColor={metalConfig.primary} />
            <stop offset="100%" stopColor={metalConfig.dark} />
          </linearGradient>
          
          <linearGradient id="highlightMetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalConfig.highlight} />
            <stop offset="60%" stopColor={metalConfig.light} />
            <stop offset="100%" stopColor={metalConfig.medium} />
          </linearGradient>
          
          <linearGradient id="darkMetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalConfig.dark} />
            <stop offset="50%" stopColor={metalConfig.medium} />
            <stop offset="100%" stopColor={metalConfig.dark} />
          </linearGradient>
          
          {/* Face gradients */}
          <linearGradient id="facePlateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#384863" />
            <stop offset="40%" stopColor="#2A3A55" />
            <stop offset="70%" stopColor="#1E2D45" />
            <stop offset="100%" stopColor="#162238" />
          </linearGradient>
          
          {/* Eye gradients */}
          <linearGradient id="eyeGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalConfig.eyeColor} />
            <stop offset="50%" stopColor={metalConfig.eyeGlow} />
            <stop offset="80%" stopColor={`${metalConfig.eyeGlow}CC`} />
            <stop offset="100%" stopColor={`${metalConfig.eyeGlow}99`} />
          </linearGradient>
          
          {/* Panel and accent gradients */}
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A2B3CC" />
            <stop offset="60%" stopColor="#8899BB" />
            <stop offset="100%" stopColor="#667799" />
          </linearGradient>
          
          <linearGradient id="greenButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#50FF9A" />
            <stop offset="60%" stopColor="#44FF88" />
            <stop offset="100%" stopColor="#22CC66" />
          </linearGradient>
          
          <linearGradient id="purpleButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EE77FF" />
            <stop offset="60%" stopColor="#DD66EE" />
            <stop offset="100%" stopColor="#BB44CC" />
          </linearGradient>
          
          <linearGradient id="yellowButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFDD55" />
            <stop offset="60%" stopColor="#FFCC44" />
            <stop offset="100%" stopColor="#FFAA22" />
          </linearGradient>
          
          {/* Enhanced metal reflections */}
          <linearGradient id="reflectionGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Enhanced glow effects */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor={metalConfig.eyeGlow} floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="brightGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={metalConfig.eyeColor} floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="smallGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feFlood floodColor={metalConfig.eyeGlow} floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="tinyGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feFlood floodColor={metalConfig.eyeGlow} floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Lens flare for eyes */}
          <radialGradient id="lensFlare" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          
          {/* Hologram effect with scan lines */}
          <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={metalConfig.eyeColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor={metalConfig.eyeGlow} stopOpacity="0.6" />
            <stop offset="100%" stopColor={`${metalConfig.eyeGlow}99`} stopOpacity="0.8" />
          </linearGradient>
          
          <pattern id="holoLines" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="5" x2="10" y2="5" stroke={metalConfig.eyeGlow} strokeWidth="0.5" strokeOpacity="0.3" />
          </pattern>
          
          {/* Subtle shadow for depth */}
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dx="1" dy="2" result="offsetBlur" />
            <feComponentTransfer in="offsetBlur" result="shadow">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="shadow" operator="over" />
          </filter>
          
          {/* Realistic metal texture */}
          <pattern id="metalTexture" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="url(#primaryMetalGradient)" />
            <rect width="40" height="40" fill="url(#reflectionGradient)" opacity="0.2" />
            <circle cx="10" cy="10" r="1" fill="#FFFFFF" opacity="0.3" />
            <circle cx="30" cy="30" r="0.8" fill="#FFFFFF" opacity="0.2" />
            <circle cx="20" cy="5" r="0.6" fill="#FFFFFF" opacity="0.15" />
            <line x1="0" y1="0" x2="40" y2="40" stroke="#000000" strokeWidth="0.1" opacity="0.05" />
            <line x1="40" y1="0" x2="0" y2="40" stroke="#000000" strokeWidth="0.1" opacity="0.05" />
          </pattern>
        </defs>
        
        {/* Shadow beneath robot */}
        <ellipse 
          cx="60" 
          cy="175" 
          rx="30" 
          ry="5" 
          fill="rgba(0, 0, 50, 0.15)" 
          style={{
            transformOrigin: "center",
            transform: `scale(${currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.7 : 1})`,
            opacity: currentSequence === ANIMATION_SEQUENCES.JUMP ? 0.3 : 0.6
          }}
        />
        
        {/* PHOTO-REALISTIC ROBOT - GOLD/METAL STYLE */}
        <motion.g animate={bodyControls} filter="url(#dropShadow)">
          {/* LEGS */}
          <g>
            {/* Left leg */}
            <motion.g animate={leftLegControls} style={{ transformOrigin: '52px 130px' }}>
              <rect x="48" y="130" width="8" height="35" rx="4" fill="url(#primaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Left foot */}
              <path 
                d="M46,165 L58,165 C60,165 60,170 58,170 L46,170 C44,170 44,165 46,165 Z" 
                fill="url(#secondaryMetalGradient)" 
                stroke={metalConfig.dark} 
                strokeWidth="0.5" 
              />
              
              {/* Leg joints and details */}
              <circle cx="52" cy="135" r="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="52" cy="135" r="1" fill="url(#reflectionGradient)" />
              
              <circle cx="52" cy="155" r="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="52" cy="155" r="1" fill="url(#reflectionGradient)" />
              
              {/* Detailed panel */}
              <rect x="49" y="142" width="6" height="10" rx="1" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
              <rect x="50" y="143" width="4" height="8" rx="0.5" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
              
              {/* Metal seams and details */}
              <line x1="48" y1="140" x2="56" y2="140" stroke={metalConfig.dark} strokeWidth="0.2" />
              <line x1="48" y1="160" x2="56" y2="160" stroke={metalConfig.dark} strokeWidth="0.2" />
              
              {/* Metal reflection highlights */}
              <motion.g animate={reflectionControls}>
                <path d="M48,135 L48,145" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
                <path d="M56,155 L56,165" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
              </motion.g>
            </motion.g>
            
            {/* Right leg */}
            <motion.g animate={rightLegControls} style={{ transformOrigin: '68px 130px' }}>
              <rect x="64" y="130" width="8" height="35" rx="4" fill="url(#primaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Right foot */}
              <path 
                d="M62,165 L74,165 C76,165 76,170 74,170 L62,170 C60,170 60,165 62,165 Z" 
                fill="url(#secondaryMetalGradient)" 
                stroke={metalConfig.dark} 
                strokeWidth="0.5" 
              />
              
              {/* Leg joints and details */}
              <circle cx="68" cy="135" r="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="68" cy="135" r="1" fill="url(#reflectionGradient)" />
              
              <circle cx="68" cy="155" r="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="68" cy="155" r="1" fill="url(#reflectionGradient)" />
              
              {/* Detailed panel */}
              <rect x="65" y="142" width="6" height="10" rx="1" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
              <rect x="66" y="143" width="4" height="8" rx="0.5" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
              
              {/* Metal seams and details */}
              <line x1="64" y1="140" x2="72" y2="140" stroke={metalConfig.dark} strokeWidth="0.2" />
              <line x1="64" y1="160" x2="72" y2="160" stroke={metalConfig.dark} strokeWidth="0.2" />
              
              {/* Metal reflection highlights */}
              <motion.g animate={reflectionControls}>
                <path d="M64,135 L64,145" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
                <path d="M72,155 L72,165" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
              </motion.g>
            </motion.g>
          </g>
          
          {/* BODY - Realistic metal chassis */}
          <g>
            {/* Central torso with realistic metal plate design */}
            <path 
              d="M40,85 C40,80 45,80 50,80 L70,80 C75,80 80,80 80,85 L80,125 C80,130 75,130 70,130 L50,130 C45,130 40,130 40,125 L40,85 Z" 
              fill="url(#primaryMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.7"
            />
            
            {/* Metal plate seams and detailing */}
            <path 
              d="M45,85 L75,85 M45,130 L75,130 M50,85 L50,130 M70,85 L70,130 M45,95 L75,95 M45,115 L75,115" 
              stroke={metalConfig.dark} 
              strokeWidth="0.3" 
              strokeDasharray="0.5 1" 
              fill="none"
            />
            
            {/* Main body energy core */}
            <circle cx="60" cy="105" r="11" fill="url(#facePlateGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
            
            <motion.g animate={energyCoreControls}>
              <circle cx="60" cy="105" r="9" fill="url(#eyeGlowGradient)" filter="url(#glow)" />
              
              <motion.circle 
                cx="60" 
                cy="105" 
                r="6" 
                fill={metalConfig.eyeGlow} 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="60" 
                cy="105" 
                r="3" 
                fill="#FFFFFF" 
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              {/* Energy swirls */}
              <motion.path
                d="M59,102 Q63,105 59,108 Q56,105 59,102 Z"
                fill="#FFFFFF"
                fillOpacity="0.4"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                style={{ transformOrigin: '60px 105px' }}
              />
            </motion.g>
            
            {/* Upper control panel */}
            <rect x="45" y="85" width="30" height="7" rx="2" fill="url(#darkMetalGradient)" strokeWidth="0.2" />
            <rect x="47" y="86" width="26" height="5" rx="1" fill="url(#secondaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
            
            {/* Status displays */}
            <rect x="48" y="87" width="7" height="3" rx="0.5" fill="#162238" stroke={metalConfig.dark} strokeWidth="0.1" />
            <rect x="57" y="87" width="7" height="3" rx="0.5" fill="#162238" stroke={metalConfig.dark} strokeWidth="0.1" />
            <rect x="66" y="87" width="7" height="3" rx="0.5" fill="#162238" stroke={metalConfig.dark} strokeWidth="0.1" />
            
            {/* Status display indicators */}
            <g>
              {[50, 59, 68].map((x, i) => (
                <motion.rect
                  key={`indicator-${i}`}
                  x={x}
                  y="88"
                  width="3"
                  height="1"
                  rx="0.5"
                  fill={metalConfig.eyeGlow}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    width: [1, 3, 1]
                  }}
                  transition={{
                    duration: 3,
                    times: [0, 0.5, 1],
                    repeat: Infinity,
                    delay: i * 0.5
                  }}
                />
              ))}
            </g>
            
            {/* Lower control panel */}
            <rect x="45" y="120" width="30" height="7" rx="2" fill="url(#darkMetalGradient)" strokeWidth="0.2" />
            <rect x="47" y="121" width="26" height="5" rx="1" fill="url(#secondaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
            
            {/* Control buttons with advanced lighting */}
            <motion.g animate={panelLightsControls}>
              {[
                { x: 49.5, fill: "url(#greenButtonGradient)" },
                { x: 54.5, fill: "url(#purpleButtonGradient)" },
                { x: 60, fill: "url(#yellowButtonGradient)" },
                { x: 65.5, fill: "url(#eyeGlowGradient)" },
                { x: 70.5, fill: "url(#greenButtonGradient)" }
              ].map((button, i) => (
                <g key={`button-${i}`}>
                  {/* Button base */}
                  <circle
                    cx={button.x}
                    cy="123.5"
                    r="2"
                    fill={metalConfig.dark}
                    stroke={metalConfig.shadow}
                    strokeWidth="0.2"
                  />
                  
                  {/* Glowing button surface */}
                  <motion.circle
                    cx={button.x}
                    cy="123.5"
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
                  
                  {/* Button highlight */}
                  <circle
                    cx={button.x - 0.5}
                    cy="123"
                    r="0.5"
                    fill="#FFFFFF"
                    opacity="0.5"
                  />
                </g>
              ))}
            </motion.g>
            
            {/* Metal reflections - dynamic with lighting */}
            <motion.g animate={reflectionControls}>
              <path 
                d="M42,90 Q45,85 50,82 L60,82 Q67,83 75,88 L78,95 Q72,90 63,88 L57,88 Q48,90 42,90 Z" 
                fill="url(#reflectionGradient)" 
                opacity="0.3"
              />
              
              <path 
                d="M42,120 Q45,125 50,128 L60,128 Q67,127 75,122 L78,115 Q72,120 63,122 L57,122 Q48,120 42,120 Z" 
                fill="url(#reflectionGradient)" 
                opacity="0.2"
              />
            </motion.g>
          </g>
          
          {/* ARMS - Realistic articulated robotic appendages */}
          <g>
            {/* Left arm */}
            <motion.g animate={leftArmControls} style={{ transformOrigin: '40px 90px' }}>
              {/* Shoulder housing */}
              <circle cx="40" cy="90" r="4" fill="url(#secondaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Shoulder joint */}
              <circle cx="40" cy="90" r="2" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="40" cy="90" r="1" fill="url(#reflectionGradient)" opacity="0.7" />
              
              {/* Detailed shoulder panel */}
              <path 
                d="M40,86 L40,94 M38,90 L42,90" 
                stroke={metalConfig.dark} 
                strokeWidth="0.2"
              />
              
              {/* Upper arm structure */}
              <path
                d="M36,90 L36,110 C36,112 38,112 40,112 L40,110 C38,110 38,108 38,106 L38,94 C38,92 38,90 40,90 L40,88 C38,88 36,88 36,90 Z"
                fill="url(#primaryMetalGradient)"
                stroke={metalConfig.dark}
                strokeWidth="0.3"
              />
              
              <rect x="36" y="90" width="8" height="20" rx="4" fill="url(#primaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Arm panel details */}
              <rect x="38" y="95" width="4" height="10" rx="1" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
              <rect x="39" y="96" width="2" height="8" rx="0.5" fill="url(#secondaryMetalGradient)" strokeWidth="0.1" />
              
              {/* Elbow joint */}
              <circle cx="40" cy="110" r="3" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              <circle cx="40" cy="110" r="1.5" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
              <circle cx="40" cy="110" r="0.7" fill="url(#reflectionGradient)" opacity="0.6" />
              
              {/* Forearm with detailed metal plating */}
              <rect x="36" y="110" width="8" height="20" rx="4" fill="url(#primaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Forearm panel details */}
              <path 
                d="M36,115 L44,115 M36,125 L44,125" 
                stroke={metalConfig.dark} 
                strokeWidth="0.2"
              />
              
              <rect x="38" y="117" width="4" height="6" rx="1" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
              
              {/* Wrist joint */}
              <circle cx="40" cy="130" r="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="40" cy="130" r="1" fill="url(#reflectionGradient)" opacity="0.6" />
              
              {/* Hand with advanced articulation and detailing */}
              <motion.g animate={fingerControls} style={{ transformOrigin: '40px 130px' }}>
                <path 
                  d="M35,130 C35,128 37,128 39,128 L41,128 C43,128 45,128 45,130 L45,136 C45,138 43,138 41,138 L39,138 C37,138 35,138 35,136 L35,130 Z" 
                  fill="url(#primaryMetalGradient)" 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.5"
                />
                
                {/* Finger joint details */}
                <g>
                  {[37, 40, 43].map((x, i) => (
                    <g key={`finger-${i}`}>
                      <rect
                        x={x-1}
                        y="134"
                        width="2"
                        height="6"
                        rx="1"
                        fill="url(#secondaryMetalGradient)"
                        stroke={metalConfig.dark}
                        strokeWidth="0.2"
                      />
                      
                      {/* Finger joints */}
                      <line
                        x1={x-1}
                        y1="136"
                        x2={x+1}
                        y2="136"
                        stroke={metalConfig.dark}
                        strokeWidth="0.2"
                      />
                      
                      {/* Fingertip sensors */}
                      <circle
                        cx={x}
                        cy="139"
                        r="0.7"
                        fill="url(#eyeGlowGradient)"
                        filter="url(#tinyGlow)"
                      />
                    </g>
                  ))}
                </g>
                
                {/* Palm details */}
                <circle 
                  cx="40" 
                  cy="132" 
                  r="1.5" 
                  fill="url(#darkMetalGradient)" 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.1"
                />
                <circle 
                  cx="40" 
                  cy="132" 
                  r="0.5" 
                  fill="url(#eyeGlowGradient)" 
                  filter="url(#tinyGlow)"
                />
              </motion.g>
              
              {/* Reflections on arm surfaces */}
              <motion.g animate={reflectionControls}>
                <path d="M36,95 L36,105" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
                <path d="M44,115 L44,125" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
                <circle cx="40" cy="90" r="3" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.2" fill="none" />
              </motion.g>
            </motion.g>
            
            {/* Right arm - mirror of left with independent animations */}
            <motion.g animate={rightArmControls} style={{ transformOrigin: '80px 90px' }}>
              {/* Shoulder housing */}
              <circle cx="80" cy="90" r="4" fill="url(#secondaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Shoulder joint */}
              <circle cx="80" cy="90" r="2" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="80" cy="90" r="1" fill="url(#reflectionGradient)" opacity="0.7" />
              
              {/* Detailed shoulder panel */}
              <path 
                d="M80,86 L80,94 M78,90 L82,90" 
                stroke={metalConfig.dark} 
                strokeWidth="0.2"
              />
              
              {/* Upper arm structure */}
              <path
                d="M84,90 L84,110 C84,112 82,112 80,112 L80,110 C82,110 82,108 82,106 L82,94 C82,92 82,90 80,90 L80,88 C82,88 84,88 84,90 Z"
                fill="url(#primaryMetalGradient)"
                stroke={metalConfig.dark}
                strokeWidth="0.3"
              />
              
              <rect x="76" y="90" width="8" height="20" rx="4" fill="url(#primaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Arm panel details */}
              <rect x="78" y="95" width="4" height="10" rx="1" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
              <rect x="79" y="96" width="2" height="8" rx="0.5" fill="url(#secondaryMetalGradient)" strokeWidth="0.1" />
              
              {/* Elbow joint */}
              <circle cx="80" cy="110" r="3" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              <circle cx="80" cy="110" r="1.5" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
              <circle cx="80" cy="110" r="0.7" fill="url(#reflectionGradient)" opacity="0.6" />
              
              {/* Forearm with detailed metal plating */}
              <rect x="76" y="110" width="8" height="20" rx="4" fill="url(#primaryMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Forearm panel details */}
              <path 
                d="M76,115 L84,115 M76,125 L84,125" 
                stroke={metalConfig.dark} 
                strokeWidth="0.2"
              />
              
              <rect x="78" y="117" width="4" height="6" rx="1" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.2" />
              
              {/* Wrist joint */}
              <circle cx="80" cy="130" r="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
              <circle cx="80" cy="130" r="1" fill="url(#reflectionGradient)" opacity="0.6" />
              
              {/* Hand with advanced articulation and detailing */}
              <motion.g animate={fingerControls} style={{ transformOrigin: '80px 130px' }}>
                <path 
                  d="M75,130 C75,128 77,128 79,128 L81,128 C83,128 85,128 85,130 L85,136 C85,138 83,138 81,138 L79,138 C77,138 75,138 75,136 L75,130 Z" 
                  fill="url(#primaryMetalGradient)" 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.5"
                />
                
                {/* Finger joint details */}
                <g>
                  {[77, 80, 83].map((x, i) => (
                    <g key={`finger-${i}`}>
                      <rect
                        x={x-1}
                        y="134"
                        width="2"
                        height="6"
                        rx="1"
                        fill="url(#secondaryMetalGradient)"
                        stroke={metalConfig.dark}
                        strokeWidth="0.2"
                      />
                      
                      {/* Finger joints */}
                      <line
                        x1={x-1}
                        y1="136"
                        x2={x+1}
                        y2="136"
                        stroke={metalConfig.dark}
                        strokeWidth="0.2"
                      />
                      
                      {/* Fingertip sensors */}
                      <circle
                        cx={x}
                        cy="139"
                        r="0.7"
                        fill="url(#eyeGlowGradient)"
                        filter="url(#tinyGlow)"
                      />
                    </g>
                  ))}
                </g>
                
                {/* Palm details */}
                <circle 
                  cx="80" 
                  cy="132" 
                  r="1.5" 
                  fill="url(#darkMetalGradient)" 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.1"
                />
                <circle 
                  cx="80" 
                  cy="132" 
                  r="0.5" 
                  fill="url(#eyeGlowGradient)" 
                  filter="url(#tinyGlow)"
                />
              </motion.g>
              
              {/* Reflections on arm surfaces */}
              <motion.g animate={reflectionControls}>
                <path d="M84,95 L84,105" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
                <path d="M76,115 L76,125" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.3" />
                <circle cx="80" cy="90" r="3" stroke="url(#reflectionGradient)" strokeWidth="1" opacity="0.2" fill="none" />
              </motion.g>
            </motion.g>
          </g>
          
          {/* NECK - Articulated metallic connector */}
          <g>
            {/* Main neck cylinder */}
            <rect 
              x="52" 
              y="70" 
              width="16" 
              height="10" 
              rx="4" 
              fill="url(#primaryMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.5" 
            />
            
            {/* Neck detail rings */}
            <rect 
              x="53" 
              y="72" 
              width="14" 
              height="1" 
              rx="0.5" 
              fill="url(#darkMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.2" 
            />
            
            <rect 
              x="53" 
              y="77" 
              width="14" 
              height="1" 
              rx="0.5" 
              fill="url(#darkMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.2" 
            />
            
            {/* Central neck joint */}
            <circle 
              cx="60" 
              cy="75" 
              r="4" 
              fill="url(#darkMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.3" 
            />
            
            <circle 
              cx="60" 
              cy="75" 
              r="2" 
              fill="url(#secondaryMetalGradient)" 
              stroke={metalConfig.medium} 
              strokeWidth="0.2" 
            />
            
            <circle 
              cx="60" 
              cy="75" 
              r="1" 
              fill="url(#reflectionGradient)" 
              opacity="0.7" 
            />
            
            {/* Neck cables and conduits */}
            <g>
              {[53, 55, 65, 67].map((x, i) => (
                <path 
                  key={`cable-${i}`}
                  d={`M${x},72 C${x},74 ${x},76 ${x},78`} 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.5" 
                  fill="none" 
                />
              ))}
            </g>
            
            {/* Metal reflection highlights */}
            <motion.g animate={reflectionControls}>
              <path 
                d="M52,72 L55,72" 
                stroke="url(#reflectionGradient)" 
                strokeWidth="1" 
                opacity="0.4" 
              />
              
              <path 
                d="M65,77 L68,77" 
                stroke="url(#reflectionGradient)" 
                strokeWidth="1" 
                opacity="0.4" 
              />
            </motion.g>
          </g>
          
          {/* HEAD ASSEMBLY - Advanced robotic head with metal plating */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 45px" }}
          >
            {/* Main head structure - Metallic spheroid */}
            <circle 
              cx="60" 
              cy="45" 
              r="25" 
              fill="url(#primaryMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.8"
            />
            
            {/* Detailed head panel structures */}
            <path 
              d="M60,20 A25,25 0 0,1 85,45 A25,25 0 0,1 60,70 A25,25 0 0,1 35,45 A25,25 0 0,1 60,20 Z" 
              fill="none" 
              stroke={metalConfig.dark} 
              strokeWidth="0.3" 
              strokeDasharray="2,5"
            />
            
            {/* Panel separation lines with metallic detail */}
            <path d="M35,45 L85,45" stroke={metalConfig.dark} strokeWidth="0.3" opacity="0.7" />
            <path d="M60,20 L60,70" stroke={metalConfig.dark} strokeWidth="0.3" opacity="0.7" />
            
            {/* Face plate with inset design */}
            <path 
              d="M45,35 C45,30 50,30 55,30 L65,30 C70,30 75,30 75,35 L75,55 C75,60 70,60 65,60 L55,60 C50,60 45,60 45,55 L45,35 Z" 
              fill="url(#facePlateGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.5"
            />
            
            {/* Face plate metal framing and detailing */}
            <path 
              d="M46,36 L74,36 M46,54 L74,54 M55,36 L55,54 M65,36 L65,54" 
              stroke={metalConfig.dark} 
              strokeWidth="0.2" 
              opacity="0.7"
            />
            
            {/* Side tech panels with metallic framing */}
            <rect x="34" y="40" width="8" height="10" rx="2" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
            <rect x="35" y="41" width="6" height="8" rx="1" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
            
            <rect x="78" y="40" width="8" height="10" rx="2" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
            <rect x="79" y="41" width="6" height="8" rx="1" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
            
            {/* Side panel detail indicators */}
            <motion.circle 
              cx="38" 
              cy="43" 
              r="1" 
              fill="url(#eyeGlowGradient)" 
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror"
              }}
              filter="url(#tinyGlow)"
            />
            
            <motion.circle 
              cx="38" 
              cy="47" 
              r="1" 
              fill="url(#eyeGlowGradient)" 
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror",
                delay: 0.5
              }}
              filter="url(#tinyGlow)"
            />
            
            <motion.circle 
              cx="82" 
              cy="43" 
              r="1" 
              fill="url(#eyeGlowGradient)" 
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror",
                delay: 0.3
              }}
              filter="url(#tinyGlow)"
            />
            
            <motion.circle 
              cx="82" 
              cy="47" 
              r="1" 
              fill="url(#eyeGlowGradient)" 
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror",
                delay: 0.8
              }}
              filter="url(#tinyGlow)"
            />
            
            {/* Top indicator panel */}
            <rect x="48" y="25" width="24" height="5" rx="2.5" fill="url(#darkMetalGradient)" stroke={metalConfig.dark} strokeWidth="0.3" />
            <rect x="49" y="25.5" width="22" height="4" rx="2" fill="url(#secondaryMetalGradient)" stroke={metalConfig.medium} strokeWidth="0.2" />
            
            {/* Status indicator lights */}
            <g>
              {[51, 55, 60, 65, 69].map((x, i) => (
                <motion.circle 
                  key={`light-${i}`}
                  cx={x} 
                  cy="27.5" 
                  r="1.2" 
                  fill={i % 2 === 0 ? metalConfig.eyeColor : metalConfig.eyeGlow}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [1, i % 2 === 0 ? 1.2 : 1.1, 1]
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
            
            {/* Cheek status indicator lights */}
            <motion.g animate={cheekLightsControls}>
              <circle cx="45" cy="50" r="2" fill="url(#eyeGlowGradient)" filter="url(#tinyGlow)" />
              <circle cx="75" cy="50" r="2" fill="url(#eyeGlowGradient)" filter="url(#tinyGlow)" />
            </motion.g>
            
            {/* Antenna - Advanced communications array */}
            <motion.g animate={antennaControls} style={{ transformOrigin: "60px 15px" }}>
              {/* Antenna base */}
              <rect 
                x="57" 
                y="18" 
                width="6" 
                height="7" 
                rx="3" 
                fill="url(#darkMetalGradient)" 
                stroke={metalConfig.dark} 
                strokeWidth="0.5" 
              />
              
              <circle 
                cx="60" 
                cy="18" 
                r="3" 
                fill="url(#darkMetalGradient)" 
                stroke={metalConfig.dark} 
                strokeWidth="0.3" 
              />
              
              {/* Antenna shaft with metal details */}
              <rect 
                x="59" 
                y="10" 
                width="2" 
                height="8" 
                rx="1" 
                fill="url(#primaryMetalGradient)" 
                stroke={metalConfig.dark} 
                strokeWidth="0.3" 
              />
              
              {/* Antenna segmentation */}
              <line x1="59" y1="12" x2="61" y2="12" stroke={metalConfig.dark} strokeWidth="0.2" />
              <line x1="59" y1="14" x2="61" y2="14" stroke={metalConfig.dark} strokeWidth="0.2" />
              <line x1="59" y1="16" x2="61" y2="16" stroke={metalConfig.dark} strokeWidth="0.2" />
              
              {/* Antenna tip with glowing element */}
              <circle 
                cx="60" 
                cy="10" 
                r="3" 
                fill="url(#eyeGlowGradient)" 
                filter="url(#brightGlow)" 
              />
              
              <motion.circle 
                cx="60" 
                cy="10" 
                r="2" 
                fill={metalConfig.eyeColor} 
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.2, 1],
                  filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.circle 
                cx="60" 
                cy="10" 
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
              
              {/* Antenna details and metallic accents */}
              <circle cx="60" cy="10" r="2.5" fill="none" stroke="url(#reflectionGradient)" strokeWidth="0.3" opacity="0.6" />
              <rect x="59.5" y="15" width="1" height="1" rx="0.2" fill={metalConfig.dark} />
              <rect x="59.5" y="17" width="1" height="1" rx="0.2" fill={metalConfig.dark} />
            </motion.g>
            
            {/* EYES - Highly detailed optical sensors */}
            <g>
              {/* Eye sockets with metallic rim */}
              <circle cx="52" cy="45" r="7" fill="#111122" stroke={metalConfig.dark} strokeWidth="0.5" />
              <circle cx="68" cy="45" r="7" fill="#111122" stroke={metalConfig.dark} strokeWidth="0.5" />
              
              {/* Outer eye housing details */}
              <path 
                d="M52,38 A7,7 0 0,1 59,45 A7,7 0 0,1 52,52 A7,7 0 0,1 45,45 A7,7 0 0,1 52,38 Z" 
                fill="none" 
                stroke={metalConfig.dark} 
                strokeWidth="0.2" 
                strokeDasharray="1,2"
              />
              
              <path 
                d="M68,38 A7,7 0 0,1 75,45 A7,7 0 0,1 68,52 A7,7 0 0,1 61,45 A7,7 0 0,1 68,38 Z" 
                fill="none" 
                stroke={metalConfig.dark} 
                strokeWidth="0.2" 
                strokeDasharray="1,2"
              />
              
              {/* Eye glow elements */}
              <motion.circle 
                cx="52" 
                cy="45" 
                r="6" 
                fill="url(#eyeGlowGradient)" 
                filter="url(#glow)"
                animate={eyeGlowControls}
              />
              
              <motion.circle 
                cx="68" 
                cy="45" 
                r="6" 
                fill="url(#eyeGlowGradient)" 
                filter="url(#glow)"
                animate={eyeGlowControls}
              />
              
              {/* Irises with detailed mechanics */}
              <motion.g animate={irisesControls}>
                {/* Left eye iris with mechanical aperture detail */}
                <circle cx="52" cy="45" r="4.5" fill="url(#eyeGlowGradient)" />
                
                <g>
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <path
                      key={`iris-detail-l-${i}`}
                      d={`M52,45 L${52 + 4.5 * Math.cos(angle * Math.PI / 180)},${45 + 4.5 * Math.sin(angle * Math.PI / 180)}`}
                      stroke={metalConfig.dark}
                      strokeWidth="0.2"
                      opacity="0.5"
                    />
                  ))}
                </g>
                
                <circle cx="52" cy="45" r="4" fill="url(#eyeGlowGradient)" opacity="0.8" />
                
                {/* Left pupil */}
                <motion.circle 
                  cx="52" 
                  cy="45" 
                  r="2.5" 
                  fill="#111122" 
                  stroke={metalConfig.eyeGlow}
                  strokeWidth="0.3"
                  animate={pupilsControls}
                />
                
                {/* Left eye lens flare */}
                <circle cx="52" cy="45" r="3.5" fill="url(#lensFlare)" style={{ mixBlendMode: 'overlay' }} />
                
                {/* Left eye micro details */}
                <path d="M51,45 A1,1 0 1,0 53,45 A1,1 0 1,0 51,45" fill="none" stroke={metalConfig.eyeColor} strokeWidth="0.2" opacity="0.7" />
                <circle cx="51" cy="44" r="0.5" fill="#FFFFFF" opacity="0.8" />
                
                {/* Right eye iris with mechanical aperture detail */}
                <circle cx="68" cy="45" r="4.5" fill="url(#eyeGlowGradient)" />
                
                <g>
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <path
                      key={`iris-detail-r-${i}`}
                      d={`M68,45 L${68 + 4.5 * Math.cos(angle * Math.PI / 180)},${45 + 4.5 * Math.sin(angle * Math.PI / 180)}`}
                      stroke={metalConfig.dark}
                      strokeWidth="0.2"
                      opacity="0.5"
                    />
                  ))}
                </g>
                
                <circle cx="68" cy="45" r="4" fill="url(#eyeGlowGradient)" opacity="0.8" />
                
                {/* Right pupil */}
                <motion.circle 
                  cx="68" 
                  cy="45" 
                  r="2.5" 
                  fill="#111122" 
                  stroke={metalConfig.eyeGlow}
                  strokeWidth="0.3"
                  animate={pupilsControls}
                />
                
                {/* Right eye lens flare */}
                <circle cx="68" cy="45" r="3.5" fill="url(#lensFlare)" style={{ mixBlendMode: 'overlay' }} />
                
                {/* Right eye micro details */}
                <path d="M67,45 A1,1 0 1,0 69,45 A1,1 0 1,0 67,45" fill="none" stroke={metalConfig.eyeColor} strokeWidth="0.2" opacity="0.7" />
                <circle cx="67" cy="44" r="0.5" fill="#FFFFFF" opacity="0.8" />
              </motion.g>
              
              {/* Eyelids for blinking animation */}
              <motion.g animate={eyelidsControls}>
                <path 
                  d="M45,45 A7,7 0 1,0 59,45" 
                  fill="url(#primaryMetalGradient)" 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.3"
                />
                
                <path 
                  d="M61,45 A7,7 0 1,0 75,45" 
                  fill="url(#primaryMetalGradient)" 
                  stroke={metalConfig.dark} 
                  strokeWidth="0.3"
                />
              </motion.g>
            </g>
            
            {/* Mouth/speech indicator */}
            <g>
              <rect 
                x="50" 
                y="55" 
                width="20" 
                height="3" 
                rx="1.5" 
                fill="#111122" 
                stroke={metalConfig.dark} 
                strokeWidth="0.3"
              />
              
              <motion.path 
                d="M18,38 Q25,38 32,38" 
                transform="translate(35, 20)"
                stroke={metalConfig.eyeGlow} 
                strokeWidth="1.5" 
                strokeLinecap="round"
                fill="none"
                animate={mouthControls}
              />
              
              {/* Speech visualizer elements */}
              <g>
                {[53, 56, 60, 64, 67].map((x, i) => (
                  <motion.rect
                    key={`mouth-${i}`}
                    x={x - 0.75}
                    y="55.5"
                    width="1.5"
                    height={2 + i % 3}
                    rx="0.75"
                    fill={metalConfig.eyeGlow}
                    opacity="0.8"
                    animate={{
                      height: robotState.isSpeaking ? [2, 3, 1.5, 2.5, 2][i % 5] : 1.5,
                      opacity: robotState.isSpeaking ? [0.7, 1, 0.8, 1, 0.7][i % 5] : 0.7,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: robotState.isSpeaking ? Infinity : 0,
                      repeatType: "mirror"
                    }}
                  />
                ))}
              </g>
            </g>
            
            {/* Forehead panel with tech details */}
            <rect 
              x="52" 
              y="31" 
              width="16" 
              height="4" 
              rx="2" 
              fill="url(#darkMetalGradient)" 
              stroke={metalConfig.dark} 
              strokeWidth="0.2"
            />
            
            <rect 
              x="53" 
              y="31.5" 
              width="14" 
              height="3" 
              rx="1.5" 
              fill="url(#secondaryMetalGradient)" 
              stroke={metalConfig.medium} 
              strokeWidth="0.1"
            />
            
            {/* Forehead panel indicators */}
            <g>
              {[54, 57, 60, 63, 66].map((x, i) => (
                <motion.circle
                  key={`forehead-${i}`}
                  cx={x}
                  cy="33"
                  r="0.7"
                  fill={i % 2 === 0 ? metalConfig.eyeColor : metalConfig.eyeGlow}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.2
                  }}
                  filter="url(#tinyGlow)"
                />
              ))}
            </g>
            
            {/* Realistic metallic reflections on head */}
            <motion.g animate={reflectionControls}>
              <path 
                d="M42,35 C45,30 52,25 60,25 C68,25 75,30 78,35 C73,30 65,28 60,28 C55,28 47,30 42,35 Z" 
                fill="url(#reflectionGradient)" 
                opacity="0.4"
              />
              
              <path 
                d="M78,55 C75,60 68,65 60,65 C52,65 45,60 42,55 C47,60 55,62 60,62 C65,62 73,60 78,55 Z" 
                fill="url(#reflectionGradient)" 
                opacity="0.3"
              />
              
              <path 
                d="M75,40 A5,5 0 0,1 75,50" 
                fill="none"
                stroke="url(#reflectionGradient)" 
                strokeWidth="1"
                opacity="0.3"
              />
              
              <path 
                d="M45,40 A5,5 0 0,0 45,50" 
                fill="none"
                stroke="url(#reflectionGradient)" 
                strokeWidth="1"
                opacity="0.3"
              />
              
              {/* Dynamic reflections that move with lighting */}
              {reflectionParticles.map((particle, i) => (
                <circle
                  key={`reflect-${i}`}
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.r}
                  fill="#FFFFFF"
                  opacity={particle.opacity}
                />
              ))}
            </motion.g>
          </motion.g>
          
          {/* HOLOGRAM PROJECTION BEAM */}
          {(hologramText || currentSequence === ANIMATION_SEQUENCES.HOLOGRAM) && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main beam from right eye with distortion effects */}
              <motion.path
                d="M75,45 Q95,40 95,45 L95,55 Q95,60 75,55 Z"
                fill="url(#hologramGradient)"
                opacity="0.6"
                filter="url(#smallGlow)"
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              {/* Edge glow */}
              <motion.path
                d="M75,45 L95,45"
                stroke={metalConfig.eyeColor}
                strokeWidth="0.5"
                opacity="0.8"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              
              <motion.path
                d="M75,55 L95,55"
                stroke={metalConfig.eyeColor}
                strokeWidth="0.5"
                opacity="0.8"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.2
                }}
              />
              
              {/* Beam pattern effects */}
              <motion.g
                animate={{
                  x: [0, 1, 0, -1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              >
                <rect x="75" y="45" width="20" height="10" fill="url(#holoLines)" opacity="0.4" />
              </motion.g>
              
              {/* Beam particles */}
              <g>
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.circle
                    key={`beam-particle-${i}`}
                    cx={75 + i * 3}
                    cy={48 + (i % 3) - 1}
                    r="0.3"
                    fill="#FFFFFF"
                    animate={{
                      opacity: [0, 0.8, 0],
                      x: [0, 5, 10]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </g>
              
              {/* Hologram Text Display */}
              {hologramText && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Hologram frame with scan lines and noise */}
                  <rect 
                    x="100" 
                    y="40" 
                    width={hologramText.length * 5 + 10} 
                    height="20" 
                    rx="3" 
                    fill="url(#hologramGradient)"
                    opacity="0.3"
                    stroke={metalConfig.eyeColor}
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                    filter="url(#tinyGlow)"
                  />
                  
                  {/* Hologram scanlines */}
                  <rect 
                    x="100" 
                    y="40" 
                    width={hologramText.length * 5 + 10} 
                    height="20" 
                    rx="3" 
                    fill="url(#holoLines)"
                    opacity="0.5"
                  />
                  
                  {/* Glitching text */}
                  <motion.text
                    x="105"
                    y="53"
                    fontFamily="monospace"
                    fontSize="8"
                    fill={metalConfig.eyeColor}
                    filter="url(#tinyGlow)"
                    animate={{
                      opacity: [1, 0.95, 1, 0.98, 1],
                      y: [53, 52.8, 53, 53.1, 53]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      times: [0, 0.2, 0.4, 0.6, 1]
                    }}
                  >
                    {hologramText}
                  </motion.text>
                  
                  {/* Frame highlight edges */}
                  <motion.rect 
                    x="100" 
                    y="40" 
                    width={hologramText.length * 5 + 10} 
                    height="20" 
                    rx="3" 
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="0.3"
                    opacity="0.3"
                    animate={{
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "mirror"
                    }}
                  />
                  
                  {/* Hologram corner highlights */}
                  <circle cx="100" cy="40" r="0.8" fill={metalConfig.eyeColor} opacity="0.8" />
                  <circle cx={100 + hologramText.length * 5 + 10} cy="40" r="0.8" fill={metalConfig.eyeColor} opacity="0.8" />
                  <circle cx="100" cy="60" r="0.8" fill={metalConfig.eyeColor} opacity="0.8" />
                  <circle cx={100 + hologramText.length * 5 + 10} cy="60" r="0.8" fill={metalConfig.eyeColor} opacity="0.8" />
                </motion.g>
              )}
            </motion.g>
          )}
        </motion.g>
        
        {/* Advanced energy/hologram particles with physics-based movement */}
        {hologramParticles.map((particle, index) => (
          <motion.circle
            key={`particle-${index}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill={metalConfig.eyeColor}
            filter="url(#tinyGlow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [particle.y, particle.y - 20 * particle.speed, particle.y - 40 * particle.speed],
              x: [particle.x, particle.x + (Math.random() * 10 - 5), particle.x + (Math.random() * 20 - 10)]
            }}
            transition={{
              duration: 2 * particle.speed,
              delay: particle.delay,
              repeat: Infinity,
              repeatDelay: Math.random() * 3 + 1
            }}
          />
        ))}
        
        {/* Processing status indicators */}
        {robotState.isProcessing && (
          <g>
            {/* Circular progress indicator */}
            <motion.circle
              cx="90"
              cy="30"
              r="4"
              fill="none"
              stroke={metalConfig.eyeColor}
              strokeWidth="1"
              strokeDasharray="15 10"
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ transformOrigin: '90px 30px' }}
            />
            
            {/* Processing pulse */}
            <motion.circle
              cx="90"
              cy="30"
              r="2"
              fill={metalConfig.eyeGlow}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </g>
        )}
        
        {/* Audio visualization when speaking */}
        {robotState.isSpeaking && (
          <g>
            {/* Audio wave visualization */}
            <motion.path
              d="M90,60 Q95,55 100,60 Q105,65 110,60"
              stroke={metalConfig.eyeGlow}
              strokeWidth="1"
              fill="none"
              animate={{
                d: [
                  "M90,60 Q95,55 100,60 Q105,65 110,60",
                  "M90,60 Q95,65 100,60 Q105,55 110,60",
                  "M90,60 Q95,58 100,62 Q105,58 110,60"
                ]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </g>
        )}
      </svg>
      
      {/* Display text below if needed */}
      {showText && (
        <div className="text-center mt-2 text-sm font-medium" style={{ color: metalConfig.eyeGlow }}>
          <p>AstroBot AI</p>
        </div>
      )}
    </div>
  );
};

export default AstroBotMascot;