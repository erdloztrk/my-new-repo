# 🔄 Projeyi Yedek Noktasına Geri Döndürme Rehberi

Bu rehber, projeyi yedek tag'ine geri döndürmek için adımları içerir.

## 📋 Ön Bilgiler

- **Tag Adı:** `backup-20251206-121550`
- **Commit Hash:** `29b17a9`
- **Commit Mesajı:** "feat: harita dark mode, 5 günlük tahmin widget, weather details düzeltmeleri"
- **Tarih:** 2025-12-06 12:15:50
- **Özellikler:** Harita dark mode, 5 günlük tahmin widget, weather details düzeltmeleri, react-native-maps entegrasyonu

---

## 🔧 Geri Dönme Yöntemleri

### Yöntem 1: Tag ile Geri Dönme (Önerilen)

```bash
# 1. Mevcut değişiklikleri kontrol et
git status

# 2. Eğer uncommitted değişiklikler varsa, önce commit yap veya stash'le
# Seçenek A: Commit yap
git add .
git commit -m "WIP: mevcut değişiklikler"

# Seçenek B: Stash'le (geçici sakla)
git stash

# 3. Tag'e geri dön
git checkout backup-20251206-121550

# 4. Eğer stash kullandıysan ve değişiklikleri geri almak istersen:
git stash pop
```

### Yöntem 2: Commit Hash ile Geri Dönme

```bash
# 1. Commit hash ile geri dön
git checkout 29b17a9

# 2. Detached HEAD durumunda olacaksın, yeni branch oluşturmak istersen:
git checkout -b restore-backup-20251206-121550
```

### Yöntem 3: Yeni Branch Oluşturarak

```bash
# 1. Mevcut branch'inde kal, yeni bir branch oluştur
git checkout -b restore-backup-20251206-121550 backup-20251206-121550

# 2. Artık bu branch'te backup-20251206-121550 noktasındasın
```

### Yöntem 4: Hard Reset (DİKKAT: Tüm değişiklikler silinir!)

```bash
# ⚠️ UYARI: Bu komut tüm uncommitted değişiklikleri SİLER!
# Önce yedek al: git stash veya git commit

# 1. Tag'e hard reset yap
git reset --hard backup-20251206-121550

# 2. Veya commit hash ile
git reset --hard 29b17a9
```

---

## 🔍 Tag ve Commit Bilgilerini Görüntüleme

```bash
# Tüm tag'leri listele
git tag

# Tag detaylarını görüntüle
git show backup-20251206-121550

# Commit geçmişini görüntüle
git log --oneline --graph --all

# Belirli bir tag'in commit'ini görüntüle
git log backup-20251206-121550 -1
```

---

## 📦 Bu Noktadaki Özellikler

Bu tag'te proje şu özelliklere sahip:

✅ **Dark Mode:** Tam çalışır durumda
- Tüm ekranlar (Home, Map, Saved, Profile) dark mode destekliyor
- Weather widget'ları dark mode uyumlu
- Tab bar dark mode uyumlu
- Harita dark mode uyumlu (iOS ve Android)
- Sabit renk değerleri kullanılıyor (CSS değişkenleri yerine)

✅ **Harita Sistemi:**
- react-native-maps entegrasyonu
- Kullanıcı konumu gösterimi
- Dark mode desteği (iOS: userInterfaceStyle, Android: customMapStyle)
- POI'ler gizli (sadece yollar görünüyor)

✅ **Weather System:**
- Current weather widget
- 5 günlük tahmin widget'ı (API limitine uygun)
- Weather details widget (Wind, Pressure, Feels Like, Moon Phase)
- Meteocons SVG icon'ları
- Bugün kontrolü düzeltildi

✅ **Theme Management:**
- System/Light/Dark mode seçimi
- Theme persistence (AsyncStorage)
- Theme toggle fonksiyonu

✅ **UI Components:**
- Semantic color tokens
- Consistent styling across all screens
- Proper contrast ratios

---

## 🚨 Sorun Giderme

### "Tag not found" hatası alıyorsanız:

```bash
# Tag'lerin listesini kontrol et
git tag

# Eğer tag yoksa, remote'dan çek
git fetch --tags

# Veya commit hash ile geri dön
git checkout 29b17a9
```

### "Uncommitted changes" hatası alıyorsanız:

```bash
# Değişiklikleri geçici olarak sakla
git stash

# Tag'e geri dön
git checkout backup-20251206-121550

# Değişiklikleri geri almak istersen
git stash pop
```

### Detached HEAD durumundan çıkmak için:

```bash
# Yeni branch oluştur
git checkout -b new-branch-name

# Veya mevcut branch'e geri dön
git checkout master  # veya main
```

---

## 📝 Notlar

- Bu tag, harita dark mode ve 5 günlük tahmin widget'ının eklendiği noktadır
- Tüm renkler sabit hex değerleri kullanıyor (CSS değişkenleri yok)
- NativeWind v4 ile uyumlu
- Expo SDK 54 kullanılıyor
- react-native-maps paketi eklendi
- OpenWeather 5-Day Forecast API kullanılıyor (ücretsiz tier)

---

## 🔗 İlgili Dosyalar

- `tailwind.config.js` - Renk tanımları
- `app/_layout.tsx` - Root layout ve theme provider
- `stores/theme-store.tsx` - Theme management
- `components/weather/` - Weather widget'ları
- `app/(tabs)/map.tsx` - Harita ekranı (react-native-maps)
- `app/(tabs)/` - Tüm tab ekranları
- `package.json` - react-native-maps dependency

---

**Son Güncelleme:** 2025-12-06 12:15:50

