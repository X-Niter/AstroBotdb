import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface CosmosBackgroundProps {
  stars?: number;
  shootingStars?: number;
  nebulae?: number;
  interactive?: boolean;
  className?: string;
}

const AdvancedCosmosBackground: React.FC<CosmosBackgroundProps> = ({
  stars = 100,
  shootingStars = 5,
  nebulae = 3,
  interactive = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nebulaeControls = useAnimation();
  
  // Generate background stars with varying sizes and opacities
  const generateStars = () => {
    return Array.from({ length: stars }).map((_, i) => {
      const size = Math.random() * 2.5 + 0.5;
      // More realistic star color variation
      const hue = Math.random() > 0.8 
        ? Math.floor(Math.random() * 60) + 200  // Blueish
        : Math.floor(Math.random() * 60) + 200; // Whiteish-blue
        
      const saturation = Math.random() > 0.9 ? Math.floor(Math.random() * 50) + 50 : 10;
      const lightness = Math.floor(Math.random() * 30) + 70;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      const blurAmount = Math.random() > 0.7 ? '0.5px' : '0px';
      const twinkleDelay = Math.random() * 20;
      
      return (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            boxShadow: `0 0 ${size}px ${color.replace('hsl', 'hsla').replace(')', ', 0.8)')}`,
            filter: `blur(${blurAmount})`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            zIndex: 0
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.2, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 5,
            delay: twinkleDelay,
            ease: "easeInOut"
          }}
        />
      );
    });
  };

  // Generate realistic shooting stars with trails
  const generateShootingStars = () => {
    return Array.from({ length: shootingStars }).map((_, i) => {
      const size = Math.random() * 2 + 1;
      const duration = Math.random() * 2 + 1.5;
      const delay = Math.random() * 10 + i * 2;
      const angle = Math.random() * 30 - 15; // -15 to 15 degrees
      const startX = Math.random() * 80 + 10; // 10% to 90%
      const startY = Math.random() * 10; // Top 10%
      const distance = 40 + Math.random() * 40; // Travel distance
      
      // Calculate end coordinates based on angle
      const radians = (angle * Math.PI) / 180;
      const endX = startX + distance * Math.sin(radians);
      const endY = startY + distance * Math.cos(radians);
      
      return (
        <motion.div
          key={`shooting-star-${i}`}
          className="absolute"
          style={{
            width: size * 3,
            height: size * 30,
            background: `linear-gradient(to bottom, 
              rgba(255,255,255,0) 0%, 
              rgba(255,255,255,0.8) 20%, 
              rgba(180,220,255,0.8) 40%, 
              rgba(100,200,255,0.4) 60%, 
              rgba(70,120,255,0.2) 80%, 
              rgba(70,120,255,0) 100%)`,
            borderRadius: '50%',
            transform: `rotate(${angle}deg)`,
            opacity: 0,
            top: `${startY}%`,
            left: `${startX}%`,
            zIndex: 1,
            filter: 'blur(1px)',
          }}
          animate={{
            top: [`${startY}%`, `${endY}%`],
            left: [`${startX}%`, `${endX}%`],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: duration,
            times: [0, 0.2, 1],
            repeat: Infinity,
            repeatDelay: 8 + delay,
            ease: "easeOut",
          }}
        />
      );
    });
  };

  // Generate nebula/cosmic cloud effects
  const generateNebulae = () => {
    return Array.from({ length: nebulae }).map((_, i) => {
      const size = 150 + Math.random() * 200;
      const top = Math.random() * 70;
      const left = Math.random() * 70;
      
      // Generate random nebula colors
      const hue1 = Math.random() > 0.5 ? 220 + Math.random() * 40 : 270 + Math.random() * 30;
      const hue2 = hue1 - 30 + Math.random() * 60;
      
      return (
        <motion.div
          key={`nebula-${i}`}
          className="absolute rounded-full"
          animate={nebulaeControls}
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, 
              hsla(${hue1}, 70%, 30%, 0.03) 0%, 
              hsla(${hue2}, 90%, 20%, 0.02) 60%, 
              transparent 70%)`,
            top: `${top}%`,
            left: `${left}%`,
            zIndex: 0,
            filter: 'blur(20px)',
            transform: 'scale(1)',
          }}
        />
      );
    });
  };

  useEffect(() => {
    // Subtle animation for nebulae
    nebulaeControls.start({
      scale: [1, 1.05, 0.98, 1],
      opacity: [0.6, 0.7, 0.65, 0.6],
      transition: {
        duration: 20,
        repeat: Infinity,
        repeatType: "reverse",
      }
    });
    
    // Draw the seamless gradient background on canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size to match window
        const updateCanvasSize = () => {
          if (containerRef.current && canvas) {
            canvas.width = containerRef.current.offsetWidth;
            canvas.height = containerRef.current.offsetHeight;
            
            // Create a deep space gradient - ensure seamless edges
            const gradient = ctx.createRadialGradient(
              canvas.width / 2, canvas.height / 2, 0,
              canvas.width / 2, canvas.height / 2, canvas.width * 0.8
            );
            
            // Deep cosmic color palette
            gradient.addColorStop(0, "#101035"); // Dark blue-purple at center
            gradient.addColorStop(0.3, "#0a0a2a"); // Deep space blue
            gradient.addColorStop(0.6, "#070720"); // Very dark blue
            gradient.addColorStop(1, "#050515"); // Almost black with hint of blue
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add subtle texture/noise to avoid banding
            const noise = () => {
              for (let y = 0; y < canvas.height; y += 2) {
                for (let x = 0; x < canvas.width; x += 2) {
                  if (Math.random() > 0.995) { // Very subtle noise
                    const alpha = Math.random() * 0.03; // Very low opacity
                    ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
                    ctx.fillRect(x, y, 2, 2);
                  }
                }
              }
            };
            
            noise();
          }
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        
        return () => {
          window.removeEventListener('resize', updateCanvasSize);
        };
      }
    }
  }, [nebulaeControls]);

  return (
    <div 
      ref={containerRef}
      className={`fixed top-0 left-0 w-full h-full overflow-hidden ${className}`}
      style={{ zIndex: -1 }}
    >
      {/* Base canvas for seamless gradient background */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {/* Nebula effects */}
      {generateNebulae()}
      
      {/* Fixed stars */}
      {generateStars()}
      
      {/* Shooting stars */}
      {generateShootingStars()}
      
      {/* Vignette effect for depth */}
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
          zIndex: 2
        }}
      />
    </div>
  );
};

export default AdvancedCosmosBackground;