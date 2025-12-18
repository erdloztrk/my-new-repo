/**
 * Çanakkale Bölgesi Kıyı Balıkçılığı Türleri Database
 * Bilimsel ve profesyonel verilerle oluşturulmuş tür profilleri
 */

export interface SpeciesCondition {
  seaTemp: { min: number; max: number }; // °C
  waveHeight: { max: number }; // metre
  windSpeed: { max: number }; // km/h
  pressure: { min: number; max: number }; // hPa
  depth: { min: number; max: number }; // metre (mutlak değer, negatif derinlik için)
  season: number[]; // Ay numaraları (1-12)
  timeOfDay: string[]; // ["dawn", "dusk", "day", "night"]
}

export interface CanakkaleSpecies {
  id: string;
  trName: string;
  latinName: string;
  conditions: SpeciesCondition;
  description: string;
  tips: string[];
}

export const CANAKKALE_SPECIES: CanakkaleSpecies[] = [
  {
    id: "lüfer",
    trName: "Lüfer",
    latinName: "Pomatomus saltatrix",
    conditions: {
      seaTemp: { min: 14, max: 24 },
      waveHeight: { max: 1.5 },
      windSpeed: { max: 40 },
      pressure: { min: 1005, max: 1025 },
      depth: { min: 5, max: 50 }, // 5-50m derinlik aralığı
      season: [9, 10, 11, 12], // Eylül-Aralık
      timeOfDay: ["dawn", "dusk"],
    },
    description: "Çanakkale Boğazı'nın göçmen türü. Sürü halinde avlanır.",
    tips: ["Şafak ve alacakaranlıkta aktif", "Yapay yem veya canlı yem", "İskele ve kayalık bölgeler"],
  },
  {
    id: "palamut",
    trName: "Palamut",
    latinName: "Sarda sarda",
    conditions: {
      seaTemp: { min: 18, max: 24 },
      waveHeight: { max: 1.0 },
      windSpeed: { max: 30 },
      pressure: { min: 1010, max: 1020 },
      depth: { min: 10, max: 80 }, // 10-80m derinlik aralığı
      season: [9, 10, 11, 12], // Eylül-Aralık
      timeOfDay: ["dawn", "dusk", "day"],
    },
    description: "Sonbahar göçmeni. Yüzeye yakın sürü halinde dolaşır.",
    tips: ["Sabah erken ve akşam saatleri", "Yapay yem tercih edilir", "Açık denizde daha verimli"],
  },
  {
    id: "istavrit",
    trName: "İstavrit",
    latinName: "Trachurus trachurus",
    conditions: {
      seaTemp: { min: 10, max: 22 },
      waveHeight: { max: 1.8 },
      windSpeed: { max: 45 },
      pressure: { min: 1000, max: 1030 },
      depth: { min: 3, max: 100 }, // 3-100m derinlik aralığı (geniş aralık)
      season: [1, 2, 3, 4, 5, 9, 10, 11, 12], // Yıl boyu (yaz hariç)
      timeOfDay: ["day", "dawn", "dusk"],
    },
    description: "Yıl boyu bulunur. Dayanıklı tür, çeşitli koşullara uyum sağlar.",
    tips: ["Gün içi aktif", "Küçük yemler", "İskele ve kıyı bölgeler"],
  },
  {
    id: "çipura",
    trName: "Çipura",
    latinName: "Sparus aurata",
    conditions: {
      seaTemp: { min: 16, max: 22 },
      waveHeight: { max: 0.5 },
      windSpeed: { max: 20 },
      pressure: { min: 1010, max: 1020 },
      depth: { min: 2, max: 30 }, // 2-30m derinlik aralığı (sığ su)
      season: [4, 5, 6, 7, 8, 9, 10, 11], // Nisan-Kasım
      timeOfDay: ["dawn", "dusk"],
    },
    description: "Sakin denizde avlanır. Kayalık ve kumlu zeminleri tercih eder.",
    tips: ["Sakin deniz koşulları", "Dip oltası", "Küçük yemler"],
  },
  {
    id: "levrek",
    trName: "Levrek",
    latinName: "Dicentrarchus labrax",
    conditions: {
      seaTemp: { min: 10, max: 22 },
      waveHeight: { max: 1.2 },
      windSpeed: { max: 35 },
      pressure: { min: 1005, max: 1025 },
      depth: { min: 1, max: 40 }, // 1-40m derinlik aralığı
      season: [1, 2, 3, 4, 9, 10, 11, 12], // Kış ve bahar
      timeOfDay: ["dawn", "dusk", "night"],
    },
    description: "Kış ve bahar aylarında aktif. Kayalık bölgeleri tercih eder.",
    tips: ["Şafak ve alacakaranlık", "Kayalık bölgeler", "Canlı yem"],
  },
];

/**
 * Mevcut koşullara göre uygun türleri belirle (noktaya özel)
 */
export function getSuitableSpecies(
  seaTemp: number | null,
  waveHeight: number | null,
  windSpeed: number,
  pressure: number | null,
  depth: number | null, // Mutlak derinlik değeri (negatif derinlik için pozitif)
  currentMonth: number,
  currentHour: number
): CanakkaleSpecies[] {
  const suitable: CanakkaleSpecies[] = [];

  // Saat dilimini belirle
  const timeOfDay =
    currentHour >= 5 && currentHour < 8
      ? "dawn"
      : currentHour >= 18 && currentHour < 21
      ? "dusk"
      : currentHour >= 8 && currentHour < 18
      ? "day"
      : "night";

  for (const species of CANAKKALE_SPECIES) {
    let matches = 0;
    let totalChecks = 0;

    // Mevsim kontrolü
    if (species.conditions.season.includes(currentMonth)) {
      matches++;
    }
    totalChecks++;

    // Deniz sıcaklığı kontrolü
    if (seaTemp !== null) {
      totalChecks++;
      if (
        seaTemp >= species.conditions.seaTemp.min &&
        seaTemp <= species.conditions.seaTemp.max
      ) {
        matches++;
      }
    }

    // Dalga yüksekliği kontrolü
    if (waveHeight !== null) {
      totalChecks++;
      if (waveHeight <= species.conditions.waveHeight.max) {
        matches++;
      }
    }

    // Rüzgar hızı kontrolü
    totalChecks++;
    if (windSpeed <= species.conditions.windSpeed.max) {
      matches++;
    }

    // Hava basıncı kontrolü
    if (pressure !== null) {
      totalChecks++;
      if (
        pressure >= species.conditions.pressure.min &&
        pressure <= species.conditions.pressure.max
      ) {
        matches++;
      }
    }

    // Derinlik kontrolü (noktaya özel)
    if (depth !== null) {
      totalChecks++;
      const absDepth = Math.abs(depth); // Negatif derinlik için mutlak değer
      if (
        absDepth >= species.conditions.depth.min &&
        absDepth <= species.conditions.depth.max
      ) {
        matches++;
      }
    }

    // Zaman dilimi kontrolü
    if (species.conditions.timeOfDay.includes(timeOfDay)) {
      matches++;
    }
    totalChecks++;

    // En az %60 uyum varsa uygun kabul et
    const matchRatio = matches / totalChecks;
    if (matchRatio >= 0.6) {
      suitable.push(species);
    }
  }

  // Uyum oranına göre sırala
  return suitable.sort((a, b) => {
    const aMatches = calculateMatchScore(a, seaTemp, waveHeight, windSpeed, pressure, depth, currentMonth, timeOfDay);
    const bMatches = calculateMatchScore(b, seaTemp, waveHeight, windSpeed, pressure, depth, currentMonth, timeOfDay);
    return bMatches - aMatches;
  });
}

/**
 * Tür için uyum skoru hesapla (0-100) - noktaya özel
 */
function calculateMatchScore(
  species: CanakkaleSpecies,
  seaTemp: number | null,
  waveHeight: number | null,
  windSpeed: number,
  pressure: number | null,
  depth: number | null,
  currentMonth: number,
  timeOfDay: string
): number {
  let score = 0;
  let maxScore = 0;

  // Mevsim (20 puan)
  maxScore += 20;
  if (species.conditions.season.includes(currentMonth)) {
    score += 20;
  }

  // Deniz sıcaklığı (20 puan)
  if (seaTemp !== null) {
    maxScore += 20;
    if (
      seaTemp >= species.conditions.seaTemp.min &&
      seaTemp <= species.conditions.seaTemp.max
    ) {
      score += 20;
    } else {
      // Yakınlık bonusu
      const mid = (species.conditions.seaTemp.min + species.conditions.seaTemp.max) / 2;
      const diff = Math.abs(seaTemp - mid);
      const range = species.conditions.seaTemp.max - species.conditions.seaTemp.min;
      if (diff <= range * 0.3) {
        score += 10;
      }
    }
  }

  // Dalga yüksekliği (15 puan)
  if (waveHeight !== null) {
    maxScore += 15;
    if (waveHeight <= species.conditions.waveHeight.max) {
      score += 15;
    } else if (waveHeight <= species.conditions.waveHeight.max * 1.2) {
      score += 7;
    }
  }

  // Rüzgar hızı (15 puan)
  maxScore += 15;
  if (windSpeed <= species.conditions.windSpeed.max) {
    score += 15;
  } else if (windSpeed <= species.conditions.windSpeed.max * 1.2) {
    score += 7;
  }

  // Hava basıncı (15 puan)
  if (pressure !== null) {
    maxScore += 15;
    if (
      pressure >= species.conditions.pressure.min &&
      pressure <= species.conditions.pressure.max
    ) {
      score += 15;
    } else {
      const mid = (species.conditions.pressure.min + species.conditions.pressure.max) / 2;
      const diff = Math.abs(pressure - mid);
      const range = species.conditions.pressure.max - species.conditions.pressure.min;
      if (diff <= range * 0.3) {
        score += 7;
      }
    }
  }

  // Derinlik (15 puan) - noktaya özel
  if (depth !== null) {
    maxScore += 15;
    const absDepth = Math.abs(depth); // Negatif derinlik için mutlak değer
    if (
      absDepth >= species.conditions.depth.min &&
      absDepth <= species.conditions.depth.max
    ) {
      score += 15;
    } else {
      // Yakınlık bonusu
      const mid = (species.conditions.depth.min + species.conditions.depth.max) / 2;
      const diff = Math.abs(absDepth - mid);
      const range = species.conditions.depth.max - species.conditions.depth.min;
      if (diff <= range * 0.3) {
        score += 7;
      }
    }
  }

  // Zaman dilimi (10 puan)
  maxScore += 10;
  if (species.conditions.timeOfDay.includes(timeOfDay)) {
    score += 10;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

