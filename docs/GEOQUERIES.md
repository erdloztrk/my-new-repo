# Geospatial Queries Implementation

**Date:** 2025-12-18  
**Status:** 📋 Design Document

---

## Overview

Firestore doesn't natively support geospatial queries (e.g., "find places within 5km"). We need to implement geohashing for efficient location-based queries.

---

## Geohash Overview

**Geohash** is a geocoding system that encodes latitude/longitude into a string. Places close together have similar geohash prefixes.

**Example:**
- Location A: `40.15, 26.40` → Geohash: `sx8y`
- Location B: `40.16, 26.41` → Geohash: `sx8z` (similar prefix)

**Precision:**
- 5 characters: ~5km accuracy
- 6 characters: ~1.2km accuracy
- 7 characters: ~150m accuracy

---

## Implementation Plan

### Step 1: Add Geohash to Place Schema

**Update `types/place.ts`:**
```typescript
export interface Place {
  // ... existing fields
  geohash?: string; // Geohash for location queries
  geohash4?: string; // 4-char prefix (for ~20km queries)
  geohash5?: string; // 5-char prefix (for ~5km queries)
  geohash6?: string; // 6-char prefix (for ~1km queries)
}
```

### Step 2: Install Geohash Library

```bash
npm install ngeohash
# or
npm install geohash
```

### Step 3: Create Geohash Utility

**Create `utils/geohash.ts`:**
```typescript
import ngeohash from 'ngeohash';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Generate geohash for coordinates
 */
export function generateGeohash(coords: Coordinates): string {
  return ngeohash.encode(coords.latitude, coords.longitude);
}

/**
 * Generate geohash prefixes for different precision levels
 */
export function generateGeohashPrefixes(coords: Coordinates): {
  geohash: string;
  geohash4: string;
  geohash5: string;
  geohash6: string;
} {
  const fullHash = generateGeohash(coords);
  return {
    geohash: fullHash,
    geohash4: fullHash.substring(0, 4),
    geohash5: fullHash.substring(0, 5),
    geohash6: fullHash.substring(0, 6),
  };
}

/**
 * Get neighboring geohash cells (for radius queries)
 */
export function getNeighbors(geohash: string, precision: number = 5): string[] {
  const hash = geohash.substring(0, precision);
  return ngeohash.neighbors(hash);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

### Step 4: Update Place Service

**Update `services/places-service.ts`:**

```typescript
import { generateGeohashPrefixes } from '@/utils/geohash';

// When creating/updating a place, add geohash fields
export async function addPlace(placeData: PlaceInput): Promise<string> {
  const geohashData = generateGeohashPrefixes(placeData.coordinates);
  
  const placesRef = collection(db, "places");
  const docRef = await addDoc(placesRef, {
    ...placeData,
    ...geohashData, // Add geohash fields
    rating: 0,
    reviewCount: 0,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
```

### Step 5: Implement Radius Query

**Add to `services/places-service.ts`:**

```typescript
import { generateGeohash, getNeighbors, calculateDistance } from '@/utils/geohash';

/**
 * Get places within radius (km) of a location
 */
export async function getPlacesNearby(
  center: Coordinates,
  radiusKm: number
): Promise<Place[]> {
  // Determine geohash precision based on radius
  let precision = 5; // Default: ~5km
  if (radiusKm < 1) precision = 6; // <1km: use 6-char
  if (radiusKm < 0.5) precision = 7; // <500m: use 7-char
  if (radiusKm > 10) precision = 4; // >10km: use 4-char
  
  const centerHash = generateGeohash(center);
  const hashPrefix = centerHash.substring(0, precision);
  const neighbors = getNeighbors(centerHash, precision);
  
  // Query places with matching geohash prefix
  const placesRef = collection(db, "places");
  const geohashField = `geohash${precision}`;
  
  // Query center cell + neighbors
  const queries = [hashPrefix, ...neighbors].map(prefix =>
    query(placesRef, where(geohashField, "==", prefix))
  );
  
  const results = await Promise.all(queries.map(q => getDocs(q)));
  const allPlaces = results.flatMap(snapshot => 
    snapshot.docs.map(docToPlace)
  );
  
  // Filter by actual distance (geohash is approximate)
  const nearbyPlaces = allPlaces.filter(place =>
    calculateDistance(center, place.coordinates) <= radiusKm
  );
  
  // Sort by distance
  nearbyPlaces.sort((a, b) => {
    const distA = calculateDistance(center, a.coordinates);
    const distB = calculateDistance(center, b.coordinates);
    return distA - distB;
  });
  
  return nearbyPlaces;
}
```

---

## Firestore Indexes Required

Create composite indexes in Firebase Console:

1. **For radius queries:**
   - Collection: `places`
   - Fields: `geohash5` (Ascending), `createdAt` (Descending)

2. **For category + radius:**
   - Collection: `places`
   - Fields: `category` (Ascending), `geohash5` (Ascending), `createdAt` (Descending)

---

## Migration: Backfill Geohash for Existing Places

```typescript
// Run once to add geohash to existing places
export async function backfillGeohash(): Promise<void> {
  const places = await getAllPlaces();
  
  for (const place of places) {
    const geohashData = generateGeohashPrefixes(place.coordinates);
    await updatePlace(place.id, geohashData);
  }
}
```

---

## Performance Considerations

1. **Geohash Precision:** Use appropriate precision for query radius
2. **Neighbor Cells:** Query center + 8 neighbors for accuracy
3. **Post-Filter:** Always filter by actual distance (geohash is approximate)
4. **Indexes:** Create Firestore composite indexes for geohash queries

---

## Testing

```typescript
// Test radius query
const center = { latitude: 40.15, longitude: 26.40 };
const places = await getPlacesNearby(center, 5); // 5km radius

// Verify all places are within radius
places.forEach(place => {
  const distance = calculateDistance(center, place.coordinates);
  expect(distance).toBeLessThanOrEqual(5);
});
```

---

## Related Documents

- `docs/FIRESTORE_RULES.md` - Security rules
- `services/places-service.ts` - Place service implementation
- `utils/mapHelpers.ts` - Existing distance calculation

---

**Status:** 📋 Design complete. **ACTION REQUIRED:** Implement geohash utility and update place service.

