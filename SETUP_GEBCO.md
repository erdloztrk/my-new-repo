# GEBCO 2025 Gerçek Veri Kurulumu

Bu rehber, GEBCO 2025 gerçek bathymetry verilerini indirip kurmak için adım adım talimatlar içerir.

## Hızlı Kurulum (Sadece Türkiye Bölgesi)

```bash
# 1. GEBCO verilerini indir ve işle (sadece Türkiye bölgesi - çok daha küçük dosya!)
make -C scripts/bathymetry setup

# Bu komut:
# - Sadece Türkiye bölgesini indirir (~50-200 MB, global 4 GB yerine)
# - OPeNDAP API kullanarak otomatik indirir
# - COG formatına dönüştürür

# 2. Backend'i başlat
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export COG_PATH=../data/processed/gebco_turkey_cog.tif
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Manuel Kurulum

### 1. GEBCO 2025 Verilerini İndir (Sadece Türkiye Bölgesi)

**Seçenek A: Otomatik İndirme - OPeNDAP (Önerilen, Çok Daha Hızlı!)**

```bash
# Sadece Türkiye bölgesini indirir (~50-200 MB)
python scripts/bathymetry/download_turkey_opendap.py
```

Bu yöntem:
- ✅ Sadece Türkiye bölgesini indirir (25°E-45°E, 35°N-42°N)
- ✅ Çok daha küçük dosya (~50-200 MB vs 4 GB)
- ✅ Çok daha hızlı indirme (1-2 dakika vs 10-30 dakika)
- ✅ OPeNDAP API kullanır

**Seçenek B: Manuel İndirme - GEBCO Download Application**

1. [GEBCO Download Application](https://betadownload.gebco.net) adresine gidin
2. Haritada Türkiye bölgesini seçin (25°E-45°E, 35°N-42°N)
3. GeoTIFF formatında indirin
4. `data/raw/gebco_2025_turkey.tif` olarak kaydedin

### 2. Verileri İşle

Eğer OPeNDAP ile indirdiyseniz, veri zaten Türkiye bölgesine kırpılmış durumda. Sadece COG formatına dönüştürmeniz yeterli:

```bash
# Cloud Optimized GeoTIFF'e dönüştür
python scripts/bathymetry/create_cog.py \
  --input data/raw/gebco_2025_turkey.tif \
  --output data/processed/gebco_turkey_cog.tif
```

Eğer global dosya indirdiyseniz, önce kırpmanız gerekir:

```bash
# Türkiye bölgesine kırp
python scripts/bathymetry/crop_gebco.py \
  --input data/raw/gebco_2025.tif \
  --output data/processed/gebco_turkey.tif \
  --bbox 25.0 42.0 45.0 35.0

# Cloud Optimized GeoTIFF'e dönüştür
python scripts/bathymetry/create_cog.py \
  --input data/processed/gebco_turkey.tif \
  --output data/processed/gebco_turkey_cog.tif
```

### 3. Backend'i Başlat

```bash
cd backend

# Python virtual environment oluştur
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# COG dosyası yolunu ayarla
export COG_PATH=../data/processed/gebco_turkey_cog.tif

# Backend'i başlat
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test Et

```bash
# Health check
curl http://localhost:8000/health

# Derinlik sorgusu (Marmara Denizi örneği)
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5"

# Skor sorgusu
curl "http://localhost:8000/v1/score?lat=40.5&lon=28.5&species=chipura"
```

## Gereksinimler

### Python Bağımlılıkları

```bash
# GDAL ve rasterio için (conda önerilir)
conda install -c conda-forge gdal rasterio numpy

# Veya pip (daha zor kurulum)
pip install rasterio gdal numpy
```

### Sistem Gereksinimleri

**OPeNDAP ile (Önerilen - Sadece Türkiye):**
- **Disk Alanı**: ~500 MB (indirme + işlenmiş veriler)
- **RAM**: En az 2 GB (işleme sırasında)
- **İnternet**: Normal bağlantı (~50-200 MB indirme, 1-2 dakika)

**Global Dosya ile:**
- **Disk Alanı**: ~15 GB (indirme + işlenmiş veriler)
- **RAM**: En az 4 GB (işleme sırasında)
- **İnternet**: Hızlı bağlantı (4 GB indirme, 10-30 dakika)

## Sorun Giderme

### "GDAL not found"

```bash
# macOS
brew install gdal

# Ubuntu/Debian
sudo apt-get install gdal-bin libgdal-dev

# Conda (önerilen)
conda install -c conda-forge gdal
```

### "COG file not found"

1. `data/processed/gebco_turkey_cog.tif` dosyasının var olduğunu kontrol edin
2. `COG_PATH` environment variable'ını kontrol edin:
   ```bash
   echo $COG_PATH
   ```

### İndirme Çok Yavaş

- Alternatif olarak [GEBCO Download Application](https://betadownload.gebco.net) kullanabilirsiniz
- Sadece Türkiye bölgesini seçerek daha küçük bir dosya indirebilirsiniz

## Veri Kaynağı

- **GEBCO 2025 Grid**: [https://www.gebco.net/data-products/gridded-bathymetry-data](https://www.gebco.net/data-products/gridded-bathymetry-data)
- **Çözünürlük**: 15 arc-second (~450m)
- **Format**: GeoTIFF (Cloud Optimized)
- **Kapsam**: Türkiye (Aegean + Marmara bölgeleri)

## Notlar

- İlk kurulum 10-30 dakika sürebilir (indirme + işleme)
- COG formatı sayesinde backend hızlı point query'ler yapabilir
- Veriler her yıl güncellenir (GEBCO yıllık release)

