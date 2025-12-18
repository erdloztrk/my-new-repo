/**
 * ViewModel hook for PlaceDetail screen.
 * Handles all business logic: place loading, reviews, favorites, navigation.
 */

import { useState, useEffect, useCallback } from "react";
import { Alert, Platform, Linking } from "react-native";
import { getPlaceById } from "@/services/places-service";
import { subscribeToReviews, addReview } from "@/services/reviews-service";
import { useFavorites } from "@/stores/favorites-store";
import { Place } from "@/types/place";
import { Review } from "@/types/review";

interface UsePlaceDetailViewModelOptions {
  placeId: string | null | undefined;
}

interface UsePlaceDetailViewModelResult {
  // State
  place: Place | null;
  reviews: Review[];
  loading: boolean;
  reviewsError: boolean;
  reviewRating: number;
  reviewComment: string;
  submittingReview: boolean;
  isFavorite: boolean;

  // Actions
  setReviewRating: (rating: number) => void;
  setReviewComment: (comment: string) => void;
  handleFavorite: () => Promise<void>;
  handleSubmitReview: () => Promise<void>;
  handleShare: () => void;
  openExternalMap: () => Promise<void>;
}

export function usePlaceDetailViewModel({
  placeId,
}: UsePlaceDetailViewModelOptions): UsePlaceDetailViewModelResult {
  const { addFavorite, removeFavorite, isFavorite: checkFavorite, loadFavorites } = useFavorites();

  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);

  // Load place data
  useEffect(() => {
    if (!placeId) {
      setLoading(false);
      return;
    }

    const loadPlace = async () => {
      try {
        setLoading(true);
        const placeData = await getPlaceById(placeId);
        setPlace(placeData);
      } catch (error) {
        console.error("Error loading place:", error);
        Alert.alert("Error", "Failed to load place details");
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [placeId]);

  // Subscribe to reviews
  useEffect(() => {
    if (!placeId) return;

    const unsubscribe = subscribeToReviews(
      placeId,
      (reviewsData) => {
        setReviews(reviewsData);
        setReviewsError(false);
      },
      (error) => {
        console.error("Error subscribing to reviews:", error);
        setReviewsError(true);
      }
    );

    return () => unsubscribe();
  }, [placeId]);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Handle favorite toggle
  const handleFavorite = useCallback(async () => {
    if (!placeId) return;

    if (checkFavorite(placeId)) {
      await removeFavorite(placeId);
    } else {
      await addFavorite(placeId);
    }
  }, [placeId, checkFavorite, removeFavorite, addFavorite]);

  // Handle share (placeholder)
  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    Alert.alert("Share", "Share functionality coming soon");
  }, []);

  // Open external map app
  const openExternalMap = useCallback(async () => {
    if (!place?.coordinates) return;
    const { latitude, longitude } = place.coordinates;

    try {
      if (Platform.OS === "ios") {
        const url = `maps://maps.apple.com/?daddr=${latitude},${longitude}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback to https:// URL
          const httpsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}`;
          await Linking.openURL(httpsUrl);
        }
      } else {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening maps app:", error);
    }
  }, [place?.coordinates]);

  // Handle review submission
  const handleSubmitReview = useCallback(async () => {
    if (!placeId || !reviewComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    setSubmittingReview(true);
    try {
      // TODO: Get actual user ID and name from auth
      await addReview({
        placeId,
        userId: "anonymous",
        userName: "Anonymous User",
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewComment("");
      setReviewRating(5);
      Alert.alert("Success", "Review added successfully");
    } catch (error) {
      console.error("Error adding review:", error);
      Alert.alert("Error", "Failed to add review");
    } finally {
      setSubmittingReview(false);
    }
  }, [placeId, reviewComment, reviewRating]);

  const isFavorite = placeId ? checkFavorite(placeId) : false;

  return {
    place,
    reviews,
    loading,
    reviewsError,
    reviewRating,
    reviewComment,
    submittingReview,
    isFavorite,
    setReviewRating,
    setReviewComment,
    handleFavorite,
    handleSubmitReview,
    handleShare,
    openExternalMap,
  };
}

