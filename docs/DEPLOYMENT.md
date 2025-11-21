# Massimino Deployment Guide

## 🚀 Deploying to massimino.fitness

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=<replace-with-strong-random-string>
NEXTAUTH_URL=https://massimino.fitness

# Database (Production PostgreSQL)
DATABASE_URL="postgresql://username:password@your-db-host:5432/massimino_production?schema=public"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID=<your-linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<your-linkedin-client-secret>

# Facebook OAuth (optional)
FACEBOOK_CLIENT_ID=<your-facebook-client-id>
FACEBOOK_CLIENT_SECRET=<your-facebook-client-secret>

# OpenAI Moderation (optional but recommended)
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_ORG_ID=<your-openai-org-id>

# Environment
NODE_ENV=production
```

### Database Setup

1. **Create Production Database**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Initial Data** (if needed):
   ```bash
   npx ts-node prisma/seed.ts
   ```

### Build and Deploy

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

### Domain Configuration

- **Primary Domain**: `https://massimino.fitness`
- **Authentication**: Configured for production domain
- **SSL**: Ensure HTTPS is enabled
- **Redirects**: All HTTP traffic should redirect to HTTPS

### Security Checklist

- [ ] Change `NEXTAUTH_SECRET` to a secure random string
- [ ] Use HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Set up database connection pooling
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

### Google OAuth Setup

To ensure proper functionality:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your Massimino project
3. Go to "Credentials" → "OAuth 2.0 Client IDs"
4. Edit your existing OAuth client
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://massimino.fitness/api/auth/callback/google` (for production)

Note: Do not commit secrets. Providers are enabled only when both Client ID and Secret are present in environment variables.

### Performance Optimization

- Enable Next.js production optimizations
- Set up CDN for static assets
- Configure database indexes
- Enable compression
- Set up caching strategies

### Monitoring

- Set up error tracking (Sentry, LogRocket, etc.)
- Configure uptime monitoring
- Set up performance monitoring
- Database query monitoring

## 🎯 Ready for Production!

Your Massimino fitness platform is now configured for `massimino.fitness`!
