import { useState } from "react";
import { View, Text, Image, ScrollView, Dimensions, Pressable } from "react-native";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";

interface ImageCarouselProps {
  images: string[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function ImageCarousel({ images, height = 250 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (!images || images.length === 0) {
    return (
      <View className={`w-full ${isDark ? "bg-muted-dark" : "bg-muted"}`} style={{ height }}>
        <View className="flex-1 items-center justify-center">
          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            No images available
          </Text>
        </View>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <View className="relative">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ height }}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={{ width: SCREEN_WIDTH, height }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <Pressable
              onPress={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
            >
              <CaretLeft size={20} color="#FFFFFF" weight="bold" />
            </Pressable>
          )}
          {currentIndex < images.length - 1 && (
            <Pressable
              onPress={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
            >
              <CaretRight size={20} color="#FFFFFF" weight="bold" />
            </Pressable>
          )}

          {/* Dots Indicator */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
            {images.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${
                  index === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 w-2"
                }`}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

