/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: [
          'Avenir Next',
          'Avenir',
          'Montserrat',
          'Gill Sans',
          'Trebuchet MS',
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 15px rgba(255, 51, 102, 0.2)',
      },
      keyframes: {
        'like-pop': {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'like-pop': 'like-pop 220ms ease-out',
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#ff4a85", // Premium Instagram-like vibe
          "secondary": "#8b5cf6", // Purple
          "accent": "#06b6d4", // Cyan
          "neutral": "#1f2937",
          "base-100": "#f8fafc", // Very clean slate background
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87171",
        },
        dark: {
          "primary": "#ff4a85",
          "secondary": "#a78bfa",
          "accent": "#22d3ee",
          "neutral": "#111827",
          "base-100": "#0b0f19", // Deep obsidian dark mode
          "base-200": "#151d30", // Sleek card background
          "base-300": "#1e293b",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87171",
        },
      },
    ],
    darkTheme: "dark",
  },
}
