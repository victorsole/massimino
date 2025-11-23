# CLAUDE.md

**Massimino - Safety-First Fitness Community Platform**
AI Assistant Guide for Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Development Setup](#development-setup)
6. [Core Conventions](#core-conventions)
7. [Database Schema](#database-schema)
8. [API Structure](#api-structure)
9. [Authentication & Authorization](#authentication--authorization)
10. [Common Development Workflows](#common-development-workflows)
11. [Key Patterns & Best Practices](#key-patterns--best-practices)
12. [Testing](#testing)
13. [Security](#security)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Massimino** is a comprehensive, safety-first fitness community platform that combines:

- **Workout Tracking**: Detailed logging with sets, reps, weight, RPE, tempo, rest periods
- **Coaching Platform**: Trainer-athlete relationships, program assignments, progress tracking
- **AI-Powered Assistance**: GPT-based workout recommendations using NASM training principles
- **Real-Time Features**: Live chat, video calls, workout sessions, progress broadcasting
- **Social Features**: Teams, challenges, communities, leaderboards
- **Gamification**: Points system, achievements, rewards for trainers
- **Content Moderation**: AI-powered safety checks, reputation system, user reporting
- **Monetization**: Payments (Mollie), subscriptions, marketplace for programs

**Core Philosophy**: Safety-first approach with comprehensive moderation, user reputation scoring, and trainer verification.

---

## Tech Stack

### Core Framework
- **Next.js 15.5.6** (App Router)
- **React 18.2.0**
- **TypeScript 5.3.3** (relaxed mode: `strict: false`)
- **Node.js >=18.17.0**

### Database & ORM
- **PostgreSQL** (production database)
- **Prisma 6.16.0** (ORM with custom adapter for lowercase tables)
- **130+ models** in schema

### UI & Styling
- **Tailwind CSS 3.3.6** (utility-first styling)
- **Radix UI** (accessible component primitives)
- **Framer Motion 12.23.24** (animations)
- **GSAP 3.13.0** (advanced animations)
- **lucide-react** (icons)
- **class-variance-authority** (variant management)

### Authentication
- **NextAuth.js 4.24.11**
- **bcryptjs** (password hashing)
- Providers: Google OAuth, LinkedIn OIDC, Facebook OAuth, Credentials

### Real-Time
- **Socket.io 4.8.1** (WebSocket communication)
- WebRTC signaling for video calls
- Push notifications via Expo

### AI & Content
- **OpenAI 4.20.1** (GPT-3.5-turbo for workout suggestions, content moderation)
- NASM CPT/CNC knowledge bases

### Payments & Email
- **@mollie/api-client 4.3.3** (European payment gateway)
- **Resend 6.1.1** (transactional email)
- **@react-email/components** (email templates)

### External Integrations
- **Firebase Admin 13.5.0** (Firestore sync)
- Social media APIs (Instagram, TikTok, YouTube, Facebook, LinkedIn, Spotify)

### Testing (Configured, Not Implemented)
- **Jest 29.7.0** + **@testing-library/react**
- **Playwright 1.40.1** (E2E testing)
- **Coverage tracking** configured

### Development Tools
- **ESLint** + **Prettier** (code quality)
- **TypeScript ESLint** (TypeScript linting)
- **ts-node** (script execution)

---

## Architecture

### Pattern: Layered Architecture

```
┌─────────────────────────────────────────────────┐
│  Presentation Layer                             │
│  /src/app (pages) + /src/components (UI)        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  API Layer                                       │
│  /src/app/api (REST endpoints)                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Business Logic Layer                            │
│  /src/services (domain logic)                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Data Access Layer                               │
│  /src/services/repository + Prisma               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Infrastructure Layer                            │
│  /src/core (auth, database, integrations)        │
└─────────────────────────────────────────────────┘
```

### Next.js App Router Structure

- **Server Components**: Default for data fetching and rendering
- **Client Components**: Marked with `'use client'` for interactivity
- **Route Handlers**: `/app/api/*/route.ts` for REST endpoints
- **File-Based Routing**: `page.tsx` for routes, `layout.tsx` for layouts

### State Management

**No global state library** - uses React built-ins:
- `useState`/`useEffect` for local state
- NextAuth `useSession()` for auth state
- Server Components for data fetching
- Socket.io for real-time state
- react-hook-form + Zod for form state

---

## Directory Structure

```
/massimino
├── /android                 # Android mobile app (React Native/Capacitor)
├── /ios                     # iOS mobile app
├── /docs                    # Documentation
├── /prisma                  # Database schema and migrations
│   ├── schema.prisma        # 130+ models (3,578 lines)
│   ├── migrations/          # Database migrations
│   └── seed.ts             # Seed data
├── /public                  # Static assets
│   ├── /databases          # NASM CPT/CNC training guides
│   ├── /images             # Brand assets, icons
│   └── /uploads            # User-generated content
├── /scripts                 # Utility scripts (exercise imports, etc.)
├── /src
│   ├── /app                # Next.js App Router
│   │   ├── /api           # REST API endpoints
│   │   ├── /[route]       # Page routes
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Landing page
│   │   └── globals.css    # Global styles
│   ├── /components         # React components
│   │   ├── /ui            # Design system (Radix-based)
│   │   ├── /workout       # Workout components
│   │   ├── /coaching      # Coaching components
│   │   ├── /training      # Training session components
│   │   ├── /teams         # Team components
│   │   ├── /massichat     # AI chat components
│   │   ├── /workout-log   # Workout logging components
│   │   ├── /layout        # Layout components (Header, Footer)
│   │   └── /providers     # React context providers
│   ├── /core               # Infrastructure layer
│   │   ├── /auth          # NextAuth configuration
│   │   ├── /database      # Prisma client singleton
│   │   ├── /integrations  # External APIs (Firebase, Mollie, Social)
│   │   ├── /socket        # Socket.IO server
│   │   └── /utils         # Core utilities
│   ├── /services           # Business logic layer
│   │   ├── /ai            # AI services (OpenAI)
│   │   ├── /auth          # Auth services
│   │   ├── /coaching      # Coaching logic
│   │   ├── /email         # Email services
│   │   ├── /gamification  # Points/achievements
│   │   ├── /moderation    # Content moderation
│   │   ├── /payments      # Payment processing
│   │   ├── /repository    # Data access layer
│   │   ├── /teams         # Team management
│   │   └── /trainer       # Trainer services
│   ├── /lib                # Library utilities
│   │   ├── /auth          # Auth utilities
│   │   ├── /database      # Database utilities
│   │   ├── /animations    # Animation variants
│   │   └── /moderation    # Moderation utilities
│   ├── /hooks              # Custom React hooks
│   ├── /types              # TypeScript type definitions
│   └── /templates          # React Email templates
├── .gitignore
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest configuration
├── package.json            # Dependencies and scripts
└── CLAUDE.md              # This file
```

---

## Development Setup

### Prerequisites

```bash
# Required
Node.js >= 18.17.0
PostgreSQL database
npm (comes with Node.js)
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/massimino"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# Payments
MOLLIE_API_KEY="your-mollie-api-key"

# Email
RESEND_API_KEY="your-resend-api-key"

# Admin
ADMIN_EMAILS="admin@example.com,admin2@example.com"

# Optional: Firebase, Social Media APIs, etc.
```

### Development Commands

```bash
# Start development server
npm run dev                    # http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Database operations
npm run db:generate           # Generate Prisma client
npm run db:push              # Push schema to database (dev)
npm run db:migrate           # Run migrations (dev)
npm run db:migrate:prod      # Run migrations (production)
npm run db:reset             # Reset database (dev only!)
npm run db:studio            # Open Prisma Studio (GUI)

# Testing (configured but no tests written)
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

# Full safety check
npm run safety:check         # Runs lint + type-check + test

# Scripts
npm run scripts:exercises:import:local    # Import exercises from CSV
npm run scripts:exercises:sync:firestore  # Sync exercises to Firebase
```

---

## Core Conventions

### Naming Conventions

**Files & Directories:**
- Components: `PascalCase.tsx` (e.g., `WorkoutCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `workout-validation.ts`)
- API routes: `route.ts` in kebab-case directories
- Pages: `page.tsx` (Next.js convention)
- Types: `kebab-case.ts` (e.g., `auth.ts`, `workout.ts`)

**Code:**
- Variables/Functions: `camelCase` (e.g., `getUserProfile`)
- Components: `PascalCase` (e.g., `WorkoutCard`)
- Types/Interfaces: `PascalCase` (e.g., `User`, `WorkoutSession`)
- Constants: `UPPER_SNAKE_CASE` for enums, `camelCase` otherwise
- Database: `snake_case` (Prisma convention)

### Import Conventions

Use TypeScript path aliases (configured in `tsconfig.json`):

```typescript
// ✅ Good
import { prisma } from '@/core/database/client'
import { WorkoutCard } from '@/components/workout/WorkoutCard'
import type { User } from '@/types/auth'

// ❌ Avoid
import { prisma } from '../../../../core/database/client'
```

### Component Conventions

**Structure:**
```typescript
'use client' // Only when needed for interactivity

import { useState, useEffect } from 'react'
import type { ComponentProps } from './types'

export function MyComponent({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState()
  const session = useSession()

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies])

  // 3. Event handlers
  const handleClick = () => { /* ... */ }

  // 4. Render
  return (
    <div className="container mx-auto">
      {/* Tailwind utility classes */}
    </div>
  )
}
```

### API Route Conventions

**Structure:**
```typescript
// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization check (role-based)
    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Input validation (with Zod)
    const data = await request.json()
    const validated = schema.parse(data)

    // 4. Business logic
    const result = await someService.doSomething(validated)

    // 5. Return response
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Service Layer Conventions

**Structure:**
```typescript
// /src/services/domain/service.ts
import { prisma } from '@/core/database/client'

export class DomainService {
  async operation(userId: string, data: DataType) {
    // 1. Input validation
    if (!userId) throw new Error('User ID required')

    // 2. Business rules
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    // 3. Database operations
    const result = await prisma.entity.create({
      data: {
        userId,
        ...data
      }
    })

    // 4. Return result
    return result
  }
}

export const domainService = new DomainService()
```

### Database Query Conventions

**Best Practices:**
```typescript
// ✅ Use select to limit data transfer
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    role: true
  }
})

// ✅ Use include for relations
const workout = await prisma.workoutSession.findUnique({
  where: { id: sessionId },
  include: {
    entries: {
      include: {
        exercise: true
      }
    }
  }
})

// ✅ Use transactions for multiple operations
await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { points: { increment: 10 } } }),
  prisma.trainerPoints.create({ data: { userId: id, points: 10, reason: 'ACHIEVEMENT' } })
])

// ❌ Avoid fetching unnecessary data
const user = await prisma.user.findUnique({ where: { id } }) // Gets all fields
```

---

## Database Schema

### Key Model Categories

**User Management** (13 models)
- `users` - Core user profiles
- `accounts`, `sessions` - NextAuth integration
- `email_verification_tokens`, `verificationtokens`
- `user_violations`, `safety_reports`, `safety_settings`

**Fitness & Workouts** (20+ models)
- `exercises` - Global exercise library
- `user_exercises` - User-created exercises
- `workout_log_entries` - Individual set records
- `workout_sessions` - Session containers
- `workout_templates` - Reusable workout plans
- `workout_analytics` - Aggregated statistics
- `personal_records` - PRs tracking
- `habit_logs` - Weekly habit grid

**Coaching** (15+ models)
- `trainer_profiles` - Trainer credentials
- `trainer_clients` - Client relationships
- `athlete_invitations` - Invitation system
- `coaching_requests` - Coaching requests
- `appointments` - Scheduled sessions
- `progress_reports` - Client progress
- `program_templates` - Training programs

**Social & Teams** (15+ models)
- `teams`, `team_members` - Team management
- `team_workout_logs` - Shared workouts
- `challenges`, `challenge_participants`
- `challenge_leaderboard` - Rankings
- `communities`, `community_posts`
- `posts`, `comments` - Social content

**Messaging** (10+ models)
- `chat_rooms`, `chat_messages` - Chat system
- `network_messages` - Direct messages
- `live_workout_sessions` - Live streaming
- `live_session_participants`

**AI** (5 models)
- `ai_chat_sessions`, `ai_chat_messages` - MassiChat
- `ai_workout_proposals` - AI workout suggestions
- `fitness_knowledge_base` - Training content
- `assessments` - Fitness assessments

**Payments** (10+ models)
- `payments`, `client_payments` - Transactions
- `subscriptions`, `trainer_subscriptions`
- `premium_memberships`
- `package_deals`, `program_subscriptions`

**Gamification** (5 models)
- `trainer_points` - Points system
- `trainer_achievements` - Unlocks
- `points_redemptions` - Rewards

**Partnerships** (5 models)
- `partners`, `partner_leads`
- `gym_integrations`
- `ad_campaigns`, `ad_creatives`, `ad_events`

**Total: 130+ models across 3,578 lines**

### Important Enums

```typescript
enum UserRole { CLIENT, TRAINER, ADMIN }
enum UserStatus { ACTIVE, SUSPENDED, BANNED }
enum WorkoutType { STRENGTH, CARDIO, FLEXIBILITY, SPORTS, OTHER }
enum SetType { WORKING, WARMUP, DROPSET, SUPERSET, AMRAP }
enum IntensityType { RPE, PERCENTAGE_1RM, RIR }
enum PaymentStatus { PENDING, PAID, FAILED, REFUNDED }
enum ModerationType { AUTO, MANUAL, REPORTED }
```

### Custom Prisma Adapter

**Important**: Tables use lowercase naming (e.g., `users`, `workout_sessions`)
- Custom NextAuth adapter required: `/src/core/auth/prisma-adapter-custom.ts`
- Prisma schema uses lowercase naming throughout
- Follow this convention when creating new models

---

## API Structure

### Base Path: `/src/app/api`

### Major API Domains

**Authentication & Users**
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/auth/register` - User registration
- `/api/auth/verify-email` - Email verification
- `/api/users` - User CRUD
- `/api/profile` - Profile management

**Workouts & Exercises**
- `/api/workout/entries` - Workout log entries
- `/api/workout/sessions` - Workout sessions
- `/api/workout/exercises` - Exercise library
- `/api/workout/my_exercises` - User exercises
- `/api/workout/templates` - Workout templates
- `/api/workout/programs` - Training programs
- `/api/workout/analytics` - Workout analytics
- `/api/workout/records` - Personal records
- `/api/workout/habits` - Habit tracking
- `/api/workout/ai` - AI workout suggestions
- `/api/workout/coaching-cues` - AI coaching cues
- `/api/workout/marketplace` - Program marketplace

**Coaching & Trainer**
- `/api/coaching/athletes` - Athlete management
- `/api/coaching/sessions` - Coaching sessions
- `/api/coaching/invitations` - Athlete invitations
- `/api/coaching/requests` - Coaching requests
- `/api/coaching/messages` - Trainer-athlete messaging
- `/api/coaching/assign-program` - Program assignment
- `/api/coaching/teams` - Team assignments
- `/api/trainer/professional` - Trainer credentials
- `/api/trainer/reports` - Progress reports

**AI (MassiChat)**
- `/api/massichat` - AI chat sessions
- `/api/massichat/assessments` - AI assessments
- `/api/massichat/proposals` - Workout proposals
- `/api/massichat/knowledge` - Knowledge base queries

**Teams & Social**
- `/api/teams` - Team CRUD
- `/api/teams/[id]/members` - Team membership
- `/api/teams/[id]/media` - Team media
- `/api/teams/invite` - Team invitations
- `/api/challenges` - Challenge management
- `/api/leaderboards` - Global leaderboards

**Payments**
- `/api/payments` - Payment processing
- `/api/payments/trainer` - Trainer payment setup
- `/api/payments/webhook` - Payment webhooks (Mollie)

**Partnerships**
- `/api/partners` - Partner directory
- `/api/partnerships` - Partnership management
- `/api/partner/gym` - Gym API integration

**Admin**
- `/api/admin/*` - Admin endpoints (role-protected)

### API Response Patterns

**Success Response:**
```typescript
return NextResponse.json({
  data: result,
  message: 'Success'
})
```

**Error Response:**
```typescript
return NextResponse.json({
  error: 'Error message'
}, {
  status: 400 | 401 | 403 | 404 | 500
})
```

---

## Authentication & Authorization

### NextAuth Configuration

**Location**: `/src/core/auth/config.ts`

### Session Structure

```typescript
interface Session {
  user: {
    id: string
    name: string | null
    email: string | null
    image?: string | null
    role: 'CLIENT' | 'TRAINER' | 'ADMIN'
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
    reputationScore: number
    warningCount: number
    trainerVerified: boolean
    suspendedUntil?: Date | null
    isSafe: boolean // Computed: status === ACTIVE && reputation >= 50
  }
}
```

### Authentication Patterns

**Server Components:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Render authenticated content
}
```

**Client Components:**
```typescript
'use client'
import { useSession } from 'next-auth/react'

export function Component() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <Loading />
  if (status === 'unauthenticated') return <Login />

  return <div>Hello {session.user.name}</div>
}
```

**API Routes:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Proceed with authenticated logic
}
```

### Authorization Patterns

**Role-Based Access Control:**
```typescript
// Check user role
if (session.user.role !== 'TRAINER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Check admin
if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Admin only' }, { status: 403 })
}

// Check trainer verified
if (!session.user.trainerVerified) {
  return NextResponse.json({ error: 'Trainer verification required' }, { status: 403 })
}
```

**Resource Ownership:**
```typescript
// Verify user owns the resource
const workout = await prisma.workoutSession.findUnique({
  where: { id: workoutId }
})

if (workout.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Safety Checks:**
```typescript
// Check user safety status
if (!session.user.isSafe) {
  return NextResponse.json({
    error: 'Account restricted due to safety violations'
  }, { status: 403 })
}

// Check suspended
if (session.user.status === 'SUSPENDED') {
  return NextResponse.json({
    error: 'Account suspended',
    suspendedUntil: session.user.suspendedUntil
  }, { status: 403 })
}
```

---

## Common Development Workflows

### Adding a New Feature

1. **Plan the Feature**
   - Identify required database models
   - Design API endpoints
   - Plan UI components

2. **Update Database Schema**
   ```bash
   # Edit prisma/schema.prisma
   # Add new models or fields

   # Create migration
   npm run db:migrate

   # Name the migration descriptively
   # e.g., "add_nutrition_tracking"
   ```

3. **Create API Endpoints**
   ```bash
   # Create route handler
   # /src/app/api/feature/route.ts
   ```

   Follow API route conventions (see above)

4. **Create Service Layer**
   ```bash
   # /src/services/feature/service.ts
   ```

   Encapsulate business logic

5. **Create UI Components**
   ```bash
   # /src/components/feature/
   ```

   Follow component conventions

6. **Test Locally**
   ```bash
   npm run dev
   # Test in browser

   npm run type-check
   npm run lint
   ```

7. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add nutrition tracking feature"
   git push -u origin <branch-name>
   ```

### Modifying Existing Features

1. **Understand Current Implementation**
   - Read the relevant API route
   - Review the service layer
   - Check database models
   - Test current behavior

2. **Make Changes**
   - Update API routes as needed
   - Modify service layer logic
   - Update database schema if needed
   - Adjust UI components

3. **Test Changes**
   - Test all affected endpoints
   - Verify UI behavior
   - Check for type errors
   - Run linter

4. **Document Changes**
   - Add code comments if complex
   - Update this CLAUDE.md if significant

### Debugging Issues

**API Errors:**
```bash
# Check server logs
npm run dev
# Look for console.error output

# Test API endpoint directly
curl -X GET http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json"
```

**Database Issues:**
```bash
# Open Prisma Studio to inspect data
npm run db:studio

# Check database connection
# Verify DATABASE_URL in .env

# Reset database (dev only!)
npm run db:reset
```

**TypeScript Errors:**
```bash
# Run type checker
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

**Build Errors:**
```bash
# Clean and rebuild
npm run clean
npm run build

# Check for missing dependencies
npm install
```

---

## Key Patterns & Best Practices

### 1. Safety-First Development

**Always consider:**
- User safety and content moderation
- Reputation scoring implications
- Privacy and data protection
- Authorization checks (role + ownership)

**Example:**
```typescript
// Check safety status before allowing content creation
if (session.user.reputationScore < 50) {
  return NextResponse.json({
    error: 'Account reputation too low to post content'
  }, { status: 403 })
}
```

### 2. Error Handling

**Pattern:**
```typescript
try {
  // Operation
  const result = await operation()
  return NextResponse.json(result)
} catch (error) {
  console.error('Context-specific error message:', error)
  return NextResponse.json(
    { error: 'User-friendly error message' },
    { status: 500 }
  )
}
```

### 3. Input Validation

**Always validate with Zod:**
```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(13).max(120)
})

const validated = schema.parse(data) // Throws if invalid
```

### 4. Responsive Data Fetching

**Use select for performance:**
```typescript
// ❌ Bad: Fetches all fields
const users = await prisma.user.findMany()

// ✅ Good: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
})
```

### 5. Component Organization

**Keep components focused:**
- Single responsibility
- Extract reusable logic to hooks
- Separate presentational and container components
- Use TypeScript for props

**Example:**
```typescript
// Hook for logic
function useWorkoutSession(sessionId: string) {
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession(sessionId).then(setSession).finally(() => setLoading(false))
  }, [sessionId])

  return { session, loading }
}

// Component for presentation
export function WorkoutSessionCard({ sessionId }: { sessionId: string }) {
  const { session, loading } = useWorkoutSession(sessionId)

  if (loading) return <Skeleton />
  if (!session) return <NotFound />

  return <Card>{/* Display session */}</Card>
}
```

### 6. Real-Time Features

**Socket.io Pattern:**
```typescript
// Client
import { io } from 'socket.io-client'

const socket = io()

socket.emit('join-room', { roomId: '123' })
socket.on('message', (data) => {
  // Handle message
})

// Server (/src/core/socket/server.ts)
io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId)
    io.to(roomId).emit('user-joined', { userId: socket.userId })
  })
})
```

### 7. AI Integration

**OpenAI Pattern:**
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a fitness coach...' },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.7,
  max_tokens: 1000
})

const suggestion = response.choices[0].message.content
```

### 8. Content Moderation

**Always moderate user content:**
```typescript
import { moderateText } from '@/services/moderation'

const moderationResult = await moderateText(userContent)

if (moderationResult.flagged) {
  // Log for review
  await prisma.moderationLog.create({
    data: {
      userId,
      content: userContent,
      reason: moderationResult.categories,
      action: 'FLAGGED'
    }
  })

  // Optionally block immediately
  return NextResponse.json({
    error: 'Content violates community guidelines'
  }, { status: 400 })
}
```

### 9. Payment Processing

**Mollie Integration:**
```typescript
import { createMollieClient } from '@mollie/api-client'

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY
})

const payment = await mollieClient.payments.create({
  amount: { value: '10.00', currency: 'EUR' },
  description: 'Premium Subscription',
  redirectUrl: `${process.env.NEXTAUTH_URL}/payments/success`,
  webhookUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
  metadata: { userId, subscriptionId }
})

// Redirect user to payment.getCheckoutUrl()
```

### 10. Email Sending

**Resend Pattern:**
```typescript
import { Resend } from 'resend'
import WelcomeEmail from '@/templates/email/WelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Massimino <noreply@massimino.com>',
  to: user.email,
  subject: 'Welcome to Massimino!',
  react: WelcomeEmail({ userName: user.name })
})
```

---

## Testing

### Current State

**Infrastructure Configured:**
- Jest + Testing Library for unit/component tests
- Playwright for E2E tests
- Coverage tracking enabled

**No Tests Written** - This is a technical debt opportunity

### Recommended Testing Strategy

**1. Unit Tests** (`*.test.ts`)
- Service layer functions
- Utility functions
- Custom hooks
- Validation schemas

**Example:**
```typescript
// /src/services/workout/__tests__/workout.test.ts
import { calculateVolume } from '../calculations'

describe('calculateVolume', () => {
  it('should calculate total volume correctly', () => {
    const volume = calculateVolume({ sets: 3, reps: 10, weight: 100 })
    expect(volume).toBe(3000)
  })
})
```

**2. Component Tests** (`*.test.tsx`)
- UI component rendering
- User interactions
- State changes

**Example:**
```typescript
// /src/components/workout/WorkoutCard.test.tsx
import { render, screen } from '@testing-library/react'
import { WorkoutCard } from './WorkoutCard'

describe('WorkoutCard', () => {
  it('should render workout details', () => {
    render(<WorkoutCard workout={mockWorkout} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })
})
```

**3. Integration Tests**
- API route handlers
- Database operations
- Service layer integration

**4. E2E Tests** (Playwright)
- Critical user flows
- Authentication flow
- Workout logging flow
- Payment flow

**Run Tests:**
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:e2e          # E2E tests
```

---

## Security

### Security Measures in Place

**1. Content Security Policy (CSP)**
- Defined in `next.config.js`
- Restricts script sources, frame sources, etc.
- Report-Only mode in development, enforced in production

**2. Security Headers**
- X-Frame-Options: DENY (prevents clickjacking)
- X-XSS-Protection: enabled
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**3. Authentication Security**
- bcrypt password hashing (10 rounds)
- Session-based auth (database sessions)
- 30-day session expiry
- HTTPS enforcement in production
- Same-domain redirect enforcement

**4. Authorization Checks**
- Role-based access control (CLIENT, TRAINER, ADMIN)
- Resource ownership verification
- Safety status checks (reputation, suspensions)
- Trainer verification for sensitive features

**5. Input Validation**
- Zod schemas for all API inputs
- Server-side validation (never trust client)
- SQL injection protection (Prisma parameterized queries)
- XSS protection (React escaping + CSP)

**6. Content Moderation**
- AI-powered text moderation (OpenAI)
- Manual review queue
- User reporting system
- Automated enforcement based on reputation

**7. Rate Limiting**
- Not currently implemented (opportunity for improvement)
- Consider adding for API routes

### Security Best Practices

**When Adding Features:**

1. **Always validate input**
   ```typescript
   const schema = z.object({ /* ... */ })
   const validated = schema.parse(data)
   ```

2. **Check authentication**
   ```typescript
   const session = await getServerSession(authOptions)
   if (!session) return unauthorized()
   ```

3. **Verify authorization**
   ```typescript
   if (resource.userId !== session.user.id) return forbidden()
   ```

4. **Sanitize user content**
   ```typescript
   const moderationResult = await moderateText(content)
   ```

5. **Use HTTPS in production**
   - Enforced via `next.config.js` redirects

6. **Never expose secrets**
   - Use environment variables
   - Never commit `.env` files
   - Use `.gitignore` properly

7. **Log security events**
   ```typescript
   await prisma.moderationLog.create({ /* ... */ })
   ```

### Common Security Pitfalls to Avoid

**❌ Don't:**
- Trust client-side validation alone
- Expose sensitive data in API responses
- Use string interpolation for database queries
- Store passwords in plain text
- Skip authorization checks
- Allow unrestricted file uploads
- Use `eval()` or `dangerouslySetInnerHTML` without sanitization

**✅ Do:**
- Validate on server-side
- Use `select` to limit data exposure
- Use Prisma for database access
- Hash passwords with bcrypt
- Check ownership and roles
- Validate file types and sizes
- Use React's built-in XSS protection

---

## Deployment

### Build Process

```bash
# 1. Clean previous builds
npm run clean

# 2. Generate Prisma client
npm run db:generate

# 3. Build Next.js application
npm run build

# 4. Run database migrations (production)
npm run db:migrate:prod

# 5. Start production server
npm start
# OR
NODE_ENV=production npm run start
```

### Environment Variables (Production)

**Required:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<strong-random-secret>
```

**Optional (but recommended):**
```bash
# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# Services
OPENAI_API_KEY=...
MOLLIE_API_KEY=...
RESEND_API_KEY=...

# Admin
ADMIN_EMAILS=admin@yourdomain.com
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] HTTPS enabled
- [ ] CSP headers enforced
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Rate limiting configured (if needed)
- [ ] Payment webhook URLs updated
- [ ] OAuth callback URLs updated
- [ ] Email sending configured
- [ ] Monitor logs for errors

### Deployment Targets

**Recommended Platforms:**
- **Vercel** (recommended for Next.js)
- **Railway** (good for database + app)
- **DigitalOcean App Platform**
- **AWS** (Elastic Beanstalk or ECS)
- **Google Cloud Run**

### Database Hosting

**Recommended:**
- **Vercel Postgres**
- **Railway PostgreSQL**
- **Supabase**
- **AWS RDS**
- **DigitalOcean Managed PostgreSQL**

---

## Troubleshooting

### Common Issues

**1. Prisma Client Not Generated**
```bash
Error: Cannot find module '@prisma/client'

# Solution:
npm run db:generate
```

**2. Database Connection Failed**
```bash
Error: Can't reach database server

# Check:
- DATABASE_URL in .env is correct
- Database server is running
- Network connectivity
- Firewall rules
```

**3. NextAuth Session Error**
```bash
Error: NextAuth session not found

# Check:
- NEXTAUTH_URL matches your application URL
- NEXTAUTH_SECRET is set
- Database sessions table exists
- Cookies are enabled in browser
```

**4. Type Errors After Schema Changes**
```bash
Type 'X' is not assignable to type 'Y'

# Solution:
npm run db:generate
npm run type-check
```

**5. Build Errors**
```bash
Error: Module not found

# Solution:
npm run clean
npm install
npm run build
```

**6. Socket.io Connection Issues**
```bash
WebSocket connection failed

# Check:
- Server is running
- CORS configuration
- Network connectivity
- Client version matches server version
```

**7. Payment Webhook Not Triggered**
```bash
Payment status not updating

# Check:
- Webhook URL is correct in Mollie dashboard
- Webhook endpoint is publicly accessible
- HTTPS is enabled
- Check server logs for errors
```

### Debug Commands

```bash
# View database schema
npx prisma db pull
npx prisma db push --preview-feature

# Check migrations
npx prisma migrate status

# Reset database (DEV ONLY!)
npm run db:reset

# View data in GUI
npm run db:studio

# Type check without building
npm run type-check

# Lint without fixing
npm run lint

# Format check without fixing
npm run format:check
```

### Getting Help

**Internal Documentation:**
- This file (CLAUDE.md)
- Code comments in `/src/core` and `/src/services`
- Prisma schema documentation

**External Resources:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

**Project Structure:**
- Service layer: `/src/services` - Business logic
- API routes: `/src/app/api` - REST endpoints
- Components: `/src/components` - UI components
- Database: `/prisma/schema.prisma` - Database schema

---

## Contributing Guidelines for AI Assistants

### When Making Changes

1. **Understand Before Modifying**
   - Read the relevant code first
   - Understand the business logic
   - Consider side effects

2. **Follow Conventions**
   - Use established patterns
   - Match existing code style
   - Follow naming conventions

3. **Test Your Changes**
   - Run `npm run type-check`
   - Run `npm run lint`
   - Test in browser
   - Verify database changes

4. **Document Significant Changes**
   - Add code comments if complex
   - Update this CLAUDE.md if architectural
   - Explain reasoning in commit messages

5. **Consider Safety First**
   - Add authorization checks
   - Validate inputs
   - Consider moderation needs
   - Protect user privacy

### Code Quality Standards

**Must Do:**
- ✅ Type all function parameters and returns
- ✅ Validate all inputs with Zod
- ✅ Check authentication and authorization
- ✅ Handle errors gracefully
- ✅ Use try-catch in API routes
- ✅ Log errors with context
- ✅ Use `select` to limit data transfer
- ✅ Follow established patterns

**Avoid:**
- ❌ Committing secrets or `.env` files
- ❌ Skipping authorization checks
- ❌ Trusting client-side validation
- ❌ Fetching unnecessary data
- ❌ Using `any` type excessively
- ❌ Creating inconsistent patterns
- ❌ Breaking existing functionality

### Git Workflow

```bash
# 1. Create descriptive branch
git checkout -b feature/workout-analytics

# 2. Make changes and commit frequently
git add .
git commit -m "feat: add workout volume analytics"

# 3. Push to remote
git push -u origin feature/workout-analytics

# 4. Create pull request (if applicable)
```

---

## Quick Reference

### Path Aliases
```typescript
@/                 -> /src
@/components       -> /src/components
@/services         -> /src/services
@/core             -> /src/core
@/lib              -> /src/lib
@/types            -> /src/types
@/hooks            -> /src/hooks
```

### Common Imports
```typescript
// Database
import { prisma } from '@/core/database/client'

// Auth
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'
import { useSession } from 'next-auth/react'

// Response
import { NextResponse } from 'next/server'

// Validation
import { z } from 'zod'

// UI Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

### Useful Scripts
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run type-check    # Check TypeScript
npm run lint          # Run linter
npm run db:studio     # Open database GUI
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
```

### Environment URLs
```bash
Development:  http://localhost:3000
API:          http://localhost:3000/api
Prisma Studio: http://localhost:5555
```

---

**Last Updated**: 2025-11-23
**Codebase Version**: Next.js 15, Prisma 6, React 18
**Database Models**: 130+
**API Endpoints**: 50+

For questions or clarifications, refer to the code comments in `/src/core` and `/src/services`, or examine existing patterns in similar features.
