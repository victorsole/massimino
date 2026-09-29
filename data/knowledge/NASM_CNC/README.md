# NASM CNC Knowledge Base

This directory contains NASM Certified Nutrition Coach educational content converted to markdown format for use in Massimino's AI systems.

## Directory Structure

```
NASM_CNC/
├── README.md                    ← You are here
├── IMPLEMENTATION_PLAN.md       ← Comprehensive conversion & integration guide
├── CHANGELOG.md                 ← Version history of content additions
├── source_documents/            ← Original .docx files (10-20 pages each)
├── converted/                   ← AI-optimised markdown files
└── media/                       ← Extracted images, nutrition charts, food pyramids
```

## Quick Start

### Adding New Content

1. **Add .docx file** (10-20 pages max per file)
   ```bash
   cp ~/Downloads/NASM_CNC_Ch07_Performance_Nutrition.docx public/databases/NASM_CNC/source_documents/
   ```

2. **Run conversion**
   ```bash
   ./scripts/convert_nasm_cnc.sh
   ```

3. **Manual optimisation** (IMPORTANT!)
   - Open `converted/NASM_CNC_Ch07_Performance_Nutrition.md`
   - Add YAML frontmatter (see IMPLEMENTATION_PLAN.md section 1.3)
   - Format nutrition tables properly
   - Extract sample meals into structured format
   - Tag nutrition goals explicitly

4. **Generate embeddings** (for Massichat)
   ```typescript
   // In Node REPL or admin panel
   const { embed_nasm_cnc_documents } = require('./src/services/ai/vector_search.ts')
   await embed_nasm_cnc_documents()
   ```

5. **Test & commit**
   ```bash
   npm test -- nasm_nutrition_parsing.test.ts
   git add public/databases/NASM_CNC/
   git commit -m "Add NASM CNC: Performance Nutrition (Ch 7)"
   ```

## File Naming Convention

```
NASM_CNC_[ChapterNumber]_[SectionName].docx
```

Examples:
- `NASM_CNC_Ch03_Macronutrients_Carbohydrates.docx`
- `NASM_CNC_Ch07_Performance_Nutrition.docx`
- `NASM_CNC_Ch09_Hydration_Strategies.docx`

## Content Priority

### High Priority
1. Macronutrients Fundamentals (Protein, Carbs, Fats)
2. Energy Balance & Metabolism (TDEE, BMR, caloric strategies)
3. Performance Nutrition (Pre/Intra/Post workout)
4. Hydration Science
5. Nutrition for Specific Goals (Fat Loss, Muscle Gain, Performance)

### Medium Priority
6. Meal Planning & Preparation
7. Supplementation (evidence-based)
8. Micronutrients & Health

### Lower Priority
9. Special Populations (vegetarian, older adults, etc.)
10. Behaviour Change & Coaching

See `IMPLEMENTATION_PLAN.md` Part 1.1 for full content breakdown.

## Integration with Massimino

### Direct Parsing (Macro Calculator)
The nutrition service reads markdown files to provide:
- Macronutrient targets based on fitness goals
- Pre/post workout meal recommendations
- Hydration protocols

**File:** `/src/services/nutrition/macro_calculator.ts`

### Vectorisation (Massichat)
Documents are chunked and embedded for semantic search:
- User asks: "What should I eat before a morning workout?"
- AI retrieves relevant NASM CNC content
- Provides personalised nutrition guidance

**File:** `/src/services/ai/vector_search.ts`

### Dashboard Integration
Nutrition targets display on user dashboard:
- Daily calorie target (TDEE-based)
- Protein/Carbs/Fats in grams
- Pre/post workout meal suggestions

**File:** `/src/app/dashboard/page.tsx`

## Quality Standards

Every converted markdown file must:
- ✅ Include YAML frontmatter
- ✅ Follow standardised structure (see IMPLEMENTATION_PLAN.md 1.2)
- ✅ Format nutrition tables properly
- ✅ Extract sample meals with macros
- ✅ Tag nutrition goals explicitly
- ✅ Pass markdown linter with 0 warnings

## Testing

```bash
# Lint markdown files
markdownlint public/databases/NASM_CNC/converted/*.md

# Test parsing functions
npm test -- nasm_nutrition_parsing.test.ts

# Check embedding count
psql -d massimino -c "SELECT COUNT(*) FROM fitness_knowledge_base WHERE \"documentName\" LIKE 'NASM_CNC%';"
```

## Current Status

**Converted Documents:** 0
**Embedded Chunks:** 0
**Last Updated:** 2025-10-05

See `CHANGELOG.md` for version history.

---

**For detailed implementation instructions, see:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
