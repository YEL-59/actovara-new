import type { Config } from 'tailwindcss';

/**
 * Actovara design tokens — sampled from inputs/screenshots (PRD §8.2).
 * Mirrored as CSS variables in src/app/globals.css.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#E2EDFB',
          100: '#C9DCF7',
          200: '#9DBFEE',
          500: '#2F6BC4',
          600: '#1D58B0',
          700: '#174A94',
          800: '#123B77',
        },
        sidebar: {
          DEFAULT: '#0F223D',
          hover: '#1A3152',
          text: '#FFFFFF',
          muted: '#A9B6C8',
        },
        canvas: '#F7F9FC',
        surface: '#FFFFFF',
        line: '#E5E9EF',
        'table-head': '#F0F2F5',
        ink: {
          DEFAULT: '#0F172A',
          muted: '#5B6576',
          subtle: '#8A93A3',
        },
        ok: { 50: '#F1F9F0', 100: '#D6F2DC', 600: '#037D1B', 700: '#026516' },
        warn: { 50: '#FEF7E8', 100: '#FEEBBF', 600: '#E59306', 700: '#8A4B00' },
        danger: { 50: '#FEF0F0', 100: '#FCDADC', 600: '#D4050F', 700: '#B0040C' },
        neutral: { 50: '#F5F7FC', 100: '#E2EAF2', 600: '#64748B', 700: '#334155' },
        gauge: { red: '#E5484D', amber: '#FEB82E', green: '#3CA03C' },
        type: {
          'residential-bg': '#DFECFC',
          'residential-fg': '#1D58B0',
          'hmo-bg': '#E7DCFA',
          'hmo-fg': '#6D28D9',
          'commercial-bg': '#E2EAF2',
          'commercial-fg': '#334155',
          'mixed-bg': '#E0F2F1',
          'mixed-fg': '#0F766E',
        },
      },
      fontSize: {
        h1: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'card-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        gauge: ['2.75rem', { lineHeight: '1', fontWeight: '800' }],
        meta: ['0.8125rem', { lineHeight: '1.125rem' }],
      },
      width: { sidebar: '262px', rail: '72px' },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        'card-hover': '0 8px 20px -6px rgb(15 23 42 / 0.1)',
        pop: '0 20px 40px -12px rgb(15 23 42 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'fade-up': 'fade-up 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-in': 'toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
