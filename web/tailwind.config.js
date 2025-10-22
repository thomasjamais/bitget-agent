/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for trading dashboard
        'trading': {
          'success': '#10b981',
          'danger': '#ef4444',
          'warning': '#f59e0b',
          'info': '#3b82f6',
          'neutral': '#6b7280',
        },
        'chart': {
          'green': '#10b981',
          'red': '#ef4444',
          'blue': '#3b82f6',
          'yellow': '#f59e0b',
          'purple': '#8b5cf6',
        }
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 1s infinite',
      }
    },
  },
  plugins: [],
};