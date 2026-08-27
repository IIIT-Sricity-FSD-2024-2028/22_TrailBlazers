/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        powder: {
          50: '#F5FAFE',
          100: '#EBF6FD',
          200: '#DAF0FB', // Primary Light Powder Blue
          300: '#B5E1F7',
          400: '#89CCF2',
          500: '#5CB6EC',
        },
        lavender: {
          50: '#FDF7FC',
          100: '#FAF0FA',
          200: '#FBE9F9', // Primary Soft Lavender Pink
          300: '#F6CFF3',
          400: '#EEADEA',
          500: '#E386DC',
        },
        mint: {
          50: '#F4FCFA',
          100: '#EEFAF7',
          200: '#E8F9F5', // Primary Mint Mist / Pale Aqua
          300: '#C7F3EA',
          400: '#9AE8D8',
          500: '#69D9C3',
        },
        softLavender: '#E9E1FA',
        periwinkle: '#DCE5FF',
        softPeach: '#FFE8DC',
        slateText: '#26334A',
        mutedText: '#64748B',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(38, 51, 74, 0.06)',
        'glass-hover': '0 14px 40px 0 rgba(38, 51, 74, 0.10)',
        'glow-powder': '0 0 30px 0 rgba(218, 240, 251, 0.8)',
        'glow-pink': '0 0 30px 0 rgba(251, 233, 249, 0.8)',
        'glow-mint': '0 0 30px 0 rgba(232, 249, 245, 0.8)',
      },
      backgroundImage: {
        'hero-overlay': 'linear-gradient(135deg, rgba(218, 240, 251, 0.75) 0%, rgba(251, 233, 249, 0.70) 50%, rgba(232, 249, 245, 0.75) 100%)',
        'pastel-flow-1': 'linear-gradient(180deg, #DAF0FB 0%, #E9E1FA 50%, #FBE9F9 100%)',
        'pastel-flow-2': 'linear-gradient(180deg, #FBE9F9 0%, #E8F9F5 50%, #DAF0FB 100%)',
        'glass-surface': 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.50) 100%)',
      }
    },
  },
  plugins: [],
}
