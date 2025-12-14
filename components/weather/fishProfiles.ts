import type { SeaRegion } from "./fishingUtils";

export type ShoreType = "beach" | "rocky" | "pier" | "unknown";

export interface FishProfile {
  id: string;
  trName: string;
  latinShort: string; // short form, e.g. "D. labrax"
  latinFull: string; // full form, e.g. "Dicentrarchus labrax"
  primaryRegions: SeaRegion[]; // where it's commonly targeted in MVP
  seasonMonths: number[]; // 1-12 months where it's commonly targeted (MVP heuristic)
  activity: {
    dawnWeight: number; // 0..1
    duskWeight: number; // 0..1
    dayWeight: number; // 0..1
    nightWeight: number; // 0..1
  };
  sstPreferred?: { min: number; max: number }; // °C
  wavePreferred?: { max: number }; // meters
  windPreferred?: { maxKmh: number }; // km/h
  shorePreference: Partial<Record<ShoreType, number>>; // 0..1
}

export const MARMARA_CORE_PROFILES: FishProfile[] = [
  {
    id: "seabass",
    trName: "Levrek",
    latinShort: "D. labrax",
    latinFull: "Dicentrarchus labrax",
    primaryRegions: ["Marmara", "Ege", "Akdeniz"],
    // Broad season; often productive in shoulder seasons and winter in many spots
    seasonMonths: [1, 2, 3, 4, 9, 10, 11, 12],
    activity: { dawnWeight: 1.0, duskWeight: 1.0, dayWeight: 0.45, nightWeight: 0.35 },
    sstPreferred: { min: 10, max: 22 },
    wavePreferred: { max: 1.2 },
    windPreferred: { maxKmh: 35 },
    shorePreference: { rocky: 1.0, pier: 0.9, beach: 0.7 },
  },
  {
    id: "bluefish",
    trName: "Lüfer",
    latinShort: "P. saltatrix",
    latinFull: "Pomatomus saltatrix",
    primaryRegions: ["Marmara", "Karadeniz"],
    // Marmara/Boğaz odaklı göç dönemi ağırlıklı (heuristic)
    seasonMonths: [9, 10, 11, 12],
    activity: { dawnWeight: 0.9, duskWeight: 1.0, dayWeight: 0.55, nightWeight: 0.25 },
    sstPreferred: { min: 14, max: 24 },
    wavePreferred: { max: 1.5 },
    windPreferred: { maxKmh: 40 },
    shorePreference: { pier: 1.0, rocky: 0.7, beach: 0.5 },
  },
  {
    id: "horse_mackerel",
    trName: "İstavrit",
    latinShort: "T. trachurus",
    latinFull: "Trachurus trachurus",
    primaryRegions: ["Marmara", "Ege", "Karadeniz", "Akdeniz"],
    seasonMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    activity: { dawnWeight: 0.7, duskWeight: 0.8, dayWeight: 0.9, nightWeight: 0.35 },
    sstPreferred: { min: 10, max: 22 },
    wavePreferred: { max: 1.8 },
    windPreferred: { maxKmh: 45 },
    shorePreference: { pier: 1.0, beach: 0.6, rocky: 0.6 },
  },
  {
    id: "bonito",
    trName: "Palamut",
    latinShort: "S. sarda",
    latinFull: "Sarda sarda",
    primaryRegions: ["Marmara", "Karadeniz", "Ege"],
    seasonMonths: [8, 9, 10, 11, 12],
    activity: { dawnWeight: 0.8, duskWeight: 0.9, dayWeight: 0.7, nightWeight: 0.3 },
    sstPreferred: { min: 16, max: 26 },
    wavePreferred: { max: 2.0 },
    windPreferred: { maxKmh: 50 },
    shorePreference: { pier: 0.9, rocky: 0.8, beach: 0.6 },
  },
  {
    id: "anchovy",
    trName: "Hamsi",
    latinShort: "E. encrasicolus",
    latinFull: "Engraulis encrasicolus",
    primaryRegions: ["Marmara", "Karadeniz"],
    seasonMonths: [10, 11, 12, 1, 2, 3],
    activity: { dawnWeight: 0.6, duskWeight: 0.7, dayWeight: 0.8, nightWeight: 0.5 },
    sstPreferred: { min: 8, max: 20 },
    wavePreferred: { max: 1.5 },
    windPreferred: { maxKmh: 40 },
    shorePreference: { pier: 1.0, beach: 0.8, rocky: 0.5 },
  },
  {
    id: "gilthead_seabream",
    trName: "Çipura",
    latinShort: "S. aurata",
    latinFull: "Sparus aurata",
    primaryRegions: ["Marmara", "Ege", "Akdeniz"],
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    activity: { dawnWeight: 0.9, duskWeight: 0.95, dayWeight: 0.6, nightWeight: 0.4 },
    sstPreferred: { min: 14, max: 24 },
    wavePreferred: { max: 1.0 },
    windPreferred: { maxKmh: 30 },
    shorePreference: { rocky: 1.0, pier: 0.8, beach: 0.7 },
  },
  {
    id: "red_mullet",
    trName: "Barbun",
    latinShort: "M. barbatus",
    latinFull: "Mullus barbatus",
    primaryRegions: ["Ege", "Akdeniz", "Marmara"],
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    activity: { dawnWeight: 0.7, duskWeight: 0.8, dayWeight: 0.9, nightWeight: 0.4 },
    sstPreferred: { min: 16, max: 26 },
    wavePreferred: { max: 1.2 },
    windPreferred: { maxKmh: 35 },
    shorePreference: { beach: 0.9, rocky: 0.7, pier: 0.6 },
  },
  {
    id: "whiting",
    trName: "Mezgit",
    latinShort: "M. merlangus",
    latinFull: "Merlangius merlangus",
    primaryRegions: ["Karadeniz", "Marmara"],
    seasonMonths: [10, 11, 12, 1, 2, 3, 4],
    activity: { dawnWeight: 0.6, duskWeight: 0.7, dayWeight: 0.8, nightWeight: 0.5 },
    sstPreferred: { min: 6, max: 18 },
    wavePreferred: { max: 1.5 },
    windPreferred: { maxKmh: 40 },
    shorePreference: { pier: 1.0, beach: 0.8, rocky: 0.5 },
  },
  {
    id: "turbot",
    trName: "Kalkan",
    latinShort: "S. maximus",
    latinFull: "Scophthalmus maximus",
    primaryRegions: ["Karadeniz", "Marmara"],
    seasonMonths: [3, 4, 5, 6, 7, 8, 9],
    activity: { dawnWeight: 0.5, duskWeight: 0.6, dayWeight: 0.7, nightWeight: 0.8 },
    sstPreferred: { min: 10, max: 20 },
    wavePreferred: { max: 1.0 },
    windPreferred: { maxKmh: 30 },
    shorePreference: { beach: 1.0, rocky: 0.6, pier: 0.5 },
  },
  {
    id: "white_sea_bream",
    trName: "Sargoz",
    latinShort: "D. sargus",
    latinFull: "Diplodus sargus",
    primaryRegions: ["Ege", "Akdeniz", "Marmara"],
    // Kıyı balıkçılığının klasik türü, zeki ve temkinli
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    activity: { dawnWeight: 0.85, duskWeight: 0.9, dayWeight: 0.7, nightWeight: 0.4 },
    sstPreferred: { min: 15, max: 24 },
    wavePreferred: { max: 0.8 }, // Temkinli tür, sakin deniz tercih eder
    windPreferred: { maxKmh: 25 }, // Daha sakin rüzgar tercih eder
    shorePreference: { rocky: 1.0, pier: 0.8, beach: 0.6 },
  },
  {
    id: "common_two_banded_sea_bream",
    trName: "Karagöz",
    latinShort: "D. vulgaris",
    latinFull: "Diplodus vulgaris",
    primaryRegions: ["Ege", "Akdeniz", "Marmara"],
    // Sargozla karıştırılır, iki belirgin siyah bant ayırt edici
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    activity: { dawnWeight: 0.8, duskWeight: 0.85, dayWeight: 0.75, nightWeight: 0.4 },
    sstPreferred: { min: 15, max: 24 },
    wavePreferred: { max: 0.9 }, // Sargoz gibi sakin deniz tercih eder
    windPreferred: { maxKmh: 28 },
    shorePreference: { rocky: 1.0, pier: 0.85, beach: 0.65 },
  },
  {
    id: "sand_steenbras",
    trName: "Mırmır",
    latinShort: "L. mormyrus",
    latinFull: "Lithognathus mormyrus",
    primaryRegions: ["Ege", "Akdeniz", "Marmara"],
    // Sparidae ailesinde ama çipura-sargoz'dan farklı karakter
    // Kumluk ve ince çamurlu zeminleri sever, dipte titreşim/ses/kokuya aşırı hassas
    // Yan çizgi sistemi (lateral line) çok iyi çalışır, dalgalı havalarda daha aktif
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    activity: { dawnWeight: 0.75, duskWeight: 0.8, dayWeight: 0.85, nightWeight: 0.5 },
    // Dalgalı havalarda daha aktif olduğu için dalga toleransı daha yüksek
    sstPreferred: { min: 16, max: 25 },
    wavePreferred: { max: 1.2 }, // Dalgalı havalarda daha aktif (lateral line avantajı)
    windPreferred: { maxKmh: 32 }, // Orta rüzgarda da aktif olabilir
    shorePreference: { beach: 1.0, rocky: 0.5, pier: 0.7 }, // Kumluk zemin tercih eder
  },
];


