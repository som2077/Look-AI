import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";
import { HomeHeader } from "../../../components/ui/HomeHeader";
import { WeeklyCalendarStrip } from "../../../components/ui/WeeklyCalendarStrip";
import type { RingProgressSegment } from "../../../components/ui/WardrobeRingSummaryCard";
import { WardrobeRingSummaryCard } from "../../../components/ui/WardrobeRingSummaryCard";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { useWardrobeSummary } from "@/backend/hooks/useWardrobeSummary";
import { OutfitAnalyzingCard } from "../../../components/ui/OutfitAnalyzingCard";
import {
  RecentlyUploadedHeading,
  NotifyBanner,
  EmptyStyleBanner,
} from "../../../components/ui/RecentlyUploadedCard";
import { TrendFeed } from "../../../components/ui/TrendFeed";
import { WardrobeHighlights } from "../../../components/ui/WardrobeHighlights";
import { WeatherOutfitCard } from "../../../components/ui/WeatherOutfitCard";
import { LookAIBanner } from "../../../components/ui/LookAIBanner";
import { WardrobeFilterTabs } from "../../../components/ui/WardrobeFilterTabs";
import { WardrobeMessageBar } from "../../../components/ui/WardrobeMessageBar";
import { CURRENT_STREAK_DAYS } from "@/constants/streak";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 20;

// Approximate height of HomeHeader + WeeklyCalendarStrip combined
const HEADER_HEIGHT = 140;

const RING_SEGMENT_BASE: readonly Omit<RingProgressSegment, "progress">[] = [
  { id: "outer", color: "#E5904F", radius: 78, strokeWidth: 8 },
  { id: "middle", color: "#E26B6B", radius: 68, strokeWidth: 8 },
  { id: "inner", color: "#6B7AE8", radius: 58, strokeWidth: 8 },
  { id: "innermost", color: "#000000", radius: 48, strokeWidth: 8 },
] as const;

const clampRatio = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

type CardKey = "wardrobe" | "blank1";
// Only 2 cards needed — was wastefully creating 100 items
const CARDS: CardKey[] = ["wardrobe", "blank1"];

export default function HomeScreen() {
  const { user } = useUser();
  const { summary } = useWardrobeSummary(user?.id);
  const [activeIndex, setActiveIndex] = useState(0); // Start at index 0 directly
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const ringSegments = useMemo<readonly RingProgressSegment[]>(() => {
    const totalTracked = summary.wearCount + summary.neverCount;
    const wearShare = totalTracked > 0 ? summary.wearCount / totalTracked : 0;
    const neverShare = totalTracked > 0 ? summary.neverCount / totalTracked : 0;
    const fourthShare =
      totalTracked > 0 ? (summary.wearCount * 0.5) / totalTracked : 0.45;
    return [
      { ...RING_SEGMENT_BASE[0], progress: clampRatio(summary.wornPercentage) },
      { ...RING_SEGMENT_BASE[1], progress: clampRatio(neverShare) },
      { ...RING_SEGMENT_BASE[2], progress: clampRatio(wearShare) },
      { ...RING_SEGMENT_BASE[3], progress: clampRatio(fourthShare) },
    ];
  }, [summary]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  const renderCard = useCallback(
    ({ item }: { item: CardKey }) => (
      <View style={{ width: SCREEN_WIDTH, paddingHorizontal: H_PADDING }}>
        {item === "wardrobe" ? (
          <>
            <WardrobeRingSummaryCard
              wornPercentage={clampRatio(summary.wornPercentage)}
              totalWorn={summary.totalWorn}
              wearCount={summary.wearCount}
              neverCount={summary.neverCount}
              ringSegments={ringSegments}
              streak={CURRENT_STREAK_DAYS}
            />
            <WardrobeFilterTabs />
            <WardrobeMessageBar />
          </>
        ) : (
          <>
            <WeatherOutfitCard />
            <LookAIBanner />
          </>
        )}
      </View>
    ),
    [summary, ringSegments],
  );

  // Header stays in place (translateY counteracts scroll), clamped to HEADER_HEIGHT
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  // Fade out header as content scrolls over it
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.6, HEADER_HEIGHT],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const indicatorIndex = activeIndex === 0 ? 0 : 1;
  const { onScroll: hideTabBarOnScroll } = useScrollToHideTabBar();

  return (
    <SwipeTabWrapper tabIndex={0}>
      <AppGradientBackground>
        <SafeAreaView className="flex-1">
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: hideTabBarOnScroll },
            )}
            scrollEventThrottle={16}
          >
            {/* Header & calendar — parallax: stays in place, content scrolls over */}
            <Animated.View
              style={{
                paddingHorizontal: 28,
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
                zIndex: 0,
              }}
            >
              <HomeHeader />
              <WeeklyCalendarStrip />
            </Animated.View>

            {/* Scrollable content — scrolls over the header */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {/* FlatList full-width — pagingEnabled snaps correctly */}
              <FlatList
                ref={flatListRef}
                data={CARDS}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderCard}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={getItemLayout}
                style={{ flexGrow: 0 }}
                scrollEnabled
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                removeClippedSubviews={true}
              />

              {/* Pagination dots */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 14,
                  marginBottom: 6,
                  gap: 6,
                }}
              >
                {[0, 1].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === indicatorIndex ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        i === indicatorIndex ? "#1D1A27" : "#E0E2EE",
                    }}
                  />
                ))}
              </View>

              <RecentlyUploadedHeading />
              <NotifyBanner />
              <EmptyStyleBanner />
              <OutfitAnalyzingCard />
              <WardrobeHighlights />
              <TrendFeed />
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
