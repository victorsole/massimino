# NASM CPT Knowledge Base

This directory contains NASM Certified Personal Trainer educational content converted to markdown format for use in Massimino's AI systems.

## Directory Structure

```
NASM_CPT/
├── README.md                    ← You are here
├── IMPLEMENTATION_PLAN.md       ← Comprehensive conversion & integration guide
├── CHANGELOG.md                 ← Version history of content additions
├── source_documents/            ← Original .docx files (10-20 pages each)
├── converted/                   ← AI-optimised markdown files
└── media/                       ← Extracted images, charts, diagrams
```

## Quick Start

### Adding New Content

1. **Add .docx file** (10-20 pages max per file)
   ```bash
   cp ~/Downloads/NASM_CPT_Ch05_OPT_Model.docx public/databases/NASM_CPT/source_documents/
   ```

2. **Run conversion**
   ```bash
   ./scripts/convert_nasm_cpt.sh
   ```

3. **Manual optimisation** (IMPORTANT!)
   - Open `converted/NASM_CPT_Ch05_OPT_Model.md`
   - Add YAML frontmatter (see IMPLEMENTATION_PLAN.md section 1.3)
   - Extract coaching cues into bullet points
   - Structure exercises with movement patterns
   - Tag OPT phases explicitly

4. **Generate embeddings** (for Massichat)
   ```typescript
   // In Node REPL or admin panel
   const { embed_nasm_cpt_documents } = require('./src/services/ai/vector_search.ts')
   await embed_nasm_cpt_documents()
   ```

5. **Test & commit**
   ```bash
   npm test -- nasm_parsing.test.ts
   git add public/databases/NASM_CPT/
   git commit -m "Add NASM CPT: OPT Model (Ch 5)"
   ```

## File Naming Convention

```
NASM_CPT_[ChapterNumber]_[SectionName].docx
```

Examples:
- `NASM_CPT_Ch05_OPT_Model.docx`
- `NASM_CPT_Ch07_Movement_Patterns.docx`
- `NASM_CPT_Ch08_Exercise_Technique_Squat.docx`

## Content Priority

### High Priority
1. OPT Model (Stabilisation, Strength, Power phases)
2. Training Principles (Progressive Overload, Specificity)
3. Movement Patterns (PUSH, PULL, HINGE, SQUAT, LUNGE, ROTATION, CARRY)
4. Exercise Technique & Coaching Cues
5. Program Design Variables

### Medium Priority
6. Postural Assessment Integration
7. Flexibility Training
8. Cardiorespiratory Training

### Lower Priority
9. Special Populations
10. Sports Performance

See `IMPLEMENTATION_PLAN.md` Part 1.1 for full content breakdown.

## Integration with Massimino

### Direct Parsing (Workout Log)
The workout suggestion service reads markdown files to provide:
- Coaching cues during exercise entry
- Exercise recommendations based on OPT phase
- Movement pattern classifications

**File:** `/src/services/ai/workout-suggestions.ts`

### Vectorisation (Massichat)
Documents are chunked and embedded for semantic search:
- User asks: "How do I fix knee valgus during squats?"
- AI retrieves relevant NASM CPT content
- Provides evidence-based recommendations

**File:** `/src/services/ai/vector_search.ts`

## Quality Standards

Every converted markdown file must:
- ✅ Include YAML frontmatter
- ✅ Follow standardised structure (see IMPLEMENTATION_PLAN.md 1.2)
- ✅ Extract coaching cues into bulleted lists
- ✅ Tag movement patterns explicitly
- ✅ Label OPT phases clearly
- ✅ Pass markdown linter with 0 warnings

## Testing

```bash
# Lint markdown files
markdownlint public/databases/NASM_CPT/converted/*.md

# Test parsing functions
npm test -- nasm_parsing.test.ts

# Check embedding count
psql -d massimino -c "SELECT COUNT(*) FROM fitness_knowledge_base WHERE \"documentName\" LIKE 'NASM_CPT%';"
```

## Current Status

**Converted Documents:** 0
**Embedded Chunks:** 0
**Last Updated:** 2025-10-05

See `CHANGELOG.md` for version history.

---

**For detailed implementation instructions, see:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
