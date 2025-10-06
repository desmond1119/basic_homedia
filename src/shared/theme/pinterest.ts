export const pinterestTheme = {
  colors: {
    primary: {
      red: '#E60023',
      redHover: '#AD081B',
      redLight: '#FFF0F0',
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
    border: {
      light: '#E9E9E9',
      medium: '#CDCDCD',
    },
    accent: {
      blue: '#0095F6',
      green: '#00A400',
      yellow: '#FFD700',
      purple: '#8E44AD',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  animations: {
    hover: 'transform 0.2s ease-in-out',
    fadeIn: 'opacity 0.3s ease-in-out',
    slideUp: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const pinterestClasses = {
  card: 'bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300',
  button: {
    primary: 'bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition-colors',
    secondary: 'bg-gray-100 text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors',
    outline: 'border-2 border-gray-300 text-gray-900 px-6 py-3 rounded-full font-semibold hover:border-gray-400 transition-colors',
  },
  input: 'w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:outline-none transition-colors',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: {
    masonry: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4',
    standard: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  },
} as const;
