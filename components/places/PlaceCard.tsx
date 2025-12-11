import { View, Text, Pressable, Image } from "react-native";
import { MapPin } from "phosphor-react-native";
import { Place } from "@/types/place";
import { RatingStars } from "./RatingStars";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { router } from "expo-router";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    router.push(`/(places)/${place.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-2xl overflow-hidden mb-4 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}
    >
      {/* Image */}
      {place.images && place.images.length > 0 ? (
        <Image
          source={{ uri: place.images[0] }}
          className="w-full h-48"
          resizeMode="cover"
        />
      ) : (
        <View className={`w-full h-48 ${isDark ? "bg-muted-dark" : "bg-muted"} items-center justify-center`}>
          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("no_image")}
          </Text>
        </View>
      )}

      {/* Content */}
      <View className="p-4">
        {/* Name and Rating */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className={`text-lg font-bold flex-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {place.name}
          </Text>
          {place.rating > 0 && (
            <RatingStars rating={place.rating} size={14} showValue />
          )}
        </View>

        {/* Category */}
        <Text className={`text-sm mb-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          {t(`category_${place.category}`)}
        </Text>

        {/* Address */}
        <View className="flex-row items-center">
          <MapPin size={14} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
          <Text className={`text-xs ml-1 flex-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`} numberOfLines={1}>
            {place.address}
          </Text>
        </View>

        {/* Review Count */}
        {place.reviewCount > 0 && (
          <Text className={`text-xs mt-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {place.reviewCount} {place.reviewCount === 1 ? t("review") : t("reviews")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

