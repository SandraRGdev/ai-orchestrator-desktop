/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'border-color': 'var(--border-color)',
        'border-subtle': 'var(--border-subtle)',
        'border-accent': 'var(--border-accent)',
        'accent-primary': 'var(--accent-primary)',
        'accent-primary-light': 'var(--accent-primary-light)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-success': 'var(--accent-success)',
        'accent-warning': 'var(--accent-warning)',
        'accent-error': 'var(--accent-error)',
        'surface': 'var(--surface)',
        'elevated': 'var(--elevated)',

        // Legacy fallback colors (keep for compatibility)
        primary: '#0f0f1a',
        secondary: '#1a1a2e',
        tertiary: '#16213e',
        elevated: '#1f1f3a',

        // Text colors with better contrast
        'text-primary-legacy': '#f0f0f5',
        'text-secondary-legacy': '#b8b8d1',
        'text-tertiary-legacy': '#8a8aa0',

        // Modern accent colors (purple/violet theme)
        accent: {
          primary: '#a78bfa',
          'primary-hover': '#8b5cf6',
          'primary-light': '#c4b5fd',
          secondary: '#818cf8',
          tertiary: '#a78bfa',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          info: '#60a5fa',
        },

        // Gradient colors
        gradient: {
          from: '#6366f1',
          via: '#8b5cf6',
          to: '#a78bfa',
        },

        // Border colors
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
          focus: '#8b5cf6',
          accent: 'var(--border-accent)',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

