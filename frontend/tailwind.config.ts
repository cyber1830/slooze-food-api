import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#12232B', canvas: '#EDF2F3', teal: { DEFAULT: '#0B7A8F', dark: '#095F70', soft: '#D8ECF0' }, saffron: '#F2B134', danger: '#B3372B' },
      fontFamily: { display: ['var(--font-display)', 'sans-serif'], sans: ['var(--font-body)', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
