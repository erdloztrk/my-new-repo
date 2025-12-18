import React from "react";
import { View, Text } from "react-native";
import { Marker } from "react-native-maps";
import { Place } from "@/types/place";
import { Collection } from "@/types/collection";

interface PlaceMarkerProps {
  place: Place;
  categoryColor: string;
  isSelected: boolean;
  index: number;
  collections?: Array<{ emoji?: string }>;
  onPress: () => void;
}

export const PlaceMarker = React.memo<PlaceMarkerProps>(function PlaceMarker({
  place,
  categoryColor,
  isSelected,
  index,
  collections = [],
  onPress,
}) {
  // Show up to 2 collection emojis
  const displayCollections = collections.slice(0, 2);
  const hasCollections = displayCollections.length > 0;

  return (
    <Marker
      coordinate={{
        latitude: place.coordinates.latitude,
        longitude: place.coordinates.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={(e) => {
        e.stopPropagation();
        // Close depth pin when place is selected
        onPress();
      }}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Collection Emojis */}
        {hasCollections && (
          <View
            style={{
              flexDirection: "row",
              marginBottom: 4,
              gap: 2,
            }}
          >
            {displayCollections.map((collection, idx) => (
              collection.emoji ? (
                <View
                  key={idx}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#FFFFFF",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: "#E2E8F0",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{collection.emoji}</Text>
                </View>
              ) : null
            ))}
          </View>
        )}
        
        {/* Place Marker Dot */}
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: categoryColor,
            borderWidth: isSelected ? 3 : 2,
            borderColor: isSelected ? "#FFFFFF" : "#F9FAFB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.25,
            shadowRadius: 2,
            elevation: 3,
          }}
        />
      </View>
    </Marker>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these props change
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.categoryColor === nextProps.categoryColor &&
    prevProps.collections?.length === nextProps.collections?.length &&
    (prevProps.collections?.length === 0 || (prevProps.collections?.every((c, i) => (c.emoji === nextProps.collections?.[i]?.emoji)) ?? true))
  );
});

