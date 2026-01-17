/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexo Purple - Color principal de marca (#753572)
        primary: {
          50: '#fdf4fc',
          100: '#fae8f9',
          200: '#f5d0f3',
          300: '#eda9e9',
          400: '#e07ada',
          500: '#c94fc3',
          600: '#a33a9e',
          700: '#753572',  // Color base de marca
          800: '#5f2d5c',
          900: '#4d2749',
          950: '#2f1030',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scan-line': 'scanLine 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scanLine: {
          '0%, 100%': { top: '10%' },
          '50%': { top: '85%' },
        },
      },
    },
  },
  plugins: [],
}
