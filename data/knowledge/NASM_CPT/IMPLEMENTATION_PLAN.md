
# NASM CPT KNOWLEDGE BASE IMPLEMENTATION PLAN
## NASM Certified Personal Trainer Content → Massimino AI Integration

---

## **EXECUTIVE SUMMARY**

This document outlines the complete implementation plan for converting NASM Certified Personal Trainer (CPT) educational content from .docx format into structured markdown files, and integrating this knowledge into Massimino's AI-powered workout recommendation system (Massichat).

### **Purpose**
Transform authoritative NASM CPT content into machine-readable, AI-optimised knowledge that powers:
- **Massichat conversational AI** - Contextual workout recommendations
- **Exercise coaching cues** - Real-time form guidance during workouts
- **Assessment-based programming** - Personalised training plans
- **Progressive training recommendations** - Science-based exercise selection

### **Scope**
- Source: NASM CPT certification textbook sections (10-20 pages per .docx)
- Target: Structured markdown files optimised for AI parsing and vector search
- Integration: Dual-purpose usage (direct parsing + vectorised RAG)
- Timeline: Ongoing content addition as documents are prepared

---

## **PART 1: CONTENT STRUCTURE & REQUIREMENTS**

### **1.1 Expected NASM CPT Content Sections**

The following sections from NASM CPT should be prioritised for conversion:

#### **High Priority - Core Training Science**
1. **The OPT Model (Optimum Performance Training)**
   - Stabilisation Phase (Endurance + Stability)
   - Strength Phase (Strength Endurance + Hypertrophy + Maximal Strength)
   - Power Phase (Power Training)
   - Phase-specific exercise selection
   - Progression strategies

2. **Training Principles**
   - Progressive Overload
   - Specificity (SAID Principle)
   - Variation and Periodisation
   - Individualisation
   - Rest and Recovery

3. **Movement Patterns & Exercise Classification**
   - Primary Movement Patterns:
     - PUSH (horizontal/vertical)
     - PULL (horizontal/vertical)
     - HINGE (deadlift patterns)
     - SQUAT (bilateral/unilateral)
     - LUNGE (split stance)
     - ROTATION (core rotation)
     - CARRY (loaded carries)
   - Exercise progressions for each pattern
   - Regression strategies

4. **Exercise Technique & Coaching Cues**
   - Proper form for fundamental exercises:
     - Squats (back squat, front squat, goblet squat)
     - Deadlifts (conventional, Romanian, single-leg)
     - Presses (bench, overhead, push-up variations)
     - Rows (bent-over, cable, inverted)
     - Core exercises (planks, anti-rotation, carries)
   - Common faults and corrections
   - Safety considerations

5. **Program Design Variables**
   - Repetitions and sets
   - Intensity (% 1RM, RPE)
   - Tempo (eccentric, isometric, concentric phases)
   - Rest intervals
   - Training frequency
   - Volume calculations

#### **Medium Priority - Assessment & Individualisation**
6. **Postural Assessment Integration**
   - Lower Crossed Syndrome implications
   - Upper Crossed Syndrome implications
   - Muscle imbalance correction strategies
   - Flexibility and mobility recommendations

7. **Flexibility Training**
   - Static stretching protocols
   - Dynamic warm-up sequences
   - Self-myofascial release techniques
   - Corrective exercise strategies

8. **Cardiorespiratory Training**
   - Training zones (Zone 1, 2, 3)
   - Interval training methods
   - Conditioning for different goals

#### **Lower Priority - Specialised Topics**
9. **Special Populations**
   - Youth training considerations
   - Older adult modifications
   - Pregnancy and postpartum
   - Chronic conditions (diabetes, hypertension, arthritis)

10. **Sports Performance**
    - Speed and agility training
    - Plyometric progressions
    - Sport-specific training

---

### **1.2 Required Markdown Structure**

Each converted .md file must follow this standardised structure for optimal AI parsing:

```markdown
# [Section Title] - NASM CPT

## Overview
[Brief 2-3 sentence summary of the section]

## Key Concepts

### Concept 1: [Name]
**Definition:** [Clear, concise definition]

**Application:** [How this applies to training]

**Example:** [Practical example]

**Coaching Cues:**
- [Specific cue 1]
- [Specific cue 2]
- [Specific cue 3]

### Concept 2: [Name]
[Repeat structure]

## Exercise Applications

### Exercise: [Exercise Name]
**Movement Pattern:** [PUSH/PULL/HINGE/SQUAT/LUNGE/ROTATION/CARRY]

**Primary Muscles:** [Muscle groups]

**OPT Phase:** [Stabilisation/Strength/Power]

**Setup:**
1. [Step 1]
2. [Step 2]

**Execution:**
1. [Movement step 1]
2. [Movement step 2]

**Coaching Cues:**
- **Alignment:** [Cue]
- **Breathing:** [Cue]
- **Tempo:** [Cue]
- **Safety:** [Cue]

**Common Faults:**
- ❌ [Fault 1] → ✅ [Correction]
- ❌ [Fault 2] → ✅ [Correction]

**Progressions:**
- **Regression:** [Easier variation]
- **Progression:** [Harder variation]

## Programming Guidelines

### For [Specific Goal/Phase]
**Sets:** [Recommendation]
**Reps:** [Recommendation]
**Intensity:** [% 1RM or RPE]
**Tempo:** [eccentric-isometric-concentric format, e.g., 4-2-1]
**Rest:** [Duration]

## Assessment Integration

### Relevant Postural Findings
- **If [Assessment Finding]:** [Recommendation]
- **If [Assessment Finding]:** [Recommendation]

## References
- NASM CPT Chapter: [Chapter number]
- Page: [Page range]
```

### **1.3 Metadata Requirements**

Each markdown file should begin with YAML frontmatter:

```yaml
---
source: NASM_CPT
chapter: [Chapter number]
section: [Section name]
topics:
  - [Topic 1]
  - [Topic 2]
movement_patterns:
  - [Pattern 1]
  - [Pattern 2]
opt_phases:
  - [Stabilisation/Strength/Power]
last_updated: [YYYY-MM-DD]
---
```

---

## **PART 2: CONVERSION PROCESS - DOCX TO MARKDOWN**

### **2.1 Pre-Conversion Preparation**

#### **Step 1: Document Review**
Before converting, review each .docx file to ensure:
- ✅ Content is from official NASM CPT materials
- ✅ Page count is 10-20 pages (manageable chunks)
- ✅ Section represents a complete, logical unit
- ✅ Images (if any) are relevant and saved separately
- ✅ Tables are clearly formatted

#### **Step 2: File Naming Convention**
Use this naming structure:
```
NASM_CPT_[ChapterNumber]_[SectionName].docx
```

Examples:
- `NASM_CPT_Ch05_OPT_Model.docx`
- `NASM_CPT_Ch07_Movement_Patterns.docx`
- `NASM_CPT_Ch08_Exercise_Technique_Squat.docx`

#### **Step 3: Directory Organisation**
Place .docx files in:
```
public/databases/NASM_CPT/source_documents/
```

Converted .md files will go in:
```
public/databases/NASM_CPT/converted/
```

---

### **2.2 Pandoc Conversion Process**

#### **Basic Conversion Command**
```bash
pandoc \
  public/databases/NASM_CPT/source_documents/NASM_CPT_Ch05_OPT_Model.docx \
  -f docx \
  -t gfm \
  --wrap=none \
  --extract-media=public/databases/NASM_CPT/media \
  -o public/databases/NASM_CPT/converted/NASM_CPT_Ch05_OPT_Model.md
```

**Flags Explained:**
- `-f docx` - Input format (Microsoft Word)
- `-t gfm` - Output format (GitHub Flavoured Markdown)
- `--wrap=none` - Don't wrap long lines (better for AI parsing)
- `--extract-media` - Extract images to separate folder
- `-o` - Output file path

#### **Batch Conversion Script**
For converting multiple files at once:

```bash
#!/bin/bash
# File: scripts/convert_nasm_cpt.sh

SOURCE_DIR="public/databases/NASM_CPT/source_documents"
OUTPUT_DIR="public/databases/NASM_CPT/converted"
MEDIA_DIR="public/databases/NASM_CPT/media"

# Create directories if they don't exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$MEDIA_DIR"

# Convert all .docx files
for docx_file in "$SOURCE_DIR"/*.docx; do
  filename=$(basename "$docx_file" .docx)

  echo "Converting: $filename.docx → $filename.md"

  pandoc \
    "$docx_file" \
    -f docx \
    -t gfm \
    --wrap=none \
    --extract-media="$MEDIA_DIR" \
    -o "$OUTPUT_DIR/$filename.md"

  echo "✅ Completed: $filename.md"
done

echo "🎉 All conversions complete!"
```

**Usage:**
```bash
chmod +x scripts/convert_nasm_cpt.sh
./scripts/convert_nasm_cpt.sh
```

---

### **2.3 Post-Conversion Quality Control**

#### **Manual Review Checklist**
After Pandoc conversion, manually review each .md file:

1. **Formatting Issues**
   - [ ] Headers are properly formatted (# ## ###)
   - [ ] Lists are correctly indented
   - [ ] Tables are readable (Pandoc sometimes struggles with complex tables)
   - [ ] Code blocks (if any) are properly fenced
   - [ ] Special characters (®, ™) are rendered correctly

2. **Content Accuracy**
   - [ ] No text was lost in conversion
   - [ ] Images are extracted and referenced correctly
   - [ ] Footnotes/references are preserved
   - [ ] Emphasis (*italic*, **bold**) is correct

3. **Structure Enhancement**
   - [ ] Add YAML frontmatter (see 1.3)
   - [ ] Break long paragraphs into logical sections
   - [ ] Add subheadings for clarity
   - [ ] Insert `---` dividers between major sections

4. **AI Optimisation**
   - [ ] Extract coaching cues into bulleted lists
   - [ ] Label movement patterns explicitly
   - [ ] Tag OPT phases clearly
   - [ ] Create "Key Takeaways" sections for dense content

#### **Example: Before vs After Optimisation**

**Before (Raw Pandoc Output):**
```markdown
The squat is a fundamental movement pattern that involves hip and knee flexion.
It primarily targets the quadriceps, glutes, and hamstrings. Proper form requires
maintaining a neutral spine, keeping knees aligned with toes, and achieving
adequate depth based on mobility.
```

**After (AI-Optimised):**
```markdown
### Exercise: Barbell Back Squat
**Movement Pattern:** SQUAT (bilateral)
**Primary Muscles:** Quadriceps, Glutes, Hamstrings
**OPT Phase:** Strength (Hypertrophy, Maximal Strength)

**Setup:**
1. Position barbell on upper traps (high bar) or posterior deltoids (low bar)
2. Feet shoulder-width apart, toes slightly out (10-15°)
3. Engage core, chest up, neutral spine

**Execution:**
1. Initiate by pushing hips back and bending knees
2. Descend until thighs are parallel (or deeper if mobility allows)
3. Drive through heels, extend hips and knees to return

**Coaching Cues:**
- **Alignment:** "Knees track over toes, don't cave inward"
- **Breathing:** "Inhale on descent, exhale on ascent"
- **Tempo:** "Control the descent (3 sec), explosive ascent (1 sec)"
- **Safety:** "Keep chest up, don't round lower back"

**Common Faults:**
- ❌ Knees caving inward (valgus collapse) → ✅ "Push knees out, engage glutes"
- ❌ Forward lean (excessive torso angle) → ✅ "Keep chest up, engage core"
- ❌ Heels lifting → ✅ "Shift weight to mid-foot, improve ankle mobility"
```

---

### **2.4 Version Control & Updates**

#### **Versioning Strategy**
Use Git to track all changes:

```bash
# After converting a new document
git add public/databases/NASM_CPT/converted/NASM_CPT_Ch05_OPT_Model.md
git commit -m "Add NASM CPT: OPT Model chapter (Ch 5)"

# After manual optimisation
git add public/databases/NASM_CPT/converted/NASM_CPT_Ch05_OPT_Model.md
git commit -m "Optimise OPT Model for AI parsing - add coaching cues"
```

#### **Update Log**
Maintain a changelog in `public/databases/NASM_CPT/CHANGELOG.md`:

```markdown
# NASM CPT Knowledge Base - Changelog

## 2025-10-05
- ✅ Added: OPT Model (Chapter 5)
- ✅ Added: Movement Patterns (Chapter 7)
- 🔄 Updated: Exercise Technique - Squat variations (enhanced coaching cues)

## 2025-10-12
- ✅ Added: Program Design Variables (Chapter 14)
- ✅ Added: Postural Assessment Integration (Chapter 6)
```

---

## **PART 3: INTEGRATION WITH MASSIMINO**

### **3.1 Direct Parsing Integration** (Existing Workout System)

#### **How It Works**
The workout suggestion service reads markdown files directly:

**File:** `/src/services/ai/workout-suggestions.ts`

```typescript
import fs from 'fs';
import path from 'path';

interface NASMPrinciple {
  name: string;
  description: string;
  application: string;
  opt_phase: string;
}

export function parse_nasm_cpt_knowledge(): NASMPrinciple[] {
  const base_path = path.join(process.cwd(), 'public/databases/NASM_CPT/converted');
  const files = fs.readdirSync(base_path).filter(f => f.endsWith('.md'));

  const principles: NASMPrinciple[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(base_path, file), 'utf-8');

    // Extract OPT Model phases
    const opt_match = content.match(/## OPT Model[\s\S]*?###\s+(.+?)\n[\s\S]*?(?=###|##|$)/g);
    if (opt_match) {
      opt_match.forEach(section => {
        const name_match = section.match(/###\s+(.+)/);
        const desc_match = section.match(/\*\*Definition:\*\*\s+(.+)/);
        const app_match = section.match(/\*\*Application:\*\*\s+(.+)/);

        if (name_match && desc_match) {
          principles.push({
            name: name_match[1],
            description: desc_match[1],
            application: app_match ? app_match[1] : '',
            opt_phase: determine_phase(section)
          });
        }
      });
    }
  }

  return principles;
}

// Get coaching cues for a specific movement pattern
export function get_coaching_cues(
  movement_pattern: string,
  fitness_level: string
): string[] {
  const base_path = path.join(process.cwd(), 'public/databases/NASM_CPT/converted');
  const files = fs.readdirSync(base_path).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(base_path, file), 'utf-8');

    // Find exercise section matching movement pattern
    const exercise_pattern = new RegExp(
      `###\\s+Exercise:.*?\\n\\*\\*Movement Pattern:\\*\\*\\s+${movement_pattern}[\\s\\S]*?\\*\\*Coaching Cues:\\*\\*[\\s\\S]*?(?=###|##|$)`,
      'i'
    );

    const match = content.match(exercise_pattern);
    if (match) {
      // Extract bullet points under "Coaching Cues:"
      const cues_match = match[0].match(/\*\*Coaching Cues:\*\*\s*\n((?:-\s+.+\n?)+)/);
      if (cues_match) {
        return cues_match[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s+/, '').trim());
      }
    }
  }

  return []; // Fallback to empty if not found
}

// Get exercise recommendations based on NASM principles
export function get_nasm_exercise_recommendations(
  fitness_level: string,
  primary_goal: string,
  movement_pattern: string
) {
  const principles = parse_nasm_cpt_knowledge();

  const phase_map = {
    BEGINNER: 'Stabilisation',
    INTERMEDIATE: 'Strength',
    ADVANCED: 'Power'
  };

  const opt_phase = phase_map[fitness_level as keyof typeof phase_map];
  const relevant_principles = principles.filter(p => p.opt_phase === opt_phase);

  return {
    movement_pattern,
    nasm_principle: 'PROGRESSIVE_OVERLOAD',
    progression_level: opt_phase,
    coaching_cues: get_coaching_cues(movement_pattern, fitness_level),
    principles: relevant_principles
  };
}
```

#### **Usage in Workout Log**
When a user adds an exercise, the system:
1. Identifies the movement pattern (e.g., SQUAT)
2. Reads relevant NASM CPT markdown files
3. Extracts coaching cues for that pattern
4. Displays them in real-time during workout entry

**File:** `/src/app/workout-log/page.tsx`
```typescript
// When exercise is selected
useEffect(() => {
  if (selected_exercise) {
    const coaching_cues = get_coaching_cues(
      selected_exercise.movement_pattern,
      user.fitness_level
    );
    set_coaching_cues(coaching_cues);
  }
}, [selected_exercise]);

// Display in UI
{coaching_cues.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">
      💡 NASM Coaching Cues
    </h4>
    <ul className="space-y-1">
      {coaching_cues.map((cue, i) => (
        <li key={i} className="text-sm text-blue-800">• {cue}</li>
      ))}
    </ul>
  </div>
)}
```

---

### **3.2 Vectorisation Integration** (Massichat AI)

#### **Why Vectorisation?**
While direct parsing works for structured data extraction, Massichat needs semantic search:
- User asks: "What's the best way to fix knee valgus during squats?"
- AI needs to find relevant content across ALL NASM documents
- Vector embeddings enable semantic similarity matching

#### **Vectorisation Workflow**

**Step 1: Chunk Documents**
Break large markdown files into semantic chunks (500-1000 tokens each):

```typescript
// File: /src/services/ai/document_chunker.ts

interface DocumentChunk {
  content: string;
  metadata: {
    source_file: string;
    chapter: string;
    section: string;
    movement_patterns: string[];
    opt_phases: string[];
  };
}

export function chunk_nasm_document(
  markdown_content: string,
  file_name: string
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Parse YAML frontmatter
  const frontmatter = extract_yaml_frontmatter(markdown_content);

  // Split by ## (second-level headers)
  const sections = markdown_content.split(/(?=^## )/gm);

  for (const section of sections) {
    // If section is too large (>1000 tokens), split further by ###
    if (estimate_tokens(section) > 1000) {
      const subsections = section.split(/(?=^### )/gm);
      subsections.forEach(subsection => {
        chunks.push({
          content: subsection.trim(),
          metadata: {
            source_file: file_name,
            chapter: frontmatter.chapter || 'Unknown',
            section: extract_section_title(subsection),
            movement_patterns: frontmatter.movement_patterns || [],
            opt_phases: frontmatter.opt_phases || []
          }
        });
      });
    } else {
      chunks.push({
        content: section.trim(),
        metadata: {
          source_file: file_name,
          chapter: frontmatter.chapter || 'Unknown',
          section: extract_section_title(section),
          movement_patterns: frontmatter.movement_patterns || [],
          opt_phases: frontmatter.opt_phases || []
        }
      });
    }
  }

  return chunks.filter(c => c.content.length > 100); // Filter very small chunks
}

function estimate_tokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}
```

**Step 2: Generate Embeddings**
Use OpenAI's `text-embedding-3-small` model:

```typescript
// File: /src/services/ai/vector_search.ts

import OpenAI from 'openai';
import { prisma } from '@/core/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed_nasm_cpt_documents() {
  const base_path = path.join(process.cwd(), 'public/databases/NASM_CPT/converted');
  const files = fs.readdirSync(base_path).filter(f => f.endsWith('.md'));

  for (const file of files) {
    console.log(`Processing: ${file}`);
    const content = fs.readFileSync(path.join(base_path, file), 'utf-8');

    // Chunk the document
    const chunks = chunk_nasm_document(content, file);

    for (const chunk of chunks) {
      // Generate embedding
      const embedding_response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.content
      });

      const embedding = embedding_response.data[0].embedding;

      // Save to database
      await prisma.fitness_knowledge_base.create({
        data: {
          documentName: chunk.metadata.source_file,
          content: chunk.content,
          embedding: embedding,
          metadata: chunk.metadata
        }
      });

      console.log(`  ✅ Embedded chunk: ${chunk.metadata.section}`);
    }
  }

  console.log('🎉 All NASM CPT documents embedded!');
}
```

**Step 3: Semantic Search**
When user chats with Massichat:

```typescript
export async function search_nasm_knowledge(
  query: string,
  limit: number = 5
): Promise<KnowledgeResult[]> {
  // 1. Embed the user's question
  const query_embedding_response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });
  const query_embedding = query_embedding_response.data[0].embedding;

  // 2. Find similar chunks using cosine similarity
  // Note: Requires PostgreSQL with pgvector extension
  const results = await prisma.$queryRaw`
    SELECT
      content,
      metadata,
      1 - (embedding <=> ${query_embedding}::vector) as similarity
    FROM fitness_knowledge_base
    WHERE "documentName" LIKE 'NASM_CPT%'
    ORDER BY embedding <=> ${query_embedding}::vector
    LIMIT ${limit}
  `;

  return results;
}
```

**Step 4: Inject into Massichat Prompt**
```typescript
// File: /src/services/ai/massichat_service.ts

export async function send_massichat_message(request: MassichatRequest) {
  // Search knowledge base
  const knowledge_results = await search_nasm_knowledge(request.message, 3);

  // Build context
  const knowledge_context = knowledge_results
    .map(r => `[Source: ${r.metadata.source_file}]\n${r.content}`)
    .join('\n\n---\n\n');

  // Construct prompt
  const system_prompt = `You are Massimino's AI fitness coach, trained on NASM CPT principles.

RELEVANT NASM KNOWLEDGE:
${knowledge_context}

USER PROFILE:
${user_context}

ASSESSMENT SUMMARY:
${assessment_summary}

Provide evidence-based workout recommendations using NASM principles.`;

  // Call OpenAI/Anthropic
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: system_prompt },
      { role: 'user', content: request.message }
    ]
  });

  return response.choices[0].message.content;
}
```

---

### **3.3 PostgreSQL Vector Extension Setup**

#### **Enable pgvector**
```sql
-- Run in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Update fitness_knowledge_base table
ALTER TABLE fitness_knowledge_base
  ALTER COLUMN embedding TYPE vector(1536);

-- Create index for faster similarity search
CREATE INDEX ON fitness_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

#### **Update Prisma Schema**
```prisma
model fitness_knowledge_base {
  id            String   @id @default(uuid())
  documentName  String
  content       String   @db.Text
  embedding     Unsupported("vector(1536)")
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([documentName])
}
```

---

## **PART 4: TESTING & VALIDATION**

### **4.1 Conversion Quality Tests**

#### **Test 1: Markdown Validity**
```bash
# Install markdown linter
npm install -g markdownlint-cli

# Run linter
markdownlint public/databases/NASM_CPT/converted/*.md
```

#### **Test 2: Parsing Accuracy**
Create unit tests:

```typescript
// File: /src/services/ai/__tests__/nasm_parsing.test.ts

import { parse_nasm_cpt_knowledge, get_coaching_cues } from '../workout-suggestions';

describe('NASM CPT Parsing', () => {
  it('should extract OPT Model principles', () => {
    const principles = parse_nasm_cpt_knowledge();

    expect(principles.length).toBeGreaterThan(0);
    expect(principles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          opt_phase: expect.stringMatching(/Stabilisation|Strength|Power/)
        })
      ])
    );
  });

  it('should return coaching cues for SQUAT pattern', () => {
    const cues = get_coaching_cues('SQUAT', 'INTERMEDIATE');

    expect(cues.length).toBeGreaterThan(0);
    expect(cues[0]).toMatch(/knees|chest|back|heels/i);
  });
});
```

**Run tests:**
```bash
npm test -- nasm_parsing.test.ts
```

---

### **4.2 Vectorisation Quality Tests**

#### **Test 1: Embedding Generation**
```typescript
import { embed_nasm_cpt_documents } from '../vector_search';

describe('NASM CPT Vectorisation', () => {
  it('should create embeddings for all documents', async () => {
    await embed_nasm_cpt_documents();

    const count = await prisma.fitness_knowledge_base.count({
      where: { documentName: { contains: 'NASM_CPT' } }
    });

    expect(count).toBeGreaterThan(0);
  });
});
```

#### **Test 2: Semantic Search Accuracy**
```typescript
import { search_nasm_knowledge } from '../vector_search';

describe('NASM Knowledge Search', () => {
  it('should find relevant content for knee pain query', async () => {
    const results = await search_nasm_knowledge(
      'How do I fix knee valgus during squats?',
      5
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toMatch(/knee|valgus|squat/i);
    expect(results[0].similarity).toBeGreaterThan(0.7);
  });

  it('should find OPT Model content for beginners', async () => {
    const results = await search_nasm_knowledge(
      'What training phase should a beginner start with?',
      3
    );

    expect(results[0].content).toMatch(/stabilisation|beginner|phase/i);
  });
});
```

---

### **4.3 Integration Tests**

#### **End-to-End Test: Massichat with NASM Knowledge**
```typescript
import { send_massichat_message } from '../massichat_service';

describe('Massichat NASM Integration', () => {
  it('should provide NASM-based workout recommendation', async () => {
    const response = await send_massichat_message({
      userId: 'test-user-123',
      message: 'I want to build strength but I have knee pain. What exercises should I do?',
      includeAssessments: true
    });

    expect(response.message).toMatch(/NASM|exercise|knee|modification/i);
    expect(response.workoutProposal).toBeDefined();
    expect(response.workoutProposal.exercises).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          movement_pattern: expect.any(String),
          coaching_cues: expect.arrayContaining([expect.any(String)])
        })
      ])
    );
  });
});
```

---

## **PART 5: MAINTENANCE & UPDATES**

### **5.1 Adding New Content**

When new NASM CPT sections are ready:

1. **Add .docx to source folder**
   ```bash
   cp ~/Downloads/NASM_CPT_Ch09_Core_Training.docx \
      public/databases/NASM_CPT/source_documents/
   ```

2. **Run conversion script**
   ```bash
   ./scripts/convert_nasm_cpt.sh
   ```

3. **Manual optimisation**
   - Open `public/databases/NASM_CPT/converted/NASM_CPT_Ch09_Core_Training.md`
   - Add YAML frontmatter
   - Enhance structure per section 1.2
   - Extract coaching cues

4. **Regenerate embeddings**
   ```typescript
   // In admin panel or via script
   await embed_nasm_cpt_documents();
   ```

5. **Test and commit**
   ```bash
   npm test -- nasm_parsing.test.ts
   git add public/databases/NASM_CPT/
   git commit -m "Add NASM CPT: Core Training (Ch 9)"
   ```

---

### **5.2 Content Update Strategy**

#### **When to Update**
- NASM releases new CPT edition
- Errors discovered in existing content
- New research invalidates previous recommendations

#### **How to Update**
1. Create new version: `NASM_CPT_Ch05_OPT_Model_v2.md`
2. Keep old version for reference
3. Update embeddings (deletes old, adds new)
4. Test thoroughly before deployment

---

## **PART 6: SUCCESS METRICS**

### **6.1 Conversion Success**
- ✅ All planned NASM CPT sections converted (target: 15-20 sections)
- ✅ Zero parsing errors in unit tests
- ✅ Markdown linter passes with 0 warnings

### **6.2 AI Integration Success**
- ✅ Coaching cues display correctly in workout log
- ✅ Massichat retrieves relevant NASM knowledge (similarity > 0.7)
- ✅ User feedback indicates helpful, accurate recommendations

### **6.3 Performance Metrics**
- ✅ Vector search completes in <200ms
- ✅ Embedding generation completes in <5 minutes for full corpus
- ✅ Knowledge base contains 200+ semantic chunks

---

## **APPENDIX A: QUICK REFERENCE COMMANDS**

```bash
# Convert single document
pandoc public/databases/NASM_CPT/source_documents/file.docx \
  -f docx -t gfm --wrap=none \
  --extract-media=public/databases/NASM_CPT/media \
  -o public/databases/NASM_CPT/converted/file.md

# Batch convert all documents
./scripts/convert_nasm_cpt.sh

# Lint markdown files
markdownlint public/databases/NASM_CPT/converted/*.md

# Run parsing tests
npm test -- nasm_parsing.test.ts

# Generate embeddings (in Node REPL or admin panel)
node
> const { embed_nasm_cpt_documents } = require('./src/services/ai/vector_search.ts')
> await embed_nasm_cpt_documents()

# Check embedding count
psql -d massimino -c "SELECT COUNT(*) FROM fitness_knowledge_base WHERE \"documentName\" LIKE 'NASM_CPT%';"
```

---

## **APPENDIX B: TROUBLESHOOTING**

### **Issue: Pandoc conversion loses formatting**
**Solution:**
- Check original .docx file for complex tables/nested lists
- Manually reformat in markdown after conversion
- Consider using `--preserve-tabs` flag

### **Issue: Vector search returns irrelevant results**
**Solution:**
- Check similarity scores (should be >0.6 for relevant results)
- Reduce chunk size for more granular search
- Add more metadata filters (movement_pattern, opt_phase)

### **Issue: Parsing function returns empty array**
**Solution:**
- Verify markdown structure matches expected format (see 1.2)
- Check regex patterns in parsing functions
- Add console.log() debugging to see what's being matched

---

**Last Updated:** 2025-10-05
**Version:** 1.0
**Maintained By:** Massimino Development Team
