# Massimino Program Implementation Standard

**Version:** 1.0
**Last Updated:** 2025-12-04
**Author:** Victor Solé Ferioli

---

## Overview

This document establishes the standard structure, required fields, and best practices for all training program templates in Massimino. The goal is to ensure consistency across all programs while allowing flexibility for different program types.

---

## Template Categories

### 1. **Celebrity/Athlete Programs**
- Examples: `cbum.json`, `arnold_golden_six.json`, `ronnie_coleman_volume.json`, `colorado_experiment.json`
- Include athlete biographical info, training philosophy, historical context
- Attribution and credibility are key

### 2. **Goal-Based Programs**
- Examples: `fat-loss.json`, `muscle-gain.json`, `performance.json`
- Focus on outcome goals and methodologies (OPT Model, periodization)
- Clear expectations of what the program can and cannot achieve

### 3. **Lifestyle/Special Population Programs**
- Examples: `i_just_became_a_mum.json`, `i_just_became_a_dad.json`, `bye_stress_bye.json`, `i_dont_have_much_time.json`
- Medical prerequisites and red flags are critical
- Modifications and safety considerations front and center

### 4. **Sport-Specific Programs**
- Examples: `sports_conditioning/*.json`, `castellers.json`
- Sport-specific demands analysis
- Position/role variations where applicable
- Performance testing protocols specific to the sport

### 5. **Training Modality Programs**
- Examples: `flexibility_workout.json`, `balance_workout.json`, `plyometric_workout.json`, `cardio_workout.json`
- Focus on specific training adaptations
- Integration with other training types

---

## Standard JSON Structure

All programs MUST include the following sections. Optional sections are marked with `[OPTIONAL]`.

```json
{
  "seo": { ... },                           // REQUIRED - Social media sharing
  "metadata": { ... },                      // REQUIRED - Program identification
  "program_philosophy": { ... },            // REQUIRED - Training approach
  "prerequisites": { ... },                 // REQUIRED - Safety requirements
  "goals": { ... },                         // REQUIRED - What to expect
  "weekly_structure": [ ... ],              // REQUIRED - Program content
  "workout_sessions": [ ... ],              // REQUIRED - Detailed workouts
  "progression_strategy": { ... },          // REQUIRED - How to progress
  "exercise_modifications": { ... },        // [OPTIONAL] - Alternatives
  "nutrition_guidelines": { ... },          // [OPTIONAL] - Diet recommendations
  "recovery_protocols": { ... },            // [OPTIONAL] - Recovery guidance
  "progress_tracking": { ... },             // REQUIRED - How to measure success
  "implementation_for_massimino": { ... }   // REQUIRED - Platform integration
}
```

---

## Section Specifications

### 1. SEO Metadata (REQUIRED - NEW)

**Purpose:** Enable rich social media sharing on Instagram, TikTok, Twitter, Facebook, and search engines.

```json
"seo": {
  "title": "Program Name | Massimino Fitness",
  "description": "Compelling 150-160 character description for search results and social shares",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "og": {
    "title": "Social-optimized title (shorter, punchier)",
    "description": "Social description - can be more casual/engaging",
    "image": "/images/programs/program-name-og.jpg",
    "image_alt": "Description of the image for accessibility",
    "type": "article"
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Twitter-optimized title (max 70 chars)",
    "description": "Twitter description (max 200 chars)",
    "image": "/images/programs/program-name-twitter.jpg"
  },
  "schema": {
    "type": "Course",
    "provider": "Massimino Fitness",
    "duration": "P6W",
    "difficulty": "Intermediate"
  },
  "canonical_url": "/programs/program-slug",
  "hashtags": ["#MassiminoFitness", "#ProgramName", "#TrainingGoal"],
  "share_text": {
    "instagram": "Short caption for IG stories/reels sharing (with emojis allowed)",
    "tiktok": "TikTok caption format with trending hashtags",
    "twitter": "Tweet-ready share text under 280 chars"
  }
}
```

**Image Requirements:**
- OG Image: 1200x630px (Facebook, LinkedIn optimal)
- Twitter Image: 1200x600px or 1:1 ratio
- Format: JPG or PNG, under 8MB
- Include program name, Massimino branding, compelling visual

---

### 2. Metadata (REQUIRED)

```json
"metadata": {
  "program_name": "Full Program Name",
  "program_id": "kebab-case-unique-identifier",
  "author": "Creator Name",
  "version": "1.0",
  "creation_date": "YYYY-MM-DD",
  "last_updated": "YYYY-MM-DD",
  "description": "2-3 sentence description of program purpose and approach",
  "goal": "Primary Goal (e.g., Fat Loss, Muscle Gain, Strength, Sport Performance)",
  "methodology": "Training system used (OPT Model, PPL, Full Body, etc.)",
  "target_audience": "Who this is for (Beginners, Postpartum, Athletes, etc.)",
  "level": "Beginner | Intermediate | Advanced | Sport-Specific",
  "settings": ["Home", "Gym", "Outdoor", "Minimal Equipment"],
  "duration_weeks": 6,
  "total_workouts": 24,
  "frequency_per_week": 4,
  "session_duration_minutes": {
    "min": 30,
    "max": 45,
    "includes": "Warm-up and cool-down"
  },
  "equipment": {
    "required": ["List of essential equipment"],
    "recommended": ["Nice to have"],
    "optional": ["Can enhance but not necessary"]
  },
  "tags": ["tag1", "tag2", "tag3"]
}
```

---

### 3. Program Philosophy (REQUIRED)

```json
"program_philosophy": {
  "origin": "Background/history of the program or methodology",
  "core_principles": [
    "Principle 1: Explanation",
    "Principle 2: Explanation"
  ],
  "training_approach": "Overall strategy and rationale",
  "differentiator": "What makes this program unique",
  "quote": "[OPTIONAL] Inspirational quote from program author or athlete"
}
```

**For Celebrity Programs, add:**
```json
"athlete_info": {
  "name": "Full Name",
  "nickname": "Known As",
  "achievements": "Key accomplishments",
  "era": "Training era (e.g., Golden Era Bodybuilding)",
  "training_philosophy": "Their approach in their own words"
}
```

---

### 4. Prerequisites (REQUIRED)

```json
"prerequisites": {
  "required": [
    "Medical clearance from healthcare provider",
    "Basic movement competency"
  ],
  "recommended": [
    "Movement screening",
    "Baseline fitness assessment"
  ],
  "do_not_start_if": [
    "Clear contraindications that should prevent starting"
  ],
  "consult_doctor_if": [
    "Conditions requiring medical consultation first"
  ]
},
"red_flags_to_stop": [
  "Sharp joint pain",
  "Chest pain or pressure",
  "Severe dizziness",
  "Specific condition-related warning signs"
]
```

**For Special Populations (postpartum, medical conditions, seniors):**
Prerequisites section is CRITICAL and must be comprehensive.

---

### 5. Goals (REQUIRED)

```json
"goals": {
  "primary_goal": "Main outcome of the program",
  "outcome_goals": [
    "Specific measurable outcomes"
  ],
  "what_program_can_do": [
    "Realistic achievements"
  ],
  "what_program_cannot_do": [
    "Setting realistic expectations"
  ],
  "realistic_outcomes": {
    "week_4": ["Milestone 1", "Milestone 2"],
    "week_8": ["Milestone 3", "Milestone 4"],
    "week_12": ["Final outcomes"]
  },
  "safety_goal": "Primary safety focus (especially for special populations)"
}
```

---

### 6. Weekly Structure (REQUIRED)

```json
"weekly_structure": [
  {
    "week": 1,
    "phase": "Phase Name (if applicable)",
    "theme": "Week's Focus Theme",
    "focus": "Primary training focus for this week",
    "volume_intensity": "Sets x Reps @ %intensity or RPE",
    "key_adaptations": ["What the body is adapting to"],
    "workouts": [
      {
        "day": 1,
        "name": "Workout Name",
        "focus": "Primary focus",
        "duration_minutes": 45
      }
    ]
  }
]
```

**Alternative for recurring weekly schedules:**
```json
"weekly_schedule": {
  "monday": "Workout A",
  "tuesday": "Rest or Active Recovery",
  "wednesday": "Workout B",
  "thursday": "Rest",
  "friday": "Workout A",
  "saturday": "Workout B",
  "sunday": "Complete Rest"
}
```

---

### 7. Workout Sessions (REQUIRED)

```json
"workout_sessions": [
  {
    "workout_id": "unique-workout-id",
    "name": "Workout Name",
    "week": 1,
    "day": 1,
    "focus": "Primary focus",
    "duration_minutes": 45,
    "sections": [
      {
        "section_name": "warm_up",
        "duration_minutes": 5,
        "description": "Purpose of this section",
        "exercises": [
          {
            "exercise_name": "Exercise Name",
            "exercise_id": "massimino-exercise-id",
            "sets": 2,
            "reps": 10,
            "duration_seconds": null,
            "tempo": "2-0-2-0",
            "rest_seconds": 30,
            "intensity": "Light",
            "notes": "Form cues and coaching points",
            "modification": "Easier alternative",
            "progression": "Harder alternative"
          }
        ]
      },
      {
        "section_name": "resistance_training",
        "exercises": [ ... ]
      },
      {
        "section_name": "cool_down",
        "exercises": [ ... ]
      }
    ]
  }
]
```

**Standard Sections (in order):**
1. `warm_up` - Prepare body, elevate HR, mobilize joints
2. `activation` - Core activation, movement prep
3. `skill_development` - Plyometrics, SAQ, skill work (if applicable)
4. `resistance_training` - Main strength/hypertrophy work
5. `conditioning` - Cardio/metabolic work (if applicable)
6. `cool_down` - Lower HR, static stretching, recovery

---

### 8. Exercise Integration with Massimino Database (NEW)

**Purpose:** Link exercises to Massimino's exercise database for media display.

```json
{
  "exercise_name": "Barbell Back Squat",
  "exercise_id": "barbell-back-squat",
  "massimino_exercise_id": "uuid-from-exercise-database",
  "media": {
    "thumbnail_url": "auto",
    "video_url": "auto",
    "image_url": "auto"
  }
}
```

**When `exercise_id` matches a Massimino database exercise:**
- The UI should automatically display `imageUrl` from the Exercise table
- The UI should link to `videoUrl` if available
- If no match, display exercise name only (no broken images)

**Exercise ID Matching Strategy:**
1. Exact match on `exercise_id` field
2. Fuzzy match on `exercise_name` to database `name` or `aliasNames`
3. Manual mapping in `implementation_for_massimino.exercise_mappings`

---

### 9. Progression Strategy (REQUIRED)

```json
"progression_strategy": {
  "primary_method": "How to progress (Linear, Double Progression, etc.)",
  "when_to_progress": "Criteria for increasing difficulty",
  "how_to_progress": [
    "Increase weight by 2.5-5kg",
    "Add reps when top of range achieved",
    "Reduce rest periods",
    "Progress to harder variation"
  ],
  "weekly_progression": {
    "week_1": "Focus on form, lighter weights",
    "week_2": "Full range of motion",
    "week_3": "Add 2 reps per exercise"
  },
  "autoregulation": "How to adjust based on daily readiness",
  "deload_protocol": {
    "frequency": "Every 4-6 weeks",
    "method": "50% volume reduction",
    "duration": "1 week"
  },
  "stalling_protocol": "What to do when progress stalls"
}
```

---

### 10. Exercise Modifications (OPTIONAL but recommended)

```json
"exercise_modifications": {
  "push_ups": {
    "level_1": "Wall push-ups",
    "level_2": "Incline push-ups",
    "level_3": "Knee push-ups",
    "level_4": "Full push-ups",
    "level_5": "Decline/weighted push-ups",
    "progression_rule": "Progress when 15 reps with good form"
  },
  "low_impact_alternatives": {
    "jump_squats": "Fast bodyweight squats",
    "burpees": "Step-back burpees",
    "high_knees": "Marching in place"
  }
}
```

---

### 11. Progress Tracking (REQUIRED)

```json
"progress_tracking": {
  "tracking_metrics": [
    "Body weight",
    "Circumference measurements",
    "Progress photos",
    "Strength numbers",
    "Energy levels",
    "Sleep quality"
  ],
  "baseline_assessment": {
    "before_starting": [
      "Max reps push-ups",
      "Max reps squats",
      "Waist circumference"
    ]
  },
  "check_in_frequency": "Weekly",
  "milestone_goals": {
    "week_4": ["Goal 1", "Goal 2"],
    "week_8": ["Goal 3", "Goal 4"],
    "program_end": ["Final goals"]
  },
  "success_criteria": "How to know the program worked"
}
```

---

### 12. Implementation for Massimino (REQUIRED)

```json
"implementation_for_massimino": {
  "usage": "How trainers/AI should use this template",
  "customization_points": [
    "Fields that should be personalized per user"
  ],
  "exercise_mappings": {
    "template_exercise_name": "massimino_exercise_id"
  },
  "ai_trainer_guidelines": "How the AI should present and adapt this program",
  "template_data_requirements": {
    "required_for_display": ["workout_sessions", "weekly_structure"],
    "optional_enhancements": ["athlete_info", "nutrition_guidelines"]
  }
}
```

---

## Sport-Specific Program Additions

For programs in `sports_conditioning/`, add:

```json
"sport_demands": {
  "sport": "Sport Name",
  "key_physical_qualities": [
    "Speed", "Agility", "Power", "Endurance"
  ],
  "common_injuries": [
    "ACL injuries", "Ankle sprains"
  ],
  "energy_systems": {
    "primary": "Aerobic | Anaerobic | Mixed",
    "work_rest_ratios": "e.g., 1:3 for basketball"
  },
  "positional_demands": {
    "position_name": {
      "focus": "Position-specific needs",
      "modifications": "How training differs"
    }
  }
},
"performance_testing": {
  "tests": [
    {
      "test_name": "Vertical Jump",
      "frequency": "Every 4 weeks",
      "benchmarks": {
        "beginner": "< 20 inches",
        "intermediate": "20-26 inches",
        "advanced": "> 26 inches"
      }
    }
  ]
},
"in_season_modifications": {
  "volume_reduction": "50-60% of off-season",
  "focus": "Maintenance, not gains",
  "game_day_protocols": "Training around competitions"
}
```

---

## Validation Checklist

Before submitting a new program template, verify:

### Required Fields
- [ ] `seo` section with all social media metadata
- [ ] `metadata` with program_id, duration, frequency
- [ ] `program_philosophy` with core principles
- [ ] `prerequisites` with safety requirements
- [ ] `red_flags_to_stop` for all programs
- [ ] `goals` with realistic expectations
- [ ] `weekly_structure` or `weekly_schedule`
- [ ] `workout_sessions` with full exercise details
- [ ] `progression_strategy`
- [ ] `progress_tracking` with measurable metrics
- [ ] `implementation_for_massimino`

### Quality Standards
- [ ] All exercises have `exercise_id` for database linking
- [ ] Tempo notation is consistent (e.g., 2-0-2-0)
- [ ] Rest periods are in seconds
- [ ] Duration is in minutes
- [ ] Weights reference % of max or RPE/RIR
- [ ] Modifications provided for compound movements
- [ ] Form cues in exercise notes
- [ ] No unrealistic promises in goals

### SEO/Social Requirements
- [ ] OG image path specified (image must exist)
- [ ] Twitter card configured
- [ ] Share text for IG/TikTok/Twitter
- [ ] Relevant hashtags included
- [ ] Description under 160 characters

---

## Migration Plan for Existing Templates

### Priority 1: Add SEO to all templates
1. Create OG images for each program
2. Add `seo` section to all 34 templates
3. Configure social sharing text

### Priority 2: Standardize exercise IDs
1. Map all exercise names to Massimino database IDs
2. Add `exercise_id` field to all exercises
3. Create fallback for unmatched exercises

### Priority 3: Implement sports_conditioning templates
1. Complete all 8 templates following sport-specific additions
2. Add position-specific modifications
3. Include performance testing protocols

### Priority 4: UI Integration
1. Display exercise media from database
2. Implement social sharing buttons
3. Generate meta tags dynamically

---

## File Naming Convention

All template files must use:
- **snake_case** for file names
- Descriptive, goal-oriented names
- Category prefix for grouped templates

Examples:
- `fat_loss.json` (not `fat-loss.json`)
- `i_just_became_a_mum.json`
- `sports_conditioning/basketball_conditioning_workout.json`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-04 | Initial standard established |

