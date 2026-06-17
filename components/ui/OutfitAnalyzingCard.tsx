import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import Svg, { Circle, G } from "react-native-svg";

import { Audio } from "expo-av";
import {
  LastOutfit,
  useOutfitAnalysisStore,
} from "@/backend/store/outfit-analysis-store";
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
      <View className="flex-row rounded-[24px] border border-[#E9EBF8] bg-[#F5F4F980] overflow-hidden h-40">
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
                  className="rounded-[6px] px-3 py-[3px]"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E9EBF8",
                    backgroundColor: "#000000",
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
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={() => onViewDetails(outfitIndex)}
              style={{
                flex: 1,
                backgroundColor: "#1D1A27",
                borderRadius: 14,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontFamily: "TikTokSans16pt-Bold",
                }}
              >
                View Details
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

// ─── Main unified card ───────────────────────────────────────────────────────

export const OutfitAnalyzingCard = React.memo(function OutfitAnalyzingCard() {
  const router = useRouter();
  const { isAnalyzing, isDone, imageUri, progress, lastOutfits, removeOutfit } =
    useOutfitAnalysisStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<CardSlide>>(null);
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

  // Build combined slide list: analyzing slide first, then completed outfits
  const slides = useMemo<CardSlide[]>(() => {
    const list: CardSlide[] = [];
    if (isAnalyzing && imageUri) {
      list.push({ type: "analyzing" as const, imageUri, progress });
    }
    lastOutfits.forEach((outfit, i) => {
      list.push({ type: "completed" as const, outfit, outfitIndex: i });
    });
    return list;
  }, [lastOutfits, isAnalyzing, imageUri, progress]);

  // Clamp activeIndex when slides shrink
  useEffect(() => {
    if (slides.length > 0) {
      setActiveIndex((prev) => Math.min(prev, slides.length - 1));
    }
  }, [slides.length]);

  // Auto-scroll to analyzing slide (index 0) when analysis starts
  useEffect(() => {
    if (isAnalyzing && slides.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 200);
    }
  }, [isAnalyzing, slides.length]);

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

  const keyExtractor = useCallback((_: CardSlide, i: number) => String(i), []);

  const handleViewDetails = useCallback(
    (index: number) => {
      router.push(`/(root)/outfit-log-detail?index=${index}` as never);
    },
    [router],
  );

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

  if (slides.length === 0) return null;

  const safeIndex = Math.min(activeIndex, slides.length - 1);

  return (
    <View className="mt-3 mb-1">
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
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
