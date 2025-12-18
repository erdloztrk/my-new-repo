import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Globe, Check, CaretUp, CaretDown, Folder } from "phosphor-react-native";
import { FilterAccordion } from "@/components/filters/FilterAccordion";
import { useI18n } from "@/stores/i18n-store";
import { Category, ParentCategoryKey, categoryStructure, childCategoryToCategory } from "@/types/category";
import { CATEGORIES } from "@/utils/categories";
import { TablerIcon } from "@/components/icons/TablerIcon";
import { useCollectionsStore } from "@/stores/collections-store";
import { getCurrentUser } from "@/services/auth-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FilterPanelProps {
  isVisible: boolean;
  onClose: () => void;
  pendingRadius: number;
  setPendingRadius: (value: number) => void;
  pendingRadiusEnabled: boolean;
  setPendingRadiusEnabled: (value: boolean) => void;
  pendingCategories: Category[];
  setPendingCategories: (categories: Category[]) => void;
  pendingCollections: string[];
  setPendingCollections: (collectionIds: string[]) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  previewCount: number;
  isDark: boolean;
}

export function FilterPanel({
  isVisible,
  onClose,
  pendingRadius,
  setPendingRadius,
  pendingRadiusEnabled,
  setPendingRadiusEnabled,
  pendingCategories,
  setPendingCategories,
  pendingCollections,
  setPendingCollections,
  onApplyFilters,
  onResetFilters,
  previewCount,
  isDark,
}: FilterPanelProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [isRadiusExpanded, setIsRadiusExpanded] = useState(false);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [isCollectionExpanded, setIsCollectionExpanded] = useState(false);
  const [expandedFilterParent, setExpandedFilterParent] = useState<ParentCategoryKey | null>(null);
  const { collections, fetchCollections } = useCollectionsStore();

  // Fetch collections when panel opens
  useEffect(() => {
    if (isVisible) {
      const user = getCurrentUser();
      if (user) {
        fetchCollections(user.uid);
      }
    }
  }, [isVisible, fetchCollections]);

  if (!isVisible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + 80,
        left: 16,
        right: 16,
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
        maxHeight: Dimensions.get("window").height * 0.7,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: isDark ? "#ECEDEE" : "#11181C",
          }}
        >
          {t("map.filter.title")}
        </Text>
        <Pressable
          onPress={() => {
            onClose();
            setIsRadiusExpanded(false);
            setIsCategoryExpanded(false);
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <X size={18} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
        </Pressable>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Accordion: Radius Filter */}
        <FilterAccordion
          title={t("map.filter.radius")}
          summary={
            !pendingRadiusEnabled
              ? t("map.filter.radius_disabled")
              : pendingRadius === 5
              ? t("map.filter.radius_default")
              : t("map.filter.radius_km", { radius: pendingRadius })
          }
          isExpanded={isRadiusExpanded}
          onToggle={() => setIsRadiusExpanded(!isRadiusExpanded)}
          isDark={isDark}
        >
          {/* Toggle Switch */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#ECEDEE" : "#11181C",
              }}
            >
              {t("map.filter.radius_enable")}
            </Text>
            <Pressable
              onPress={() => setPendingRadiusEnabled(!pendingRadiusEnabled)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: pendingRadiusEnabled ? "#6C63FF" : (isDark ? "#475569" : "#CBD5E1"),
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#FFFFFF",
                  transform: [{ translateX: pendingRadiusEnabled ? 20 : 0 }],
                }}
              />
            </Pressable>
          </View>

          {/* Radius Display - Only show when enabled */}
          {pendingRadiusEnabled && (
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: "#6C63FF",
                  marginBottom: 4,
                }}
              >
                {t("map.filter.radius_km", { radius: pendingRadius })}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94A3B8" : "#64748B",
                }}
              >
                {t("map.filter.places_will_show", { count: previewCount })}
              </Text>
            </View>
          )}

          {/* Slider - Only show when enabled */}
          {pendingRadiusEnabled && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", minWidth: 35, fontWeight: "500" }}>
                {t("map.filter.radius_km", { radius: 1 })}
              </Text>
              <View style={{ flex: 1, height: 40, justifyContent: "center" }}>
                <Pressable
                  style={{
                    height: 40,
                    justifyContent: "center",
                  }}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const sliderWidth = SCREEN_WIDTH - 32 - 70 - 24; // screen width - padding - labels - gap
                    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
                    const newRadius = Math.round(1 + percentage * 19);
                    setPendingRadius(newRadius);
                  }}
                >
                  <View
                    style={{
                      height: 6,
                      backgroundColor: isDark ? "#2E303C" : "#E2E8F0",
                      borderRadius: 3,
                      position: "relative",
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        width: `${((pendingRadius - 1) / 19) * 100}%`,
                        height: 6,
                        backgroundColor: "#6C63FF",
                        borderRadius: 3,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        left: `${((pendingRadius - 1) / 19) * 100}%`,
                        width: 24,
                        height: 24,
                        backgroundColor: "#6C63FF",
                        borderRadius: 12,
                        marginLeft: -12,
                        marginTop: -9,
                        shadowColor: "#6C63FF",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 4,
                        elevation: 4,
                        borderWidth: 3,
                        borderColor: isDark ? "#1E293B" : "#FFFFFF",
                      }}
                    />
                  </View>
                </Pressable>
              </View>
              <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", minWidth: 35, fontWeight: "500" }}>
                {t("map.filter.radius_km", { radius: 20 })}
              </Text>
            </View>
          )}

          {/* Quick Select Buttons - Only show when enabled */}
          {pendingRadiusEnabled && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {[1, 3, 5, 10, 20].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setPendingRadius(r)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: pendingRadius === r ? "#6C63FF" : isDark ? "#2E303C" : "#F1F5F9",
                    alignItems: "center",
                    borderWidth: pendingRadius === r ? 0 : 1,
                    borderColor: isDark ? "#2E303C" : "#E2E8F0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: pendingRadius === r ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B",
                    }}
                  >
                    {t("map.filter.radius_km", { radius: r })}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </FilterAccordion>

        {/* Accordion: Category Filter */}
        <FilterAccordion
          title={t("map.filter.categories")}
          summary={
            pendingCategories.length === 0
              ? t("map.filter.all_places")
              : t("map.filter.categories_selected", { count: pendingCategories.length })
          }
          isExpanded={isCategoryExpanded}
          onToggle={() => setIsCategoryExpanded(!isCategoryExpanded)}
          isDark={isDark}
        >
          {/* Tüm Mekanlar Button */}
          <Pressable
            onPress={() => {
              setPendingCategories([]);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: pendingCategories.length === 0
                ? isDark ? "#6C63FF" : "#6C63FF"
                : isDark ? "#2E303C" : "#F1F5F9",
              borderWidth: pendingCategories.length === 0 ? 0 : 1,
              borderColor: isDark ? "#2E303C" : "#E2E8F0",
              marginBottom: 8,
            }}
          >
            <Globe size={18} color={pendingCategories.length === 0 ? "#FFFFFF" : (isDark ? "#94A3B8" : "#64748B")} weight="bold" />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: "600",
                color: pendingCategories.length === 0
                  ? "#FFFFFF"
                  : isDark ? "#94A3B8" : "#64748B",
              }}
            >
              {t("map.filter.all_places")}
            </Text>
            {pendingCategories.length === 0 && (
              <View
                style={{
                  marginLeft: 8,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#FFFFFF",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Check size={12} color="#6C63FF" weight="bold" />
              </View>
            )}
          </Pressable>
          
          <View style={{ gap: 8 }}>
            {(Object.keys(categoryStructure) as ParentCategoryKey[]).map((parentKey) => {
              const parent = categoryStructure[parentKey];
              const isExpanded = expandedFilterParent === parentKey;
              
              return (
                <View
                  key={parentKey}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#2E303C" : "#E2E8F0",
                    backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                  }}
                >
                  {/* Parent Category Header */}
                  <Pressable
                    onPress={() => setExpandedFilterParent(isExpanded ? null : parentKey)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TablerIcon
                        name={parent.icon}
                        size={18}
                        color={isDark ? "#94A3B8" : "#64748B"}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: isDark ? "#94A3B8" : "#64748B",
                        }}
                      >
                        {parent.label}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <CaretUp size={18} color={isDark ? "#94A3B8" : "#64748B"} />
                    ) : (
                      <CaretDown size={18} color={isDark ? "#94A3B8" : "#64748B"} />
                    )}
                  </Pressable>
                  
                  {/* Child Categories */}
                  {isExpanded && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {parent.sub.map((childLabel) => {
                          const childCategory = childCategoryToCategory[childLabel];
                          const catItem = CATEGORIES.find((c) => c.category === childCategory);
                          if (!catItem) return null;
                          
                          const isSelected = pendingCategories.length > 0 && pendingCategories.includes(childCategory);
                          
                          return (
                            <Pressable
                              key={childLabel}
                              onPress={() => {
                                if (pendingCategories.includes(childCategory)) {
                                  const newCategories = pendingCategories.filter((c) => c !== childCategory);
                                  setPendingCategories(newCategories);
                                } else {
                                  setPendingCategories([...pendingCategories, childCategory]);
                                }
                              }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 24,
                                backgroundColor: isSelected
                                  ? `${catItem.color}20`
                                  : isDark
                                  ? "#1E293B"
                                  : "#FFFFFF",
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected
                                  ? catItem.color
                                  : isDark
                                  ? "#334155"
                                  : "#E2E8F0",
                                minHeight: 44,
                              }}
                            >
                              {isSelected && (
                                <View
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 9,
                                    backgroundColor: catItem.color,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginRight: 6,
                                  }}
                                >
                                  <Check size={12} color="#FFFFFF" weight="bold" />
                                </View>
                              )}
                              <TablerIcon
                                name={catItem.iconName}
                                size={18}
                                color={isSelected ? catItem.color : isDark ? "#94A3B8" : "#64748B"}
                              />
                              <Text
                                style={{
                                  marginLeft: 8,
                                  fontSize: 13,
                                  fontWeight: "600",
                                  color: isSelected
                                    ? catItem.color
                                    : isDark
                                    ? "#94A3B8"
                                    : "#64748B",
                                }}
                              >
                                {childLabel}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          {pendingCategories.length > 0 && (
            <Pressable
              onPress={() => setPendingCategories([])}
              style={{
                marginTop: 16,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#2E303C" : "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#6C63FF",
                }}
              >
                {t("map.filter.clear_all")}
              </Text>
            </Pressable>
          )}
        </FilterAccordion>

        {/* Accordion: Collection Filter */}
        {collections.length > 0 && (
          <FilterAccordion
            title={t("map.filter.collections") || "Koleksiyonlar"}
            summary={
              pendingCollections.length === 0
                ? t("map.filter.all_collections") || "Tüm koleksiyonlar"
                : t("map.filter.collections_selected", { count: pendingCollections.length }) || `${pendingCollections.length} koleksiyon seçildi`
            }
            isExpanded={isCollectionExpanded}
            onToggle={() => setIsCollectionExpanded(!isCollectionExpanded)}
            isDark={isDark}
          >
            {/* Tüm Koleksiyonlar Button */}
            <Pressable
              onPress={() => {
                setPendingCollections([]);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: pendingCollections.length === 0
                  ? isDark ? "#6C63FF" : "#6C63FF"
                  : isDark ? "#2E303C" : "#F1F5F9",
                borderWidth: pendingCollections.length === 0 ? 0 : 1,
                borderColor: isDark ? "#2E303C" : "#E2E8F0",
                marginBottom: 8,
              }}
            >
              <Folder size={18} color={pendingCollections.length === 0 ? "#FFFFFF" : (isDark ? "#94A3B8" : "#64748B")} weight="bold" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: "600",
                  color: pendingCollections.length === 0
                    ? "#FFFFFF"
                    : isDark ? "#94A3B8" : "#64748B",
                }}
              >
                {t("map.filter.all_collections") || "Tüm koleksiyonlar"}
              </Text>
              {pendingCollections.length === 0 && (
                <View
                  style={{
                    marginLeft: 8,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#FFFFFF",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Check size={12} color="#6C63FF" weight="bold" />
                </View>
              )}
            </Pressable>

            {/* Collection List */}
            <View style={{ gap: 8 }}>
              {collections.map((collection) => {
                const isSelected = pendingCollections.includes(collection.id);
                
                return (
                  <Pressable
                    key={collection.id}
                    onPress={() => {
                      if (pendingCollections.includes(collection.id)) {
                        setPendingCollections(pendingCollections.filter(id => id !== collection.id));
                      } else {
                        setPendingCollections([...pendingCollections, collection.id]);
                      }
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? isDark ? "#6C63FF20" : "#6C63FF20"
                        : isDark
                        ? "#2E303C"
                        : "#F1F5F9",
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected
                        ? "#6C63FF"
                        : isDark
                        ? "#334155"
                        : "#E2E8F0",
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: "#6C63FF",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 8,
                        }}
                      >
                        <Check size={12} color="#FFFFFF" weight="bold" />
                      </View>
                    )}
                    {collection.emoji && (
                      <Text style={{ fontSize: 18, marginRight: 8 }}>
                        {collection.emoji}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isSelected
                          ? "#6C63FF"
                          : isDark
                          ? "#ECEDEE"
                          : "#11181C",
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {collection.name}
                    </Text>
                    {collection.placeIds && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? "#94A3B8" : "#64748B",
                          marginLeft: 8,
                        }}
                      >
                        {collection.placeIds.length}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {pendingCollections.length > 0 && (
              <Pressable
                onPress={() => setPendingCollections([])}
                style={{
                  marginTop: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "#2E303C" : "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#6C63FF",
                  }}
                >
                  {t("map.filter.clear_all") || "Tümünü Temizle"}
                </Text>
              </Pressable>
            )}
          </FilterAccordion>
        )}
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          padding: 20,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? "#2E303C" : "#E2E8F0",
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        }}
      >
        <Pressable
          onPress={onResetFilters}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#2E303C" : "#E2E8F0",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#94A3B8" : "#64748B",
            }}
          >
            Temizle
          </Text>
        </Pressable>
        <Pressable
          onPress={onApplyFilters}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: "#6C63FF",
            alignItems: "center",
            shadowColor: "#6C63FF",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            {t("map.filter.apply")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

