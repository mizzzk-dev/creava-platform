import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a1a1a',
          muted: '#6b6b6b',
        },
        accent: {
          emerald: '#10b981',
          blue:    '#3b82f6',
          violet:  '#8b5cf6',
          amber:   '#f59e0b',
        },
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ping_slow: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        blink:      'blink 1.2s step-end infinite',
        shimmer:    'shimmer 2.5s linear infinite',
        ping_slow:  'ping_slow 2s cubic-bezier(0,0,0.2,1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
