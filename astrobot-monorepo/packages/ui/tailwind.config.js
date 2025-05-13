/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        cosmic: {
          50: "#f0f4ff",
          100: "#e2e9ff",
          200: "#c8d5ff",
          300: "#a7b8ff",
          400: "#8097f1",
          500: "#6459f1",
          600: "#5747e2",
          700: "#4935c4",
          800: "#3e2fa0",
          900: "#36307f",
          950: "#1e1a49",
        },
        space: {
          50: "#f5f2ff",
          100: "#ede8ff",
          200: "#ded5ff",
          300: "#c9b8ff",
          400: "#b085ff",
          500: "#8066ff",
          600: "#7644ff",
          700: "#682dfd",
          800: "#5825e1",
          900: "#4b20bc",
          950: "#2c1178",
        },
        nebula: {
          50: "#fdf2ff",
          100: "#fbe6ff",
          200: "#f9d0ff",
          300: "#f7adff",
          400: "#eb82ff",
          500: "#d266ff",
          600: "#b844ee",
          700: "#9e31cd",
          800: "#832aa9",
          900: "#6b2889",
          950: "#49105d",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 15px rgba(100, 89, 241, 0.7)" 
          },
          "50%": { 
            boxShadow: "0 0 30px rgba(128, 102, 255, 0.9)" 
          },
        },
        "float": {
          "0%, 100%": { 
            transform: "translateY(0)" 
          },
          "50%": { 
            transform: "translateY(-10px)" 
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-300px 0"
          },
          "100%": {
            backgroundPosition: "300px 0"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite"
      },
      boxShadow: {
        'cosmic': '0 0 15px rgba(100, 89, 241, 0.5)',
        'space': '0 0 15px rgba(128, 102, 255, 0.5)',
        'nebula': '0 0 15px rgba(210, 102, 255, 0.5)'
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(to right, rgb(64, 89, 241), rgb(128, 102, 255))',
        'space-gradient': 'linear-gradient(to right, rgb(88, 37, 225), rgb(120, 68, 255))',
        'nebula-gradient': 'linear-gradient(to right, rgb(184, 68, 238), rgb(219, 133, 255))',
        'stars': 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)'
      },
      backgroundSize: {
        'stars': '30px 30px, 20px 20px'
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}