import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a1a1a',
          muted: '#6b6b6b',
        },
      },
    },
  },
  plugins: [],
}

export default config
