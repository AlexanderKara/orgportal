module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xl2': '1340px',
      },
      colors: {
        primary: '#E42E0F',
        secondary: '#FF8A15',
        gray: '#D9D9D9',
        dark: '#2D2D2D',
        black: '#161616',
      },
      fontFamily: {
        sans: ['Tilda Sans', 'sans-serif'],
        accent: ['Jura', 'sans-serif'],
      },
      borderRadius: {
        xl: '50px',
        lg: '25px',
      },
      spacing: {
        avatar: '100px',
        logo: '60px',
        icon: '25px',
      },
      fontSize: {
        xs: ['0.95rem', { lineHeight: '1.3' }],
        sm: ['1.05rem', { lineHeight: '1.4' }],
        base: ['1.18rem', { lineHeight: '1.5' }],
        lg: ['1.35rem', { lineHeight: '1.5' }],
        xl: ['1.7rem', { lineHeight: '1.2' }],
        '2xl': ['2.1rem', { lineHeight: '1.15' }],
        '3xl': ['2.6rem', { lineHeight: '1.1' }],
      },
      backgroundImage: {
        'gradient-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'gradient-gray': 'linear-gradient(to bottom right, #9CA3AF, #4B5563)',
        'gradient-yellow': 'linear-gradient(to bottom right, #FBBF24, #D97706)',
        'gradient-red': 'linear-gradient(to bottom right, #EF4444, #DC2626)',
        'gradient-white': 'linear-gradient(to bottom right, #E5E7EB, #F3F4F6)',
      },
      transform: {
        'rotate-y-180': 'rotateY(180deg)',
      },
    },
  },
  plugins: [],
}; 