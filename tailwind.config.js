/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFEC95",  // Soft Yellow
        secondary: "#33CEC5", // Teal
        accent: "#86D5F4",    // Sky Blue
        dark: "#353535",      // Charcoal
        light: "#FFFFFF",     // White
      },
      boxShadow: {
        card: "0px 10px 30px -10px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
}