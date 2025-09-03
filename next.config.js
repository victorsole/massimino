/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable experimental features for Next.js 15
    experimental: {
      // Enable React Server Components
      serverComponentsExternalPackages: ['@prisma/client'],
    },
  
    // Security headers for safety-first approach
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            // Prevent clickjacking
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            // XSS Protection
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            // Prevent MIME type sniffing
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            // Referrer Policy for privacy
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            // Content Security Policy
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self'",
                "connect-src 'self' https://api.openai.com https://accounts.google.com",
                "frame-src 'none'",
              ].join('; '),
            },
          ],
        },
      ];
    },
  
    // Image optimization
    images: {
      domains: [
        'lh3.googleusercontent.com', // Google OAuth profile images
        'avatars.githubusercontent.com', // GitHub profile images (backup auth)
      ],
      formats: ['image/webp', 'image/avif'],
    },
  
    // Webpack configuration
    webpack: (config, { dev, isServer }) => {
      // Optimize for safety and performance
      if (!dev && !isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@': require('path').resolve(__dirname, 'src'),
        };
      }
      return config;
    },
  
    // Environment variables validation
    env: {
      CUSTOM_KEY: process.env.NODE_ENV,
    },
  
    // Redirects for safety
    async redirects() {
      return [
        // Redirect HTTP to HTTPS in production
        ...(process.env.NODE_ENV === 'production'
          ? [
              {
                source: '/(.*)',
                has: [
                  {
                    type: 'header',
                    key: 'x-forwarded-proto',
                    value: 'http',
                  },
                ],
                destination: 'https://:host/:path*',
                permanent: true,
              },
            ]
          : []),
      ];
    },
  
    // Logging configuration
    logging: {
      fetches: {
        fullUrl: process.env.NODE_ENV === 'development',
      },
    },
  
    // Disable powered by header for security
    poweredByHeader: false,
  
    // Enable strict mode
    reactStrictMode: true,
  
    // Enable SWC minifier for better performance
    swcMinify: true,
  
    // TypeScript configuration
    typescript: {
      // Type checking is handled by CI/CD pipeline
      ignoreBuildErrors: false,
    },
  
    // ESLint configuration
    eslint: {
      // Lint during builds
      ignoreDuringBuilds: false,
    },
  };
  
  module.exports = nextConfig;