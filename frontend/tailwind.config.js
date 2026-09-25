/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', 'monospace'],
      },
      colors: {
        primary: '#00d2ff',
        secondary: '#3a7bd5',
        dark: {
          bg: '#0B0F19',
          card: '#151A2D',
          border: '#1F2937',
        }
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 210, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
  // Prevent Tailwind from aggressively resetting Ant Design styles
  corePlugins: {
    preflight: false, 
  }
}
