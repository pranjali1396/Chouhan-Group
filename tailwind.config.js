/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#2563eb',
        'primary-focus': '#1d4ed8',
        'primary-light': '#eff6ff',
        'primary-content': '#ffffff',
        'secondary': '#475569',
        'accent-blue': '#3b82f6',
        'accent-green': '#10b981',
        'accent-purple': '#8b5cf6',
        'accent-red': '#ef4444',
        'accent-teal': '#14b8a6',
        'base-100': '#ffffff',
        'base-200': '#f0f4f8',
        'base-300': '#e2e8f0',
        'base-content': '#0f172a',
        'muted-content': '#64748b',
        'border-color': '#e2e8f0',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'glow': '0 0 15px rgba(37, 99, 235, 0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
}




