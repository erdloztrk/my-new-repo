#!/bin/bash
# Download GEBCO 2025 bathymetry data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"

echo "📥 GEBCO 2025 Download Script"
echo "=============================="
echo ""

# Create directories
mkdir -p "$DATA_DIR/raw"
mkdir -p "$DATA_DIR/processed"

# GEBCO 2025 download URLs
GEBCO_2025_GEOTIFF_URL="https://dap.ceda.ac.uk/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/geotiff/gebco_2025_sub_ice_topo_geotiff.zip"
GEBCO_2025_NETCDF_URL="https://dap.ceda.ac.uk/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/netcdf/gebco_2025_sub_ice_topo.zip"

OUTPUT_FILE="$DATA_DIR/raw/gebco_2025_geotiff.zip"
EXTRACTED_DIR="$DATA_DIR/raw/gebco_2025_geotiff"

echo "Downloading GEBCO 2025 GeoTIFF..."
echo "URL: $GEBCO_2025_GEOTIFF_URL"
echo "Output: $OUTPUT_FILE"
echo ""
echo "⚠️  This is a large file (~4 GB compressed, ~8 GB uncompressed)"
echo "   Download may take 10-30 minutes depending on your connection."
echo ""

# Check if file already exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "✓ File already exists: $OUTPUT_FILE"
    read -p "Download again? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping download."
    else
        echo "Downloading..."
        curl -L -o "$OUTPUT_FILE" "$GEBCO_2025_GEOTIFF_URL"
    fi
else
    echo "Downloading..."
    curl -L -o "$OUTPUT_FILE" "$GEBCO_2025_GEOTIFF_URL"
fi

if [ ! -f "$OUTPUT_FILE" ]; then
    echo "❌ Download failed!"
    exit 1
fi

echo ""
echo "✓ Download complete!"
echo ""
echo "Extracting..."
cd "$DATA_DIR/raw"
unzip -q -o "$OUTPUT_FILE" -d "$EXTRACTED_DIR" || {
    echo "❌ Extraction failed. Trying alternative method..."
    # Try with different unzip options
    unzip -o "$OUTPUT_FILE" -d "$EXTRACTED_DIR"
}

# Find the GeoTIFF file (it might be in a subdirectory)
GEOTIFF_FILE=$(find "$EXTRACTED_DIR" -name "*.tif" -o -name "*.tiff" | head -1)

if [ -z "$GEOTIFF_FILE" ]; then
    echo "❌ GeoTIFF file not found in archive!"
    echo "Contents:"
    ls -la "$EXTRACTED_DIR"
    exit 1
fi

# Copy to standard location
FINAL_FILE="$DATA_DIR/raw/gebco_2025.tif"
cp "$GEOTIFF_FILE" "$FINAL_FILE"

echo ""
echo "✓ Extraction complete!"
echo "GeoTIFF file: $FINAL_FILE"
echo ""
echo "Next steps:"
echo "1. Run: python scripts/bathymetry/crop_gebco.py --input $FINAL_FILE --output data/processed/gebco_turkey.tif --bbox 25.0 42.0 30.0 40.0"
echo "2. Run: python scripts/bathymetry/create_cog.py --input data/processed/gebco_turkey.tif --output data/processed/gebco_turkey_cog.tif"
echo "3. Or use: make -C scripts/bathymetry process-gebco"

