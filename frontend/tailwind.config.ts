export default {
  content: ['./app/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sanvi: {
          primary: {
            900: '#1E3A8A', // Deep Blue (header/footer)
            700: '#2563EB', // Main CTA Blue
            100: '#DBEAFE', // Light Blue background
          },
          secondary: {
            600: '#EA580C', // Orange hover
            500: '#F97316', // Orange CTA / buttons
            100: '#FFEDD5', // Orange light accent
          },
          neutral: {
            50: '#F9FAFB', // Page background
            100: '#F3F4F6', // Card background
            400: '#9CA3AF', // Borders / placeholder text
            700: '#374151', // Body text
            900: '#111827', // Headings
          },
          support: {
            green: '#16A34A', // Success
            red: '#EF4444', // Errors
            yellow: '#FACC15', // Warnings
          },
        },
      },
    },
  },
};
