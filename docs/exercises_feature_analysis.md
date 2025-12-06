# Exercises Feature Analysis & Integration Roadmap

> **Date**: December 2024
> **Purpose**: Analyze the exercises feature relationships and propose improvements prioritizing exercises with media

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Database Schema](#database-schema)
3. [API Routes](#api-routes)
4. [Frontend Components](#frontend-components)
5. [Current Relationships](#current-relationships)
6. [Media System Analysis](#media-system-analysis)
7. [Identified Gaps](#identified-gaps)
8. [Improvement Recommendations](#improvement-recommendations)

---

## Current Architecture

### File Structure

```
prisma/
└── schema.prisma                    # Core exercise models (lines 839-2609)

src/app/api/workout/
├── exercises/
│   ├── route.ts                     # GET/POST exercises
│   ├── priority/route.ts            # Exercises needing media
│   └── [id]/
│       ├── media/route.ts           # Exercise media CRUD
│       └── variations/route.ts      # Exercise variations
├── my_exercises/
│   ├── route.ts                     # User custom exercises
│   └── [id]/
│       ├── route.ts                 # Single exercise CRUD
│       └── media/route.ts           # User exercise media

src/app/
├── exercises/page.tsx               # Exercise discovery (1095 lines)
├── admin/exercises/page.tsx         # Admin management
└── admin/moderation/media_queue/    # Media approval workflow

src/core/database/
└── workout-queries.ts               # Database functions (lines 530-3011)
```

---

## Database Schema

### Core Models

#### `exercises` (Global Exercise Database)
```prisma
model exercises {
  id              String   @id @default(uuid())
  name            String   @unique
  slug            String   @unique
  category        String
  muscleGroups    String[]
  equipment       String[]
  instructions    String?
  videoUrl        String?              # Legacy single video
  imageUrl        String?              # Legacy single image
  difficulty      Difficulty @default(BEGINNER)
  safetyNotes     String?
  usageCount      Int      @default(0)  # Usage analytics
  lastUsed        DateTime?
  commonMistakes  String[]
  formCues        String[]
  isCustom        Boolean  @default(false)

  // New Taxonomy
  bodyPart        String?
  movementPattern String?
  type            String?
  tags            String[]
  curated         Boolean  @default(false)

  // Relations
  exercise_variations        exercise_variations[]
  personal_records           personal_records[]
  workout_log_entries        workout_log_entries[]
  workout_template_exercises workout_template_exercises[]
  user_exercises             user_exercises[]
  exercise_media             exercise_media[]
  program_workout_exercises  program_workout_exercises[]
  user_exercise_selections   user_exercise_selections[]
}
```

#### `exercise_media` (Media Attachments)
```prisma
model exercise_media {
  id               String   @id @default(uuid())
  url              String
  provider         String   // instagram | tiktok | youtube | upload | other
  title            String?
  description      String?
  thumbnailUrl     String?
  durationSec      Int?
  visibility       String   @default("private")  // private | public
  status           String   @default("pending")  // pending | approved | rejected
  featured         Boolean  @default(false)

  // Dual support: global OR user exercise
  globalExerciseId String?
  userExerciseId   String?

  exercises        exercises?      @relation(...)
  user_exercises   user_exercises? @relation(...)
  user             users           @relation(...)
  workout_entry_media workout_entry_media[]
}
```

#### `user_exercises` (Custom/Forked Exercises)
```prisma
model user_exercises {
  id              String   @id @default(uuid())
  userId          String
  name            String
  baseExerciseId  String?  // Link to global exercise if forked
  visibility      String   @default("private")
  isActive        Boolean  @default(true)

  exercises       exercises?       @relation(...)
  exercise_media  exercise_media[]
}
```

#### `exercise_slots` (Program Template Flexibility)
```prisma
model exercise_slots {
  id                   String   @id @default(uuid())
  slotLabel            String   // e.g., "Horizontal Push (Compound)"
  exerciseType         ExerciseSlotType
  muscleTargets        String[]
  equipmentOptions     String[]
  suggestedExerciseIds String[] // Array of exercise IDs

  user_exercise_selections  user_exercise_selections[]
  program_workout_exercises program_workout_exercises[]
}
```

---

## API Routes

### Exercise Discovery

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/workout/exercises` | GET | List/search exercises | Public |
| `/api/workout/exercises` | POST | Create exercise | TRAINER/ADMIN |
| `/api/workout/exercises?include=cover,mediaCount` | GET | Include media stats | Public |
| `/api/workout/exercises/priority` | GET | Exercises needing media | Public |

### Exercise Media

| Route                                  | Method   | Purpose               | Auth     |
|----------------------------------------|----------|-----------------------|----------|
| `/api/workout/exercises/[id]/media`    | GET      | List exercise media   | Public   |
| `/api/workout/exercises/[id]/media`    | POST     | Add media to exercise | Required |
| `/api/workout/my_exercises/[id]/media` | GET/POST | User exercise media   | Owner    |

### User Custom Exercises

| Route                            | Method         | Purpose                | Auth     |
|----------------------------------|----------------|------------------------|----------|
| `/api/workout/my_exercises`      | GET            | List user's exercises  | Required |
| `/api/workout/my_exercises`      | POST           | Create custom exercise | Required |
| `/api/workout/my_exercises/[id]` | GET/PUT/DELETE | Single exercise CRUD   | Owner    |

### Training Integration

| Route                                             | Method | Purpose                     | Auth    |
|---------------------------------------------------|--------|-----------------------------|---------|
| `/api/training/sessions/[id]/exercises`           | POST   | Add exercise to session     | TRAINER |
| `/api/training/sessions/[id]/recommend-exercises` | POST   | AI exercise recommendations | TRAINER |

---

## Frontend Components

### Exercise Discovery Page (`/exercises/page.tsx`)

**Features**:
- Two tabs: "All Exercises" | "My Exercise Library"
- 11 different filters including media status
- Media-aware sorting (exercises with media shown first)
- XP gamification for media contributions
- Deep linking support (`?exerciseId=XXX&openMedia=1`)

**Media Integration**:
```typescript
// Sort by media count (line 295-300)
const sortedExercises = exercises.sort((a, b) => {
  const aMedia = a.mediaCount || 0;
  const bMedia = b.mediaCount || 0;
  if (aMedia !== bMedia) return bMedia - aMedia;
  return a.name.localeCompare(b.name);
});
```

**XP System**:
```typescript
// XP incentive (lines 688-694)
const getXpAvailable = (mediaCount: number) => {
  if (mediaCount === 0) return 50;
  if (mediaCount < 3) return 25;
  return 0;
};
```

### Admin Components

- **`/admin/exercises`**: Full exercise management with advanced filters
- **`/admin/moderation/media_queue`**: Media approval workflow (pending/approved/rejected)

---

## Current Relationships

### Exercise → Workout Logging
```
exercises
  └── workout_log_entries (one set = one entry)
      ├── user (who logged)
      ├── coach (who assigned)
      └── workout_entry_media
          └── exercise_media (attached videos/images)
```

### Exercise → Programs
```
exercises
  ├── program_workout_exercises (fixed exercises)
  ├── exercise_slots
  │   └── user_exercise_selections (user's choice for slot)
  └── workout_template_exercises (templates)
```

### Exercise → Media
```
exercises (global)
  └── exercise_media
      ├── user (who uploaded)
      ├── status (pending/approved/rejected)
      └── workout_entry_media (attached to sets)

user_exercises (custom)
  └── exercise_media (user's own media)
```

### Exercise → Recommendations
```
assessments (user fitness data)
  → recommend-exercises API
    → filters by:
       - primaryGoal → category mapping
       - limitations (excluded exercises)
       - experienceYears → difficulty level
```

---

## Media System Analysis

### Current Implementation

1. **Priority Algorithm** (`/api/workout/exercises/priority`):
   ```typescript
   // Scoring for exercises needing media
   score = usageCount * 2
         + difficultyBonus (BEGINNER: 10, INTERMEDIATE: 5, ADVANCED: 0)
         + recencyBonus (created < 90 days: 5)
   ```

2. **Cover Image Selection** (`exercises/route.ts`):
   - Prefers 'exercisedb' provider
   - Falls back to most recent approved media
   - Returns as `coverUrl` in API response

3. **Media Status Flow**:
   ```
   User submits → status: 'pending'
                     ↓
   Admin reviews → status: 'approved' or 'rejected'
                     ↓
   If approved → visibility: 'public' (shown to all)
   ```

### What's Working Well

- Dual-support for global and user exercises
- Moderation workflow with pending/approved/rejected states
- XP gamification encourages contributions
- Priority endpoint identifies high-impact exercises needing media
- Media count displayed on exercise cards

---

## Identified Gaps

### Gap 1: Media NOT Integrated Into Key Features

| Feature                  | Current State              | Impact                                       |
|--------------------------|----------------------------|----------------------------------------------|
| Program templates        | No cover images            | Users can't preview exercises visually       |
| Workout templates        | No media display           | Same as above                                |
| Exercise recommendations | Ignores media availability | Recommends exercises without form references |
| Workout log entries      | Media hidden               | Users don't see helpful videos while logging |
| Team workouts            | No media                   | Trainers can't show form references          |

### Gap 2: Search/Discovery Limitations

- No API parameter to filter by media availability
- Can't sort by media quality/count in API queries
- Media filter only works on `/exercises` page, not embedded components
- Recommendation engine doesn't consider media as a factor

### Gap 3: User Experience Issues

- Users can't see their media submission status
- No feedback mechanism for rejected media
- No way to track personal media contributions
- No notification when media is approved

### Gap 4: Analytics Gaps

- No tracking of media views or engagement
- No correlation data: "Do exercises with media get used more?"
- Can't measure media contribution ROI

---

## Improvement Recommendations

### Priority 1: Enhance Exercise API with Media Stats

**Current**:
```typescript
GET /api/workout/exercises?include=cover,mediaCount
```

**Proposed**:
```typescript
GET /api/workout/exercises?includeMedia=full

// Response enhancement
{
  id: "...",
  name: "Bench Press",
  mediaStats: {
    totalCount: 5,
    videoCount: 3,
    imageCount: 2,
    hasApprovedVideo: true,
    coverUrl: "...",
    providers: ["youtube", "instagram"]
  },
  mediaCoverageScore: 0.85  // 0-1 completeness metric
}
```

**Implementation**:
- Add `hasMedia` boolean column to exercises table (indexed)
- Add `mediaCoverageScore` computed column
- Update `getExercises()` to include stats when requested

### Priority 2: Media-Aware Sorting Options

**API Enhancement**:
```typescript
GET /api/workout/exercises?sort=mediaCount:desc
GET /api/workout/exercises?sort=mediaCoverage:desc
GET /api/workout/exercises?hasMedia=true  // Filter
```

**Database Index**:
```sql
CREATE INDEX idx_exercises_media ON exercises(isActive, hasMedia, mediaCount);
```

### Priority 3: Integrate Media into Program Display

**When displaying program exercises**:
1. Fetch exercise data with `include=cover,mediaCount`
2. Show cover image on exercise card
3. Display media count badge
4. Link to exercise detail modal with media gallery

**Component Enhancement** (`program_workout_card.tsx`):
```tsx
<ExerciseCard
  exercise={exercise}
  showCover={true}
  showMediaCount={true}
  onMediaClick={() => openMediaGallery(exercise.id)}
/>
```

### Priority 4: Media-Aware Recommendations

**Update recommendation algorithm**:
```typescript
// In recommend-exercises API
const scoreExercise = (exercise) => {
  let score = baseScore;

  // Boost exercises with media (2x weight)
  if (exercise.hasApprovedVideo) score *= 1.5;
  if (exercise.mediaCount >= 3) score *= 1.2;

  return score;
};
```

**UI Enhancement**:
```tsx
<RecommendedExercise>
  {exercise.hasApprovedVideo && (
    <Badge variant="success">Form Video Available</Badge>
  )}
</RecommendedExercise>
```

### Priority 5: User Media Contribution Tracking

**New API Endpoints**:
```typescript
GET /api/workout/my-media-contributions
// Returns: { pending: 2, approved: 15, rejected: 1, totalXpEarned: 750 }

GET /api/workout/my-media-contributions/[id]/status
// Returns submission status with rejection reason if applicable
```

**User Dashboard Widget**:
```tsx
<MediaContributorCard>
  <Stat label="Approved Media" value={15} />
  <Stat label="XP Earned" value={750} />
  <Stat label="Pending Review" value={2} />
  <Link href="/exercises?myContributions=true">View All</Link>
</MediaContributorCard>
```

### Priority 6: Database Schema Enhancements

**Add to `exercises` table**:
```sql
ALTER TABLE exercises ADD COLUMN hasMedia BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN mediaCount INT DEFAULT 0;
ALTER TABLE exercises ADD COLUMN mediaCoverageScore FLOAT DEFAULT 0;
ALTER TABLE exercises ADD COLUMN lastMediaAddedAt TIMESTAMP;

CREATE INDEX idx_exercises_media_coverage ON exercises(isActive, hasMedia, mediaCoverageScore);
```

**Add to `exercise_media` table**:
```sql
ALTER TABLE exercise_media ADD COLUMN viewCount INT DEFAULT 0;
ALTER TABLE exercise_media ADD COLUMN attachmentCount INT DEFAULT 0;
ALTER TABLE exercise_media ADD COLUMN mediaType ENUM('video', 'image', 'gif') DEFAULT 'video';
ALTER TABLE exercise_media ADD COLUMN rejectionReason TEXT;
```

**Trigger to update exercise stats**:
```sql
CREATE OR REPLACE FUNCTION update_exercise_media_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE exercises SET
    mediaCount = (SELECT COUNT(*) FROM exercise_media WHERE globalExerciseId = NEW.globalExerciseId AND status = 'approved'),
    hasMedia = (SELECT COUNT(*) > 0 FROM exercise_media WHERE globalExerciseId = NEW.globalExerciseId AND status = 'approved'),
    lastMediaAddedAt = NOW()
  WHERE id = NEW.globalExerciseId;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Priority 7: Workout Logging Media Integration

**During workout logging**:
1. Show exercise cover image in log entry form
2. Add "Watch Form Video" button if media exists
3. Allow users to attach their own form check videos
4. Display coach feedback alongside official form references

**Component Enhancement**:
```tsx
<WorkoutLogEntry exercise={exercise}>
  {exercise.hasApprovedVideo && (
    <Button variant="ghost" onClick={() => playFormVideo(exercise)}>
      <PlayCircle className="h-4 w-4 mr-2" />
      Form Guide
    </Button>
  )}
</WorkoutLogEntry>
```

---

## Implementation Roadmap

### Phase 1: Foundation (Low Effort, High Impact)
1. Add `hasMedia`, `mediaCount` columns to exercises table
2. Create database trigger to maintain counts
3. Update `/api/workout/exercises` to include media stats by default
4. Add media filter parameter to API

### Phase 2: Discovery Enhancement
1. Implement media-aware sorting in API
2. Update exercise cards to show media indicators
3. Add "With Video" filter to embedded exercise selectors
4. Surface priority endpoint results to contributor dashboard

### Phase 3: Program Integration
1. Display exercise covers in program templates
2. Show media counts on program exercise lists
3. Add "Form Guide" links in workout logging
4. Integrate media into team workout displays

### Phase 4: Recommendation Intelligence
1. Update recommendation algorithm to prefer exercises with media
2. Add "Form Reference Available" badges to recommendations
3. Track correlation between media and exercise adoption
4. A/B test media-first vs. standard recommendations

### Phase 5: Analytics & Gamification
1. Track media view counts
2. Add media engagement analytics dashboard
3. Implement contributor leaderboards
4. Create "Media Documentarian" achievement badges

---

## Key Metrics to Track

| Metric                       | Current | Target          | How to Measure                                        |
|------------------------------|---------|-----------------|-------------------------------------------------------|
| Exercises with media         | Unknown | 80%             | `SELECT COUNT(*) WHERE hasMedia = true`               |
| Avg media per exercise       | Unknown | 3+              | `SELECT AVG(mediaCount)`                              |
| Media contribution rate      | Unknown | +20%/month      | Monthly new `exercise_media` count                    |
| Exercise adoption with media | Unknown | +30% vs without | Compare `usageCount` for exercises with/without media |

---

## Conclusion

The exercises feature has a solid foundation with a well-designed media system. The main opportunity is **surfacing media throughout the application** rather than limiting it to the `/exercises` page. By prioritizing exercises with media in recommendations, programs, and workout logging, we can significantly improve user experience and form safety while incentivizing community media contributions.

The XP gamification system is already in place - we just need to close the loop by showing users where their contributions appear and tracking the impact of media on exercise adoption.
