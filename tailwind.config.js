/** @type {import('tailwindcss').Config} */
// CoachHub suite shared design tokens
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CoachHub suite palette
        accent:  { DEFAULT: '#4ade80', dark: '#22c55e' },
        panel:   { DEFAULT: '#1a1d27', light: '#1a1d27' },
        surface: '#0f1117',
        border:  '#2a2d3a',
        text:    { primary: '#f0f0f0', secondary: '#8b8fa8' },
        error:   '#f87171',
        warning: '#fbbf24',
        // keep lime alias pointing to accent so any remaining lime- classes still resolve
        lime:    { DEFAULT: '#4ade80', dark: '#22c55e' },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'toast-in': 'toast-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in':  'fade-in 0.18s ease forwards',
      },
      keyframes: {
        'toast-in': {
          'from': { opacity: '0', transform: 'translateX(-50%) translateY(12px) scale(0.95)' },
          'to':   { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(4px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-lime':   '0 0 16px rgba(74,222,128,0.18)',
        'glow-accent': '0 0 16px rgba(74,222,128,0.18)',
        'glow-sm':     '0 2px 12px rgba(0,0,0,0.5)',
        'panel':       '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
