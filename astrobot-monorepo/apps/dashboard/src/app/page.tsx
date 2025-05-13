"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AstroBotLogo } from "../components/astrobot-logo";
import AdvancedCosmosBackground from "../components/advanced-cosmos-background";
import { FeatureCard } from "../components/feature-card";
import gsap from "gsap";

// Custom animation utilities (simplified version)
const animations = {
  fadeInItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  staggeredFadeIn: (staggerTime = 0.1) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerTime
      }
    }
  })
};

export default function Home() {
  const [logoAnimationTrigger, setLogoAnimationTrigger] = useState(false);
  const [windEffectTrigger, setWindEffectTrigger] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simple animation sequence for the logo
  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Start initial animation sequence
    timeoutRef.current = setTimeout(() => {
      setLogoAnimationTrigger(true);
      
      // After logo build completes, trigger wind effect
      timeoutRef.current = setTimeout(() => {
        setWindEffectTrigger(true);
        
        // After wind effect, return to normal
        timeoutRef.current = setTimeout(() => {
          setWindEffectTrigger(false);
        }, 1500);
      }, 3000);
    }, 1000);
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Handle logo animation complete event
  const handleLogoAnimationComplete = () => {
    console.log("Logo animation complete");
  };
  
  return (
    <div className="min-h-screen relative">
      
      {/* Advanced cosmic background with realistic shooting stars */}
      <AdvancedCosmosBackground stars={160} shootingStars={10} nebulae={4} interactive={true} />
      
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative pt-20 pb-32 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto overflow-hidden"
      >
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex mb-20 relative max-w-5xl mx-auto"
          >
            {/* Improved layout with mascot on left, logo as structure on right */}
            <div className="flex items-center justify-between w-full">
              {/* Left side - we've removed the embedded robot as it's now free-roaming */}
              <div className="flex-1 relative">
                {/* This empty div maintains the space in the layout for robot's "home" position */}
                <div className="opacity-0 invisible h-[400px] w-[240px]"></div>
              </div>
              
              {/* Right side - Logo structure being built */}
              <div className="flex-1 ml-12 relative">
                {/* Physical logo structure */}
                <div className="relative transform-gpu perspective-800 rotate-y-5">
                  {/* Structural base for the logo - metallic platform */}
                  <div className="absolute top-full left-0 right-0 h-4 bg-gradient-to-r from-blue-700 to-blue-900 rounded-lg opacity-80 transform -translate-y-2"></div>
                  
                  {/* The logo that gets built */}
                  <div className="relative">
                    <AstroBotLogo 
                      size="large" 
                      animationTrigger={logoAnimationTrigger} 
                      windEffectTrigger={windEffectTrigger}
                      onAnimationComplete={handleLogoAnimationComplete}
                      className="text-4xl font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl md:text-3xl font-medium text-white/90 max-w-3xl"
          >
            The Ultimate All-in-One AI-Powered Discord Assistant
          </motion.h2>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="max-w-2xl text-lg text-white/70"
          >
            Replace your entire bot collection with one powerful solution that does it all:
            AI chat, moderation, community engagement, gaming integrations, Twitch streaming
            features, and everything your Discord server needs – all in one sleek, customizable bot.
          </motion.p>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mt-8"
          >
            <Link 
              href="/login" 
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 rounded-md font-medium min-w-[200px] flex items-center justify-center group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-xl group-hover:opacity-75 transition-opacity duration-300"></span>
              <span className="relative z-10">Login to Dashboard</span>
            </Link>
            
            <Link 
              href="/features" 
              className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white px-8 py-4 rounded-md font-medium min-w-[200px] flex items-center justify-center group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400/20 to-pink-500/20 blur-xl group-hover:opacity-75 transition-opacity duration-300"></span>
              <span className="relative z-10">View All Features</span>
            </Link>
            
            <Link 
              href="/astro" 
              className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white px-8 py-4 rounded-md font-medium min-w-[200px] flex items-center justify-center group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-400/20 to-cyan-500/20 blur-xl group-hover:opacity-75 transition-opacity duration-300"></span>
              <span className="relative z-10">View AstroBot Mascot</span>
            </Link>
            
            <Link 
              href="https://discord.com/api/oauth2/authorize" 
              target="_blank" 
              className="relative overflow-hidden bg-slate-800/80 hover:bg-slate-700/80 border border-purple-500/30 text-white px-8 py-4 rounded-md font-medium min-w-[200px] flex items-center justify-center group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-xl group-hover:opacity-75 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#ffffff"/>
                </svg>
                Add to Discord
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto relative overflow-hidden">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={animations.staggeredFadeIn(0.1)}
          className="mb-16 text-center relative z-10"
        >
          <motion.h2 
            variants={animations.fadeInItem} 
            className="text-3xl md:text-4xl font-bold mb-4 text-white"
          >
            One Bot To Replace Them All
          </motion.h2>
          <motion.p 
            variants={animations.fadeInItem} 
            className="max-w-2xl mx-auto text-lg text-white/70"
          >
            Everything your Discord server needs, integrated seamlessly into one powerful bot
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group relative">
            <FeatureCard
              title="Advanced AI Assistant"
              description="Powered by both Claude 3.5 Sonnet and GPT-4o, AstroBot delivers intelligent conversations, answers complex questions, and assists with tasks beyond any other Discord bot."
              delay={0.1}
            />
            <Link href="/chat" className="absolute inset-0 z-10">
              <span className="sr-only">Try AI Chat</span>
            </Link>
            <div className="mt-2 text-center text-sm text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Try the AI Chat Demo →
            </div>
          </div>
          <FeatureCard
            title="All-in-One Bot Solution"
            description="Replace 5+ separate bots with one powerful assistant that handles moderation, music, gaming, utility commands, and so much more - all while saving server resources."
            delay={0.2}
          />
          <FeatureCard
            title="Gaming Integrations"
            description="From Minecraft server controls to game stat tracking, tournament organization, and cross-platform gaming notifications - everything gamers need in one place."
            delay={0.3}
          />
          <FeatureCard
            title="Content Creator Tools"
            description="Powerful Twitch/YouTube integrations with live notifications, clip highlights, viewer analytics, and subscriber-only Discord role management."
            delay={0.4}
          />
          <FeatureCard
            title="Smart Server Management"
            description="Automated welcome messages, custom self-role menus, scheduling tools, ticket systems, and intelligent server analytics to grow your community."
            delay={0.5}
          />
          <FeatureCard
            title="Premium AI Voice & Images"
            description="Generate stunning images with DALL-E, realistic voice with ElevenLabs, and provide rich-media experiences directly in your Discord channels."
            delay={0.6}
          />
        </div>
      </section>
    </div>
  );
}

