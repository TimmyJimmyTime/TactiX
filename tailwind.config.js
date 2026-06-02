/** @type {import('tailwindcss').Config} */
// CoachHub suite shared design tokens
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CoachHub design system palette
        // Surfaces
        'ch-bg-0':  '#0A100E',
        'ch-bg-1':  '#111B17',
        'ch-bg-2':  '#18241F',
        'ch-bg-3':  '#213029',
        'ch-bg-4':  '#2A3D34',
        // Ink
        'ch-ink-0': '#F2EFE5',
        'ch-ink-1': '#C8CFC4',
        'ch-ink-2': '#8A958D',
        'ch-ink-3': '#5E6A63',
        // Brand
        'ch-brand': '#88C66F',
        'ch-danger': '#E66B5D',
        'ch-warning': '#E6B85D',
        'ch-info': '#5BA5D9',
        'ch-data': '#E6C95A',
        // Legacy aliases — keep so existing Tailwind classes don't break
        accent:  { DEFAULT: '#88C66F', dark: '#5FA047' },
        panel:   { DEFAULT: '#18241F', light: '#213029' },
        surface: '#0A100E',
        border:  'rgba(220,230,220,0.08)',
        text:    { primary: '#F2EFE5', secondary: '#8A958D' },
        error:   '#E66B5D',
        warning: '#E6B85D',
        lime:    { DEFAULT: '#88C66F', dark: '#5FA047' },
      },
      fontFamily: {
        display: ['"Archivo"', 'system-ui', 'sans-serif'],
        ui:      ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
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
        'glow-lime':   '0 0 16px rgba(136,198,111,0.22)',
        'glow-accent': '0 0 16px rgba(136,198,111,0.22)',
        'glow-sm':     '0 2px 12px rgba(0,0,0,0.5)',
        'panel':       '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
