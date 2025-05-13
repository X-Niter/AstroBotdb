// This is the server component (root layout) that can export metadata
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "../styles/globals.css";
import Navbar from "../components/navbar";
import { AstroBotLogo } from "../components/astrobot-logo";
import { Providers } from "./providers";

// Export metadata (only works in server components)
export const metadata = {
  title: "AstroBot AI - The Ultimate All-in-One Discord Assistant",
  description: "Replace your entire bot collection with one powerful solution that does it all: AI chat, moderation, gaming integrations, Twitch streaming features, and everything your Discord server needs.",
};

// Load Space Grotesk font for primary text
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Load Space Mono for monospace/code elements
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen text-white font-sans antialiased ${spaceGrotesk.variable} ${spaceMono.variable}`}
      >
        <Providers>
          {/* Cosmic Background with dynamic elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Major nebula clouds */}
            <div className="nebula" style={{ 
              top: "10%", 
              left: "10%", 
              width: "40vw", 
              height: "40vw", 
              background: "radial-gradient(circle, rgba(76, 92, 249, 0.1) 0%, rgba(76, 92, 249, 0.03) 50%, transparent 70%)",
              animationDelay: "0s"
            }}></div>
            <div className="nebula" style={{ 
              bottom: "5%", 
              right: "15%", 
              width: "45vw", 
              height: "45vw", 
              background: "radial-gradient(circle, rgba(130, 80, 255, 0.08) 0%, rgba(130, 80, 255, 0.02) 50%, transparent 70%)",
              animationDelay: "2s"
            }}></div>
            
            {/* Scattered background stars */}
            {Array.from({ length: 150 }).map((_, i) => (
              <div
                key={`bg-star-${i}`}
                className={`star ${Math.random() > 0.9 ? 'large' : ''}`}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 2 + 0.5}px`,
                  height: `${Math.random() * 2 + 0.5}px`,
                  opacity: Math.random() * 0.7 + 0.3,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${Math.random() * 5 + 3}s`,
                }}
              />
            ))}
            
            {/* Occasional shooting stars */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`shooting-star-${i}`}
                className="shooting-star"
                style={{
                  top: `${Math.random() * 70}%`,
                  left: `${Math.random() * 30}%`,
                  height: "1px",
                  width: `${Math.random() * 100 + 50}px`,
                  transform: `rotate(${Math.random() * 45 + 15}deg)`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
          
          {/* Robot Layer - This will be positioned fixed and render above all content */}
          <div id="robot-layer" className="fixed top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
            {/* The robot components will be portaled here */}
          </div>
          
          {/* Main content with proper z-index */}
          <div className="relative z-10 min-h-screen flex flex-col">
            {/* Navbar */}
            <Navbar />
            
            {/* Main Content */}
            <main className="flex-grow pt-16">
              {children}
            </main>
            
            {/* Footer */}
            <footer className="border-t border-slate-800/30 py-8 mt-20 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center">
                    <AstroBotLogo size="small" />
                    <span className="ml-2 text-white/50 text-sm">© {new Date().getFullYear()}</span>
                  </div>
                  <div className="mt-6 md:mt-0 flex gap-8">
                    <a href="/terms" className="text-white/70 hover:text-white/90 text-sm">Terms</a>
                    <a href="/privacy" className="text-white/70 hover:text-white/90 text-sm">Privacy</a>
                    <a href="/contact" className="text-white/70 hover:text-white/90 text-sm">Contact</a>
                  </div>
                  <div className="mt-6 md:mt-0 text-white/50 text-sm">
                    The Ultimate All-in-One Discord Assistant
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}