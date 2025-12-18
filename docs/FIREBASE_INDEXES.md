# Firebase Indexes Required

**Date:** 2025-12-18  
**Status:** ⚠️ Action Required

---

## Overview

Firestore requires composite indexes for queries that filter/order by multiple fields. This document lists all required indexes.

---

## Required Indexes

### 1. Collections - User Collections Query

**Collection:** `collections`  
**Fields:**
- `userId` (Ascending)
- `createdAt` (Descending)

**Query:**
```typescript
query(
  collectionsRef,
  where("userId", "==", userId),
  orderBy("createdAt", "desc")
)
```

**Create Index:**
1. Go to Firebase Console → Firestore → Indexes
2. Click "Create Index"
3. Collection ID: `collections`
4. Fields:
   - `userId` - Ascending
   - `createdAt` - Descending
5. Click "Create"

**Or use the link from error message:**
```
https://console.firebase.google.com/v1/r/project/lokal-app-bf19b/firestore/indexes?create_composite=...
```

---

### 2. Places - Category Query (if not exists)

**Collection:** `places`  
**Fields:**
- `category` (Ascending)
- `createdAt` (Descending)

**Query:**
```typescript
query(
  placesRef,
  where("category", "==", category),
  orderBy("createdAt", "desc")
)
```

**Status:** May already exist (check Firebase Console)

---

### 3. Reviews - Place Reviews Query (if not exists)

**Collection:** `reviews`  
**Fields:**
- `placeId` (Ascending)
- `createdAt` (Descending)

**Query:**
```typescript
query(
  reviewsRef,
  where("placeId", "==", placeId),
  orderBy("createdAt", "desc")
)
```

**Status:** May already exist (check Firebase Console)

---

### 4. Collections - Share ID Query (for public collections)

**Collection:** `collections`  
**Fields:**
- `shareId` (Ascending)
- `isPublic` (Ascending)

**Query:**
```typescript
query(
  collectionsRef,
  where("shareId", "==", shareId),
  where("isPublic", "==", true)
)
```

**Status:** Required for sharing feature

---

## Quick Setup

### Option 1: Firebase Console (Recommended)

1. Open Firebase Console
2. Go to Firestore → Indexes
3. Click "Create Index" for each index above
4. Wait for index to build (usually < 1 minute)

### Option 2: Firebase CLI

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "collections",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "collections",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "shareId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isPublic",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## Index Status

- ✅ **Places (category, createdAt)** - May exist
- ✅ **Reviews (placeId, createdAt)** - May exist
- ⚠️ **Collections (userId, createdAt)** - **REQUIRED** (causing errors)
- ⏭️ **Collections (shareId, isPublic)** - Required for sharing

---

## Testing

After creating indexes:

1. Wait for index to build (check Firebase Console)
2. Reload app
3. Navigate to Collections tab
4. Should load without index error

---

**Status:** ⚠️ Collections index required. **ACTION REQUIRED:** Create index in Firebase Console.

