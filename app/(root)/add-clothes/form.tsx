import { ScanningOverlay } from "@/components/ui/ScanningOverlay";
import { useUserWardrobeStore } from "@/store/user-wardrobe-store";
import {
  IconArrowLeft,
  IconBookmark,
  IconPhoto,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CategoryId =
  | "top"
  | "dress"
  | "bottoms"
  | "ethnic"
  | "outerwear"
  | "footwear"
  | "accessory";

interface CategoryOpt {
  id: CategoryId;
  label: string;
}

const CATEGORIES: CategoryOpt[] = [
  { id: "top", label: "Top" },
  { id: "dress", label: "Dress" },
  { id: "bottoms", label: "Bottoms" },
  { id: "ethnic", label: "Ethnic" },
];

type Occasion = "Casual" | "Office" | "Party" | "Wedding" | "Date";
const OCCASIONS: Occasion[] = ["Casual", "Office", "Party", "Wedding", "Date"];

type Season = "All" | "Summer" | "Winter" | "Monsoon";
const SEASONS: Season[] = ["All", "Summer", "Winter", "Monsoon"];

type FormParams = {
  mode?: string;
  photoUri?: string;
  name?: string;
  category?: string;
  color?: string;
  isScanning?: string;
};

const ImageFan = () => {
  const images = [
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200",
    "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=200",
    "https://images.unsplash.com/photo-1434389678278-be43e4aa3205?w=200",
    "https://images.unsplash.com/photo-1550639525-c97d455acf70?w=200",
  ];

  return (
    <View
      style={{
        width: 180,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      {images.map((uri, index) => {
        const rotate = [-24, -12, 0, 12, 24][index];
        const translateX = [-60, -30, 0, 30, 60][index];
        const translateY = [10, 2, 0, 2, 10][index];
        const zIndex = [1, 2, 3, 2, 1][index];

        return (
          <View
            key={index}
            style={{
              position: "absolute",
              width: 55,
              height: 65,
              backgroundColor: "#fff",
              borderRadius: 8,
              borderWidth: 2,
              borderColor: "#fff",
              transform: [
                { translateX },
                { translateY },
                { rotate: `${rotate}deg` },
              ],
              zIndex,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <ExpoImage
              source={{ uri }}
              style={{ width: "100%", height: "100%", borderRadius: 6 }}
              contentFit="cover"
            />
          </View>
        );
      })}
    </View>
  );
};

export default function AddClothesFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as FormParams;

  const isScanned = params.mode === "scanned";
  const isManual = params.mode === "manual";

  const [name, setName] = useState<string>(params.name ?? "");
  const [category, setCategory] = useState<string>(params.category ?? "top");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState("");
  const [showScanOverlay, setShowScanOverlay] = useState(
    params.isScanning === "true",
  );

  // Bottom Sheet State
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [newCatText, setNewCatText] = useState("");
  const [extendedCategories, setExtendedCategories] = useState<string[]>([
    "Outerwear",
    "Footwear",
    "Accessory",
    "Casual",
    "Streetwear",
    "Y2k",
    "Preppy",
    "Scandinavian",
    "Oversized",
    "Glam",
    "Minimal",
  ]);
  const [color, setColor] = useState<string>(params.color ?? "");
  const [localPhotoUri, setLocalPhotoUri] = useState<string>(
    params.photoUri ?? "",
  );
  const [occasion, setOccasion] = useState<Occasion>("Casual");
  const [season, setSeason] = useState<Season>("All");
  const [notes, setNotes] = useState<string>("");

  const panY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (showMoreModal) {
      panY.setValue(400); // Start off-screen
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMoreModal]);

  const handleCloseModal = useCallback(() => {
    Animated.timing(panY, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowMoreModal(false);
      setDeleteMode(false);
      panY.setValue(400);
    });
  }, [panY]);

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: 400,
    duration: 200,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.4) {
          closeAnim.start(() => {
            setShowMoreModal(false);
            setDeleteMode(false);
            panY.setValue(400);
          });
        } else {
          resetPositionAnim.start();
        }
      },
    }),
  ).current;

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const addItem = useUserWardrobeStore((state) => state.addItem);

  const handleConfirm = useCallback(() => {
    addItem({
      name: name || "Untitled item",
      category,
      color: color || undefined,
      photoUri: localPhotoUri,
      occasion: occasion || undefined,
    });

    router.replace({
      pathname: "/(root)/add-clothes/success",
      params: {
        photoUri: localPhotoUri,
        name: name || "Untitled item",
        category,
      },
    } as never);
  }, [router, name, category, color, occasion, localPhotoUri, addItem]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <Pressable
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#ECEDF9]"
          >
            <IconArrowLeft size={18} color="#1D1A27" strokeWidth={2.5} />
          </Pressable>
          <Text className="text-[#1D1A27] text-xl font-semibold">
            {isScanned ? "Confirm details" : "Add manually"}
          </Text>
          <Pressable onPress={handleConfirm}>
            <IconBookmark size={24} color="#1D1A27" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo / placeholder */}
          <Pressable
            onPress={isManual ? handlePickPhoto : undefined}
            disabled={!isManual}
            className="rounded-3xl border border-dashed border-gray-200 overflow-hidden items-center justify-center mb-6 relative bg-[#F8F7FC]"
            style={{ height: 220 }}
          >
            {localPhotoUri ? (
              <ExpoImage
                source={{ uri: localPhotoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory"
              />
            ) : (
              <View className="items-center">
                <ImageFan />
              </View>
            )}

            {isScanned && (
              <View className="absolute top-3 right-3 flex-row items-center gap-1 bg-[#DCE754] px-3 py-1.5 rounded-full shadow-sm">
                <IconSparkles size={11} color="#1E1A27" strokeWidth={2.5} />
                <Text className="text-[#1E1A27] text-[10px] font-semibold">
                  AI Prefilled
                </Text>
              </View>
            )}

            {isManual && !localPhotoUri && (
              <View className="absolute bottom-6 flex-row items-center gap-1  px-4 py-2">
                {/* <IconPhoto size={12} color="#FFFFFF" /> */}
                <Text className="text-black/70 text-[11px] font-medium">
                  Tap to pick from gallery
                </Text>
              </View>
            )}

            {isManual && localPhotoUri && (
              <Pressable
                onPress={handlePickPhoto}
                className="absolute top-3 right-3 bg-white/95 border border-gray-100 rounded-full px-3 py-1.5 flex-row items-center gap-1 shadow-sm"
              >
                <IconPhoto size={11} color="#1D1A27" />
                <Text className="text-[#1D1A27] text-[10px] font-semibold">
                  Change
                </Text>
              </Pressable>
            )}
          </Pressable>

          {isScanned && (
            <Text className="text-[#6B7280] text-xs font-regular mb-6 leading-5">
              We&apos;ve prefilled what AI detected. Edit anything before saving
              to your wardrobe.
            </Text>
          )}

          {/* Item name */}
          <Text className="text-[#000000] text-[13px] tracking-wider font-semibold mb-2">
            Item name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Blue kurta"
            placeholderTextColor="#9CA3AF"
            className="bg-[#F8F7FC] border border-gray-100 rounded-2xl px-4 py-4 text-[#1D1A27] text-sm font-medium mb-5"
          />

          {/* Choose your best mood */}
          <Text className="text-[#000000] text-[15px] font-semibold mb-3 mt-4">
            Choose your best mood
          </Text>
          <View className="flex-row gap-2 mb-8">
            {[
              {
                label: "Occasion",
                value: occasion,
                onPress: () => setOccasion("Casual"),
              },
              {
                label: "Season",
                value: season,
                onPress: () => setSeason("Summer"),
              },
            ].map((chip) => (
              <Pressable
                key={chip.label}
                onPress={chip.onPress}
                className={`px-5 py-2.5 rounded-full ${chip.label === "Occasion" && occasion ? "bg-[#1D1A27]" : chip.label === "Season" && season !== "All" ? "bg-[#1D1A27]" : "bg-[#E5E5E5]"}`}
              >
                <Text
                  className={`text-[12px] font-medium ${chip.label === "Occasion" && occasion ? "text-white" : chip.label === "Season" && season !== "All" ? "text-white" : "text-[#000000]"}`}
                >
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Color Palette */}
          <Text className="text-[#000000] text-[15px] font-semibold mb-3">
            Color Palette
          </Text>
          <View className="flex-row gap-4 mb-8">
            {[
              { hex: "#996A6A", label: "#996A6A" },
              { hex: "#62ADBC", label: "#62ADBC" },
              { hex: "#974040", label: "#974040" },
            ].map((c) => (
              <Pressable
                key={c.hex}
                onPress={() => setColor(c.hex)}
                className="items-center"
              >
                <View
                  className={`w-12 h-12 rounded-full mb-2 border-2 ${color === c.hex ? "border-[#1D1A27]" : "border-transparent"}`}
                  style={{ backgroundColor: c.hex }}
                />
                <Text className="text-[10px] text-[#000000] font-medium">
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Notes */}
          <Text className="text-[#000000] text-[15px] font-semibold mb-2 mt-4">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Gifted by mom, hand wash only"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            className="bg-[#F8F7FC] border border-gray-100 rounded-2xl px-4 py-4 text-[#1D1A27] text-sm font-medium mb-2"
            style={{ textAlignVertical: "top", minHeight: 80 }}
          />
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
          <Pressable
            onPress={handleConfirm}
            className="bg-[#1D1A27] rounded-2xl py-5 items-center justify-center shadow-sm"
          >
            <Text className="text-white font-semibold text-base">
              {isScanned ? "Confirm & add to wardrobe" : "Add to wardrobe"}
            </Text>
          </Pressable>
        </View>

        {/* MORE CATEGORIES MODAL */}
        <Modal
          visible={showMoreModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseModal}
          statusBarTranslucent
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
            }}
            onPress={() => {
              if (deleteMode) setDeleteMode(false);
              else handleCloseModal();
            }}
          >
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                transform: [{ translateY: panY }],
              }}
            >
              <Pressable onPress={() => {}}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingTop: 12,
                    paddingBottom: 40,
                    paddingHorizontal: 20,
                    maxHeight: 600,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#E0E0E8",
                      alignSelf: "center",
                      marginBottom: 20,
                    }}
                  />

                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-bold text-[#111827]">
                      {deleteMode
                        ? "Delete Categories"
                        : "More Categories & Styles"}
                    </Text>
                    <Pressable onPress={handleCloseModal}>
                      <IconX size={24} color="#6B7280" />
                    </Pressable>
                  </View>

                  <ScrollView
                    contentContainerStyle={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {extendedCategories.map((c, i) => (
                      <Pressable
                        key={i}
                        onLongPress={() => setDeleteMode(true)}
                        onPress={() => {
                          if (deleteMode) {
                            setExtendedCategories((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                          } else {
                            setCategory(c);
                            handleCloseModal();
                          }
                        }}
                        className={`px-5 py-2.5 rounded-full border ${deleteMode ? "border-red-200 bg-red-50" : "border-gray-200 bg-[#F9FAFB]"} flex-row items-center`}
                      >
                        <Text
                          className={`text-base font-medium ${deleteMode ? "text-red-500" : "text-[#111827]"}`}
                        >
                          {c}
                        </Text>
                        {deleteMode && (
                          <View className="ml-2 bg-red-100 rounded-full p-1">
                            <IconX size={12} color="#EF4444" strokeWidth={3} />
                          </View>
                        )}
                      </Pressable>
                    ))}

                    {!deleteMode && (
                      <View className="flex-row items-center border border-dashed border-gray-300 rounded-full px-4 bg-gray-50 ml-1">
                        <TextInput
                          value={newCatText}
                          onChangeText={setNewCatText}
                          placeholder="+ Add new"
                          placeholderTextColor="#9CA3AF"
                          className="py-2.5 text-base text-[#111827] font-medium"
                          style={{ minWidth: 80 }}
                          onSubmitEditing={() => {
                            if (
                              newCatText.trim() &&
                              !extendedCategories.includes(newCatText.trim())
                            ) {
                              setExtendedCategories((prev) => [
                                ...prev,
                                newCatText.trim(),
                              ]);
                              setNewCatText("");
                            }
                          }}
                        />
                      </View>
                    )}
                  </ScrollView>
                  {deleteMode && (
                    <Text className="text-xs text-gray-400 mt-4 text-center">
                      Tap anywhere outside to exit delete mode
                    </Text>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        <ScanningOverlay
          visible={showScanOverlay}
          onComplete={() => setShowScanOverlay(false)}
        />
      </SafeAreaView>
    </View>
  );
}
