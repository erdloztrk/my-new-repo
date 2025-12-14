# Backend Hızlı Başlangıç

"Network request failed" hatası alıyorsanız, backend servisi çalışmıyor demektir.

## Hızlı Başlatma

```bash
# 1. Backend dizinine git
cd backend

# 2. Python virtual environment oluştur (ilk kez)
python -m venv venv

# 3. Virtual environment'ı aktifleştir
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 4. Bağımlılıkları yükle
pip install -r requirements.txt

# 5. COG dosyası yolunu ayarla
export COG_PATH=../data/processed/gebco_turkey_cog.tif

# 6. Backend'i başlat
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Test

Backend çalışıyorsa, tarayıcıda şu URL'yi açın:
- http://localhost:8000/health

"ok" yanıtı gelmeli.

## Mobil Cihaz İçin

Fiziksel cihaz kullanıyorsanız, bilgisayarınızın IP adresini kullanın:

```bash
# macOS/Linux: IP adresini bul
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows: IP adresini bul
ipconfig
```

Sonra `.env` dosyası oluşturun:
```
EXPO_PUBLIC_BATHYMETRY_API_URL=http://192.168.1.100:8000
```

(192.168.1.100 yerine kendi IP adresinizi yazın)

## Sorun Giderme

- **"COG file not found"**: `data/processed/gebco_turkey_cog.tif` dosyasının var olduğundan emin olun
- **"Connection refused"**: Backend'in çalıştığından emin olun (port 8000)
- **CORS hatası**: Backend'de CORS ayarları zaten yapılmış, sorun devam ederse backend'i yeniden başlatın

