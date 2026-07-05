/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        card: '#111111',
        edge: '#1f1f1f',
        'edge-hover': '#2e2e2e',
        'txt-primary': '#f5f5f5',
        'txt-secondary': '#a1a1aa',
        positive: '#22c55e',
        negative: '#ef4444',
        warning: '#f59e0b',
        'accent-from': '#3b82f6',
        'accent-to': '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
