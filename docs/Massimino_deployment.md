# Massimino Deployment Architecture

This document describes the complete deployment architecture for Massimino, including database hosting, application deployment, and domain management.

## Overview

Massimino uses a modern, cloud-based deployment architecture with the following key components:

- **Database**: Supabase (PostgreSQL)
- **Application Hosting**: Vercel
- **Domain Management**: IONOS
- **ORM**: Prisma

## 1. Supabase - Database Layer

### What is Supabase?
Supabase is an open-source Firebase alternative that provides a managed PostgreSQL database with real-time capabilities, authentication, and storage.

### Massimino's Supabase Setup

**Database Details:**
- **Host**: `aws-0-eu-west-3.pooler.supabase.com`
- **Port**: `5432`
- **Region**: EU West (Paris) - `eu-west-3`
- **Connection Pooling**: Enabled (using Supavisor pooler)

### Database Connection

The database is connected to the application via the `DATABASE_URL` environment variable in the format:
```
postgresql://[user]:[password]@aws-0-eu-west-3.pooler.supabase.com:5432/[database_name]?schema=public
```

### Prisma Integration

Massimino uses Prisma as the ORM (Object-Relational Mapping) tool to interact with the Supabase PostgreSQL database:

**Key Features:**
- **Type Safety**: Prisma provides type-safe database queries
- **Schema Management**: Database schema is defined in `prisma/schema.prisma`
- **Migrations**: Database changes are tracked via Prisma migrations
- **Client Generation**: Prisma generates a type-safe client based on the schema

**Important Prisma Commands:**
```bash
# Generate Prisma Client (required after schema changes)
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Admin Panel Access

The Massimino Admin Panel interfaces with the Supabase database through Prisma, providing:
- User management
- Exercise library management
- Content moderation
- Analytics and reporting
- Partnership management
- Template management

Access the admin panel at: `https://massimino.fitness/admin` or `https://dev.massimino.fitness/admin`

### Supabase Dashboard

Access the Supabase project dashboard to:
- View database tables and data
- Manage database settings
- Monitor performance and usage
- Configure backups
- Manage API keys

**Dashboard URL**: https://supabase.com/dashboard/project/[your-project-id]

## 2. Vercel - Application Hosting

### What is Vercel?
Vercel is a cloud platform for static sites and serverless functions, optimized for Next.js applications (which Massimino is built with).

### Massimino's Vercel Setup

**Deployment Configuration:**
- **Framework**: Next.js 14.2.13
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`

### Automatic Deployments

Vercel is connected to the Massimino GitHub repository and automatically deploys:

**Production Deployment:**
- **Trigger**: Push to `main` branch
- **Domain**: https://massimino.fitness
- **Environment**: Production environment variables

**Preview Deployments:**
- **Trigger**: Pull requests or commits to feature branches
- **Domain**: Temporary preview URLs (e.g., `massimino-git-[branch]-[team].vercel.app`)
- **Purpose**: Testing changes before merging to production

### Environment Variables in Vercel

The following environment variables must be configured in the Vercel dashboard:

**Required Variables:**
```bash
# NextAuth
NEXTAUTH_SECRET=<production-secret>
NEXTAUTH_URL=https://massimino.fitness

# Database (Supabase)
DATABASE_URL=<supabase-connection-string>

# OAuth Providers
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
LINKEDIN_CLIENT_ID=<linkedin-oauth-client-id>
LINKEDIN_CLIENT_SECRET=<linkedin-oauth-secret>

# AI/OpenAI
OPENAI_API_KEY=<openai-api-key>
OPENAI_ORG_ID=<openai-org-id>

# Environment
NODE_ENV=production
```

**Setting Environment Variables:**
1. Go to Vercel dashboard
2. Select the Massimino project
3. Navigate to Settings → Environment Variables
4. Add each variable with appropriate scope (Production, Preview, Development)

### Build Settings

**Vercel automatically:**
- Runs `npx prisma generate` via the `postinstall` script
- Executes `npm run build` to create the production build
- Optimizes assets and images
- Generates static pages where possible
- Sets up serverless functions for API routes

### Deployment Process

When code is pushed to GitHub:

1. **GitHub** detects the push to `main` branch
2. **Vercel** receives webhook notification
3. **Build Process** starts:
   - Install dependencies (`npm install`)
   - Generate Prisma client (`npx prisma generate`)
   - Build Next.js app (`npm run build`)
4. **Deployment**: Built application is deployed to edge network
5. **Domain Update**: https://massimino.fitness points to new deployment
6. **Automatic**: Entire process takes 2-5 minutes

### Vercel Dashboard

Access the Vercel dashboard for:
- Deployment history and logs
- Performance analytics
- Domain configuration
- Environment variables management
- Build logs and debugging

**Dashboard URL**: https://vercel.com/dashboard

## 3. IONOS - Domain Management

### What is IONOS?
IONOS is a domain registrar and web hosting provider managing the DNS and domain configuration for Massimino.

### Massimino's IONOS Setup

**Domains Managed:**
- **Primary Production**: `massimino.fitness`
- **Development**: `dev.massimino.fitness`

### DNS Configuration

The domains are configured in IONOS with DNS records pointing to Vercel:

**For massimino.fitness (Production):**
```
Type    Name    Value                          TTL
A       @       76.76.21.21                    3600
CNAME   www     cname.vercel-dns.com          3600
```

**For dev.massimino.fitness (Development/Staging):**
```
Type    Name    Value                          TTL
CNAME   dev     cname.vercel-dns.com          3600
```

### Domain Setup Process

To connect a domain from IONOS to Vercel:

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add custom domain (e.g., `massimino.fitness`)
   - Vercel provides DNS configuration instructions

2. **In IONOS Dashboard:**
   - Navigate to DNS settings for the domain
   - Add the A record and CNAME records as specified by Vercel
   - Wait for DNS propagation (can take up to 48 hours, usually faster)

3. **SSL/TLS Certificates:**
   - Vercel automatically provisions and renews SSL certificates
   - All traffic is served over HTTPS
   - HTTP requests automatically redirect to HTTPS

### Managing Multiple Domains

**Production Domain (massimino.fitness):**
- Connected to the `main` branch deployment
- Uses production environment variables
- Full SSL/TLS encryption

**Development Domain (dev.massimino.fitness):**
- Can be connected to a specific branch or preview deployment
- Uses development/preview environment variables
- Useful for testing before production release

### IONOS Dashboard

Access the IONOS dashboard to:
- Manage domain renewals
- Configure DNS records
- Set up email forwarding
- View domain analytics

**Dashboard URL**: https://www.ionos.com/

## 4. Complete Deployment Workflow

### Making Changes to Massimino

1. **Development**:
   ```bash
   # Make code changes locally
   # Test locally with: npm run dev
   ```

2. **Database Changes** (if needed):
   ```bash
   # Update prisma/schema.prisma
   npx prisma migrate dev --name your_migration_name
   # This creates a migration and updates local database
   ```

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

4. **Push to GitHub**:
   ```bash
   git push origin main
   ```

5. **Automatic Deployment**:
   - Vercel detects push to `main`
   - Runs build process
   - Applies Prisma migrations (if configured)
   - Deploys to https://massimino.fitness
   - Usually completes in 2-5 minutes

### Monitoring Deployment

**Check Deployment Status:**
1. Visit Vercel dashboard
2. Check deployment logs for build output
3. Review any errors or warnings
4. Verify deployment is live

**Database Migrations in Production:**
```bash
# If migrations need to be applied manually in production:
# Set DATABASE_URL to production database
npx prisma migrate deploy
```

### Rollback Process

If a deployment causes issues:

1. **Quick Rollback in Vercel:**
   - Go to Deployments in Vercel dashboard
   - Find a previous working deployment
   - Click "Promote to Production"

2. **Code Rollback:**
   ```bash
   # Revert to previous commit
   git revert [commit-hash]
   git push origin main
   ```

## 5. Environment-Specific Configuration

### Development Environment
- **URL**: http://localhost:3000
- **Database**: Can use local PostgreSQL or Supabase development instance
- **Environment File**: `.env.development` or `.env.local`

### Preview/Staging Environment
- **URL**: https://dev.massimino.fitness
- **Database**: Supabase (can use separate staging database)
- **Environment**: Preview environment variables in Vercel

### Production Environment
- **URL**: https://massimino.fitness
- **Database**: Supabase production database
- **Environment**: Production environment variables in Vercel
- **Security**: Enforced HTTPS, CSP headers, secure authentication

## 6. Maintenance and Best Practices

### Regular Maintenance

- **Database Backups**: Supabase provides automatic backups
- **Monitor Usage**: Check Supabase and Vercel usage dashboards
- **Update Dependencies**: Regularly update npm packages for security
- **Review Logs**: Check Vercel deployment logs for errors
- **Performance Monitoring**: Use Vercel Analytics to track performance

### Security Best Practices

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Rotate credentials**: Periodically rotate API keys and database passwords
3. **Monitor access**: Review admin panel access logs
4. **SSL/TLS**: Always use HTTPS (automatically handled by Vercel)
5. **Database Security**: Use connection pooling and strong passwords

### Troubleshooting

**Build Failures:**
- Check Vercel build logs
- Verify all environment variables are set
- Ensure Prisma schema is valid: `npx prisma validate`

**Database Connection Issues:**
- Verify DATABASE_URL is correct
- Check Supabase service status
- Ensure connection pooling is enabled for serverless environments

**Domain Issues:**
- Verify DNS records in IONOS
- Check domain configuration in Vercel
- Wait for DNS propagation (up to 48 hours)

## 7. Quick Reference

### Important URLs

| Service | Purpose | URL |
|---------|---------|-----|
| Production Site | Live application | https://massimino.fitness |
| Development Site | Staging environment | https://dev.massimino.fitness |
| Admin Panel | Admin dashboard | https://massimino.fitness/admin |
| Vercel Dashboard | Deployment management | https://vercel.com/dashboard |
| Supabase Dashboard | Database management | https://supabase.com/dashboard |
| IONOS Dashboard | Domain management | https://www.ionos.com/ |
| GitHub Repository | Source code | https://github.com/[username]/massimino |

### Key Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run type-check      # Check TypeScript types

# Prisma
npx prisma generate     # Generate Prisma Client
npx prisma studio       # Open database GUI
npx prisma migrate dev  # Create and apply migration (dev)
npx prisma migrate deploy  # Apply migrations (production)

# Git
git status              # Check current changes
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push origin main    # Deploy to production
```

### Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **IONOS Support**: https://www.ionos.com/help

---

**Last Updated**: 2025-10-24
**Maintained By**: Massimino Development Team
