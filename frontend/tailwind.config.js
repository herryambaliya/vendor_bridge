export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        primary: '#2563EB',
        success: '#10B981',
        danger:  '#EF4444',
        warning: '#F59E0B',
        sidebar: '#0d1117',
        lightbg: '#F1F5F9',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '2xl':  '1rem',
        '3xl':  '1.5rem',
        '4xl':  '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.06)',
        'liquid': '0 8px 32px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255,255,255,0.8) inset',
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.25)',
        'glow-sm': '0 0 10px rgba(37, 99, 235, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
