import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import gsap from "gsap";

// Advanced animation sequences for humanoid robot interactions
export const ANIMATION_SEQUENCES = {
  IDLE: "idle",
  GREETING: "greeting",
  WAVE: "wave",
  WALK: "walk",
  RUN: "run",
  THINK: "think",
  EXPLAIN: "explain",
  SCAN: "scan",
  BUILD: "build",
  REPAIR: "repair",
  SURPRISED: "surprised",
  ALERT: "alert",
  HOLOGRAM: "hologram",
  TYPING: "typing",
  PROCESSING: "processing",
  HAPPY: "happy",
  SAD: "sad",
  CONFUSED: "confused"
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
  onAnimationComplete?: () => void;
  onInteraction?: (type: string) => void;
}

const AstroBotMascot: React.FC<AstroBotMascotProps> = ({
  size = "default",
  showText = true,
  animate = true,
  showParticles = "none", // Default to no particles
  animationSequence = null,
  hologramText = null,
  interactive = true,
  emotionalState = "neutral",
  onAnimationComplete,
  onInteraction
}) => {
  // Calculate dimensions based on size
  const dimensions = {
    small: { width: 120, height: 200 },
    default: { width: 200, height: 330 },
    large: { width: 280, height: 460 },
    xlarge: { width: 360, height: 590 }
  }[size];
  
  // Animation controls for each body part
  const headControls = useAnimation();
  const eyesControls = useAnimation();
  const eyeGlowControls = useAnimation();
  const faceControls = useAnimation();
  const bodyControls = useAnimation();
  const chestControls = useAnimation();
  const armsControls = useAnimation();
  const leftArmControls = useAnimation();
  const rightArmControls = useAnimation();
  const leftHandControls = useAnimation();
  const rightHandControls = useAnimation();
  const leftLegControls = useAnimation();
  const rightLegControls = useAnimation();
  const energyCoreControls = useAnimation();
  const hologramControls = useAnimation();
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // States for animations and interactions
  const [currentSequence, setCurrentSequence] = useState<string | null>(animationSequence || ANIMATION_SEQUENCES.IDLE);
  const [hovering, setHovering] = useState(false);
  const [lookingAt, setLookingAt] = useState({ x: 0, y: 0 });
  const [robotState, setRobotState] = useState({
    energyLevel: 100,
    processingLoad: 0,
    isWatching: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false
  });
  
  // Colors configuration for the humanoid robot - clean silver/white with blue accents
  const robotColors = {
    bodyMain: "#F0F2F5", // Light silver-white main body
    bodyHighlight: "#FFFFFF", // White highlights
    bodyShadow: "#D1D5DB", // Light gray shadow areas
    joints: "#9CA3AF", // Darker gray for joints
    accent: "#3B82F6", // Bright blue accent
    accentGlow: "#60A5FA", // Lighter blue glow
    eyeColor: "#10B981", // Teal eye color
    eyeGlow: "#34D399", // Lighter teal glow
    energyCore: "#3B82F6", // Blue energy core
    energyCoreGlow: "#60A5FA", // Lighter blue energy core glow
    metalReflection: "#F8FAFC", // Very light silver for reflections
  };
  
  // Generate particles for hologram effects only when needed
  const [hologramParticles, setHologramParticles] = useState<Array<{x: number, y: number, r: number, delay: number, speed: number}>>([]);
  
  useEffect(() => {
    if (showParticles !== "none" && (
        currentSequence === ANIMATION_SEQUENCES.HOLOGRAM || 
        currentSequence === ANIMATION_SEQUENCES.PROCESSING ||
        currentSequence === ANIMATION_SEQUENCES.SCAN ||
        currentSequence === ANIMATION_SEQUENCES.TYPING
      )) {
      const particles = [];
      const particleCount = 
        showParticles === "typing" ? 10 : 
        showParticles === "intense" ? 20 : 15;
      
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
  }, [showParticles, currentSequence]);
  
  // Handle animation sequence changes
  useEffect(() => {
    if (animationSequence) {
      setCurrentSequence(animationSequence);
    }
  }, [animationSequence]);

  // Emotional state effects
  useEffect(() => {
    if (!animate) return;
    
    // Eye glow effects based on emotional state
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
        faceControls.start({
          scale: 1.05,
          transition: { duration: 0.3 }
        });
        energyCoreControls.start({
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 2, repeat: Infinity }
        });
        applyEyeEffects(5, 2);
        break;
      
      case "thinking":
        faceControls.start({
          rotateZ: [-2, 2, -2],
          transition: { duration: 3, repeat: Infinity }
        });
        energyCoreControls.start({
          opacity: [0.6, 0.8, 0.6],
          transition: { duration: 3, repeat: Infinity }
        });
        applyEyeEffects(3, 3);
        break;
      
      case "alert":
        faceControls.start({
          scale: 1.02,
          transition: { duration: 0.3 }
        });
        energyCoreControls.start({
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
          transition: { duration: 0.8, repeat: Infinity }
        });
        applyEyeEffects(6, 1);
        break;
      
      case "sad":
        faceControls.start({
          rotateX: 10,
          y: 5,
          transition: { duration: 0.5 }
        });
        energyCoreControls.start({
          opacity: 0.5,
          scale: 0.95,
          transition: { duration: 0.5 }
        });
        applyEyeEffects(2, 4);
        break;
      
      case "confused":
        faceControls.start({
          rotateZ: [0, -5, 0, 5, 0],
          transition: { duration: 3, repeat: Infinity }
        });
        energyCoreControls.start({
          opacity: [0.5, 0.7, 0.5],
          transition: { duration: 2, repeat: Infinity }
        });
        applyEyeEffects(4, 2.5);
        break;
      
      case "neutral":
      default:
        faceControls.start({
          scale: 1,
          rotateX: 0,
          rotateZ: 0,
          y: 0,
          transition: { duration: 0.5 }
        });
        energyCoreControls.start({
          scale: 1,
          opacity: 0.7,
          transition: { duration: 0.5 }
        });
        applyEyeEffects(3, 3);
        break;
    }
  }, [emotionalState, animate, eyeGlowControls, faceControls, energyCoreControls]);
  
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
      case ANIMATION_SEQUENCES.IDLE:
        // Subtle breathing animation
        const breatheSequence = async () => {
          gsap.to(svgRef.current, {
            duration: 3,
            repeat: -1,
            yoyo: true,
            keyframes: [
              { y: 0 },
              { y: -3 },
              { y: 0 }
            ],
            ease: "power1.inOut"
          });
          
          // Subtle arm movement
          gsap.to(".robot-arm-left", {
            duration: 4,
            repeat: -1,
            yoyo: true,
            rotation: -1,
            transformOrigin: "top center",
            ease: "power1.inOut"
          });
          
          gsap.to(".robot-arm-right", {
            duration: 4,
            repeat: -1,
            yoyo: true,
            rotation: 1,
            transformOrigin: "top center",
            ease: "power1.inOut",
            delay: 0.5
          });
          
          // Occasional head movement
          const headMovement = () => {
            const delay = 5 + Math.random() * 5;
            
            setTimeout(() => {
              headControls.start({
                rotateY: Math.random() > 0.5 ? 5 : -5,
                transition: { duration: 1.5 }
              }).then(() => {
                setTimeout(() => {
                  headControls.start({
                    rotateY: 0,
                    transition: { duration: 1.5 }
                  });
                  headMovement();
                }, 2000);
              });
            }, delay * 1000);
          };
          
          headMovement();
        };
        
        breatheSequence();
        
        // Cleanup for GSAP animations on sequence change
        cleanupFn = () => {
          gsap.killTweensOf(svgRef.current);
          gsap.killTweensOf(".robot-arm-left");
          gsap.killTweensOf(".robot-arm-right");
        };
        break;
        
      case ANIMATION_SEQUENCES.GREETING:
        // Natural arm wave
        const armWaveSequence = async () => {
          // First raise arm in natural motion
          await rightArmControls.start({
            rotate: -45, // Raise arm upward
            transition: { 
              duration: 0.6, 
              ease: "easeOut" 
            }
          });
          
          // Wave motion with the hand
          rightHandControls.start({
            rotate: [0, -15, 0, -15, 0, -15, 0],
            transition: { 
              duration: 1.8, 
              times: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
              ease: "easeInOut"
            }
          });
          
          // Slight body turn and head movement
          bodyControls.start({
            rotate: 5,
            transition: { duration: 0.5 }
          });
          
          headControls.start({
            rotate: 10,
            transition: { duration: 0.5 }
          });
          
          // Hold for a moment then lower arm
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await Promise.all([
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.7, ease: "easeInOut" }
            }),
            bodyControls.start({
              rotate: 0,
              transition: { duration: 0.5 }
            }),
            headControls.start({
              rotate: 0,
              transition: { duration: 0.5 }
            })
          ]);
        };
        
        armWaveSequence();
        cleanupFn = resetAfterDelay(3000);
        break;

      case ANIMATION_SEQUENCES.BUILD:
        // Building/working animation
        const buildSequence = async () => {
          // Step 1: Look at work area
          await Promise.all([
            headControls.start({
              rotate: 15,
              rotateX: 10,
              transition: { duration: 0.5 }
            }),
            bodyControls.start({
              rotate: 10,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Step 2: Both arms work together in coordinated motion
          const armCycles = 3;
          for (let i = 0; i < armCycles; i++) {
            await Promise.all([
              leftArmControls.start({
                rotate: [-20, -45, -20],
                transition: { duration: 1.2, times: [0, 0.5, 1] }
              }),
              rightArmControls.start({
                rotate: [-45, -20, -45],
                transition: { duration: 1.2, times: [0, 0.5, 1] }
              }),
              // Hands move with arms but with slight delay
              leftHandControls.start({
                rotate: [0, 15, 0],
                transition: { duration: 1.2, times: [0, 0.5, 1], delay: 0.1 }
              }),
              rightHandControls.start({
                rotate: [15, 0, 15],
                transition: { duration: 1.2, times: [0, 0.5, 1], delay: 0.1 }
              })
            ]);
          }
          
          // Step 3: Return to neutral position
          await Promise.all([
            headControls.start({
              rotate: 0,
              rotateX: 0,
              transition: { duration: 0.6 }
            }),
            bodyControls.start({
              rotate: 0,
              transition: { duration: 0.6 }
            }),
            leftArmControls.start({
              rotate: 0,
              transition: { duration: 0.6 }
            }),
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.6 }
            })
          ]);
        };
        
        buildSequence();
        cleanupFn = resetAfterDelay(4500);
        break;
        
      case ANIMATION_SEQUENCES.REPAIR:
        // Technical repair animation - more precise than build
        const repairSequence = async () => {
          // Step 1: Focus attention
          await Promise.all([
            headControls.start({
              rotateX: 15,
              transition: { duration: 0.4 }
            }),
            bodyControls.start({
              rotateX: 5,
              transition: { duration: 0.4 }
            })
          ]);
          
          // Step 2: Right arm extends to work while left arm supports
          await Promise.all([
            rightArmControls.start({
              rotate: -60,
              transition: { duration: 0.5 }
            }),
            leftArmControls.start({
              rotate: -20,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Step 3: Precision hand movements
          for (let i = 0; i < 3; i++) {
            await rightHandControls.start({
              rotate: [0, 10, -10, 0],
              transition: { duration: 0.8, times: [0, 0.33, 0.66, 1] }
            });
          }
          
          // Step 4: Switch arms for final adjustments
          await Promise.all([
            rightArmControls.start({
              rotate: -30,
              transition: { duration: 0.4 }
            }),
            leftArmControls.start({
              rotate: -50,
              transition: { duration: 0.4 }
            })
          ]);
          
          // Left hand precision work
          for (let i = 0; i < 2; i++) {
            await leftHandControls.start({
              rotate: [0, -15, 0, -15, 0],
              transition: { duration: 0.8, times: [0, 0.25, 0.5, 0.75, 1] }
            });
          }
          
          // Step 5: Completion - return to neutral with satisfaction
          await Promise.all([
            headControls.start({
              rotateX: 0,
              transition: { duration: 0.5 }
            }),
            bodyControls.start({
              rotateX: 0,
              transition: { duration: 0.5 }
            }),
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.6 }
            }),
            leftArmControls.start({
              rotate: 0,
              transition: { duration: 0.6 }
            })
          ]);
        };
        
        repairSequence();
        cleanupFn = resetAfterDelay(5000);
        break;
        
      case ANIMATION_SEQUENCES.SURPRISED:
        // Quick surprise reaction
        const surpriseSequence = async () => {
          // Quick simultaneous movements
          await Promise.all([
            bodyControls.start({
              y: -10,
              transition: { duration: 0.3, type: "spring", stiffness: 500 }
            }),
            headControls.start({
              y: -5,
              scale: 1.05,
              transition: { duration: 0.3 }
            }),
            leftArmControls.start({
              rotate: -30,
              transition: { duration: 0.3 }
            }),
            rightArmControls.start({
              rotate: -30,
              transition: { duration: 0.3 }
            }),
            eyesControls.start({
              scale: 1.2,
              transition: { duration: 0.2 }
            })
          ]);
          
          // Return to normal slightly slower
          await Promise.all([
            bodyControls.start({
              y: 0,
              transition: { duration: 0.5, type: "spring" }
            }),
            headControls.start({
              y: 0,
              scale: 1,
              transition: { duration: 0.5 }
            }),
            leftArmControls.start({
              rotate: 0,
              transition: { duration: 0.5 }
            }),
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.5 }
            }),
            eyesControls.start({
              scale: 1,
              transition: { duration: 0.4 }
            })
          ]);
        };
        
        surpriseSequence();
        cleanupFn = resetAfterDelay(1500);
        break;

      case ANIMATION_SEQUENCES.WALK:
        // Natural walking animation
        const walkSequence = async () => {
          // Setup continuous walk cycle
          const walkCycle = () => {
            // Body slight bounce
            gsap.to(svgRef.current, {
              duration: 1,
              repeat: -1,
              yoyo: true,
              keyframes: [
                { y: 0 },
                { y: -5 },
                { y: 0 }
              ],
              ease: "power1.inOut"
            });
            
            // Arms swing opposite to legs
            gsap.to(".robot-arm-left", {
              duration: 1,
              repeat: -1,
              yoyo: true,
              rotation: 25,
              transformOrigin: "top center",
              ease: "power1.inOut"
            });
            
            gsap.to(".robot-arm-right", {
              duration: 1,
              repeat: -1,
              yoyo: true,
              rotation: -25,
              transformOrigin: "top center",
              ease: "power1.inOut",
              delay: 0.5 // Offset for opposing motion
            });
            
            // Legs alternate
            gsap.to(".robot-leg-left", {
              duration: 1,
              repeat: -1,
              yoyo: true,
              rotation: -20,
              transformOrigin: "top center",
              ease: "power1.inOut",
              delay: 0.5 // Offset for opposing motion
            });
            
            gsap.to(".robot-leg-right", {
              duration: 1,
              repeat: -1,
              yoyo: true,
              rotation: 20,
              transformOrigin: "top center",
              ease: "power1.inOut"
            });
          };
          
          walkCycle();
          await new Promise(resolve => setTimeout(resolve, 5000));
        };
        
        walkSequence();
        cleanupFn = () => {
          gsap.killTweensOf(svgRef.current);
          gsap.killTweensOf(".robot-arm-left");
          gsap.killTweensOf(".robot-arm-right");
          gsap.killTweensOf(".robot-leg-left");
          gsap.killTweensOf(".robot-leg-right");
        };
        break;
        
      case ANIMATION_SEQUENCES.HOLOGRAM:
        // Hologram projection animation with particles
        const hologramSequence = async () => {
          // Step 1: Prepare stance
          await Promise.all([
            bodyControls.start({
              rotate: 0,
              transition: { duration: 0.4 }
            }),
            leftArmControls.start({
              rotate: -45,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Step 2: Extend right arm for projection
          await rightArmControls.start({
            rotate: -90,
            transition: { 
              duration: 0.6, 
              type: "spring", 
              stiffness: 400 
            }
          });
          
          // Step 3: Start hologram "emission"
          hologramControls.start({
            opacity: [0, 0.8, 0.6, 0.9, 0.7],
            scale: [0.9, 1.1, 1, 1.05, 1],
            transition: { 
              duration: 4, 
              times: [0, 0.2, 0.4, 0.7, 1],
              repeat: 1,
              repeatType: "reverse"
            }
          });
          
          // Hold the projection for a few seconds
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // Step 4: End hologram and return to neutral
          await Promise.all([
            rightArmControls.start({
              rotate: 0,
              transition: { duration: 0.7 }
            }),
            leftArmControls.start({
              rotate: 0,
              transition: { duration: 0.7 }
            }),
            hologramControls.start({
              opacity: 0,
              transition: { duration: 0.5 }
            })
          ]);
        };
        
        hologramSequence();
        cleanupFn = resetAfterDelay(9000);
        break;

      default:
        // Default idle behavior with subtle movement
        bodyControls.start({
          y: [0, -3, 0],
          transition: { 
            duration: 4, 
            times: [0, 0.5, 1], 
            repeat: Infinity,
            repeatType: "reverse" 
          }
        });
        
        // Subtle head movement
        headControls.start({
          rotate: [0, 2, 0, -2, 0],
          transition: { 
            duration: 10, 
            times: [0, 0.25, 0.5, 0.75, 1], 
            repeat: Infinity,
            repeatType: "loop" 
          }
        });
        
        break;
    }
    
    // Return cleanup function
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [currentSequence, animate, headControls, bodyControls, eyesControls, leftArmControls, 
      rightArmControls, leftHandControls, rightHandControls, leftLegControls, rightLegControls, 
      energyCoreControls, hologramControls, onAnimationComplete]);
  
  // Interactive mouse hover/tracking behavior
  useEffect(() => {
    if (!interactive || !containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate normalized coordinates (-1 to 1)
      const normalizedX = (e.clientX - centerX) / (rect.width / 2);
      const normalizedY = (e.clientY - centerY) / (rect.height / 2);
      
      // Limit tracking to when mouse is relatively close
      const distanceFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
      
      if (distanceFromCenter < 2) {
        setLookingAt({ x: normalizedX, y: normalizedY });
        
        // Subtle head tracking
        headControls.start({
          rotateY: normalizedX * 10,
          rotateX: -normalizedY * 5,
          transition: { type: "spring", stiffness: 100, damping: 10 }
        });
        
        // Body slightly follows head for larger movements
        if (Math.abs(normalizedX) > 0.5) {
          bodyControls.start({
            rotateY: normalizedX * 3,
            transition: { type: "spring", stiffness: 70, damping: 15 }
          });
        }
      }
    };
    
    const handleMouseEnter = () => {
      setHovering(true);
      
      // Subtle "attention" animation
      headControls.start({
        y: -3,
        transition: { duration: 0.3 }
      });
      
      if (onInteraction) onInteraction("hover_start");
    };
    
    const handleMouseLeave = () => {
      setHovering(false);
      setLookingAt({ x: 0, y: 0 });
      
      // Reset positions
      headControls.start({
        rotateY: 0,
        rotateX: 0,
        y: 0,
        transition: { duration: 0.5 }
      });
      
      bodyControls.start({
        rotateY: 0,
        transition: { duration: 0.7 }
      });
      
      if (onInteraction) onInteraction("hover_end");
    };
    
    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    containerRef.current.addEventListener("mouseenter", handleMouseEnter);
    containerRef.current.addEventListener("mouseleave", handleMouseLeave);
    
    // Cleanup
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (containerRef.current) {
        containerRef.current.removeEventListener("mouseenter", handleMouseEnter);
        containerRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [interactive, headControls, bodyControls, onInteraction]);
  
  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* SVG Robot - Humanoid design */}
      <svg 
        ref={svgRef}
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox="0 0 180 300" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Base/Shadow */}
        <ellipse 
          cx="90" 
          cy="280" 
          rx="30" 
          ry="5" 
          fill="rgba(0,0,50,0.2)" 
          opacity="0.5"
        />
        
        {/* Legs Group */}
        <motion.g animate={leftLegControls} className="robot-leg-left">
          {/* Left Leg */}
          <path 
            d="M70 170 L65 220 L60 260 Q60 270 70 270 L75 270 Q85 270 85 260 L80 220 L75 170 Z" 
            fill={robotColors.bodyMain} 
            stroke={robotColors.bodyShadow} 
            strokeWidth="1"
          />
          {/* Left Leg Joint */}
          <circle cx="70" cy="170" r="8" fill={robotColors.joints} />
          {/* Left Foot */}
          <path 
            d="M60 270 L85 270 L90 275 L55 275 Z" 
            fill={robotColors.bodyShadow}
          />
          {/* Left Leg Details */}
          <path 
            d="M70 180 L70 250" 
            stroke={robotColors.bodyShadow} 
            strokeWidth="1" 
            strokeDasharray="2 4"
          />
          <rect 
            x="65" 
            y="220" 
            width="15" 
            height="8" 
            rx="2" 
            fill={robotColors.joints}
          />
          {/* Accent Light */}
          <rect 
            x="70" 
            y="225" 
            width="5" 
            height="2" 
            rx="1" 
            fill={robotColors.accent}
            className="filter blur-[1px]"
          />
        </motion.g>
        
        <motion.g animate={rightLegControls} className="robot-leg-right">
          {/* Right Leg */}
          <path 
            d="M110 170 L115 220 L120 260 Q120 270 110 270 L105 270 Q95 270 95 260 L100 220 L105 170 Z" 
            fill={robotColors.bodyMain} 
            stroke={robotColors.bodyShadow} 
            strokeWidth="1"
          />
          {/* Right Leg Joint */}
          <circle cx="110" cy="170" r="8" fill={robotColors.joints} />
          {/* Right Foot */}
          <path 
            d="M120 270 L95 270 L90 275 L125 275" 
            fill={robotColors.bodyShadow}
          />
          {/* Right Leg Details */}
          <path 
            d="M110 180 L110 250" 
            stroke={robotColors.bodyShadow} 
            strokeWidth="1" 
            strokeDasharray="2 4"
          />
          <rect 
            x="100" 
            y="220" 
            width="15" 
            height="8" 
            rx="2" 
            fill={robotColors.joints}
          />
          {/* Accent Light */}
          <rect 
            x="105" 
            y="225" 
            width="5" 
            height="2" 
            rx="1" 
            fill={robotColors.accent}
            className="filter blur-[1px]"
          />
        </motion.g>
        
        {/* Body Group */}
        <motion.g animate={bodyControls}>
          {/* Main Torso */}
          <path 
            d="M60 100 Q60 90 70 90 L110 90 Q120 90 120 100 L120 170 Q120 180 110 180 L70 180 Q60 180 60 170 Z" 
            fill={robotColors.bodyMain} 
            stroke={robotColors.bodyShadow} 
            strokeWidth="1.5"
          />
          
          {/* Shoulder Connection */}
          <rect 
            x="55" 
            y="100" 
            width="10" 
            height="15" 
            rx="5" 
            fill={robotColors.joints}
          />
          <rect 
            x="115" 
            y="100" 
            width="10" 
            height="15" 
            rx="5" 
            fill={robotColors.joints}
          />
          
          <motion.g animate={chestControls}>
            {/* Chest Plate */}
            <path 
              d="M70 95 L110 95 L115 115 L115 155 L110 175 L70 175 L65 155 L65 115 Z" 
              fill={robotColors.bodyHighlight} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="0.5"
            />
            
            {/* Chest Details - Panels */}
            <path 
              d="M75 105 L105 105 L105 135 L75 135 Z" 
              fill={robotColors.bodyMain} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="0.5"
            />
            
            {/* Energy Core */}
            <motion.g animate={energyCoreControls}>
              <circle 
                cx="90" 
                cy="120" 
                r="12" 
                fill={robotColors.energyCore} 
                className="filter blur-[1px]"
                opacity="0.7"
              />
              <circle 
                cx="90" 
                cy="120" 
                r="8" 
                fill={robotColors.energyCoreGlow} 
                className="filter blur-[2px]"
                opacity="0.9"
              />
              <circle 
                cx="90" 
                cy="120" 
                r="5" 
                fill={robotColors.bodyHighlight}
                opacity="1" 
              />
            </motion.g>
            
            {/* Lower Abdominal Panel */}
            <path 
              d="M75 145 L105 145 L105 165 L75 165 Z" 
              fill={robotColors.bodyMain} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="0.5"
            />
            
            {/* Accent Lights */}
            <rect 
              x="80" 
              y="150" 
              width="20" 
              height="2" 
              rx="1" 
              fill={robotColors.accent}
              className="filter blur-[1px]"
            />
            <rect 
              x="80" 
              y="155" 
              width="20" 
              height="2" 
              rx="1" 
              fill={robotColors.accent}
              className="filter blur-[1px]"
            />
            <rect 
              x="80" 
              y="160" 
              width="20" 
              height="2" 
              rx="1" 
              fill={robotColors.accent}
              className="filter blur-[1px]"
            />
          </motion.g>
        </motion.g>
        
        {/* Arms Group */}
        <motion.g animate={armsControls}>
          {/* Left Arm Group */}
          <motion.g animate={leftArmControls} className="robot-arm-left">
            {/* Upper Arm */}
            <path 
              d="M55 107 Q45 107 40 115 L35 150 Q35 160 45 160 L48 160 Q58 160 58 150 L55 115 Z" 
              fill={robotColors.bodyMain} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="1"
            />
            
            {/* Elbow Joint */}
            <circle cx="45" cy="160" r="6" fill={robotColors.joints} />
            
            {/* Forearm */}
            <path 
              d="M45 165 Q40 165 38 170 L32 190 Q30 200 38 205 L40 205 Q48 210 52 200 L54 170 Q55 165 50 165 Z" 
              fill={robotColors.bodyMain} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="1"
            />
            
            {/* Left Hand */}
            <motion.g animate={leftHandControls}>
              <path 
                d="M38 205 L38 210 Q38 215 43 215 L47 215 Q52 215 52 210 L52 200" 
                fill={robotColors.bodyHighlight} 
                stroke={robotColors.bodyShadow} 
                strokeWidth="1"
              />
              
              {/* Fingers */}
              <path 
                d="M40 215 L38 225 M43 215 L43 227 M46 215 L48 225" 
                stroke={robotColors.joints} 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </motion.g>
            
            {/* Arm Detail */}
            <circle 
              cx="45" 
              cy="190" 
              r="3" 
              fill={robotColors.accent}
              className="filter blur-[1px]"
            />
          </motion.g>
          
          {/* Right Arm Group */}
          <motion.g animate={rightArmControls} className="robot-arm-right">
            {/* Upper Arm */}
            <path 
              d="M125 107 Q135 107 140 115 L145 150 Q145 160 135 160 L132 160 Q122 160 122 150 L125 115 Z" 
              fill={robotColors.bodyMain} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="1"
            />
            
            {/* Elbow Joint */}
            <circle cx="135" cy="160" r="6" fill={robotColors.joints} />
            
            {/* Forearm */}
            <path 
              d="M135 165 Q140 165 142 170 L148 190 Q150 200 142 205 L140 205 Q132 210 128 200 L126 170 Q125 165 130 165 Z" 
              fill={robotColors.bodyMain} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="1"
            />
            
            {/* Right Hand */}
            <motion.g animate={rightHandControls}>
              <path 
                d="M142 205 L142 210 Q142 215 137 215 L133 215 Q128 215 128 210 L128 200" 
                fill={robotColors.bodyHighlight} 
                stroke={robotColors.bodyShadow} 
                strokeWidth="1"
              />
              
              {/* Fingers */}
              <path 
                d="M140 215 L142 225 M137 215 L137 227 M134 215 L132 225" 
                stroke={robotColors.joints} 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </motion.g>
            
            {/* Arm Detail */}
            <circle 
              cx="135" 
              cy="190" 
              r="3" 
              fill={robotColors.accent}
              className="filter blur-[1px]"
            />
          </motion.g>
        </motion.g>
        
        {/* Neck */}
        <rect 
          x="82" 
          y="80" 
          width="16" 
          height="10" 
          rx="3" 
          fill={robotColors.joints}
        />
        
        {/* Head Group */}
        <motion.g animate={headControls}>
          {/* Main Head */}
          <path 
            d="M70 40 Q70 30 80 30 L100 30 Q110 30 110 40 L110 80 Q110 90 100 90 L80 90 Q70 90 70 80 Z" 
            fill={robotColors.bodyMain} 
            stroke={robotColors.bodyShadow} 
            strokeWidth="1.5"
          />
          
          {/* Face Plate */}
          <motion.path 
            animate={faceControls}
            d="M75 35 L105 35 L105 85 L75 85 Z" 
            fill={robotColors.bodyHighlight} 
            stroke={robotColors.bodyShadow} 
            strokeWidth="0.5"
          />
          
          {/* Eyes Group */}
          <motion.g animate={eyesControls}>
            {/* Left Eye */}
            <circle 
              cx="83" 
              cy="50" 
              r="7" 
              fill={robotColors.eyeColor} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="0.5"
            />
            
            {/* Left Eye Glow */}
            <motion.circle 
              animate={eyeGlowControls}
              cx="83" 
              cy="50" 
              r="5" 
              fill={robotColors.eyeGlow} 
              className="filter blur-[2px]"
              opacity="0.8"
            />
            
            {/* Right Eye */}
            <circle 
              cx="97" 
              cy="50" 
              r="7" 
              fill={robotColors.eyeColor} 
              stroke={robotColors.bodyShadow} 
              strokeWidth="0.5"
            />
            
            {/* Right Eye Glow */}
            <motion.circle 
              animate={eyeGlowControls}
              cx="97" 
              cy="50" 
              r="5" 
              fill={robotColors.eyeGlow} 
              className="filter blur-[2px]"
              opacity="0.8"
            />
          </motion.g>
          
          {/* Mouth/Speaker Panel */}
          <rect 
            x="82" 
            y="65" 
            width="16" 
            height="8" 
            rx="2" 
            fill={robotColors.bodyShadow}
          />
          
          {/* Mouth Details */}
          <path 
            d="M84 69 L96 69" 
            stroke={robotColors.accent} 
            strokeWidth="2" 
            strokeLinecap="round"
            className="filter blur-[0.5px]"
          />
          
          {/* Head Details */}
          <path 
            d="M70 50 L65 50" 
            stroke={robotColors.joints} 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <path 
            d="M110 50 L115 50" 
            stroke={robotColors.joints} 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          
          {/* Head Accent */}
          <path 
            d="M85 30 L95 30" 
            stroke={robotColors.accent} 
            strokeWidth="3" 
            strokeLinecap="round"
            className="filter blur-[1px]"
          />
        </motion.g>
        
        {/* Hologram Projection (only visible when activated) */}
        {(currentSequence === ANIMATION_SEQUENCES.HOLOGRAM || hologramText) && (
          <motion.g animate={hologramControls}>
            {/* Hologram Beam */}
            <path 
              d="M142 205 L180 205 L200 220 L142 220 Z" 
              fill={robotColors.accent}
              opacity="0.3"
              className="filter blur-[3px]"
            />
            
            {/* Beam Pattern */}
            <path 
              d="M145 205 L145 220 M150 205 L150 220 M155 205 L155 220 M160 205 L160 220"
              stroke={robotColors.accentGlow}
              strokeWidth="0.5"
              opacity="0.5"
            />
            
            {/* Hologram Text */}
            {hologramText && (
              <text 
                x="160" 
                y="213" 
                fill={robotColors.accentGlow} 
                fontSize="8"
                textAnchor="middle"
                opacity="0.9"
                className="font-mono filter blur-[0.5px]"
              >
                {hologramText}
              </text>
            )}
          </motion.g>
        )}
      </svg>
      
      {/* Particle Effects (when activated) */}
      <AnimatePresence>
        {hologramParticles.length > 0 && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {hologramParticles.map((particle, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full bg-blue-400"
                initial={{ 
                  x: particle.x, 
                  y: particle.y,
                  width: particle.r, 
                  height: particle.r,
                  opacity: 0 
                }}
                animate={{ 
                  y: particle.y - 40 - Math.random() * 40,
                  opacity: [0, 0.8, 0],
                  scale: [1, 1.5, 0.5]
                }}
                transition={{ 
                  duration: 2 * particle.speed,
                  delay: particle.delay,
                  repeat: 3,
                  repeatType: "loop"
                }}
                exit={{ opacity: 0 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Text Display (if enabled) */}
      {showText && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-center font-mono text-blue-400">
          <span>{currentSequence || "idle"}</span>
        </div>
      )}
    </div>
  );
};

export default AstroBotMascot;