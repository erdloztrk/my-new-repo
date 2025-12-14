import { View, Text } from "react-native";
import { RatingStars } from "./RatingStars";
import { Review } from "@/types/review";
import { useTheme } from "@/stores/theme-store";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <View className={`rounded-xl p-4 mb-3 ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-base font-semibold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          {review.userName}
        </Text>
        <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          {formatDate(
            review.createdAt instanceof Date
              ? review.createdAt
              : review.createdAt && typeof review.createdAt === "object" && "seconds" in review.createdAt
                ? new Date((review.createdAt as any).seconds * 1000)
                : new Date()
          )}
        </Text>
      </View>

      {/* Rating */}
      <View className="mb-2">
        <RatingStars rating={review.rating} size={14} />
      </View>

      {/* Comment */}
      {review.comment && (
        <Text className={`text-sm ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          {review.comment}
        </Text>
      )}
    </View>
  );
}

