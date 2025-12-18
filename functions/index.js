/**
 * Cloud Functions for LOKAL app
 * Handles server-side operations like rating aggregation
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Aggregate place rating when a review is created, updated, or deleted
 * Triggered on any write to /reviews/{reviewId}
 */
exports.aggregatePlaceRating = functions.firestore
  .document("reviews/{reviewId}")
  .onWrite(async (change, context) => {
    const reviewData = change.after.exists ? change.after.data() : null;
    const oldReviewData = change.before.exists ? change.before.data() : null;

    // Get placeId from new or old review data
    const placeId = reviewData?.placeId || oldReviewData?.placeId;

    if (!placeId) {
      console.warn("[aggregatePlaceRating] No placeId found in review");
      return null;
    }

    try {
      // Get all reviews for this place
      const reviewsSnapshot = await admin
        .firestore()
        .collection("reviews")
        .where("placeId", "==", placeId)
        .get();

      if (reviewsSnapshot.empty) {
        // No reviews, set rating to 0
        await admin.firestore().collection("places").doc(placeId).update({
          rating: 0,
          reviewCount: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[aggregatePlaceRating] Updated place ${placeId}: rating=0, count=0`);
        return null;
      }

      // Calculate aggregate rating
      let totalRating = 0;
      let count = 0;

      reviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        if (review.rating && typeof review.rating === "number") {
          totalRating += review.rating;
          count++;
        }
      });

      if (count === 0) {
        // No valid ratings, set to 0
        await admin.firestore().collection("places").doc(placeId).update({
          rating: 0,
          reviewCount: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[aggregatePlaceRating] Updated place ${placeId}: rating=0, count=0 (no valid ratings)`);
        return null;
      }

      const averageRating = totalRating / count;
      // Round to 1 decimal place
      const roundedRating = Math.round(averageRating * 10) / 10;

      // Update place document atomically
      await admin.firestore().collection("places").doc(placeId).update({
        rating: roundedRating,
        reviewCount: count,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `[aggregatePlaceRating] Updated place ${placeId}: rating=${roundedRating}, count=${count}`
      );

      return null;
    } catch (error) {
      console.error(`[aggregatePlaceRating] Error aggregating rating for place ${placeId}:`, error);
      throw error;
    }
  });

