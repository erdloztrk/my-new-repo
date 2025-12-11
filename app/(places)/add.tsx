import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Camera, MapPin } from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { addPlace } from "@/services/places-service";
import { Category } from "@/types/category";
import { CATEGORIES, CATEGORY_LABELS } from "@/types/category";

export default function AddPlaceScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission", "Location permission is required");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCoordinates(coords);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Camera roll permission is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoordinates({ latitude, longitude });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Error", "Please enter an address");
      return;
    }

    if (!coordinates) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Get actual user ID from auth
      const placeId = await addPlace({
        name: name.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        coordinates,
        images,
        createdBy: "anonymous",
      });

      Alert.alert("Success", "Place added successfully", [
        {
          text: "OK",
          onPress: () => {
            router.replace(`/(places)/${placeId}`);
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding place:", error);
      Alert.alert("Error", "Failed to add place");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
          </Pressable>
          <Text className={`text-xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("add_place")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Name */}
          <View className="mb-4">
            <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("name")} *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("place_name_placeholder")}
              placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
              className={`rounded-lg p-3 ${isDark ? "bg-card-dark text-foreground-dark" : "bg-card text-foreground"}`}
              style={{ color: isDark ? "#ECEDEE" : "#11181C" }}
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("category")} *
            </Text>
            <View className="flex-row flex-wrap">
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`rounded-lg px-4 py-2 mr-2 mb-2 border ${
                    category === cat
                      ? "bg-primary border-primary"
                      : isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      category === cat
                        ? "text-white"
                        : isDark
                        ? "text-card-foreground-dark"
                        : "text-card-foreground"
                    }`}
                  >
                    {t(CATEGORY_LABELS[cat])}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("description")}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("description_placeholder")}
              placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
              multiline
              numberOfLines={4}
              className={`rounded-lg p-3 ${isDark ? "bg-card-dark text-foreground-dark" : "bg-card text-foreground"}`}
              style={{
                minHeight: 100,
                textAlignVertical: "top",
                color: isDark ? "#ECEDEE" : "#11181C",
              }}
            />
          </View>

          {/* Address */}
          <View className="mb-4">
            <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("address")} *
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={t("address_placeholder")}
              placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
              className={`rounded-lg p-3 ${isDark ? "bg-card-dark text-foreground-dark" : "bg-card text-foreground"}`}
              style={{ color: isDark ? "#ECEDEE" : "#11181C" }}
            />
          </View>

          {/* Images */}
          <View className="mb-4">
            <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("images")}
            </Text>
            <Pressable
              onPress={handlePickImage}
              className={`flex-row items-center justify-center rounded-lg p-3 mb-3 border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}
            >
              <Camera size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
              <Text className={`ml-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                {t("add_images")}
              </Text>
            </Pressable>

            {/* Image Preview */}
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((image, index) => (
                  <View key={index} className="mr-2 relative">
                    <Image source={{ uri: image }} className="w-24 h-24 rounded-lg" />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                    >
                      <Text className="text-white text-xs">×</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Map */}
          <View className="mb-4">
            <Text className={`text-base font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("location")} *
            </Text>
            {mapRegion ? (
              <View className="rounded-lg overflow-hidden" style={{ height: 200 }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={mapRegion}
                  onPress={handleMapPress}
                  userInterfaceStyle={isDark ? "dark" : "light"}
                >
                  {coordinates && (
                    <Marker
                      coordinate={coordinates}
                      title={name || t("selected_location")}
                    />
                  )}
                </MapView>
              </View>
            ) : (
              <View className={`rounded-lg p-4 items-center justify-center ${isDark ? "bg-muted-dark" : "bg-muted"}`} style={{ height: 200 }}>
                <MapPin size={32} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                <Text className={`text-sm mt-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                  {t("loading_location")}
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className={`rounded-lg py-4 mb-8 ${submitting ? "opacity-50" : ""} bg-primary`}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-center text-lg">
                {t("submit")}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

