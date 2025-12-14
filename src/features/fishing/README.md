# Fishing Activity Scoring Engine

Pure TypeScript module for computing fishing activity scores based on weather conditions.

## Features

- **Pure TypeScript**: No UI dependencies, can be used in Node.js, React Native, or web
- **Type-safe**: Full TypeScript types exported
- **Testable**: Includes test file with basic assertions
- **Well-documented**: JSDoc comments for all public functions

## API

### Types

- `WeatherSnapshot`: Weather conditions input
- `FishProfile`: Fish species profile with environmental preferences
- `TimeWeatherData`: Sunrise/sunset timestamps
- `SpeciesScore`: Result for a single species
- `OverallScore`: Overall fishing conditions score
- `FactorExplanation`: Breakdown of factors affecting the score

### Functions

#### `computeSpeciesScore()`

Compute species-specific score (0-10, one decimal).

```typescript
const score = computeSpeciesScore(
  snapshot,
  profile,
  seaRegion,
  shoreType,
  timeWeather,
  now
);
```

#### `computeOverallScore()`

Compute overall fishing score based on average of top 3 species.

```typescript
const overall = computeOverallScore(
  snapshot,
  profiles,
  seaRegion,
  shoreType,
  timeWeather,
  now
);
```

#### `explainScore()`

Get factor breakdown explaining the score.

```typescript
const factors = explainScore(
  snapshot,
  profile,
  seaRegion,
  shoreType
);
```

## Testing

Since no test framework is installed, a simple test runner is included:

```bash
# Option 1: Using ts-node (if installed)
npx ts-node src/features/fishing/fishingScore.test.ts

# Option 2: Using tsx (if installed)
npx tsx src/features/fishing/fishingScore.test.ts

# Option 3: Compile and run
npx tsc src/features/fishing/fishingScore.test.ts --outDir dist --esModuleInterop
node dist/src/features/fishing/fishingScore.test.js
```

## Usage Example

```typescript
import {
  computeSpeciesScore,
  computeOverallScore,
  explainScore,
  type WeatherSnapshot,
  type FishProfile,
  type TimeWeatherData,
} from "./fishingScore";

const snapshot: WeatherSnapshot = {
  airTempC: 15,
  seaTempC: 18,
  windKmh: 20,
  waveM: 0.5,
  pressureHpa: 1015,
};

const timeWeather: TimeWeatherData = {
  sunrise: Math.floor(new Date("2024-01-15T07:00:00Z").getTime() / 1000),
  sunset: Math.floor(new Date("2024-01-15T17:00:00Z").getTime() / 1000),
};

const profile: FishProfile = {
  id: "seabass",
  trName: "Levrek",
  latinShort: "D. labrax",
  latinFull: "Dicentrarchus labrax",
  primaryRegions: ["Marmara", "Ege", "Akdeniz"],
  seasonMonths: [1, 2, 3, 4, 9, 10, 11, 12],
  activity: {
    dawnWeight: 1.0,
    duskWeight: 1.0,
    dayWeight: 0.45,
    nightWeight: 0.35,
  },
  sstPreferred: { min: 10, max: 22 },
  wavePreferred: { max: 1.2 },
  windPreferred: { maxKmh: 35 },
  shorePreference: { rocky: 1.0, pier: 0.9, beach: 0.7 },
};

// Compute species score
const speciesScore = computeSpeciesScore(
  snapshot,
  profile,
  "Marmara",
  "rocky",
  timeWeather
);

// Compute overall score
const overallScore = computeOverallScore(
  snapshot,
  [profile],
  "Marmara",
  "rocky",
  timeWeather
);

// Get factor explanations
const factors = explainScore(snapshot, profile, "Marmara", "rocky");
```

## Scoring Algorithm

The scoring algorithm uses weighted components:

1. **Season & Region** (2.5 points): Based on month and sea region match
2. **Activity** (3.5 points): Based on time of day (dawn/dusk/day/night)
3. **Sea State** (2.0 points): Wave height and wind speed
4. **Sea Temperature** (1.5 points): SST within preferred range
5. **Shore Type** (0.5 points): Match with preferred shore type

Total: 10 points maximum

## Notes

- Missing data (e.g., sea temperature, wave height) is handled gracefully with neutral scores
- All scores are clamped to 0-10 range
- Scores are rounded to one decimal place

