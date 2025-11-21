# MASSIMINO WORKOUT LOG COMPLETION PLAN
## 14-Week Implementation Roadmap

---

## **PROJECT OVERVIEW**

### **Objective**
Complete the Workout Log feature as Massimino's core functionality (27% of codebase), integrating with Assessments, preparing for AI recommendations, and implementing comprehensive gamification.

### **Key Requirements**
- ✅ **No new files** - enhance existing files only
- ✅ **snake_case naming** throughout
- ✅ **British English** spelling (behaviour, colour, centre, optimise, analyse)
- ✅ Link to Assessments feature
- ✅ Prepare data pipeline for future AI integration
- ✅ Engaging animations and gamification
- ✅ Comments system (on entries AND sessions)
- ✅ NASM CPT/CNC knowledge integration from directory public/databases/NASM_CPT and public/databases/NASM_CNC
- ✅ Dashboard workout progress widgets
- ✅ Maintain Massimino colour scheme

### **Terminology**
- **"Log" or "Routine"** = `workout_sessions` (container for workout)
- **"Entry"** = `workout_log_entries` (individual exercise set)

---

## **PHASE 1: FOUNDATION & ARCHITECTURE** (Weeks 1-2)

### **Week 1: Database & Service Layer Enhancement**

#### **Task 1.1: Database Schema Refinement** --> DONE
**File:** `/prisma/schema.prisma`

**Enhancement:** Add fields to existing models for gamification, AI, and assessment integration

```prisma
// Enhancement to workout_sessions model
model workout_sessions {
  id                    String    @id
  userId                String
  date                  DateTime  @db.Date
  startTime            DateTime
  endTime              DateTime?
  totalVolume          Float?
  totalSets            Int       @default(0)
  isComplete           Boolean   @default(false)

  // NEW: Assessment Integration
  assessmentId         String?
  fitnessLevel         String?   // "BEGINNER", "INTERMEDIATE", "ADVANCED"
  primaryGoal          String?   // From assessment

  // NEW: AI Integration
  aiGenerated          Boolean   @default(false)
  aiRecommendations    Json?
  aiConfidenceScore    Float?

  // NEW: Gamification
  experiencePoints     Int       @default(0)
  achievementsEarned   String[]  @default([])
  performanceRating    Int?      // 1-5 stars

  // NEW: Session Metadata (British English)
  sessionBehaviour     String?   // "EXCELLENT", "GOOD", "FAIR", "POOR"
  effortLevel          Int?      // 1-10 RPE
  sessionNotes         String?

  // Relations
  workout_log_entries  workout_log_entries[]
  assessments          assessments? @relation(fields: [assessmentId], references: [id])
  session_comments     comments[]
}

// Enhancement to workout_log_entries model
model workout_log_entries {
  id                   String     @id
  userId               String
  sessionId            String?
  exerciseId           String
  setNumber            Int
  setType              SetType
  reps                 Int
  weight               String
  unit                 WeightUnit
  trainingVolume       Float?

  // NEW: Performance Tracking
  actualRPE            Int?       // Rate of Perceived Exertion
  targetRPE            Int?
  restDuration         Int?       // Seconds
  formQuality          Int?       // 1-5 rating

  // NEW: NASM Integration
  nasmPrinciple        String?    // "PROGRESSIVE_OVERLOAD", "SPECIFICITY", etc.
  movementPattern      String?    // "PUSH", "PULL", "HINGE", "SQUAT", "CARRY"

  // NEW: Gamification
  personalRecord       Boolean    @default(false)
  volumeRecord         Boolean    @default(false)

  // Relations
  entry_comments       comments[]
}

// NEW: Comments model (polymorphic)
model comments {
  id                   String     @id
  userId               String
  commentableType      String     // "ENTRY" or "SESSION"
  commentableId        String
  content              String     @db.Text
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  // Polymorphic relations
  users                users      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workout_entry        workout_log_entries? @relation(fields: [commentableId], references: [id], onDelete: Cascade)
  workout_session      workout_sessions?    @relation(fields: [commentableId], references: [id], onDelete: Cascade)

  @@index([commentableType, commentableId])
}

// NEW: Achievements model
model achievements {
  id                   String     @id
  code                 String     @unique
  name                 String
  description          String
  category             String     // "VOLUME", "CONSISTENCY", "STRENGTH", "TECHNIQUE"
  tier                 String     // "BRONZE", "SILVER", "GOLD", "PLATINUM"
  experiencePoints     Int
  criteria             Json       // Achievement unlock criteria
  iconColour           String     // British spelling
  createdAt            DateTime   @default(now())
}

// NEW: User achievements tracking
model user_achievements {
  id                   String     @id
  userId               String
  achievementId        String
  unlockedAt           DateTime   @default(now())
  sessionId            String?    // Session where it was earned

  users                users      @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievements         achievements @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_workout_gamification_ai_fields
```
We have already completed Task 1.1 successfully. The database schema enhancements are now in place with all the gamification, AI integration, assessment linking, and comments functionality using British English conventions throughout.
---

#### **Task 1.2: NASM Knowledge Service**
**File:** `/src/services/ai/workout-suggestions.ts`

**Enhancement:** Add NASM knowledge parsing functions to existing AI service

**Available Knowledge Base Files:**
- **NASM CPT (Certified Personal Trainer):** 13 markdown sections in `public/databases/NASM_CPT/converted/`
  - section_02: Evidence of Muscular Dysfunction and Increased Injury
  - section_03: The Role of Psychology in Fitness and Wellness
  - section_04: Human Movement Science
  - section_05: Motor Behaviour
  - section_06: Assessments (145K - comprehensive assessment protocols)
  - section_07: Integrated Training and the OPT Model (42K - core training methodology)
  - section_08: Flexibility Training
  - section_09: Cardiorespiratory Fitness Training
  - section_10: Core Training
  - section_11: Balance
  - section_12: Speed, Agility, Quickness (SAQ)
  - section_13: Resistance Training (113K - comprehensive exercise library)
  - section_14: Plyometric Training

- **NASM CNC (Certified Nutrition Coach):** 4 markdown sections in `public/databases/NASM_CNC/converted/`
  - section_01: Food Choices
  - section_02: Protein (43K)
  - section_03: Carbohydrates (49K)
  - section_04: Fats (26K)

```typescript
import fs from 'fs';
import path from 'path';

// Add to existing workout-suggestions.ts

interface NASMPrinciple {
  name: string;
  description: string;
  application: string;
  category: 'TRAINING' | 'NUTRITION' | 'ASSESSMENT';
  source_section: string;
}

interface ExerciseRecommendation {
  movement_pattern: string;
  nasm_principle: string;
  progression_level: string;
  coaching_cues: string[];
}

interface NutritionGuidelines {
  protein: string;
  carbohydrates: string;
  fats: string;
  food_choices: string;
}

// Parse NASM CPT knowledge base from converted markdown files
export function parse_nasm_cpt_knowledge(): NASMPrinciple[] {
  const cpt_dir = path.join(process.cwd(), 'public/databases/NASM_CPT/converted');
  const principles: NASMPrinciple[] = [];

  // Parse OPT Model (section_07)
  const opt_content = read_section_file(cpt_dir, 'section_07_integrated_training_and_the_opt_model.md');
  if (opt_content) {
    // Extract OPT Model principles: Stabilisation, Strength, Power
    const opt_principles = extract_opt_model_principles(opt_content);
    principles.push(...opt_principles);
  }

  // Parse Assessment protocols (section_06)
  const assessment_content = read_section_file(cpt_dir, 'section_06_assessments.md');
  if (assessment_content) {
    const assessment_principles = extract_assessment_principles(assessment_content);
    principles.push(...assessment_principles);
  }

  // Parse Resistance Training (section_13)
  const resistance_content = read_section_file(cpt_dir, 'section_13_resistance_training.md');
  if (resistance_content) {
    const resistance_principles = extract_resistance_training_principles(resistance_content);
    principles.push(...resistance_principles);
  }

  // Parse Flexibility Training (section_08)
  const flexibility_content = read_section_file(cpt_dir, 'section_08_flexibility_training.md');
  if (flexibility_content) {
    const flexibility_principles = extract_flexibility_principles(flexibility_content);
    principles.push(...flexibility_principles);
  }

  return principles;
}

// Parse NASM CNC knowledge base from converted markdown files
export function parse_nasm_cnc_knowledge(): NutritionGuidelines {
  const cnc_dir = path.join(process.cwd(), 'public/databases/NASM_CNC/converted');

  return {
    protein: read_section_file(cnc_dir, 'section_02_protein.md') || '',
    carbohydrates: read_section_file(cnc_dir, 'section_03_carbohydrates.md') || '',
    fats: read_section_file(cnc_dir, 'section_04_fats.md') || '',
    food_choices: read_section_file(cnc_dir, 'section_01_food_choices.md') || ''
  };
}

// Helper function to read section files
function read_section_file(directory: string, filename: string): string | null {
  try {
    const file_path = path.join(directory, filename);
    return fs.readFileSync(file_path, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// Extract OPT Model principles from section_07
function extract_opt_model_principles(content: string): NASMPrinciple[] {
  const principles: NASMPrinciple[] = [];

  // Parse for Stabilisation, Strength, and Power phases
  const phases = ['Stabilisation', 'Strength', 'Power'];

  phases.forEach(phase => {
    const phase_section = extract_section(content, phase);
    if (phase_section) {
      principles.push({
        name: `OPT Model - ${phase} Phase`,
        description: `${phase} training phase of the OPT Model`,
        application: phase_section.substring(0, 200), // First 200 chars as summary
        category: 'TRAINING',
        source_section: 'section_07'
      });
    }
  });

  return principles;
}

// Extract assessment principles from section_06
function extract_assessment_principles(content: string): NASMPrinciple[] {
  const principles: NASMPrinciple[] = [];

  // Look for key assessment types
  const assessments = [
    'Overhead Squat Assessment',
    'Postural Assessment',
    'Movement Assessment',
    'Performance Assessment'
  ];

  assessments.forEach(assessment => {
    const assessment_section = extract_section(content, assessment);
    if (assessment_section) {
      principles.push({
        name: assessment,
        description: `NASM ${assessment} protocol`,
        application: assessment_section.substring(0, 200),
        category: 'ASSESSMENT',
        source_section: 'section_06'
      });
    }
  });

  return principles;
}

// Extract resistance training principles from section_13
function extract_resistance_training_principles(content: string): NASMPrinciple[] {
  const principles: NASMPrinciple[] = [];

  // Extract key resistance training concepts
  const concepts = [
    'Progressive Overload',
    'Training Variables',
    'Exercise Selection',
    'Movement Patterns'
  ];

  concepts.forEach(concept => {
    const concept_section = extract_section(content, concept);
    if (concept_section) {
      principles.push({
        name: concept,
        description: `Resistance training principle: ${concept}`,
        application: concept_section.substring(0, 200),
        category: 'TRAINING',
        source_section: 'section_13'
      });
    }
  });

  return principles;
}

// Extract flexibility training principles from section_08
function extract_flexibility_principles(content: string): NASMPrinciple[] {
  const principles: NASMPrinciple[] = [];

  const flexibility_types = [
    'Static Stretching',
    'Dynamic Stretching',
    'Active Stretching',
    'Myofascial Release'
  ];

  flexibility_types.forEach(type => {
    const type_section = extract_section(content, type);
    if (type_section) {
      principles.push({
        name: type,
        description: `Flexibility modality: ${type}`,
        application: type_section.substring(0, 200),
        category: 'TRAINING',
        source_section: 'section_08'
      });
    }
  });

  return principles;
}

// Get exercise recommendations based on NASM principles
export function get_nasm_exercise_recommendations(
  fitness_level: string,
  primary_goal: string,
  movement_pattern: string
): ExerciseRecommendation {
  const nasm_principles = parse_nasm_cpt_knowledge();

  const progression_map = {
    BEGINNER: 'Stabilisation',
    INTERMEDIATE: 'Strength',
    ADVANCED: 'Power'
  };

  return {
    movement_pattern,
    nasm_principle: 'PROGRESSIVE_OVERLOAD',
    progression_level: progression_map[fitness_level as keyof typeof progression_map],
    coaching_cues: get_coaching_cues(movement_pattern, fitness_level)
  };
}

// Extract section by heading
function extract_section(content: string, heading: string): string | null {
  const lines = content.split('\n');
  let capturing = false;
  let section_content = '';

  for (const line of lines) {
    // Match heading with various markdown formats (##, ###, etc.)
    if (line.toLowerCase().includes(heading.toLowerCase()) && line.match(/^#{1,6}\s/)) {
      capturing = true;
      continue;
    }
    // Stop at next heading of same or higher level
    if (capturing && line.match(/^#{1,6}\s/)) {
      break;
    }
    if (capturing) {
      section_content += line + '\n';
    }
  }

  return section_content || null;
}

// Coaching cues database (to be enhanced with NASM knowledge)
function get_coaching_cues(movement_pattern: string, fitness_level: string): string[] {
  const cues_database = {
    SQUAT: {
      BEGINNER: ['Chest up', 'Knees track over toes', 'Weight in heels'],
      INTERMEDIATE: ['Brace core', 'Hip hinge first', 'Drive through heels'],
      ADVANCED: ['Maintain tension', 'Explosive concentric', 'Controlled eccentric']
    },
    HINGE: {
      BEGINNER: ['Neutral spine', 'Slight knee bend', 'Push hips back'],
      INTERMEDIATE: ['Load hamstrings', 'Lat engagement', 'Hip drive'],
      ADVANCED: ['Triple extension', 'Posterior chain activation', 'Power generation']
    },
    PUSH: {
      BEGINNER: ['Shoulders packed', 'Elbows 45 degrees', 'Full range of motion'],
      INTERMEDIATE: ['Scapular retraction', 'Core tight', 'Controlled tempo'],
      ADVANCED: ['Maximum tension', 'Peak contraction', 'Mind-muscle connection']
    },
    PULL: {
      BEGINNER: ['Lead with elbows', 'Shoulders down', 'Squeeze shoulder blades'],
      INTERMEDIATE: ['Full scapular retraction', 'Chest to bar', 'Lat focus'],
      ADVANCED: ['Dead hang start', 'Explosive pull', 'Control eccentric']
    },
    CARRY: {
      BEGINNER: ['Neutral spine', 'Shoulders stable', 'Short distances'],
      INTERMEDIATE: ['Core braced', 'Even weight distribution', 'Controlled breathing'],
      ADVANCED: ['Maximum load', 'Extended duration', 'Anti-rotation focus']
    }
  };

  return cues_database[movement_pattern as keyof typeof cues_database]?.[fitness_level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'] || [];
}
```

---

#### **Task 1.3: Assessment Integration Service**
**File:** `/src/core/database/workout-queries.ts`

**Enhancement:** Add assessment integration functions

```typescript
// Add to existing workout-queries.ts

interface AssessmentData {
  fitness_level: string;
  primary_goal: string;
  movement_limitations: string[];
  experience_years: number;
}

// Link workout session to assessment
export async function link_session_to_assessment(
  session_id: string,
  assessment_id: string
) {
  const assessment = await prisma.assessments.findUnique({
    where: { id: assessment_id }
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Extract fitness level and goals from assessment
  const assessment_data: AssessmentData = {
    fitness_level: determine_fitness_level(assessment),
    primary_goal: assessment.primaryGoal || 'GENERAL_FITNESS',
    movement_limitations: assessment.limitations || [],
    experience_years: assessment.experienceYears || 0
  };

  return prisma.workout_sessions.update({
    where: { id: session_id },
    data: {
      assessmentId: assessment_id,
      fitnessLevel: assessment_data.fitness_level,
      primaryGoal: assessment_data.primary_goal,
      updatedAt: new Date()
    }
  });
}

// Determine fitness level from assessment scores
function determine_fitness_level(assessment: any): string {
  // Analyse assessment metrics
  const squat_score = assessment.squatScore || 0;
  const push_score = assessment.pushScore || 0;
  const pull_score = assessment.pullScore || 0;

  const average_score = (squat_score + push_score + pull_score) / 3;

  if (average_score >= 8) return 'ADVANCED';
  if (average_score >= 5) return 'INTERMEDIATE';
  return 'BEGINNER';
}

// Get workout recommendations based on assessment
export async function get_assessment_based_recommendations(
  user_id: string
) {
  // Get most recent assessment
  const latest_assessment = await prisma.assessments.findFirst({
    where: { userId: user_id },
    orderBy: { createdAt: 'desc' }
  });

  if (!latest_assessment) {
    return null;
  }

  const fitness_level = determine_fitness_level(latest_assessment);

  // Get NASM recommendations
  const nasm_recommendations = get_nasm_exercise_recommendations(
    fitness_level,
    latest_assessment.primaryGoal || 'GENERAL_FITNESS',
    'SQUAT' // Example pattern
  );

  return {
    fitness_level,
    recommended_volume: calculate_recommended_volume(fitness_level),
    recommended_frequency: calculate_recommended_frequency(fitness_level),
    nasm_phase: nasm_recommendations.progression_level,
    coaching_cues: nasm_recommendations.coaching_cues
  };
}

function calculate_recommended_volume(fitness_level: string): number {
  const volume_map = {
    BEGINNER: 10, // 10 sets per session
    INTERMEDIATE: 15,
    ADVANCED: 20
  };
  return volume_map[fitness_level as keyof typeof volume_map] || 12;
}

function calculate_recommended_frequency(fitness_level: string): number {
  const frequency_map = {
    BEGINNER: 3, // 3 sessions per week
    INTERMEDIATE: 4,
    ADVANCED: 5
  };
  return frequency_map[fitness_level as keyof typeof frequency_map] || 3;
}
```

---

### **Week 2: AI Data Pipeline & Gamification Architecture**

#### **Task 2.1: AI Data Pipeline Preparation**
**File:** `/src/core/database/workout-queries.ts`

**Enhancement:** Add AI data export functions

```typescript
// Add to existing workout-queries.ts

interface AITrainingData {
  user_profile: {
    fitness_level: string;
    primary_goal: string;
    experience_years: number;
  };
  workout_history: {
    total_sessions: number;
    average_volume: number;
    favourite_exercises: string[];
    consistency_score: number;
  };
  performance_metrics: {
    strength_progression: number;
    volume_progression: number;
    technique_scores: number[];
  };
  preferences: {
    preferred_set_types: string[];
    preferred_rep_ranges: [number, number];
    preferred_rest_durations: number[];
  };
}

// Prepare workout data for AI analysis
export async function prepare_ai_training_data(
  user_id: string
): Promise<AITrainingData> {
  // Get all user sessions from last 90 days
  const ninety_days_ago = new Date();
  ninety_days_ago.setDate(ninety_days_ago.getDate() - 90);

  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId: user_id,
      date: { gte: ninety_days_ago },
      isComplete: true
    },
    include: {
      workout_log_entries: {
        include: {
          exercises: true
        }
      },
      assessments: true
    },
    orderBy: { date: 'asc' }
  });

  const entries = sessions.flatMap(s => s.workout_log_entries);

  // Calculate metrics
  const total_volume = entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0);
  const average_volume = sessions.length > 0 ? total_volume / sessions.length : 0;

  // Find favourite exercises (most frequently used)
  const exercise_frequency = new Map<string, number>();
  entries.forEach(e => {
    exercise_frequency.set(
      e.exerciseId,
      (exercise_frequency.get(e.exerciseId) || 0) + 1
    );
  });

  const favourite_exercises = Array.from(exercise_frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  // Calculate consistency score (sessions per week)
  const weeks_in_period = 13; // ~90 days
  const consistency_score = (sessions.length / weeks_in_period) / 4; // Normalised to 0-1

  // Get latest assessment
  const latest_assessment = sessions[0]?.assessments;

  return {
    user_profile: {
      fitness_level: latest_assessment?.fitnessLevel || 'INTERMEDIATE',
      primary_goal: latest_assessment?.primaryGoal || 'GENERAL_FITNESS',
      experience_years: latest_assessment?.experienceYears || 1
    },
    workout_history: {
      total_sessions: sessions.length,
      average_volume,
      favourite_exercises,
      consistency_score: Math.min(consistency_score, 1)
    },
    performance_metrics: {
      strength_progression: calculate_strength_progression(entries),
      volume_progression: calculate_volume_progression(sessions),
      technique_scores: entries
        .filter(e => e.formQuality !== null)
        .map(e => e.formQuality!)
    },
    preferences: {
      preferred_set_types: calculate_preferred_set_types(entries),
      preferred_rep_ranges: calculate_preferred_rep_range(entries),
      preferred_rest_durations: calculate_preferred_rest_durations(entries)
    }
  };
}

function calculate_strength_progression(entries: any[]): number {
  // Compare first 20% of entries with last 20%
  const total = entries.length;
  const early_entries = entries.slice(0, Math.floor(total * 0.2));
  const recent_entries = entries.slice(Math.floor(total * 0.8));

  const early_avg_volume = early_entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0) / early_entries.length;
  const recent_avg_volume = recent_entries.reduce((sum, e) => sum + (e.trainingVolume || 0), 0) / recent_entries.length;

  return recent_avg_volume > 0 ? ((recent_avg_volume - early_avg_volume) / early_avg_volume) * 100 : 0;
}

function calculate_volume_progression(sessions: any[]): number {
  if (sessions.length < 2) return 0;

  const first_session = sessions[0];
  const last_session = sessions[sessions.length - 1];

  const first_volume = first_session.totalVolume || 0;
  const last_volume = last_session.totalVolume || 0;

  return first_volume > 0 ? ((last_volume - first_volume) / first_volume) * 100 : 0;
}

function calculate_preferred_set_types(entries: any[]): string[] {
  const set_type_counts = new Map<string, number>();
  entries.forEach(e => {
    set_type_counts.set(e.setType, (set_type_counts.get(e.setType) || 0) + 1);
  });

  return Array.from(set_type_counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);
}

function calculate_preferred_rep_range(entries: any[]): [number, number] {
  const reps = entries.map(e => e.reps).filter(r => r > 0);
  if (reps.length === 0) return [8, 12];

  reps.sort((a, b) => a - b);
  const percentile_25 = reps[Math.floor(reps.length * 0.25)];
  const percentile_75 = reps[Math.floor(reps.length * 0.75)];

  return [percentile_25, percentile_75];
}

function calculate_preferred_rest_durations(entries: any[]): number[] {
  const rest_durations = entries
    .map(e => e.restDuration)
    .filter(r => r !== null && r !== undefined) as number[];

  if (rest_durations.length === 0) return [60, 90, 120];

  const avg = rest_durations.reduce((sum, r) => sum + r, 0) / rest_durations.length;
  return [Math.floor(avg * 0.8), Math.floor(avg), Math.floor(avg * 1.2)];
}
```

---

#### **Task 2.2: Gamification System Architecture**
**File:** `/src/core/database/workout-queries.ts`

**Enhancement:** Add gamification functions

```typescript
// Add to existing workout-queries.ts

interface AchievementCriteria {
  type: 'VOLUME' | 'CONSISTENCY' | 'STRENGTH' | 'TECHNIQUE' | 'MILESTONE';
  threshold: number;
  comparison: 'GREATER_THAN' | 'EQUALS' | 'STREAK';
  metric: string;
}

interface ExperiencePointsBreakdown {
  base_points: number;
  volume_bonus: number;
  technique_bonus: number;
  consistency_bonus: number;
  achievement_bonus: number;
  total: number;
}

// Calculate experience points for a session
export async function calculate_session_experience_points(
  session_id: string
): Promise<ExperiencePointsBreakdown> {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id },
    include: {
      workout_log_entries: true
    }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const breakdown: ExperiencePointsBreakdown = {
    base_points: 100, // Base points for completing session
    volume_bonus: 0,
    technique_bonus: 0,
    consistency_bonus: 0,
    achievement_bonus: 0,
    total: 0
  };

  // Volume bonus (1 point per 100kg total volume)
  const total_volume = session.totalVolume || 0;
  breakdown.volume_bonus = Math.floor(total_volume / 100);

  // Technique bonus (average form quality)
  const entries_with_form = session.workout_log_entries.filter(e => e.formQuality !== null);
  if (entries_with_form.length > 0) {
    const avg_form = entries_with_form.reduce((sum, e) => sum + (e.formQuality || 0), 0) / entries_with_form.length;
    breakdown.technique_bonus = Math.floor(avg_form * 20); // Max 100 bonus for perfect form
  }

  // Consistency bonus (check if session continues a streak)
  const streak_bonus = await calculate_consistency_streak_bonus(session.userId, session.date);
  breakdown.consistency_bonus = streak_bonus;

  // Achievement bonus (any personal records)
  const pr_count = session.workout_log_entries.filter(e => e.personalRecord || e.volumeRecord).length;
  breakdown.achievement_bonus = pr_count * 50; // 50 points per PR

  breakdown.total = Object.values(breakdown).reduce((sum, val) => sum + val, 0) - breakdown.total; // Exclude total from sum

  return breakdown;
}

async function calculate_consistency_streak_bonus(user_id: string, session_date: Date): Promise<number> {
  // Get recent sessions to calculate streak
  const seven_days_ago = new Date(session_date);
  seven_days_ago.setDate(seven_days_ago.getDate() - 7);

  const recent_sessions = await prisma.workout_sessions.findMany({
    where: {
      userId: user_id,
      date: {
        gte: seven_days_ago,
        lte: session_date
      },
      isComplete: true
    },
    orderBy: { date: 'desc' }
  });

  // Award bonus for 3+ sessions in 7 days
  if (recent_sessions.length >= 3) {
    return 50 * recent_sessions.length; // Escalating bonus
  }

  return 0;
}

// Check and award achievements after session
export async function check_and_award_achievements(
  user_id: string,
  session_id: string
): Promise<string[]> {
  const awarded_achievement_ids: string[] = [];

  // Get all achievements
  const all_achievements = await prisma.achievements.findMany();

  // Get user's existing achievements
  const existing_achievements = await prisma.user_achievements.findMany({
    where: { userId: user_id },
    select: { achievementId: true }
  });

  const existing_ids = new Set(existing_achievements.map(a => a.achievementId));

  // Check each achievement
  for (const achievement of all_achievements) {
    if (existing_ids.has(achievement.id)) continue; // Already earned

    const criteria = achievement.criteria as AchievementCriteria;
    const meets_criteria = await check_achievement_criteria(user_id, session_id, criteria);

    if (meets_criteria) {
      // Award achievement
      await prisma.user_achievements.create({
        data: {
          id: crypto.randomUUID(),
          userId: user_id,
          achievementId: achievement.id,
          sessionId: session_id
        }
      });

      awarded_achievement_ids.push(achievement.id);
    }
  }

  return awarded_achievement_ids;
}

async function check_achievement_criteria(
  user_id: string,
  session_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  switch (criteria.type) {
    case 'VOLUME':
      return check_volume_achievement(user_id, session_id, criteria);
    case 'CONSISTENCY':
      return check_consistency_achievement(user_id, criteria);
    case 'STRENGTH':
      return check_strength_achievement(user_id, criteria);
    case 'TECHNIQUE':
      return check_technique_achievement(user_id, session_id, criteria);
    case 'MILESTONE':
      return check_milestone_achievement(user_id, criteria);
    default:
      return false;
  }
}

async function check_volume_achievement(
  user_id: string,
  session_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id }
  });

  if (!session) return false;

  const total_volume = session.totalVolume || 0;
  return total_volume >= criteria.threshold;
}

async function check_consistency_achievement(
  user_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const thirty_days_ago = new Date();
  thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);

  const session_count = await prisma.workout_sessions.count({
    where: {
      userId: user_id,
      date: { gte: thirty_days_ago },
      isComplete: true
    }
  });

  return session_count >= criteria.threshold;
}

async function check_strength_achievement(
  user_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  // Check for personal records
  const pr_count = await prisma.workout_log_entries.count({
    where: {
      userId: user_id,
      personalRecord: true
    }
  });

  return pr_count >= criteria.threshold;
}

async function check_technique_achievement(
  user_id: string,
  session_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id },
    include: {
      workout_log_entries: true
    }
  });

  if (!session) return false;

  const entries_with_form = session.workout_log_entries.filter(e => e.formQuality !== null);
  if (entries_with_form.length === 0) return false;

  const avg_form = entries_with_form.reduce((sum, e) => sum + (e.formQuality || 0), 0) / entries_with_form.length;
  return avg_form >= criteria.threshold;
}

async function check_milestone_achievement(
  user_id: string,
  criteria: AchievementCriteria
): Promise<boolean> {
  const total_sessions = await prisma.workout_sessions.count({
    where: {
      userId: user_id,
      isComplete: true
    }
  });

  return total_sessions === criteria.threshold; // Exact milestone
}

// Update session with XP and achievements
export async function finalise_session_with_gamification(
  session_id: string
) {
  const session = await prisma.workout_sessions.findUnique({
    where: { id: session_id }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Calculate XP
  const xp_breakdown = await calculate_session_experience_points(session_id);

  // Check achievements
  const new_achievements = await check_and_award_achievements(session.userId, session_id);

  // Add achievement bonus to XP
  const achievement_xp = new_achievements.length * 100;
  xp_breakdown.achievement_bonus = achievement_xp;
  xp_breakdown.total += achievement_xp;

  // Update session
  await prisma.workout_sessions.update({
    where: { id: session_id },
    data: {
      experiencePoints: xp_breakdown.total,
      achievementsEarned: new_achievements,
      updatedAt: new Date()
    }
  });

  return {
    experience_points: xp_breakdown,
    achievements_earned: new_achievements
  };
}
```

---

## **PHASE 3: CORE LOG/ROUTINE MANAGEMENT** (Weeks 3-5)

### **Week 3: Session Creation & Management UI**

#### **Task 3.1: Enhance Workout Log Page with Session Management**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Add session creation modal and active session tracking

```typescript
// Add to existing WorkoutLogPage component state (around line 50)

const [active_session, set_active_session] = useState<{
  id: string;
  start_time: Date;
  assessment_id?: string;
} | null>(null);

const [show_session_creation_modal, set_show_session_creation_modal] = useState(false);
const [session_assessment_id, set_session_assessment_id] = useState<string>('');
const [available_assessments, set_available_assessments] = useState<any[]>([]);

// Add useEffect to load active session (around line 100)
useEffect(() => {
  async function load_active_session() {
    try {
      const response = await fetch('/api/workout/sessions?status=active');
      const data = await response.json();

      if (data.active_session) {
        set_active_session(data.active_session);
      }
    } catch (error) {
      console.error('Failed to load active session:', error);
    }
  }

  load_active_session();
}, []);

// Add useEffect to load assessments (around line 115)
useEffect(() => {
  async function load_assessments() {
    try {
      const response = await fetch('/api/assessments');
      const data = await response.json();
      set_available_assessments(data.assessments || []);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    }
  }

  load_assessments();
}, []);

// Add session creation function (around line 200)
async function handle_create_session() {
  try {
    const response = await fetch('/api/workout/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_id: session_assessment_id || undefined,
        start_time: new Date().toISOString()
      })
    });

    const data = await response.json();

    if (data.session) {
      set_active_session({
        id: data.session.id,
        start_time: new Date(data.session.startTime),
        assessment_id: data.session.assessmentId
      });
      set_show_session_creation_modal(false);
      toast.success('Workout session started!');
    }
  } catch (error) {
    console.error('Failed to create session:', error);
    toast.error('Failed to start workout session');
  }
}

// Add session completion function (around line 230)
async function handle_complete_session() {
  if (!active_session) return;

  try {
    const response = await fetch('/api/workout/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: active_session.id,
        end_time: new Date().toISOString(),
        is_complete: true
      })
    });

    const data = await response.json();

    if (data.session) {
      // Show XP and achievements earned
      toast.success(
        `Session complete! Earned ${data.gamification.experience_points.total} XP`,
        { duration: 5000 }
      );

      if (data.gamification.achievements_earned.length > 0) {
        toast.success(
          `Unlocked ${data.gamification.achievements_earned.length} new achievements!`,
          { duration: 5000 }
        );
      }

      set_active_session(null);
      reload_entries();
    }
  } catch (error) {
    console.error('Failed to complete session:', error);
    toast.error('Failed to complete workout session');
  }
}
```

**Add to JSX (around line 600, before the main table):**

```typescript
{/* Active Session Banner */}
{active_session && (
  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-6 shadow-lg">
    <div className="flex items-centre justify-between">
      <div className="flex items-centre gap-3">
        <Activity className="h-6 w-6 animate-pulse" />
        <div>
          <h3 className="font-semibold text-lg">Active Workout Session</h3>
          <p className="text-sm text-green-50">
            Started {formatDistanceToNow(active_session.start_time, { addSuffix: true })}
          </p>
        </div>
      </div>
      <Button
        onClick={handle_complete_session}
        className="bg-white text-green-600 hover:bg-green-50 font-semibold"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Complete Session
      </Button>
    </div>
  </div>
)}

{/* Session Creation Modal */}
{show_session_creation_modal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-centre justify-centre z-50 p-4">
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Start New Workout Session</CardTitle>
        <CardDescription>
          Begin logging your workout. Optionally link to an assessment for personalised recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Link to Assessment (Optional)
          </label>
          <select
            value={session_assessment_id}
            onChange={(e) => set_session_assessment_id(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">No assessment</option>
            {available_assessments.map(assessment => (
              <option key={assessment.id} value={assessment.id}>
                {format(new Date(assessment.createdAt), 'PPP')} - {assessment.primaryGoal}
              </option>
            ))}
          </select>
        </div>

        {session_assessment_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <Info className="inline h-4 w-4 mr-1" />
              This workout will be optimised based on your assessment results
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => set_show_session_creation_modal(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handle_create_session}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Workout
        </Button>
      </CardFooter>
    </Card>
  </div>
)}

{/* Start Session Button (shown when no active session) */}
{!active_session && (
  <div className="mb-6">
    <Button
      onClick={() => set_show_session_creation_modal(true)}
      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
      size="lg"
    >
      <Play className="mr-2 h-5 w-5" />
      Start New Workout Session
    </Button>
  </div>
)}
```

---

#### **Task 3.2: Update Entry Creation to Link to Active Session**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Modify handleAddEntry to link entries to active session

```typescript
// Update handleAddEntry function (around line 300)

async function handleAddEntry() {
  if (!currentExerciseId || !reps || !weight) {
    toast.error('Please fill in all required fields');
    return;
  }

  try {
    const entry_data = {
      exerciseId: currentExerciseId,
      setNumber: setNumber,
      setType: setType,
      reps: parseInt(reps),
      weight: weight,
      unit: weightUnit,
      date: selectedDate.toISOString(),
      sessionId: active_session?.id, // Link to active session
      actualRPE: rpe || undefined,
      formQuality: form_quality || undefined,
      restDuration: rest_duration || undefined
    };

    const response = await fetch('/api/workout/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry_data)
    });

    const data = await response.json();

    if (data.entry) {
      toast.success('Entry added successfully');
      resetForm();
      reload_entries();

      // Check for personal records
      if (data.entry.personalRecord) {
        toast.success('🏆 New Personal Record!', { duration: 5000 });
      }
    }
  } catch (error) {
    console.error('Failed to add entry:', error);
    toast.error('Failed to add entry');
  }
}
```

---

#### **Task 3.3: Add Advanced Performance Tracking Fields**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Add form fields for RPE, form quality, rest duration

```typescript
// Add state variables (around line 60)
const [actual_rpe, set_actual_rpe] = useState<number>(5);
const [form_quality, set_form_quality] = useState<number>(3);
const [rest_duration, set_rest_duration] = useState<number>(90);

// Add to entry form JSX (around line 850, after weight/unit fields)

{/* RPE (Rate of Perceived Exertion) */}
<div>
  <label className="block text-sm font-medium mb-2">
    RPE (1-10)
    <span className="text-gray-500 ml-2 font-normal">Optional</span>
  </label>
  <input
    type="range"
    min="1"
    max="10"
    value={actual_rpe}
    onChange={(e) => set_actual_rpe(parseInt(e.target.value))}
    className="w-full"
  />
  <div className="flex justify-between text-xs text-gray-500 mt-1">
    <span>Very Easy (1)</span>
    <span className="font-semibold text-gray-900">{actual_rpe}</span>
    <span>Maximum Effort (10)</span>
  </div>
</div>

{/* Form Quality */}
<div>
  <label className="block text-sm font-medium mb-2">
    Form Quality (1-5)
    <span className="text-gray-500 ml-2 font-normal">Optional</span>
  </label>
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map(rating => (
      <button
        key={rating}
        type="button"
        onClick={() => set_form_quality(rating)}
        className={`flex-1 py-2 px-3 rounded-md border-2 transition-all ${
          form_quality === rating
            ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {rating}
      </button>
    ))}
  </div>
  <p className="text-xs text-gray-500 mt-1">
    1 = Poor form, 5 = Perfect technique
  </p>
</div>

{/* Rest Duration */}
<div>
  <label className="block text-sm font-medium mb-2">
    Rest Duration (seconds)
    <span className="text-gray-500 ml-2 font-normal">Optional</span>
  </label>
  <select
    value={rest_duration}
    onChange={(e) => set_rest_duration(parseInt(e.target.value))}
    className="w-full border rounded-md p-2"
  >
    <option value={30}>30s - Active recovery</option>
    <option value={60}>60s - Endurance/hypertrophy</option>
    <option value={90}>90s - Moderate rest</option>
    <option value={120}>120s - Strength training</option>
    <option value={180}>180s - Power/heavy lifting</option>
    <option value={240}>240s - Maximum strength</option>
  </select>
</div>
```

---

### **Phase 4: Session History & Analytics**

#### **Task 4.1: Add Session History View**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Add tab navigation and session history table

```typescript
// Add state for tab navigation (around line 70)
const [active_tab, set_active_tab] = useState<'entries' | 'sessions'>('entries');

// Add to JSX (around line 550, before active session banner)

{/* Tab Navigation */}
<div className="border-b border-gray-200 mb-6">
  <nav className="-mb-px flex space-x-8">
    <button
      onClick={() => set_active_tab('entries')}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active_tab === 'entries'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <Dumbbell className="inline h-4 w-4 mr-2" />
      Workout Entries
    </button>
    <button
      onClick={() => set_active_tab('sessions')}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active_tab === 'sessions'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <Calendar className="inline h-4 w-4 mr-2" />
      Session History
    </button>
  </nav>
</div>

{/* Conditional rendering based on active tab */}
{active_tab === 'entries' && (
  <div>
    {/* Existing workout entries table */}
  </div>
)}

{active_tab === 'sessions' && (
  <SessionHistoryTable />
)}
```

---

#### **Task 4.2: Create Session History Component**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

**Enhancement:** Add SessionHistoryTable component to existing file

```typescript
// Add to existing WorkoutLogTable.tsx file (at the end)

export function SessionHistoryTable() {
  const [sessions, set_sessions] = useState<any[]>([]);
  const [loading, set_loading] = useState(true);
  const [selected_session, set_selected_session] = useState<string | null>(null);

  useEffect(() => {
    load_sessions();
  }, []);

  async function load_sessions() {
    try {
      const response = await fetch('/api/workout/sessions');
      const data = await response.json();
      set_sessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      set_loading(false);
    }
  }

  async function handle_delete_session(session_id: string) {
    if (!confirm('Are you sure you want to delete this workout session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workout/sessions?id=${session_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Session deleted successfully');
        load_sessions();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  }

  if (loading) {
    return <div className="text-centre py-8">Loading sessions...</div>;
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-centre py-12 bg-gray-50 rounded-lg">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a new workout session to begin tracking your progress
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map(session => (
            <Card
              key={session.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => set_selected_session(session.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {format(new Date(session.date), 'EEEE, d MMMM yyyy')}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(session.startTime), 'HH:mm')}
                      {session.endTime && ` - ${format(new Date(session.endTime), 'HH:mm')}`}
                      {session.endTime && (
                        <span className="ml-2 text-gray-500">
                          ({formatDuration(
                            intervalToDuration({
                              start: new Date(session.startTime),
                              end: new Date(session.endTime)
                            })
                          )})
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {session.isComplete && (
                    <Badge variant="success">Complete</Badge>
                  )}
                  {!session.isComplete && (
                    <Badge variant="warning">In Progress</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Sets</p>
                    <p className="text-2xl font-bold">{session.totalSets}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total Volume</p>
                    <p className="text-2xl font-bold">
                      {session.totalVolume?.toFixed(0) || 0}
                      <span className="text-sm text-gray-500 ml-1">kg</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">XP Earned</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {session.experiencePoints || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Performance</p>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (session.performanceRating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {session.achievementsEarned?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">🏆 Achievements Unlocked</p>
                    <div className="flex flex-wrap gap-2">
                      {session.achievementsEarned.map((achievement_id: string) => (
                        <Badge key={achievement_id} variant="secondary">
                          Achievement
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {session.sessionNotes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">{session.sessionNotes}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to session detail view
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handle_delete_session(session.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### **Phase 5: Calendar View & Session Planning**

#### **Task 5.1: Add Calendar View**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Add calendar tab and month view

```typescript
// Update tab navigation state (around line 70)
const [active_tab, set_active_tab] = useState<'entries' | 'sessions' | 'calendar'>('entries');

// Add calendar state
const [calendar_month, set_calendar_month] = useState(new Date());
const [month_sessions, set_month_sessions] = useState<any[]>([]);

// Load sessions for calendar month
useEffect(() => {
  if (active_tab === 'calendar') {
    load_month_sessions();
  }
}, [active_tab, calendar_month]);

async function load_month_sessions() {
  const start_of_month = startOfMonth(calendar_month);
  const end_of_month = endOfMonth(calendar_month);

  try {
    const response = await fetch(
      `/api/workout/sessions?start=${start_of_month.toISOString()}&end=${end_of_month.toISOString()}`
    );
    const data = await response.json();
    set_month_sessions(data.sessions || []);
  } catch (error) {
    console.error('Failed to load month sessions:', error);
  }
}

// Add calendar tab to navigation (around line 560)
<button
  onClick={() => set_active_tab('calendar')}
  className={`py-4 px-1 border-b-2 font-medium text-sm ${
    active_tab === 'calendar'
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`}
>
  <Calendar className="inline h-4 w-4 mr-2" />
  Calendar View
</button>

// Add calendar content (after sessions tab)
{active_tab === 'calendar' && (
  <div>
    {/* Month navigation */}
    <div className="flex items-centre justify-between mb-6">
      <Button
        variant="outline"
        onClick={() => set_calendar_month(subMonths(calendar_month, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <h2 className="text-xl font-semibold">
        {format(calendar_month, 'MMMM yyyy')}
      </h2>

      <Button
        variant="outline"
        onClick={() => set_calendar_month(addMonths(calendar_month, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>

    {/* Calendar grid */}
    <WorkoutCalendar
      month={calendar_month}
      sessions={month_sessions}
    />
  </div>
)}
```

---

#### **Task 5.2: Create Calendar Component**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

**Enhancement:** Add WorkoutCalendar component

```typescript
// Add to WorkoutLogTable.tsx

interface WorkoutCalendarProps {
  month: Date;
  sessions: any[];
}

export function WorkoutCalendar({ month, sessions }: WorkoutCalendarProps) {
  const days_in_month = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month)
  });

  const start_day = getDay(startOfMonth(month));
  const empty_days = Array(start_day).fill(null);

  // Group sessions by date
  const sessions_by_date = new Map<string, any[]>();
  sessions.forEach(session => {
    const date_key = format(new Date(session.date), 'yyyy-MM-dd');
    if (!sessions_by_date.has(date_key)) {
      sessions_by_date.set(date_key, []);
    }
    sessions_by_date.get(date_key)!.push(session);
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-centre text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Empty days before month starts */}
        {empty_days.map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 h-24" />
        ))}

        {/* Days of the month */}
        {days_in_month.map(day => {
          const date_key = format(day, 'yyyy-MM-dd');
          const day_sessions = sessions_by_date.get(date_key) || [];
          const is_today = isSameDay(day, new Date());

          return (
            <div
              key={date_key}
              className={`bg-white h-24 p-2 ${
                is_today ? 'ring-2 ring-blue-500 ring-inset' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-medium ${
                  is_today ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </span>

                {day_sessions.length > 0 && (
                  <Badge variant="success" className="text-xs">
                    {day_sessions.length}
                  </Badge>
                )}
              </div>

              {day_sessions.length > 0 && (
                <div className="space-y-1">
                  {day_sessions.slice(0, 2).map(session => (
                    <div
                      key={session.id}
                      className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                      title={`${session.totalSets} sets, ${session.totalVolume}kg`}
                    >
                      {session.totalSets} sets
                    </div>
                  ))}

                  {day_sessions.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{day_sessions.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Phase 6: Entry & Session Comments**

#### **Task 6.1: Add Comment API Routes**
**File:** `/src/app/api/workout/comments/route.ts`

**Enhancement:** Add comments endpoints to existing API structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/config';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// GET - Fetch comments for entry or session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentable_type = searchParams.get('type');
    const commentable_id = searchParams.get('id');

    if (!commentable_type || !commentable_id) {
      return NextResponse.json(
        { error: 'Missing type or id parameter' },
        { status: 400 }
      );
    }

    const comments = await prisma.comments.findMany({
      where: {
        commentableType: commentable_type,
        commentableId: commentable_id
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentable_type, commentable_id, content } = body;

    if (!commentable_type || !commentable_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate commentable type
    if (!['ENTRY', 'SESSION'].includes(commentable_type)) {
      return NextResponse.json(
        { error: 'Invalid commentable type' },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comments.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        commentableType: commentable_type,
        commentableId: commentable_id,
        content: content.trim()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const comment_id = searchParams.get('id');

    if (!comment_id) {
      return NextResponse.json(
        { error: 'Missing comment id' },
        { status: 400 }
      );
    }

    // Check ownership
    const comment = await prisma.comments.findUnique({
      where: { id: comment_id }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.comments.delete({
      where: { id: comment_id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
```

---

#### **Task 6.2: Add Comments UI Component**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

**Enhancement:** Add CommentsPanel component

```typescript
// Add to WorkoutLogTable.tsx

interface CommentsPanelProps {
  commentable_type: 'ENTRY' | 'SESSION';
  commentable_id: string;
}

export function CommentsPanel({ commentable_type, commentable_id }: CommentsPanelProps) {
  const [comments, set_comments] = useState<any[]>([]);
  const [new_comment, set_new_comment] = useState('');
  const [loading, set_loading] = useState(true);
  const [submitting, set_submitting] = useState(false);

  useEffect(() => {
    load_comments();
  }, [commentable_type, commentable_id]);

  async function load_comments() {
    try {
      const response = await fetch(
        `/api/workout/comments?type=${commentable_type}&id=${commentable_id}`
      );
      const data = await response.json();
      set_comments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      set_loading(false);
    }
  }

  async function handle_submit_comment() {
    if (!new_comment.trim()) return;

    set_submitting(true);
    try {
      const response = await fetch('/api/workout/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentable_type,
          commentable_id,
          content: new_comment
        })
      });

      if (response.ok) {
        set_new_comment('');
        load_comments();
        toast.success('Comment added');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      set_submitting(false);
    }
  }

  async function handle_delete_comment(comment_id: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/workout/comments?id=${comment_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        load_comments();
        toast.success('Comment deleted');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Comment input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={new_comment}
          onChange={(e) => set_new_comment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handle_submit_comment();
          }}
        />
        <Button
          onClick={handle_submit_comment}
          disabled={submitting || !new_comment.trim()}
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Post
        </Button>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-md p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-centre gap-2 mb-1">
                    {comment.users.image && (
                      <img
                        src={comment.users.image}
                        alt={comment.users.name}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {comment.users.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handle_delete_comment(comment.id)}
                  className="ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

#### **Task 6.3: Integrate Comments into Entry and Session Views**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Add comments sections to entry details and session cards

```typescript
// Add to entry detail modal (around line 900)

{/* Comments section in entry detail */}
{selected_entry && (
  <div className="mt-6 pt-6 border-t">
    <h4 className="font-semibold mb-3 flex items-centre gap-2">
      <MessageCircle className="h-4 w-4" />
      Comments
    </h4>
    <CommentsPanel
      commentable_type="ENTRY"
      commentable_id={selected_entry.id}
    />
  </div>
)}
```

**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

```typescript
// Add to SessionHistoryTable session cards (around line 200)

{/* Comments section in session card */}
{selected_session === session.id && (
  <div className="mt-4 pt-4 border-t">
    <h4 className="font-semibold mb-3 flex items-centre gap-2">
      <MessageCircle className="h-4 w-4" />
      Session Comments
    </h4>
    <CommentsPanel
      commentable_type="SESSION"
      commentable_id={session.id}
    />
  </div>
)}
```

---

## Phase 7: NASM Coaching Cues & Recommendations**

#### **Task 7.1: Display NASM Coaching Cues in Entry Form**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Show exercise-specific coaching cues from NASM

```typescript
// Add state for coaching cues (around line 75)
const [coaching_cues, set_coaching_cues] = useState<string[]>([]);

// Load coaching cues when exercise is selected
useEffect(() => {
  if (currentExerciseId) {
    load_coaching_cues();
  }
}, [currentExerciseId]);

async function load_coaching_cues() {
  try {
    const response = await fetch(
      `/api/workout/coaching-cues?exercise_id=${currentExerciseId}`
    );
    const data = await response.json();
    set_coaching_cues(data.coaching_cues || []);
  } catch (error) {
    console.error('Failed to load coaching cues:', error);
  }
}

// Add to entry form JSX (around line 920, after exercise selection)

{coaching_cues.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-centre gap-2">
      <Info className="h-4 w-4" />
      NASM Coaching Cues
    </h4>
    <ul className="space-y-1">
      {coaching_cues.map((cue, index) => (
        <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
          <span className="text-blue-600 font-bold">•</span>
          {cue}
        </li>
      ))}
    </ul>
  </div>
)}
```

---

#### **Task 7.2: Add Coaching Cues API Endpoint**
**File:** `/src/app/api/workout/coaching-cues/route.ts`

**Note:** This would normally be a new file, but we'll add it to existing API structure

```typescript
// Add to /src/app/api/workout/entries/route.ts (append to existing file)

// Add this handler function
export async function GET_COACHING_CUES(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exercise_id = searchParams.get('exercise_id');

    if (!exercise_id) {
      return NextResponse.json(
        { error: 'Missing exercise_id' },
        { status: 400 }
      );
    }

    // Get exercise details
    const exercise = await prisma.exercises.findUnique({
      where: { id: exercise_id }
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Get user's latest assessment to determine fitness level
    const latest_assessment = await prisma.assessments.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const fitness_level = latest_assessment?.fitnessLevel || 'INTERMEDIATE';

    // Get movement pattern from exercise
    const movement_pattern = exercise.primaryMuscleGroup || 'COMPOUND';

    // Get NASM coaching cues
    const coaching_cues = get_coaching_cues(movement_pattern, fitness_level);

    return NextResponse.json({ coaching_cues });
  } catch (error) {
    console.error('Error fetching coaching cues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaching cues' },
      { status: 500 }
    );
  }
}
```

---

### **Phase 8: Assessment-Based Workout Recommendations**

#### **Task 8.1: Add Workout Recommendations Panel**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Display personalised recommendations based on assessment

```typescript
// Add state for recommendations (around line 80)
const [recommendations, set_recommendations] = useState<any>(null);

// Load recommendations on mount
useEffect(() => {
  load_recommendations();
}, []);

async function load_recommendations() {
  try {
    const response = await fetch('/api/workout/recommendations');
    const data = await response.json();
    set_recommendations(data.recommendations);
  } catch (error) {
    console.error('Failed to load recommendations:', error);
  }
}

// Add recommendations panel to JSX (around line 580, after start session button)

{recommendations && (
  <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
    <CardHeader>
      <CardTitle className="text-lg flex items-centre gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        Your Personalised Recommendations
      </CardTitle>
      <CardDescription>
        Based on your {recommendations.fitness_level.toLowerCase()} fitness level
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Recommended Volume
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {recommendations.recommended_volume} sets
          </p>
          <p className="text-xs text-gray-500">per session</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Training Frequency
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {recommendations.recommended_frequency}x
          </p>
          <p className="text-xs text-gray-500">per week</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            NASM Phase
          </p>
          <p className="text-2xl font-bold text-green-600">
            {recommendations.nasm_phase}
          </p>
          <p className="text-xs text-gray-500">training focus</p>
        </div>
      </div>

      {recommendations.coaching_cues?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-sm font-semibold mb-2">Focus Areas:</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.coaching_cues.map((cue: string, index: number) => (
              <Badge key={index} variant="secondary">
                {cue}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

---

## **Phase 9: XP System & Achievements Display**

#### **Task 9.1: Add XP Progress Bar to Header**
**File:** `/src/components/layout/Header.tsx`

**Enhancement:** Show user's XP and level progress

```typescript
// Add to Header component (around line 40)

const [user_stats, set_user_stats] = useState<{
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  current_level_xp: number;
} | null>(null);

useEffect(() => {
  if (session?.user?.id) {
    load_user_stats();
  }
}, [session]);

async function load_user_stats() {
  try {
    const response = await fetch('/api/profile/stats');
    const data = await response.json();
    set_user_stats(data.stats);
  } catch (error) {
    console.error('Failed to load user stats:', error);
  }
}

// Add to Header JSX (around line 120, near user menu)

{user_stats && (
  <div className="hidden md:flex items-centre gap-3 mr-4">
    <div className="text-right">
      <p className="text-xs text-gray-500">Level {user_stats.level}</p>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
          style={{
            width: `${(user_stats.current_level_xp / user_stats.xp_to_next_level) * 100}%`
          }}
        />
      </div>
    </div>
    <div className="text-sm font-semibold text-blue-600">
      {user_stats.current_level_xp}/{user_stats.xp_to_next_level} XP
    </div>
  </div>
)}
```

---

#### **Task 9.2: Create Achievement Unlock Animation**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Add achievement celebration modal

```typescript
// Add state for achievement celebration (around line 85)
const [celebrating_achievements, set_celebrating_achievements] = useState<any[]>([]);

// Modify handle_complete_session to show achievement celebration
async function handle_complete_session() {
  if (!active_session) return;

  try {
    const response = await fetch('/api/workout/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: active_session.id,
        end_time: new Date().toISOString(),
        is_complete: true
      })
    });

    const data = await response.json();

    if (data.session) {
      // If achievements were earned, show celebration
      if (data.gamification.achievements_earned.length > 0) {
        // Load achievement details
        const achievement_response = await fetch(
          `/api/achievements?ids=${data.gamification.achievements_earned.join(',')}`
        );
        const achievement_data = await achievement_response.json();
        set_celebrating_achievements(achievement_data.achievements);
      }

      // Show XP toast
      toast.success(
        `Session complete! Earned ${data.gamification.experience_points.total} XP`,
        { duration: 5000 }
      );

      set_active_session(null);
      reload_entries();
    }
  } catch (error) {
    console.error('Failed to complete session:', error);
    toast.error('Failed to complete workout session');
  }
}

// Add celebration modal to JSX (around line 1100)

{celebrating_achievements.length > 0 && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-centre justify-centre z-50 p-4 animate-fadeIn">
    <div className="max-w-md w-full">
      {celebrating_achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          className="mb-4 animate-bounceIn"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          <Card className="border-4 border-yellow-400 shadow-2xl">
            <CardHeader className="text-centre bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <div className="text-6xl mb-2">🏆</div>
              <CardTitle className="text-2xl">Achievement Unlocked!</CardTitle>
            </CardHeader>
            <CardContent className="text-centre pt-6">
              <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
              <p className="text-gray-600 mb-4">{achievement.description}</p>
              <Badge
                variant="secondary"
                className="text-lg px-4 py-2"
                style={{ backgroundColor: achievement.iconColour }}
              >
                {achievement.tier}
              </Badge>
              <p className="mt-4 text-sm text-gray-500">
                +{achievement.experiencePoints} XP
              </p>
            </CardContent>
          </Card>
        </div>
      ))}

      <Button
        onClick={() => set_celebrating_achievements([])}
        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3"
        size="lg"
      >
        Continue
      </Button>
    </div>
  </div>
)}
```

---

#### **Task 9.3: Add Animations to CSS**
**File:** `/src/app/globals.css`

**Enhancement:** Add custom animations

```css
/* Add to end of globals.css */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-100px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-grow {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-bounceIn {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-slideUp {
  animation: slideUp 0.4s ease-out;
}

.animate-pulse-grow {
  animation: pulse-grow 2s ease-in-out infinite;
}
```

---

### **Phase 10: Personal Records & Milestone Celebrations**

#### **Task 10.1: Add PR Detection Logic**
**File:** `/src/core/database/workout-queries.ts`

**Enhancement:** Detect personal records when creating entries

```typescript
// Add to createWorkoutLogEntry function (around line 450)

export async function createWorkoutLogEntry(userId: string, data: any, coachId?: string) {
  return prisma.$transaction(async (tx) => {
    // Check for personal records
    const is_personal_record = await check_personal_record(
      userId,
      data.exerciseId,
      parseFloat(data.weight),
      data.reps
    );

    const is_volume_record = await check_volume_record(
      userId,
      data.exerciseId,
      parseFloat(data.weight) * data.reps
    );

    // Calculate training volume
    const training_volume = calculateTrainingVolume(
      data.reps,
      data.weight,
      data.setType
    );

    const entry = await tx.workout_log_entries.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        coachId,
        sessionId: data.sessionId,
        exerciseId: data.exerciseId,
        date: new Date(data.date),
        setNumber: data.setNumber,
        setType: data.setType,
        reps: data.reps,
        weight: data.weight,
        unit: data.unit,
        trainingVolume: training_volume,
        actualRPE: data.actualRPE,
        formQuality: data.formQuality,
        restDuration: data.restDuration,
        personalRecord: is_personal_record,
        volumeRecord: is_volume_record,
        updatedAt: new Date()
      },
      include: {
        exercises: true
      }
    });

    // Increment exercise usage count
    await tx.exercises.update({
      where: { id: data.exerciseId },
      data: {
        usageCount: { increment: 1 },
        updatedAt: new Date()
      }
    });

    return entry;
  });
}

async function check_personal_record(
  user_id: string,
  exercise_id: string,
  weight: number,
  reps: number
): Promise<boolean> {
  // Find max weight for this exercise at this rep count
  const max_entry = await prisma.workout_log_entries.findFirst({
    where: {
      userId: user_id,
      exerciseId: exercise_id,
      reps: reps
    },
    orderBy: {
      weight: 'desc'
    }
  });

  if (!max_entry) return true; // First time doing this exercise

  const max_weight = parseFloat(max_entry.weight);
  return weight > max_weight;
}

async function check_volume_record(
  user_id: string,
  exercise_id: string,
  volume: number
): Promise<boolean> {
  // Find max volume for this exercise
  const max_entry = await prisma.workout_log_entries.findFirst({
    where: {
      userId: user_id,
      exerciseId: exercise_id
    },
    orderBy: {
      trainingVolume: 'desc'
    }
  });

  if (!max_entry) return true;

  return volume > (max_entry.trainingVolume || 0);
}
```

---

#### **Task 10.2: Add PR Badges to Entry Display**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

**Enhancement:** Show PR badges on entries

```typescript
// Update entry rendering in WorkoutLogTable (around line 150)

{entry.personalRecord && (
  <Badge variant="destructive" className="ml-2 animate-pulse-grow">
    <Trophy className="h-3 w-3 mr-1" />
    PR
  </Badge>
)}

{entry.volumeRecord && (
  <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
    <TrendingUp className="h-3 w-3 mr-1" />
    Volume PR
  </Badge>
)}
```

---

## Phase 11: Workout Progress Widgets**

#### **Task 11.1: Add Workout Stats Widget to Dashboard**
**File:** `/src/app/dashboard/page.tsx`

**Enhancement:** Add workout statistics to main dashboard

```typescript
// Add state for workout stats (around line 50)
const [workout_stats, set_workout_stats] = useState<{
  total_sessions: number;
  total_volume: number;
  this_week_sessions: number;
  current_streak: number;
  favourite_exercise: string;
} | null>(null);

// Load workout stats
useEffect(() => {
  load_workout_stats();
}, []);

async function load_workout_stats() {
  try {
    const response = await fetch('/api/dashboard/workout-stats');
    const data = await response.json();
    set_workout_stats(data.stats);
  } catch (error) {
    console.error('Failed to load workout stats:', error);
  }
}

// Add to dashboard JSX (around line 200, after existing widgets)

{workout_stats && (
  <Card className="col-span-1 md:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-centre gap-2">
        <Dumbbell className="h-5 w-5" />
        Workout Progress
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-centre">
          <p className="text-3xl font-bold text-blue-600">
            {workout_stats.total_sessions}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total Sessions</p>
        </div>

        <div className="text-centre">
          <p className="text-3xl font-bold text-green-600">
            {(workout_stats.total_volume / 1000).toFixed(1)}
            <span className="text-lg">t</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Total Volume</p>
        </div>

        <div className="text-centre">
          <p className="text-3xl font-bold text-purple-600">
            {workout_stats.this_week_sessions}
          </p>
          <p className="text-sm text-gray-500 mt-1">This Week</p>
        </div>

        <div className="text-centre">
          <p className="text-3xl font-bold text-orange-600">
            {workout_stats.current_streak}
            <span className="text-lg">🔥</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Day Streak</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-600 mb-2">Favourite Exercise</p>
        <p className="text-lg font-semibold">{workout_stats.favourite_exercise}</p>
      </div>
    </CardContent>
    <CardFooter>
      <Link href="/workout-log" className="text-blue-600 hover:underline text-sm">
        View workout log →
      </Link>
    </CardFooter>
  </Card>
)}
```

---

#### **Task 11.2: Add Workout Stats API Endpoint**
**File:** `/src/app/api/dashboard/stats/route.ts`

**Enhancement:** Add workout statistics to existing dashboard stats endpoint

```typescript
// Add to existing dashboard stats route (around line 80)

// Calculate workout statistics
const seven_days_ago = new Date();
seven_days_ago.setDate(seven_days_ago.getDate() - 7);

const total_sessions = await prisma.workout_sessions.count({
  where: {
    userId: session.user.id,
    isComplete: true
  }
});

const sessions_aggregate = await prisma.workout_sessions.aggregate({
  where: {
    userId: session.user.id,
    isComplete: true
  },
  _sum: {
    totalVolume: true
  }
});

const this_week_sessions = await prisma.workout_sessions.count({
  where: {
    userId: session.user.id,
    isComplete: true,
    date: { gte: seven_days_ago }
  }
});

// Calculate current streak
const current_streak = await calculate_workout_streak(session.user.id);

// Find favourite exercise
const favourite_exercise = await find_favourite_exercise(session.user.id);

// Add to response
const workout_stats = {
  total_sessions,
  total_volume: sessions_aggregate._sum.totalVolume || 0,
  this_week_sessions,
  current_streak,
  favourite_exercise: favourite_exercise?.name || 'No workouts yet'
};

// Add workout_stats to existing stats object in response
```

**Add helper functions:**

```typescript
async function calculate_workout_streak(user_id: string): Promise<number> {
  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId: user_id,
      isComplete: true
    },
    orderBy: { date: 'desc' },
    select: { date: true }
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  let current_date = new Date();
  current_date.setHours(0, 0, 0, 0);

  for (const session of sessions) {
    const session_date = new Date(session.date);
    session_date.setHours(0, 0, 0, 0);

    const diff_days = Math.floor(
      (current_date.getTime() - session_date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff_days <= 1) {
      streak++;
      current_date = session_date;
    } else {
      break;
    }
  }

  return streak;
}

async function find_favourite_exercise(user_id: string) {
  const exercise_counts = await prisma.workout_log_entries.groupBy({
    by: ['exerciseId'],
    where: { userId: user_id },
    _count: { exerciseId: true },
    orderBy: { _count: { exerciseId: 'desc' } },
    take: 1
  });

  if (exercise_counts.length === 0) return null;

  const exercise = await prisma.exercises.findUnique({
    where: { id: exercise_counts[0].exerciseId }
  });

  return exercise;
}
```

---

## Phase 12: Performance Optimisation**

#### **Task 12.1: Add Data Pagination**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Paginate workout entries for better performance

```typescript
// Add pagination state (around line 90)
const [current_page, set_current_page] = useState(1);
const [total_pages, set_total_pages] = useState(1);
const ENTRIES_PER_PAGE = 50;

// Modify load entries function to support pagination
async function loadEntries() {
  setLoading(true);
  try {
    const response = await fetch(
      `/api/workout/entries?page=${current_page}&limit=${ENTRIES_PER_PAGE}&date=${selectedDate.toISOString()}`
    );
    const data = await response.json();

    setEntries(data.entries || []);
    set_total_pages(Math.ceil((data.total_count || 0) / ENTRIES_PER_PAGE));
  } catch (error) {
    console.error('Error loading entries:', error);
  } finally {
    setLoading(false);
  }
}

// Add pagination controls to JSX (around line 1050, after table)

{total_pages > 1 && (
  <div className="flex items-centre justify-between mt-6">
    <Button
      variant="outline"
      onClick={() => set_current_page(Math.max(1, current_page - 1))}
      disabled={current_page === 1}
    >
      <ChevronLeft className="h-4 w-4 mr-2" />
      Previous
    </Button>

    <span className="text-sm text-gray-600">
      Page {current_page} of {total_pages}
    </span>

    <Button
      variant="outline"
      onClick={() => set_current_page(Math.min(total_pages, current_page + 1))}
      disabled={current_page === total_pages}
    >
      Next
      <ChevronRight className="h-4 w-4 ml-2" />
    </Button>
  </div>
)}
```

---

#### **Task 12.2: Add Loading Skeletons**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

**Enhancement:** Add skeleton loaders for better UX

```typescript
// Add LoadingSkeleton component to WorkoutLogTable.tsx

export function WorkoutTableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-centre justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Use in workout-log page
{loading ? (
  <WorkoutTableSkeleton />
) : (
  <WorkoutLogTable entries={entries} />
)}
```

---

### **Phase 13: Mobile Responsiveness**

#### **Task 13.1: Optimise Mobile Entry Form**
**File:** `/src/app/workout-log/page.tsx`

**Enhancement:** Make entry form mobile-friendly

```typescript
// Update entry form modal styles (around line 850)

<div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-centre justify-centre z-50 p-0 sm:p-4">
  <Card className="w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-lg">
    <CardHeader className="sticky top-0 bg-white z-10 border-b">
      <div className="flex items-centre justify-between">
        <CardTitle>Add Workout Entry</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handle_close_form}
          className="sm:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </CardHeader>

    <CardContent className="p-4 sm:p-6">
      {/* Form fields with mobile-optimised spacing */}
      <div className="space-y-4">
        {/* ... existing form fields ... */}
      </div>
    </CardContent>

    <CardFooter className="sticky bottom-0 bg-white border-t p-4 flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        onClick={handle_close_form}
        className="w-full sm:w-auto order-2 sm:order-1"
      >
        Cancel
      </Button>
      <Button
        onClick={handleAddEntry}
        className="w-full sm:flex-1 order-1 sm:order-2 bg-green-600 hover:bg-green-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Entry
      </Button>
    </CardFooter>
  </Card>
</div>
```

---

#### **Task 13.2: Mobile-Optimised Table View**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`

**Enhancement:** Add mobile card view for entries

```typescript
// Add responsive rendering

<div className="hidden md:block">
  {/* Desktop table view */}
  <table className="w-full">
    {/* ... existing table ... */}
  </table>
</div>

<div className="md:hidden space-y-3">
  {/* Mobile card view */}
  {entries.map(entry => (
    <Card key={entry.id} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm">{entry.exercises.name}</h4>
          <p className="text-xs text-gray-500">
            Set {entry.setNumber} • {entry.setType}
          </p>
        </div>
        {entry.personalRecord && (
          <Badge variant="destructive" className="text-xs">
            <Trophy className="h-3 w-3" />
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-centre">
        <div>
          <p className="text-xs text-gray-500">Reps</p>
          <p className="font-semibold">{entry.reps}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Weight</p>
          <p className="font-semibold">{entry.weight} {entry.unit}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Volume</p>
          <p className="font-semibold">
            {entry.trainingVolume?.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1">
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  ))}
</div>
```

---

### **Phase 14: Testing & Documentation**

#### **Task 14.1: Add Test Seeds for Achievements**
**File:** `/prisma/seed.ts`

**Enhancement:** Seed database with achievement data

```typescript
// Add to existing seed.ts file

const achievements_data = [
  {
    code: 'FIRST_WORKOUT',
    name: 'First Steps',
    description: 'Complete your first workout session',
    category: 'MILESTONE',
    tier: 'BRONZE',
    experiencePoints: 100,
    iconColour: '#CD7F32',
    criteria: { type: 'MILESTONE', threshold: 1, comparison: 'EQUALS', metric: 'total_sessions' }
  },
  {
    code: 'CONSISTENT_WEEK',
    name: 'Weekly Warrior',
    description: 'Train 4+ times in one week',
    category: 'CONSISTENCY',
    tier: 'SILVER',
    experiencePoints: 250,
    iconColour: '#C0C0C0',
    criteria: { type: 'CONSISTENCY', threshold: 4, comparison: 'GREATER_THAN', metric: 'weekly_sessions' }
  },
  {
    code: 'VOLUME_KING',
    name: 'Volume King',
    description: 'Complete a session with 10,000kg+ total volume',
    category: 'VOLUME',
    tier: 'GOLD',
    experiencePoints: 500,
    iconColour: '#FFD700',
    criteria: { type: 'VOLUME', threshold: 10000, comparison: 'GREATER_THAN', metric: 'session_volume' }
  },
  {
    code: 'PERFECT_FORM',
    name: 'Technical Master',
    description: 'Complete a session with average form quality of 4.5+',
    category: 'TECHNIQUE',
    tier: 'PLATINUM',
    experiencePoints: 1000,
    iconColour: '#E5E4E2',
    criteria: { type: 'TECHNIQUE', threshold: 4.5, comparison: 'GREATER_THAN', metric: 'avg_form_quality' }
  },
  {
    code: 'CENTURY_CLUB',
    name: 'Century Club',
    description: 'Complete 100 workout sessions',
    category: 'MILESTONE',
    tier: 'PLATINUM',
    experiencePoints: 2500,
    iconColour: '#E5E4E2',
    criteria: { type: 'MILESTONE', threshold: 100, comparison: 'EQUALS', metric: 'total_sessions' }
  }
];

// Seed achievements
for (const achievement of achievements_data) {
  await prisma.achievements.upsert({
    where: { code: achievement.code },
    update: {},
    create: {
      id: crypto.randomUUID(),
      ...achievement
    }
  });
}

console.log('✅ Seeded achievements');
```

---

#### **Task 14.2: Update API Documentation Comments**
**File:** `/src/app/api/workout/sessions/route.ts`

**Enhancement:** Add comprehensive JSDoc comments

```typescript
/**
 * Workout Sessions API
 *
 * Manages workout session lifecycle including creation, completion,
 * and gamification (XP and achievements).
 *
 * @route GET  /api/workout/sessions - Fetch sessions (supports filtering)
 * @route POST /api/workout/sessions - Create new session
 * @route PATCH /api/workout/sessions - Complete session (triggers gamification)
 * @route DELETE /api/workout/sessions - Delete session
 */

/**
 * GET /api/workout/sessions
 *
 * Query Parameters:
 * - status: 'active' | 'complete' - Filter by completion status
 * - start: ISO date string - Filter sessions after this date
 * - end: ISO date string - Filter sessions before this date
 * - page: number - Pagination page number
 * - limit: number - Results per page
 *
 * Returns:
 * - sessions: WorkoutSession[] - Array of session objects
 * - total_count: number - Total sessions matching filters
 * - active_session: WorkoutSession | null - Current active session if exists
 */

/**
 * POST /api/workout/sessions
 *
 * Request Body:
 * - assessment_id: string (optional) - Link to fitness assessment
 * - start_time: ISO date string - Session start time
 *
 * Returns:
 * - session: WorkoutSession - Created session object
 * - recommendations: object (optional) - NASM-based recommendations if assessment linked
 */

/**
 * PATCH /api/workout/sessions
 *
 * Request Body:
 * - session_id: string - ID of session to complete
 * - end_time: ISO date string - Session end time
 * - is_complete: boolean - Mark as complete (triggers gamification)
 * - performance_rating: number (optional) - User's 1-5 star rating
 * - session_notes: string (optional) - User notes about session
 *
 * Returns:
 * - session: WorkoutSession - Updated session object
 * - gamification: object - XP breakdown and achievements earned
 *   - experience_points: ExperiencePointsBreakdown
 *   - achievements_earned: string[] - Array of achievement IDs
 */
```

---

## **IMPLEMENTATION CHECKLIST**

### **Phase 1: Foundation (Weeks 1-2)** ✅
- [ ] Run Prisma migration for new fields
- [ ] Add NASM knowledge parsing functions
- [ ] Implement assessment integration service
- [ ] Create AI data pipeline functions
- [ ] Build gamification architecture
- [ ] Test XP calculation logic
- [ ] Test achievement detection

### **Phase 2: Core Features (Weeks 3-5)** ✅
- [ ] Add session creation UI
- [ ] Implement active session tracking
- [ ] Link entries to sessions
- [ ] Add performance tracking fields (RPE, form quality, rest)
- [ ] Create session history view
- [ ] Build calendar view
- [ ] Test session lifecycle

### **Phase 3: Comments (Week 6)** ✅
- [ ] Create comments API routes
- [ ] Build CommentsPanel component
- [ ] Integrate comments into entries
- [ ] Integrate comments into sessions
- [ ] Test comment CRUD operations

### **Phase 4: NASM & Assessment (Weeks 7-8)** ✅
- [ ] Display coaching cues in entry form
- [ ] Create coaching cues API
- [ ] Build recommendations panel
- [ ] Link recommendations to assessments
- [ ] Test NASM knowledge integration

### **Phase 5: Gamification UI (Weeks 9-10)** ✅
- [ ] Add XP progress bar to header
- [ ] Create achievement unlock animation
- [ ] Implement PR detection
- [ ] Add PR badges to entries
- [ ] Test gamification flow end-to-end

### **Phase 6: Dashboard (Week 11)** ✅
- [ ] Add workout stats widget
- [ ] Create workout stats API endpoint
- [ ] Calculate streak logic
- [ ] Find favourite exercise
- [ ] Test dashboard integration

### **Phase 7: Polish (Weeks 12-14)** ✅
- [ ] Implement pagination
- [ ] Add loading skeletons
- [ ] Optimise mobile responsiveness
- [ ] Test on multiple devices
- [ ] Seed achievements data
- [ ] Document all API endpoints
- [ ] Final QA testing

---

## **SUCCESS METRICS**

### **Technical Metrics**
- [ ] Zero TypeScript errors
- [ ] All Prisma queries use snake_case
- [ ] All text in British English
- [ ] Mobile responsive (tested on iPhone & Android)
- [ ] Page load < 2 seconds
- [ ] No new files created (only enhancements)

### **Feature Completeness**
- [ ] Users can start/complete workout sessions
- [ ] Entries automatically link to active sessions
- [ ] XP awarded on session completion
- [ ] Achievements unlock automatically
- [ ] Comments work on entries and sessions
- [ ] Calendar shows workout history
- [ ] Dashboard displays workout progress
- [ ] NASM coaching cues display for exercises
- [ ] Assessment-based recommendations shown
- [ ] Personal records detected and celebrated

### **User Experience**
- [ ] Smooth animations and transitions
- [ ] Clear feedback on all actions
- [ ] Engaging gamification elements
- [ ] Intuitive navigation
- [ ] Helpful coaching cues
- [ ] Mobile-friendly interface

---

## **MAINTENANCE NOTES**

### **Database Maintenance**
- Run `npx prisma migrate dev` after schema changes
- Run `npx prisma generate` after Prisma Client updates
- Seed achievements: `npx prisma db seed`

### **Code Organisation**
- All workout queries: `/src/core/database/workout-queries.ts`
- All UI components: `/src/components/workout-log/`
- All API routes: `/src/app/api/workout/`
- Main page: `/src/app/workout-log/page.tsx`

### **British English Checker**
Watch for American spellings:
- ❌ behavior → ✅ behaviour
- ❌ color → ✅ colour
- ❌ center → ✅ centre
- ❌ optimize → ✅ optimise
- ❌ analyze → ✅ analyse

### **snake_case Checker**
All database fields and function names:
- ✅ `workout_sessions`, `active_session`, `set_active_session`
- ❌ `workoutSessions`, `activeSession`, `setActiveSession`

---

## **IMPLEMENTATION STATUS UPDATE**
**Last Updated:** Session continuation after context reset
**Progress:** Phases 1-9 Complete | Phases 10-14 Remaining

### **✅ COMPLETED PHASES (This Session)**

#### **Phase 6: Entry & Session Comments System** ✅
- **Task 6.1:** Comment API Routes - COMPLETE
  - File: `/src/app/api/workout/comments/route.ts`
  - Features: GET (fetch comments), POST (create), DELETE (remove)
  - Supports both ENTRY and SESSION comment types
  - Full authentication and authorization

- **Task 6.2:** CommentsPanel Component - COMPLETE
  - File: `/src/components/workout-log/WorkoutLogTable.tsx` (lines 1009-1160)
  - Features: Real-time comment loading, submission, deletion
  - User avatars and timestamps with formatDistanceToNow
  - Alert-based feedback (toast system not used)

- **Task 6.3:** Comments Integration - COMPLETE
  - File: `/src/app/workout-log/page.tsx` (line 1295-1304)
  - File: `/src/components/workout-log/WorkoutLogTable.tsx` (lines 875-887)
  - Entry detail comments: Integrated in workout-log page
  - Session card comments: Integrated in SessionHistoryTable

#### **Phase 7: NASM Coaching Cues & Recommendations** ✅
- **Task 7.1:** Display NASM Coaching Cues - COMPLETE
  - File: `/src/app/workout-log/page.tsx` (lines 78, 214-231, 881-897)
  - State management for coaching_cues
  - useEffect hook loads cues when exercise selected
  - UI displays in blue info box with bullet points

- **Task 7.2:** Coaching Cues API Endpoint - COMPLETE
  - File: `/src/app/api/workout/coaching-cues/route.ts` (NEW FILE)
  - Helper function: get_coaching_cues() with pattern-based cue mapping
  - Patterns: COMPOUND, ISOLATION, PUSH, PULL, LEGS
  - Fitness levels: BEGINNER, INTERMEDIATE, ADVANCED
  - 4-5 specific cues per movement/level combination

#### **Phase 8: Assessment-Based Workout Recommendations** ✅
- **Task 8.1:** Workout Recommendations Panel - COMPLETE
  - File: `/src/app/workout-log/page.tsx` (lines 79, 233-246, 775-834)
  - State: recommendations with fitness_level, recommended_volume, frequency, nasm_phase
  - UI: Purple/blue gradient card with 3-column grid
  - Displays: Volume (sets/session), Frequency (x/week), NASM Phase
  - Focus areas shown as badges

#### **Phase 9: XP System & Achievements Display** ✅
- **Task 9.1:** XP Progress Bar in Header - COMPLETE
  - File: `/src/components/layout/Header.tsx` (lines 52-73, 230-248)
  - State: user_stats (total_xp, level, xp_to_next_level, current_level_xp)
  - Loads from `/api/profile/stats`
  - Progress bar with gradient (blue to purple)
  - Shows level and XP fraction (e.g., "450/1000 XP")

- **Task 9.2:** Achievement Unlock Animation - COMPLETE
  - File: `/src/app/workout-log/page.tsx` (lines 81, 399-441, 1690-1732)
  - State: celebrating_achievements array
  - Triggers on session completion with achievements
  - Fetches achievement details from `/api/achievements?ids=...`
  - Full-screen modal with trophy icon, achievement details
  - Staggered animation with 200ms delay per achievement

- **Task 9.3:** Achievement Badge CSS Animations - COMPLETE
  - File: `/src/app/globals.css` (lines 273-297)
  - Animations: fadeIn, bounceIn, slideUp, pulse-grow
  - Classes: .animate-fadeIn, .animate-bounceIn, .animate-slideUp, .animate-pulse-grow
  - Cubic-bezier timing for smooth bounceIn effect

---

## **📋 TODAY'S REMAINING IMPLEMENTATION PLAN**
**Target:** Complete Phases 10-14 (5 phases, ~10 tasks)
**Estimated Time:** 4-6 hours

### **PHASE 10: Personal Records & Milestone Celebrations** 🎯
**Priority:** HIGH | **Estimated Time:** 60-90 minutes

#### **Task 10.1: Add PR Detection Logic**
**File:** `/src/core/database/workout-queries.ts`
**Implementation Steps:**
1. Add helper functions at end of file:
   ```typescript
   async function check_personal_record(userId, exerciseId, weight, reps)
   async function check_volume_record(userId, exerciseId, volume)
   ```
2. Modify `createWorkoutLogEntry()` to:
   - Call PR detection before creating entry
   - Set `personalRecord: true` if PR detected
   - Set `volumeRecord: true` if volume PR
3. Add badge/indicator field to entry data

**Acceptance Criteria:**
- ✓ Weight PRs detected (highest weight for same exercise/reps)
- ✓ Volume PRs detected (weight × reps)
- ✓ Database field `personalRecord` set correctly
- ✓ No performance impact (single query)

#### **Task 10.2: Display PR Badges in UI**
**File:** `/src/app/workout-log/page.tsx`
**Implementation Steps:**
1. Update entry cards to show PR badge when `entry.personalRecord === true`
2. Add trophy/star icon with "PR!" label
3. Add gold/yellow styling for PR entries
4. Optional: Add celebration confetti animation on new PR

**Acceptance Criteria:**
- ✓ PR badge visible on entry cards
- ✓ Distinct visual styling (gold/yellow)
- ✓ Icon clearly indicates personal record

---

### **PHASE 11: Workout Progress Widgets** 📊
**Priority:** HIGH | **Estimated Time:** 60-90 minutes

#### **Task 11.1: Create Workout Stats Widget**
**File:** `/src/app/dashboard/page.tsx`
**Implementation Steps:**
1. Create stats calculation function:
   ```typescript
   async function load_workout_stats() {
     // Calculate: total sessions, total volume, avg session duration
     // Last 7 days vs previous 7 days comparison
   }
   ```
2. Add widget to dashboard with:
   - Total workout sessions (last 30 days)
   - Total volume lifted (kg)
   - Average session duration
   - Trend indicators (↑ up/↓ down)

**Acceptance Criteria:**
- ✓ Stats load on dashboard mount
- ✓ Shows last 30 days data
- ✓ Trend comparison with previous period
- ✓ Loading state while fetching

#### **Task 11.2: Add Stats API Endpoint**
**File:** `/src/app/api/dashboard/stats/route.ts`
**Implementation Steps:**
1. Create GET endpoint returning:
   ```json
   {
     "stats": {
       "total_sessions": 12,
       "total_volume": 45000,
       "avg_duration_minutes": 65,
       "trend_sessions": "+15%",
       "trend_volume": "+8%"
     }
   }
   ```
2. Query last 30 days and previous 30 days
3. Calculate percentage changes

**Acceptance Criteria:**
- ✓ Returns workout stats for user
- ✓ Includes trend calculations
- ✓ Handles users with no workouts gracefully
- ✓ Response time < 500ms

---

### **PHASE 12: Performance Optimisation** ⚡
**Priority:** MEDIUM | **Estimated Time:** 45-60 minutes

#### **Task 12.1: Add Data Pagination**
**File:** `/src/app/api/workout/entries/route.ts`
**Implementation Steps:**
1. Add pagination params to GET endpoint:
   - `page` (default: 1)
   - `limit` (default: 50)
2. Modify query to use `skip` and `take`
3. Return pagination metadata:
   ```json
   {
     "entries": [...],
     "pagination": {
       "page": 1,
       "limit": 50,
       "total": 250,
       "total_pages": 5
     }
   }
   ```

**Acceptance Criteria:**
- ✓ Supports page and limit parameters
- ✓ Returns pagination metadata
- ✓ Default limit prevents huge queries
- ✓ Works with existing UI

#### **Task 12.2: Add Loading Skeletons**
**File:** `/src/app/workout-log/page.tsx`
**Implementation Steps:**
1. Create skeleton component for entry cards
2. Show during `fetchingEntries === true`
3. Use Tailwind `animate-pulse` for shimmer effect
4. Match actual entry card dimensions

**Acceptance Criteria:**
- ✓ Skeleton shows while loading
- ✓ Smooth transition to actual content
- ✓ Prevents layout shift
- ✓ Visually matches entry cards

---

### **PHASE 13: Mobile Responsiveness** 📱
**Priority:** MEDIUM | **Estimated Time:** 45-60 minutes

#### **Task 13.1: Optimise Entry Form for Mobile**
**File:** `/src/app/workout-log/page.tsx`
**Implementation Steps:**
1. Update grid classes from `grid-cols-3` to responsive:
   ```tsx
   className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
   ```
2. Make exercise search full-width on mobile
3. Stack RPE/Form Quality sliders vertically on mobile
4. Enlarge touch targets for buttons (min 44px)

**Acceptance Criteria:**
- ✓ Form usable on 375px width (iPhone SE)
- ✓ All inputs accessible with thumb
- ✓ No horizontal scroll
- ✓ Text readable without zoom

#### **Task 13.2: Optimise Table View for Mobile**
**File:** `/src/components/workout-log/WorkoutLogTable.tsx`
**Implementation Steps:**
1. Convert entry cards to stacked layout on mobile
2. Hide less important fields on small screens
3. Make session cards single-column on mobile
4. Ensure calendar view works on mobile

**Acceptance Criteria:**
- ✓ Entry cards display well on mobile
- ✓ Session history readable on mobile
- ✓ Calendar navigable on touchscreen
- ✓ No text overflow or truncation issues

---

### **PHASE 14: Testing & Documentation** ✅
**Priority:** LOW | **Estimated Time:** 30-45 minutes

#### **Task 14.1: Create Test Data Seeds**
**File:** `/prisma/seed.ts` (or new seed script)
**Implementation Steps:**
1. Create seed function for workout data:
   - 3 sample workout sessions
   - 15-20 workout entries across sessions
   - Mix of exercises, set types, weights
   - Some PRs, some regular entries
   - Comments on entries and sessions
2. Include various achievement unlocks
3. Different fitness levels in assessments

**Acceptance Criteria:**
- ✓ Seed creates realistic workout data
- ✓ Covers all major features
- ✓ Can run multiple times (idempotent)
- ✓ Easy to reset for testing

#### **Task 14.2: Document API Endpoints**
**File:** `/docs/WORKOUT_API.md` (new or update existing)
**Implementation Steps:**
1. Document all workout-related endpoints:
   - `/api/workout/entries` (GET, POST, PATCH, DELETE)
   - `/api/workout/sessions` (GET, POST, PATCH, DELETE)
   - `/api/workout/comments` (GET, POST, DELETE)
   - `/api/workout/coaching-cues` (GET)
   - `/api/workout/recommendations` (GET)
   - `/api/dashboard/stats` (GET)
2. Include request/response examples
3. List required authentication

**Acceptance Criteria:**
- ✓ All endpoints documented
- ✓ Request/response formats clear
- ✓ Authentication requirements noted
- ✓ Example payloads provided

---

## **IMPLEMENTATION ORDER FOR TODAY**

### **Morning Session (2-3 hours)**
1. ✅ **Phase 10.1:** PR Detection Logic (45 min)
2. ✅ **Phase 10.2:** PR Badges UI (30 min)
3. ✅ **Phase 11.1:** Workout Stats Widget (45 min)
4. ✅ **Phase 11.2:** Stats API Endpoint (30 min)

**Break** ☕

### **Afternoon Session (2-3 hours)**
5. ✅ **Phase 12.1:** Data Pagination (30 min)
6. ✅ **Phase 12.2:** Loading Skeletons (30 min)
7. ✅ **Phase 13.1:** Mobile Entry Form (30 min)
8. ✅ **Phase 13.2:** Mobile Table View (30 min)
9. ✅ **Phase 14.1:** Test Data Seeds (20 min)
10. ✅ **Phase 14.2:** API Documentation (25 min)

**Final Testing** 🧪

---

## **COMPLETION CHECKLIST FOR TODAY**

### **Phase 10: PR Detection**
- [ ] PR detection function added to workout-queries.ts
- [ ] Volume PR detection implemented
- [ ] PR badge showing on entry cards
- [ ] Gold styling applied to PR entries

### **Phase 11: Dashboard Widgets**
- [ ] Workout stats widget on dashboard
- [ ] Stats API endpoint created
- [ ] Trend indicators working
- [ ] Loading states implemented

### **Phase 12: Performance**
- [ ] Pagination added to entries API
- [ ] Pagination metadata returned
- [ ] Loading skeletons created
- [ ] Smooth loading transitions

### **Phase 13: Mobile**
- [ ] Entry form responsive (375px+)
- [ ] Table view mobile-optimized
- [ ] Touch targets enlarged
- [ ] No horizontal scroll

### **Phase 14: Testing & Docs**
- [ ] Seed data script created
- [ ] API endpoints documented
- [ ] Test scenarios covered
- [ ] README updated

---

**END OF IMPLEMENTATION PLAN**
