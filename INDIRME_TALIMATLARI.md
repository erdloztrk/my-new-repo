# GEBCO Türkiye Verileri - İndirme Talimatları

GEBCO'nun otomatik API'leri şu anda çalışmıyor. Lütfen aşağıdaki adımları izleyin:

## Hızlı Yol (Önerilen)

### 1. GEBCO Download Application'dan İndir

1. **Tarayıcınızda şu adrese gidin:**
   ```
   https://betadownload.gebco.net
   ```

2. **Haritada Türkiye bölgesini seçin:**
   - Sol üst köşe: **25°E, 42°N**
   - Sağ alt köşe: **45°E, 35°N**
   
   (Veya haritada Türkiye'yi çevreleyen bir kutu çizin)

3. **Format seçin:** GeoTIFF

4. **İndir** butonuna tıklayın

5. **İndirilen dosyayı şu konuma kopyalayın:**
   ```bash
   data/raw/gebco_2025_turkey.tif
   ```

### 2. Otomatik İşleme

Dosyayı yerleştirdikten sonra:

```bash
bash scripts/bathymetry/process_turkey.sh
```

Bu script:
- ✅ Dosyanın var olduğunu kontrol eder
- ✅ COG formatına dönüştürür
- ✅ Backend için hazır hale getirir

### 3. Backend'i Başlat

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export COG_PATH=../data/processed/gebco_turkey_cog.tif
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Alternatif: Global Dosyayı İndirip Kırp

Eğer download application çalışmazsa:

1. **Global GEBCO 2025 GeoTIFF'i indirin:**
   - Link: https://dap.ceda.ac.uk/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/geotiff/gebco_2025_sub_ice_topo_geotiff.zip
   - Boyut: ~4 GB (sıkıştırılmış), ~8 GB (açılmış)
   - İndirme süresi: 10-30 dakika

2. **Dosyayı açın** ve `gebco_2025.tif` dosyasını bulun

3. **Türkiye bölgesine kırpın:**
   ```bash
   python scripts/bathymetry/crop_gebco.py \
     --input data/raw/gebco_2025.tif \
     --output data/processed/gebco_turkey.tif \
     --bbox 25.0 42.0 45.0 35.0
   ```

4. **COG formatına dönüştürün:**
   ```bash
   python scripts/bathymetry/create_cog.py \
     --input data/processed/gebco_turkey.tif \
     --output data/processed/gebco_turkey_cog.tif
   ```

## Sorun Giderme

### "Dosya bulunamadı" hatası

- Dosyanın `data/raw/gebco_2025_turkey.tif` konumunda olduğundan emin olun
- Dosya adının tam olarak `gebco_2025_turkey.tif` olduğunu kontrol edin

### "rasterio not found" hatası

```bash
pip install rasterio
# veya
conda install -c conda-forge rasterio
```

### İndirme çok yavaş

- GEBCO Download Application kullanın (sadece Türkiye bölgesi, çok daha hızlı)
- Alternatif olarak gece indirmeyi deneyin (daha az trafik)

## Notlar

- **Download Application** sadece Türkiye bölgesini indirir (~50-200 MB)
- **Global dosya** tüm dünyayı içerir (~4 GB)
- Her iki yöntem de aynı kalitede veri sağlar
- COG formatı backend'in hızlı sorgu yapmasını sağlar

