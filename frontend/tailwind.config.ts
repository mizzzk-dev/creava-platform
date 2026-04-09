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
        sans:    ['Inter', 'Noto Sans JP', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['Syne', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a1a1a',
          muted:   '#6b6b6b',
        },
        accent: {
          emerald: '#10b981',
          blue:    '#3b82f6',
          violet:  '#8b5cf6',
          amber:   '#f59e0b',
        },
        /* ── Neon cyber palette ───────────────────── */
        neon: {
          cyan:   '#06b6d4',
          violet: '#8b5cf6',
          amber:  '#f59e0b',
          pink:   '#ec4899',
          green:  '#22c55e',
        },
        /* ── Cyber dark bg surfaces ──────────────── */
        cyber: {
          950: '#06060f',
          900: '#0c0c1e',
          800: '#10101f',
          700: '#16162b',
          600: '#1e1e38',
        },
      },
      keyframes: {
        /* ── Legacy ──────────────────────────── */
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
        /* ── New cyber animations ─────────────── */
        aurora_pulse: {
          '0%, 100%': { backgroundPosition: '0% 50%',   opacity: '0.6' },
          '50%':       { backgroundPosition: '100% 50%', opacity: '1'   },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float_y: {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':       { transform: 'translateY(-8px)' },
        },
        float_y_slow: {
          '0%, 100%': { transform: 'translateY(0px)'   },
          '50%':       { transform: 'translateY(-14px)' },
        },
        text_shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center'  },
        },
        pulse_glow_cyan: {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(6,182,212,0.3), 0 0 20px rgba(6,182,212,0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(6,182,212,0.2)',
          },
        },
        pulse_glow_amber: {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(245,158,11,0.3), 0 0 20px rgba(245,158,11,0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2)',
          },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        glitch_x: {
          '0%, 100%': { transform: 'translateX(0)'  },
          '20%':       { transform: 'translateX(-3px)' },
          '40%':       { transform: 'translateX(3px)'  },
          '60%':       { transform: 'translateX(-1px)' },
          '80%':       { transform: 'translateX(2px)'  },
        },
        reveal_up: {
          from: { opacity: '0', transform: 'translateY(20px)', clipPath: 'inset(100% 0 0 0)' },
          to:   { opacity: '1', transform: 'translateY(0)',     clipPath: 'inset(0% 0 0 0)'   },
        },
        grid_fade_in: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        cursor_blink: {
          '0%, 100%': { borderRightColor: 'currentColor' },
          '50%':       { borderRightColor: 'transparent' },
        },
        count_up: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        fade_in_up: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        scale_in: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
      },
      animation: {
        /* Legacy */
        blink:          'blink 1.2s step-end infinite',
        shimmer:        'shimmer 2.5s linear infinite',
        ping_slow:      'ping_slow 2s cubic-bezier(0,0,0.2,1) infinite',
        /* New */
        aurora_pulse:    'aurora_pulse 8s ease-in-out infinite',
        scanline:        'scanline 4s linear infinite',
        float:           'float_y 4s ease-in-out infinite',
        float_slow:      'float_y_slow 6s ease-in-out infinite',
        text_shimmer:    'text_shimmer 3s linear infinite',
        glow_cyan:       'pulse_glow_cyan 2.5s ease-in-out infinite',
        glow_amber:      'pulse_glow_amber 2.5s ease-in-out infinite',
        marquee:         'marquee 24s linear infinite',
        glitch:          'glitch_x 0.3s ease-in-out',
        reveal_up:       'reveal_up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        grid_fade_in:    'grid_fade_in 1.2s ease forwards',
        cursor_blink:    'cursor_blink 1.1s step-end infinite',
        count_up:        'count_up 0.4s ease both',
        fade_in_up:      'fade_in_up 0.5s ease both',
        scale_in:        'scale_in 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
      backgroundSize: {
        '200%': '200% 100%',
        '300%': '300% 100%',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config
