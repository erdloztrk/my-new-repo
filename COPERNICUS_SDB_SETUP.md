# Copernicus Marine SDB + Turbidity + Fusion Setup Guide

This guide explains how to set up the new Copernicus Marine Satellite Derived Bathymetry (SDB) and turbidity-based clarity mask system for improved coastal bathymetry.

## Quick Start Checklist

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `copernicusmarine` - Copernicus Marine Toolbox
- `xarray`, `rioxarray` - NetCDF processing
- `scikit-image` - Contour extraction
- `affine`, `pyproj` - Geospatial transformations

### 2. Set Copernicus Credentials

```bash
export COPERNICUSMARINE_SERVICE_USERNAME=your_username
export COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

Or add to `.env`:
```
COPERNICUSMARINE_SERVICE_USERNAME=your_username
COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

**Get credentials:** Register at https://marine.copernicus.eu/

### 3. Download SDB Data

```bash
python scripts/bathymetry/download_copernicus_sdb.py \
  --bbox 25.8 39.6 27.2 40.5 \
  --out data/bathymetry/sdb/raw/sdb_comp_TR.nc
```

This downloads the SDB composite dataset for Turkey's Marmara/Aegean region.

### 4. Convert SDB to COG

```bash
# Check metadata.json for variable names
cat data/bathymetry/sdb/raw/sdb_comp_TR.json

# Convert (adjust --depth-var and --quality-var based on metadata)
python scripts/bathymetry/netcdf_to_cog.py \
  --input data/bathymetry/sdb/raw/sdb_comp_TR.nc \
  --depth-var depth \
  --quality-var quality \
  --output data/bathymetry/sdb/sdb_TR_cog.tif
```

### 5. Download Turbidity Data

```bash
# Download monthly turbidity for MED region (last 12 months)
python scripts/bathymetry/download_copernicus_turbidity.py \
  --region med \
  --bbox 25.8 39.6 27.2 40.5 \
  --out-dir data/bathymetry/turbidity/raw

# If needed, also download for BLK region
python scripts/bathymetry/download_copernicus_turbidity.py \
  --region blk \
  --bbox 25.8 39.6 27.2 40.5 \
  --out-dir data/bathymetry/turbidity/raw
```

### 6. Build Clarity Mask

```bash
python scripts/bathymetry/build_clarity_mask.py \
  --input-dir data/bathymetry/turbidity/raw \
  --region med \
  --output data/bathymetry/clarity/clarity_TR_cog.tif
```

### 7. Build Fused Bathymetry

```bash
python scripts/bathymetry/build_fused_bathymetry.py \
  --emodnet data/processed/emodnet_turkey_cog.tif \
  --gebco data/processed/gebco_turkey_cog.tif \
  --sdb data/bathymetry/sdb/sdb_TR_cog.tif \
  --clarity data/bathymetry/clarity/clarity_TR_cog.tif \
  --output data/bathymetry/fused/fused_TR_cog.tif
```

### 8. Configure Backend Environment Variables

Add to `.env` or export:

```bash
export SDB_COG_PATH=/absolute/path/to/data/bathymetry/sdb/sdb_TR_cog.tif
export CLARITY_COG_PATH=/absolute/path/to/data/bathymetry/clarity/clarity_TR_cog.tif
export FUSED_COG_PATH=/absolute/path/to/data/bathymetry/fused/fused_TR_cog.tif
```

**Note:** Use absolute paths for reliability.

### 9. Start Backend

```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Check logs to verify all datasets loaded:
```
✓ Loaded EMODnet COG: ...
✓ Loaded GEBCO COG: ...
✓ Loaded SDB COG: ...
✓ Loaded clarity mask COG: ...
✓ Loaded fused bathymetry COG: ...
```

### 10. Test API

```bash
# Check available sources
curl http://localhost:8000/v1/bathymetry/sources

# Test different modes
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=auto"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=sdb"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=fused"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=blend&debug=1"
```

### 11. Test React Native App

1. Open map screen
2. Enable bathymetry (tap fish icon)
3. Long-press fish icon to open depth source selection
4. Select different modes and tap on map to see results

## File Sizes (Approximate)

- SDB NetCDF: ~50-200 MB (depends on bbox)
- SDB COG: ~30-150 MB
- Turbidity NetCDF (per month): ~10-50 MB
- Clarity COG: ~5-20 MB
- Fused COG: ~50-200 MB

**Total:** ~200-500 MB for full setup

## Troubleshooting

### SDB Download Fails

- Check Copernicus credentials are set correctly
- Verify dataset ID is correct (may change over time)
- Check network connection
- Try smaller bbox if download times out

### Variable Detection Fails

- Check NetCDF file with `ncdump -h` or `xarray.open_dataset()`
- Manually specify variables: `--variables depth quality source`

### Clarity Mask Empty

- Verify turbidity files downloaded successfully
- Check TUR variable exists in NetCDF files
- Try adjusting `--tur-low` and `--tur-high` thresholds

### Fusion Produces Unexpected Results

- Check all input COGs have overlapping bbox
- Verify SDB quality values are in expected range (0-4 or 0-255)
- Check clarity values are 0..1
- Review fusion logic in `build_fused_bathymetry.py`

### Backend Doesn't Load COGs

- Verify absolute paths in environment variables
- Check file permissions
- Ensure COG files are valid (test with `rasterio.open()`)
- Check backend logs for specific error messages

## Data Update Frequency

- **SDB**: Static composite (updated annually or as new data becomes available)
- **Turbidity**: Monthly products (update monthly)
- **Clarity Mask**: Rebuild when new turbidity data available
- **Fused**: Rebuild when any source updates

## Performance Notes

- Fused COG provides fastest queries (single read)
- On-the-fly fusion (`mode=blend`) is slower but more flexible
- Contours with `format=lines` requires scikit-image (slower but better quality)
- Use `downsample` parameter for large bbox queries

## Safety Warning

⚠️ **All bathymetry data is approximate and NOT for navigation purposes.**

The UI displays "Not for navigation" warning. This data is intended for:
- Fishing location planning
- General depth awareness
- Educational purposes

**DO NOT** use for:
- Boat navigation
- Route planning
- Safety-critical applications

