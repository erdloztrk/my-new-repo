import React from "react";
import { View, Text } from "react-native";
import { Marker } from "react-native-maps";

interface ClusterMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  count: number;
  onPress?: () => void;
  isDark?: boolean;
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  coordinate,
  count,
  onPress,
  isDark = false,
}) => {
  // Determine size based on count
  const size = count > 100 ? 60 : count > 50 ? 50 : count > 10 ? 40 : 32;
  const fontSize = count > 100 ? 16 : count > 50 ? 14 : count > 10 ? 12 : 10;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={onPress}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? "#6C63FF" : "#6C63FF",
          borderWidth: 3,
          borderColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: fontSize,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {count > 99 ? "99+" : count.toString()}
        </Text>
      </View>
    </Marker>
  );
};

