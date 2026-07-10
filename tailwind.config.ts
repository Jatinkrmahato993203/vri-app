import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Design tokens (mirrors design.md §2)
        risk: {
          normal: '#2F6B4F',
          elevated: '#B8863B',
          high: '#A13D3D',
        },
        accent: {
          signal: '#1F4E5F',
        },
      },
    },
  },
  plugins: [],
};

export default config;
