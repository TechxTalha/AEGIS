/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1677ff', // Ant Design primary blue
      }
    },
  },
  plugins: [],
  // Prevent Tailwind from aggressively resetting Ant Design styles
  corePlugins: {
    preflight: false, 
  }
}
