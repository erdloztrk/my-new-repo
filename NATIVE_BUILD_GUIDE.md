# Native Build ile Test Etme Rehberi

Lottie animasyonlarını görmek için native build gerekli. İşte adım adım rehber:

## 🍎 iOS için (Mac gerekli)

### Yöntem 1: Expo CLI ile (Önerilen)

```bash
# 1. Native dosyaları oluştur (eğer yoksa)
npm run prebuild:clean

# 2. CocoaPods yükle (pod install)
cd ios
EXPO_USE_COMMUNITY_AUTOLINKING=1 pod install
cd ..

# 3. iOS simulator'da çalıştır
npm run run:ios
```

### Yöntem 2: Xcode ile

```bash
# 1. Native dosyaları oluştur
npm run prebuild

# 2. Xcode'u aç
open ios/LOKAL.xcworkspace

# 3. Xcode'da:
#    - Sol üstten simulator seç (örn: iPhone 15)
#    - ▶️ (Play) butonuna bas veya Cmd+R
```

## 🤖 Android için

### Yöntem 1: Expo CLI ile (Önerilen)

```bash
# 1. Native dosyaları oluştur (eğer yoksa)
npm run prebuild

# 2. Android emulator'da çalıştır
npm run run:android
```

**Not:** Android emulator'ın çalışıyor olması gerekir.

### Yöntem 2: Android Studio ile

```bash
# 1. Native dosyaları oluştur
npm run prebuild

# 2. Android Studio'yu aç
open android

# 3. Android Studio'da:
#    - Emulator seç
#    - ▶️ (Run) butonuna bas
```

## 🔄 Temiz Build (Sorun varsa)

Eğer native build'de sorun yaşıyorsanız:

```bash
# iOS için temiz build
npm run prebuild:clean
cd ios && pod install && cd ..
npm run run:ios

# Android için temiz build
npm run prebuild:clean
npm run run:android
```

## 📱 Fiziksel Cihazda Test

### iOS (iPhone/iPad)

1. Xcode'da cihazınızı seçin
2. Developer hesabınızı bağlayın
3. ▶️ (Play) butonuna basın

### Android

1. USB debugging açık olmalı
2. Cihazı bilgisayara bağlayın
3. `npm run run:android` çalıştırın

## ⚠️ Önemli Notlar

- **İlk build uzun sürebilir** (5-10 dakika)
- **Xcode/Android Studio gerekli** native build için
- **Lottie animasyonları sadece native build'de çalışır**, Expo Go'da çalışmaz
- **Metro bundler otomatik başlar** `run:ios` veya `run:android` çalıştırdığınızda

## 🐛 Sorun Giderme

### iOS: "No space left on device"
```bash
# Xcode DerivedData temizle
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Android: Gradle hatası
```bash
cd android
./gradlew clean
cd ..
```

### Pod install hatası (iOS)
```bash
cd ios
pod deintegrate
pod install
cd ..
```

