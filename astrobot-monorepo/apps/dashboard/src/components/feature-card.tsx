"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            delay,
            duration: 0.5,
            ease: [0.1, 0.4, 0.2, 1]
          }
        }
      }}
    >
      <div className="glass-effect rounded-lg h-full relative group overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
        
        {/* Content */}
        <div className="relative p-6 space-y-4">
          <h3 className="text-xl font-semibold bg-gradient-to-br from-blue-300 to-purple-300 bg-clip-text text-transparent">{title}</h3>
          <p className="text-white/80">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}