/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pinterest: {
          red: '#E60023',
          'red-hover': '#AD081B',
          'red-light': '#FFF0F0',
        },
        background: {
          white: '#FFFFFF',
          light: '#F7F7F7',
          gray: '#EFEFEF',
        },
        text: {
          primary: '#111111',
          secondary: '#5F5F5F',
          tertiary: '#767676',
        },
      },
      borderRadius: {
        'pinterest': '16px',
        'pinterest-lg': '24px',
      },
      boxShadow: {
        'pinterest': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'pinterest-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'pinterest-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
