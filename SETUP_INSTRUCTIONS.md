# SDB + Fusion Setup - Adım Adım Kurulum

## 1. Python Virtual Environment Oluştur

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# veya
venv\Scripts\activate  # Windows
```

## 2. Dependencies Kur

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Bu şunları kurar:
- copernicusmarine
- xarray, rioxarray
- scikit-image
- affine, pyproj

## 3. Copernicus Marine Hesabı Oluştur

1. https://marine.copernicus.eu/ adresine git
2. "Register" butonuna tıkla
3. Ücretsiz hesap oluştur
4. Email'ini onayla

## 4. Credentials Ayarla

Terminal'de:

```bash
export COPERNICUSMARINE_SERVICE_USERNAME=your_username
export COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

Veya `.env` dosyası oluştur (`backend/.env`):

```
COPERNICUSMARINE_SERVICE_USERNAME=your_username
COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

## 5. SDB Verisi İndir

```bash
# Virtual environment aktif olmalı
source venv/bin/activate

# SDB indir (Çanakkale/Marmara bölgesi için)
python scripts/bathymetry/download_copernicus_sdb.py \
  --bbox 25.8 39.6 27.2 40.5 \
  --out data/bathymetry/sdb/raw/sdb_comp_TR.nc
```

Bu işlem 5-15 dakika sürebilir (veri boyutuna göre).

## 6. SDB'yi COG'a Çevir

```bash
# Önce metadata'ya bak (hangi değişkenler var)
cat data/bathymetry/sdb/raw/sdb_comp_TR.json

# COG'a çevir (değişken isimlerini metadata'dan al)
python scripts/bathymetry/netcdf_to_cog.py \
  --input data/bathymetry/sdb/raw/sdb_comp_TR.nc \
  --depth-var depth \
  --quality-var quality \
  --output data/bathymetry/sdb/sdb_TR_cog.tif
```

## 7. Turbidity Verisi İndir

```bash
# MED bölgesi için (son 12 ay)
python scripts/bathymetry/download_copernicus_turbidity.py \
  --region med \
  --bbox 25.8 39.6 27.2 40.5 \
  --out-dir data/bathymetry/turbidity/raw
```

Bu işlem 10-30 dakika sürebilir (her ay için ayrı dosya indirir).

## 8. Clarity Mask Oluştur

```bash
python scripts/bathymetry/build_clarity_mask.py \
  --input-dir data/bathymetry/turbidity/raw \
  --region med \
  --output data/bathymetry/clarity/clarity_TR_cog.tif
```

## 9. Fused Bathymetry Oluştur

```bash
python scripts/bathymetry/build_fused_bathymetry.py \
  --emodnet data/processed/emodnet_turkey_cog.tif \
  --gebco data/processed/gebco_turkey_cog.tif \
  --sdb data/bathymetry/sdb/sdb_TR_cog.tif \
  --clarity data/bathymetry/clarity/clarity_TR_cog.tif \
  --output data/bathymetry/fused/fused_TR_cog.tif
```

## 10. Backend Environment Variables Ayarla

`backend/.env` dosyasına ekle (veya export et):

```bash
# Mevcut
GEBCO_COG_PATH=/Users/gmzgnl/Dev:lokal-mvp/data/processed/gebco_turkey_cog.tif
EMODNET_COG_PATH=/Users/gmzgnl/Dev:lokal-mvp/data/processed/emodnet_turkey_cog.tif

# Yeni (absolute path kullan!)
SDB_COG_PATH=/Users/gmzgnl/Dev:lokal-mvp/data/bathymetry/sdb/sdb_TR_cog.tif
CLARITY_COG_PATH=/Users/gmzgnl/Dev:lokal-mvp/data/bathymetry/clarity/clarity_TR_cog.tif
FUSED_COG_PATH=/Users/gmzgnl/Dev:lokal-mvp/data/bathymetry/fused/fused_TR_cog.tif
```

## 11. Backend'i Başlat ve Test Et

```bash
cd backend
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Log'larda şunları görmelisin:
```
✓ Loaded EMODnet COG: ...
✓ Loaded GEBCO COG: ...
✓ Loaded SDB COG: ...
✓ Loaded clarity mask COG: ...
✓ Loaded fused bathymetry COG: ...
```

## 12. API Test Et

Yeni terminal'de:

```bash
# Kaynakları kontrol et
curl http://localhost:8000/v1/bathymetry/sources

# Farklı modları test et
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=sdb"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=fused"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=blend&debug=1"
```

## Sorun Giderme

### "Command not found: python"
- `python3` kullan

### "No module named copernicusmarine"
- Virtual environment aktif mi kontrol et: `which python`
- `pip install copernicusmarine` tekrar çalıştır

### "Login failed"
- Credentials doğru mu kontrol et
- Copernicus Marine hesabı aktif mi kontrol et

### "Variable not found"
- NetCDF dosyasını açıp değişkenleri kontrol et:
  ```python
  import xarray as xr
  ds = xr.open_dataset('data/bathymetry/sdb/raw/sdb_comp_TR.nc')
  print(list(ds.data_vars.keys()))
  ```

## Tahmini Süre

- Dependencies kurulumu: 2-5 dakika
- SDB indirme: 5-15 dakika
- Turbidity indirme: 10-30 dakika
- COG dönüşümleri: 2-5 dakika
- Fusion: 5-10 dakika

**Toplam: ~30-60 dakika** (internet hızına bağlı)

## Dosya Boyutları

- SDB NetCDF: ~50-200 MB
- SDB COG: ~30-150 MB
- Turbidity (12 ay): ~100-500 MB
- Clarity COG: ~5-20 MB
- Fused COG: ~50-200 MB

**Toplam disk kullanımı: ~200-1000 MB**

