import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { 
  ArrowLeft, 
  Camera, 
  MapPin, 
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Check,
  X
} from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { addPlace, getPlaceById, updatePlace } from "@/services/places-service";
import { useAdminStore } from "@/stores/admin-store";
import { Category, ParentCategoryKey, categoryStructure, childCategoryToCategory } from "@/types/category";
import { logError } from "@/lib/logger";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type FormStep = "basic" | "details" | "location" | "images" | "review";

interface FormErrors {
  name?: string;
  category?: string;
  address?: string;
  coordinates?: string;
}

export default function AddPlaceScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [expandedParent, setExpandedParent] = useState<ParentCategoryKey | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const { user } = useAdminStore();

  const steps: FormStep[] = ["basic", "details", "location", "images", "review"];
  const currentStepIndex = steps.indexOf(currentStep);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("add_place.permission_title"), t("add_place.permission_message"));
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
      logError("[AddPlaceScreen] Error getting location:", error);
    }
  }, [t]);

  const loadPlaceForEdit = useCallback(async (placeId: string) => {
    try {
      setLoadingPlace(true);
      setIsEditing(true);
      const place = await getPlaceById(placeId);
      if (place) {
        setName(place.name);
        setCategory(place.category);
        setDescription(place.description);
        setAddress(place.address);
        setImages(place.images);
        setCoordinates(place.coordinates);
        setMapRegion({
          ...place.coordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      logError("[AddPlaceScreen] Error loading place:", error);
      Alert.alert(t("error"), t("add_place.error_load_failed"));
    } finally {
      setLoadingPlace(false);
    }
  }, [t]);

  // Load place for editing
  useEffect(() => {
    if (edit) {
      loadPlaceForEdit(edit);
    } else {
      // Reset form state when not editing
      setName("");
      setCategory(null);
      setDescription("");
      setAddress("");
      setImages([]);
      setCoordinates(null);
      setCurrentStep("basic");
      setErrors({});
      setAddressSearch("");
      getCurrentLocation();
    }
  }, [edit, loadPlaceForEdit, getCurrentLocation]);

  // Reset form when screen loses focus (user navigates away)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: Reset form if not editing and user navigates away
        if (!isEditing && !submitting) {
          setName("");
          setCategory(null);
          setDescription("");
          setAddress("");
          setImages([]);
          setCoordinates(null);
          setCurrentStep("basic");
          setErrors({});
          setAddressSearch("");
        }
      };
    }, [isEditing, submitting])
  );

  // Validation
  const validateStep = (step: FormStep): boolean => {
    const newErrors: FormErrors = {};

    if (step === "basic") {
      if (!name.trim()) {
        newErrors.name = t("add_place.error_name_required");
      }
      if (!category) {
        newErrors.category = t("add_place.error_category_required");
      }
    }

    if (step === "location") {
      if (!address.trim()) {
        newErrors.address = t("add_place.error_address_required");
      }
      if (!coordinates) {
        newErrors.coordinates = t("add_place.error_location_required");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceedToStep = (step: FormStep): boolean => {
    if (step === "basic") return true;
    if (step === "details") return !!(name.trim() && category);
    if (step === "location") return !!(name.trim() && category);
    if (step === "images") return !!(address.trim() && coordinates);
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleGoToStep = (step: FormStep) => {
    if (canProceedToStep(step)) {
      setCurrentStep(step);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Address search (geocoding)
  const handleSearchAddress = async () => {
    if (!addressSearch.trim()) return;

    setIsSearchingAddress(true);
    try {
      const results = await Location.geocodeAsync(addressSearch);
      if (results.length > 0) {
        const result = results[0];
        const coords = {
          latitude: result.latitude,
          longitude: result.longitude,
        };
        setCoordinates(coords);
        // Construct address from available fields or use search term
        const addressParts = [
          (result as any).street,
          (result as any).streetNumber,
          (result as any).district,
          (result as any).city,
        ].filter(Boolean);
        const formattedAddress = addressParts.length > 0 
          ? addressParts.join(", ") 
          : addressSearch;
        setAddress(formattedAddress);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setAddressSearch("");
      } else {
        Alert.alert(t("error"), "Adres bulunamadı");
      }
    } catch (error) {
      logError("[AddPlaceScreen] Error searching address:", error);
      Alert.alert(t("error"), "Adres arama hatası");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("add_place.camera_permission_title"), t("add_place.camera_permission_message"));
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
      logError("[AddPlaceScreen] Error picking image:", error);
      Alert.alert(t("error"), t("add_place.error_pick_image"));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoordinates({ latitude, longitude });
    
    // Reverse geocode to get address
    Location.reverseGeocodeAsync({ latitude, longitude })
      .then((results) => {
        if (results.length > 0) {
          const result = results[0];
          // Construct address from available fields
          const formattedAddress = [
            result.street,
            result.streetNumber,
            result.district,
            result.city,
          ]
            .filter(Boolean)
            .join(", ");
          if (formattedAddress) {
            setAddress(formattedAddress);
          }
        }
      })
      .catch((error) => {
        logError("[AddPlaceScreen] Error reverse geocoding:", error);
      });
  };

  const handleSubmit = async () => {
    if (!validateStep("basic") || !validateStep("location")) {
      Alert.alert(t("error"), "Lütfen tüm gerekli alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && edit) {
        await updatePlace(edit, {
          name: name.trim(),
          category: category!,
          description: description.trim(),
          address: address.trim(),
          coordinates: coordinates!,
          images,
          createdBy: user?.uid || "admin",
        });

        Alert.alert(t("ok"), t("add_place.success_updated"), [
          {
            text: t("ok"),
            onPress: () => {
              // Navigate after a small delay to ensure state updates are complete
              setTimeout(() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/index");
                }
              }, 100);
            },
          },
        ]);
      } else {
        const placeId = await addPlace({
          name: name.trim(),
          category: category!,
          description: description.trim(),
          address: address.trim(),
          coordinates: coordinates!,
          images,
          createdBy: user?.uid || "anonymous",
        });

        Alert.alert(t("ok"), t("add_place.success_added"), [
          {
            text: t("ok"),
            onPress: () => {
              // Reset form state before navigation
              setName("");
              setCategory(null);
              setDescription("");
              setAddress("");
              setImages([]);
              setCoordinates(null);
              setCurrentStep("basic");
              setErrors({});
              setAddressSearch("");
              
              // Navigate after a small delay to ensure state is reset
              setTimeout(() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace(`/(places)/${placeId}`);
                }
              }, 100);
            },
          },
        ]);
      }
    } catch (error) {
      logError("[AddPlaceScreen] Error saving place:", error);
      Alert.alert(t("error"), isEditing ? t("add_place.error_update_failed") : t("add_place.error_add_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStepStatus = (step: FormStep): "completed" | "current" | "pending" => {
    const stepIndex = steps.indexOf(step);
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "current";
    return "pending";
  };

  const isStepCompleted = (step: FormStep): boolean => {
    if (step === "basic") return !!(name.trim() && category);
    if (step === "details") return true; // Optional
    if (step === "location") return !!(address.trim() && coordinates);
    if (step === "images") return true; // Optional
    return false;
  };

  if (loadingPlace) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? "#6C63FF" : "#6C63FF"} />
          <Text className={`mt-4 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const stepLabels = {
    basic: "Temel",
    details: "Detaylar",
    location: "Konum",
    images: "Görseller",
    review: "Özet",
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => {
            // Reset form state before navigating back
            if (!isEditing) {
              setName("");
              setCategory(null);
              setDescription("");
              setAddress("");
              setImages([]);
              setCoordinates(null);
              setCurrentStep("basic");
              setErrors({});
              setAddressSearch("");
            }
            
            // Navigate after a small delay
            setTimeout(() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/index");
              }
            }, 50);
          }}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} />
          </Pressable>
          <Text className={`text-xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {isEditing ? t("add_place.edit_place") : t("add_place")}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Steps */}
        <View className="flex-row items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const completed = isStepCompleted(step);
            const canGoTo = canProceedToStep(step);

            return (
              <Pressable
                key={step}
                onPress={() => handleGoToStep(step)}
                className="flex-1 items-center"
                disabled={!canGoTo}
              >
                <View className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
                  status === "completed" || completed
                    ? "bg-green-500"
                    : status === "current"
                    ? "bg-primary"
                    : isDark
                    ? "bg-muted-dark"
                    : "bg-muted"
                }`}>
                  {status === "completed" || completed ? (
                    <Check size={16} color="#FFFFFF" weight="bold" />
                  ) : (
                    <Text className={`text-xs font-bold ${
                      status === "current" ? "text-white" : isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                    }`}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text className={`text-xs text-center ${
                  status === "current"
                    ? "text-primary font-semibold"
                    : isDark
                    ? "text-muted-foreground-dark"
                    : "text-muted-foreground"
                }`}>
                  {stepLabels[step]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1" 
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          {/* Step 1: Basic Info */}
          {currentStep === "basic" && (
            <Card className="mb-6">
              <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                1. Temel Bilgiler
              </Text>

              <View className="mb-4">
                <Input
                  label={`${t("name")} *`}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder={t("place_name_placeholder")}
                  error={errors.name}
                />
              </View>

              <View className="mb-4">
                <Text className={`text-sm font-semibold mb-3 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                  {t("category")} *
                </Text>
                <View className="gap-2">
                  {(Object.keys(categoryStructure) as ParentCategoryKey[]).map((parentKey) => {
                    const parent = categoryStructure[parentKey];
                    const isExpanded = expandedParent === parentKey;
                    
                    return (
                      <Card key={parentKey} variant="bordered" padding="none">
                        <Pressable
                          onPress={() => setExpandedParent(isExpanded ? null : parentKey)}
                          className="flex-row items-center justify-between p-4"
                        >
                          <Text className={`text-base font-semibold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                            {parent.label}
                          </Text>
                          {isExpanded ? (
                            <CaretUp size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                          ) : (
                            <CaretDown size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                          )}
                        </Pressable>
                        
                        {isExpanded && (
                          <View className="px-4 pb-4 pt-2">
                            <View className="flex-row flex-wrap gap-2">
                              {parent.sub.map((childLabel) => {
                                const childCategory = childCategoryToCategory[childLabel];
                                const isSelected = category === childCategory;
                                
                                return (
                                  <Pressable
                                    key={childLabel}
                                    onPress={() => {
                                      setCategory(childCategory);
                                      if (errors.category) setErrors({ ...errors, category: undefined });
                                    }}
                                    className={`rounded-xl px-4 py-2 border ${
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : isDark
                                        ? "bg-muted-dark border-border-dark"
                                        : "bg-muted border-border"
                                    }`}
                                  >
                                    <Text className={`text-sm font-medium ${
                                      isSelected
                                        ? "text-white"
                                        : isDark
                                        ? "text-foreground-dark"
                                        : "text-foreground"
                                    }`}>
                                      {childLabel}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </Card>
                    );
                  })}
                </View>
                {errors.category && (
                  <Text className="text-sm text-red-500 mt-2">{errors.category}</Text>
                )}
              </View>
            </Card>
          )}

          {/* Step 2: Details */}
          {currentStep === "details" && (
            <Card className="mb-6">
              <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                2. Detaylı Bilgiler
              </Text>

              <View className="mb-4">
                <Input
                  label={t("description")}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t("description_placeholder")}
                  multiline
                  numberOfLines={6}
                  inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
                  helperText="Mekanın özelliklerini, hizmetlerini ve öne çıkan yönlerini açıklayın"
                />
              </View>
            </Card>
          )}

          {/* Step 3: Location */}
          {currentStep === "location" && (
            <Card className="mb-6">
              <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                3. Konum Bilgileri
              </Text>

              {/* Address Search */}
              <View className="mb-4">
                <Input
                  label="Adres Ara"
                  value={addressSearch}
                  onChangeText={setAddressSearch}
                  placeholder="Adres veya mekan adı yazın..."
                  leftIcon={<MagnifyingGlass size={20} color={isDark ? "#94A3B8" : "#64748B"} />}
                  rightIcon={
                    <Pressable onPress={handleSearchAddress} disabled={isSearchingAddress}>
                      {isSearchingAddress ? (
                        <ActivityIndicator size="small" color={isDark ? "#94A3B8" : "#64748B"} />
                      ) : (
                        <Text className="text-primary font-semibold">Ara</Text>
                      )}
                    </Pressable>
                  }
                  onSubmitEditing={handleSearchAddress}
                />
              </View>

              <View className="mb-4">
                <Input
                  label={`${t("address")} *`}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    if (errors.address) setErrors({ ...errors, address: undefined });
                  }}
                  placeholder={t("address_placeholder")}
                  error={errors.address}
                  leftIcon={<MapPin size={20} color={isDark ? "#94A3B8" : "#64748B"} />}
                />
              </View>

              {/* Map */}
              <View className="mb-4">
                <Text className={`text-sm font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                  Haritada Konum Seç *
                </Text>
                {mapRegion ? (
                  <View className="rounded-xl overflow-hidden border" style={{ height: 300 }}>
                    <MapView
                      style={{ flex: 1 }}
                      initialRegion={mapRegion}
                      region={mapRegion}
                      onPress={handleMapPress}
                      userInterfaceStyle={isDark ? "dark" : "light"}
                    >
                      {coordinates && (
                        <Marker
                          coordinate={coordinates}
                          title={name || "Seçilen Konum"}
                          pinColor="#6C63FF"
                        />
                      )}
                    </MapView>
                  </View>
                ) : (
                  <View className={`rounded-xl p-8 items-center justify-center border ${isDark ? "bg-muted-dark border-border-dark" : "bg-muted border-border"}`} style={{ height: 300 }}>
                    <MapPin size={48} color={isDark ? "#94A3B8" : "#64748B"} />
                    <Text className={`text-sm mt-4 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                      Konum yükleniyor...
                    </Text>
                  </View>
                )}
                {coordinates && (
                  <View className="mt-2 flex-row items-center gap-2">
                    <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                      Koordinatlar: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
                {errors.coordinates && (
                  <Text className="text-sm text-red-500 mt-2">{errors.coordinates}</Text>
                )}
              </View>
            </Card>
          )}

          {/* Step 4: Images */}
          {currentStep === "images" && (
            <Card className="mb-6">
              <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                4. Görseller
              </Text>

              <View className="mb-4">
                <Button
                  variant="outline"
                  onPress={handlePickImage}
                  fullWidth
                >
                  <Camera size={20} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" style={{ marginRight: 8 }} />
                  {t("add_images")}
                </Button>
              </View>

              {images.length > 0 && (
                <View className="flex-row flex-wrap gap-3">
                  {images.map((image, index) => (
                    <View key={index} className="relative">
                      <Image source={{ uri: image }} className="w-32 h-32 rounded-xl" />
                      <Pressable
                        onPress={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                      >
                        <X size={14} color="#FFFFFF" weight="bold" />
                      </Pressable>
                      {index === 0 && (
                        <View className="absolute bottom-2 left-2 bg-primary px-2 py-1 rounded">
                          <Text className="text-white text-xs font-semibold">Ana</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {images.length === 0 && (
                <View className={`rounded-xl p-8 items-center justify-center border-2 border-dashed ${isDark ? "border-border-dark" : "border-border"}`}>
                  <Camera size={48} color={isDark ? "#94A3B8" : "#64748B"} />
                  <Text className={`text-sm mt-4 text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                    Henüz görsel eklenmedi
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === "review" && (
            <Card className="mb-6">
              <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                5. Özet ve Onay
              </Text>

              <View className="gap-4">
                <View className={`p-4 rounded-xl ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
                  <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                    MEKAN ADI
                  </Text>
                  <Text className={`text-lg font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                    {name || "Belirtilmemiş"}
                  </Text>
                </View>

                <View className={`p-4 rounded-xl ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
                  <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                    KATEGORİ
                  </Text>
                  <Text className={`text-lg font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                    {category ? Object.keys(childCategoryToCategory).find(
                      (key) => childCategoryToCategory[key] === category
                    ) : "Belirtilmemiş"}
                  </Text>
                </View>

                {description.trim() && (
                  <View className={`p-4 rounded-xl ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
                    <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                      AÇIKLAMA
                    </Text>
                    <Text className={`text-base ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                      {description}
                    </Text>
                  </View>
                )}

                <View className={`p-4 rounded-xl ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
                  <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                    ADRES
                  </Text>
                  <Text className={`text-base ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                    {address || "Belirtilmemiş"}
                  </Text>
                </View>

                {coordinates && (
                  <View className={`p-4 rounded-xl ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
                    <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                      KOORDİNATLAR
                    </Text>
                    <Text className={`text-sm ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                      {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}

                {images.length > 0 && (
                  <View className={`p-4 rounded-xl ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
                    <Text className={`text-xs font-semibold mb-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                      GÖRSELLER ({images.length})
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {images.map((image, index) => (
                        <Image key={index} source={{ uri: image }} className="w-20 h-20 rounded-lg mr-2" />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Navigation Buttons */}
          <View className="flex-row gap-3 mt-6">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onPress={handlePrevious}
                className="flex-1"
                fullWidth
              >
                Geri
              </Button>
            )}
            {currentStepIndex < steps.length - 1 ? (
              <Button
                variant="primary"
                onPress={handleNext}
                className="flex-1"
                fullWidth
              >
                İleri
              </Button>
            ) : (
              <Button
                variant="primary"
                onPress={handleSubmit}
                isLoading={submitting}
                className="flex-1"
                fullWidth
              >
                {isEditing ? t("add_place.update") : "Kaydet"}
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
