/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        indigo: {
          start: '#4F46E5',
          end: '#6366F1',
        },
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        },
        light: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
        },
        success: '#10B981',
        error: '#EF4444',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0, 0, 0, 0.05)',
        lift: '0 14px 34px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.3)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(37, 99, 235, 0.15)' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        staggerFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'scale-glow': 'scaleGlow 2s ease-in-out infinite',
        'check-pop': 'checkPop 0.4s ease-out forwards',
        'bounce-in': 'bounceIn 0.4s ease-out forwards',
        'stagger-fade': 'staggerFade 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
