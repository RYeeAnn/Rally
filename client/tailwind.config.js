/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'DM Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#ffffff',
        'surface-warm': '#f5f3ee',
        border: '#e2e0db',
        'border-strong': '#c8c5bc',
        accent: '#2ba572',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
