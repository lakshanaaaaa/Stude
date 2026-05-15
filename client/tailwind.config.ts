// tailwind.config.ts
import { defineConfig } from 'tailwindcss/helpers';
import defaultTheme from 'tailwindcss/defaultTheme';

export default defineConfig({
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(220, 90%, 55%)',
        secondary: 'hsl(260, 70%, 60%)',
        accent: 'hsl(40, 95%, 55%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
});
