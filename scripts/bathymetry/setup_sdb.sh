#!/bin/bash
# SDB + Fusion Setup Script
# Bu script Copernicus Marine SDB ve fusion özelliklerini kurar

set -e  # Hata durumunda dur

echo "🚀 SDB + Fusion Setup Başlatılıyor..."
echo ""

# 1. Virtual environment kontrolü
if [ ! -d "../backend/venv" ] && [ ! -d "../backend/.venv" ]; then
    echo "⚠️  Virtual environment bulunamadı."
    echo "Lütfen manuel olarak oluşturun:"
    echo "  cd backend"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo ""
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Dependencies kontrolü
echo "📦 Dependencies kontrol ediliyor..."
cd ../backend
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

python3 -c "import copernicusmarine" 2>/dev/null || {
    echo "❌ copernicusmarine bulunamadı. Kuruluyor..."
    pip install -r requirements.txt
}

# 3. Credentials kontrolü
echo ""
echo "🔐 Copernicus Marine credentials kontrol ediliyor..."
if [ -z "$COPERNICUSMARINE_SERVICE_USERNAME" ] || [ -z "$COPERNICUSMARINE_SERVICE_PASSWORD" ]; then
    echo "⚠️  Credentials bulunamadı!"
    echo ""
    echo "Lütfen şunları export edin:"
    echo "  export COPERNICUSMARINE_SERVICE_USERNAME=your_username"
    echo "  export COPERNICUSMARINE_SERVICE_PASSWORD=your_password"
    echo ""
    echo "Veya backend/.env dosyasına ekleyin:"
    echo "  COPERNICUSMARINE_SERVICE_USERNAME=your_username"
    echo "  COPERNICUSMARINE_SERVICE_PASSWORD=your_password"
    echo ""
    read -p "Credentials'ları şimdi girmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Username: " username
        read -sp "Password: " password
        echo
        export COPERNICUSMARINE_SERVICE_USERNAME=$username
        export COPERNICUSMARINE_SERVICE_PASSWORD=$password
    else
        echo "❌ Setup durduruldu. Credentials olmadan devam edilemez."
        exit 1
    fi
fi

# 4. Dizinleri oluştur
echo ""
echo "📁 Dizinler oluşturuluyor..."
cd ..
mkdir -p data/bathymetry/sdb/raw
mkdir -p data/bathymetry/turbidity/raw
mkdir -p data/bathymetry/clarity
mkdir -p data/bathymetry/fused

# 5. SDB indir
echo ""
echo "📥 SDB verisi indiriliyor (bu 5-15 dakika sürebilir)..."
cd scripts/bathymetry
python3 download_copernicus_sdb.py \
  --bbox 25.8 39.6 27.2 40.5 \
  --out ../../data/bathymetry/sdb/raw/sdb_comp_TR.nc || {
    echo "❌ SDB indirme başarısız!"
    exit 1
}

# 6. Metadata kontrolü
echo ""
echo "📋 SDB metadata kontrol ediliyor..."
if [ -f "../../data/bathymetry/sdb/raw/sdb_comp_TR.json" ]; then
    echo "✓ Metadata bulundu"
    cat ../../data/bathymetry/sdb/raw/sdb_comp_TR.json | grep -A 5 "variables" || true
else
    echo "⚠️  Metadata bulunamadı, devam ediliyor..."
fi

# 7. SDB'yi COG'a çevir
echo ""
echo "🔄 SDB COG'a çevriliyor..."
echo "⚠️  Not: Değişken isimlerini metadata'dan kontrol edin!"
python3 netcdf_to_cog.py \
  --input ../../data/bathymetry/sdb/raw/sdb_comp_TR.nc \
  --depth-var depth \
  --quality-var quality \
  --output ../../data/bathymetry/sdb/sdb_TR_cog.tif || {
    echo "❌ COG dönüşümü başarısız!"
    echo "Lütfen metadata.json'dan doğru değişken isimlerini kontrol edin."
    exit 1
}

# 8. Turbidity indir
echo ""
echo "📥 Turbidity verisi indiriliyor (bu 10-30 dakika sürebilir)..."
python3 download_copernicus_turbidity.py \
  --region med \
  --bbox 25.8 39.6 27.2 40.5 \
  --out-dir ../../data/bathymetry/turbidity/raw || {
    echo "❌ Turbidity indirme başarısız!"
    exit 1
}

# 9. Clarity mask oluştur
echo ""
echo "🎨 Clarity mask oluşturuluyor..."
python3 build_clarity_mask.py \
  --input-dir ../../data/bathymetry/turbidity/raw \
  --region med \
  --output ../../data/bathymetry/clarity/clarity_TR_cog.tif || {
    echo "❌ Clarity mask oluşturma başarısız!"
    exit 1
}

# 10. Fused bathymetry oluştur
echo ""
echo "🔀 Fused bathymetry oluşturuluyor..."
python3 build_fused_bathymetry.py \
  --emodnet ../../data/processed/emodnet_turkey_cog.tif \
  --gebco ../../data/processed/gebco_turkey_cog.tif \
  --sdb ../../data/bathymetry/sdb/sdb_TR_cog.tif \
  --clarity ../../data/bathymetry/clarity/clarity_TR_cog.tif \
  --output ../../data/bathymetry/fused/fused_TR_cog.tif || {
    echo "❌ Fused bathymetry oluşturma başarısız!"
    exit 1
}

# 11. Environment variables öner
echo ""
echo "✅ Setup tamamlandı!"
echo ""
echo "📝 Backend'i başlatmak için environment variables ayarlayın:"
echo ""
echo "backend/.env dosyasına ekleyin:"
echo ""
echo "SDB_COG_PATH=$(pwd)/../../data/bathymetry/sdb/sdb_TR_cog.tif"
echo "CLARITY_COG_PATH=$(pwd)/../../data/bathymetry/clarity/clarity_TR_cog.tif"
echo "FUSED_COG_PATH=$(pwd)/../../data/bathymetry/fused/fused_TR_cog.tif"
echo ""
echo "Veya export edin:"
echo "export SDB_COG_PATH=$(pwd)/../../data/bathymetry/sdb/sdb_TR_cog.tif"
echo "export CLARITY_COG_PATH=$(pwd)/../../data/bathymetry/clarity/clarity_TR_cog.tif"
echo "export FUSED_COG_PATH=$(pwd)/../../data/bathymetry/fused/fused_TR_cog.tif"
echo ""
echo "🎉 Hazır! Backend'i başlatabilirsiniz."

