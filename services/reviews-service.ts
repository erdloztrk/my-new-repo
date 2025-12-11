import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { Review, ReviewInput } from "@/types/review";
import { updatePlaceRating } from "./places-service";

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return timestamp instanceof Date ? timestamp : new Date();
};

// Convert Firestore document to Review
const docToReview = (doc: any): Review => {
  const data = doc.data();
  return {
    id: doc.id,
    placeId: data.placeId,
    userId: data.userId,
    userName: data.userName || "Anonymous",
    rating: data.rating || 0,
    comment: data.comment || "",
    createdAt: convertTimestamp(data.createdAt),
  };
};

// Get reviews by place ID
export async function getReviewsByPlaceId(placeId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("placeId", "==", placeId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToReview);
  } catch (error) {
    console.error("Error getting reviews by place ID:", error);
    throw error;
  }
}

// Subscribe to reviews (real-time updates)
export function subscribeToReviews(
  placeId: string,
  callback: (reviews: Review[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const reviewsRef = collection(db, "reviews");
  const q = query(
    reviewsRef,
    where("placeId", "==", placeId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const reviews = querySnapshot.docs.map(docToReview);
      callback(reviews);
    },
    (error) => {
      console.error("Error subscribing to reviews:", error);
      onError?.(error);
      callback([]);
    }
  );
}

// Add review
export async function addReview(reviewData: ReviewInput): Promise<string> {
  try {
    const reviewsRef = collection(db, "reviews");
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      createdAt: Timestamp.now(),
    });

    // Update place rating
    await calculatePlaceRating(reviewData.placeId);

    return docRef.id;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
}

// Calculate and update place rating
export async function calculatePlaceRating(placeId: string): Promise<void> {
  try {
    const reviews = await getReviewsByPlaceId(placeId);
    
    if (reviews.length === 0) {
      await updatePlaceRating(placeId, 0, 0);
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal

    await updatePlaceRating(placeId, roundedRating, reviews.length);
  } catch (error) {
    console.error("Error calculating place rating:", error);
    throw error;
  }
}

