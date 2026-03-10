/**
 * Tailwind CSS Configuration
 *
 * This configuration enables dark mode via a class on the root element and
 * extends the default color palette with a custom primary accent. Additional
 * plugins can be added here in the future if needed.
 */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5D3FD3', // primary accent used throughout the UI
          light: '#7D5FEF',   // lighter variant for hover states
          dark: '#3C239A',    // darker variant for active states
        },
        background: {
          light: '#F9FAFB',
          dark: '#1F2937',
        },
      },
    },
  },
  plugins: [],
};