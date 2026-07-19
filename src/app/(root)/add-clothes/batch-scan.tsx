import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconShirt,
  IconSquare,
  IconSquareCheck,
} from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { uploadToCloudinaryWithBgRemoval } from "@/features/scanning/api/cloudinary-upload";
import {
  FullClothingAnalysis,
  analyzeClothingFull,
} from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { usePremiumLimits } from "@/shared/hooks/usePremiumLimits";

type ViewMode = "detail" | "simple";

type BatchItemStatus = "loading" | "success" | "error";

interface BatchItem {
  id: string;
  originalUri: string;
  status: BatchItemStatus;
  data: FullClothingAnalysis | null;
  cloudinaryUrl: string | null;
  error?: string;
  // local edits
  customName: string;
  brand: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BatchScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uris?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const hasStarted = useRef(false);

  const { canAddWardrobe, handleLimitReached, wardrobeCount, isPro } =
    usePremiumLimits();
  const addItem = useUserWardrobeStore((s) => s.addItem);
  const addScan = useScanHistoryStore((s) => s.addScan);

  const processBatchItem = async (item: BatchItem) => {
    try {
      // 1. BG Removal
      let finalUri = item.originalUri;
      let cloudUrl = null;
      try {
        const uploadRes = await uploadToCloudinaryWithBgRemoval(
          item.originalUri,
        );
        finalUri = uploadRes.imageUrl;
        cloudUrl = uploadRes.imageUrl;
      } catch (bgError) {
        console.warn("BG removal failed for batch item:", bgError);
      }

      // 2. Gemini Analysis
      const aiData = await analyzeClothingFull(finalUri);
      if (
        !aiData ||
        aiData.category === "Full Body" ||
        aiData.category === "Not Clothing"
      ) {
        throw new Error("Invalid clothing image");
      }

      setItems((prev) =>
        prev.map((p) => {
          if (p.id === item.id) {
            return {
              ...p,
              status: "success",
              data: aiData,
              cloudinaryUrl: cloudUrl || p.originalUri,
              customName: `${aiData.primaryColor} ${aiData.subCategory}`,
            };
          }
          return p;
        }),
      );

      addScan({
        type: "cloth",
        thumbnail: cloudUrl || item.originalUri,
        date: new Date().toISOString(),
        result: aiData as unknown as Record<string, unknown>,
        isFavorite: false,
      });
    } catch (error) {
      console.error("Failed to process batch item", item.id, error);
      setItems((prev) =>
        prev.map((p) => {
          if (p.id === item.id) {
            return { ...p, status: "error", error: "Failed to analyze" };
          }
          return p;
        }),
      );
    }
  };

  useEffect(() => {
    if (hasStarted.current || !params.uris) return;
    hasStarted.current = true;

    try {
      const urisArray = JSON.parse(params.uris) as string[];

      const initialItems: BatchItem[] = urisArray.map((uri, index) => ({
        id: `item-${Date.now()}-${index}`,
        originalUri: uri,
        status: "loading",
        data: null,
        cloudinaryUrl: null,
        customName: "",
        brand: "",
      }));
      setItems(initialItems);
      // pre-select all items initially
      setSelectedIds(initialItems.map((i) => i.id));

      // Process items concurrently but safely
      initialItems.forEach(processBatchItem);
    } catch (e) {
      console.error("Invalid URIs array", e);
      router.back();
    }
  }, [params.uris]);

  const allInitialLoading =
    items.every((i) => i.status === "loading") && items.length > 0;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleDelete = () => {
    const newItems = items.filter((i) => !selectedIds.includes(i.id));
    if (newItems.length === 0) {
      router.back();
      return;
    }
    setItems(newItems);
    setSelectedIds([]);
    if (currentIndex >= newItems.length) {
      setCurrentIndex(Math.max(0, newItems.length - 1));
    }
  };

  const handleAddMore = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      orderedSelection: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newItems: BatchItem[] = result.assets.map((asset, index) => ({
        id: `item-${Date.now()}-${index}`,
        originalUri: asset.uri,
        status: "loading",
        data: null,
        cloudinaryUrl: null,
        customName: "",
        brand: "",
      }));

      setItems((prev) => [...prev, ...newItems]);
      setSelectedIds((prev) => [...prev, ...newItems.map((i) => i.id)]);

      newItems.forEach(processBatchItem);
    }
  };

  const handleSaveToCloset = async () => {
    if (selectedIds.length === 0) {
      Alert.alert(
        "No items selected",
        "Please select at least one item to add.",
      );
      return;
    }

    const itemsToSave = items.filter(
      (i) => selectedIds.includes(i.id) && i.status === "success" && i.data,
    );

    if (itemsToSave.length === 0) {
      Alert.alert(
        "Hold on",
        "Please wait for analysis to finish for selected items.",
      );
      return;
    }

    if (!isPro && wardrobeCount + itemsToSave.length > 50) {
      handleLimitReached("wardrobe");
      return;
    }

    setSaving(true);
    try {
      for (const item of itemsToSave) {
        const aiData = item.data!;
        addItem({
          customName: item.customName,
          brand: item.brand,
          category: aiData.category,
          subCategory: aiData.subCategory,
          primaryColor: aiData.primaryColor,
          secondaryColors: aiData.secondaryColors,
          pattern: aiData.pattern,
          fabricGuess: aiData.fabricGuess,
          fit: aiData.fit,
          sleeveType: aiData.sleeveType,
          neckType: aiData.neckType,
          season: aiData.season,
          occasion: aiData.occasion,
          formalityScore: aiData.formalityScore,
          versatilityTags: aiData.versatilityTags,
          careInstructions: aiData.careInstructions,
          notes: aiData.notes,
          colorHex: aiData.colorHex,
          imageUrl: item.cloudinaryUrl || item.originalUri,
          originalImageUrl: item.originalUri,
          confidence: aiData.confidence,
          source: "camera",
          isFavorite: false,
          wearCount: 0,
        });
      }
      Alert.alert(
        "Success",
        `${itemsToSave.length} items added to your closet!`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/(root)/(tabs)" as never),
          },
        ],
      );
    } catch (e) {
      console.error("Save failed", e);
      Alert.alert("Error", "Failed to save items.");
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.iconBtn}>
        <IconArrowLeft size={24} color="#111827" />
      </Pressable>

      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() =>
            setViewMode((prev) => (prev === "detail" ? "simple" : "detail"))
          }
          style={styles.toggleBtn}
        >
          <IconEdit size={16} color="#111827" />
          <Text style={styles.toggleText}>
            {viewMode === "detail" ? "Detail view" : "Simple view"}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={handleAddMore} style={styles.iconBtn}>
        <IconPlus size={24} color="#111827" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      {renderHeader()}
      {viewMode === "detail" ? (
        <DetailView
          items={items}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onDelete={handleDelete}
        />
      ) : (
        <SimpleView
          items={items}
          currentIndex={currentIndex}
          onNext={() => {
            if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              handleSaveToCloset();
            }
          }}
          isLast={currentIndex === items.length - 1}
          onUpdateItem={(id: string, updates: Partial<BatchItem>) => {
            setItems((prev) =>
              prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            );
          }}
        />
      )}

      {viewMode === "detail" && (
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.saveBtn,
              selectedIds.length === 0 && { opacity: 0.5 },
            ]}
            onPress={handleSaveToCloset}
            disabled={saving || selectedIds.length === 0}
          >
            {saving ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.saveBtnText}>Add to Closet</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailView({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDelete,
}: any) {
  const allSelected = selectedIds.length === items.length && items.length > 0;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionRow}>
        <Pressable onPress={onSelectAll} style={styles.selectAllBtn}>
          {allSelected ? (
            <IconSquareCheck size={24} color="#7C6AFF" />
          ) : (
            <IconSquare size={24} color="#D1D5DB" />
          )}
          <Text style={styles.selectAllText}>Select all</Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {items.map((item: BatchItem) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <View key={item.id} style={styles.itemRow}>
              <Pressable
                onPress={() => onToggleSelect(item.id)}
                style={styles.checkbox}
              >
                {isSelected ? (
                  <IconSquareCheck size={24} color="#7C6AFF" />
                ) : (
                  <IconSquare size={24} color="#D1D5DB" />
                )}
              </Pressable>

              {item.status === "loading" ? (
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonImage} />
                  <View style={styles.skeletonDetails}>
                    <View style={styles.skeletonLine1} />
                    <View style={styles.skeletonLine2} />
                  </View>
                </View>
              ) : item.status === "error" ? (
                <View style={styles.errorRow}>
                  <Text style={{ color: "#F44336" }}>Analysis failed</Text>
                </View>
              ) : (
                <View style={styles.successRow}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.cloudinaryUrl || item.originalUri }}
                      style={styles.itemImage}
                    />
                    <View style={styles.badgeIcon}>
                      <IconEdit size={12} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.itemDetails}>
                    <View style={styles.categoryBadge}>
                      <IconShirt size={12} color="#111827" />
                      <Text style={styles.categoryText}>
                        {item.data?.category}
                      </Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.customName}</Text>
                    <Text style={styles.itemSeason}>
                      {item.data?.season?.join(", ")}
                    </Text>
                  </View>
                  <IconChevronRight size={20} color="#9CA3AF" />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SimpleView({
  items,
  currentIndex,
  onNext,
  isLast,
  onUpdateItem,
}: any) {
  const item = items[currentIndex];

  if (!item) return <View style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.carouselHeader}>
        <View style={styles.carouselPill}>
          <Text style={styles.carouselText}>
            {currentIndex + 1}/{items.length}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <View style={styles.carouselImageContainer}>
          <Image
            source={{ uri: item.cloudinaryUrl || item.originalUri }}
            style={styles.carouselImage}
          />
          <Pressable style={styles.carouselEditBtn}>
            <IconEdit size={16} color="#111827" />
            <Text style={styles.carouselBtnText}>Edit</Text>
          </Pressable>
        </View>

        {item.status === "loading" ? (
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#7C6AFF" />
            <Text style={{ color: "#6B7280", marginTop: 16 }}>
              Analyzing...
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.formValueContainer}>
                <Text style={styles.formValue}>
                  {item.data?.category}
                  {" > "}
                  {item.data?.subCategory}
                </Text>
                <IconChevronDown size={16} color="#9CA3AF" />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.formValueContainer}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: item.data?.colorHex || "#FFFFFF" },
                  ]}
                />
                <IconChevronDown size={16} color="#9CA3AF" />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Season</Text>
              <View style={styles.formValueContainer}>
                <Text style={styles.formValue}>
                  {item.data?.season?.join(", ")}
                </Text>
                <IconChevronDown size={16} color="#9CA3AF" />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Brand</Text>
              <View style={styles.formValueContainer}>
                <Text
                  style={[
                    styles.formValue,
                    !item.brand && { color: "#9CA3AF" },
                  ]}
                >
                  {item.brand || "Choose the brand"}
                </Text>
                <IconChevronDown size={16} color="#9CA3AF" />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.saveBtn,
            item.status === "loading" && { opacity: 0.5 },
          ]}
          onPress={onNext}
          disabled={item.status === "loading"}
        >
          <Text style={styles.saveBtnText}>
            {isLast ? "Add to Closet" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    padding: 8,
  },
  toggleContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 6,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  toggleText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 16,
  },
  checkbox: {
    padding: 4,
  },
  skeletonRow: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  skeletonImage: {
    width: 60,
    height: 80,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  skeletonDetails: {
    flex: 1,
    gap: 8,
  },
  skeletonLine1: {
    height: 16,
    width: "80%",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  skeletonLine2: {
    height: 16,
    width: "50%",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  errorRow: {
    flex: 1,
    justifyContent: "center",
  },
  successRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  imageContainer: {
    position: "relative",
  },
  itemImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  badgeIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#7C6AFF",
    padding: 4,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  categoryText: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "600",
  },
  itemTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  itemSeason: {
    color: "#6B7280",
    fontSize: 12,
  },
  carouselHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  carouselPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
  },
  carouselImageContainer: {
    alignItems: "center",
    position: "relative",
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    height: 360,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  carouselEditBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  carouselBtnText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "500",
  },
  formContainer: {
    gap: 24,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formLabel: {
    color: "#6B7280",
    fontSize: 14,
  },
  formValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
