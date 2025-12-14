# GEBCO Türkiye Verileri - Manuel İndirme Talimatları

OPeNDAP API şu anda çalışmıyor. Lütfen aşağıdaki adımları izleyin:

## Adım 1: GEBCO Download Application

1. Tarayıcınızda şu adrese gidin:
   **https://betadownload.gebco.net**

2. Haritada Türkiye bölgesini seçin:
   - Sol üst: 25°E, 42°N
   - Sağ alt: 45°E, 35°N

3. Format olarak **GeoTIFF** seçin

4. İndir butonuna tıklayın

5. İndirilen dosyayı şu konuma kopyalayın:
   ```
   data/raw/gebco_2025_turkey.tif
   ```

## Adım 2: COG Formatına Dönüştür

```bash
python scripts/bathymetry/create_cog.py \
  --input data/raw/gebco_2025_turkey.tif \
  --output data/processed/gebco_turkey_cog.tif
```

## Alternatif: Global Dosyayı İndirip Kırp

Eğer download application çalışmazsa:

1. Global GEBCO 2025 GeoTIFF'i indirin:
   https://dap.ceda.ac.uk/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/geotiff/gebco_2025_sub_ice_topo_geotiff.zip

2. Dosyayı açın ve `gebco_2025.tif` dosyasını `data/raw/` klasörüne koyun

3. Türkiye bölgesine kırpın:
```bash
python scripts/bathymetry/crop_gebco.py \
  --input data/raw/gebco_2025.tif \
  --output data/processed/gebco_turkey.tif \
  --bbox 25.0 42.0 45.0 35.0
```

4. COG formatına dönüştürün:
```bash
python scripts/bathymetry/create_cog.py \
  --input data/processed/gebco_turkey.tif \
  --output data/processed/gebco_turkey_cog.tif
```

