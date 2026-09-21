/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070f',
          900: '#080b16',
          850: '#0b0f1d',
          800: '#101528',
          700: '#171d34',
          600: '#222a47',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b6d8ff',
          300: '#83bcff',
          400: '#4b96ff',
          500: '#2472f5',
          600: '#1554d6',
          700: '#1243ab',
          800: '#143a86',
          900: '#15346b',
        },
        accent: {
          300: '#7ff0e0',
          400: '#3fdcc6',
          500: '#1bc4ac',
          600: '#0d9d8c',
        },
        violet: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 18px 40px -24px rgba(5,8,20,0.9)',
        glow: '0 0 0 1px rgba(36,114,245,0.35), 0 20px 50px -20px rgba(36,114,245,0.45)',
        'glow-accent': '0 0 0 1px rgba(27,196,172,0.35), 0 20px 50px -22px rgba(27,196,172,0.42)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.85' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'grow-x': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        shimmer: 'shimmer 1.8s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'grow-x': 'grow-x 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
