import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        nexa: {
          purple: '#9354FF',
          light: '#E9DDFF',
          dark: '#6B35CC',
          bg: '#F5F0FF',
        }
      }
    }
  },
  plugins: [],
};
export default config;
