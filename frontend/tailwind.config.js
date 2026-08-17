module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#cb128a',
        'brand-light': '#e879b9',
        'brand-dark': '#a0106f',
        statusUp: '#68dc8d',
        statusDown: '#d43b46',
        muted: '#6b7280',
        bg: '#ffffff',
        'bg-secondary': '#f8fafc',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        border: '#e2e8f0'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'brand': '0 4px 14px 0 rgba(203, 18, 138, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
