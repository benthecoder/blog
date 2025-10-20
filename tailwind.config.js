/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Japanese Color Palette
        japanese: {
          // Whites & Off-whites
          gofuniro: "#FFFFFC", // 胡粉色 - Chalk white
          hakuji: "#F8FBFB", // 白磁 - White porcelain
          unoharairo: "#F7FCFE", // 卯の花色 - Deutzia flower

          // Light Grays & Creams
          kinairo: "#FBFAF5", // 生成り色 - Dough/natural
          shironeri: "#F3F3F2", // 白練 - Silk white kneading
          soshoku: "#EAE5E3", // 素色 - Base color
          shiraumenezu: "#E5E4E6", // 白梅鼠 - White plum grey

          // Grays
          shironezu: "#DCDDDD", // 白鼠 - White grey
          nyuhakushoku: "#F3F3F3", // 乳白色 - Milky white

          // Subtle Accents
          murasakisuishiyou: "#E7E7EB", // 紫水晶 - Purple water (amethyst)

          // Additional Japanese accent colors
          nezumiiro: "#949495", // 鼠色 - Mouse grey
          ginnezu: "#91989C", // 銀鼠 - Silver mouse
          sumiiro: "#595857", // 墨色 - Ink color
        },

        // Light mode - using Japanese colors
        light: {
          bg: "#FBFAF5", // kinairo
          text: "#2c353d",
          accent: "#595857", // sumiiro - ink color
          border: "#E5E4E6", // shiraumenezu
          tag: "#F7FCFE", // unoharairo
          highlight: "#E7E7EB", // murasakisuishiyou - purple water
        },

        // Dark mode - using Japanese colors
        dark: {
          bg: "#1a1b26",
          text: "#DCDDDD", // shironezu
          accent: "#91989C", // ginnezu - silver mouse
          border: "#E5E4E6", // shiraumenezu
          tag: "#1e2030",
          highlight: "#F3F3F3", // nyuhakushoku - milky white
        },
      },
      fontFamily: {
        serif: ["var(--font-averia)"],
      },
      keyframes: {
        typing: {
          "0%": { opacity: 0.3 },
          "50%": { opacity: 1 },
          "100%": { opacity: 0.3 },
        },
      },
      animation: {
        typing: "typing 1.5s infinite",
        "typing-middle": "typing 1.5s infinite 0.2s",
        "typing-last": "typing 1.5s infinite 0.4s",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  darkMode: "class",
};
