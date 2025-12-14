// Fishing utilities for determining sea region and fish species

export type SeaRegion = "Marmara" | "Ege" | "Akdeniz" | "Karadeniz" | "Unknown";

export interface FishSpecies {
  name: string;
  turkishName: string;
  idealTemp: { min: number; max: number }; // Celsius
  idealWaveHeight: { max: number }; // meters
  idealWindSpeed: { max: number }; // km/h
  activeHours: string[]; // ["sunrise", "sunset", "dawn", "dusk"]
  behavior: string;
  fishingTips: string;
  season: { start: number; end: number }; // month numbers (1-12)
}

export interface FishingConditions {
  score: number; // 0-10
  status: "Mükemmel" | "İyi" | "Orta" | "Kötü" | "Tehlikeli";
  color: string;
  message: string;
  activeSpecies: FishSpecies[];
  warnings: string[];
}

/**
 * Determine which sea region based on coordinates
 * Expanded ranges to cover Turkish coastal areas better
 */
export function getSeaRegion(latitude: number, longitude: number): SeaRegion {
  // Marmara Denizi - Expanded range to include Istanbul and surrounding areas
  if (latitude >= 39.5 && latitude <= 41.8 && longitude >= 26.0 && longitude <= 30.5) {
    return "Marmara";
  }
  // Ege Denizi - Expanded range to cover all Aegean coast
  if (latitude >= 35.5 && latitude <= 40.5 && longitude >= 25.0 && longitude <= 30.5) {
    return "Ege";
  }
  // Akdeniz - Expanded range to cover Mediterranean coast
  if (latitude >= 35.5 && latitude <= 37.8 && longitude >= 29.5 && longitude <= 36.5) {
    return "Akdeniz";
  }
  // Karadeniz - Expanded range to cover Black Sea coast
  if (latitude >= 40.0 && latitude <= 42.5 && longitude >= 27.0 && longitude <= 42.5) {
    return "Karadeniz";
  }
  return "Unknown";
}

const FISH_SPECIES_BY_REGION: Record<SeaRegion, FishSpecies[]> = {
  Marmara: [
    {
      name: "Palamut",
      turkishName: "Palamut",
      idealTemp: { min: 18, max: 24 },
      idealWaveHeight: { max: 1.0 },
      idealWindSpeed: { max: 30 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Sürü halinde dolaşır, yüzeye yakın avlanır",
      fishingTips: "Sabah erken ve akşam saatlerinde daha aktif. Yapay yem veya canlı yem kullanın.",
      season: { start: 9, end: 12 }, // Eylül-Aralık
    },
    {
      name: "Hamsi",
      turkishName: "Hamsi",
      idealTemp: { min: 12, max: 20 },
      idealWaveHeight: { max: 0.8 },
      idealWindSpeed: { max: 25 },
      activeHours: ["dawn", "dusk"],
      behavior: "Büyük sürüler halinde, yüzeye yakın",
      fishingTips: "Gün doğumu ve batımında en aktif. Sürü halinde avlanır.",
      season: { start: 10, end: 2 }, // Ekim-Şubat
    },
    {
      name: "Çipura",
      turkishName: "Çipura",
      idealTemp: { min: 16, max: 22 },
      idealWaveHeight: { max: 0.5 },
      idealWindSpeed: { max: 20 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Küçük sürüler halinde, kayalık ve kumlu zeminlerde",
      fishingTips: "Sakin denizde daha iyi avlanır. Dip oltası veya yapay yem kullanın.",
      season: { start: 4, end: 11 }, // Nisan-Kasım
    },
    {
      name: "Barbunya",
      turkishName: "Barbunya",
      idealTemp: { min: 15, max: 20 },
      idealWaveHeight: { max: 0.6 },
      idealWindSpeed: { max: 25 },
      activeHours: ["dawn", "dusk"],
      behavior: "Kumlu ve çamurlu zeminlerde, dip balığı",
      fishingTips: "Dip oltası ile kumlu zeminlerde avlanır. Temmuz-Ekim en lezzetli dönem.",
      season: { start: 7, end: 10 }, // Temmuz-Ekim
    },
  ],
  Ege: [
    {
      name: "Çipura",
      turkishName: "Çipura",
      idealTemp: { min: 18, max: 24 },
      idealWaveHeight: { max: 0.5 },
      idealWindSpeed: { max: 20 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Küçük sürüler halinde, kayalık ve kumlu zeminlerde",
      fishingTips: "Sakin denizde daha iyi avlanır. Dip oltası veya yapay yem kullanın.",
      season: { start: 4, end: 11 },
    },
    {
      name: "Levrek",
      turkishName: "Levrek",
      idealTemp: { min: 16, max: 22 },
      idealWaveHeight: { max: 0.8 },
      idealWindSpeed: { max: 25 },
      activeHours: ["dawn", "dusk"],
      behavior: "Kayalık bölgelerde, yırtıcı",
      fishingTips: "Sabah erken ve akşam saatlerinde aktif. Yapay yem veya canlı yem tercih edilir.",
      season: { start: 3, end: 11 },
    },
    {
      name: "Sinarit",
      turkishName: "Sinarit",
      idealTemp: { min: 20, max: 26 },
      idealWaveHeight: { max: 1.0 },
      idealWindSpeed: { max: 30 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Kayalık bölgelerde, derin sularda",
      fishingTips: "Yaz aylarında daha aktif. Derin sularda avlanır.",
      season: { start: 5, end: 10 },
    },
  ],
  Akdeniz: [
    {
      name: "Çipura",
      turkishName: "Çipura",
      idealTemp: { min: 20, max: 26 },
      idealWaveHeight: { max: 0.5 },
      idealWindSpeed: { max: 20 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Küçük sürüler halinde, kayalık ve kumlu zeminlerde",
      fishingTips: "Sakin denizde daha iyi avlanır. Dip oltası veya yapay yem kullanın.",
      season: { start: 4, end: 11 },
    },
    {
      name: "Sinarit",
      turkishName: "Sinarit",
      idealTemp: { min: 22, max: 28 },
      idealWaveHeight: { max: 1.0 },
      idealWindSpeed: { max: 30 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Kayalık bölgelerde, derin sularda",
      fishingTips: "Yaz aylarında daha aktif. Derin sularda avlanır.",
      season: { start: 5, end: 10 },
    },
    {
      name: "Akya",
      turkishName: "Akya",
      idealTemp: { min: 22, max: 28 },
      idealWaveHeight: { max: 1.5 },
      idealWindSpeed: { max: 35 },
      activeHours: ["dawn", "dusk"],
      behavior: "Açık denizde, yırtıcı",
      fishingTips: "Büyük yapay yemler veya canlı yem kullanın. Açık denizde avlanır.",
      season: { start: 6, end: 10 },
    },
  ],
  Karadeniz: [
    {
      name: "Hamsi",
      turkishName: "Hamsi",
      idealTemp: { min: 10, max: 18 },
      idealWaveHeight: { max: 0.8 },
      idealWindSpeed: { max: 25 },
      activeHours: ["dawn", "dusk"],
      behavior: "Büyük sürüler halinde, yüzeye yakın",
      fishingTips: "Gün doğumu ve batımında en aktif. Sürü halinde avlanır.",
      season: { start: 10, end: 2 }, // Ekim-Şubat
    },
    {
      name: "Palamut",
      turkishName: "Palamut",
      idealTemp: { min: 16, max: 22 },
      idealWaveHeight: { max: 1.0 },
      idealWindSpeed: { max: 30 },
      activeHours: ["sunrise", "sunset"],
      behavior: "Sürü halinde dolaşır, yüzeye yakın avlanır",
      fishingTips: "Sabah erken ve akşam saatlerinde daha aktif. Yapay yem veya canlı yem kullanın.",
      season: { start: 9, end: 12 },
    },
    {
      name: "Kalkan",
      turkishName: "Kalkan",
      idealTemp: { min: 12, max: 18 },
      idealWaveHeight: { max: 0.6 },
      idealWindSpeed: { max: 20 },
      activeHours: ["dawn", "dusk"],
      behavior: "Kumlu zeminlerde, dip balığı",
      fishingTips: "Dip oltası ile kumlu zeminlerde avlanır.",
      season: { start: 3, end: 6 },
    },
  ],
  Unknown: [],
};

/**
 * Calculate fishing conditions based on current weather and sea data
 */
export function getFishingConditions(
  seaRegion: SeaRegion,
  seaTemp: number | null,
  waveHeight: number | null,
  windSpeed: number,
  currentMonth: number
): FishingConditions {
  // Handle Unknown region
  if (seaRegion === "Unknown") {
    return {
      score: 5,
      status: "Orta",
      color: "#F59E0B",
      message: "Deniz bölgesi belirlenemedi. Genel balıkçılık tavsiyeleri için deniz verilerine ihtiyaç var.",
      activeSpecies: [],
      warnings: seaTemp === null || waveHeight === null 
        ? ["Deniz verileri mevcut değil"] 
        : [],
    };
  }

  const species = FISH_SPECIES_BY_REGION[seaRegion] || [];
  
  // Filter species by season
  const activeSpecies = species.filter((fish) => {
    if (fish.season.start <= fish.season.end) {
      return currentMonth >= fish.season.start && currentMonth <= fish.season.end;
    } else {
      // Season spans across year (e.g., Oct-Feb)
      return currentMonth >= fish.season.start || currentMonth <= fish.season.end;
    }
  });

  if (activeSpecies.length === 0) {
    return {
      score: 0,
      status: "Kötü",
      color: "#EF4444",
      message: "Bu mevsimde aktif balık türü bulunmuyor",
      activeSpecies: [],
      warnings: [],
    };
  }

  // Calculate conditions score
  let score = 5; // Base score
  const warnings: string[] = [];

  // Check wave height
  if (waveHeight !== null) {
    if (waveHeight > 1.5) {
      score -= 3;
      warnings.push("Yüksek dalga koşulları tehlikeli olabilir");
    } else if (waveHeight > 1.0) {
      score -= 2;
      warnings.push("Dalga yüksek, dikkatli olun");
    } else if (waveHeight < 0.5) {
      score += 1; // Calm sea is good
    }
  }

  // Check wind speed
  if (windSpeed > 50) {
    score -= 3;
    warnings.push("Güçlü rüzgar tehlikeli");
  } else if (windSpeed > 40) {
    score -= 2;
    warnings.push("Rüzgar güçlü, dikkatli olun");
  } else if (windSpeed < 20) {
    score += 1; // Light wind is good
  }

  // Check sea temperature for active species
  if (seaTemp !== null) {
    const tempSuitable = activeSpecies.some((fish) => 
      seaTemp >= fish.idealTemp.min && seaTemp <= fish.idealTemp.max
    );
    if (tempSuitable) {
      score += 2;
    } else {
      score -= 1;
      warnings.push("Deniz sıcaklığı bazı türler için uygun değil");
    }
  }

  // Clamp score between 0-10
  score = Math.max(0, Math.min(10, score));

  let status: FishingConditions["status"];
  let color: string;
  if (score >= 8) {
    status = "Mükemmel";
    color = "#10B981"; // green
  } else if (score >= 6) {
    status = "İyi";
    color = "#3B82F6"; // blue
  } else if (score >= 4) {
    status = "Orta";
    color = "#F59E0B"; // amber
  } else if (score >= 2) {
    status = "Kötü";
    color = "#EF4444"; // red
  } else {
    status = "Tehlikeli";
    color = "#8B5CF6"; // purple
  }

  // Get best species for current conditions
  const suitableSpecies = activeSpecies
    .filter((fish) => {
      if (seaTemp === null) return true;
      return seaTemp >= fish.idealTemp.min && seaTemp <= fish.idealTemp.max;
    })
    .filter((fish) => {
      if (waveHeight === null) return true;
      return waveHeight <= fish.idealWaveHeight.max;
    })
    .filter((fish) => windSpeed <= fish.idealWindSpeed.max)
    .slice(0, 3); // Top 3 species

  return {
    score,
    status,
    color,
    message: suitableSpecies.length > 0 
      ? `${suitableSpecies.map(s => s.turkishName).join(", ")} için uygun koşullar`
      : "Mevcut koşullar aktif türler için uygun değil",
    activeSpecies: suitableSpecies,
    warnings,
  };
}

