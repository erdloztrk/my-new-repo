# Türkiye Bölgesi - Hızlı Kurulum

Sadece Türkiye bölgesi için GEBCO verilerini kurmak (çok daha hızlı ve küçük dosya!).

## Tek Komut Kurulum

```bash
# Tüm işlemleri otomatik yapar
make -C scripts/bathymetry setup
```

Bu komut:
1. ✅ Sadece Türkiye bölgesini indirir (~50-200 MB, 1-2 dakika)
2. ✅ COG formatına dönüştürür
3. ✅ Backend için hazır hale getirir

## Adım Adım

### 1. Python Bağımlılıkları

```bash
# Conda önerilir (GDAL kurulumu kolay)
conda install -c conda-forge gdal rasterio numpy netcdf4

# Veya pip
pip install rasterio gdal numpy netCDF4
```

### 2. Verileri İndir ve İşle

```bash
# Sadece Türkiye bölgesini indir (OPeNDAP API)
python scripts/bathymetry/download_turkey_opendap.py

# COG formatına dönüştür
make -C scripts/bathymetry cog
```

### 3. Backend'i Başlat

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export COG_PATH=../data/processed/gebco_turkey_cog.tif
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Avantajlar

- **Küçük Dosya**: ~50-200 MB (global 4 GB yerine)
- **Hızlı İndirme**: 1-2 dakika (global 10-30 dakika yerine)
- **Az Disk**: ~500 MB toplam (global 15 GB yerine)
- **Aynı Kalite**: Aynı GEBCO 2025 verileri, sadece Türkiye bölgesi

## Türkiye Bölgesi Sınırları

- **Batı**: 25°E
- **Doğu**: 45°E  
- **Güney**: 35°N
- **Kuzey**: 42°N

Bu bölge şunları kapsar:
- Marmara Denizi
- Ege Denizi (Türkiye kıyıları)
- Karadeniz (Türkiye kıyıları)
- Akdeniz (Türkiye kıyıları)

## Sorun Giderme

### "netCDF4 not found"

```bash
pip install netCDF4
# veya
conda install -c conda-forge netcdf4
```

### "OPeNDAP connection failed"

Alternatif olarak manuel indirme yapın:
1. https://betadownload.gebco.net adresine gidin
2. Türkiye bölgesini seçin
3. GeoTIFF formatında indirin
4. `data/raw/gebco_2025_turkey.tif` olarak kaydedin

