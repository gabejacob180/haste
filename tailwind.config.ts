import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)'
      }
    },
    fontFamily: {
      DM_Serif_Text: ['DM_Serif_Text'],
      source_sans: ['source-sans']
    }
  },
  plugins: [],
  important: true
} satisfies Config
