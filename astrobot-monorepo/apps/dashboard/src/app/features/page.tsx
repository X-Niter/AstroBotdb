"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Define feature categories
const CATEGORIES = [
  "AI & Assistant",
  "Moderation",
  "Gaming",
  "Server Management",
  "Media & Entertainment",
  "Productivity",
  "Utility",
  "Content Creation",
  "Community Engagement",
  "Analytics & Insights"
];

// Define all features with their categories
const ALL_FEATURES = [
  // AI & Assistant Features
  { name: "GPT-4o AI Chat Assistant", description: "Advanced conversational AI powered by OpenAI's GPT-4o model for natural language interactions", category: "AI & Assistant", premium: false },
  { name: "Claude 3.5 Advanced Reasoning", description: "Complex problem-solving capabilities powered by Anthropic's Claude 3.5 Sonnet model", category: "AI & Assistant", premium: true },
  { name: "Context-Aware Conversations", description: "AI maintains conversation history and context across multiple interactions", category: "AI & Assistant", premium: false },
  { name: "Multi-Modal AI Vision", description: "AI can analyze and respond to images shared in Discord channels", category: "AI & Assistant", premium: true },
  { name: "Role-Based AI Personas", description: "Configure different AI personalities for different server roles or channels", category: "AI & Assistant", premium: true },
  { name: "DALL-E Image Generation", description: "Generate custom images directly in Discord using OpenAI's DALL-E model", category: "AI & Assistant", premium: true },
  
  // Moderation Features
  { name: "Auto-Moderation", description: "Automatically detect and remove inappropriate content, spam, and toxic messages", category: "Moderation", premium: false },
  { name: "Profanity Filter", description: "Customizable profanity filter with severity levels and exceptions", category: "Moderation", premium: false },
  { name: "Anti-Spam Protection", description: "Prevent message flooding, invite spam, and other disruptive behavior", category: "Moderation", premium: false },
  { name: "Raid Detection & Prevention", description: "Automatically detect and mitigate server raids with configurable responses", category: "Moderation", premium: true },
  { name: "Moderation Logs", description: "Comprehensive logs of all moderation actions with user history tracking", category: "Moderation", premium: false },
  { name: "AI-Powered Content Screening", description: "Advanced AI detection of subtle rule violations and toxic behavior patterns", category: "Moderation", premium: true },
  
  // Gaming Features
  { name: "Minecraft Server Integration", description: "Control Minecraft servers, view player lists, and relay chat between Discord and your server", category: "Gaming", premium: false },
  { name: "Game Stats Tracking", description: "Track and display player statistics from popular games like Valorant, League of Legends, and more", category: "Gaming", premium: false },
  { name: "Tournament Organizer", description: "Create, manage, and run gaming tournaments with brackets, matchmaking, and result tracking", category: "Gaming", premium: true },
  { name: "Game Night Scheduler", description: "Plan and coordinate gaming sessions with polls, reminders, and automatic role pings", category: "Gaming", premium: false },
  { name: "In-Discord Minigames", description: "Play text-based games directly in Discord channels, including trivia, word games, and more", category: "Gaming", premium: false },
  { name: "Cross-Game Achievements", description: "Track gaming achievements across multiple platforms and games with a unified display", category: "Gaming", premium: true },
  
  // Server Management Features
  { name: "Custom Welcome Messages", description: "Personalized greeting messages for new members with customizable templates", category: "Server Management", premium: false },
  { name: "Role Management", description: "Self-assignable roles through reactions, buttons, or commands", category: "Server Management", premium: false },
  { name: "Auto-Role Assignment", description: "Automatically assign roles to new members based on configurable criteria", category: "Server Management", premium: false },
  { name: "Scheduled Announcements", description: "Create and schedule recurring server announcements with rich formatting", category: "Server Management", premium: false },
  { name: "Member Verification", description: "Custom verification processes including CAPTCHA, application forms, or approval workflows", category: "Server Management", premium: true },
  { name: "Custom Command Creation", description: "Create server-specific custom commands with variable responses", category: "Server Management", premium: false },
  
  // Media & Entertainment Features
  { name: "Music Playback", description: "High-quality music streaming from YouTube, Spotify, SoundCloud, and other platforms", category: "Media & Entertainment", premium: false },
  { name: "Audio Effects & Filters", description: "Apply audio effects like bass boost, nightcore, or custom equalizer settings", category: "Media & Entertainment", premium: true },
  { name: "Podcast Player", description: "Stream podcasts directly to Discord voice channels with episode browsing", category: "Media & Entertainment", premium: false },
  { name: "Video Clip Sharing", description: "Share and play short video clips directly in Discord without leaving the app", category: "Media & Entertainment", premium: false },
  { name: "Media Recommendations", description: "Get AI-powered recommendations for music, movies, TV shows, and games", category: "Media & Entertainment", premium: true },
  { name: "Collaborative Playlists", description: "Create and manage music playlists that server members can add to", category: "Media & Entertainment", premium: false },
  
  // Productivity Features
  { name: "Polls & Voting", description: "Create interactive polls with multiple options and real-time results", category: "Productivity", premium: false },
  { name: "Reminders & Scheduling", description: "Set personal or channel reminders with customizable recurrence", category: "Productivity", premium: false },
  { name: "To-Do Lists", description: "Collaborative task lists for project management and team coordination", category: "Productivity", premium: false },
  { name: "Meeting Scheduler", description: "Create and manage meeting invites with calendar integration", category: "Productivity", premium: true },
  { name: "Notes & Documentation", description: "Store and retrieve text notes and documentation directly in Discord", category: "Productivity", premium: false },
  { name: "Translation Services", description: "Real-time message translation between multiple languages", category: "Productivity", premium: false },
  
  // Utility Features
  { name: "Weather Forecasts", description: "Get current weather conditions and forecasts for any location", category: "Utility", premium: false },
  { name: "Web Search", description: "Search the web directly from Discord and display results inline", category: "Utility", premium: false },
  { name: "Wikipedia Lookup", description: "Quick access to Wikipedia articles and information", category: "Utility", premium: false },
  { name: "URL Shortener", description: "Create shortened links for easier sharing in Discord", category: "Utility", premium: false },
  { name: "Math Calculator", description: "Solve mathematical equations directly in Discord", category: "Utility", premium: false },
  { name: "Currency Conversion", description: "Convert between different currencies with up-to-date exchange rates", category: "Utility", premium: false },
  
  // Content Creation Features
  { name: "ElevenLabs Voice Generation", description: "Generate realistic voice clips and narration using advanced AI technology", category: "Content Creation", premium: true },
  { name: "AI Content Creation Tools", description: "Generate thumbnails, descriptions, and other content for creators", category: "Content Creation", premium: true },
  { name: "Streaming Alerts", description: "Customizable alerts when streamers go live with viewership stats", category: "Content Creation", premium: false },
  { name: "Clip Highlight Generator", description: "Automatically identify and clip exciting moments from streams", category: "Content Creation", premium: true },
  { name: "Stream Promotion Tools", description: "Automated promotion of upcoming streams with countdowns and reminders", category: "Content Creation", premium: false },
  { name: "Content Scheduling", description: "Plan and schedule content releases across multiple platforms", category: "Content Creation", premium: true },
  
  // Community Engagement Features
  { name: "Server Events Calendar", description: "Organize and display upcoming community events with RSVP functionality", category: "Community Engagement", premium: false },
  { name: "Giveaways & Contests", description: "Create, manage, and automatically select winners for server giveaways", category: "Community Engagement", premium: false },
  { name: "Member Leveling System", description: "Activity-based experience points and levels with customizable rewards", category: "Community Engagement", premium: false },
  { name: "Custom Server Currency", description: "Create a server economy with custom currency and shop items", category: "Community Engagement", premium: true },
  { name: "Interactive Quizzes", description: "Create trivia quizzes and knowledge tests for your community", category: "Community Engagement", premium: false },
  { name: "Suggestion Box", description: "Allow members to submit and vote on suggestions for the server", category: "Community Engagement", premium: false },
  
  // Analytics & Insights Features
  { name: "Server Activity Analytics", description: "Track and visualize server activity patterns across different timeframes", category: "Analytics & Insights", premium: true },
  { name: "Member Demographics", description: "Analyze member engagement, activity times, and participation metrics", category: "Analytics & Insights", premium: true },
  { name: "Growth Tracking", description: "Monitor server growth with detailed join/leave statistics", category: "Analytics & Insights", premium: false },
  { name: "Channel Usage Stats", description: "Track which channels are most active and during what times", category: "Analytics & Insights", premium: true },
  { name: "Command Usage Reports", description: "See which bot features are being used most frequently", category: "Analytics & Insights", premium: false },
  { name: "Retention Analysis", description: "Identify patterns in member retention and churn", category: "Analytics & Insights", premium: true }
];

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Filter features based on active category and search term
  const filteredFeatures = ALL_FEATURES.filter(feature => 
    (activeCategory === "all" || feature.category === activeCategory) &&
    (feature.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     feature.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#080818] text-white">
      {/* Hero section */}
      <div className="relative py-16 px-4 md:px-8 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-3xl z-0"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-indigo-400">
              AstroBot Feature Directory
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              One bot to replace them all. Explore our comprehensive suite of 
              Discord bot features designed to enhance your server experience.
            </p>
          </div>

          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search features..."
                  className="w-full py-3 px-4 pl-10 rounded-lg bg-slate-800/70 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full md:w-2/3 overflow-x-auto pb-2">
              <div className="flex space-x-2 min-w-max">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/70 text-slate-300 hover:bg-slate-700"
                  }`}
                  onClick={() => setActiveCategory("all")}
                >
                  All Features
                </button>
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800/70 text-slate-300 hover:bg-slate-700"
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Features grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={`${feature.name}-${index}`}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:bg-slate-800/80 transition-all group"
                variants={item}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {feature.name}
                    </h3>
                    {feature.premium && (
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mb-4">{feature.description}</p>
                  <div className="flex items-center">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-700/70 text-blue-300">
                      {feature.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl text-slate-400 mb-2">No features found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
      
      {/* CTA section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-t border-blue-900/30 py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Ready to transform your Discord server?</h2>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            AstroBot combines all these features into one seamless experience. 
            No more juggling multiple bots or dealing with compatibility issues.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="https://discord.com/api/oauth2/authorize"
              target="_blank"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg font-medium transition-all"
            >
              Add to Discord
            </Link>
            <Link 
              href="/"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}