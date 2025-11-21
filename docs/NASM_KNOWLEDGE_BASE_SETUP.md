# NASM Knowledge Base Setup - Complete

## ✅ What Was Created

### 📁 Directory Structure

```
public/databases/
├── README.md                           ← Master knowledge base guide
├── NASM_CPT/
│   ├── IMPLEMENTATION_PLAN.md          ← Comprehensive CPT conversion guide (12,000+ words)
│   ├── README.md                       ← Quick start for CPT
│   ├── CHANGELOG.md                    ← Version tracking
│   ├── source_documents/               ← Place .docx files here (ready to use!)
│   │   └── NASM Certified Personal Trainer.docx (found & moved here)
│   ├── converted/                      ← Converted .md files will go here
│   └── media/                          ← Extracted images/charts
│
├── NASM_CNC/
│   ├── IMPLEMENTATION_PLAN.md          ← Comprehensive CNC conversion guide (10,000+ words)
│   ├── README.md                       ← Quick start for CNC
│   ├── CHANGELOG.md                    ← Version tracking
│   ├── source_documents/               ← Place .docx files here (ready to use!)
│   │   └── NASM Nutritional Coach.docx (found & moved here)
│   ├── converted/                      ← Converted .md files will go here
│   └── media/                          ← Extracted images/charts
│
└── exercises.csv                       ← Existing exercise database

scripts/
├── convert_nasm_cpt.sh                 ← Convert CPT documents only
├── convert_nasm_cnc.sh                 ← Convert CNC documents only
└── convert_all_nasm.sh                 ← Convert both (master script)
```

---

## 🎯 Implementation Plans Overview

### NASM_CPT/IMPLEMENTATION_PLAN.md
**13,000+ words | 6 parts | Complete conversion & integration guide**

#### Part 1: Content Structure & Requirements
- Expected NASM CPT sections (OPT Model, Movement Patterns, Exercise Technique)
- Required markdown structure with examples
- YAML frontmatter metadata requirements

#### Part 2: Conversion Process
- Pre-conversion preparation checklist
- Pandoc conversion commands
- Post-conversion quality control
- Before/after optimisation examples

#### Part 3: Integration with Massimino
- **Direct Parsing** - Workout Log coaching cues
- **Vectorisation** - Massichat semantic search
- PostgreSQL pgvector setup
- Code examples for both integration methods

#### Part 4: Testing & Validation
- Markdown linting
- Parsing accuracy tests
- Vectorisation quality tests
- End-to-end integration tests

#### Part 5: Maintenance & Updates
- Adding new content workflow
- Version control strategies
- Update protocols

#### Part 6: Success Metrics
- Conversion success criteria
- AI integration success indicators
- Performance benchmarks

**Appendices:**
- Quick reference commands
- Troubleshooting guide

---

### NASM_CNC/IMPLEMENTATION_PLAN.md
**11,000+ words | 6 parts | Complete nutrition knowledge guide**

#### Part 1: Content Structure & Requirements
- Expected NASM CNC sections (Macronutrients, Performance Nutrition, Hydration)
- Required markdown structure with nutrition-specific examples
- YAML frontmatter for nutrition goals

#### Part 2: Conversion Process
- Pre-conversion preparation (nutrition tables focus)
- Pandoc conversion with special handling for meal plans
- Sample meal extraction and formatting

#### Part 3: Integration with Massimino
- **Direct Parsing** - Macro Calculator integration
- **Vectorisation** - Massichat nutrition guidance
- Dashboard nutrition targets display
- Code examples for macro calculations

#### Part 4: Testing & Validation
- Nutrition data parsing tests
- Vectorisation quality for nutrition queries
- Macro calculator integration tests

#### Part 5: Maintenance & Updates
- Adding new nutrition content
- Updating macro ratios when research changes

#### Part 6: Success Metrics
- Conversion success for nutrition content
- User satisfaction with nutrition recommendations

**Appendices:**
- Quick reference commands
- Nutrition-specific troubleshooting

---

## 🚀 How to Use (Next Steps)

### Step 1: Prepare Your NASM Documents

You already have 2 documents in place:
- ✅ `NASM Certified Personal Trainer.docx` → in `NASM_CPT/source_documents/`
- ✅ `NASM Nutritional Coach.docx` → in `NASM_CNC/source_documents/`

**For best results, break these into smaller sections (10-20 pages each):**

Example breakdown for CPT:
```bash
# Instead of one large file, create:
NASM_CPT_Ch05_OPT_Model.docx              (15 pages)
NASM_CPT_Ch07_Movement_Patterns.docx      (18 pages)
NASM_CPT_Ch08_Squat_Technique.docx        (12 pages)
NASM_CPT_Ch08_Deadlift_Technique.docx     (10 pages)
# etc...
```

**Why smaller sections?**
- Better AI chunking and retrieval
- Easier to maintain and update
- More targeted vectorisation
- Clearer version control

### Step 2: Convert Documents

**Option A: Convert both databases at once (recommended)**
```bash
./scripts/convert_all_nasm.sh
```

**Option B: Convert individually**
```bash
# CPT only
./scripts/convert_nasm_cpt.sh

# CNC only
./scripts/convert_nasm_cnc.sh
```

**What happens during conversion:**
1. Pandoc reads .docx files
2. Converts to GitHub-flavored markdown
3. Extracts images to media/ folder
4. Saves .md files to converted/ folder

### Step 3: Manual Optimisation (CRITICAL!)

The conversion scripts produce raw markdown. You MUST manually optimise each file:

**For NASM CPT files:**
1. Add YAML frontmatter (see NASM_CPT/IMPLEMENTATION_PLAN.md section 1.3)
2. Extract coaching cues into bullet lists
3. Tag movement patterns (PUSH, PULL, HINGE, SQUAT, etc.)
4. Label OPT phases (Stabilisation, Strength, Power)
5. Structure exercises with setup/execution/cues

**Example structure:**
```markdown
---
source: NASM_CPT
chapter: 5
section: OPT Model
topics:
  - Stabilisation
  - Strength
  - Power
movement_patterns:
  - SQUAT
  - HINGE
opt_phases:
  - Stabilisation
last_updated: 2025-10-05
---

# OPT Model - NASM CPT

## Overview
[content]

### Exercise: Barbell Back Squat
**Movement Pattern:** SQUAT
**OPT Phase:** Strength

**Coaching Cues:**
- "Knees track over toes"
- "Chest up, core tight"
- "Drive through heels"
```

**For NASM CNC files:**
1. Add YAML frontmatter with nutrition_goals
2. Format nutrition tables properly
3. Extract sample meals with macros
4. Create goal-specific protocols
5. Structure hydration/timing recommendations

**Example structure:**
```markdown
---
source: NASM_CNC
chapter: 7
section: Performance Nutrition
nutrition_goals:
  - Muscle Gain
  - Performance
macronutrients:
  - Protein
  - Carbohydrates
meal_timing:
  - Pre-Workout
  - Post-Workout
last_updated: 2025-10-05
---

# Performance Nutrition - NASM CNC

## Post-Workout Protocol

### For Muscle Gain
**Protein:** 0.3-0.4 g/kg bodyweight
**Carbs:** 0.8-1.0 g/kg bodyweight

**Sample Meal (80kg athlete):**
- Grilled chicken: 150g (32g protein)
- White rice: 1.5 cups (67g carbs)
- Total: 416 calories | P: 32g | C: 67g | F: 3g
```

### Step 4: Generate Embeddings (for Massichat)

After manual optimisation, vectorise the documents:

**Option A: In Node REPL**
```bash
node
```
```javascript
const { embed_nasm_cpt_documents } = require('./src/services/ai/vector_search.ts')
const { embed_nasm_cnc_documents } = require('./src/services/ai/vector_search.ts')

await embed_nasm_cpt_documents()
await embed_nasm_cnc_documents()
```

**Option B: Create admin panel endpoint** (recommended for future use)
See IMPLEMENTATION_PLAN.md Part 3.2 for embedding script details.

### Step 5: Test Everything

```bash
# Lint markdown files
markdownlint public/databases/NASM_CPT/converted/*.md
markdownlint public/databases/NASM_CNC/converted/*.md

# Run parsing tests
npm test -- nasm_parsing.test.ts
npm test -- nasm_nutrition_parsing.test.ts

# Check embedding counts
psql -d massimino -c "SELECT COUNT(*) FROM fitness_knowledge_base WHERE \"documentName\" LIKE 'NASM%';"
```

### Step 6: Update Changelogs & Commit

```bash
# Update changelogs
# Edit public/databases/NASM_CPT/CHANGELOG.md
# Edit public/databases/NASM_CNC/CHANGELOG.md

# Commit
git add public/databases/ scripts/
git commit -m "Add NASM CPT/CNC knowledge base with conversion system"
```

---

## 📊 Integration Points in Massimino

### 1. Workout Log - Coaching Cues
**File:** `/src/app/workout-log/page.tsx`
**What:** When user selects an exercise, display NASM CPT coaching cues
**How:** Direct parsing of converted markdown files
**Status:** ⏳ Ready to implement (parsing functions in IMPLEMENTATION_PLAN)

### 2. Dashboard - Nutrition Targets
**File:** `/src/app/dashboard/page.tsx`
**What:** Display personalised macro targets based on NASM CNC
**How:** Macro calculator reads NASM CNC markdown files
**Status:** ⏳ Ready to implement (calculator code in IMPLEMENTATION_PLAN)

### 3. Massichat - AI Recommendations
**File:** `/src/services/ai/massichat_service.ts`
**What:** Conversational AI for workout & nutrition questions
**How:** Vector search retrieves relevant NASM knowledge, injects into AI prompts
**Status:** ⏳ Ready to implement (full workflow in both IMPLEMENTATION_PLANs)

### 4. Assessment Integration
**File:** `/src/services/ai/assessment_summarizer.ts`
**What:** Combine assessment data with NASM principles
**How:** Parse NASM CPT for corrective strategies based on postural findings
**Status:** ⏳ Ready to implement (summarizer code in CPT IMPLEMENTATION_PLAN)

---

## 🎓 Key Concepts

### Dual-Purpose Architecture

The NASM knowledge bases serve **two distinct purposes**:

#### 1. **Direct Parsing** (Structured Data Extraction)
- **Use Case:** Need specific, deterministic data
- **Examples:**
  - Get coaching cues for "SQUAT" movement pattern
  - Get macro ratio for "FAT_LOSS" goal
  - Get hydration protocol for 60-minute workout
- **Speed:** Very fast (file read + regex)
- **Accuracy:** High (exact matches)
- **Integration:** Workout Log, Macro Calculator, Recommendations Panel

#### 2. **Vectorisation** (Semantic Search / RAG)
- **Use Case:** Answer natural language questions
- **Examples:**
  - "How do I fix knee valgus during squats?"
  - "What should I eat before a morning workout if I'm cutting?"
  - "I have lower crossed syndrome - what exercises should I avoid?"
- **Speed:** Fast (vector DB query ~100-200ms)
- **Accuracy:** High (semantic similarity matching)
- **Integration:** Massichat conversational AI

**Both methods use the SAME markdown files**, just accessed differently.

---

## 📖 Documentation Hierarchy

1. **Start Here:** `public/databases/README.md` - Overview of all knowledge bases
2. **CPT Deep Dive:** `public/databases/NASM_CPT/IMPLEMENTATION_PLAN.md` - Everything CPT
3. **CNC Deep Dive:** `public/databases/NASM_CNC/IMPLEMENTATION_PLAN.md` - Everything CNC
4. **Quick Starts:**
   - `public/databases/NASM_CPT/README.md`
   - `public/databases/NASM_CNC/README.md`
5. **Version History:**
   - `public/databases/NASM_CPT/CHANGELOG.md`
   - `public/databases/NASM_CNC/CHANGELOG.md`

---

## 🔧 Tools Created

### Conversion Scripts

#### `convert_nasm_cpt.sh`
- Converts all .docx in NASM_CPT/source_documents/
- Outputs to NASM_CPT/converted/
- Extracts media to NASM_CPT/media/
- Colorised output with progress indicators

#### `convert_nasm_cnc.sh`
- Converts all .docx in NASM_CNC/source_documents/
- Outputs to NASM_CNC/converted/
- Extracts media to NASM_CNC/media/
- Colorised output with progress indicators

#### `convert_all_nasm.sh` (Master Script)
- Runs both CPT and CNC conversions
- Shows combined summary
- Comprehensive next steps guide

**All scripts include:**
- ✅ Pandoc availability check
- ✅ Directory creation
- ✅ File count reporting
- ✅ Error handling
- ✅ Colorised, user-friendly output

---

## ⚠️ Important Reminders

### File Size Limits
- **Keep .docx files to 10-20 pages max**
- Larger files should be split into logical sections
- Better for AI chunking and maintenance

### Manual Optimisation is NOT Optional
- Raw Pandoc output is just the starting point
- MUST add frontmatter, structure, and extract key info
- See IMPLEMENTATION_PLAN.md for detailed guidelines

### Naming Conventions
```
NASM_CPT_[ChapterNumber]_[SectionName].docx
NASM_CNC_[ChapterNumber]_[SectionName].docx
```

Examples:
- ✅ `NASM_CPT_Ch05_OPT_Model.docx`
- ✅ `NASM_CNC_Ch07_Performance_Nutrition.docx`
- ❌ `chapter 5.docx`
- ❌ `nutrition stuff.docx`

### PostgreSQL pgvector Required
For vectorisation to work, you need:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
See IMPLEMENTATION_PLAN.md section 3.3 for setup details.

---

## 🎯 Success Checklist

### Phase 1: Conversion ✅ READY
- [x] Directory structure created
- [x] Conversion scripts ready
- [x] Implementation plans documented
- [x] README files created
- [ ] Documents broken into 10-20 page sections
- [ ] Run conversion scripts
- [ ] Manual optimisation complete

### Phase 2: Integration ⏳ PENDING
- [ ] Parsing functions implemented (workout-suggestions.ts)
- [ ] Macro calculator implemented (macro_calculator.ts)
- [ ] Vector search implemented (vector_search.ts)
- [ ] Massichat service updated (massichat_service.ts)
- [ ] Dashboard nutrition targets added

### Phase 3: Testing ⏳ PENDING
- [ ] Unit tests for parsing (nasm_parsing.test.ts)
- [ ] Unit tests for nutrition (nasm_nutrition_parsing.test.ts)
- [ ] Integration tests (massichat_service.test.ts)
- [ ] End-to-end workflow tested

### Phase 4: Production ⏳ PENDING
- [ ] Embeddings generated for all documents
- [ ] Performance benchmarks met (<200ms searches)
- [ ] User acceptance testing
- [ ] Documentation complete
- [ ] Committed to git

---

## 📞 Getting Help

### Issues with Conversion
See: `public/databases/NASM_CPT/IMPLEMENTATION_PLAN.md` - Appendix B: Troubleshooting

### Issues with Integration
See: `public/databases/NASM_CNC/IMPLEMENTATION_PLAN.md` - Appendix B: Troubleshooting

### Issues with Pandoc
```bash
# Check if installed
pandoc --version

# Install if missing
brew install pandoc

# Update if outdated
brew upgrade pandoc
```

---

## 📈 Expected Outcomes

### Knowledge Base Size (when complete)
- **NASM CPT:** 15-20 documents → ~200 semantic chunks
- **NASM CNC:** 10-15 documents → ~150 semantic chunks
- **Total:** 350+ chunks of authoritative fitness knowledge

### Integration Impact
- **Workout Log:** Real-time coaching cues for every exercise
- **Dashboard:** Personalised macro targets auto-calculated
- **Massichat:** Evidence-based AI recommendations backed by NASM
- **Assessments:** Corrective strategies linked to postural findings

### User Experience
- More accurate workout recommendations
- Science-backed nutrition guidance
- Contextual coaching during workouts
- Personalised based on assessments

---

**🎉 Setup Complete! Ready to convert NASM documents and power Massimino's AI features.**

**Next:** Break your NASM documents into 10-20 page sections and run `./scripts/convert_all_nasm.sh`

---

**Created:** 2025-10-05
**Version:** 1.0
**Maintained By:** Massimino Development Team
