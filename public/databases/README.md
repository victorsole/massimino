# Massimino Knowledge Databases

This directory contains authoritative fitness and nutrition knowledge bases that power Massimino's AI features.

## 📚 Knowledge Bases

### 1. **NASM CPT** (Certified Personal Trainer)
Training science, exercise technique, coaching cues, and program design principles.

**Directory:** `NASM_CPT/`
**Status:** Ready for content (0 documents)
**Integration:** Workout Log, Massichat, Exercise Recommendations
**Docs:** [NASM_CPT/IMPLEMENTATION_PLAN.md](./NASM_CPT/IMPLEMENTATION_PLAN.md)

### 2. **NASM CNC** (Certified Nutrition Coach)
Nutrition science, macronutrient guidance, meal planning, and performance nutrition.

**Directory:** `NASM_CNC/`
**Status:** Ready for content (0 documents)
**Integration:** Massichat, Macro Calculator, Dashboard Nutrition Targets
**Docs:** [NASM_CNC/IMPLEMENTATION_PLAN.md](./NASM_CNC/IMPLEMENTATION_PLAN.md)

### 3. **Exercises Database**
CSV database of exercises with categories, equipment, muscle groups.

**File:** `exercises.csv`
**Status:** ✅ Active (1029 KB)
**Integration:** Workout Log, Exercise Selection

---

## 🚀 Quick Start

### Converting NASM Documents

#### Option 1: Convert All (Recommended)
```bash
./scripts/convert_all_nasm.sh
```

#### Option 2: Convert Individually
```bash
# NASM CPT only
./scripts/convert_nasm_cpt.sh

# NASM CNC only
./scripts/convert_nasm_cnc.sh
```

### Workflow
1. **Add .docx files** (10-20 pages each)
   - CPT → `NASM_CPT/source_documents/`
   - CNC → `NASM_CNC/source_documents/`

2. **Run conversion script**
   ```bash
   ./scripts/convert_all_nasm.sh
   ```

3. **Manual optimisation** (CRITICAL!)
   - Add YAML frontmatter
   - Extract coaching cues (CPT) or sample meals (CNC)
   - Structure content for AI parsing
   - See respective IMPLEMENTATION_PLAN.md files

4. **Generate embeddings** (for Massichat vectorization)
   ```typescript
   // CPT
   const { embed_nasm_cpt_documents } = require('./src/services/ai/vector_search.ts')
   await embed_nasm_cpt_documents()

   // CNC
   const { embed_nasm_cnc_documents } = require('./src/services/ai/vector_search.ts')
   await embed_nasm_cnc_documents()
   ```

5. **Test & commit**
   ```bash
   npm test -- nasm_parsing.test.ts
   npm test -- nasm_nutrition_parsing.test.ts
   git add public/databases/
   git commit -m "Add NASM knowledge base content"
   ```

---

## 🔌 Integration Architecture

### Dual-Purpose Usage

#### 1. **Direct Parsing** (Structured Data Extraction)
- Service layer reads markdown files directly
- Extracts specific data (coaching cues, macro ratios, etc.)
- Fast, deterministic retrieval
- Used in: Workout Log, Macro Calculator

**Files:**
- `/src/services/ai/workout-suggestions.ts` - Reads NASM CPT
- `/src/services/nutrition/macro_calculator.ts` - Reads NASM CNC

#### 2. **Vectorization** (Semantic Search / RAG)
- Documents chunked into semantic units
- Embedded using OpenAI `text-embedding-3-small`
- Stored in PostgreSQL with pgvector
- Retrieved via cosine similarity search
- Used in: Massichat conversational AI

**Files:**
- `/src/services/ai/document_chunker.ts` - Chunks documents
- `/src/services/ai/vector_search.ts` - Embeds & searches
- `/src/services/ai/massichat_service.ts` - Injects into AI prompts

### Data Flow

```
┌─────────────────┐
│  User Question  │
│ "How do I fix   │
│ knee valgus?"   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────┐   ┌─────────────────┐
│  Direct     │   │  Vector Search  │
│  Parsing    │   │  (Massichat)    │
└─────┬───────┘   └────────┬────────┘
      │                    │
      ▼                    ▼
┌──────────────┐   ┌────────────────┐
│ Read         │   │ Embed query    │
│ NASM_CPT/    │   │ Search DB      │
│ converted/   │   │ Top 5 chunks   │
│ *.md         │   │ by similarity  │
└──────┬───────┘   └────────┬───────┘
       │                    │
       │    ┌───────────────┘
       │    │
       ▼    ▼
  ┌────────────────┐
  │  AI Response   │
  │  (OpenAI or    │
  │   Anthropic)   │
  └────────────────┘
```

---

## 📊 Knowledge Base Status

| Database | Documents | Chunks | Integrated | Last Updated |
|----------|-----------|--------|------------|--------------|
| NASM CPT | 0         | 0      | ✅ Ready   | 2025-10-05   |
| NASM CNC | 0         | 0      | ✅ Ready   | 2025-10-05   |
| Exercises| 1 (CSV)   | N/A    | ✅ Active  | 2024-09-24   |

---

## 🧪 Testing

### Conversion Quality
```bash
# Lint all markdown files
markdownlint public/databases/NASM_CPT/converted/*.md
markdownlint public/databases/NASM_CNC/converted/*.md
```

### Parsing Accuracy
```bash
# Test NASM CPT parsing
npm test -- nasm_parsing.test.ts

# Test NASM CNC parsing
npm test -- nasm_nutrition_parsing.test.ts
```

### Vectorization
```bash
# Check embedding counts
psql -d massimino -c "
  SELECT
    CASE
      WHEN \"documentName\" LIKE 'NASM_CPT%' THEN 'NASM CPT'
      WHEN \"documentName\" LIKE 'NASM_CNC%' THEN 'NASM CNC'
      ELSE 'Other'
    END AS source,
    COUNT(*) as chunk_count
  FROM fitness_knowledge_base
  GROUP BY source;
"
```

### Integration Tests
```bash
# Test Massichat with NASM knowledge
npm test -- massichat_service.test.ts

# Test macro calculator with NASM CNC
npm test -- macro_calculator.test.ts
```

---

## 📖 Documentation

- **NASM CPT Implementation Plan:** [NASM_CPT/IMPLEMENTATION_PLAN.md](./NASM_CPT/IMPLEMENTATION_PLAN.md)
- **NASM CNC Implementation Plan:** [NASM_CNC/IMPLEMENTATION_PLAN.md](./NASM_CNC/IMPLEMENTATION_PLAN.md)
- **Massichat Integration:** See Massimino root `/MASSICHAT_PLAN.md`
- **Workout System Integration:** See Massimino root `/WORKOUT_IMPLEMENTATION_PLAN.md`

---

## 🎯 Success Metrics

### Conversion Success
- ✅ All planned documents converted (CPT: 15-20, CNC: 10-15)
- ✅ Markdown linter passes with 0 warnings
- ✅ Parsing tests pass at 100%

### AI Integration Success
- ✅ Coaching cues display in Workout Log
- ✅ Macro targets auto-calculate on Dashboard
- ✅ Massichat retrieves relevant knowledge (similarity >0.7)
- ✅ User feedback indicates helpful, accurate recommendations

### Performance Metrics
- ✅ Vector search completes in <200ms
- ✅ Embedding generation completes in <5 minutes per database
- ✅ Total knowledge base: 350+ semantic chunks

---

## 🔧 Maintenance

### Adding New Content
See respective README files:
- [NASM_CPT/README.md](./NASM_CPT/README.md)
- [NASM_CNC/README.md](./NASM_CNC/README.md)

### Updating Existing Content
1. Modify source .docx file
2. Re-run conversion script
3. Re-apply manual optimisations
4. Regenerate embeddings
5. Update CHANGELOG.md
6. Commit changes

### Version Control
All changes tracked in:
- `NASM_CPT/CHANGELOG.md`
- `NASM_CNC/CHANGELOG.md`

---

## 🚨 Troubleshooting

### Issue: Pandoc not found
```bash
brew install pandoc
```

### Issue: Conversion loses formatting
- Check source .docx for complex tables
- Manually reformat in markdown after conversion
- See IMPLEMENTATION_PLAN.md section 2.3

### Issue: Parsing returns empty arrays
- Verify markdown structure matches expected format
- Check regex patterns in parsing functions
- Add console.log() debugging

### Issue: Vector search returns irrelevant results
- Check similarity scores (should be >0.6)
- Reduce chunk size for more granular search
- Add metadata filters (movement_pattern, nutrition_goal)

---

**Need Help?** See implementation plans for detailed troubleshooting sections.

---

**Last Updated:** 2025-10-05
**Maintained By:** Massimino Development Team
