/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '12mb',
      },
    },
    // Note: outputFileTracingRoot and serverExternalPackages are not used on Next 14
  
    // Security headers for safety-first approach
    async headers() {
      const isProd = process.env.NODE_ENV === 'production'
      // Build a shared CSP value
      const cspValue = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://accounts.google.com https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: https://i.ytimg.com",
        "font-src 'self'",
        "connect-src 'self' https://api.openai.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://www.facebook.com https://graph.facebook.com https://www.linkedin.com https://api.linkedin.com",
        "frame-src 'self' https://accounts.google.com https://www.facebook.com https://staticxx.facebook.com https://www.linkedin.com",
        "form-action 'self' https://accounts.google.com https://www.facebook.com https://www.linkedin.com",
      ].join('; ')
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
            // In production, enforce CSP; in development, use Report-Only for easier debugging
            isProd
              ? { key: 'Content-Security-Policy', value: cspValue }
              : { key: 'Content-Security-Policy-Report-Only', value: cspValue },
          ],
        },
      ];
    },
  
    // Image optimization
    images: {
      // Disable image optimization during development to avoid 400s when sharp is unavailable
      unoptimized: process.env.NODE_ENV !== 'production',
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com', // Google OAuth profile images
        },
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com', // GitHub profile images (backup auth)
        },
      ],
      formats: ['image/webp', 'image/avif'],
    },
    // Environment variables validation
    env: {
      CUSTOM_KEY: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    },
  
    // Redirects for safety
    async redirects() {
      const redirects = [
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
        // Redirect missing /bio routes to /login
        {
          source: '/bio/signup',
          destination: '/login',
          permanent: false,
        },
        {
          source: '/bio/forgot-password',
          destination: '/login',
          permanent: false,
        },
        // Redirect bare usernames to /bio/:username, excluding known top-level routes
        {
          source:
            '/:username((?!api|admin|profile|dashboard|messages|teams|exercises|workout-log|terms|privacy|safety|community|massiminos|login|signup|register|unauthorized|partnerships|assessments|bio|static|uploads|public|images|_next|favicon\\.ico|.*\\..*).+)',
          destination: '/bio/:username',
          permanent: false,
        },
      ];
      return redirects;
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
  
    // SWC minifier is enabled by default in Next.js 15
  
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
