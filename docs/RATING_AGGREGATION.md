# Rating Aggregation System

**Date:** 2025-12-18  
**Status:** 📋 Design Document

---

## Overview

Place ratings (`rating` and `reviewCount`) are **aggregated fields** that must be calculated server-side, not by clients. This prevents manipulation and ensures data integrity.

---

## Current Implementation

### Client-Side (❌ Not Recommended for Production)

Currently, `services/reviews-service.ts` has `calculatePlaceRating()` that:
1. Fetches all reviews for a place
2. Calculates average rating
3. Updates place document

**Problems:**
- Client can manipulate ratings
- Race conditions possible (multiple reviews at once)
- No transaction guarantees

---

## Recommended Implementation

### Option 1: Cloud Function Trigger (✅ Recommended)

**Trigger:** `onCreate`, `onUpdate`, `onDelete` on `/reviews/{reviewId}`

**Implementation:**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.aggregatePlaceRating = functions.firestore
  .document('reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const reviewData = change.after.exists ? change.after.data() : null;
    const oldReviewData = change.before.exists ? change.before.data() : null;
    
    const placeId = reviewData?.placeId || oldReviewData?.placeId;
    if (!placeId) return null;
    
    // Get all reviews for this place
    const reviewsSnapshot = await admin.firestore()
      .collection('reviews')
      .where('placeId', '==', placeId)
      .get();
    
    if (reviewsSnapshot.empty) {
      // No reviews, set to 0
      await admin.firestore().collection('places').doc(placeId).update({
        rating: 0,
        reviewCount: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }
    
    // Calculate aggregate
    let totalRating = 0;
    let count = 0;
    
    reviewsSnapshot.forEach(doc => {
      const review = doc.data();
      totalRating += review.rating;
      count++;
    });
    
    const averageRating = totalRating / count;
    const roundedRating = Math.round(averageRating * 10) / 10; // 1 decimal
    
    // Update place atomically
    await admin.firestore().collection('places').doc(placeId).update({
      rating: roundedRating,
      reviewCount: count,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return null;
  });
```

**Deploy:**
```bash
cd functions
npm install
firebase deploy --only functions
```

---

### Option 2: Backend API Endpoint

**Endpoint:** `POST /v1/reviews/aggregate`

**Implementation:**

```python
# backend/src/main.py
@app.post("/v1/reviews/aggregate")
async def aggregate_place_rating(place_id: str):
    """
    Aggregate ratings for a place.
    Called by Cloud Function or directly after review creation.
    """
    # Fetch reviews from Firestore (using Admin SDK)
    reviews = firestore_client.collection('reviews').where('placeId', '==', place_id).get()
    
    if not reviews:
        # Update place to 0 rating
        firestore_client.collection('places').document(place_id).update({
            'rating': 0,
            'reviewCount': 0,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        return {'status': 'updated', 'rating': 0, 'count': 0}
    
    # Calculate aggregate
    total_rating = sum(review.get('rating', 0) for review in reviews)
    count = len(reviews)
    average_rating = round(total_rating / count, 1)
    
    # Update place
    firestore_client.collection('places').document(place_id).update({
        'rating': average_rating,
        'reviewCount': count,
        'updatedAt': firestore.SERVER_TIMESTAMP
    })
    
    return {'status': 'updated', 'rating': average_rating, 'count': count}
```

---

## Migration Plan

### Step 1: Deploy Cloud Function
1. Set up Firebase Functions
2. Deploy aggregation function
3. Test with sample reviews

### Step 2: Remove Client-Side Aggregation
1. Remove `calculatePlaceRating()` from `services/reviews-service.ts`
2. Update `addReview()` to not call aggregation
3. Let Cloud Function handle it automatically

### Step 3: Backfill Existing Data
```javascript
// Run once to recalculate all place ratings
const places = await admin.firestore().collection('places').get();
for (const place of places.docs) {
  const reviews = await admin.firestore()
    .collection('reviews')
    .where('placeId', '==', place.id)
    .get();
  
  if (reviews.empty) {
    await place.ref.update({ rating: 0, reviewCount: 0 });
    continue;
  }
  
  const totalRating = reviews.docs.reduce((sum, r) => sum + r.data().rating, 0);
  const count = reviews.size;
  const avg = Math.round((totalRating / count) * 10) / 10;
  
  await place.ref.update({ rating: avg, reviewCount: count });
}
```

---

## Security Considerations

1. **Firestore Rules:** Ensure `rating` and `reviewCount` are read-only for clients
2. **Admin SDK:** Cloud Function uses Admin SDK (bypasses rules)
3. **Transactions:** Consider using transactions for critical updates
4. **Rate Limiting:** Cloud Function has built-in rate limiting

---

## Testing

### Manual Test
1. Create a review → Check place rating updates
2. Update a review → Check place rating updates
3. Delete a review → Check place rating updates
4. Create multiple reviews quickly → Check no race conditions

### Automated Test
```javascript
// functions/test/aggregate.test.js
const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

test('aggregates rating correctly', async () => {
  // Create test place
  const placeRef = admin.firestore().collection('places').doc('test-place');
  await placeRef.set({ name: 'Test', rating: 0, reviewCount: 0 });
  
  // Create reviews
  await admin.firestore().collection('reviews').add({
    placeId: 'test-place',
    userId: 'user1',
    rating: 5,
    comment: 'Great!'
  });
  
  await admin.firestore().collection('reviews').add({
    placeId: 'test-place',
    userId: 'user2',
    rating: 4,
    comment: 'Good'
  });
  
  // Wait for function to execute
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check aggregated rating
  const place = await placeRef.get();
  expect(place.data().rating).toBe(4.5);
  expect(place.data().reviewCount).toBe(2);
});
```

---

## Related Documents

- `docs/FIRESTORE_RULES.md` - Security rules (rating fields are read-only)
- `services/reviews-service.ts` - Current client-side implementation (to be removed)

---

**Status:** 📋 Design complete. **ACTION REQUIRED:** Implement Cloud Function.

