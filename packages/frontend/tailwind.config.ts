import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#8B5CF6",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444"
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"]
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class"
    })
  ]
} satisfies Config;
