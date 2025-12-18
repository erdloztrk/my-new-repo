import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Pressable, Image, Platform, Linking, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PersonSimpleWalk, Car, MapPin, Star, Folder } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { Place } from "@/types/place";
import { Collection } from "@/types/collection";
import { TablerIcon } from "@/components/icons/TablerIcon";
import { getCategoryColor, getCategoryIconName } from "@/utils/mapHelpers";

interface PlaceBottomSheetProps {
  place: Place | null;
  isVisible: boolean;
  collections?: Collection[];
  onAddToCollection: () => void;
}

export function PlaceBottomSheet({ place, isVisible, collections = [], onAddToCollection }: PlaceBottomSheetProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: isVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isVisible, cardAnim]);

  const openExternalMap = async (mode: "walking" | "driving") => {
    if (!place?.coordinates) return;
    const { latitude, longitude } = place.coordinates;
    
    try {
      if (Platform.OS === "ios") {
        const dirFlag = mode === "walking" ? "w" : "d";
        const url = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${dirFlag}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          const httpsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${dirFlag}`;
          await Linking.openURL(httpsUrl);
        }
      } else {
        const url = `google.navigation:q=${latitude},${longitude}&mode=${mode === "walking" ? "w" : "d"}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          const httpsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${mode}`;
          await Linking.openURL(httpsUrl);
        }
      }
    } catch (error) {
      console.error("Error opening map:", error);
    }
  };

  if (!place) return null;

  const iconNameForPlace = getCategoryIconName(place.category);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        transform: [
          {
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [300, 0],
            }),
          },
        ],
        opacity: cardAnim,
      }}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      <View
        style={{
          backgroundColor: isDark ? "#1A1B26" : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 24,
        }}
      >
        {/* Handle Bar */}
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? "#2E303C" : "#E2E8F0",
            }}
          />
        </View>

        <Pressable onPress={() => router.push(`/(places)/${place.id}`)}>
          {/* Place Info Row */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            {/* Place Image */}
            {place.images && place.images.length > 0 ? (
              <Image
                source={{ uri: place.images[0] }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  backgroundColor: getCategoryColor(place.category) + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <TablerIcon
                  name={iconNameForPlace}
                  size={36}
                  color={getCategoryColor(place.category)}
                  strokeWidth={1.5}
                />
              </View>
            )}

            {/* Place Details */}
            <View style={{ flex: 1, marginLeft: 14, justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "#ECEDEE" : "#11181C",
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {place.name}
              </Text>
              
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: getCategoryColor(place.category) + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: getCategoryColor(place.category),
                  }}
                >
                  {t(`category_${place.category}`)}
                </Text>
              </View>

              {place.rating > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Star size={14} color="#FFD700" weight="fill" />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isDark ? "#ECEDEE" : "#11181C",
                      marginLeft: 4,
                    }}
                  >
                    {place.rating.toFixed(1)}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MapPin size={13} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#94A3B8" : "#64748B",
                    marginLeft: 4,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {place.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Collections Section */}
          {collections.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isDark ? "#94A3B8" : "#64748B",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t("in_collections") || "Koleksiyonlarda"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {collections.slice(0, 4).map((collection) => (
                  <Pressable
                    key={collection.id}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/(collections)/${collection.id}`);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                    }}
                  >
                    {collection.emoji && (
                      <Text style={{ fontSize: 16, marginRight: 6 }}>
                        {collection.emoji}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isDark ? "#ECEDEE" : "#11181C",
                      }}
                      numberOfLines={1}
                    >
                      {collection.name}
                    </Text>
                  </Pressable>
                ))}
                {collections.length > 4 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isDark ? "#94A3B8" : "#64748B",
                      }}
                    >
                      +{collections.length - 4}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAddToCollection();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 14,
                flex: 1,
              }}
            >
              <Folder size={20} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
              <Text
                style={{
                  color: isDark ? "#ECEDEE" : "#11181C",
                  fontSize: 15,
                  fontWeight: "700",
                  marginLeft: 8,
                }}
              >
                {t("add_to_collection")}
              </Text>
            </Pressable>
          </View>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                openExternalMap("walking");
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#6C63FF",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 14,
                shadowColor: "#6C63FF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <PersonSimpleWalk size={20} color="#FFFFFF" weight="fill" />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: "700",
                  marginLeft: 8,
                }}
              >
                {t("walking") || "Yürüyüş"}
              </Text>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                openExternalMap("driving");
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 14,
              }}
            >
              <Car size={20} color={isDark ? "#ECEDEE" : "#11181C"} weight="fill" />
              <Text
                style={{
                  color: isDark ? "#ECEDEE" : "#11181C",
                  fontSize: 15,
                  fontWeight: "700",
                  marginLeft: 8,
                }}
              >
                {t("driving") || "Araç"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

