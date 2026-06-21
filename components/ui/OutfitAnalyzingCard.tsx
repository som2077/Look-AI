import { Image as ExpoImage } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import {
  LastOutfit,
  useOutfitAnalysisStore,
} from "@/backend/store/outfit-analysis-store";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";

const SVG_SIZE = 72;
const STROKE_WIDTH = 4.5;
const RADIUS = (SVG_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SVG_SIZE / 2;

const CARD_H_MARGIN = 20;
const CARD_WIDTH = Dimensions.get("window").width - CARD_H_MARGIN * 2;

const CHIME_SOUND = require("@/assets/sounds/analysis-complete.wav");

// ─── Slide type: either a completed outfit or the in-progress analysis ───────

interface AnalyzingSlide {
  type: "analyzing";
  imageUri: string;
  progress: number;
}

interface CompletedSlide {
  type: "completed";
  outfit: LastOutfit;
  outfitIndex: number;
}

type CardSlide = AnalyzingSlide | CompletedSlide;

// ─── Sub-component: single completed outfit slide ────────────────────────────

const CompletedCardSlide = React.memo(function CompletedCardSlide({
  outfit,
  outfitIndex,
  onRemove,
  onViewDetails,
}: {
  outfit: LastOutfit;
  outfitIndex: number;
  onRemove: (i: number) => void;
  onViewDetails: (i: number) => void;
}) {
  return (
    <Pressable
      style={{ width: CARD_WIDTH }}
      onPress={() => onViewDetails(outfitIndex)}
    >
      <View className="flex-row rounded-[23px] border border-[#E9EBF8] bg-[#ffffff] overflow-hidden h-40">
        <View
          className="justify-center items-center"
          style={{ width: 120, height: 160, backgroundColor: "#FFFFFF" }}
        >
          <ExpoImage
            source={{ uri: outfit.imageUri }}
            style={{ width: 120, height: 160 }}
            contentFit="contain"
            cachePolicy="memory"
          />
        </View>

        <View className="flex-1 justify-between">
          <View className="px-2 pt-3 pb-1 ml-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text
                className="text-[#1D1A27] font-bold flex-1 mr-2"
                style={{ fontSize: 17, fontFamily: "TikTokSans16pt-Bold" }}
                numberOfLines={1}
              >
                {outfit.name}
              </Text>
              <Text
                style={{
                  color: "#9B9BAF",
                  fontSize: 11,
                  marginTop: 2,
                  marginRight: 12,
                  fontFamily: "TikTokSans16pt-Medium",
                }}
              >
                {outfit.time}
              </Text>
            </View>
            <Text
              style={{
                color: "#9B9BAF",
                fontSize: 12,
                marginBottom: 8,
                marginTop: 2,
                fontFamily: "TikTokSans16pt-Regular",
              }}
            >
              {outfit.subtitle}
            </Text>
            <View className="flex-row flex-wrap gap-[6px]">
              {outfit.tags.slice(0, 2).map((tag) => (
                <View
                  key={tag}
                  className="rounded-[6px] px-5 py-[5px]"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E9EBF8",
                    backgroundColor: "#000000",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 11,
                      fontFamily: "TikTokSans16pt-Medium",
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* View Details button */}
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              marginHorizontal: 10,
              marginBottom: 10,
              marginTop: -4,
            }}
          >
            <Pressable
              onPress={() => onViewDetails(outfitIndex)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontSize: 13,
                  fontFamily: "TikTokSans16pt-Bold",
                }}
              >
                Analysis complete and ready to view.
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

// ─── Sub-component: single analyzing slide ───────────────────────────────────

const AnalyzingCardSlide = React.memo(function AnalyzingCardSlide({
  imageUri,
  progress,
  strokeDashoffset,
}: {
  imageUri: string;
  progress: number;
  strokeDashoffset: number;
}) {
  return (
    <View style={{ width: CARD_WIDTH }}>
      <View
        className="flex-row rounded-[24px] border border-[#E9EBF8] bg-[##F5F4F9] overflow-hidden h-40"
        style={{
          shadowColor: "#000000",
          shadowOpacity: 0.09,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1,
        }}
      >
        <View style={{ width: 120, height: 160 }} className="overflow-hidden">
          <ExpoImage
            source={{ uri: imageUri }}
            style={{ width: 120, height: 160 }}
            contentFit="contain"
            blurRadius={5}
            cachePolicy="memory"
          />
          <View
            className="absolute inset-0 items-center justify-center mb-5"
            style={{ backgroundColor: "rgba(0,0,0,0.38)" }}
          >
            <Svg width={SVG_SIZE} height={SVG_SIZE}>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="#ffffff"
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
            <Text
              className="absolute text-white font-bold"
              style={{ fontSize: 13 }}
            >
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        <View className="flex-1 justify-center px-3 ml-1">
          <Text
            className="text-[#1D1A27] font-bold mb-2"
            style={{ fontSize: 16 }}
          >
            Analyzing cloth...
          </Text>
          <View className="h-[9px] rounded-full bg-[#ffffff] w-4/5 mb-[7px]" />
          <View className="h-[9px] rounded-full bg-[#ffffff] w-3/5 mb-[7px]" />
          <View className="h-[9px] rounded-full bg-[#ffffff] w-2/5 mb-[10px]" />
          <Text className="text-[#000000] font-sans" style={{ fontSize: 11 }}>
            {"We'll notify you when done!"}
          </Text>
        </View>
      </View>
    </View>
  );
});

const MODE_LABELS: Record<string, string> = {
  "scan-cloth": "Scan Cloths",
  barcode: "Barcode",
  "cloth-label": "Cloth Label",
  "fit-check": "Fit Check",
};

const ModeGroupCarousel = React.memo(function ModeGroupCarousel({
  mode,
  slides,
  strokeDashoffset,
  removeOutfit,
  handleViewDetails,
}: {
  mode: string;
  slides: CardSlide[];
  strokeDashoffset: number;
  removeOutfit: (index: number) => void;
  handleViewDetails: (index: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<CardSlide>>(null);

  // Auto-scroll to analyzing slide (index 0) if one is active
  useEffect(() => {
    const hasAnalyzing = slides.some((s) => s.type === "analyzing");
    if (hasAnalyzing && slides.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 200);
    }
  }, [slides.length, slides]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const keyExtractor = useCallback((item: CardSlide, i: number) => {
    if (item.type === "analyzing") return `analyzing-${item.imageUri}`;
    return `completed-${item.outfitIndex}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CardSlide }) => {
      if (item.type === "analyzing") {
        return (
          <AnalyzingCardSlide
            imageUri={item.imageUri}
            progress={item.progress}
            strokeDashoffset={strokeDashoffset}
          />
        );
      }
      return (
        <CompletedCardSlide
          outfit={item.outfit}
          outfitIndex={item.outfitIndex}
          onRemove={removeOutfit}
          onViewDetails={handleViewDetails}
        />
      );
    },
    [strokeDashoffset, removeOutfit, handleViewDetails],
  );

  const safeIndex = Math.min(activeIndex, slides.length - 1);

  return (
    <View className="mb-6">
      <Text
        className="text-[#1D1A27] font-bold text-lg mb-1 ml-5 px-5"
        style={{ fontFamily: "TikTokSans16pt-Bold" }}
      >
        {MODE_LABELS[mode] || "Scanned Items"}
      </Text>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
        snapToInterval={CARD_WIDTH + 10}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flexGrow: 0, marginHorizontal: CARD_H_MARGIN }}
      />

      {slides.length > 1 && (
        <View className="flex-row justify-center items-center mt-2 gap-[5px]">
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === safeIndex ? 8 : 6,
                height: i === safeIndex ? 8 : 6,
                borderRadius: 5,
                backgroundColor: i === safeIndex ? "#1C1C1E" : "#C7C7C7",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
});

export const OutfitAnalyzingCard = React.memo(function OutfitAnalyzingCard() {
  const router = useRouter();
  const {
    isAnalyzing,
    isDone,
    imageUri,
    progress,
    currentMode,
    lastOutfits,
    removeOutfit,
  } = useOutfitAnalysisStore();

  const prevIsDoneRef = useRef(false);

  // Play chime when analysis finishes
  useEffect(() => {
    if (isDone && !prevIsDoneRef.current) {
      (async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(CHIME_SOUND);
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if ("didJustFinish" in status && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (e) {
          console.warn("Chime playback failed", e);
        }
      })();
    }
    prevIsDoneRef.current = isDone;
  }, [isDone]);

  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - Math.min(progress, 100) / 100),
    [progress],
  );

  const handleViewDetails = useCallback(
    (index: number) => {
      router.push(`/(root)/outfit-log-detail?index=${index}` as never);
    },
    [router],
  );

  const groupedSlides = useMemo(() => {
    const groups: Record<string, CardSlide[]> = {};

    // Add completed outfits to their respective mode groups
    lastOutfits.forEach((outfit, i) => {
      const mode = outfit.mode || "scan-cloth";
      if (!groups[mode]) groups[mode] = [];
      groups[mode].push({ type: "completed" as const, outfit, outfitIndex: i });
    });

    // Add analyzing outfit to its mode group at the TOP
    if (isAnalyzing && imageUri) {
      const mode = currentMode || "scan-cloth";
      if (!groups[mode]) groups[mode] = [];
      groups[mode].unshift({ type: "analyzing" as const, imageUri, progress });
    }

    return groups;
  }, [lastOutfits, isAnalyzing, imageUri, progress, currentMode]);

  if (Object.keys(groupedSlides).length === 0) return null;

  return (
    <View className="mt-3 mb-1">
      {Object.entries(groupedSlides).map(([mode, slides]) => (
        <ModeGroupCarousel
          key={mode}
          mode={mode}
          slides={slides}
          strokeDashoffset={strokeDashoffset}
          removeOutfit={removeOutfit}
          handleViewDetails={handleViewDetails}
        />
      ))}
    </View>
  );
});
