# Massimino API Connections Analysis

*Analysis Date: January 9, 2026*
*Last Updated: January 9, 2026*

---

## Executive Summary

The Massimino fitness app is a sophisticated Next.js application with **100+ API routes**, multiple external service integrations, and complex database interactions. Total API route code: **25,212 lines**. The app integrates with payment processing, AI services, social media, Firebase, and Supabase.

### Overall Health: Good

| Category | Status | Notes |
|----------|--------|-------|
| Functionality | Working | Core features operational |
| Security | Improved | Rate limiting implemented, webhook verification pending migration to Stripe |
| Performance | Improved | Profile caching implemented, vector search optimization pending |
| Error Handling | Good | Graceful degradation implemented |

### Recent Fixes (January 9, 2026)

| Issue | Status | Details |
|-------|--------|---------|
| OpenAI deprecated model | FIXED | Updated to `gpt-4o` |
| Health metric validation | FIXED | Range validation added |
| Rate limiting | FIXED | In-memory rate limiter implemented |
| Profile caching | FIXED | Stale-while-revalidate pattern added |
| Mollie webhook verification | PENDING | Migration to Stripe under consideration |

---

## 1. External API Integrations

### 1.1 OpenAI Integration (4 Services)

**Files:**
- `src/services/ai/workout-suggestions.ts` (Lines 1-117)
- `src/services/ai/form-analysis.ts` (Lines 1-150)
- `src/services/ai/massichat_service.ts` (Lines 1-200+)
- `src/services/moderation/openai.ts` (Lines 1-100)

**APIs Used:**

| Model | Purpose | Status |
|-------|---------|--------|
| `gpt-3.5-turbo` | Workout suggestions | Working |
| `gpt-4o` | Form analysis | Working (UPDATED Jan 9, 2026) |
| `gpt-4o-mini` | Massichat AI coach | Working |
| `text-moderation-latest` | Content moderation | Working |
| `text-embedding-3-small` | Vector search | Working |

**What Works:**
- AI workout suggestions generate properly
- Form analysis processes images correctly
- Massichat responds with context-aware fitness advice
- Content moderation flags inappropriate content

**Issues Found:**

1. ~~**Deprecated Vision Model** (`form-analysis.ts:141`)~~ **FIXED**
   - ~~Uses `gpt-4-vision-preview` instead of newer model~~
   - **Resolution:** Updated to `gpt-4o` on January 9, 2026

2. **No Video Analysis** (`form-analysis.ts:130-134`)
   - Form analysis only supports images, not video
   - **Status:** Known limitation, documented

3. **Fallback Behavior** (`workout-suggestions.ts:114-116`)
   - Falls back to rule-based suggestions if AI fails
   - **Status:** Good - graceful degradation

**Configuration Required:**
```env
OPENAI_API_KEY          # Required
OPENAI_ORG_ID           # Optional
OPENAI_PROJECT          # Optional
MODERATION_THRESHOLD    # Default: 0.7
```

---

### 1.2 Mollie Payment Integration (Migration to Stripe Planned)

> **Note:** Migration to Stripe is under consideration. The webhook signature verification issue will be addressed as part of the Stripe migration rather than fixing the Mollie implementation.

**Files:**
- `src/core/integrations/mollie.ts` (Lines 1-397)
- `src/app/api/payments/webhook/route.ts` (Lines 1-174)
- `src/app/api/payments/route.ts` (Lines 1-206)

**APIs Used:**
- `client.payments.create()` - One-time payments
- `client.payments.get()` - Payment status
- `client.customers.create()` - Customer for subscriptions
- `client.customerSubscriptions.create()` - Recurring payments

**What Works:**
- Payment creation flows correctly
- Webhook receives status updates
- Trainer/platform 85/15 split calculates properly
- Multiple payment types (session, package, tip)

**Known Issues (Deferred - Stripe Migration Planned):**

1. **Webhook Signature Verification Missing** (`mollie.ts:256-263`)
   - **Status:** DEFERRED - Will be properly implemented with Stripe migration
   - Current placeholder returns `true` always
   - Stripe has better webhook signature verification out of the box

2. **Hardcoded Split Fallback** (`payments/webhook/route.ts:72-79`)
   - Falls back to 85/15 if metadata corrupted
   - **Recommendation:** Address during Stripe migration

**Configuration Required:**
```env
MOLLIE_API_KEY          # Required (until Stripe migration)
NEXTAUTH_URL            # For webhook URL generation
```

---

### 1.3 Firebase Integration (Optional)

**File:** `src/core/integrations/firebase.ts` (Lines 1-180)

**What Works:**
- User profile publishing to Firestore
- Exercise database sync
- Graceful degradation when not configured

**Status:** Optional feature - app works without it

**Configuration Required:**
```env
FIREBASE_PROJECT_ID      # Optional
FIREBASE_CLIENT_EMAIL    # Optional
FIREBASE_PRIVATE_KEY     # Optional
```

---

### 1.4 Social Media Integrations

**File:** `src/core/integrations/social_media.ts` (Lines 1-390)

**Platforms:**

| Platform | Status | Limitation |
|----------|--------|------------|
| Instagram | Working | Image/video |
| TikTok | Working | Video only |
| YouTube | Working | Video only |
| Facebook | Working | Image/video |

**What Works:**
- OAuth flows for all platforms
- Media upload and posting
- Token refresh handling

**Issues Found:**

1. **TikTok Video Only** (`social_media.ts:240-241`)
   - Cannot share images to TikTok
   - **Status:** Platform limitation, documented

**Configuration Required:**
```env
INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET
TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
```

---

## 2. Supabase Integration

**File:** `src/lib/supabase.ts` (Lines 1-91)

**Service:** Media storage for exercise demonstrations

**What Works:**
- Image upload (JPG, PNG, GIF, WebP) up to 10MB
- Video upload (MP4, MOV, WebM, AVI) up to 50MB
- Public URL generation

**Configuration Required:**
```env
NEXT_PUBLIC_SUPABASE_URL          # Required
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Required
SUPABASE_SERVICE_ROLE_KEY         # Required for server operations
```

---

## 3. API Routes Summary

### 3.1 By Category

| Category | Routes | Status | Notes |
|----------|--------|--------|-------|
| Workout Management | 40+ | Working | Core functionality |
| Coaching | 15+ | Working | Coach-athlete relationships |
| Payments | 2 | Pending Migration | Stripe migration planned |
| Health Data | 2 | Working | Range validation added (FIXED) |
| AI/Chat | 10 | Working | Using gpt-4o (FIXED) |
| Profile | 5+ | Working | Caching implemented (FIXED) |
| Teams | 7+ | Working | |
| Challenges | 6+ | Working | |
| Social | 3 | Working | |
| Misc | 10+ | Working | |

### 3.2 Key Route Details

**Workout Routes** (`src/app/api/workout/`)
- `entries` - GET/POST workout log entries
- `sessions` - Training session templates
- `exercises` - Exercise library access
- `programs` - Workout program management
- `records` - Personal records

**Coaching Routes** (`src/app/api/coaching/`)
- `athletes` - Manage coaching relationships
- `requests` - Coaching requests
- `invitations/[token]` - Coach invitations
- `messages` - Coach-athlete messaging

**Payment Routes** (`src/app/api/payments/`)
- `route.ts` - Create payments, get analytics
- `webhook/route.ts` - Mollie webhook handler

**AI Routes** (`src/app/api/massichat/`)
- POST - Send message to AI coach
- GET - List chat sessions
- PATCH - Update session title
- DELETE - Delete session

---

## 4. Database (Prisma/PostgreSQL)

**Key Tables:**
- `users` - User accounts with roles
- `workout_log_entries` - Individual workout records
- `workout_sessions` - Training templates
- `exercises` - Exercise library
- `assessments` - Fitness assessments
- `trainer_clients` - Coach-client relationships
- `health_data` - Synced health metrics
- `ai_chat_sessions` - Chat conversation history
- `trainer_points` - Gamification points

**What Works:**
- All CRUD operations
- Relationship management
- Transaction handling

**Issues Found:**

1. **Open Sessions** (`workout/entries/route.ts:251-276`)
   - Sessions can be created without userId
   - **Status:** Design decision for coach workflow

---

## 5. Security Analysis

### What Works

1. **Authentication** - NextAuth with multiple providers
2. **Role-based access** - CLIENT, TRAINER, ADMIN roles
3. **Input validation** - Zod schemas throughout
4. **API key protection** - Secret redaction in error messages
5. **Profile privacy** - Visibility controls implemented
6. **Rate limiting** - In-memory rate limiter implemented (NEW - Jan 9, 2026)

### Security Status

| Issue | Location | Severity | Status |
|-------|----------|----------|--------|
| Webhook signature verification | `mollie.ts:256-263` | MEDIUM | Deferred (Stripe migration) |
| Rate limiting | Key endpoints | HIGH | IMPLEMENTED |
| CSRF protection | POST endpoints | MEDIUM | Partial (NextAuth handles auth routes) |

### Rate Limiting Implementation

**File:** `src/lib/rate-limit.ts`

Rate limiting has been implemented with the following presets:

```typescript
const RATE_LIMITS = {
  standard: { maxRequests: 100, windowMs: 60000 },  // General API
  auth:     { maxRequests: 10,  windowMs: 60000 },  // Login/register
  ai:       { maxRequests: 20,  windowMs: 60000 },  // OpenAI calls
  upload:   { maxRequests: 10,  windowMs: 60000 },  // File uploads
  health:   { maxRequests: 30,  windowMs: 60000 },  // Health sync
};
```

**Applied to:**
- `/api/health/sync` - 30 requests/minute
- `/api/workout/form-analysis` - 20 requests/minute (AI)

**Response Headers:**
- `X-RateLimit-Limit` - Max requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Window reset timestamp

### Remaining Security Recommendations

1. **Stripe Migration** (Planned)
   - Will include proper webhook signature verification
   - Better fraud protection out of the box

2. **Add CSRF Tokens**
   - Consider implementing for non-auth POST endpoints
   - Use `csrf` package or custom implementation

---

## 6. Performance Issues

### Status

| Issue | Location | Impact | Status |
|-------|----------|--------|--------|
| No profile caching | `useUserProfile.ts` | High API load | FIXED - Stale-while-revalidate |
| Vector search in memory | `vector_search.ts:45-48` | Slow on large datasets | Pending - Use pgvector |
| Local knowledge base | `vector_search.ts:60-78` | Slow first requests | Pending - Pre-process on startup |

### Profile Caching Implementation

**File:** `src/hooks/useUserProfile.ts`

Implemented stale-while-revalidate caching pattern:

```typescript
// 1-minute cache TTL
const CACHE_TTL = 60000;

// Features:
// - Returns cached data immediately if valid
// - Shows stale data while fetching fresh data in background
// - Prevents duplicate concurrent fetches
// - Cache invalidation on profile updates
// - Force refresh capability
```

**API:**
- `profile` - Current profile data
- `refreshProfile()` - Force refresh (bypasses cache)
- `invalidateCache()` - Clear cache (call after profile updates)

### Remaining Performance Recommendations

1. **Optimize Vector Search**
   - Use PostgreSQL with pgvector extension
   - Index embeddings for similarity search
   - Filter at database level, not in memory

2. **Add Response Caching**
   - Cache exercise library responses
   - Cache program templates
   - Use Vercel Edge Cache or Redis

---

## 7. Bug Fixes Status

### Completed Fixes (January 9, 2026)

1. ~~**Health Metric Validation**~~ **FIXED**
   - File: `src/app/api/health/sync/route.ts`
   - Added range validation with Zod refinement
   ```typescript
   const METRIC_RANGES = {
     STEPS: { min: 0, max: 200000 },
     HEART_RATE: { min: 20, max: 250 },
     CALORIES_BURNED: { min: 0, max: 20000 },
     DISTANCE: { min: 0, max: 500 },
     SLEEP: { min: 0, max: 24 },
     WEIGHT: { min: 20, max: 700 },
     BODY_FAT: { min: 1, max: 70 },
     BLOOD_PRESSURE: { min: 40, max: 300 },
   };
   ```

2. ~~**Upgrade OpenAI Vision Model**~~ **FIXED**
   - File: `src/services/ai/form-analysis.ts:141`
   - Changed: `gpt-4-vision-preview` → `gpt-4o`

3. ~~**Profile Cache Strategy**~~ **FIXED**
   - File: `src/hooks/useUserProfile.ts`
   - Implemented stale-while-revalidate caching with 1-minute TTL

4. ~~**Rate Limiting**~~ **FIXED**
   - New file: `src/lib/rate-limit.ts`
   - Applied to health sync and AI endpoints

### Deferred (Stripe Migration Planned)

5. **Mollie Webhook Signature**
   - File: `src/core/integrations/mollie.ts:256-263`
   - Status: Will be addressed during Stripe migration

6. **Payment Split Configuration**
   - File: `src/app/api/payments/webhook/route.ts:72-79`
   - Issue: Hardcoded 85/15 fallback
   - Status: Will be addressed during Stripe migration

---

## 8. Monitoring Recommendations

### Add Logging

```typescript
// Add structured logging for all API calls
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    // ... handler logic
    logger.info('api.payment.create', {
      duration: Date.now() - startTime,
      userId: session.user.id,
      amount: payment.amount,
    });
  } catch (error) {
    logger.error('api.payment.create.error', {
      error: error.message,
      userId: session?.user?.id,
    });
  }
}
```

### Monitor External Services

| Service | Metrics to Track |
|---------|------------------|
| OpenAI | Token usage, costs, latency |
| Mollie | Webhook success rate, payment conversions |
| Supabase | Storage usage, request counts |

---

## 9. Configuration Summary

### Required Environment Variables

```env
# Database
DATABASE_URL

# Authentication
NEXTAUTH_SECRET
NEXTAUTH_URL

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# OpenAI
OPENAI_API_KEY

# Payments
MOLLIE_API_KEY
```

### Optional Environment Variables

```env
# OpenAI (optional)
OPENAI_ORG_ID
OPENAI_PROJECT
MODERATION_THRESHOLD

# Firebase (optional)
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

# Social Media (optional)
INSTAGRAM_CLIENT_ID
INSTAGRAM_CLIENT_SECRET
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
```

---

## 10. Action Items

### Completed (January 9, 2026)

- [x] Add health metric range validation
- [x] Upgrade OpenAI vision model (`gpt-4-vision-preview` → `gpt-4o`)
- [x] Add rate limiting middleware
- [x] Implement profile caching

### Short Term (This Month)

- [ ] Migrate payment processing to Stripe (includes webhook verification)
- [ ] Add CSRF protection to non-auth POST endpoints
- [ ] Apply rate limiting to additional endpoints
- [ ] Store payment split rates in database (part of Stripe migration)

### Long Term

- [ ] Migrate vector search to pgvector
- [ ] Add structured logging throughout
- [ ] Implement monitoring dashboards
- [ ] Add integration tests for external APIs
- [ ] Consider Redis for distributed rate limiting

---

## Appendix: Route Map

```
/api
├── auth/[...nextauth]     # Authentication
├── ai/
│   └── workout-suggestions
├── assessments
├── challenges/
│   └── [id]/
│       ├── leaderboard
│       └── participants
├── coaching/
│   ├── athletes
│   ├── invitations/[token]
│   ├── messages
│   ├── requests
│   ├── sessions/create
│   └── teams/assign
├── dashboard/stats
├── email/test
├── feedback
├── health/
│   ├── metrics
│   └── sync
├── leaderboards/
│   ├── privacy
│   └── stats
├── massichat
├── massitree
├── notifications
├── partnerships
├── payments/
│   └── webhook
├── profile/
│   ├── background
│   ├── credentials
│   └── stats
├── social/
│   ├── auth/[platform]
│   └── share
├── teams/
│   └── [id]/
│       ├── members
│       └── media
├── upload/
│   └── exercise-media
├── wearables/workout-sessions
└── workout/
    ├── ai
    ├── entries
    ├── exercises
    ├── form-analysis
    ├── habits
    ├── marketplace
    ├── programs
    ├── records
    └── sessions
```
