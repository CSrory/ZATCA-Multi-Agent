import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── shadcn/ui CSS variable tokens ──────────────────────────
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // ─── Alinma Bank Brand Palette ───────────────────────────────
        // extracted from official brand guide image
        alinma: {
          // dark brown — cube / primary brand
          900:  "#3D1A08",
          800:  "#5C2E0E",
          700:  "#6B3518",
          // medium brown — secondary surfaces
          600:  "#7D4424",
          500:  "#8B5A35",
          // tan / camel — background panels
          400:  "#A67C52",
          300:  "#C4A882",
          200:  "#D9C5A8",
          100:  "#EDE0CC",
          // cream — page background
          50:   "#FAF5EE",
          // light sky blue from brand image
          sky:  "#8BB5D0",
        },

        // ─── Status / Semantic ────────────────────────────────────────
        danger:  { DEFAULT: "#C0392B", light: "#FDEDEC" },
        warning: { DEFAULT: "#D4860B", light: "#FEF9EC" },
        success: { DEFAULT: "#1A7A4A", light: "#EAFAF1" },
        info:    { DEFAULT: "#1A6B9A", light: "#EBF5FB" },
      },

      fontFamily: {
        sans:   ["var(--font-tajawal)", "Tajawal", "system-ui", "sans-serif"],
        arabic: ["var(--font-tajawal)", "Tajawal", "system-ui", "sans-serif"],
        mono:   ["JetBrains Mono", "Consolas", "monospace"],
      },

      boxShadow: {
        "alinma-sm": "0 1px 4px rgba(93,46,14,0.10), 0 0 0 1px rgba(93,46,14,0.06)",
        "alinma-md": "0 4px 16px rgba(93,46,14,0.12), 0 0 0 1px rgba(93,46,14,0.08)",
        "alinma-lg": "0 8px 32px rgba(93,46,14,0.14), 0 0 0 1px rgba(93,46,14,0.06)",
        "card":      "0 2px 12px rgba(93,46,14,0.08)",
      },

      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      backgroundImage: {
        "alinma-warm":
          "linear-gradient(135deg, #FAF5EE 0%, #EDE0CC 100%)",
        "alinma-hero":
          "linear-gradient(160deg, #6B3518 0%, #8B5A35 60%, #C4A882 100%)",
        "alinma-card":
          "linear-gradient(135deg, #FFFFFF 0%, #FAF5EE 100%)",
        "pattern-dots":
          "radial-gradient(circle, rgba(93,46,14,0.12) 1px, transparent 1px)",
      },

      animation: {
        "fade-in":  "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.45s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
