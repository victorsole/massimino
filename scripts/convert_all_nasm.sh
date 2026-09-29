#!/bin/bash
# Master NASM Document Conversion Script
# Converts both NASM CPT and NASM CNC documents

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}========================================${NC}"
echo -e "${PURPLE}  NASM Knowledge Base Conversion${NC}"
echo -e "${PURPLE}  CPT + CNC → Markdown${NC}"
echo -e "${PURPLE}========================================${NC}"
echo ""

# Check if Pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo -e "${YELLOW}⚠️  Pandoc is not installed!${NC}"
    echo "Please install it first: brew install pandoc"
    exit 1
fi

echo -e "${GREEN}✓${NC} Pandoc detected ($(pandoc --version | head -n1))"
echo ""

# Convert NASM CPT
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: NASM CPT Conversion${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
./scripts/convert_nasm_cpt.sh

echo ""
echo ""

# Convert NASM CNC
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: NASM CNC Conversion${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
./scripts/convert_nasm_cnc.sh

echo ""
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 All Conversions Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Count converted files
cpt_count=$(find data/knowledge/NASM_CPT/converted -name "*.md" 2>/dev/null | wc -l)
cnc_count=$(find data/knowledge/NASM_CNC/converted -name "*.md" 2>/dev/null | wc -l)
total_count=$((cpt_count + cnc_count))

echo -e "📊 Conversion Summary:"
echo -e "  • NASM CPT: ${GREEN}$cpt_count${NC} markdown file(s)"
echo -e "  • NASM CNC: ${GREEN}$cnc_count${NC} markdown file(s)"
echo -e "  • Total: ${GREEN}$total_count${NC} file(s)"
echo ""

echo -e "${YELLOW}⚠️  Next Steps (for all files):${NC}"
echo "1. Review markdown files for formatting issues"
echo "2. Add YAML frontmatter (see respective IMPLEMENTATION_PLAN.md files)"
echo "3. Enhance structure and extract key information:"
echo "   - CPT: coaching cues, movement patterns, OPT phases"
echo "   - CNC: sample meals, macro ratios, hydration protocols"
echo "4. Run tests:"
echo "   npm test -- nasm_parsing.test.ts"
echo "   npm test -- nasm_nutrition_parsing.test.ts"
echo "5. Generate embeddings for Massichat:"
echo "   - Run embedding scripts (see IMPLEMENTATION_PLAN.md Part 3.2)"
echo "6. Commit to git:"
echo "   git add data/knowledge/"
echo "   git commit -m \"Add NASM CPT/CNC knowledge base\""
echo ""
echo -e "${GREEN}✨ Ready to power Massichat with NASM knowledge!${NC}"
echo ""
