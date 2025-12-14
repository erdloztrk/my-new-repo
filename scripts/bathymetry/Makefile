# Bathymetry Data Pipeline Makefile

DATA_DIR = data
RAW_DIR = $(DATA_DIR)/raw
PROCESSED_DIR = $(DATA_DIR)/processed

# GEBCO files
GEBCO_INPUT_TIF = $(RAW_DIR)/gebco_2025_turkey.tif
GEBCO_CROPPED_TIF = $(PROCESSED_DIR)/gebco_turkey.tif
GEBCO_COG_TIF = $(PROCESSED_DIR)/gebco_turkey_cog.tif

# EMODnet files (higher resolution for coastal areas)
EMODNET_INPUT_TIF = $(RAW_DIR)/emodnet_f7_2024.tif
EMODNET_CROPPED_TIF = $(PROCESSED_DIR)/emodnet_turkey.tif
EMODNET_COG_TIF = $(PROCESSED_DIR)/emodnet_turkey_cog.tif

# Turkey bounding box (Aegean + Marmara)
# min_lon min_lat max_lon max_lat
BBOX = 25.0 40.0 30.0 42.0

.PHONY: all setup download download-emodnet crop crop-emodnet cog cog-emodnet process-gebco process-emodnet process-all clean

all: process-all

# Full setup: download + process both datasets
setup: process-all
	@echo ""
	@echo "✓ Setup complete!"
	@echo "GEBCO COG: $(GEBCO_COG_TIF)"
	@echo "EMODnet COG: $(EMODNET_COG_TIF)"
	@echo ""
	@echo "Next: Start backend with:"
	@echo "  cd backend && export GEBCO_COG_PATH=../$(GEBCO_COG_TIF) && export EMODNET_COG_PATH=../$(EMODNET_COG_TIF) && uvicorn src.main:app --reload"

# Download GEBCO 2025 for Turkey region only
download:
	@echo "Downloading GEBCO 2025 - Turkey region only..."
	@python3 download_turkey_opendap.py --output ../$(GEBCO_INPUT_TIF)

# Download EMODnet F7 tile (covers Turkey region)
download-emodnet:
	@echo "Downloading EMODnet F7 tile (Turkey region)..."
	@python3 download_emodnet.py \
		--output-dir ../$(RAW_DIR) \
		--output emodnet_f7_2024.tif

# Crop GEBCO to Turkey region
crop: $(GEBCO_CROPPED_TIF)

$(GEBCO_CROPPED_TIF): $(GEBCO_INPUT_TIF)
	@echo "Note: Input file is already cropped to Turkey region."
	@echo "Copying to processed directory..."
	@mkdir -p $(PROCESSED_DIR)
	@cp $(GEBCO_INPUT_TIF) $(GEBCO_CROPPED_TIF)
	@echo "✓ File copied: $(GEBCO_CROPPED_TIF)"

# Crop EMODnet to Turkey region
crop-emodnet: $(EMODNET_CROPPED_TIF)

$(EMODNET_CROPPED_TIF): $(EMODNET_INPUT_TIF)
	@echo "Cropping EMODnet to Turkey region..."
	@mkdir -p $(PROCESSED_DIR)
	@python3 process_emodnet.py \
		--input ../$(EMODNET_INPUT_TIF) \
		--output ../$(EMODNET_CROPPED_TIF) \
		--bbox $(BBOX)

# Create GEBCO COG
cog: $(GEBCO_COG_TIF)

$(GEBCO_COG_TIF): $(GEBCO_CROPPED_TIF)
	@echo "Creating Cloud Optimized GeoTIFF (GEBCO)..."
	@	python3 create_cog.py \
		--input ../$(GEBCO_CROPPED_TIF) \
		--output ../$(GEBCO_COG_TIF)

# Create EMODnet COG
cog-emodnet: $(EMODNET_COG_TIF)

$(EMODNET_COG_TIF): $(EMODNET_CROPPED_TIF)
	@echo "Creating Cloud Optimized GeoTIFF (EMODnet)..."
	@python3 create_cog.py \
		--input ../$(EMODNET_CROPPED_TIF) \
		--output ../$(EMODNET_COG_TIF)

# Full GEBCO pipeline
process-gebco: $(GEBCO_COG_TIF)
	@echo "✓ GEBCO processing complete"
	@echo "  Output: $(GEBCO_COG_TIF)"

# Full EMODnet pipeline
process-emodnet: download-emodnet crop-emodnet cog-emodnet
	@echo "✓ EMODnet processing complete"
	@echo "  Output: $(EMODNET_COG_TIF)"

# Process both datasets
process-all: process-gebco process-emodnet
	@echo ""
	@echo "✓ All datasets processed"
	@echo "  GEBCO: $(GEBCO_COG_TIF)"
	@echo "  EMODnet: $(EMODNET_COG_TIF)"

# Clean processed files
clean:
	rm -rf $(PROCESSED_DIR)

# Setup directories
setup-dirs:
	@mkdir -p $(RAW_DIR) $(PROCESSED_DIR)

