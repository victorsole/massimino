#!/bin/bash
# NASM CNC Document Conversion Script
# Converts .docx files to markdown using Pandoc

set -e  # Exit on error

SOURCE_DIR="public/databases/NASM_CNC/source_documents"
OUTPUT_DIR="public/databases/NASM_CNC/converted"
MEDIA_DIR="public/databases/NASM_CNC/media"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NASM CNC Document Conversion${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create directories if they don't exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$MEDIA_DIR"

# Check if Pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo -e "${YELLOW}⚠️  Pandoc is not installed!${NC}"
    echo "Please install it first: brew install pandoc"
    exit 1
fi

# Count files to convert
file_count=$(find "$SOURCE_DIR" -name "*.docx" -not -name "~\$*" | wc -l)

if [ "$file_count" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No .docx files found in $SOURCE_DIR${NC}"
    echo "Please add NASM CNC .docx files to convert."
    exit 0
fi

echo -e "Found ${GREEN}$file_count${NC} document(s) to convert"
echo ""

# Convert all .docx files (excluding temporary files)
count=0
for docx_file in "$SOURCE_DIR"/*.docx; do
    # Skip if no files match
    [ -e "$docx_file" ] || continue

    # Skip temporary Word files (start with ~$)
    if [[ $(basename "$docx_file") == ~\$* ]]; then
        continue
    fi

    filename=$(basename "$docx_file" .docx)
    count=$((count + 1))

    echo -e "${BLUE}[$count/$file_count]${NC} Converting: ${GREEN}$filename.docx${NC}"

    pandoc \
        "$docx_file" \
        -f docx \
        -t gfm \
        --wrap=none \
        --extract-media="$MEDIA_DIR" \
        -o "$OUTPUT_DIR/$filename.md"

    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Successfully created:${NC} $filename.md"
    else
        echo -e "  ${YELLOW}❌ Failed to convert:${NC} $filename.docx"
    fi
    echo ""
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Conversion Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📁 Converted files: ${BLUE}$OUTPUT_DIR${NC}"
echo -e "🖼️  Extracted media: ${BLUE}$MEDIA_DIR${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Review converted markdown files for formatting issues"
echo "2. Add YAML frontmatter to each file (see IMPLEMENTATION_PLAN.md)"
echo "3. Format nutrition tables and extract sample meals"
echo "4. Run tests: npm test -- nasm_nutrition_parsing.test.ts"
echo "5. Generate embeddings for Massichat vectorization"
echo ""
