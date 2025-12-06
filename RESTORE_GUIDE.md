# 🔄 Projeyi "Dark Mode Stable" Noktasına Geri Döndürme Rehberi

Bu rehber, projeyi `dark-mode-stable` tag'ine (dark mode tam implementasyonu) geri döndürmek için adımları içerir.

## 📋 Ön Bilgiler

- **Tag Adı:** `dark-mode-stable`
- **Commit Hash:** `5c10f16`
- **Commit Mesajı:** "feat: dark mode tam implementasyonu - sabit renk değerleri ile tüm ekranlar ve widget'lar güncellendi"
- **Tarih:** Dark mode tam çalışır durumda, tüm ekranlar ve widget'lar güncellendi

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
git checkout dark-mode-stable

# 4. Eğer stash kullandıysan ve değişiklikleri geri almak istersen:
git stash pop
```

### Yöntem 2: Commit Hash ile Geri Dönme

```bash
# 1. Commit hash ile geri dön
git checkout 5c10f16

# 2. Detached HEAD durumunda olacaksın, yeni branch oluşturmak istersen:
git checkout -b restore-dark-mode-stable
```

### Yöntem 3: Yeni Branch Oluşturarak

```bash
# 1. Mevcut branch'inde kal, yeni bir branch oluştur
git checkout -b restore-dark-mode-stable dark-mode-stable

# 2. Artık bu branch'te dark-mode-stable noktasındasın
```

### Yöntem 4: Hard Reset (DİKKAT: Tüm değişiklikler silinir!)

```bash
# ⚠️ UYARI: Bu komut tüm uncommitted değişiklikleri SİLER!
# Önce yedek al: git stash veya git commit

# 1. Tag'e hard reset yap
git reset --hard dark-mode-stable

# 2. Veya commit hash ile
git reset --hard 5c10f16
```

---

## 🔍 Tag ve Commit Bilgilerini Görüntüleme

```bash
# Tüm tag'leri listele
git tag

# Tag detaylarını görüntüle
git show dark-mode-stable

# Commit geçmişini görüntüle
git log --oneline --graph --all

# Belirli bir tag'in commit'ini görüntüle
git log dark-mode-stable -1
```

---

## 📦 Bu Noktadaki Özellikler

Bu tag'te proje şu özelliklere sahip:

✅ **Dark Mode:** Tam çalışır durumda
- Tüm ekranlar (Home, Map, Saved, Profile) dark mode destekliyor
- Weather widget'ları dark mode uyumlu
- Tab bar dark mode uyumlu
- Sabit renk değerleri kullanılıyor (CSS değişkenleri yerine)

✅ **Weather System:**
- Current weather widget
- 7 günlük tahmin widget'ı
- Weather details widget (Wind, Pressure, UV Index, Moon Phase)
- Meteocons SVG icon'ları

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
git checkout 5c10f16
```

### "Uncommitted changes" hatası alıyorsanız:

```bash
# Değişiklikleri geçici olarak sakla
git stash

# Tag'e geri dön
git checkout dark-mode-stable

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

- Bu tag, dark mode'un tam çalışır durumda olduğu ilk stabil noktadır
- Tüm renkler sabit hex değerleri kullanıyor (CSS değişkenleri yok)
- NativeWind v4 ile uyumlu
- Expo SDK 54 kullanılıyor

---

## 🔗 İlgili Dosyalar

- `tailwind.config.js` - Renk tanımları
- `app/_layout.tsx` - Root layout ve theme provider
- `stores/theme-store.tsx` - Theme management
- `components/weather/` - Weather widget'ları
- `app/(tabs)/` - Tüm tab ekranları

---

**Son Güncelleme:** Dark Mode Stable Tag oluşturulduğu tarih

