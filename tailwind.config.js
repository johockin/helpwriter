/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          tactical: {
            // Desert tones - Increased contrast
            sand: {
              950: '#0F0E0C', // New ultra-dark sand
              900: '#1A1815',
              800: '#2C2925',
              700: '#3A362F',
              600: '#565043',
              500: '#8A8270',
              400: '#A69C89',
              300: '#C2B7A3',
              200: '#DED2BC',
              150: '#EBE1D1', // New light sand for outline bg
              100: '#F9EDD6'
            },
            // Forest/olive tones - Increased contrast
            olive: {
              950: '#0F1209', // New ultra-dark olive
              900: '#1A1F12',
              800: '#2C331F',
              700: '#3A4429',
              600: '#566642',
              500: '#7B8F5F',
              400: '#96A87A',
              300: '#B1C196',
              200: '#CCDAB1',
              100: '#E7F3CC'
            },
            // Deep earth tones - More contrast between shades
            earth: {
              900: '#0A0C0A',
              800: '#151815',
              700: '#1F221F',
              600: '#2C2F2C',
              500: '#3E413E',
              400: '#565956',
              300: '#6E716E',
              200: '#878A87',
              100: '#A0A3A0'
            },
            'tactical-earth': {
              '50': '#f7f7f6',
              '100': '#e9e9e7',
              '150': '#f5f5f3',
              '200': '#d5d5d1',
              '300': '#b5b5b0',
              '400': '#8e8e88',
              '500': '#737370',
              '600': '#5c5c5a',
              '700': '#4a4a48',
              '800': '#3d3d3c',
              '900': '#343433',
              '950': '#1a1a1a',
            },
            'tactical-olive': {
              '50': '#fbfdf8',
              '100': '#f5fae9',
              '200': '#e8f3cd',
              '300': '#d4e8a5',
              '400': '#bbd877',
              '500': '#a2c54f',
              '600': '#85a438',
              '700': '#67802d',
              '800': '#536628',
              '900': '#455424',
              '950': '#232c11',
            },
            'tactical-sand': {
              '50': '#faf8f2',
              '100': '#f3eddd',
              '150': '#f8f6f0',
              '200': '#e4d7b6',
              '300': '#d4bc89',
              '400': '#c7a567',
              '500': '#bc934d',
              '600': '#aa8142',
              '700': '#8d6737',
              '800': '#735232',
              '900': '#60442c',
              '950': '#332217',
            },
            // Dialog-specific colors
            danger: {
              primary: '#ff4c2c',
              light: '#ff4c2c20',
              medium: '#ff4c2c40',
              dark: '#ff4c2c60'
            },
            info: {
              primary: '#60a5fa',
              light: '#3b82f620',
              medium: '#3b82f640',
              dark: '#3b82f660'
            },
            warning: {
              primary: '#fbbf24',
              light: '#f59e0b20',
              medium: '#f59e0b40',
              dark: '#f59e0b60'
            }
          }
        },
        typography: {
          'tactical-olive': {
            css: {
              '--tw-prose-body': '#455424',
              '--tw-prose-headings': '#343433',
              '--tw-prose-lead': '#455424',
              '--tw-prose-links': '#67802d',
              '--tw-prose-bold': '#343433',
              '--tw-prose-counters': '#67802d',
              '--tw-prose-bullets': '#85a438',
              '--tw-prose-hr': '#e8f3cd',
              '--tw-prose-quotes': '#455424',
              '--tw-prose-quote-borders': '#a2c54f',
              '--tw-prose-captions': '#67802d',
              '--tw-prose-code': '#455424',
              '--tw-prose-pre-code': '#f5fae9',
              '--tw-prose-pre-bg': '#343433',
              '--tw-prose-th-borders': '#d4e8a5',
              '--tw-prose-td-borders': '#e8f3cd',
            },
          },
        },
      },
    },
    plugins: [],
  };