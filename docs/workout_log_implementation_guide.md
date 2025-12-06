# Workout Logs Feature: Complete Implementation Guide

## Purpose

This document provides a comprehensive analysis of the workout logs feature in Massimino. It is designed to guide safe UX/UI improvements based on the mockup at `mockups/program_page_mockup.html` without corrupting existing functionality.

**IMPORTANT**: This document must be read thoroughly before making ANY changes to the workout logs feature. The previous implementation attempt failed catastrophically due to insufficient understanding of the system architecture.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [Component Hierarchy](#component-hierarchy)
6. [Data Flow](#data-flow)
7. [Type Definitions](#type-definitions)
8. [Mockup Analysis](#mockup-analysis)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Critical Do's and Don'ts](#critical-dos-and-donts)
11. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)

---

## Architecture Overview

The workout logs feature is built using:
- **Next.js 14** with App Router (`src/app/`)
- **React** with Client Components (`'use client'`)
- **Prisma** ORM connecting to PostgreSQL
- **NextAuth** for authentication
- **TypeScript** throughout
- **Tailwind CSS** + shadcn/ui components

### Key Principle
The feature uses a **client-side fetching pattern**:
- Pages are `'use client'` components
- Data is fetched via `fetch()` calls to API routes
- State is managed with React hooks (`useState`, `useEffect`)

---

## File Structure

### Pages (App Router)

```
src/app/workout-log/
├── page.tsx                          # Main workout log page (~1200 lines)
├── page.tsx.backup                   # Backup of original
├── athletes/
│   ├── page.tsx                      # Athletes gallery page
│   └── [slug]/page.tsx               # Individual athlete page
└── programs/
    └── [id]/
        ├── page.tsx                  # Program detail page
        └── join/page.tsx             # Join program flow
```

### Components

```
src/components/workout-log/
├── WorkoutLogTable.tsx               # Session history, calendar, comments
├── body_metrics_tab.tsx              # Body measurements tracking
├── collapsible_section.tsx           # Collapsible UI sections
├── habits_tab.tsx                    # Habit tracking
├── progress_tab.tsx                  # Progress visualization
├── programs_tab.tsx                  # Program browser (~430 lines)
├── rest_timer_bar.tsx                # Rest timer UI
├── workout_card.tsx                  # Individual workout entry card
├── workout_details_modal.tsx         # Workout details popup
└── workout_summary_table.tsx         # Summary table view

src/components/programs/
├── index.ts                          # Barrel export
├── my_programs.tsx                   # User's subscribed programs
├── program_goals.tsx                 # Program goals display
├── program_hero.tsx                  # Hero section with gradient/image
├── program_schedule.tsx              # Weekly schedule display
├── program_sidebar.tsx               # Sidebar with metadata
└── share_bar.tsx                     # Social sharing bar
```

### Types

```
src/types/
├── workout.ts                        # WorkoutLogEntry, Exercise, Session types
└── program.ts                        # ProgramTemplate, ProgramSubscription types
```

---

## Database Schema

### Core Tables for Workout Logs

#### `workout_log_entries` (Main Entry Table)
```prisma
model workout_log_entries {
  id                String              @id
  userId            String
  coachId           String?
  sessionId         String?
  date              DateTime            @db.Date
  exerciseId        String
  order             String
  setNumber         Int
  setType           SetType             # STRAIGHT, SUPERSET, PYRAMID, etc.
  reps              Int
  weight            String              # Can contain multiple values
  unit              WeightUnit          # KG or LB
  intensity         String?
  intensityType     IntensityType?
  tempo             String?
  restSeconds       Int?
  trainingVolume    Float?
  duration          String?
  coachFeedback     String?
  userComments      String?
  personalRecord    Boolean             @default(false)
  volumeRecord      Boolean             @default(false)
  isWarmup          Boolean             @default(false)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime

  # Relations
  users             users               @relation(fields: [userId], references: [id])
  exercises         exercises           @relation(fields: [exerciseId], references: [id])
  workout_sessions  workout_sessions?   @relation(fields: [sessionId], references: [id])
}
```

#### `workout_sessions` (Session Container)
```prisma
model workout_sessions {
  id                String              @id
  userId            String?
  coachId           String?
  date              DateTime            @db.Date
  startTime         DateTime
  endTime           DateTime?
  duration          Int?
  title             String?
  notes             String?
  location          String?
  totalVolume       Float?
  totalSets         Int                 @default(0)
  totalReps         Int                 @default(0)
  isComplete        Boolean             @default(false)
  isTemplate        Boolean             @default(false)
  status            String              @default("ACTIVE")
  isCurrentlyActive Boolean             @default(false)

  # Relations
  workout_log_entries  workout_log_entries[]
}
```

#### `exercises` (Exercise Library)
```prisma
model exercises {
  id             String    @id
  name           String
  category       String
  muscleGroups   String[]
  equipment      String[]
  instructions   String?
  videoUrl       String?
  imageUrl       String?
  isActive       Boolean   @default(true)
  difficulty     String    @default("BEGINNER")
  usageCount     Int       @default(0)
}
```

### Program-Related Tables

#### `program_templates`
```prisma
model program_templates {
  id                  String    @id
  name                String
  description         String?
  createdBy           String
  duration            String
  difficulty          String    @default("BEGINNER")
  category            String?
  isPublic            Boolean   @default(false)
  programType         ProgramType?
  templateData        Json?     # Full program JSON

  # Relations
  program_subscriptions  program_subscriptions[]
  program_phases         program_phases[]
}
```

#### `program_subscriptions`
```prisma
model program_subscriptions {
  id                  String    @id
  userId              String?
  programId           String
  currentWeek         Int       @default(1)
  currentDay          Int       @default(1)
  startDate           DateTime  @default(now())
  isActive            Boolean   @default(true)
  workoutsCompleted   Int       @default(0)

  # Relations
  program_templates   program_templates @relation(fields: [programId], references: [id])
}
```

---

## API Routes

### Workout Entry Routes

| Route                              | Method         | Purpose                      |
|------------------------------------|----------------|------------------------------|
| `/api/workout/entries`             | GET            | Fetch user's workout entries |
| `/api/workout/entries`             | POST           | Create new workout entries   |
| `/api/workout/entries/[id]`        | GET/PUT/DELETE | Single entry CRUD            |
| `/api/workout/exercises`           | GET            | Fetch exercise library       |
| `/api/workout/my_exercises`        | GET/POST       | User's custom exercises      |
| `/api/workout/sessions`            | GET/POST       | Workout session management   |
| `/api/workout/sessions/[id]/status`| PUT            | Update session status        |

### Program Routes

| Route                             | Method   | Purpose                      |
|-----------------------------------|----------|------------------------------|
| `/api/workout/programs`           | GET      | User's program subscriptions |
| `/api/workout/programs/templates` | GET      | Browse available programs    |
| `/api/workout/programs/[id]`      | GET      | Single program details       |
| `/api/workout/programs/join`      | GET/POST | Check/join program           |
| `/api/workout/programs/progress`  | GET/PUT  | Track program progress       |

### Supporting Routes

| Route                          | Method   | Purpose                |
|--------------------------------|----------|------------------------|
| `/api/workout/coaching-cues`   | GET      | Exercise coaching tips |
| `/api/workout/recommendations` | GET      | AI recommendations     |
| `/api/workout/analytics`       | GET      | Workout analytics      |
| `/api/workout/records`         | GET      | Personal records       |
| `/api/workout/habits`          | GET/POST | Habit tracking         |

---

## Component Hierarchy

### Main Page (`/workout-log/page.tsx`)

```
WorkoutLogPage (client component)
├── Tab Navigation (today | programs | athletes | history | metrics | progress | habits)
│
├── [Today Tab]
│   ├── Session Controls (Start/End session)
│   ├── Program Prefill Modal
│   ├── Exercise Search & Selection
│   ├── Entry Form (sets, reps, weight, etc.)
│   ├── Coaching Cues Display
│   ├── View Mode Toggle (cards | table)
│   ├── WorkoutCard[] or WorkoutSummaryTable
│   └── RestTimerBar
│
├── [Programs Tab]
│   └── ProgramsTab (browse available programs)
│
├── [Athletes Tab]
│   └── AthleteGallery
│
├── [History Tab]
│   ├── WorkoutCalendar
│   └── SessionHistoryTable
│
├── [Metrics Tab]
│   └── BodyMetricsTab
│
├── [Progress Tab]
│   └── ProgressTab
│
└── [Habits Tab]
    └── HabitsTab
```

### Program Detail Page (`/workout-log/programs/[id]/page.tsx`)

```
ProgramDetailPage (client component)
├── Back Navigation
├── ProgramHero
│   ├── Background Image + Gradient
│   ├── Category Badge
│   ├── Title & Description
│   ├── Meta Items (duration, time, level)
│   └── Action Buttons (Follow, Save)
│
├── ShareBar
│   └── Social Share Buttons
│
└── Main Content (2-column grid)
    ├── [Left Column]
    │   ├── ProgramGoals
    │   └── ProgramSchedule (workout days)
    │
    └── [Right Column - Sidebar]
        └── ProgramSidebar
            ├── Stats Grid
            ├── Equipment List
            ├── Prerequisites Card
            ├── Red Flags Card
            └── Athlete Info Card (if celebrity)
```

---

## Data Flow

### Creating a Workout Entry

```
1. User selects exercise (exerciseSearch → handleExerciseSelect)
   ↓
2. User fills form (sets, reps, weight, etc.)
   ↓
3. handleSubmit() triggered
   ↓
4. POST /api/workout/entries
   Body: { entries: [{ date, exerciseId, setNumber, reps, weight, ... }] }
   ↓
5. API validates with Zod schema (createWorkoutEntriesRequestSchema)
   ↓
6. createWorkoutLogEntry() called from @/core/database
   ↓
7. Prisma inserts into workout_log_entries
   ↓
8. Response returned → fetchWorkoutEntries() refreshes UI
```

### Fetching Program Details

```
1. ProgramDetailPage mounts → useEffect calls fetchProgram()
   ↓
2. GET /api/workout/programs/templates
   ↓
3. API queries program_templates with relations
   ↓
4. Response includes templateData JSON
   ↓
5. transformApiResponse() normalizes data
   ↓
6. State updated → Components render with data
```

---

## Type Definitions

### Key Types from `src/types/workout.ts`

```typescript
export type SetType = 'STRAIGHT' | 'SUPERSET' | 'TRISET' | 'PYRAMID' |
                      'REVERSE_PYRAMID' | 'DROP_SET' | 'REST_PAUSE' |
                      'CLUSTER' | 'EMOM' | 'AMRAP';

export type WeightUnit = 'KG' | 'LB';

export interface WorkoutLogEntry {
  id: string;
  userId: string;
  date: Date;
  exerciseId: string;
  setNumber: number;
  setType: SetType;
  reps: number;
  weight: string;
  unit: WeightUnit;
  // ... more fields
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
```

### Key Types from `src/types/program.ts`

```typescript
export type ProgramCategory = 'celebrity' | 'goal' | 'lifestyle' | 'sport' | 'modality';

export interface ProgramMetadata {
  program_name: string;
  program_id: string;
  description: string;
  level: ProgramDifficulty;
  duration_weeks: number;
  frequency_per_week: number;
  session_duration_minutes: { min: number; max: number };
  equipment: { required: string[]; recommended?: string[]; optional?: string[] };
}

export interface WorkoutSession {
  workout_id: string;
  name: string;
  day: number;
  focus: string;
  duration_minutes: number;
  sections: WorkoutSection[];
}
```

---

## Mockup Analysis

The mockup at `mockups/program_page_mockup.html` shows:

### 1. My Programs Dashboard
- Grid of program cards with gradient heroes
- Progress percentage overlay
- Next workout preview
- "Add Another Program" card

### 2. Program Detail Page (Celebrity Example: CBum)
- Hero section with background image + gradient overlay
- Category badge, title, metadata
- Action buttons (Following/Start, Save for Later)
- Share bar with social icons
- Two-column layout:
  - Left: Goals card, Training Cycle (collapsible workout days)
  - Right: Stats, Equipment, Prerequisites, Red Flags, Athlete Info

### 3. Workout Day Expansion
- Clickable day headers
- Expanded exercise list with:
  - Exercise thumbnail
  - Exercise name
  - Sets x Reps
  - Rest time

### 4. UI Components to Match
- Cards with rounded corners (16px/12px)
- Shadows: `0 1px 3px rgba(0,0,0,0.1)`
- Primary color: `#254967`
- Secondary background: `#fcf8f2`
- Badge styles with backgrounds
- Inter font family

---

## Implementation Guidelines

### Rule 1: Never Modify Core Data Flows
The existing API routes and database queries work correctly. UI changes should ONLY affect:
- Component rendering logic
- CSS/Tailwind classes
- State management within components
- New UI-only components

### Rule 2: Create New Components for New UI
Instead of modifying existing components heavily, create new ones:
```
src/components/programs/
├── program_hero_v2.tsx       # New hero design
├── program_schedule_v2.tsx   # Collapsible schedule
└── my_programs_grid.tsx      # Dashboard grid
```

### Rule 3: Test Each Change Isolation
After ANY change:
1. Run `npm run build` - must pass
2. Run `npm run type-check` - must pass
3. Test the specific page in browser
4. Check console for errors

### Rule 4: Preserve Type Safety
When adding new props or types:
- Add to existing type files
- Never use `any` without explicit reason
- Ensure all component props are typed

### Rule 5: Use Existing UI Components
The project uses shadcn/ui. Use these existing components:
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`
- etc.

---

## Critical Do's and Don'ts

### DO
- Read all related files before making changes
- Make small, incremental changes
- Test after EVERY change
- Use TypeScript properly
- Follow existing code patterns
- Create backups before major changes
- Comment complex logic

### DON'T
- Modify API route logic for UI changes
- Delete files without explicit backup
- Change database schema for UI updates
- Refactor unrelated code while fixing something
- Use inline styles when Tailwind classes exist
- Skip type definitions
- Make multiple unrelated changes at once

---

## Step-by-Step Implementation Plan

### Phase 1: Setup (LOW RISK)
1. Create backup of current files
2. Add Material Design Icons to the project (already in mockup)
3. Create new component files (empty shells)
4. Add new types if needed

### Phase 2: My Programs Grid (MEDIUM RISK)
1. Create `my_programs_grid.tsx` component
2. Style program cards to match mockup
3. Add progress circle overlay
4. Test rendering with mock data
5. Connect to real subscription data

### Phase 3: Program Hero V2 (MEDIUM RISK)
1. Create `program_hero_v2.tsx`
2. Implement background image with gradient
3. Match metadata display
4. Add action buttons
5. Test with different program categories

### Phase 4: Training Cycle Collapsible (MEDIUM RISK)
1. Create `program_schedule_v2.tsx`
2. Implement collapsible day sections
3. Add exercise list within expanded sections
4. Add exercise media thumbnails
5. Test expand/collapse behavior

### Phase 5: Sidebar Enhancements (LOW RISK)
1. Update `program_sidebar.tsx` styling
2. Add prerequisites warning card
3. Add red flags card
4. Update athlete info card design

### Phase 6: Integration (HIGH RISK - BE CAREFUL)
1. Swap old components for new in pages
2. Test ALL program routes
3. Test ALL workout log routes
4. Fix any integration issues
5. Final styling polish

---

## Dependencies to Check

Before implementation, verify these are installed:

```bash
# Check package.json for:
- next: ^14.x
- react: ^18.x
- @prisma/client
- next-auth
- date-fns
- lucide-react (icons)
- tailwindcss

# May need to add:
- @mdi/font (Material Design Icons) OR use lucide-react equivalents
```

---

## Rollback Plan

If implementation causes issues:

1. **Immediate**: Git reset to last working commit
2. **Files**: Restore from `.backup` files
3. **Database**: No schema changes means no DB rollback needed
4. **Dependencies**: Restore `package.json` and `package-lock.json`

Keep these commands ready:
```bash
git stash
git checkout -- .
git clean -fd
```

---

## Conclusion

This document should serve as the single source of truth for implementing UX/UI improvements to the workout logs feature. Follow the guidelines strictly, test thoroughly, and make incremental changes.

**Remember**: The goal is ONLY visual improvements matching the mockup. No functional changes to data flow, API routes, or database schema should be made.

---

## Detailed Implementation Checklist (Starting Line 620)

### Current Gap Analysis

**Problem**: The "Programs" tab in `/workout-log` currently shows ONLY the `ProgramsTab` component which is a **browser for discovering programs**. It does NOT show the user's subscribed programs (the `MyPrograms` component exists but is not integrated).

**Mockup Expectation**: The My Programs page should show:
1. A header with "My Programs" title and subtitle showing count
2. A grid of user's subscribed programs with:
   - Gradient hero sections with category colors
   - Progress percentage circle overlay
   - Week X of Y indicator
   - "Next Workout" preview card
3. An "Add Another Program" card to navigate to program browser
4. Clicking a program card navigates to the program detail page

---

### Phase 1: Integrate MyPrograms Component into Programs Tab

**Files to modify:**
- `src/app/workout-log/page.tsx` (lines ~2418-2420 where programs tab renders)
- `src/components/workout-log/programs_tab.tsx` (may need to import MyPrograms)

**Tasks:**
- [ ] 1.1. Import `MyPrograms` component into the programs tab area
- [ ] 1.2. Fetch user's program subscriptions with progress data
- [ ] 1.3. Show `MyPrograms` section ABOVE the program browser
- [ ] 1.4. Add visual separator between "My Programs" and "Browse Programs"
- [ ] 1.5. Wire the "Add Another Program" button to scroll/switch to browser section

**API endpoint to use:** `GET /api/workout/programs?subscriptions=true`

---

### Phase 2: Style MyPrograms Cards to Match Mockup

**Files to modify:**
- `src/components/programs/my_programs.tsx`
- `src/types/program.ts` (verify PROGRAM_CATEGORY_COLORS are correct)

**Tasks:**
- [ ] 2.1. Verify gradient colors match mockup CSS variables:
  - Celebrity: `rgba(37, 73, 103, 0.82)` to `rgba(26, 42, 62, 0.82)`
  - Goal: `rgba(20, 83, 75, 0.82)` to `rgba(17, 52, 50, 0.82)`
  - Lifestyle: `rgba(120, 70, 90, 0.82)` to `rgba(70, 45, 55, 0.82)`
  - Sport: `rgba(30, 64, 95, 0.82)` to `rgba(20, 45, 70, 0.82)`

- [ ] 2.2. Match card shadow styles:
  ```css
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  hover: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  ```

- [ ] 2.3. Match border-radius: `16px` for cards

- [ ] 2.4. Style progress circle:
  - Position: `absolute top-4 right-4`
  - Size: `w-12 h-12`
  - Background: `rgba(255,255,255,0.2)`
  - Font: `text-sm font-bold`

- [ ] 2.5. Style "Next Workout" preview:
  - Background: `#fcf8f2` (var(--secondary))
  - Border-radius: `10px`
  - Padding: `12px 16px`

- [ ] 2.6. Add "Add Another Program" card with dashed border:
  ```css
  border: 2px dashed #e5e7eb;
  hover:border-color: #254967;
  hover:background: #fcf8f2;
  ```

---

### Phase 3: Update Program Detail Page Hero

**Files to modify:**
- `src/components/programs/program_hero.tsx`
- `src/app/workout-log/programs/[id]/page.tsx`

**Tasks:**
- [ ] 3.1. Add background image support with overlay gradient
- [ ] 3.2. Match hero padding: `48px 24px 60px`
- [ ] 3.3. Style category badge:
  - Background: `rgba(255,255,255,0.2)`
  - Padding: `6px 14px`
  - Border-radius: `20px`
  - Font: `12px font-weight-600`

- [ ] 3.4. Style title: `36px font-weight-800 letter-spacing:-0.02em`
- [ ] 3.5. Style subtitle: `16px opacity-0.95 max-width-600px`
- [ ] 3.6. Style meta items row (duration, time, level)
- [ ] 3.7. Style action buttons (Start/Following, Save for Later)

---

### Phase 4: Implement Collapsible Workout Days

**Files to modify:**
- `src/components/programs/program_schedule.tsx`
- `src/components/workout-log/collapsible_section.tsx` (reuse if applicable)

**Tasks:**
- [ ] 4.1. Create clickable day headers with expand/collapse
- [ ] 4.2. Add chevron icon that rotates on expand
- [ ] 4.3. Style day number badge:
  - Size: `32px`
  - Border-radius: `8px`
  - Background: `#254967` (var(--primary))
  - Rest days: `#10b981` (var(--success))

- [ ] 4.4. Style workout day container:
  - Background: `#fcf8f2` (var(--secondary))
  - Border-radius: `10px`
  - Margin-bottom: `8px`

- [ ] 4.5. Implement expanded exercise list:
  - Show exercise thumbnail (64x64px)
  - Show exercise name
  - Show sets x reps
  - Show rest time

- [ ] 4.6. Add smooth expand/collapse animation

---

### Phase 5: Update Program Sidebar

**Files to modify:**
- `src/components/programs/program_sidebar.tsx`

**Tasks:**
- [ ] 5.1. Style stats grid (2x2 layout)
- [ ] 5.2. Style equipment list with icons
- [ ] 5.3. Add prerequisites warning card (yellow background)
- [ ] 5.4. Add red flags card (red/orange background)
- [ ] 5.5. Style athlete info card (for celebrity programs)

---

### Phase 6: Add Share Bar

**Files to modify:**
- `src/components/programs/share_bar.tsx`

**Tasks:**
- [ ] 6.1. Create horizontal share bar component
- [ ] 6.2. Add social share buttons (Instagram, TikTok, Twitter, Facebook)
- [ ] 6.3. Add copy link button
- [ ] 6.4. Style button backgrounds and hover states

---

### Phase 7: Integration Testing

**Test pages:**
- `/workout-log` → Programs tab
- `/workout-log/programs/[id]` → Program detail

**Tasks:**
- [ ] 7.1. Test with user who has active program subscriptions
- [ ] 7.2. Test with user who has no subscriptions
- [ ] 7.3. Test program detail page for different categories (celebrity, goal, lifestyle, sport)
- [ ] 7.4. Test expand/collapse of workout days
- [ ] 7.5. Test navigation between My Programs and Browse Programs
- [ ] 7.6. Run `npm run build` - must pass
- [ ] 7.7. Run `npm run type-check` - must pass
- [ ] 7.8. Check browser console for errors

---

### Files Reference Quick List

| Component | File Path | Purpose |
|-----------|-----------|---------|
| MyPrograms | `src/components/programs/my_programs.tsx` | User's subscribed programs grid |
| ProgramsTab | `src/components/workout-log/programs_tab.tsx` | Program browser (discover) |
| ProgramHero | `src/components/programs/program_hero.tsx` | Hero section for detail page |
| ProgramSchedule | `src/components/programs/program_schedule.tsx` | Workout schedule display |
| ProgramSidebar | `src/components/programs/program_sidebar.tsx` | Metadata sidebar |
| ShareBar | `src/components/programs/share_bar.tsx` | Social sharing |
| Program Types | `src/types/program.ts` | Type definitions |
| Main Page | `src/app/workout-log/page.tsx` | Tab container |
| Detail Page | `src/app/workout-log/programs/[id]/page.tsx` | Program detail |

---

### Brand Colors Reference

```css
--primary: #254967;        /* Deep blue - buttons, accents */
--primary-dark: #1a3a52;   /* Darker blue - headers */
--secondary: #fcf8f2;      /* Warm cream - backgrounds */
--border: #e5e7eb;         /* Light gray - borders */
--success: #10b981;        /* Green - positive states */
--warning: #f59e0b;        /* Amber - warnings */
--error: #ef4444;          /* Red - errors */
```

---

### DO NOT TOUCH

These files work correctly and should NOT be modified:
- All API routes in `src/app/api/workout/*`
- Database queries in `src/core/database/*`
- Type definitions (only add, don't modify existing)
- Authentication logic

