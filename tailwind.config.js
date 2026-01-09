/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    prefix: '',
    theme: {
      container: {
        center: true,
        padding: '2rem',
        screens: {
          '2xl': '1400px',
        },
      },
      extend: {
        // Massimino brand colors - fitness focused palette
        colors: {
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
          },
          // Safety-specific colors
          safety: {
            green: '#10b981', // Safe content
            yellow: '#f59e0b', // Flagged for review
            red: '#ef4444', // Blocked content
            blue: '#3b82f6', // Trainer verified
          },
          // Fitness-themed colors
          fitness: {
            muscle: '#e11d48', // Strength training
            cardio: '#06b6d4', // Cardio activities
            flexibility: '#8b5cf6', // Yoga/stretching
            nutrition: '#84cc16', // Diet/nutrition
          },
          // User role colors
          role: {
            client: '#64748b',
            trainer: '#2563eb',
            admin: '#7c3aed',
          },
          // Massimino brand colors from logo
          brand: {
            primary: '#254967',    // Deep blue from logo
            secondary: '#fcf8f2',  // Warm cream from logo
            'primary-light': '#3a5a7a',  // Lighter variant of primary
            'primary-dark': '#1a3a52',  // Darker variant of primary
            'secondary-dark': '#f5f0e8', // Slightly darker cream
          },
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
        // Custom animations for safety feedback and page effects
        keyframes: {
          'accordion-down': {
            from: { height: '0' },
            to: { height: 'var(--radix-accordion-content-height)' },
          },
          'accordion-up': {
            from: { height: 'var(--radix-accordion-content-height)' },
            to: { height: '0' },
          },
          'safety-pulse': {
            '0%, 100%': {
              opacity: '1',
              transform: 'scale(1)',
            },
            '50%': {
              opacity: '0.7',
              transform: 'scale(1.05)',
            },
          },
          'warning-shake': {
            '0%, 100%': { transform: 'translateX(0)' },
            '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
            '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
          },
          'success-bounce': {
            '0%, 100%': {
              transform: 'translateY(0)',
              opacity: '1',
            },
            '50%': {
              transform: 'translateY(-4px)',
              opacity: '0.8',
            },
          },
          // Page animation keyframes
          'fade-in-up': {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          'fade-in-down': {
            '0%': { opacity: '0', transform: 'translateY(-20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          'fade-in-left': {
            '0%': { opacity: '0', transform: 'translateX(-30px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
          'fade-in-right': {
            '0%': { opacity: '0', transform: 'translateX(30px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
          'scale-in': {
            '0%': { opacity: '0', transform: 'scale(0.9)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
          'bounce-in': {
            '0%': { opacity: '0', transform: 'scale(0.3)' },
            '50%': { transform: 'scale(1.05)' },
            '70%': { transform: 'scale(0.9)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
          'float': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          'shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' },
          },
          'gradient-x': {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
          },
          'glow-pulse': {
            '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
            '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' },
          },
          'slide-in-bottom': {
            '0%': { opacity: '0', transform: 'translateY(100%)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          'rotate-in': {
            '0%': { opacity: '0', transform: 'rotate(-10deg) scale(0.9)' },
            '100%': { opacity: '1', transform: 'rotate(0) scale(1)' },
          },
          'wiggle': {
            '0%, 100%': { transform: 'rotate(-3deg)' },
            '50%': { transform: 'rotate(3deg)' },
          },
          'heartbeat': {
            '0%, 100%': { transform: 'scale(1)' },
            '14%': { transform: 'scale(1.1)' },
            '28%': { transform: 'scale(1)' },
            '42%': { transform: 'scale(1.1)' },
            '70%': { transform: 'scale(1)' },
          },
          'flip-in': {
            '0%': { opacity: '0', transform: 'perspective(400px) rotateX(90deg)' },
            '40%': { transform: 'perspective(400px) rotateX(-10deg)' },
            '70%': { transform: 'perspective(400px) rotateX(10deg)' },
            '100%': { opacity: '1', transform: 'perspective(400px) rotateX(0)' },
          },
          'blur-in': {
            '0%': { opacity: '0', filter: 'blur(10px)' },
            '100%': { opacity: '1', filter: 'blur(0)' },
          },
        },
        animation: {
          'accordion-down': 'accordion-down 0.2s ease-out',
          'accordion-up': 'accordion-up 0.2s ease-out',
          'safety-pulse': 'safety-pulse 2s ease-in-out infinite',
          'warning-shake': 'warning-shake 0.5s ease-in-out',
          'success-bounce': 'success-bounce 0.6s ease-out',
          // Page animations
          'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
          'fade-in-up-delay-1': 'fade-in-up 0.6s ease-out 0.1s forwards',
          'fade-in-up-delay-2': 'fade-in-up 0.6s ease-out 0.2s forwards',
          'fade-in-up-delay-3': 'fade-in-up 0.6s ease-out 0.3s forwards',
          'fade-in-up-delay-4': 'fade-in-up 0.6s ease-out 0.4s forwards',
          'fade-in-down': 'fade-in-down 0.6s ease-out forwards',
          'fade-in-left': 'fade-in-left 0.6s ease-out forwards',
          'fade-in-right': 'fade-in-right 0.6s ease-out forwards',
          'scale-in': 'scale-in 0.5s ease-out forwards',
          'bounce-in': 'bounce-in 0.8s ease-out forwards',
          'float': 'float 3s ease-in-out infinite',
          'shimmer': 'shimmer 2s linear infinite',
          'gradient-x': 'gradient-x 3s ease infinite',
          'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
          'slide-in-bottom': 'slide-in-bottom 0.5s ease-out forwards',
          'rotate-in': 'rotate-in 0.6s ease-out forwards',
          'wiggle': 'wiggle 1s ease-in-out infinite',
          'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
          'flip-in': 'flip-in 0.8s ease-out forwards',
          'blur-in': 'blur-in 0.6s ease-out forwards',
        },
        // Typography for safety messaging
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        // Spacing for safety elements
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
        },
        // Custom shadows for depth and safety indicators
        boxShadow: {
          'safety-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
          'warning-glow': '0 0 20px rgba(245, 158, 11, 0.3)',
          'danger-glow': '0 0 20px rgba(239, 68, 68, 0.3)',
        },
      },
    },
    plugins: [
      require('tailwindcss-animate'),
      // Custom plugin for safety-related utilities
      function({ addUtilities }) {
        const newUtilities = {
          '.safety-border': {
            border: '2px solid #10b981',
          },
          '.warning-border': {
            border: '2px solid #f59e0b',
          },
          '.danger-border': {
            border: '2px solid #ef4444',
          },
          '.trainer-badge': {
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
          },
          '.safety-gradient': {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          },
        }
        
        addUtilities(newUtilities, ['responsive', 'hover'])
      }
    ],
  }