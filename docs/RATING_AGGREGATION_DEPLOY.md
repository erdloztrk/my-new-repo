# Rating Aggregation Cloud Function - Deployment Guide

**Date:** 2025-12-18  
**Status:** 📋 Deployment Instructions

---

## Overview

This guide explains how to deploy the Cloud Function for automatic rating aggregation. The function automatically updates place ratings when reviews are created, updated, or deleted.

---

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project initialized: `firebase init`
3. Node.js 18+ installed
4. Firebase Functions enabled in Firebase Console

---

## Setup Steps

### 1. Initialize Firebase Functions (if not already done)

```bash
cd /path/to/lokal-mvp
firebase init functions
```

Select:
- Use an existing project (select your Firebase project)
- Language: JavaScript
- ESLint: Yes (optional)
- Install dependencies: Yes

### 2. Install Dependencies

```bash
cd functions
npm install
```

This will install:
- `firebase-admin` - Admin SDK for server-side operations
- `firebase-functions` - Firebase Functions SDK

### 3. Verify Function Code

Ensure `functions/index.js` contains the `aggregatePlaceRating` function (already created).

### 4. Deploy Function

```bash
# From project root
firebase deploy --only functions:aggregatePlaceRating
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

### 5. Verify Deployment

1. Go to Firebase Console → Functions
2. Verify `aggregatePlaceRating` is listed and active
3. Check logs for any errors

---

## Testing

### Manual Test

1. Create a review via the app
2. Check Firebase Console → Firestore → `places/{placeId}`
3. Verify `rating` and `reviewCount` fields are updated automatically

### Test Scenarios

1. **Create Review:**
   - Add a review with rating 5
   - Check place rating = 5.0, reviewCount = 1

2. **Update Review:**
   - Update review rating from 5 to 4
   - Check place rating = 4.0

3. **Delete Review:**
   - Delete a review
   - Check place rating and reviewCount updated correctly

4. **Multiple Reviews:**
   - Add reviews: 5, 4, 3
   - Check place rating = 4.0 (average), reviewCount = 3

---

## Monitoring

### View Logs

```bash
firebase functions:log
```

Or in Firebase Console:
- Functions → aggregatePlaceRating → Logs

### Common Issues

1. **Function not triggering:**
   - Check Firestore rules allow Cloud Function to read/write
   - Verify function is deployed and active

2. **Rating not updating:**
   - Check function logs for errors
   - Verify `placeId` exists in review document
   - Check Firestore rules allow updates to `places` collection

3. **Permission errors:**
   - Cloud Functions use Admin SDK (bypasses rules)
   - If errors occur, check Firebase project permissions

---

## Rollback

If you need to rollback:

```bash
# Deploy previous version
firebase deploy --only functions:aggregatePlaceRating --force
```

Or disable the function:
```bash
firebase functions:delete aggregatePlaceRating
```

---

## Cost Considerations

- Cloud Functions: Free tier includes 2M invocations/month
- Firestore reads: Each review change triggers a query (all reviews for place)
- Firestore writes: One write per review change

**Estimated cost:** Very low for typical usage (< 1000 reviews/day)

---

## Related Documents

- `docs/RATING_AGGREGATION.md` - Design document
- `functions/index.js` - Cloud Function code
- `firestore.rules` - Security rules (rating fields are read-only for clients)

---

**Status:** ✅ Function code ready. **ACTION REQUIRED:** Deploy to Firebase.

