/**
 * Test runner for fishingScore module
 * 
 * Run with: npx ts-node src/features/fishing/fishingScore.test.ts
 * Or: node --loader ts-node/esm src/features/fishing/fishingScore.test.ts
 */

import {
  computeSpeciesScore,
  computeOverallScore,
  explainScore,
  type WeatherSnapshot,
  type FishProfile,
  type TimeWeatherData,
  type SeaRegion,
  type ShoreType,
} from "./fishingScore";

// Test data
const mockTimeWeather: TimeWeatherData = {
  sunrise: Math.floor(new Date("2024-01-15T07:00:00Z").getTime() / 1000),
  sunset: Math.floor(new Date("2024-01-15T17:00:00Z").getTime() / 1000),
};

const mockSnapshot: WeatherSnapshot = {
  airTempC: 15,
  seaTempC: 18,
  windKmh: 20,
  waveM: 0.5,
  pressureHpa: 1015,
  cloudiness: 30,
};

const mockProfile: FishProfile = {
  id: "seabass",
  trName: "Levrek",
  latinShort: "D. labrax",
  latinFull: "Dicentrarchus labrax",
  primaryRegions: ["Marmara", "Ege", "Akdeniz"],
  seasonMonths: [1, 2, 3, 4, 9, 10, 11, 12],
  activity: { dawnWeight: 1.0, duskWeight: 1.0, dayWeight: 0.45, nightWeight: 0.35 },
  sstPreferred: { min: 10, max: 22 },
  wavePreferred: { max: 1.2 },
  windPreferred: { maxKmh: 35 },
  shorePreference: { rocky: 1.0, pier: 0.9, beach: 0.7 },
};

// Test helpers
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertInRange(value: number, min: number, max: number, message: string): void {
  if (value < min || value > max) {
    throw new Error(`Assertion failed: ${message} (value: ${value}, expected: ${min}-${max})`);
  }
}

// Tests
function testComputeSpeciesScore(): void {
  console.log("Testing computeSpeciesScore...");

  const result = computeSpeciesScore(
    mockSnapshot,
    mockProfile,
    "Marmara" as SeaRegion,
    "rocky" as ShoreType,
    mockTimeWeather
  );

  assert(result.id === "seabass", "Species ID should match");
  assert(result.trName === "Levrek", "Turkish name should match");
  assertInRange(result.score, 0, 10, "Score should be between 0 and 10");
  assert(typeof result.color === "string", "Color should be a string");
  assert(result.color.length > 0, "Color should not be empty");

  console.log("✓ computeSpeciesScore passed");
  console.log(`  Result: ${result.trName} - ${result.score}/10 (${result.color})`);
}

function testComputeOverallScore(): void {
  console.log("Testing computeOverallScore...");

  const profiles: FishProfile[] = [mockProfile];

  const result = computeOverallScore(
    mockSnapshot,
    profiles,
    "Marmara" as SeaRegion,
    "rocky" as ShoreType,
    mockTimeWeather
  );

  assertInRange(result.score, 0, 10, "Score should be between 0 and 10");
  assert(typeof result.label === "string", "Label should be a string");
  assert(typeof result.color === "string", "Color should be a string");
  assert(typeof result.summary === "string", "Summary should be a string");

  console.log("✓ computeOverallScore passed");
  console.log(`  Result: ${result.score}/10 - ${result.label} (${result.color})`);
  console.log(`  Summary: ${result.summary}`);
}

function testExplainScore(): void {
  console.log("Testing explainScore...");

  const factors = explainScore(mockSnapshot, mockProfile, "Marmara" as SeaRegion, "rocky" as ShoreType);

  assert(factors.length > 0, "Should return at least one factor");
  
  // Check for required factors
  const hasWind = factors.some((f) => f.key === "wind");
  const hasWave = factors.some((f) => f.key === "wave");
  const hasSST = factors.some((f) => f.key === "sst");

  assert(hasWind, "Should include wind factor");
  assert(hasWave, "Should include wave factor");
  assert(hasSST, "Should include sea temperature factor");

  // Validate factor structure
  factors.forEach((factor) => {
    assert(typeof factor.key === "string", "Factor key should be a string");
    assert(typeof factor.labelKey === "string", "Factor labelKey should be a string");
    assert(typeof factor.value === "string", "Factor value should be a string");
    assert(typeof factor.impact === "number", "Factor impact should be a number");
    assertInRange(factor.impact, -5, 5, "Factor impact should be between -5 and 5");
  });

  console.log("✓ explainScore passed");
  console.log(`  Factors: ${factors.length}`);
  factors.forEach((f) => {
    console.log(`    - ${f.key}: ${f.value} (impact: ${f.impact > 0 ? "+" : ""}${f.impact.toFixed(1)})`);
  });
}

function testEdgeCases(): void {
  console.log("Testing edge cases...");

  // Missing sea temperature
  const snapshotNoSST: WeatherSnapshot = {
    ...mockSnapshot,
    seaTempC: undefined,
  };

  const result1 = computeSpeciesScore(
    snapshotNoSST,
    mockProfile,
    "Marmara" as SeaRegion,
    "rocky" as ShoreType,
    mockTimeWeather
  );

  assertInRange(result1.score, 0, 10, "Score should handle missing SST");

  // Missing wave data
  const snapshotNoWave: WeatherSnapshot = {
    ...mockSnapshot,
    waveM: undefined,
  };

  const result2 = computeSpeciesScore(
    snapshotNoWave,
    mockProfile,
    "Marmara" as SeaRegion,
    "rocky" as ShoreType,
    mockTimeWeather
  );

  assertInRange(result2.score, 0, 10, "Score should handle missing wave data");

  // Unknown region
  const result3 = computeSpeciesScore(
    mockSnapshot,
    mockProfile,
    "Unknown" as SeaRegion,
    "unknown" as ShoreType,
    mockTimeWeather
  );

  assertInRange(result3.score, 0, 10, "Score should handle unknown region");

  console.log("✓ Edge cases passed");
}

// Run all tests
function runTests(): void {
  console.log("Running fishingScore tests...\n");

  try {
    testComputeSpeciesScore();
    console.log();
    testComputeOverallScore();
    console.log();
    testExplainScore();
    console.log();
    testEdgeCases();
    console.log();
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run if executed directly (works with both CommonJS and ESM)
if (typeof require !== "undefined" && require.main === module) {
  runTests();
}

// Also export for programmatic use
export { runTests };

