#!/bin/bash
# Process Turkey GEBCO data (after manual download)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"

INPUT_FILE="$DATA_DIR/raw/gebco_2025_turkey.tif"
OUTPUT_COG="$DATA_DIR/processed/gebco_turkey_cog.tif"

echo "🔧 GEBCO Türkiye Verilerini İşleme"
echo "===================================="
echo ""

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Dosya bulunamadı: $INPUT_FILE"
    echo ""
    echo "Lütfen önce GEBCO verilerini indirin:"
    echo "1. https://betadownload.gebco.net adresine gidin"
    echo "2. Türkiye bölgesini seçin (25°E-45°E, 35°N-42°N)"
    echo "3. GeoTIFF formatında indirin"
    echo "4. Dosyayı şuraya koyun: $INPUT_FILE"
    exit 1
fi

echo "✓ Giriş dosyası bulundu: $INPUT_FILE"
echo "  Boyut: $(du -h "$INPUT_FILE" | cut -f1)"
echo ""

# Create processed directory
mkdir -p "$DATA_DIR/processed"

# Convert to COG
echo "COG formatına dönüştürülüyor..."
python3 "$SCRIPT_DIR/create_cog.py" \
    --input "$INPUT_FILE" \
    --output "$OUTPUT_COG"

if [ ! -f "$OUTPUT_COG" ]; then
    echo "❌ COG dönüştürme başarısız!"
    exit 1
fi

echo ""
echo "✓ İşleme tamamlandı!"
echo "  COG dosyası: $OUTPUT_COG"
echo "  Boyut: $(du -h "$OUTPUT_COG" | cut -f1)"
echo ""
echo "Backend'i başlatmak için:"
echo "  cd backend"
echo "  export COG_PATH=../$OUTPUT_COG"
echo "  uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"

