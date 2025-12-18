# Performance Audit Report

**Date:** 2025-12-18  
**Status:** 📋 Recommendations provided

---

## Executive Summary

This audit evaluates performance bottlenecks and optimization opportunities in the LOKAL app, focusing on map rendering, data fetching, and state management.

---

## Critical Performance Issues

### 1. Map Screen Re-renders
**Priority:** HIGH  
**Impact:** Laggy map interactions

**Current State:**
- `app/(tabs)/map.tsx` is 1651 lines
- Many state variables trigger re-renders
- Marker rendering not fully optimized

**Issues:**
- Region changes trigger full re-render
- Filter changes re-render all markers
- Weather updates re-render entire map

**Recommendation:**
- ✅ Already implemented: Marker memoization (`useMemo`)
- Add `React.memo` to PlaceMarker component
- Extract filter panel to separate component (reduces parent re-renders)
- Use `useCallback` for event handlers

**Files to Update:**
- `app/(tabs)/map.tsx` - Extract components, add memoization
- `components/map/PlaceMarker.tsx` - Add React.memo

---

### 2. No Marker Clustering
**Priority:** MEDIUM  
**Impact:** Too many markers on screen

**Current State:**
- All places shown as individual markers
- No clustering for zoomed-out views
- Performance degrades with 50+ markers

**Recommendation:**
- Implement marker clustering (e.g., `react-native-map-clustering`)
- Cluster markers when zoom < 12
- Show cluster count on cluster marker

**Implementation:**
```typescript
import MapView, { Marker } from 'react-native-maps';
import { Clusterer } from 'react-native-map-clustering';

<Clusterer>
  {places.map(place => (
    <Marker key={place.id} coordinate={place.coordinates} />
  ))}
</Clusterer>
```

**Files to Update:**
- `app/(tabs)/map.tsx` - Add clustering
- `package.json` - Add clustering library

---

### 3. No Debouncing on Region Changes
**Priority:** MEDIUM  
**Impact:** Excessive API calls

**Current State:**
- Region changes trigger immediate place fetch
- No debouncing
- Multiple rapid pan/zoom = multiple API calls

**Recommendation:**
- Debounce region change handler (500ms)
- Cancel pending requests on new region change
- Use `useDebouncedCallback` hook

**Implementation:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedRegionChange = useDebouncedCallback(
  (region) => {
    fetchPlaces(region);
  },
  500
);
```

**Files to Update:**
- `hooks/map/useMapPlaces.ts` - Add debouncing
- `app/(tabs)/map.tsx` - Use debounced handler

---

### 4. No Request Cancellation
**Priority:** MEDIUM  
**Impact:** Wasted network requests

**Current State:**
- Firestore queries not cancelled on unmount
- Multiple overlapping requests possible
- No AbortController usage

**Recommendation:**
- Use AbortController for fetch requests
- Cancel Firestore listeners on unmount
- Track pending requests and cancel on new request

**Files to Update:**
- `services/places-service.ts` - Add cancellation
- `hooks/map/useMapPlaces.ts` - Cancel on unmount

---

### 5. Large Bundle Size
**Priority:** LOW  
**Impact:** Slow app startup

**Current State:**
- All components loaded upfront
- No code splitting
- Large dependencies (maps, icons)

**Recommendation:**
- Lazy load screens (React.lazy)
- Code split by route
- Tree-shake unused icons

**Implementation:**
```typescript
const MapScreen = React.lazy(() => import('./app/(tabs)/map'));
```

**Files to Update:**
- `app/_layout.tsx` - Add lazy loading
- `package.json` - Review dependencies

---

## State Management Performance

### 6. Zustand Store Selectors
**Priority:** MEDIUM  
**Impact:** Unnecessary re-renders

**Current State:**
- Some stores don't use selectors
- Components subscribe to entire store
- Re-render on any store change

**Recommendation:**
- Use Zustand selectors for fine-grained subscriptions
- Only subscribe to needed fields

**Example:**
```typescript
// Bad
const { places, loading, error } = usePlacesStore();

// Good
const places = usePlacesStore(state => state.places);
const loading = usePlacesStore(state => state.loading);
```

**Files to Update:**
- `stores/favorites-store.tsx` - Add selectors
- `stores/bathymetry-store.tsx` - Add selectors
- Components using stores - Use selectors

---

### 7. No Memoization in Hooks
**Priority:** LOW  
**Impact:** Unnecessary computations

**Current State:**
- Some hooks recalculate on every render
- No memoization of expensive operations

**Recommendation:**
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Memoize filtered/sorted arrays

**Files to Update:**
- `hooks/map/useMapPlaces.ts` - Add memoization
- `hooks/map/useMapRegion.ts` - Add memoization

---

## Data Fetching Performance

### 8. No Geospatial Indexing
**Priority:** HIGH  
**Impact:** Slow radius queries

**Current State:**
- Fetches all places, filters in memory
- No geohash indexing
- O(n) filtering for every query

**Recommendation:**
- Implement geohash (see `docs/GEOQUERIES.md`)
- Use Firestore geohash queries
- Reduce data transfer

**Files to Update:**
- `services/places-service.ts` - Add geohash queries
- `types/place.ts` - Add geohash fields

---

### 9. No Caching
**Priority:** MEDIUM  
**Impact:** Redundant API calls

**Current State:**
- No caching for places
- Weather data fetched every time
- No offline support

**Recommendation:**
- Cache places in AsyncStorage
- Cache weather data (5-10 min TTL)
- Use React Query for caching (future)

**Files to Update:**
- `services/places-service.ts` - Add caching
- `components/weather/weatherAPI.ts` - Add caching

---

### 10. Batch Operations
**Priority:** LOW  
**Impact:** Multiple network calls

**Current State:**
- ✅ Already implemented: Batch fetch for favorites
- Some operations still make multiple calls

**Recommendation:**
- Continue using batch operations
- Batch review fetches
- Batch collection fetches

**Files:**
- `services/reviews-service.ts` - Already good
- `services/collections-service.ts` - Use batches (when created)

---

## Rendering Performance

### 11. Image Optimization
**Priority:** MEDIUM  
**Impact:** Slow image loading

**Current State:**
- Images loaded at full resolution
- No lazy loading
- No image caching

**Recommendation:**
- Use Expo Image (already using)
- Add placeholder images
- Lazy load images in lists
- Compress images before upload

**Files to Update:**
- `components/places/ImageCarousel.tsx` - Add lazy loading
- `app/(places)/add.tsx` - Compress images

---

### 12. List Virtualization
**Priority:** LOW  
**Impact:** Slow scrolling with many items

**Current State:**
- No virtualization for long lists
- All items rendered at once

**Recommendation:**
- Use `FlatList` (already using in some places)
- Ensure all lists use FlatList
- Add `getItemLayout` for better performance

**Files to Check:**
- `app/(tabs)/saved.tsx` - Uses FlatList ✅
- `app/(places)/category/[category].tsx` - Check if uses FlatList

---

## Network Performance

### 13. No Request Deduplication
**Priority:** LOW  
**Impact:** Duplicate requests

**Current State:**
- Multiple components might request same data
- No request deduplication

**Recommendation:**
- Use React Query (future)
- Or implement simple request cache
- Track pending requests

**Files:**
- Consider adding React Query in future

---

### 14. Large Payloads
**Priority:** LOW  
**Impact:** Slow data transfer

**Current State:**
- Fetching all place fields
- No field selection

**Recommendation:**
- Use Firestore field selection for lists
- Only fetch full place data on detail view

**Example:**
```typescript
// List view: Only fetch name, category, coordinates
const q = query(placesRef, select('name', 'category', 'coordinates'));

// Detail view: Fetch all fields
const place = await getPlaceById(id);
```

**Files to Update:**
- `services/places-service.ts` - Add field selection

---

## Quick Wins

1. ✅ **Marker memoization** - Already done
2. ⏭️ **Debounce region changes** - Easy, high impact
3. ⏭️ **Extract map.tsx components** - Medium effort, high impact
4. ⏭️ **Add geohash queries** - Medium effort, high impact
5. ⏭️ **Add marker clustering** - Easy, medium impact

---

## Performance Metrics

### Current State (Estimated)
- Map render: ~100-200ms (with 50 markers)
- Place fetch: ~500-1000ms (all places)
- Filter apply: ~50-100ms (in-memory)

### Target State
- Map render: <50ms (with clustering)
- Place fetch: <200ms (geohash query)
- Filter apply: <20ms (memoized)

---

## Testing

### Performance Test Checklist
- [ ] Map pan/zoom smooth (60fps)
- [ ] Filter apply <100ms
- [ ] Place fetch <500ms
- [ ] No janky animations
- [ ] Smooth scrolling in lists

### Tools
- React Native Performance Monitor
- Flipper Performance Plugin
- Chrome DevTools (for web)

---

## Related Documents

- `docs/AUDIT_UX_UI.md` - UX recommendations
- `docs/GEOQUERIES.md` - Geohash implementation
- `docs/AUDIT_CLEANUP.md` - Code cleanup

---

**Status:** 📋 Recommendations provided. **ACTION REQUIRED:** Prioritize quick wins and measure impact.

