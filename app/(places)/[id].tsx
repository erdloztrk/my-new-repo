import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Heart, Share, MapPin, NavigationArrow, Folder } from "phosphor-react-native";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { ImageCarousel } from "@/components/places/ImageCarousel";
import { RatingStars } from "@/components/places/RatingStars";
import { ReviewCard } from "@/components/places/ReviewCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
// ViewModel
import { usePlaceDetailViewModel } from "@/viewmodels/places/usePlaceDetailViewModel";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { useState } from "react";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const [showAddToCollection, setShowAddToCollection] = useState(false);

  // ViewModel - All business logic extracted
  const {
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
  } = usePlaceDetailViewModel({ placeId: id });

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


  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/explore");
              }
            }}>
              <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
            </Pressable>
            <View className="flex-row items-center">
              <Pressable onPress={handleShare} className="mr-4">
                <Share size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
              </Pressable>
              <Pressable onPress={() => setShowAddToCollection(true)} className="mr-4">
                <Folder size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
              </Pressable>
              <Pressable onPress={handleFavorite}>
                <Heart
                  size={24}
                  color={isFavorite ? "#FF6584" : (isDark ? "#ECEDEE" : "#11181C")}
                  weight={isFavorite ? "fill" : "regular"}
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
                className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-primary"
              >
                <NavigationArrow size={20} color="#FFFFFF" weight="bold" />
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
            <Card variant="default" padding="md" className="mb-4">
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
              <Input
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder={t("review_comment_placeholder")}
                multiline
                numberOfLines={4}
                containerClassName="mb-3"
                inputClassName="min-h-[100px]"
                inputStyle={{
                  textAlignVertical: "top",
                  minHeight: 100,
                }}
              />

              {/* Submit Button */}
              <Button
                onPress={handleSubmitReview}
                isLoading={submittingReview}
                isDisabled={submittingReview}
                fullWidth
                variant="primary"
              >
                {submittingReview ? t("submitting") : t("submit_review")}
              </Button>
            </Card>

            {/* Reviews List */}
            {reviewsError ? (
              <Text className={`text-sm text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {t("reviews_not_available")}
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
      
      {/* Add to Collection Modal */}
      {id && (
        <AddToCollectionModal
          visible={showAddToCollection}
          placeId={id}
          onClose={() => setShowAddToCollection(false)}
        />
      )}
    </SafeAreaView>
  );
}

