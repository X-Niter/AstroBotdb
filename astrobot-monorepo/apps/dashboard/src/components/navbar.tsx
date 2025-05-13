"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AstroBotLogo } from "./astrobot-logo";
import { AstroBotMascot } from "./astro-bot-mascot";

// Simple mock links for navigation
const navLinks = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/pricing" },
  { name: "Documentation", href: "/docs" },
  { name: "Support", href: "/support" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 navbar z-50 transition-all duration-300 ${
        scrolled ? "py-2 shadow-lg" : "py-4"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* App Logo - no mascot in the navbar */}
        <AstroBotLogo size={scrolled ? "small" : "default"} />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <nav className="flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="ml-6 flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="https://discord.com/api/oauth2/authorize"
              target="_blank"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Add to Discord
            </Link>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <motion.div
        className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: mobileMenuOpen ? 1 : 0,
          height: mobileMenuOpen ? "auto" : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 pt-2 pb-4 space-y-1 glass-effect">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block px-3 py-2 text-base text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col space-y-2">
            <Link
              href="/login"
              className="px-4 py-2 text-center text-gray-300 hover:text-white border border-gray-700 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="https://discord.com/api/oauth2/authorize"
              target="_blank"
              className="px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Add to Discord
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}