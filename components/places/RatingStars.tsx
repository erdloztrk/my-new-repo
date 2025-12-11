import { View, Text } from "react-native";
import { Star } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";

interface RatingStarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function RatingStars({ rating, size = 16, showValue = false }: RatingStarsProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View className="flex-row items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} color="#FFD700" weight="fill" />
      ))}
      {hasHalfStar && (
        <Star size={size} color="#FFD700" weight="duotone" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} color={isDark ? "#94A3B8" : "#E5E7EB"} weight="regular" />
      ))}
      {showValue && (
        <View className="ml-1">
          <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {rating.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

