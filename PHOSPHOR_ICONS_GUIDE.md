# Phosphor Icons - Entegrasyon Rehberi

## 📚 Genel Bilgiler

**Phosphor Icons**, modern ve esnek bir icon setidir. 9000+ icon içerir ve 6 farklı ağırlıkta (thin, light, regular, bold, fill, duotone) sunulur.

- **Website**: https://phosphoricons.com
- **GitHub**: https://github.com/phosphor-icons/core
- **Lisans**: MIT (Ücretsiz, ticari kullanım için uygun)

## 📦 React Native / Expo Entegrasyonu

### Seçenek 1: phosphor-react-native (Önerilen)

```bash
npm install phosphor-react-native
```

**Kullanım:**
```tsx
import { House, User, MapPin } from 'phosphor-react-native';

// Basit kullanım
<House size={24} color="#000" weight="regular" />

// Özellikler:
// - size: number (default: 24)
// - color: string (default: "currentColor")
// - weight: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" (default: "regular")
// - mirrored: boolean (default: false)
```

### Seçenek 2: SVG Dosyalarını Direkt Kullanma

Phosphor Icons'un SVG dosyalarını `assets/icons/phosphor/` klasörüne kopyalayıp `react-native-svg` ile kullanabilirsiniz.

**Adımlar:**
1. https://github.com/phosphor-icons/core adresinden SVG dosyalarını indirin
2. `assets/icons/phosphor/` klasörüne kopyalayın
3. Mevcut `MeteoconsIcon` component'ine benzer bir wrapper oluşturun

### Seçenek 3: phosphor-react (Web için, React Native'de çalışmayabilir)

```bash
npm install phosphor-react
```

⚠️ **Not**: Bu paket web için tasarlanmıştır, React Native'de çalışmayabilir.

## 🎨 Icon Ağırlıkları (Weights)

1. **Thin** - İnce çizgiler
2. **Light** - Hafif çizgiler
3. **Regular** - Standart (varsayılan)
4. **Bold** - Kalın çizgiler
5. **Fill** - Dolu
6. **Duotone** - İki renkli

## 📝 Örnek Kullanım Senaryoları

### Tab Bar Icons
```tsx
import { House, MapPin, Bookmark, User } from 'phosphor-react-native';

// Tab bar'da kullanım
<Tab.Screen
  name="index"
  options={{
    tabBarIcon: ({ color, size }) => (
      <House size={size} color={color} weight="regular" />
    ),
  }}
/>
```

### Button Icons
```tsx
import { MagnifyingGlass, Bell, Settings } from 'phosphor-react-native';

<Pressable>
  <MagnifyingGlass size={20} color="#6C63FF" weight="bold" />
</Pressable>
```

### Weather Icons (Alternatif)
```tsx
import { Sun, Cloud, CloudRain, CloudSnow } from 'phosphor-react-native';

// Hava durumu için
{weatherCondition === 'clear' && <Sun size={50} color="#FFA500" weight="fill" />}
{weatherCondition === 'cloudy' && <Cloud size={50} color="#808080" weight="regular" />}
```

## 🔄 Mevcut Icon Sistemine Entegrasyon

Projede şu anda **Meteocons** kullanılıyor. Phosphor Icons'u eklemek için:

1. **Yeni bir component oluşturun**: `components/icons/PhosphorIcon.tsx`
2. **Veya mevcut icon sistemini genişletin**: `components/icons/Icon.tsx` (unified icon component)

### Örnek Unified Icon Component

```tsx
// components/icons/Icon.tsx
import { MeteoconsIcon } from './MeteoconsIcon';
import { House, User } from 'phosphor-react-native';

type IconLibrary = 'meteocons' | 'phosphor';

interface IconProps {
  library: IconLibrary;
  name: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

const iconMap = {
  house: House,
  user: User,
  // ... diğer iconlar
};

export function Icon({ library, name, size = 24, color, weight = 'regular' }: IconProps) {
  if (library === 'meteocons') {
    return <MeteoconsIcon name={name} size={size} />;
  }
  
  if (library === 'phosphor') {
    const IconComponent = iconMap[name as keyof typeof iconMap];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} weight={weight} />;
  }
  
  return null;
}
```

## 📋 Önerilen Icon Kategorileri

### Navigation & UI
- `House` - Ana sayfa
- `MapPin` - Harita/Konum
- `Bookmark` - Kaydedilenler
- `User` - Profil
- `MagnifyingGlass` - Arama
- `Bell` - Bildirimler
- `Settings` - Ayarlar
- `Menu` - Menü
- `X` - Kapat

### Weather (Alternatif)
- `Sun` - Güneşli
- `Cloud` - Bulutlu
- `CloudRain` - Yağmurlu
- `CloudSnow` - Karlı
- `Wind` - Rüzgar
- `Thermometer` - Sıcaklık

### Actions
- `Heart` - Beğen
- `Share` - Paylaş
- `Download` - İndir
- `Upload` - Yükle
- `Trash` - Sil
- `Pencil` - Düzenle

## 🚀 Hızlı Başlangıç

1. **Paketi yükleyin:**
   ```bash
   npm install phosphor-react-native
   ```

2. **İlk icon'u kullanın:**
   ```tsx
   import { House } from 'phosphor-react-native';
   
   <House size={24} color="#6C63FF" />
   ```

3. **Tüm iconları keşfedin:**
   - https://phosphoricons.com adresinden arama yapın
   - Icon adını import edin ve kullanın

## 📌 Notlar

- Phosphor Icons, tree-shaking destekler (sadece kullandığınız iconlar bundle'a eklenir)
- TypeScript desteği vardır
- Tüm iconlar SVG formatındadır
- Dark mode için renk prop'unu dinamik yapabilirsiniz

## 🔗 Faydalı Linkler

- **Icon Browser**: https://phosphoricons.com
- **GitHub Repository**: https://github.com/phosphor-icons/core
- **NPM Package**: https://www.npmjs.com/package/phosphor-react-native
- **Documentation**: https://github.com/phosphor-icons/core#readme

