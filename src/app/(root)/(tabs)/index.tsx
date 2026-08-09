import { OutfitAnalyzingCard } from "@/features/ai-styling/ui/OutfitAnalyzingCard";
import { WeatherOutfitCard } from "@/features/ai-styling/ui/WeatherOutfitCard";
import { useCalendarPlanStore } from "@/features/calendar/model/calendar-plan-store";
import {
  usePremiumLimits,
} from "@/features/payments/model/usePremiumLimits";
import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { useRingStats } from "@/features/wardrobe/api/useRingStats";
import { PendingBatchBanner } from "@/features/wardrobe/ui/PendingBatchBanner";
import {
  EmptyStyleBanner,
  NotifyBanner,
  RecentlyUploadedHeading
} from "@/features/wardrobe/ui/RecentlyUploadedCard";
import { WardrobeFilterTabs } from "@/features/wardrobe/ui/WardrobeFilterTabs";
import { WardrobeMessageBar } from "@/features/wardrobe/ui/WardrobeMessageBar";
import type { RingProgressSegment } from "@/features/wardrobe/ui/WardrobeRingSummaryCard";
import { WardrobeRingSummaryCard } from "@/features/wardrobe/ui/WardrobeRingSummaryCard";
import { useWeatherStore } from "@/features/weather/model/weather-store";
import { AddClothesCTA } from "@/shared/ui/AddClothesCTA";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { CalendarPlanBanner } from "@/shared/ui/CalendarPlanBanner";
import { HomeHeader } from "@/shared/ui/HomeHeader";
import { LookAIBanner } from "@/shared/ui/LookAIBanner";
import { StreakPopup } from "@/shared/ui/StreakPopup";
import { WeeklyCalendarStrip } from "@/shared/ui/WeeklyCalendarStrip";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";
import { useUser } from "@clerk/clerk-expo";
import { IconAlertTriangle } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 20;

// Approximate height of HomeHeader + WeeklyCalendarStrip combined
const HEADER_HEIGHT = 140;

const RING_SEGMENT_BASE: readonly Omit<RingProgressSegment, "progress">[] = [
  { id: "outer", color: "#01B3F7", radius: 90, strokeWidth: 15 },
  { id: "middle", color: "#AB86F1", radius: 73, strokeWidth: 15 },
  { id: "inner", color: "#FEC466", radius: 56, strokeWidth: 15 },
  { id: "innermost", color: "#000000", radius: 39, strokeWidth: 15 },
] as const;

const clampRatio = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

type CardKey = "wardrobe" | "blank1";
// Only 2 cards needed — was wastefully creating 100 items
const CARDS: CardKey[] = ["wardrobe", "blank1"];

type FilterTab = "Daily" | "Weekly" | "Monthly" | "90 Days";

const HomeCard = React.memo(function HomeCard({
  item,
  canAddWardrobe,
  wardrobeCount,
  stats,
  ringSegments,
  currentStreak,
  timeframe,
  setTimeframe,
  weatherData,
  wardrobeLimit,
}: any) {
  const router = useRouter();
  return (
    <View style={{ width: SCREEN_WIDTH, paddingHorizontal: H_PADDING }}>
      {item === "wardrobe" ? (
        <>
          {!canAddWardrobe && (
            <Pressable
              onPress={() =>
                router.push("/(root)/(subscription)/subscription" as never)
              }
              className="mt-4 flex-row border border-[#FECACA] items-center bg-[#FEF2F2] rounded-[16px] px-4 py-3"
            >
              <IconAlertTriangle size={20} color="#EF4444" strokeWidth={1.5} />
              <Text
                className="ml-3 text-[#991B1B] font-sans"
                style={{ fontSize: 13, flex: 1, fontWeight: "600" }}
              >
                  Wardrobe limit reached ({wardrobeCount}/{wardrobeLimit}).
                Upgrade to Pro to add more items.
              </Text>
            </Pressable>
          )}
          <WardrobeRingSummaryCard
            wornPercentage={wardrobeCount / wardrobeLimit}
            totalWorn={stats.raw.streakCount}
            wearCount={stats.raw.avgWears}
            neverCount={wardrobeCount}
            ringSegments={ringSegments}
            streak={stats.raw.streakCount}
            labels={{
              topLeft: "Usage",
              bottomLeft: "Streak",
              topRight: "Avg Wears",
              bottomRight: "Total Items",
            }}
            statColors={{
              bottomLeft: "#FEC466",
              bottomRight: "#1D1A27",
            }}
          />
          <View
            style={{
              borderWidth: 0.7,
              borderColor: "#E9EBF8",
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 8,
              marginTop: 5,
              shadowColor: "#FFFFFF",
              shadowOpacity: 0.02,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }}
          >
            <WardrobeFilterTabs value={timeframe} onChange={setTimeframe} />
            <WardrobeMessageBar />
          </View>
        </>
      ) : (
        <>
          <WeatherOutfitCard />
          <LookAIBanner
            score={weatherData ? Math.round(weatherData.comfortScore / 10) : 8}
          />
        </>
      )}
    </View>
  );
});

export default function HomeScreen() {
  const { user } = useUser();
  const { canAddWardrobe, wardrobeCount, wardrobeLimit } = usePremiumLimits();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<FilterTab>("Daily");
  const period =
    timeframe === "Daily"
      ? "daily"
      : timeframe === "Weekly"
        ? "weekly"
        : timeframe === "Monthly"
          ? "monthly"
          : "90_days";
  const weatherData = useWeatherStore((state) => state.data);
  const [activeIndex, setActiveIndex] = useState(0); // Start at index 0 directly
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollY = useRef(new Animated.Value(0)).current;
  const { currentStreak, hasIncrementedToday, dismissIncrement } =
    useStreakStore();
  const { stats, isLoading } = useRingStats(period, wardrobeCount, currentStreak, wardrobeLimit);
  const { plannedOutfit, setPlannedOutfit } = useCalendarPlanStore();

  // Streak popup driven by useStreakStore.hasIncrementedToday (set in layout)

  const ringSegments = useMemo<readonly RingProgressSegment[]>(() => {
    return [
      { ...RING_SEGMENT_BASE[0], progress: clampRatio(wardrobeCount / wardrobeLimit) },
      { ...RING_SEGMENT_BASE[1], progress: clampRatio(stats.avgWearsPercent) },
      { ...RING_SEGMENT_BASE[2], progress: clampRatio(stats.streakPercent) },
      {
        ...RING_SEGMENT_BASE[3],
        progress: clampRatio(stats.usagePercent), // Move wardrobe utilization to innermost ring
      },
    ];
  }, [stats, wardrobeCount, wardrobeLimit, currentStreak, timeframe]);

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
      <HomeCard
        item={item}
        canAddWardrobe={canAddWardrobe}
        wardrobeCount={wardrobeCount}
        stats={stats}
        ringSegments={ringSegments}
        currentStreak={currentStreak}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        weatherData={weatherData}
      />
    ),
    [
      stats,
      ringSegments,
      currentStreak,
      timeframe,
      canAddWardrobe,
      wardrobeCount,
      wardrobeLimit,
      weatherData,
    ],
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
            contentContainerStyle={{ paddingBottom: 140 }}
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
              <WeeklyCalendarStrip onDateChange={setSelectedDate} />
            </Animated.View>

            {/* Scrollable content — scrolls over the header */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {/* FlatList full-width — pagingEnabled snaps correctly */}
              <FlatList
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
                extraData={{ stats, timeframe, currentStreak, canAddWardrobe, wardrobeCount, wardrobeLimit, weatherData }}
              />

              {/* Pagination dots */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 12,
                  marginBottom: 4,
                  gap: 5,
                }}
              >
                {[0, 1].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === indicatorIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 100,
                      backgroundColor:
                        i === indicatorIndex ? "#1D1A27" : "#D8D6E3",
                    }}
                  />
                ))}
              </View>

              <RecentlyUploadedHeading />
              <PendingBatchBanner />
              {/* <ErrorBanner /> */}
              <NotifyBanner />
              <EmptyStyleBanner />
              <OutfitAnalyzingCard />
              {plannedOutfit && (
                <CalendarPlanBanner
                  title="Upcoming event"
                  plan={plannedOutfit as any}
                  onRemove={() => setPlannedOutfit(null)}
                />
              )}
              <AddClothesCTA />
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
      <StreakPopup
        visible={hasIncrementedToday}
        onClose={dismissIncrement}
        streakCount={currentStreak}
      />
    </SwipeTabWrapper>
  );
}
