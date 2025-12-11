import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput, Alert, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Heart, Share, MapPin, NavigationArrow } from "phosphor-react-native";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useFavorites } from "@/stores/favorites-store";
import { getPlaceById } from "@/services/places-service";
import { subscribeToReviews, addReview } from "@/services/reviews-service";
import { Place } from "@/types/place";
import { Review } from "@/types/review";
import { ImageCarousel } from "@/components/places/ImageCarousel";
import { RatingStars } from "@/components/places/RatingStars";
import { ReviewCard } from "@/components/places/ReviewCard";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  const { favorites, addFavorite, removeFavorite, isFavorite, loadFavorites } = useFavorites();

  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadPlace = async () => {
      try {
        const placeData = await getPlaceById(id);
        setPlace(placeData);
      } catch (error) {
        console.error("Error loading place:", error);
        Alert.alert("Error", "Failed to load place details");
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToReviews(
      id,
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
  }, [id]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavorite = async () => {
    if (!id) return;

    if (isFavorite(id)) {
      await removeFavorite(id);
    } else {
      await addFavorite(id);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    Alert.alert("Share", "Share functionality coming soon");
  };

  const openExternalMap = async () => {
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
  };

  const handleSubmitReview = async () => {
    if (!id || !reviewComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    setSubmittingReview(true);
    try {
      // TODO: Get actual user ID and name from auth
      await addReview({
        placeId: id,
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
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-lg ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Place not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(place.id);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()}>
              <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
            </Pressable>
            <View className="flex-row items-center">
              <Pressable onPress={handleShare} className="mr-4">
                <Share size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
              </Pressable>
              <Pressable onPress={handleFavorite}>
                <Heart
                  size={24}
                  color={favorite ? "#FF6584" : (isDark ? "#ECEDEE" : "#11181C")}
                  weight={favorite ? "fill" : "regular"}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Image Carousel */}
        <ImageCarousel images={place.images} height={300} />

        {/* Content */}
        <View className="px-6 py-4">
          {/* Name and Rating */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`text-2xl font-bold flex-1 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {place.name}
            </Text>
            {place.rating > 0 && (
              <RatingStars rating={place.rating} size={20} showValue />
            )}
          </View>

          {/* Category */}
          <Text className={`text-sm mb-3 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t(`category_${place.category}`)}
          </Text>

          {/* Address */}
          <View className="flex-row items-start mb-4">
            <MapPin size={18} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
            <Text className={`text-sm ml-2 flex-1 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {place.address}
            </Text>
          </View>

          {/* Description */}
          {place.description && (
            <View className="mb-4">
              <Text className={`text-base ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                {place.description}
              </Text>
            </View>
          )}

          {/* Map */}
          {place.coordinates && (
            <View className="mb-4">
              <View className="mb-3 rounded-xl overflow-hidden" style={{ height: 200 }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: place.coordinates.latitude,
                    longitude: place.coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  userInterfaceStyle={isDark ? "dark" : "light"}
                >
                  <Marker
                    coordinate={{
                      latitude: place.coordinates.latitude,
                      longitude: place.coordinates.longitude,
                    }}
                    title={place.name}
                  />
                </MapView>
              </View>
              {/* Navigation Button */}
              <Pressable
                onPress={openExternalMap}
                className={`flex-row items-center justify-center py-3 px-4 rounded-xl ${isDark ? "bg-primary" : "bg-primary"}`}
              >
                <NavigationArrow
                  size={20}
                  color="#FFFFFF"
                  weight="bold"
                />
                <Text className="text-white font-semibold ml-2">
                  {t("show_route") || "Yönlendir"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Reviews Section */}
          <View className="mb-4">
            <Text className={`text-xl font-bold mb-3 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("reviews")} ({reviewsError ? 0 : reviews.length})
            </Text>

            {/* Add Review Form */}
            <View className={`rounded-xl p-4 mb-4 ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
              <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                {t("add_review")}
              </Text>

              {/* Rating */}
              <View className="mb-3">
                <Text className={`text-sm mb-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                  {t("rating")}
                </Text>
                <RatingStars
                  rating={reviewRating}
                  size={24}
                  showValue={false}
                />
                <View className="flex-row mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Pressable
                      key={rating}
                      onPress={() => setReviewRating(rating)}
                      className="mr-2"
                    >
                      <Text className={`text-sm ${reviewRating >= rating ? "text-yellow-500" : (isDark ? "text-muted-foreground-dark" : "text-muted-foreground")}`}>
                        {rating}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Comment */}
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder={t("review_comment_placeholder")}
                placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
                multiline
                numberOfLines={4}
                className={`rounded-lg p-3 mb-3 ${isDark ? "bg-card-dark text-foreground-dark" : "bg-card text-foreground"}`}
                style={{
                  minHeight: 100,
                  textAlignVertical: "top",
                  color: isDark ? "#ECEDEE" : "#11181C",
                }}
              />

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmitReview}
                disabled={submittingReview}
                className={`rounded-lg py-3 ${submittingReview ? "opacity-50" : ""} bg-primary`}
              >
                <Text className="text-white font-semibold text-center">
                  {submittingReview ? t("submitting") : t("submit_review")}
                </Text>
              </Pressable>
            </View>

            {/* Reviews List */}
            {reviewsError ? (
              <Text className={`text-sm text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {t("reviews_not_available") || "Yorumlar şu anda yüklenemiyor."}
              </Text>
            ) : reviews.length === 0 ? (
              <Text className={`text-sm text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {t("no_reviews")}
              </Text>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

