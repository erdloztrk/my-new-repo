# Firestore Security Rules

**Date:** 2025-12-18  
**Status:** ✅ Rules file created

---

## Overview

Firestore security rules define who can read/write data in the database. This document describes the security model for LOKAL app.

---

## Rules File Location

- **File:** `firestore.rules`
- **Deploy:** `firebase deploy --only firestore:rules`

---

## Collections & Rules

### 1. Places (`/places/{placeId}`)

**Read:** ✅ Public (anyone can read places)

**Create:** 
- ✅ Admin users
- ✅ Authenticated users (can create their own places)
- ✅ Validation: Must include required fields, rating/reviewCount must be 0

**Update:**
- ✅ Admin users
- ✅ Place owner (createdBy == userId)
- ❌ Cannot modify `rating` or `reviewCount` (aggregated fields)

**Delete:**
- ✅ Admin users only

**Fields:**
- `name` (string, required)
- `category` (string, required)
- `description` (string)
- `address` (string, required)
- `coordinates` (object with latitude/longitude, validated)
- `images` (array)
- `rating` (number, aggregated, read-only for clients)
- `reviewCount` (int, aggregated, read-only for clients)
- `createdBy` (string, user ID)
- `createdAt` (timestamp)

---

### 2. Reviews (`/reviews/{reviewId}`)

**Read:** ✅ Public (anyone can read reviews)

**Create:**
- ✅ Authenticated users only
- ✅ Must set `userId` to their own UID
- ✅ Rating must be 1-5
- ✅ Validation: Required fields present

**Update:**
- ✅ Review owner only
- ❌ Cannot change `userId`, `placeId`, `createdAt`

**Delete:**
- ✅ Review owner
- ✅ Admin users

**Rate Limiting:**
- Currently enforced in app logic (one review per place per user)
- For stricter enforcement, use Cloud Function trigger

**Fields:**
- `placeId` (string, required, immutable)
- `userId` (string, required, immutable)
- `userName` (string, required)
- `rating` (int, 1-5, required)
- `comment` (string, required)
- `createdAt` (timestamp, immutable)

---

### 3. Users (`/users/{userId}`)

**Read:** ✅ Authenticated users (can read any user profile)

**Create:**
- ✅ Authenticated users (can create their own profile)
- ✅ Must set `uid` to their own UID

**Update:**
- ✅ Own profile only
- ❌ Cannot modify `role` field (admin-only)
- ❌ Cannot change `uid`

**Delete:**
- ✅ Own profile
- ✅ Admin users

**Fields:**
- `uid` (string, user ID, immutable)
- `email` (string)
- `displayName` (string)
- `role` (string, "admin" | "user", admin-only write)
- `createdAt` (timestamp)

---

### 4. Favorites (`/favorites/{userId}`)

**Read:** ✅ Own favorites only

**Write:**
- ✅ Own favorites only
- ✅ Must set `userId` to own UID

**Fields:**
- `userId` (string, user ID)
- `placeIds` (array of place IDs)

---

### 5. Collections (`/collections/{collectionId}`)

**Read:** ✅ Public (for sharing lists)

**Create:**
- ✅ Authenticated users
- ✅ Must set `userId` to own UID

**Update:**
- ✅ Collection owner only
- ❌ Cannot change `userId` or `createdAt`

**Delete:**
- ✅ Collection owner
- ✅ Admin users

**Fields:**
- `userId` (string, user ID, immutable)
- `name` (string, required)
- `emoji` (string, optional)
- `description` (string, optional)
- `createdAt` (timestamp, immutable)
- `updatedAt` (timestamp)

---

### 6. Collection Items (`/collections/{collectionId}/items/{itemId}`)

**Read:** ✅ Public

**Write:**
- ✅ Collection owner only (checked via parent collection)

**Fields:**
- `placeId` (string, reference to place)
- `order` (int, for sorting)
- `notes` (string, optional)
- `addedAt` (timestamp)

---

### 7. Admin (`/admin/{document=**}`)

**Read/Write:** ✅ Admin users only

---

## Helper Functions

### `isAuthenticated()`
Returns true if user is logged in.

### `isOwner(userId)`
Returns true if current user owns the resource.

### `isAdmin()`
Returns true if user has admin role (checked via `/users/{uid}` document).

### `isValidRating(rating)`
Validates rating is integer between 1-5.

### `isValidCoordinates(coords)`
Validates latitude/longitude are valid floats within bounds.

---

## Security Considerations

### 1. Rating Aggregation
- `places.rating` and `places.reviewCount` are **read-only** for clients
- Aggregation must be done server-side (Cloud Function or backend)
- See `docs/RATING_AGGREGATION.md` for implementation

### 2. Admin Role
- Admin role is stored in `/users/{uid}` document
- Role field is **admin-only write** (cannot be set by users)
- Admin operations should use Firebase Admin SDK (server-side)

### 3. Rate Limiting
- Review creation: Currently enforced in app logic
- For production: Use Cloud Function trigger for stricter enforcement
- Consider adding timestamp-based rate limiting (max N reviews per day)

### 4. Data Validation
- All required fields are validated in rules
- Coordinates are validated for bounds
- Ratings are validated for range (1-5)

---

## Deployment

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### Test Rules Locally
```bash
firebase emulators:start --only firestore
# Rules are automatically loaded from firestore.rules
```

### Validate Rules Syntax
```bash
firebase deploy --only firestore:rules --dry-run
```

---

## Testing

### Manual Test Cases

1. **Places:**
   - ✅ Unauthenticated user can read places
   - ✅ Authenticated user can create place
   - ✅ Place owner can update (but not rating/reviewCount)
   - ❌ Non-owner cannot update place
   - ❌ User cannot delete place (admin only)

2. **Reviews:**
   - ✅ Unauthenticated user can read reviews
   - ✅ Authenticated user can create review
   - ✅ Review owner can update/delete
   - ❌ Non-owner cannot update/delete
   - ❌ User cannot create review with invalid rating

3. **Users:**
   - ✅ Authenticated user can read any user profile
   - ✅ User can update own profile
   - ❌ User cannot modify role field
   - ❌ User cannot update other user's profile

4. **Collections:**
   - ✅ Public can read collections (for sharing)
   - ✅ Authenticated user can create collection
   - ✅ Collection owner can update/delete
   - ❌ Non-owner cannot update/delete

---

## Migration Notes

### Existing Data
If you have existing data in Firestore:

1. **Add `role` field to admin users:**
   ```javascript
   // Run in Firebase Console or Cloud Function
   const adminUids = ['admin-uid-1', 'admin-uid-2'];
   adminUids.forEach(async (uid) => {
     await db.collection('users').doc(uid).set({
       role: 'admin'
     }, { merge: true });
   });
   ```

2. **Ensure `createdBy` field exists on places:**
   ```javascript
   // Backfill createdBy if missing
   const places = await db.collection('places').get();
   places.forEach(async (place) => {
     if (!place.data().createdBy) {
       await place.ref.update({
         createdBy: 'system' // or actual admin UID
       });
     }
   });
   ```

---

## Related Documents

- `docs/SECURITY_HOTFIX.md` - Environment variables and CORS
- `docs/RATING_AGGREGATION.md` - Rating aggregation implementation
- `docs/GEOQUERIES.md` - Geospatial query implementation

---

## Next Steps

1. ✅ Deploy rules to Firebase
2. ⏭️ Implement rating aggregation (Cloud Function)
3. ⏭️ Add geohash fields to places for geoqueries
4. ⏭️ Set up Cloud Function triggers for review aggregation

---

**Status:** ✅ Rules file ready. **ACTION REQUIRED:** Deploy to Firebase Console.

