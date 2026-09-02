import { posthogAnalytics } from "@/shared/telemetry/posthog";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useAuth } from "@clerk/clerk-expo";
// import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { useCalendarPlanStore } from "@/features/calendar/model/calendar-plan-store";
import {
  OCCASIONS,
  Occasion,
  getOccasionIcon,
} from "@/shared/constants/occasions";
import { CalendarPlanBanner } from "@/shared/ui/CalendarPlanBanner";
import { useFocusEffect } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar as RNCalendar } from "react-native-calendars";
import DatePicker from "react-native-date-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureFeatureError, addAppBreadcrumb } from "@/shared/telemetry/sentry";

import {
  IconBell,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconTag,
  IconX,
} from "@tabler/icons-react-native";

// ——————————————————————————————————————————————————————————————————————————————————————————————————

interface LoggedOutfit {
  title: string;
  wornTime: string;
  itemsWorn: any[];
  itemCount: number;
  score: number;
  description: string;
  weather?: { condition: string; temp: number };
  imageUri: string;
  isPlanned: boolean;
  occasion?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Reusable Bottom Sheet
function BottomSheet({
  visible,
  onClose,
  children,
  backgroundColor = "#FFFFFF",
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backgroundColor?: string;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const dismiss = (dy: number, vy: number) => {
    if (dy > 80 || vy > 0.5) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onClose());
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  // Drag handle pan — always works regardless of scroll position
  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, g: any) =>
        Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_: any, g: any) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_: any, g: any) => dismiss(g.dy, g.vy),
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={"height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={onClose}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "85%",
            backgroundColor,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingBottom: 40,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Drag handle — pan here to dismiss */}
          <View
            {...handlePan.panHandlers}
            style={{ paddingBottom: 8, paddingTop: 14, alignItems: "center" }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#E2E2EA",
              }}
            />
          </View>

          {/* Scrollable content — no pan interference */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);

  useFocusEffect(
    useCallback(() => {
      const t = new Date();
      setSelected(t);
      setViewYear(t.getFullYear());
      setViewMonth(t.getMonth());
      const timer = setTimeout(() => {
        const index = t.getDate() - 1 + 5; // +5 for buffer days
        if (dateStripRef.current) {
          dateStripRef.current.scrollToOffset({
            offset: index * 80,
            animated: false,
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }, []),
  );

  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const { setPlannedOutfit } = useCalendarPlanStore();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAddOutfitModalVisible, setIsAddOutfitModalVisible] = useState(false);
  const [isTimePickerModalVisible, setIsTimePickerModalVisible] =
    useState(false);
  const [isOccasionModalVisible, setIsOccasionModalVisible] = useState(false);
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([
    "Casual",
  ]);

  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);

  const openAddPlanModal = () => {
    setEditingPlanIndex(null);
    setSelectedImages([]);
    setCaption("");
    setSelectedOccasions(["Casual"]);
    setSelectedTime(new Date());
    setIsAddOutfitModalVisible(true);
  };

  const openEditPlanModal = (index: number, log: any) => {
    setEditingPlanIndex(index);
    if (log.itemsWorn && log.itemsWorn.length > 0) {
      setSelectedImages(log.itemsWorn.map((i: any) => i.image_url));
    } else if (log.imageUri) {
      setSelectedImages([log.imageUri]);
    } else {
      setSelectedImages([]);
    }
    setCaption(log.title || log.description || "");
    setSelectedOccasions(log.occasion ? log.occasion.split(", ") : ["Casual"]);
    if (log.wornTime) {
      setSelectedTime(new Date(log.wornTime)); // Since it's stored as an ISO string
    } else {
      setSelectedTime(new Date());
    }
    setIsAddOutfitModalVisible(true);
  };

  useEffect(() => {
    if (params.selectedImages) {
      try {
        const images = JSON.parse(params.selectedImages as string);
        if (images && images.length > 0) {
          setSelectedImages(images);
          setIsAddOutfitModalVisible(true);
        }
      } catch (e) {
        console.error("Failed to parse selectedImages", e);
      }
    }
  }, [params.selectedImages]);

  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [caption, setCaption] = useState("");
  const dateStripRef = useRef<any>(null); // Type as any or ScrollView to fix TS error
  const dateStripScrollX = useRef(new Animated.Value(0)).current;

  const { supabase } = useSupabase();
  const { userId } = useAuth();
  const [loggedOutfitsData, setLoggedOutfitsData] = useState<
    Record<string, LoggedOutfit[]>
  >({});
  const [, setIsLoadingOutfits] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchOutfits = async () => {
      setIsLoadingOutfits(true);
      try {
        const startDate = new Date(viewYear, viewMonth, 1).toISOString();
        const endDate = new Date(viewYear, viewMonth + 1, 0).toISOString();

        // Explicit columns — saves ~70% of row bytes vs select("*")
        // (the table has jsonb blobs like raw_ai_data we never read here).
        const { data, error } = await supabase
          .from("logged_outfits")
          .select(
            "date, title, worn_time, item_count, score, description, weather_condition, weather_temp, image_url, is_planned, occasion",
          )
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate)
          .limit(500); // bound the read — a heavy year can exceed one page

        if (error) throw error;

        if (isMounted && data) {
          const formatted: Record<string, LoggedOutfit[]> = {};
          data.forEach((row: any) => {
            const dateStr = new Date(row.date).toDateString();
            if (!formatted[dateStr]) formatted[dateStr] = [];
            formatted[dateStr].push({
              title: row.title,
              wornTime: row.worn_time,
              itemsWorn: row.items_worn,
              itemCount: row.item_count,
              score: row.score,
              description: row.description,
              weather: row.weather_condition
                ? { condition: row.weather_condition, temp: row.weather_temp }
                : undefined,
              imageUri: row.image_url,
              isPlanned: row.is_planned,
              occasion: row.occasion,
            });
          });
          setLoggedOutfitsData(formatted);
        }
      } catch (err) {
        captureFeatureError(err, 'calendar', 'load', 'network_error');
        console.error("Error fetching outfits:", err);
      } finally {
        if (isMounted) setIsLoadingOutfits(false);
      }
    };

    if (supabase) {
      InteractionManager.runAfterInteractions(() => {
        fetchOutfits();
      });
    }
    return () => {
      isMounted = false;
    };
  }, [viewYear, viewMonth, supabase]);

  const days = useMemo(() => {
    const year = viewYear;
    const month = viewMonth;
    const days = [];

    // Add 5 buffer days from previous month to fill empty space
    for (let i = 5; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    const lastDay = new Date(year, month + 1, 0);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    // Add 5 buffer days from next month
    for (let i = 1; i <= 5; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleDaySelect = useCallback((date: Date) => {
    setSelected(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, []);

  const combinedOutfitsData = loggedOutfitsData;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <StatusBar style="dark" />

        {/* Top Header Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.navigate("/(root)/(tabs)")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconChevronLeft size={24} color="#111827" />
            </TouchableOpacity>

            {/* Title / Date Selector */}
            <TouchableOpacity
              onPress={() => setIsCalendarModalVisible(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ExpoImage
                source={{
                  uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
                }}
                style={{ width: 19, height: 19 }}
                contentFit="contain"
              />
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#4B5563" }}
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <IconChevronDown size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Today navigator */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                let newMonth = viewMonth - 1;
                let newYear = viewYear;
                if (newMonth < 0) {
                  newMonth = 11;
                  newYear -= 1;
                }
                setViewMonth(newMonth);
                setViewYear(newYear);
              }}
            >
              <IconChevronLeft size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const t = new Date();
                handleDaySelect(t);
                setTimeout(() => {
                  const index = t.getDate() - 1 + 5; // +5 for buffer days
                  if (dateStripRef.current) {
                    dateStripRef.current.scrollToOffset({
                      offset: index * 80,
                      animated: true,
                    });
                  }
                }, 100);
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                let newMonth = viewMonth + 1;
                let newYear = viewYear;
                if (newMonth > 11) {
                  newMonth = 0;
                  newYear += 1;
                }
                setViewMonth(newMonth);
                setViewYear(newYear);
              }}
            >
              <IconChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Strip */}
        <View>
          {/* ponytail: Swapped heavy Animated ScrollView for a simple FlatList without scroll-driven scaling. */}
          {/* Ceiling: No physics-driven scaling. Upgrade path: React Native Reanimated useSharedValue if requested. */}
          <Animated.FlatList
            ref={dateStripRef as any}
            horizontal
            data={days}
            keyExtractor={(d) => d.toISOString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Dimensions.get("window").width / 2 - 40,
              alignItems: "flex-end",
            }}
            snapToInterval={80}
            decelerationRate="fast"
            initialNumToRender={15}
            windowSize={5}
            onLayout={() => {
              const t = new Date();
              const index = t.getDate() - 1 + 5;
              if (dateStripRef.current) {
                dateStripRef.current.scrollToOffset({
                  offset: index * 80,
                  animated: false,
                });
              }
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: dateStripScrollX } } }],
              { useNativeDriver: true },
            )}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / 80);
              if (days[index]) {
                handleDaySelect(days[index]);
              }
            }}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            renderItem={({ item: d, index }) => {
              const isToday = isSameDay(d, new Date());
              const isSelected = isSameDay(d, selected);
              const dayName = isToday ? "Today" : DAY_LABELS_SHORT[d.getDay()];
              const monthStr = MONTH_NAMES[d.getMonth()].substring(0, 3);
              const dateStr = `${monthStr} ${d.getDate()}`;
              const hasOutfit = !!combinedOutfitsData[d.toDateString()]?.length;
              const log = combinedOutfitsData[d.toDateString()]?.[0];

              const ITEM_PITCH = 80;
              const scale = dateStripScrollX.interpolate({
                inputRange: [
                  (index - 1) * ITEM_PITCH,
                  index * ITEM_PITCH,
                  (index + 1) * ITEM_PITCH,
                ],
                outputRange: [1, 1.12, 1],
                extrapolate: "clamp",
              });
              const hasPlan = combinedOutfitsData[d.toDateString()]?.some(
                (log) => log.isPlanned,
              );

              const translateX = dateStripScrollX.interpolate({
                inputRange: [
                  (index - 1) * ITEM_PITCH,
                  index * ITEM_PITCH,
                  (index + 1) * ITEM_PITCH,
                ],
                outputRange: [6, 0, -6],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  style={{
                    alignItems: "center",
                    width: 64,
                    marginHorizontal: 8,
                    marginTop: 20,
                    justifyContent: "center",
                    transform: [{ translateX }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (isSelected) {
                        openAddPlanModal();
                      } else {
                        handleDaySelect(d);
                        dateStripRef.current?.scrollToIndex({
                          index,
                          animated: true,
                          viewPosition: 0.5,
                        });
                        if (!hasOutfit) {
                          router.push("/wardrobe-selection");
                        }
                      }
                    }}
                    activeOpacity={0.8}
                    style={{ alignItems: "center", width: 64 }}
                  >
                    {/* Dot indicators (Today and Plans) */}
                    <View
                      style={{
                        height: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      {isToday && (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#111827",
                          }}
                        />
                      )}
                      {hasPlan && (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#22c55e",
                          }}
                        />
                      )}
                    </View>

                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isToday ? "700" : "500",
                        color: isToday
                          ? "#111827"
                          : isSelected
                            ? "#111827"
                            : "#6B7280",
                        marginTop: 4,
                      }}
                    >
                      {dayName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: "#9CA3AF",
                        marginBottom: 8,
                      }}
                    >
                      {dateStr}
                    </Text>

                    {/* Card */}
                    <Animated.View
                      style={{
                        width: 64,
                        height: 84,
                        marginTop: 4,
                        borderRadius: 20,
                        backgroundColor: isSelected ? "#1D1A27" : "#F0F1F4",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        marginBottom: 20,
                        transform: [{ scale }],
                      }}
                    >
                      {hasOutfit && log.imageUri && !log.isPlanned ? (
                        <ExpoImage
                          source={{ uri: log.imageUri }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <IconCalendarPlus
                          size={22}
                          color={isSelected ? "#FFFFFF" : "#9CA3AF"}
                          strokeWidth={1.5}
                        />
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        </View>
        {combinedOutfitsData[selected.toDateString()]?.filter(
          (log) => log.isPlanned,
        ).length > 0 ? (
          <ScrollView
            style={{ flex: 1, marginTop: 10 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {combinedOutfitsData[selected.toDateString()]
              .map((log, originalIndex) => ({ log, originalIndex }))
              .filter(({ log }) => log.isPlanned)
              .map(({ log, originalIndex }) => (
                <CalendarPlanBanner
                  key={originalIndex}
                  plan={{
                    images: log.itemsWorn
                      ? log.itemsWorn.map((i: any) => i.image_url)
                      : log.imageUri
                        ? [log.imageUri]
                        : [],
                    caption: log.title || log.description || "Plan",
                    time: new Date(
                      selected.toDateString() + " " + (log.wornTime || "12:00"),
                    ),
                    occasion: log.occasion || "Casual",
                    createdAt: new Date(
                      selected.toDateString() + " " + (log.wornTime || "12:00"),
                    ),
                  }}
                  onEdit={() => openEditPlanModal(originalIndex, log)}
                  onRemove={() => {
                    setLoggedOutfitsData((prev) => ({
                      ...prev,
                      [selected.toDateString()]: prev[
                        selected.toDateString()
                      ].filter((_, i) => i !== originalIndex),
                    }));
                  }}
                />
              ))}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              marginTop: -200,
            }}
          >
            <Video
              source={require("../../../assets/planner_empty.webm")}
              style={{ width: 250, height: 250 }}
              shouldPlay
              isLooping={false}
              resizeMode={ResizeMode.CONTAIN}
            />
            <View style={{ marginTop: -40, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: "#1F1F1F",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                No plans yet.
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: "#6B7280",
                  fontWeight: "500",
                  textAlign: "center",
                  marginTop: 4,
                  paddingHorizontal: 20,
                }}
              >
                Tap a date to style your day.
              </Text>
            </View>
          </View>
        )}

        {/* Calendar Bottom Sheet */}
        <BottomSheet
          visible={isCalendarModalVisible}
          onClose={() => setIsCalendarModalVisible(false)}
        >
          <View style={{ paddingHorizontal: 35, paddingBottom: 10 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                // paddingBottom: 1,
              }}
            >
              {/* <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}
              >
                Choose the date of wear
              </Text> */}
            </View>

            {/* Calendar */}
            {isCalendarModalVisible && (
              <View style={{ minHeight: 370 }}>
                <RNCalendar
                  current={selected.toISOString().split("T")[0]}
                  onDayPress={(day: any) => {
                    const newDate = new Date(day.timestamp);
                    setSelected(newDate);
                    handleDaySelect(newDate);
                    setIsCalendarModalVisible(false);
                  }}
                  theme={{
                    todayTextColor: "#ffffff",
                    todayBackgroundColor: "#000000",
                    selectedDayBackgroundColor: "#1D1A27",
                    selectedDayTextColor: "#ffffff",
                    arrowColor: "#1D1A27",
                    textDayFontWeight: "600",
                    textMonthFontWeight: "800",
                    textDayHeaderFontWeight: "500",
                    textSectionTitleColor: "#9CA3AF",
                    monthTextColor: "#1D1A27",
                  }}
                  enableSwipeMonths={true}
                  hideExtraDays={false}
                  firstDay={1}
                  renderArrow={(direction: any) => (
                    <View
                      style={{
                        backgroundColor: "#F3F4F6",
                        borderRadius: 16,
                        padding: 6,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {direction === "left" ? (
                        <IconChevronLeft size={16} color="#4B5563" />
                      ) : (
                        <IconChevronRight size={16} color="#4B5563" />
                      )}
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </BottomSheet>

        {/* Add Outfit Bottom Sheet */}
        <BottomSheet
          visible={isAddOutfitModalVisible}
          onClose={() => setIsAddOutfitModalVisible(false)}
          backgroundColor="#FFFFFF"
        >
          <View style={{ paddingHorizontal: 24 }}>
            {/* Date and Time Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                paddingVertical: 10,
                marginBottom: 10,
              }}
            >
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => setIsCalendarModalVisible(true)}
              >
                <IconClock
                  size={20}
                  color="#111827"
                  strokeWidth={1.5}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "400", color: "#111827" }}
                >
                  {DAY_LABELS_SHORT[selected.getDay()]}, {selected.getDate()}{" "}
                  {MONTH_NAMES[selected.getMonth()].substring(0, 3)}{" "}
                  {selected.getFullYear()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingLeft: 10,
                }}
                onPress={() => setIsTimePickerModalVisible(true)}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "400", color: "#4B5563" }}
                >
                  {selectedTime
                    .toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .toLowerCase()}
                </Text>
                <IconChevronDown
                  size={18}
                  color="#9CA3AF"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            {/* Image Selection Area */}
            <TouchableOpacity
              onPress={async () => {
                let result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsMultipleSelection: true,
                  selectionLimit: 5,
                });

                if (!result.canceled) {
                  const newUris = result.assets.map((asset) => asset.uri);
                  setSelectedImages(newUris.slice(0, 5));
                }
              }}
              activeOpacity={0.8}
              style={{
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {selectedImages.length === 0 ? (
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    backgroundColor: "#E5E7EB70",
                    borderRadius: 100,
                    alignItems: "center",
                    justifyContent: "center",
                    // marginLeft: 12,
                  }}
                >
                  <IconPlus size={26} color="#111827" strokeWidth={2} />
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {selectedImages.map((uri, index) => (
                    <ExpoImage
                      key={index}
                      source={{ uri }}
                      contentFit="cover"
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 100,
                        borderWidth: 3,
                        borderColor: "#FFFFFF",
                        marginLeft: index === 0 ? 0 : -45,
                        zIndex: 10 - index,
                      }}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>

            {/* Caption Input */}
            <TextInput
              placeholder="add caption..."
              placeholderTextColor="#11182780"
              value={caption}
              onChangeText={setCaption}
              multiline={true}
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 16,
                padding: 0,
              }}
            />

            {/* Occasion Row */}
            <TouchableOpacity
              onPress={() => setIsOccasionModalVisible(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 32,
                paddingHorizontal: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconTag
                  size={20}
                  color="#4B5563"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ fontSize: 16, fontWeight: "400", color: "#6B7280" }}
                >
                  Occasion
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#111827",
                    marginRight: 4,
                  }}
                >
                  {selectedOccasions.length > 0
                    ? selectedOccasions.join(", ")
                    : "Select"}
                </Text>
                <IconChevronDown size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Notification Section */}
            <View style={{ marginBottom: 24 }}>
              {/* Header Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  paddingHorizontal: 4,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconBell
                    size={20}
                    color="#4B5563"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "400",
                      color: "#111827",
                    }}
                  >
                    Notification
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    setIsNotificationEnabled(!isNotificationEnabled)
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isNotificationEnabled
                      ? "#1D1A27"
                      : "#D1D5DB",
                    justifyContent: "center",
                    paddingHorizontal: 2,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#FFFFFF",
                      alignSelf: isNotificationEnabled
                        ? "flex-end"
                        : "flex-start",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                    }}
                  />
                </Pressable>
              </View>

              {/* Info Card */}
              <View
                style={{
                  backgroundColor: "#E5E7EB50",
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <IconInfoCircle
                  size={20}
                  color="#11182780"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#11182780",
                    fontWeight: "500",
                  }}
                >
                  Planner will notify you 20 mins before
                </Text>
              </View>
            </View>

            {/* Add plan Button */}
            <TouchableOpacity
              onPress={() => {
                posthogAnalytics.captureEvent('outfit_plan_created', { occasion: 'planned' });
                setLoggedOutfitsData((prev) => {
                  const existing = prev[selected.toDateString()] || [];
                  const combinedTime = new Date(selected);
                  combinedTime.setHours(
                    selectedTime.getHours(),
                    selectedTime.getMinutes(),
                    0,
                    0,
                  );

                  const newPlan = {
                    imageUri: selectedImages[0] || "",
                    itemsWorn: selectedImages.map((uri) => ({
                      image_url: uri,
                    })),
                    title: caption || "Plan",
                    wornTime: combinedTime.toISOString(),
                    description: caption,
                    isPlanned: true,
                    itemCount: selectedImages.length,
                    score: 0,
                    occasion:
                      selectedOccasions.length > 0
                        ? selectedOccasions.join(", ")
                        : "Casual",
                  };

                  if (editingPlanIndex !== null) {
                    const updated = [...existing];
                    updated[editingPlanIndex] = newPlan;
                    return { ...prev, [selected.toDateString()]: updated };
                  }

                  return {
                    ...prev,
                    [selected.toDateString()]: [...existing, newPlan],
                  };
                });

                const combinedTimeForStore = new Date(selected);
                combinedTimeForStore.setHours(
                  selectedTime.getHours(),
                  selectedTime.getMinutes(),
                  0,
                  0,
                );

                setPlannedOutfit({
                  images:
                    selectedImages.length > 0
                      ? selectedImages
                      : [selectedImages[0] || ""],
                  caption: caption || "Plan",
                  time: combinedTimeForStore,
                  occasion:
                    selectedOccasions.length > 0
                      ? selectedOccasions.join(", ")
                      : "Casual",
                  createdAt: new Date(),
                });

                setIsAddOutfitModalVisible(false);
                setEditingPlanIndex(null);
                router.navigate("/(root)/(tabs)");
              }}
              style={{
                backgroundColor: "#111827",
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <IconCalendarPlus
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
              >
                Add plan
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Occasion Selection Bottom Sheet */}
        <BottomSheet
          visible={isOccasionModalVisible}
          onClose={() => setIsOccasionModalVisible(false)}
        >
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#111827",
                marginBottom: 20,
              }}
            >
              Select Occasion
            </Text>

            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {OCCASIONS.map((o) => {
                  const isSelected = selectedOccasions.includes(o);
                  return (
                    <Pressable
                      key={o}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedOccasions(
                            selectedOccasions.filter((x) => x !== o),
                          );
                        } else {
                          if (selectedOccasions.length < 2) {
                            setSelectedOccasions([...selectedOccasions, o]);
                          }
                        }
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 999,
                        backgroundColor: isSelected ? "#1D1A27" : "#fff",
                        borderWidth: 1,
                        borderColor: isSelected ? "#1D1A27" : "#E5E7EB",
                      }}
                    >
                      {getOccasionIcon(o, isSelected ? "#fff" : "#6B7280")}
                      <Text
                        style={{
                          color: isSelected ? "#fff" : "#6B7280",
                          fontSize: 14,
                          fontWeight: "500",
                        }}
                      >
                        {o}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsOccasionModalVisible(false)}
              style={{
                backgroundColor: "#111827",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Time Picker Centered Modal */}
        <Modal
          visible={isTimePickerModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsTimePickerModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPress={() => setIsTimePickerModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                width: "85%",
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
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
                >
                  Choose time
                </Text>
                <TouchableOpacity
                  onPress={() => setIsTimePickerModalVisible(false)}
                >
                  <IconX size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={{ padding: 5, alignItems: "center" }}>
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: "80%",
                      height: 52,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#111827",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <DatePicker
                    date={selectedTime}
                    onDateChange={setSelectedTime}
                    mode="time"
                    theme="light"
                    locale="en-US"
                    is24hourSource="locale"
                  />
                </View>
              </View>

              {/* Footer */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  padding: 20,
                  borderTopWidth: 1,
                  borderTopColor: "#F3F4F6",
                }}
              >
                <TouchableOpacity
                  onPress={() => setIsTimePickerModalVisible(false)}
                  style={{ marginRight: 24 }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#4B5563",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsTimePickerModalVisible(false)}
                  style={{
                    backgroundColor: "#1C1C1E",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
