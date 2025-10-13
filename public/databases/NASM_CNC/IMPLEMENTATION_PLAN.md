# NASM CNC KNOWLEDGE BASE IMPLEMENTATION PLAN
## NASM Certified Nutrition Coach Content → Massimino AI Integration

---

## **EXECUTIVE SUMMARY**

This document outlines the complete implementation plan for converting NASM Certified Nutrition Coach (CNC) educational content from .docx format into structured markdown files, and integrating this nutrition knowledge into Massimino's AI-powered recommendation system (Massichat).

### **Purpose**
Transform authoritative NASM CNC content into machine-readable, AI-optimised nutrition knowledge that powers:
- **Massichat nutritional guidance** - Personalised nutrition recommendations
- **Workout-nutrition integration** - Pre/post workout fuelling strategies
- **Assessment-based nutrition** - Nutrition plans based on body composition assessments
- **Goal-specific nutrition** - Macronutrient targets aligned with fitness goals

### **Scope**
- Source: NASM CNC certification textbook sections (10-20 pages per .docx)
- Target: Structured markdown files optimised for AI parsing and vector search
- Integration: Dual-purpose usage (direct parsing + vectorised RAG for Massichat)
- Timeline: Ongoing content addition as documents are prepared

---

## **PART 1: CONTENT STRUCTURE & REQUIREMENTS**

### **1.1 Expected NASM CNC Content Sections**

The following sections from NASM CNC should be prioritised for conversion:

#### **High Priority - Core Nutrition Science**
1. **Macronutrients Fundamentals**
   - **Carbohydrates**
     - Types (simple, complex, fibre)
     - Glycaemic index/load
     - Timing for performance
     - Recommended intake by goal
   - **Proteins**
     - Complete vs incomplete proteins
     - Timing for muscle synthesis
     - Requirements by activity level
     - Quality sources
   - **Fats**
     - Saturated, unsaturated, trans fats
     - Essential fatty acids (omega-3, omega-6)
     - Role in hormone production
     - Recommended intake

2. **Energy Balance & Metabolism**
   - Total Daily Energy Expenditure (TDEE)
   - Basal Metabolic Rate (BMR) calculation
   - Thermic Effect of Food (TEF)
   - Activity Energy Expenditure (AEE)
   - Caloric surplus vs deficit strategies
   - Metabolic adaptation

3. **Performance Nutrition**
   - **Pre-Workout Nutrition**
     - Timing (30min - 3hrs before)
     - Macronutrient ratios
     - Hydration strategies
     - Foods to avoid
   - **Intra-Workout Nutrition**
     - When necessary (duration >90min)
     - Carbohydrate recommendations
     - Electrolyte replacement
   - **Post-Workout Nutrition**
     - Anabolic window (0-2hrs)
     - Protein for recovery
     - Carbohydrates for glycogen replenishment
     - Hydration replacement ratios

4. **Hydration Science**
   - Water balance and regulation
   - Dehydration effects on performance
   - Electrolyte balance (sodium, potassium, magnesium)
   - Hydration assessment methods
   - Pre/during/post exercise hydration protocols

5. **Nutrition for Specific Goals**
   - **Fat Loss**
     - Caloric deficit strategies
     - Macronutrient distribution
     - Meal timing
     - Metabolic rate preservation
   - **Muscle Gain**
     - Caloric surplus magnitude
     - Protein timing and distribution
     - Carbohydrate cycling
     - Supplement considerations
   - **Athletic Performance**
     - Sport-specific nutrition
     - Periodised nutrition
     - Competition day protocols

#### **Medium Priority - Applied Nutrition**
6. **Meal Planning & Preparation**
   - Macronutrient calculation
   - Meal frequency strategies
   - Food substitutions
   - Portion control methods
   - Meal prep strategies

7. **Supplementation**
   - Evidence-based supplements:
     - Protein powder (whey, casein, plant-based)
     - Creatine monohydrate
     - Beta-alanine
     - Caffeine
     - BCAAs (when useful)
   - Supplement timing
   - Safety and quality considerations

8. **Micronutrients & Health**
   - Vitamins (water-soluble, fat-soluble)
   - Minerals (macro, trace)
   - Antioxidants
   - Deficiency risks for athletes
   - Food sources

#### **Lower Priority - Specialised Topics**
9. **Nutrition for Special Populations**
   - Vegetarian/vegan athletes
   - Older adults
   - Youth athletes
   - Pregnancy and postpartum
   - Medical conditions (diabetes, hypertension)

10. **Behaviour Change & Coaching**
    - Nutrition coaching strategies
    - Habit formation
    - Motivational interviewing
    - Tracking and accountability
    - Common barriers and solutions

---

### **1.2 Required Markdown Structure**

Each converted .md file must follow this standardised structure for optimal AI parsing:

```markdown
# [Section Title] - NASM CNC

## Overview
[Brief 2-3 sentence summary of the section]

## Key Concepts

### Concept 1: [Name]
**Definition:** [Clear, concise definition]

**Application:** [How this applies to fitness/nutrition]

**Evidence:** [Key research findings or NASM guidelines]

**Example:** [Practical example]

## Macronutrient Guidelines

### [Macronutrient Name]
**Function:** [Primary roles in the body]

**Performance Impact:** [How it affects exercise/recovery]

**Recommended Intake:**
- **Sedentary:** [g/kg bodyweight]
- **Moderate Activity:** [g/kg bodyweight]
- **High Activity:** [g/kg bodyweight]

**Timing Recommendations:**
- **Pre-Workout:** [Amount and timing]
- **Post-Workout:** [Amount and timing]
- **Daily Distribution:** [How to spread intake]

**Quality Sources:**
- [Source 1] - [Serving size, macro content]
- [Source 2] - [Serving size, macro content]
- [Source 3] - [Serving size, macro content]

**Common Mistakes:**
- ❌ [Mistake 1] → ✅ [Correction]
- ❌ [Mistake 2] → ✅ [Correction]

## Goal-Specific Protocols

### For [Specific Goal: Fat Loss/Muscle Gain/Performance]
**Caloric Target:** [TDEE + adjustment]

**Macronutrient Ratio:**
- Protein: [percentage or g/kg]
- Carbohydrates: [percentage or g/kg]
- Fats: [percentage or g/kg]

**Meal Timing Strategy:** [Description]

**Sample Day:**
- **Breakfast:** [Example meal with macros]
- **Pre-Workout:** [Example meal with macros]
- **Post-Workout:** [Example meal with macros]
- **Dinner:** [Example meal with macros]
- **Total:** [Calories, P/C/F]

## Hydration Protocols

### [Situation: Pre-Workout/During/Post-Workout]
**Timing:** [When to hydrate]

**Amount:** [ml or oz recommendations]

**Considerations:**
- [Factor 1: temperature, duration, intensity]
- [Factor 2]

**Electrolyte Needs:** [When to add electrolytes]

## Assessment Integration

### Relevant Body Composition Findings
- **If [Assessment Finding: e.g., high body fat %]:** [Nutritional recommendation]
- **If [Assessment Finding: e.g., low muscle mass]:** [Nutritional recommendation]

### Relevant Health History Findings
- **If [Finding: e.g., diabetes]:** [Modification]
- **If [Finding: e.g., food allergies]:** [Modification]

## Practical Application

### Client Scenarios
**Scenario 1: [Description]**
- **Goal:** [Client's fitness goal]
- **Current Intake:** [What they're eating now]
- **Recommendation:** [Specific NASM-based advice]
- **Expected Outcome:** [Result]

## References
- NASM CNC Chapter: [Chapter number]
- Page: [Page range]
- Supporting Research: [Key studies if mentioned]
```

### **1.3 Metadata Requirements**

Each markdown file should begin with YAML frontmatter:

```yaml
---
source: NASM_CNC
chapter: [Chapter number]
section: [Section name]
topics:
  - [Topic 1: e.g., Macronutrients]
  - [Topic 2: e.g., Performance Nutrition]
nutrition_goals:
  - [Fat Loss/Muscle Gain/Performance/General Health]
macronutrients:
  - [Protein/Carbohydrates/Fats]
meal_timing:
  - [Pre-Workout/Post-Workout/Daily]
last_updated: [YYYY-MM-DD]
---
```

---

## **PART 2: CONVERSION PROCESS - DOCX TO MARKDOWN**

### **2.1 Pre-Conversion Preparation**

#### **Step 1: Document Review**
Before converting, review each .docx file to ensure:
- ✅ Content is from official NASM CNC materials
- ✅ Page count is 10-20 pages (manageable chunks)
- ✅ Section represents a complete, logical unit
- ✅ Nutrition tables (macros, meal plans) are clearly formatted
- ✅ Reference charts are saved separately as images if needed

#### **Step 2: File Naming Convention**
Use this naming structure:
```
NASM_CNC_[ChapterNumber]_[SectionName].docx
```

Examples:
- `NASM_CNC_Ch03_Macronutrients_Carbohydrates.docx`
- `NASM_CNC_Ch07_Performance_Nutrition.docx`
- `NASM_CNC_Ch09_Hydration_Strategies.docx`

#### **Step 3: Directory Organisation**
Place .docx files in:
```
public/databases/NASM_CNC/source_documents/
```

Converted .md files will go in:
```
public/databases/NASM_CNC/converted/
```

---

### **2.2 Pandoc Conversion Process**

#### **Basic Conversion Command**
```bash
pandoc \
  public/databases/NASM_CNC/source_documents/NASM_CNC_Ch07_Performance_Nutrition.docx \
  -f docx \
  -t gfm \
  --wrap=none \
  --extract-media=public/databases/NASM_CNC/media \
  -o public/databases/NASM_CNC/converted/NASM_CNC_Ch07_Performance_Nutrition.md
```

**Flags Explained:**
- `-f docx` - Input format (Microsoft Word)
- `-t gfm` - Output format (GitHub Flavoured Markdown)
- `--wrap=none` - Don't wrap long lines (better for AI parsing)
- `--extract-media` - Extract images (nutrition charts, food pyramids)
- `-o` - Output file path

#### **Batch Conversion Script**
For converting multiple files at once:

```bash
#!/bin/bash
# File: scripts/convert_nasm_cnc.sh

SOURCE_DIR="public/databases/NASM_CNC/source_documents"
OUTPUT_DIR="public/databases/NASM_CNC/converted"
MEDIA_DIR="public/databases/NASM_CNC/media"

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

echo "🎉 All NASM CNC conversions complete!"
```

**Usage:**
```bash
chmod +x scripts/convert_nasm_cnc.sh
./scripts/convert_nasm_cnc.sh
```

---

### **2.3 Post-Conversion Quality Control**

#### **Manual Review Checklist**
After Pandoc conversion, manually review each .md file:

1. **Formatting Issues**
   - [ ] Headers are properly formatted (# ## ###)
   - [ ] Nutrition tables are readable (often need manual reformatting)
   - [ ] Lists (meal plans, food sources) are correctly indented
   - [ ] Macro calculations are preserved
   - [ ] Special characters (±, ≥, ≤) are rendered correctly

2. **Content Accuracy**
   - [ ] No nutritional values lost in conversion
   - [ ] Charts/graphs are extracted and referenced
   - [ ] Formulas (TDEE, BMR) are correctly formatted
   - [ ] Food examples and meal plans are intact

3. **Structure Enhancement**
   - [ ] Add YAML frontmatter (see 1.3)
   - [ ] Extract macro recommendations into structured format
   - [ ] Create "Sample Meals" sections
   - [ ] Add goal-specific subsections

4. **AI Optimisation**
   - [ ] Convert narrative paragraphs into Q&A format where appropriate
   - [ ] Tag nutrition goals explicitly (FAT_LOSS, MUSCLE_GAIN, etc.)
   - [ ] Create "Common Mistakes" sections
   - [ ] Add practical application examples

#### **Example: Before vs After Optimisation**

**Before (Raw Pandoc Output):**
```markdown
Post-exercise nutrition is critical for recovery. Research shows that consuming
protein within 2 hours after training stimulates muscle protein synthesis.
Carbohydrates should also be consumed to replenish glycogen stores. A ratio
of 3:1 or 4:1 carbohydrate to protein is often recommended for endurance athletes.
```

**After (AI-Optimised):**
```markdown
## Post-Workout Nutrition Protocol

### Timing
**Optimal Window:** 0-2 hours post-exercise
**Critical Period:** First 30 minutes (highest glycogen reuptake rate)

### Macronutrient Targets

#### Protein
**Amount:** 0.25-0.4 g/kg bodyweight
**Function:** Stimulate muscle protein synthesis, repair damaged tissue
**Example:** 70kg athlete = 17.5-28g protein

**Quality Sources:**
- Whey protein shake (25g protein)
- Greek yoghurt (200g = 20g protein)
- Chicken breast (100g = 31g protein)
- Eggs (2 large = 12g protein)

#### Carbohydrates
**Amount (Endurance):** 1.0-1.2 g/kg bodyweight
**Amount (Strength):** 0.5-0.8 g/kg bodyweight
**Function:** Replenish muscle glycogen, reduce cortisol

**Carb:Protein Ratios by Goal:**
- **Endurance Athletes:** 3:1 or 4:1 (carb:protein)
- **Strength Athletes:** 2:1 or 1:1 (carb:protein)
- **Fat Loss:** 1:1 or 1:2 (carb:protein)

**Quality Sources:**
- White rice (1 cup = 45g carbs)
- Sweet potato (200g = 40g carbs)
- Banana (1 large = 30g carbs)
- Oats (1/2 cup dry = 27g carbs)

### Sample Post-Workout Meals

**Endurance Athlete (70kg, 4:1 ratio):**
- 28g protein + 112g carbohydrates
- Example: Protein shake (28g) + 2 bananas (60g carbs) + rice cakes with honey (52g carbs)
- **Total:** 460 calories | P: 28g | C: 112g | F: 2g

**Strength Athlete (80kg, 2:1 ratio):**
- 32g protein + 64g carbohydrates
- Example: Grilled chicken (150g = 32g protein) + white rice (1.5 cups = 67g carbs)
- **Total:** 416 calories | P: 32g | C: 67g | F: 3g

**Fat Loss Client (65kg, 1:1 ratio):**
- 26g protein + 26g carbohydrates
- Example: Greek yoghurt (150g = 15g protein) + whey protein (11g) + berries (26g carbs)
- **Total:** 200 calories | P: 26g | C: 26g | F: 2g

### Common Mistakes
- ❌ Waiting >2 hours to eat → ✅ "Eat within 30-60 minutes for optimal recovery"
- ❌ Only consuming protein → ✅ "Include carbs to optimise glycogen replenishment"
- ❌ Overeating calories → ✅ "Match intake to goal; surplus for muscle gain, deficit for fat loss"
- ❌ Low-quality protein (incomplete amino acids) → ✅ "Choose complete proteins or combine plant sources"
```

---

### **2.4 Version Control & Updates**

#### **Versioning Strategy**
Use Git to track all changes:

```bash
# After converting a new document
git add public/databases/NASM_CNC/converted/NASM_CNC_Ch07_Performance_Nutrition.md
git commit -m "Add NASM CNC: Performance Nutrition (Ch 7)"

# After manual optimisation
git add public/databases/NASM_CNC/converted/NASM_CNC_Ch07_Performance_Nutrition.md
git commit -m "Optimise Performance Nutrition for AI - add sample meals"
```

#### **Update Log**
Maintain a changelog in `public/databases/NASM_CNC/CHANGELOG.md`:

```markdown
# NASM CNC Knowledge Base - Changelog

## 2025-10-05
- ✅ Added: Macronutrients - Carbohydrates (Chapter 3)
- ✅ Added: Performance Nutrition (Chapter 7)
- 🔄 Updated: Hydration Strategies (added electrolyte protocols)

## 2025-10-12
- ✅ Added: Energy Balance & Metabolism (Chapter 5)
- ✅ Added: Nutrition for Fat Loss (Chapter 12)
```

---

## **PART 3: INTEGRATION WITH MASSIMINO**

### **3.1 Direct Parsing Integration** (Existing Workout System)

#### **How It Works**
The AI service reads NASM CNC markdown files to provide nutrition context:

**File:** `/src/services/ai/workout-suggestions.ts`

```typescript
import fs from 'fs';
import path from 'path';

interface NutritionRecommendation {
  goal: string;
  pre_workout: {
    timing: string;
    protein: string;
    carbs: string;
    sample_meal: string;
  };
  post_workout: {
    timing: string;
    protein: string;
    carbs: string;
    sample_meal: string;
  };
  daily_targets: {
    calories: number;
    protein_g_per_kg: number;
    carbs_g_per_kg: number;
    fats_g_per_kg: number;
  };
}

// Parse NASM CNC knowledge base
export function parse_nasm_cnc_knowledge(
  fitness_goal: string
): NutritionRecommendation | null {
  const base_path = path.join(process.cwd(), 'public/databases/NASM_CNC/converted');
  const files = fs.readdirSync(base_path).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(base_path, file), 'utf-8');

    // Search for goal-specific protocols
    const goal_pattern = new RegExp(
      `### For ${fitness_goal}[\\s\\S]*?\\*\\*Macronutrient Ratio:\\*\\*[\\s\\S]*?(?=###|##|$)`,
      'i'
    );

    const match = content.match(goal_pattern);
    if (match) {
      return extract_nutrition_data(match[0], fitness_goal);
    }
  }

  return null; // Fallback if not found
}

function extract_nutrition_data(
  section_text: string,
  goal: string
): NutritionRecommendation {
  // Extract macronutrient ratios
  const protein_match = section_text.match(/Protein:\s+(.+)/);
  const carbs_match = section_text.match(/Carbohydrates:\s+(.+)/);
  const fats_match = section_text.match(/Fats:\s+(.+)/);

  // Extract sample meals
  const pre_workout_match = section_text.match(/\*\*Pre-Workout:\*\*\s+(.+)/);
  const post_workout_match = section_text.match(/\*\*Post-Workout:\*\*\s+(.+)/);

  return {
    goal,
    pre_workout: {
      timing: '1-3 hours before training',
      protein: protein_match?.[1] || 'Not specified',
      carbs: carbs_match?.[1] || 'Not specified',
      sample_meal: pre_workout_match?.[1] || 'See NASM CNC guidelines'
    },
    post_workout: {
      timing: '0-2 hours after training',
      protein: protein_match?.[1] || 'Not specified',
      carbs: carbs_match?.[1] || 'Not specified',
      sample_meal: post_workout_match?.[1] || 'See NASM CNC guidelines'
    },
    daily_targets: {
      calories: 0, // Calculate based on user TDEE
      protein_g_per_kg: parse_g_per_kg(protein_match?.[1]),
      carbs_g_per_kg: parse_g_per_kg(carbs_match?.[1]),
      fats_g_per_kg: parse_g_per_kg(fats_match?.[1])
    }
  };
}

function parse_g_per_kg(text: string | undefined): number {
  if (!text) return 0;
  const match = text.match(/([\d.]+)\s*g\/kg/);
  return match ? parseFloat(match[1]) : 0;
}

// Get hydration recommendations
export function get_hydration_protocol(
  workout_duration_minutes: number,
  intensity: string
): { pre: string; during: string; post: string } {
  const base_path = path.join(process.cwd(), 'public/databases/NASM_CNC/converted');
  const files = fs.readdirSync(base_path).filter(f => f.includes('Hydration'));

  if (files.length === 0) {
    return {
      pre: '500ml 2 hours before, 250ml 15 min before',
      during: '150-250ml every 15-20 min',
      post: '150% of fluid lost (weigh before/after)'
    };
  }

  const content = fs.readFileSync(path.join(base_path, files[0]), 'utf-8');

  // Extract hydration protocols
  // (Similar pattern matching as above)

  return {
    pre: extract_protocol(content, 'Pre-Workout'),
    during: extract_protocol(content, 'During'),
    post: extract_protocol(content, 'Post-Workout')
  };
}
```

#### **Usage in Workout Suggestions**
When AI generates workout recommendations, include nutrition context:

```typescript
// File: /src/services/ai/workout-suggestions.ts

export async function generate_ai_workout_suggestions(user_id: string) {
  const user = await prisma.users.findUnique({ where: { id: user_id } });
  const fitness_goal = user?.fitnessGoals || 'GENERAL_FITNESS';

  // Get NASM CNC nutrition recommendations
  const nutrition = parse_nasm_cnc_knowledge(fitness_goal);

  // Build AI prompt
  const prompt = `Generate 2-3 workout suggestions for a user with:
- Goal: ${fitness_goal}
- Experience: ${user?.experienceLevel}

NUTRITION CONTEXT (NASM CNC):
- Pre-Workout: ${nutrition?.pre_workout.sample_meal}
- Post-Workout: ${nutrition?.post_workout.sample_meal}
- Daily Protein: ${nutrition?.daily_targets.protein_g_per_kg}g/kg bodyweight

Include brief nutrition tips in the workout suggestions.`;

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content;
}
```

---

### **3.2 Vectorisation Integration** (Massichat AI)

#### **Why Vectorisation for Nutrition?**
Massichat users ask complex nutrition questions:
- "What should I eat before a morning workout if I'm trying to lose fat?"
- "How much protein do I need if I'm training 5 days a week?"
- "I'm vegetarian - what are good post-workout protein sources?"

Vector embeddings enable semantic search across ALL nutrition content.

#### **Vectorisation Workflow**

**Step 1: Chunk Documents**
Break NASM CNC markdown files into semantic chunks:

```typescript
// File: /src/services/ai/document_chunker.ts

export function chunk_nasm_cnc_document(
  markdown_content: string,
  file_name: string
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const frontmatter = extract_yaml_frontmatter(markdown_content);

  // Split by ## (second-level headers)
  const sections = markdown_content.split(/(?=^## )/gm);

  for (const section of sections) {
    // Nutrition sections often contain tables - keep them together
    if (section.includes('**Sample Day:**') || section.includes('| Food |')) {
      // Don't split - keep entire meal plan/table as one chunk
      chunks.push({
        content: section.trim(),
        metadata: {
          source_file: file_name,
          chapter: frontmatter.chapter || 'Unknown',
          section: extract_section_title(section),
          nutrition_goals: frontmatter.nutrition_goals || [],
          macronutrients: frontmatter.macronutrients || [],
          meal_timing: frontmatter.meal_timing || []
        }
      });
    } else if (estimate_tokens(section) > 1000) {
      // Split large sections by ###
      const subsections = section.split(/(?=^### )/gm);
      subsections.forEach(subsection => {
        chunks.push({
          content: subsection.trim(),
          metadata: {
            source_file: file_name,
            chapter: frontmatter.chapter || 'Unknown',
            section: extract_section_title(subsection),
            nutrition_goals: frontmatter.nutrition_goals || [],
            macronutrients: frontmatter.macronutrients || [],
            meal_timing: frontmatter.meal_timing || []
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
          nutrition_goals: frontmatter.nutrition_goals || [],
          macronutrients: frontmatter.macronutrients || [],
          meal_timing: frontmatter.meal_timing || []
        }
      });
    }
  }

  return chunks.filter(c => c.content.length > 100);
}
```

**Step 2: Generate Embeddings**
```typescript
// File: /src/services/ai/vector_search.ts

export async function embed_nasm_cnc_documents() {
  const base_path = path.join(process.cwd(), 'public/databases/NASM_CNC/converted');
  const files = fs.readdirSync(base_path).filter(f => f.endsWith('.md'));

  for (const file of files) {
    console.log(`Processing: ${file}`);
    const content = fs.readFileSync(path.join(base_path, file), 'utf-8');

    // Chunk the document
    const chunks = chunk_nasm_cnc_document(content, file);

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

  console.log('🎉 All NASM CNC documents embedded!');
}
```

**Step 3: Semantic Search for Nutrition**
```typescript
export async function search_nasm_nutrition_knowledge(
  query: string,
  nutrition_goal?: string,
  limit: number = 5
): Promise<KnowledgeResult[]> {
  // Embed the query
  const query_embedding_response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });
  const query_embedding = query_embedding_response.data[0].embedding;

  // Build where clause for filtering
  const goal_filter = nutrition_goal
    ? `AND metadata->>'nutrition_goals' LIKE '%${nutrition_goal}%'`
    : '';

  // Search with optional goal filtering
  const results = await prisma.$queryRaw`
    SELECT
      content,
      metadata,
      1 - (embedding <=> ${query_embedding}::vector) as similarity
    FROM fitness_knowledge_base
    WHERE "documentName" LIKE 'NASM_CNC%'
    ${goal_filter}
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
  const user = await prisma.users.findUnique({ where: { id: request.userId } });
  const fitness_goal = user?.fitnessGoals || 'GENERAL_FITNESS';

  // Search NASM CPT + CNC knowledge
  const training_knowledge = await search_nasm_knowledge(request.message, 3);
  const nutrition_knowledge = await search_nasm_nutrition_knowledge(
    request.message,
    fitness_goal,
    3
  );

  // Build combined context
  const knowledge_context = `
TRAINING KNOWLEDGE (NASM CPT):
${training_knowledge.map(r => r.content).join('\n\n---\n\n')}

NUTRITION KNOWLEDGE (NASM CNC):
${nutrition_knowledge.map(r => r.content).join('\n\n---\n\n')}
`;

  // Construct prompt
  const system_prompt = `You are Massimino's AI fitness coach, trained on NASM CPT and CNC principles.

${knowledge_context}

USER PROFILE:
- Goal: ${fitness_goal}
- Weight: ${user?.weight}kg
- Experience: ${user?.experienceLevel}

Provide evidence-based workout AND nutrition recommendations.`;

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

### **3.3 Nutrition Calculator Integration**

#### **Use NASM CNC Data for Auto-Calculations**

When user completes body composition assessment, auto-calculate macro targets:

```typescript
// File: /src/services/nutrition/macro_calculator.ts

import { parse_nasm_cnc_knowledge } from '../ai/workout-suggestions';

export async function calculate_macro_targets(user_id: string) {
  const user = await prisma.users.findUnique({ where: { id: user_id } });
  const latest_assessment = await prisma.assessments.findFirst({
    where: { clientId: user_id, type: 'body_composition', status: 'complete' },
    orderBy: { updatedAt: 'desc' }
  });

  if (!user || !latest_assessment) return null;

  // Get NASM CNC recommendations
  const fitness_goal = user.fitnessGoals || 'GENERAL_FITNESS';
  const nasm_nutrition = parse_nasm_cnc_knowledge(fitness_goal);

  // Calculate TDEE
  const bmr = calculate_bmr(user.weight, user.height, user.age, user.gender);
  const activity_multiplier = get_activity_multiplier(user.availableWorkoutDays);
  const tdee = bmr * activity_multiplier;

  // Adjust based on goal
  let calorie_target = tdee;
  if (fitness_goal === 'FAT_LOSS') {
    calorie_target = tdee * 0.85; // 15% deficit
  } else if (fitness_goal === 'MUSCLE_GAIN') {
    calorie_target = tdee * 1.10; // 10% surplus
  }

  // Apply NASM CNC macronutrient ratios
  const protein_g = (user.weight || 70) * (nasm_nutrition?.daily_targets.protein_g_per_kg || 1.6);
  const fats_g = (user.weight || 70) * (nasm_nutrition?.daily_targets.fats_g_per_kg || 0.8);
  const protein_calories = protein_g * 4;
  const fats_calories = fats_g * 9;
  const carbs_calories = calorie_target - protein_calories - fats_calories;
  const carbs_g = carbs_calories / 4;

  return {
    calorie_target: Math.round(calorie_target),
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fats_g: Math.round(fats_g),
    meal_suggestions: {
      pre_workout: nasm_nutrition?.pre_workout.sample_meal,
      post_workout: nasm_nutrition?.post_workout.sample_meal
    },
    hydration_protocol: get_hydration_protocol(60, 'MODERATE')
  };
}

function calculate_bmr(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  // Mifflin-St Jeor Equation (NASM CNC standard)
  if (gender === 'MALE') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}
```

#### **Display in Dashboard**
```tsx
// File: /src/app/dashboard/page.tsx

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const macro_targets = await calculate_macro_targets(session.user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🍽️ Your Nutrition Targets (NASM CNC)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Calories</p>
            <p className="text-2xl font-bold">{macro_targets.calorie_target}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Protein</p>
            <p className="text-2xl font-bold text-blue-600">{macro_targets.protein_g}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Carbs</p>
            <p className="text-2xl font-bold text-green-600">{macro_targets.carbs_g}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fats</p>
            <p className="text-2xl font-bold text-yellow-600">{macro_targets.fats_g}g</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">Pre-Workout Meal:</p>
          <p className="text-sm text-gray-700">{macro_targets.meal_suggestions.pre_workout}</p>

          <p className="text-sm font-semibold">Post-Workout Meal:</p>
          <p className="text-sm text-gray-700">{macro_targets.meal_suggestions.post_workout}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## **PART 4: TESTING & VALIDATION**

### **4.1 Conversion Quality Tests**

#### **Test 1: Markdown Validity**
```bash
markdownlint public/databases/NASM_CNC/converted/*.md
```

#### **Test 2: Nutrition Data Parsing**
```typescript
// File: /src/services/ai/__tests__/nasm_nutrition_parsing.test.ts

import { parse_nasm_cnc_knowledge, get_hydration_protocol } from '../workout-suggestions';

describe('NASM CNC Parsing', () => {
  it('should extract nutrition recommendations for FAT_LOSS', () => {
    const nutrition = parse_nasm_cnc_knowledge('FAT_LOSS');

    expect(nutrition).toBeDefined();
    expect(nutrition?.daily_targets.protein_g_per_kg).toBeGreaterThan(1.5);
    expect(nutrition?.pre_workout.timing).toMatch(/hour|min/i);
  });

  it('should return hydration protocol', () => {
    const protocol = get_hydration_protocol(60, 'MODERATE');

    expect(protocol.pre).toMatch(/ml|oz/i);
    expect(protocol.during).toMatch(/ml|oz/i);
    expect(protocol.post).toMatch(/ml|oz|%/i);
  });
});
```

---

### **4.2 Vectorisation Quality Tests**

```typescript
import { search_nasm_nutrition_knowledge } from '../vector_search';

describe('NASM CNC Vectorisation', () => {
  it('should find pre-workout nutrition guidance', async () => {
    const results = await search_nasm_nutrition_knowledge(
      'What should I eat before a workout?',
      undefined,
      3
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toMatch(/pre-workout|before training/i);
    expect(results[0].similarity).toBeGreaterThan(0.6);
  });

  it('should filter by nutrition goal', async () => {
    const results = await search_nasm_nutrition_knowledge(
      'How many calories should I eat?',
      'FAT_LOSS',
      3
    );

    expect(results[0].metadata.nutrition_goals).toContain('FAT_LOSS');
  });
});
```

---

### **4.3 Integration Tests**

```typescript
import { calculate_macro_targets } from '../nutrition/macro_calculator';

describe('NASM CNC Macro Calculator Integration', () => {
  it('should calculate macros using NASM CNC guidelines', async () => {
    const user_id = 'test-user-123';

    // Mock user with fat loss goal
    const macros = await calculate_macro_targets(user_id);

    expect(macros).toBeDefined();
    expect(macros.protein_g).toBeGreaterThan(100); // Assume 70kg user
    expect(macros.calorie_target).toBeLessThan(2500); // Deficit
    expect(macros.meal_suggestions.pre_workout).toBeDefined();
  });
});
```

---

## **PART 5: MAINTENANCE & UPDATES**

### **5.1 Adding New Content**

When new NASM CNC sections are ready:

1. **Add .docx to source folder**
   ```bash
   cp ~/Downloads/NASM_CNC_Ch12_Fat_Loss_Nutrition.docx \
      public/databases/NASM_CNC/source_documents/
   ```

2. **Run conversion script**
   ```bash
   ./scripts/convert_nasm_cnc.sh
   ```

3. **Manual optimisation**
   - Open converted .md file
   - Add YAML frontmatter
   - Format nutrition tables
   - Extract sample meals into structured format

4. **Regenerate embeddings**
   ```typescript
   await embed_nasm_cnc_documents();
   ```

5. **Test and commit**
   ```bash
   npm test -- nasm_nutrition_parsing.test.ts
   git add public/databases/NASM_CNC/
   git commit -m "Add NASM CNC: Fat Loss Nutrition (Ch 12)"
   ```

---

## **PART 6: SUCCESS METRICS**

### **6.1 Conversion Success**
- ✅ All planned NASM CNC sections converted (target: 10-15 sections)
- ✅ Nutrition tables formatted correctly
- ✅ Sample meals extracted for all goals

### **6.2 AI Integration Success**
- ✅ Macro calculator uses NASM CNC ratios
- ✅ Massichat retrieves relevant nutrition knowledge (similarity >0.7)
- ✅ Dashboard displays personalised nutrition targets

### **6.3 Performance Metrics**
- ✅ Vector search completes in <200ms
- ✅ Knowledge base contains 150+ nutrition chunks
- ✅ User satisfaction with nutrition recommendations

---

## **APPENDIX A: QUICK REFERENCE COMMANDS**

```bash
# Convert single document
pandoc public/databases/NASM_CNC/source_documents/file.docx \
  -f docx -t gfm --wrap=none \
  --extract-media=public/databases/NASM_CNC/media \
  -o public/databases/NASM_CNC/converted/file.md

# Batch convert
./scripts/convert_nasm_cnc.sh

# Lint markdown
markdownlint public/databases/NASM_CNC/converted/*.md

# Run tests
npm test -- nasm_nutrition_parsing.test.ts

# Generate embeddings
await embed_nasm_cnc_documents()

# Check count
psql -d massimino -c "SELECT COUNT(*) FROM fitness_knowledge_base WHERE \"documentName\" LIKE 'NASM_CNC%';"
```

---

## **APPENDIX B: TROUBLESHOOTING**

### **Issue: Nutrition tables lose formatting**
**Solution:**
- Manually reformat as markdown tables: `| Food | Protein | Carbs | Fats |`
- Or convert to structured lists

### **Issue: Macro calculations seem incorrect**
**Solution:**
- Verify g/kg values extracted correctly from markdown
- Check TDEE calculation (BMR × activity multiplier)
- Ensure goal-based adjustments are applied

---

**Last Updated:** 2025-10-05
**Version:** 1.0
**Maintained By:** Massimino Development Team
