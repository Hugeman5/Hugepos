import type {Config} from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'var(--line)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--text-dim)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--panel)',
          foreground: 'var(--text)',
        },
        card: {
          DEFAULT: 'var(--panel)',
          foreground: 'var(--text)',
        },
        'brand-bg': 'var(--bg)',
        'brand-panel': 'var(--panel)',
        'brand-muted': 'var(--muted)',
        'brand-line': 'var(--line)',
        'brand-text': 'var(--text)',
        'brand-text-dim': 'var(--text-dim)',
        'brand-accent': 'var(--accent)',
        'brand-danger': 'var(--danger)',
        'brand-ok': 'var(--ok)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xl2': 'calc(var(--radius) + 4px)',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
