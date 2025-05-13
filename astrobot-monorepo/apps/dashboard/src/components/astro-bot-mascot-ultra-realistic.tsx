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
  detailLevel?: "medium" | "high" | "ultra";
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
  detailLevel = "ultra",
  onAnimationComplete,
  onInteraction
}) => {
  // Calculate dimensions based on size
  const dimensions = {
    small: { width: 120, height: 180 },
    default: { width: 180, height: 270 },
    large: { width: 240, height: 360 },
    xlarge: { width: 300, height: 450 }
  }[size];
  
  // Animation controls for each body part
  const headControls = useAnimation();
  const eyesControls = useAnimation();
  const irises = useAnimation();
  const pupils = useAnimation();
  const eyelidsControls = useAnimation();
  const browControls = useAnimation();
  const antennaControls = useAnimation();
  const bodyControls = useAnimation();
  const armsControls = useAnimation();
  const legLeftControls = useAnimation();
  const legRightControls = useAnimation();
  const fingerControls = useAnimation();
  const hologramControls = useAnimation();
  const mouthControls = useAnimation();
  const cheekLightsControls = useAnimation();
  const panelLightsControls = useAnimation();
  const energyCoreControls = useAnimation();
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // States for animations and interactions
  const [currentSequence, setCurrentSequence] = useState<string | null>(animationSequence || ANIMATION_SEQUENCES.IDLE);
  const [hovering, setHovering] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [hologramParticles, setHologramParticles] = useState<Array<{x: number, y: number, r: number, delay: number, speed: number}>>([]);
  const [lookingAt, setLookingAt] = useState({ x: 0, y: 0 });
  const [robotState, setRobotState] = useState({
    energyLevel: 100,
    processingLoad: 0,
    isWatching: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false
  });
  
  // Track animation history to control transitions
  const animationHistory = useRef<string[]>([]);
  
  // Generate particles for hologram effects
  useEffect(() => {
    if (showParticles !== "none") {
      const particles = [];
      const particleCount = 
        showParticles === "typing" ? 10 : 
        showParticles === "intense" ? 25 : 15;
      
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
  
  // Handle animation sequence changes
  useEffect(() => {
    if (animationSequence) {
      setCurrentSequence(animationSequence);
      animationHistory.current.push(animationSequence);
      if (animationHistory.current.length > 5) {
        animationHistory.current.shift();
      }
    }
  }, [animationSequence]);

  // Emotional state effects
  useEffect(() => {
    if (!animate) return;
    
    switch(emotionalState) {
      case "happy":
        browControls.start({ 
          d: "M15,22 Q20,18 25,22", 
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
        break;
      
      case "thinking":
        browControls.start({ 
          d: "M15,20 Q20,18 25,22", 
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
        break;
      
      case "alert":
        browControls.start({ 
          d: "M15,19 Q20,19 25,19", 
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
        break;
      
      case "sad":
        browControls.start({ 
          d: "M15,22 Q20,24 25,22", 
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
        break;
      
      case "confused":
        browControls.start({ 
          d: "M15,20 Q20,22 25,18", 
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
        break;
      
      case "neutral":
      default:
        browControls.start({ 
          d: "M15,20 Q20,20 25,20", 
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
        break;
    }
  }, [emotionalState, animate, browControls, mouthControls, cheekLightsControls]);
  
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
        armsControls.start({
          rotate: [0, 20, 0],
          transition: { duration: 1, times: [0, 0.5, 1] }
        });
        headControls.start({
          rotate: [0, -5, 0, 5, 0],
          transition: { duration: 1.5, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,42 32,38", 
          transition: { duration: 0.5 } 
        });
        cleanupFn = resetAfterDelay(1500);
        break;
        
      case ANIMATION_SEQUENCES.WAVE:
        const waveSequence = async () => {
          await armsControls.start({
            rotate: [0, 15, 0],
            transition: { duration: 0.3 }
          });
          for (let i = 0; i < 3; i++) {
            await armsControls.start({
              rotate: [0, 45, 0],
              transition: { duration: 0.5, times: [0, 0.5, 1] }
            });
          }
          await armsControls.start({
            rotate: 0,
            transition: { duration: 0.3 }
          });
        };
        waveSequence();
        headControls.start({
          rotate: [0, 5, 0, 5, 0],
          transition: { duration: 2, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        mouthControls.start({ 
          d: "M18,38 Q25,42 32,38", 
          transition: { duration: 0.3 } 
        });
        cleanupFn = resetAfterDelay(2500);
        break;
        
      case ANIMATION_SEQUENCES.JUMP:
        const jumpSequence = async () => {
          // Pre-jump crouch
          await Promise.all([
            bodyControls.start({
              y: 5,
              scaleY: 0.95,
              transition: { duration: 0.2 }
            }),
            legLeftControls.start({
              scaleY: 0.9,
              transition: { duration: 0.2 }
            }),
            legRightControls.start({
              scaleY: 0.9,
              transition: { duration: 0.2 }
            })
          ]);
          
          // Jump up
          await Promise.all([
            bodyControls.start({
              y: -20,
              scaleY: 1.05,
              transition: { duration: 0.3, ease: "easeOut" }
            }),
            legLeftControls.start({
              scaleY: 1.1,
              transition: { duration: 0.3 }
            }),
            legRightControls.start({
              scaleY: 1.1,
              transition: { duration: 0.3 }
            }),
            headControls.start({
              y: -5,
              transition: { duration: 0.3, delay: 0.05 }
            })
          ]);
          
          // Fall down
          await Promise.all([
            bodyControls.start({
              y: 5,
              scaleY: 0.9,
              transition: { duration: 0.3, ease: "easeIn" }
            }),
            legLeftControls.start({
              scaleY: 0.85,
              transition: { duration: 0.3 }
            }),
            legRightControls.start({
              scaleY: 0.85,
              transition: { duration: 0.3 }
            }),
            headControls.start({
              y: 3,
              transition: { duration: 0.3 }
            })
          ]);
          
          // Return to normal
          await Promise.all([
            bodyControls.start({
              y: 0,
              scaleY: 1,
              transition: { duration: 0.2 }
            }),
            legLeftControls.start({
              scaleY: 1,
              transition: { duration: 0.2 }
            }),
            legRightControls.start({
              scaleY: 1,
              transition: { duration: 0.2 }
            }),
            headControls.start({
              y: 0,
              transition: { duration: 0.2 }
            })
          ]);
        };
        jumpSequence();
        cleanupFn = resetAfterDelay(1500);
        break;
        
      case ANIMATION_SEQUENCES.BUILD:
      case ANIMATION_SEQUENCES.REPAIR:
        // Complex building/repairing animation
        const buildSequence = async () => {
          // Tool activation from hand
          await fingerControls.start({
            scale: [1, 0.8, 1.2, 1],
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.8, times: [0, 0.3, 0.7, 1] }
          });
          
          // Work with both arms in coordinated movement
          for (let i = 0; i < 3; i++) {
            await Promise.all([
              armsControls.start({
                rotate: i % 2 === 0 ? 15 : -5,
                transition: { duration: 0.4 }
              }),
              headControls.start({
                rotate: i % 2 === 0 ? -3 : 3,
                transition: { duration: 0.4 }
              }),
              energyCoreControls.start({
                scale: [1, 1.15, 1],
                opacity: [0.8, 1, 0.8],
                transition: { duration: 0.4, times: [0, 0.5, 1] }
              })
            ]);
          }
          
          // Finishing touches
          await armsControls.start({
            rotate: 0,
            transition: { duration: 0.4 }
          });
        };
        
        buildSequence();
        browControls.start({ 
          d: "M15,19 Q20,17 25,19", 
          transition: { duration: 0.3 } 
        });
        
        cleanupFn = resetAfterDelay(3500);
        break;
        
      case ANIMATION_SEQUENCES.SCAN:
        // Eye scanning animation with progressive glow
        eyesControls.start({
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1.3)", "brightness(1)"],
          transition: { duration: 2, times: [0, 0.3, 0.7, 1], repeat: 1, repeatType: "reverse" }
        });
        
        // Iris scanning movement - horizontal sweep
        irises.start({
          translateX: [-3, 3, -3],
          transition: { duration: 2, times: [0, 0.5, 1], repeat: 1 }
        });
        
        // Change pupil size during scan
        pupils.start({
          scale: [1, 0.7, 1.2, 1],
          transition: { duration: 2, times: [0, 0.3, 0.7, 1], repeat: 1 }
        });
        
        // Antenna activity during scan
        antennaControls.start({
          rotate: [0, 15, -15, 0],
          scale: [1, 1.1, 1.1, 1],
          filter: ["brightness(1)", "brightness(1.4)", "brightness(1.4)", "brightness(1)"],
          transition: { duration: 2, times: [0, 0.3, 0.7, 1] }
        });
        
        // Energy core pulsing during scan
        energyCoreControls.start({
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 1, times: [0, 0.5, 1], repeat: 3 }
        });
        
        setRobotState(prev => ({...prev, isProcessing: true}));
        
        cleanupFn = () => {
          resetAfterDelay(4000);
          setRobotState(prev => ({...prev, isProcessing: false}));
        };
        break;
        
      case ANIMATION_SEQUENCES.THINK:
        // Thoughtful expression
        browControls.start({ 
          d: "M15,20 Q20,18 25,22", 
          transition: { duration: 0.3 } 
        });
        
        // Thinking head movements
        headControls.start({
          rotate: [0, 5, 0, -5, 3, 0],
          transition: { duration: 4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
        });
        
        // Focused eye movements
        irises.start({
          translateX: [0, 2, -3, 0, 1, 0],
          translateY: [0, 1, -1, 2, 0, 0],
          transition: { duration: 4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
        });
        
        // Pupils adjusting focus
        pupils.start({
          scale: [1, 0.8, 1.1, 0.9, 1],
          transition: { duration: 4, times: [0, 0.2, 0.4, 0.7, 1] }
        });
        
        // Antenna activity while thinking
        antennaControls.start({
          scale: [1, 1.15, 1, 1.15, 1],
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1.2)", "brightness(1.5)", "brightness(1)"],
          transition: { duration: 4, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        
        // Processing lights pulsing
        panelLightsControls.start({
          opacity: [0.6, 1, 0.7, 0.9, 0.6],
          scale: [1, 1.1, 1, 1.1, 1],
          transition: { duration: 4, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        
        // Energy core pulsing slowly while thinking
        energyCoreControls.start({
          scale: [1, 1.1, 1, 1.1, 1],
          opacity: [0.8, 0.9, 0.8, 0.9, 0.8],
          transition: { duration: 4, times: [0, 0.25, 0.5, 0.75, 1] }
        });
        
        setRobotState(prev => ({...prev, isProcessing: true}));
        
        cleanupFn = () => {
          resetAfterDelay(4000);
          setRobotState(prev => ({...prev, isProcessing: false}));
        };
        break;
        
      case ANIMATION_SEQUENCES.HOLOGRAM:
        // Activate hologram projection
        hologramControls.start({
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1, 1, 0.8],
          transition: { duration: 3, times: [0, 0.2, 0.8, 1] }
        });
        
        // Eyes focus on hologram
        irises.start({
          translateX: [0, 3, 3, 0],
          transition: { duration: 3, times: [0, 0.2, 0.8, 1] }
        });
        
        // Slight head turn toward hologram
        headControls.start({
          rotate: [0, 3, 3, 0],
          transition: { duration: 3, times: [0, 0.2, 0.8, 1] }
        });
        
        // Energy core activity during projection
        energyCoreControls.start({
          scale: [1, 1.15, 1.15, 1],
          opacity: [0.8, 1, 1, 0.8],
          transition: { duration: 3, times: [0, 0.2, 0.8, 1] }
        });
        
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.WALK:
        // Walking cycle animation
        const walkSequence = async () => {
          for (let i = 0; i < 4; i++) {
            await Promise.all([
              // Body slight bouncing and shifting
              bodyControls.start({
                y: [0, -2, 0],
                x: [0, i % 2 === 0 ? 1 : -1, 0],
                rotate: [0, i % 2 === 0 ? 1 : -1, 0],
                transition: { duration: 0.5, times: [0, 0.5, 1] }
              }),
              
              // Alternating leg movements
              legLeftControls.start({
                rotate: i % 2 === 0 ? [0, 15, 0] : [0, -5, 0],
                y: i % 2 === 0 ? [0, -5, 0] : [0, 2, 0],
                transition: { duration: 0.5, times: [0, 0.5, 1] }
              }),
              
              legRightControls.start({
                rotate: i % 2 === 0 ? [0, -5, 0] : [0, 15, 0],
                y: i % 2 === 0 ? [0, 2, 0] : [0, -5, 0],
                transition: { duration: 0.5, times: [0, 0.5, 1] }
              }),
              
              // Arm swing in opposite phase of legs
              armsControls.start({
                rotate: i % 2 === 0 ? [0, -5, 0] : [0, 5, 0],
                transition: { duration: 0.5, times: [0, 0.5, 1] }
              }),
              
              // Head slight adjustments for natural movement
              headControls.start({
                y: [0, -1, 0],
                rotate: [0, i % 2 === 0 ? -1 : 1, 0],
                transition: { duration: 0.5, times: [0, 0.5, 1] }
              })
            ]);
          }
        };
        
        walkSequence();
        cleanupFn = resetAfterDelay(2200);
        break;
        
      case ANIMATION_SEQUENCES.BUILD_TEXT:
        // Animation for building text - shows construction process
        const buildTextSequence = async () => {
          // Tool activation
          await fingerControls.start({
            scale: [1, 1.2, 1],
            transition: { duration: 0.5, times: [0, 0.5, 1] }
          });
          
          // Construction movements
          for (let i = 0; i < 3; i++) {
            await Promise.all([
              armsControls.start({
                rotate: i % 2 === 0 ? 10 : 20,
                transition: { duration: 0.4 }
              }),
              headControls.start({
                rotate: i % 2 === 0 ? -2 : 2,
                transition: { duration: 0.4 }
              }),
              irises.start({
                translateX: i % 2 === 0 ? 2 : -2,
                transition: { duration: 0.4 }
              })
            ]);
          }
          
          // Finishing
          await armsControls.start({
            rotate: 0,
            transition: { duration: 0.3 }
          });
          
          // Admiring the work
          await headControls.start({
            rotate: [0, 3, 0],
            transition: { duration: 0.8, times: [0, 0.6, 1] }
          });
        };
        
        buildTextSequence();
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.SURPRISED:
        // Quick, surprised reaction
        Promise.all([
          // Wide eyes
          pupils.start({
            scale: [1, 0.7, 1],
            transition: { duration: 0.5, times: [0, 0.5, 1] }
          }),
          
          // Raised brows
          browControls.start({ 
            d: "M15,18 Q20,15 25,18", 
            transition: { duration: 0.2 } 
          }),
          
          // Head movement
          headControls.start({
            y: [0, -3, 0],
            rotate: [0, -2, 0],
            transition: { duration: 0.5, times: [0, 0.3, 1] }
          }),
          
          // Antenna reaction
          antennaControls.start({
            y: [0, -3, 0],
            scale: [1, 1.2, 1],
            transition: { duration: 0.6, times: [0, 0.3, 1] }
          }),
          
          // Open mouth
          mouthControls.start({ 
            d: "M18,38 Q25,43 32,38", 
            transition: { duration: 0.2 } 
          })
        ]);
        
        cleanupFn = resetAfterDelay(1000);
        break;
        
      case ANIMATION_SEQUENCES.HOVER:
        // Gentle hovering animation
        Promise.all([
          bodyControls.start({
            y: [0, -3, 0],
            transition: { 
              duration: 2,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut"
            }
          }),
          
          headControls.start({
            y: [0, -1, 0],
            transition: { 
              duration: 2,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: 0.1
            }
          })
        ]);
        
        // No cleanup for hover - it continues until changed
        break;
      
      case ANIMATION_SEQUENCES.BLINK:
        // Natural blinking animation
        eyelidsControls.start({
          scaleY: [0, 1, 0],
          opacity: [0, 1, 0],
          transition: { duration: 0.2, times: [0, 0.5, 1] }
        });
        
        cleanupFn = resetAfterDelay(300);
        break;
        
      case ANIMATION_SEQUENCES.LOOK_AROUND:
        // Looking around animation
        const lookSequence = async () => {
          // Look up
          await Promise.all([
            headControls.start({
              rotate: 0,
              rotateX: -10,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateY: -2,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Look right
          await Promise.all([
            headControls.start({
              rotate: 10,
              rotateX: 0,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateX: 3,
              translateY: 0,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Look down
          await Promise.all([
            headControls.start({
              rotate: 0,
              rotateX: 5,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateX: 0,
              translateY: 2,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Look left
          await Promise.all([
            headControls.start({
              rotate: -10,
              rotateX: 0,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateX: -3,
              translateY: 0,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Back to center
          await Promise.all([
            headControls.start({
              rotate: 0,
              rotateX: 0,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateX: 0,
              translateY: 0,
              transition: { duration: 0.5 }
            })
          ]);
        };
        
        lookSequence();
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.PROCESSING:
        // Processing animation - thinking hard
        Promise.all([
          // Energy core pulsing
          energyCoreControls.start({
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
            filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
            transition: { 
              duration: 1, 
              repeat: 5,
              repeatType: "mirror"
            }
          }),
          
          // Panel lights sequential activity
          panelLightsControls.start({
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.1, 1],
            transition: { 
              duration: 1,
              repeat: 5,
              repeatType: "mirror",
              delay: 0.2
            }
          }),
          
          // Antenna activity
          antennaControls.start({
            scale: [1, 1.15, 1],
            filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
            transition: { 
              duration: 1,
              repeat: 5,
              repeatType: "mirror" 
            }
          }),
          
          // Focusing eyes
          pupils.start({
            scale: [1, 0.8, 1],
            transition: { 
              duration: 2,
              repeat: 2,
              repeatType: "mirror"
            }
          }),
          
          // Thoughtful expression
          browControls.start({ 
            d: "M15,20 Q20,18 25,20", 
            transition: { duration: 0.5 } 
          })
        ]);
        
        setRobotState(prev => ({...prev, isProcessing: true}));
        
        cleanupFn = () => {
          resetAfterDelay(5500);
          setRobotState(prev => ({...prev, isProcessing: false}));
        };
        break;
        
      case ANIMATION_SEQUENCES.TYPING:
        // Typing animation
        const typeSequence = async () => {
          // Position for typing
          await Promise.all([
            armsControls.start({
              rotate: 15,
              y: 5,
              transition: { duration: 0.5 }
            }),
            headControls.start({
              rotate: -3,
              y: 2,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateY: 2,
              transition: { duration: 0.5 }
            })
          ]);
          
          // Typing motions
          for (let i = 0; i < 4; i++) {
            await Promise.all([
              fingerControls.start({
                scale: [1, 0.9, 1],
                transition: { duration: 0.3, times: [0, 0.5, 1] }
              }),
              armsControls.start({
                y: [5, 6, 5],
                transition: { duration: 0.3, times: [0, 0.5, 1] }
              })
            ]);
          }
          
          // Return to position
          await Promise.all([
            armsControls.start({
              rotate: 0,
              y: 0,
              transition: { duration: 0.5 }
            }),
            headControls.start({
              rotate: 0,
              y: 0,
              transition: { duration: 0.5 }
            }),
            irises.start({
              translateY: 0,
              transition: { duration: 0.5 }
            })
          ]);
        };
        
        typeSequence();
        cleanupFn = resetAfterDelay(3000);
        break;
        
      case ANIMATION_SEQUENCES.IDLE:
      default:
        // Reset all animations to default state
        bodyControls.start({ y: 0, x: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, scaleY: 1 });
        headControls.start({ y: 0, x: 0, rotate: 0, rotateX: 0, rotateY: 0 });
        armsControls.start({ rotate: 0, y: 0 });
        legLeftControls.start({ rotate: 0, y: 0, scaleY: 1 });
        legRightControls.start({ rotate: 0, y: 0, scaleY: 1 });
        
        // Return to neutral facial expression if not explicitly set
        if (emotionalState === "neutral") {
          browControls.start({ 
            d: "M15,20 Q20,20 25,20", 
            transition: { duration: 0.5 } 
          });
          mouthControls.start({ 
            d: "M18,38 Q25,38 32,38", 
            transition: { duration: 0.5 } 
          });
        }
        
        break;
    }
    
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [currentSequence, animate, headControls, eyesControls, irises, pupils, eyelidsControls, browControls, antennaControls, bodyControls, armsControls, legLeftControls, legRightControls, fingerControls, mouthControls, energyCoreControls, panelLightsControls, hologramControls, emotionalState, onAnimationComplete]);
  
  // Idle animations for lifelike behavior
  useEffect(() => {
    if (!animate) return;
    
    // Set up natural idle animations that run periodically
    const idleInterval = setInterval(() => {
      // Only run idle animations when in idle state
      if (currentSequence !== ANIMATION_SEQUENCES.IDLE) return;
      
      // Random subtle head movements
      const randomHeadMovement = () => {
        const movements = [
          { y: -1.5, rotate: 0, transition: { duration: 1, ease: "easeInOut" } },
          { y: 0, rotate: -2, transition: { duration: 1, ease: "easeInOut" } },
          { y: -1, rotate: 2, transition: { duration: 1, ease: "easeInOut" } },
          { y: 0, rotate: 0, transition: { duration: 1, ease: "easeInOut" } }
        ];
        
        headControls.start(movements[Math.floor(Math.random() * movements.length)]);
      };
      
      // Random eye movements - looking around naturally
      const randomEyeMovement = () => {
        const movements = [
          { translateX: 2, translateY: 0, transition: { duration: 0.7, ease: "easeInOut" } },
          { translateX: -2, translateY: 0, transition: { duration: 0.7, ease: "easeInOut" } },
          { translateX: 0, translateY: 1, transition: { duration: 0.7, ease: "easeInOut" } },
          { translateX: 0, translateY: -1, transition: { duration: 0.7, ease: "easeInOut" } },
          { translateX: 0, translateY: 0, transition: { duration: 0.7, ease: "easeInOut" } }
        ];
        
        irises.start(movements[Math.floor(Math.random() * movements.length)]);
      };
      
      // Random eye blinks
      const randomEyeBlink = () => {
        setBlinking(true);
        
        eyelidsControls.start({
          scaleY: [0, 1, 0],
          opacity: [0, 1, 0],
          transition: { duration: 0.2, times: [0, 0.5, 1] }
        }).then(() => setBlinking(false));
      };
      
      // Random antenna movements/pulses
      const randomAntennaMovement = () => {
        antennaControls.start({
          rotate: [-2, 2, 0],
          scale: [1, 1.05, 1],
          transition: { duration: 1.5, times: [0, 0.5, 1], ease: "easeInOut" }
        });
      };
      
      // Random energy core pulses - always breathing
      const randomEnergyPulse = () => {
        energyCoreControls.start({
          scale: [1, 1.1, 1],
          opacity: [0.8, 0.9, 0.8],
          transition: { duration: 2, times: [0, 0.5, 1], ease: "easeInOut" }
        });
      };
      
      // Choose random idle animations based on weighted probabilities
      const random = Math.random();
      
      if (random < 0.15) {
        randomHeadMovement();
      } else if (random < 0.4) {
        randomEyeMovement();
      } else if (random < 0.5) {
        randomEyeBlink();
      } else if (random < 0.65) {
        randomAntennaMovement();
      } else if (random < 0.8) {
        randomEnergyPulse();
      } else {
        // Sometimes do multiple animations together for more realism
        randomEyeMovement();
        randomHeadMovement();
      }
      
      // Always ensure regular blinking regardless of other animations
      if (Math.random() < 0.2 && !blinking) {
        randomEyeBlink();
      }
      
    }, 2000);
    
    // Constant "breathing" animation for the robot's body
    const breathingAnimation = () => {
      bodyControls.start({
        y: [0, -1, 0],
        scaleY: [1, 1.01, 1],
        transition: { 
          duration: 4, 
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut" 
        }
      });
    };
    
    // Start the subtle breathing animation
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      breathingAnimation();
    }
    
    return () => {
      clearInterval(idleInterval);
    };
  }, [animate, currentSequence, blinking, headControls, eyesControls, irises, pupils, eyelidsControls, antennaControls, bodyControls, energyCoreControls]);
  
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
        
        // Only apply tracking when in idle or hover states
        if (
          currentSequence === ANIMATION_SEQUENCES.IDLE || 
          currentSequence === ANIMATION_SEQUENCES.HOVER
        ) {
          // Limit motion range
          const limitedDeltaX = Math.max(-1, Math.min(1, deltaX)) * 3;
          const limitedDeltaY = Math.max(-1, Math.min(1, deltaY)) * 2;
          
          // Smooth eye tracking
          irises.start({
            translateX: limitedDeltaX,
            translateY: limitedDeltaY,
            transition: { duration: 0.3 }
          });
          
          // Subtle head turning to follow cursor
          headControls.start({
            rotate: limitedDeltaX * 3,
            rotateX: -limitedDeltaY * 2,
            transition: { duration: 0.5 }
          });
          
          setLookingAt({ x: limitedDeltaX, y: limitedDeltaY });
        }
      }
    };
    
    // Add mouse move listener to window
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [animate, interactive, currentSequence, lastMousePosition, headControls, irises]);
  
  // Hover behavior for interactive state
  const handleMouseEnter = useCallback(() => {
    if (!animate || !interactive) return;
    setHovering(true);
    
    // Only trigger hover animations when in idle state
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      setCurrentSequence(ANIMATION_SEQUENCES.HOVER);
      
      // Interested expression
      browControls.start({ 
        d: "M15,19 Q20,17 25,19", 
        transition: { duration: 0.3 } 
      });
      
      // Widen eyes slightly
      pupils.start({
        scale: 1.1,
        transition: { duration: 0.4 }
      });
      
      // Subtle mouth change
      mouthControls.start({ 
        d: "M18,38 Q25,39 32,38", 
        transition: { duration: 0.3 } 
      });
      
      // Brighten energy core
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
  }, [animate, interactive, currentSequence, browControls, pupils, mouthControls, energyCoreControls, onInteraction]);
  
  const handleMouseLeave = useCallback(() => {
    if (!animate || !interactive) return;
    setHovering(false);
    
    // Reset only if we were hovering
    if (currentSequence === ANIMATION_SEQUENCES.HOVER) {
      setCurrentSequence(ANIMATION_SEQUENCES.IDLE);
      
      // Reset eye position
      irises.start({
        translateX: 0,
        translateY: 0,
        transition: { duration: 0.4 }
      });
      
      // Reset expressions to neutral or current emotional state
      if (emotionalState === "neutral") {
        browControls.start({ 
          d: "M15,20 Q20,20 25,20", 
          transition: { duration: 0.3 } 
        });
        
        mouthControls.start({ 
          d: "M18,38 Q25,38 32,38", 
          transition: { duration: 0.3 } 
        });
      }
      
      // Reset pupil size
      pupils.start({
        scale: 1,
        transition: { duration: 0.4 }
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
  }, [animate, interactive, currentSequence, emotionalState, irises, browControls, mouthControls, pupils, energyCoreControls, onInteraction]);
  
  const handleClick = useCallback(() => {
    if (!animate || !interactive) return;
    
    // Trigger a sequence based on current state
    if (currentSequence === ANIMATION_SEQUENCES.IDLE || currentSequence === ANIMATION_SEQUENCES.HOVER) {
      // Randomize between greeting, wave, or jump
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
          {/* Enhanced gradients for realistic materials and lighting */}
          <linearGradient id="robotBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F8FAFF" />
            <stop offset="55%" stopColor="#F2F6FC" />
            <stop offset="75%" stopColor="#ECF2F8" />
            <stop offset="100%" stopColor="#E6EDF5" />
          </linearGradient>
          
          <linearGradient id="robotBodyShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6EDF5" />
            <stop offset="40%" stopColor="#DDE5EF" />
            <stop offset="70%" stopColor="#D5DEEA" />
            <stop offset="100%" stopColor="#CCD6E5" />
          </linearGradient>
          
          <linearGradient id="facePlateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#384863" />
            <stop offset="40%" stopColor="#2A3A55" />
            <stop offset="70%" stopColor="#1E2D45" />
            <stop offset="100%" stopColor="#162238" />
          </linearGradient>
          
          <linearGradient id="blueGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#50EEFF" />
            <stop offset="50%" stopColor="#33DDFF" />
            <stop offset="80%" stopColor="#22BBEE" />
            <stop offset="100%" stopColor="#0099CC" />
          </linearGradient>
          
          <linearGradient id="antennaGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#70F0FF" />
            <stop offset="50%" stopColor="#33DDFF" />
            <stop offset="100%" stopColor="#22BBEE" />
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
          
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A2B3CC" />
            <stop offset="60%" stopColor="#8899BB" />
            <stop offset="100%" stopColor="#667799" />
          </linearGradient>
          
          {/* Enhanced glow effects for realistic lighting */}
          <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#33DDFF" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="brightGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#50EEFF" floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="smallGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feFlood floodColor="#33DDFF" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          <filter id="tinyGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feFlood floodColor="#33DDFF" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
          
          {/* Metallic effect for reflective surfaces */}
          <linearGradient id="metallicEffect" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="25%" stopColor="#CCCCCC" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#CCCCCC" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>

          {/* Subtle lens flare for eyes */}
          <radialGradient id="lensFlare" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          
          {/* Hologram effect with scan lines */}
          <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#33DDFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#22BBEE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0099CC" stopOpacity="0.8" />
          </linearGradient>
          
          <pattern id="holoLines" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="5" x2="10" y2="5" stroke="#33DDFF" strokeWidth="0.5" strokeOpacity="0.3" />
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
        
        {/* ULTRA-REALISTIC ROBOT WITH HUMANOID PROPORTIONS */}
        <motion.g animate={bodyControls} filter="url(#dropShadow)">
          {/* LEGS - Properly proportioned to body */}
          <g>
            {/* Left leg */}
            <motion.g animate={legLeftControls} style={{ transformOrigin: '52px 130px' }}>
              <rect x="49" y="130" width="7" height="35" rx="3.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Left foot */}
              <rect x="46" y="165" width="13" height="5" rx="2.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Leg joint details */}
              <circle cx="52.5" cy="135" r="2" fill="#DDE5EF" />
              <circle cx="52.5" cy="155" r="2" fill="#DDE5EF" />
              
              {/* Decorative panel */}
              <rect x="50" y="142" width="5" height="10" rx="1" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
              
              {/* Subtle highlight */}
              <line x1="50" y1="130" x2="50" y2="165" stroke="url(#metallicEffect)" strokeWidth="0.5" />
            </motion.g>
            
            {/* Right leg */}
            <motion.g animate={legRightControls} style={{ transformOrigin: '67.5px 130px' }}>
              <rect x="64" y="130" width="7" height="35" rx="3.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Right foot */}
              <rect x="61" y="165" width="13" height="5" rx="2.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Leg joint details */}
              <circle cx="67.5" cy="135" r="2" fill="#DDE5EF" />
              <circle cx="67.5" cy="155" r="2" fill="#DDE5EF" />
              
              {/* Decorative panel */}
              <rect x="65" y="142" width="5" height="10" rx="1" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
              
              {/* Subtle highlight */}
              <line x1="70" y1="130" x2="70" y2="165" stroke="url(#metallicEffect)" strokeWidth="0.5" />
            </motion.g>
          </g>
          
          {/* MAIN BODY - Anthropomorphic torso design */}
          <g>
            {/* Central torso frame with subtle shaping */}
            <path 
              d="M40,85 C40,80 45,80 50,80 L70,80 C75,80 80,80 80,85 L80,125 C80,130 75,130 70,130 L50,130 C45,130 40,130 40,125 L40,85 Z" 
              fill="url(#robotBodyGradient)" 
              stroke="#DDE5EF" 
              strokeWidth="0.7"
            />
            
            {/* Subtle body contours for humanoid shape */}
            <path 
              d="M40,95 Q30,105 40,115 L40,125 C40,130 45,130 50,130 L70,130 C75,130 80,130 80,125 L80,115 Q90,105 80,95 L80,85 C80,80 75,80 70,80 L50,80 C45,80 40,80 40,85 L40,95 Z" 
              fill="url(#robotBodyGradient)" 
              stroke="#DDE5EF" 
              strokeWidth="0.3"
            />
            
            {/* Subtle panel divisions and details */}
            <path d="M50,80 L50,130" stroke="#DDE5EF" strokeWidth="0.3" opacity="0.7" />
            <path d="M70,80 L70,130" stroke="#DDE5EF" strokeWidth="0.3" opacity="0.7" />
            <path d="M40,100 L80,100" stroke="#DDE5EF" strokeWidth="0.3" opacity="0.7" />
            <path d="M40,115 L80,115" stroke="#DDE5EF" strokeWidth="0.3" opacity="0.7" />
            
            {/* Body center core - primary energy unit */}
            <circle cx="60" cy="105" r="11" fill="url(#facePlateGradient)" stroke="#A2B3CC" strokeWidth="0.5" />
            
            <motion.g animate={energyCoreControls}>
              <circle cx="60" cy="105" r="9" fill="url(#blueGlowGradient)" filter="url(#blueGlow)" />
              
              <motion.circle 
                cx="60" 
                cy="105" 
                r="6" 
                fill="#33DDFF" 
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
              
              {/* Energy swirls within core */}
              <motion.path
                d="M59,102 Q63,105 59,108 Q56,105 59,102 Z"
                fill="#FFFFFF"
                fillOpacity="0.3"
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
            
            {/* Top control panel */}
            <rect x="45" y="85" width="30" height="6" rx="2" fill="#A2B3CC" opacity="0.15" />
            <rect x="47" y="86" width="26" height="4" rx="1" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
            
            {/* Small status displays */}
            <rect x="48" y="87" width="6" height="2" rx="0.5" fill="#384863" opacity="0.8" />
            <rect x="57" y="87" width="6" height="2" rx="0.5" fill="#384863" opacity="0.8" />
            <rect x="66" y="87" width="6" height="2" rx="0.5" fill="#384863" opacity="0.8" />
            
            {/* Bottom control panel with colorful buttons */}
            <rect x="45" y="120" width="30" height="7" rx="2" fill="#A2B3CC" opacity="0.15" />
            <rect x="47" y="121" width="26" height="5" rx="1" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
            
            {/* Colorful buttons with advanced lighting effects */}
            <motion.g animate={panelLightsControls}>
              {[
                { x: 49.5, fill: "url(#greenButtonGradient)" },
                { x: 54.5, fill: "url(#purpleButtonGradient)" },
                { x: 60, fill: "url(#yellowButtonGradient)" },
                { x: 65.5, fill: "url(#blueGlowGradient)" },
                { x: 70.5, fill: "url(#greenButtonGradient)" }
              ].map((button, i) => (
                <motion.circle
                  key={`button-${i}`}
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
              ))}
            </motion.g>
            
            {/* Reflective highlights for metallic look */}
            <path 
              d="M40,85 C40,80 45,80 50,80 L55,80 C45,85 40,90 40,95 Z" 
              fill="url(#metallicEffect)" 
              opacity="0.2"
            />
            <path 
              d="M80,85 C80,80 75,80 70,80 L65,80 C75,85 80,90 80,95 Z" 
              fill="url(#metallicEffect)" 
              opacity="0.2"
            />
          </g>
          
          {/* ARMS - Articulated and properly proportioned */}
          <g>
            {/* Left arm */}
            <motion.g
              animate={armsControls}
              style={{ transformOrigin: '40px 90px' }}
            >
              {/* Shoulder joint */}
              <circle cx="40" cy="90" r="3.5" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.5" />
              <circle cx="40" cy="90" r="1.5" fill="#ECF2F8" />
              <circle cx="40" cy="90" r="2.5" fill="none" stroke="url(#metallicEffect)" strokeWidth="0.5" />
              
              {/* Upper arm */}
              <rect x="36.5" y="90" width="7" height="20" rx="3.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Elbow joint detail */}
              <circle cx="40" cy="110" r="3" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.5" />
              <circle cx="40" cy="110" r="1.2" fill="#ECF2F8" />
              <circle cx="40" cy="110" r="2.2" fill="none" stroke="url(#metallicEffect)" strokeWidth="0.5" />
              
              {/* Lower arm with panel detail */}
              <rect x="36.5" y="110" width="7" height="20" rx="3.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              <rect x="38" y="115" width="4" height="10" rx="1" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
              
              {/* Wrist joint */}
              <circle cx="40" cy="130" r="2.5" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.4" />
              <circle cx="40" cy="130" r="1" fill="#ECF2F8" />
              
              {/* Hand with articulated fingers */}
              <motion.g animate={fingerControls} style={{ transformOrigin: '40px 130px' }}>
                <rect x="36" y="130" width="8" height="6" rx="3" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
                
                {/* Finger details */}
                <g>
                  {[37.5, 40, 42.5].map((x, i) => (
                    <rect
                      key={`finger-${i}`}
                      x={x - 0.75}
                      y="134"
                      width="1.5"
                      height="4"
                      rx="0.75"
                      fill="#ECF2F8"
                      stroke="#DDE5EF"
                      strokeWidth="0.2"
                    />
                  ))}
                </g>
                
                {/* Fingertip light sensors */}
                <g>
                  {[37.5, 40, 42.5].map((x, i) => (
                    <circle
                      key={`fingertip-${i}`}
                      cx={x}
                      cy="137"
                      r="0.5"
                      fill="url(#blueGlowGradient)"
                      filter="url(#tinyGlow)"
                    />
                  ))}
                </g>
              </motion.g>
              
              {/* Subtle highlight for 3D effect */}
              <line x1="37" y1="90" x2="37" y2="130" stroke="url(#metallicEffect)" strokeWidth="0.5" />
            </motion.g>
            
            {/* Right arm - mirrored structure */}
            <motion.g
              animate={armsControls}
              style={{ transformOrigin: '80px 90px' }}
            >
              {/* Shoulder joint */}
              <circle cx="80" cy="90" r="3.5" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.5" />
              <circle cx="80" cy="90" r="1.5" fill="#ECF2F8" />
              <circle cx="80" cy="90" r="2.5" fill="none" stroke="url(#metallicEffect)" strokeWidth="0.5" />
              
              {/* Upper arm */}
              <rect x="76.5" y="90" width="7" height="20" rx="3.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Elbow joint detail */}
              <circle cx="80" cy="110" r="3" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.5" />
              <circle cx="80" cy="110" r="1.2" fill="#ECF2F8" />
              <circle cx="80" cy="110" r="2.2" fill="none" stroke="url(#metallicEffect)" strokeWidth="0.5" />
              
              {/* Lower arm with panel detail */}
              <rect x="76.5" y="110" width="7" height="20" rx="3.5" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
              <rect x="78" y="115" width="4" height="10" rx="1" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
              
              {/* Wrist joint */}
              <circle cx="80" cy="130" r="2.5" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.4" />
              <circle cx="80" cy="130" r="1" fill="#ECF2F8" />
              
              {/* Hand with articulated fingers */}
              <motion.g animate={fingerControls} style={{ transformOrigin: '80px 130px' }}>
                <rect x="76" y="130" width="8" height="6" rx="3" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
                
                {/* Finger details */}
                <g>
                  {[77.5, 80, 82.5].map((x, i) => (
                    <rect
                      key={`finger-${i}`}
                      x={x - 0.75}
                      y="134"
                      width="1.5"
                      height="4"
                      rx="0.75"
                      fill="#ECF2F8"
                      stroke="#DDE5EF"
                      strokeWidth="0.2"
                    />
                  ))}
                </g>
                
                {/* Fingertip light sensors */}
                <g>
                  {[77.5, 80, 82.5].map((x, i) => (
                    <circle
                      key={`fingertip-${i}`}
                      cx={x}
                      cy="137"
                      r="0.5"
                      fill="url(#blueGlowGradient)"
                      filter="url(#tinyGlow)"
                    />
                  ))}
                </g>
              </motion.g>
              
              {/* Subtle highlight for 3D effect */}
              <line x1="83" y1="90" x2="83" y2="130" stroke="url(#metallicEffect)" strokeWidth="0.5" />
            </motion.g>
          </g>
          
          {/* NECK - Articulated connector */}
          <g>
            <rect x="53" y="70" width="14" height="10" rx="3" fill="url(#robotBodyGradient)" stroke="#DDE5EF" strokeWidth="0.5" />
            
            {/* Neck details */}
            <circle cx="60" cy="75" r="3" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.3" />
            <circle cx="60" cy="75" r="1" fill="#ECF2F8" />
            
            {/* Neck cables */}
            <path d="M55,72 C55,75 55,78 55,80" stroke="#DDE5EF" strokeWidth="0.5" fill="none" />
            <path d="M57,72 C57,75 57,78 57,80" stroke="#DDE5EF" strokeWidth="0.5" fill="none" />
            <path d="M63,72 C63,75 63,78 63,80" stroke="#DDE5EF" strokeWidth="0.5" fill="none" />
            <path d="M65,72 C65,75 65,78 65,80" stroke="#DDE5EF" strokeWidth="0.5" fill="none" />
          </g>
          
          {/* HEAD ASSEMBLY - Highly detailed and expressive */}
          <motion.g 
            animate={headControls} 
            style={{ transformOrigin: "60px 45px" }}
          >
            {/* Main head - Rounded shape with metallic finish */}
            <circle 
              cx="60" 
              cy="45" 
              r="25" 
              fill="url(#robotBodyGradient)" 
              stroke="#DDE5EF" 
              strokeWidth="0.8"
            />
            
            {/* Subtle head panels for realistic look */}
            <path 
              d="M60,20 A25,25 0 0,1 85,45 A25,25 0 0,1 60,70 A25,25 0 0,1 35,45 A25,25 0 0,1 60,20 Z" 
              fill="none" 
              stroke="#DDE5EF" 
              strokeWidth="0.3" 
              strokeDasharray="2,5"
            />
            <path d="M35,45 L85,45" stroke="#DDE5EF" strokeWidth="0.3" opacity="0.5" />
            <path d="M60,20 L60,70" stroke="#DDE5EF" strokeWidth="0.3" opacity="0.5" />
            
            {/* Face plate - Curved shape for expressive potential */}
            <path 
              d="M45,35 C45,30 50,30 55,30 L65,30 C70,30 75,30 75,35 L75,55 C75,60 70,60 65,60 L55,60 C50,60 45,60 45,55 L45,35 Z" 
              fill="url(#facePlateGradient)" 
              stroke="#A2B3CC" 
              strokeWidth="0.5"
            />
            
            {/* Left side tech panel */}
            <rect x="35" y="40" width="6" height="10" rx="1" fill="#A2B3CC" opacity="0.15" />
            <rect x="36" y="41" width="4" height="8" rx="0.5" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
            
            {/* Right side tech panel */}
            <rect x="79" y="40" width="6" height="10" rx="1" fill="#A2B3CC" opacity="0.15" />
            <rect x="80" y="41" width="4" height="8" rx="0.5" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
            
            {/* Top indicator lights panel */}
            <rect x="48" y="25" width="24" height="5" rx="2.5" fill="#A2B3CC" opacity="0.15" />
            <rect x="49" y="25.5" width="22" height="4" rx="2" fill="#F2F6FC" stroke="#DDE5EF" strokeWidth="0.2" />
            
            {/* Status indicator lights - Top of head */}
            <g>
              {[51, 55, 60, 65, 69].map((x, i) => (
                <motion.circle 
                  key={`light-${i}`}
                  cx={x} 
                  cy="27.5" 
                  r="1.2" 
                  fill={i % 2 === 0 ? "#33DDFF" : "#22BBEE"}
                  animate={{
                    opacity: [0.7, 1, 0.7],
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
            
            {/* Cheek status lights */}
            <motion.g animate={cheekLightsControls}>
              <circle cx="45" cy="50" r="2" fill="url(#blueGlowGradient)" filter="url(#tinyGlow)" />
              <circle cx="75" cy="50" r="2" fill="url(#blueGlowGradient)" filter="url(#tinyGlow)" />
            </motion.g>
            
            {/* Antenna - Advanced communications array */}
            <motion.g animate={antennaControls} style={{ transformOrigin: "60px 15px" }}>
              <rect x="58" y="18" width="4" height="7" rx="2" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.5" />
              <rect x="59" y="10" width="2" height="8" rx="1" fill="url(#robotBodyShadow)" stroke="#DDE5EF" strokeWidth="0.5" />
              
              {/* Antenna pulsing light */}
              <circle cx="60" cy="10" r="3" fill="url(#antennaGlowGradient)" filter="url(#brightGlow)" />
              
              <motion.circle 
                cx="60" 
                cy="10" 
                r="2" 
                fill="#50EEFF" 
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
              
              {/* Antenna small details */}
              <rect x="59.5" y="15" width="1" height="1" rx="0.2" fill="#DDE5EF" />
              <rect x="59.5" y="17" width="1" height="1" rx="0.2" fill="#DDE5EF" />
            </motion.g>
            
            {/* EYES - Highly detailed and expressive */}
            <g>
              {/* Left eye socket */}
              <circle cx="52" cy="45" r="7" fill="#162238" stroke="#384863" strokeWidth="0.5" />
              
              {/* Left eye outer glow */}
              <motion.circle 
                cx="52" 
                cy="45" 
                r="6" 
                fill="url(#blueGlowGradient)" 
                filter="url(#blueGlow)"
                animate={eyesControls}
              />
              
              {/* Left eye inner parts (iris & pupil) */}
              <motion.g animate={irises}>
                <circle cx="52" cy="45" r="4" fill="#33DDFF" />
                
                <motion.circle 
                  cx="52" 
                  cy="45" 
                  r="2" 
                  fill="#162238" 
                  animate={pupils}
                />
                
                {/* Left eye lens flare */}
                <circle cx="52" cy="45" r="3.5" fill="url(#lensFlare)" style={{ mixBlendMode: 'overlay' }} />
                
                {/* Left eye micro details */}
                <path d="M51,45 A1,1 0 1,0 53,45 A1,1 0 1,0 51,45" fill="none" stroke="#50EEFF" strokeWidth="0.2" />
                <circle cx="51" cy="44" r="0.5" fill="#FFFFFF" opacity="0.8" />
              </motion.g>
              
              {/* Right eye socket */}
              <circle cx="68" cy="45" r="7" fill="#162238" stroke="#384863" strokeWidth="0.5" />
              
              {/* Right eye outer glow */}
              <motion.circle 
                cx="68" 
                cy="45" 
                r="6" 
                fill="url(#blueGlowGradient)" 
                filter="url(#blueGlow)"
                animate={eyesControls}
              />
              
              {/* Right eye inner parts (iris & pupil) */}
              <motion.g animate={irises}>
                <circle cx="68" cy="45" r="4" fill="#33DDFF" />
                
                <motion.circle 
                  cx="68" 
                  cy="45" 
                  r="2" 
                  fill="#162238" 
                  animate={pupils}
                />
                
                {/* Right eye lens flare */}
                <circle cx="68" cy="45" r="3.5" fill="url(#lensFlare)" style={{ mixBlendMode: 'overlay' }} />
                
                {/* Right eye micro details */}
                <path d="M67,45 A1,1 0 1,0 69,45 A1,1 0 1,0 67,45" fill="none" stroke="#50EEFF" strokeWidth="0.2" />
                <circle cx="67" cy="44" r="0.5" fill="#FFFFFF" opacity="0.8" />
              </motion.g>
              
              {/* Eyelids for blinking animation */}
              <motion.g animate={eyelidsControls}>
                <path d="M45,45 A7,7 0 1,0 59,45" fill="#F2F6FC" />
                <path d="M61,45 A7,7 0 1,0 75,45" fill="#F2F6FC" />
              </motion.g>
            </g>
            
            {/* Eyebrows for expressions */}
            <g>
              <motion.path 
                d="M15,20 Q20,20 25,20" 
                transform="translate(30, 25)"
                stroke="#384863" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                fill="none"
                animate={browControls}
              />
              
              <motion.path 
                d="M15,20 Q20,20 25,20" 
                transform="translate(46, 25) scale(-1, 1)"
                stroke="#384863" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                fill="none"
                animate={browControls}
              />
            </g>
            
            {/* Mouth/speech indicator - animated */}
            <g>
              <motion.path 
                d="M18,38 Q25,38 32,38" 
                transform="translate(35, 10)"
                stroke="#33DDFF" 
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
                    y="48"
                    width="1.5"
                    height={2 + i % 3}
                    rx="0.75"
                    fill="#33DDFF"
                    animate={{
                      height: robotState.isSpeaking ? [2, 4, 3, 5, 2][i % 5] : 2,
                      opacity: robotState.isSpeaking ? [0.6, 1, 0.8, 1, 0.6][i % 5] : 0.6,
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
            
            {/* Reflective highlights for realistic metallic face plate */}
            <path 
              d="M45,40 C48,35 55,30 60,30 C50,33 45,37 45,40 Z" 
              fill="url(#metallicEffect)" 
              opacity="0.2"
            />
            <path 
              d="M75,40 C72,35 65,30 60,30 C70,33 75,37 75,40 Z" 
              fill="url(#metallicEffect)" 
              opacity="0.2"
            />
            
            {/* Subtle panel detail on forehead */}
            <rect x="54" y="32" width="12" height="3" rx="1.5" fill="#384863" opacity="0.3" />
            <rect x="55" y="32.5" width="10" height="2" rx="1" fill="#F2F6FC" opacity="0.1" />
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
                stroke="#50EEFF"
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
                stroke="#50EEFF"
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
                    stroke="#50EEFF"
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
                    fill="#50EEFF"
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
                  <circle cx="100" cy="40" r="0.8" fill="#50EEFF" opacity="0.8" />
                  <circle cx={100 + hologramText.length * 5 + 10} cy="40" r="0.8" fill="#50EEFF" opacity="0.8" />
                  <circle cx="100" cy="60" r="0.8" fill="#50EEFF" opacity="0.8" />
                  <circle cx={100 + hologramText.length * 5 + 10} cy="60" r="0.8" fill="#50EEFF" opacity="0.8" />
                </motion.g>
              )}
            </motion.g>
          )}
        </motion.g>
        
        {/* Advanced hologram/energy particles with physics-based movement */}
        {hologramParticles.map((particle, index) => (
          <motion.circle
            key={`particle-${index}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill="#50EEFF"
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
        
        {/* Processing status indicators based on robot state */}
        {robotState.isProcessing && (
          <g>
            {/* Circular progress indicator */}
            <motion.circle
              cx="90"
              cy="30"
              r="4"
              fill="none"
              stroke="#33DDFF"
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
              fill="#33DDFF"
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
              stroke="#33DDFF"
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
        <div className="text-center mt-2 text-sm font-medium text-blue-500">
          <p>AstroBot AI</p>
        </div>
      )}
    </div>
  );
};

export default AstroBotMascot;