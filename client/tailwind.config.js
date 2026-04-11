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
      },
      colors: {
        // App-specific aliases for consistency
        surface: '#ffffff',
        'surface-raised': '#fafafa',
        border: '#e4e4e7',
        'border-strong': '#d4d4d8',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
