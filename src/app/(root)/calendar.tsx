import { useSupabase } from "@/shared/supabase/use-supabase";
// import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import * as Calendar from "expo-calendar";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
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
  Modal,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar as RNCalendar } from "react-native-calendars";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  IconCalendar,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCloudRain
} from "@tabler/icons-react-native";

// â”€â”€â”€ Constants & Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CELL_GAP = 7;
const PADDING = 20;
const CELL_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CELL_GAP * 6) / 7;

// Reusable Bottom Sheet
function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        return (
          gestureState.dy > 0 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_: any, gestureState: any) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
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
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 40,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View {...panResponder.panHandlers} style={{ paddingBottom: 16 }}>
          <View
            style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}
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
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);

  // Drag and drop logic
  const HOUR_HEIGHT = 72;
  const [draftEvent, setDraftEvent] = useState<{ id: string; start: number; end: number; title: string; } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const startY = useSharedValue(0);
  const eventHeight = useSharedValue(0);

  const createEventAtY = (y: number) => {
    const snapY = Math.floor(y / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2);
    const startHour = snapY / HOUR_HEIGHT;
    startY.value = snapY;
    eventHeight.value = Math.max(HOUR_HEIGHT, HOUR_HEIGHT);
    setDraftEvent({ id: 'draft', start: startHour, end: startHour + 1, title: '(No title)' });
  };

  const handleTap = Gesture.Tap().onEnd((e) => {
    runOnJS(createEventAtY)(e.y);
  });

  const updateDraftFromShared = () => {
    if (draftEvent) {
      setDraftEvent({ ...draftEvent, start: startY.value / HOUR_HEIGHT, end: (startY.value + eventHeight.value) / HOUR_HEIGHT });
    }
  };

  const panBody = Gesture.Pan()
    .onBegin(() => { runOnJS(setScrollEnabled)(false); })
    .onUpdate((e) => {
      const snapY = Math.round((startY.value + e.translationY) / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2);
      if (snapY >= 0 && snapY + eventHeight.value <= 24 * HOUR_HEIGHT) startY.value = snapY;
    })
    .onFinalize(() => { runOnJS(updateDraftFromShared)(); runOnJS(setScrollEnabled)(true); });

  const panBottomHandle = Gesture.Pan()
    .onBegin(() => { runOnJS(setScrollEnabled)(false); })
    .onUpdate((e) => {
      const newHeight = eventHeight.value + e.translationY;
      const snapHeight = Math.max(HOUR_HEIGHT / 2, Math.round(newHeight / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2));
      if (startY.value + snapHeight <= 24 * HOUR_HEIGHT) eventHeight.value = snapHeight;
    })
    .onFinalize(() => { runOnJS(updateDraftFromShared)(); runOnJS(setScrollEnabled)(true); });

  const panTopHandle = Gesture.Pan()
    .onBegin(() => { runOnJS(setScrollEnabled)(false); })
    .onUpdate((e) => {
      const newY = startY.value + e.translationY;
      const snapY = Math.max(0, Math.round(newY / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2));
      const endY = startY.value + eventHeight.value;
      if (snapY < endY - (HOUR_HEIGHT / 2) + 1) {
        startY.value = snapY;
        eventHeight.value = endY - snapY;
      }
    })
    .onFinalize(() => { runOnJS(updateDraftFromShared)(); runOnJS(setScrollEnabled)(true); });

  const animatedEventStyle = useAnimatedStyle(() => ({
    top: startY.value,
    height: eventHeight.value,
  }));

  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [deviceEvents, setDeviceEvents] = useState<Calendar.Event[]>([]);
  const dateStripRef = useRef<any>(null); // Type as any or ScrollView to fix TS error
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScrollY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 10000],
        outputRange: [0, 10000],
        extrapolateLeft: "clamp",
      }),
    [scrollY],
  );

  const { supabase } = useSupabase();
  const [loggedOutfitsData, setLoggedOutfitsData] = useState<
    Record<string, LoggedOutfit>
  >({});
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchOutfits = async () => {
      setIsLoadingOutfits(true);
      try {
        const startDate = new Date(viewYear, viewMonth, 1).toISOString();
        const endDate = new Date(viewYear, viewMonth + 1, 0).toISOString();

        const { data, error } = await supabase
          .from("logged_outfits")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate);

        if (error) throw error;

        if (isMounted && data) {
          const formatted: Record<string, LoggedOutfit> = {};
          data.forEach((row: any) => {
            const dateStr = new Date(row.date).toDateString();
            formatted[dateStr] = {
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
            };
          });
          setLoggedOutfitsData(formatted);
        }
      } catch (err) {
        console.log("Error fetching outfits:", err);
      } finally {
        if (isMounted) setIsLoadingOutfits(false);
      }
    };

    if (supabase) { fetchOutfits(); }
    return () => { isMounted = false; };
  }, [viewYear, viewMonth, supabase]);


  const days = useMemo(
    () => {
      const year = viewYear;
      const month = viewMonth;
      const firstDay = new Date(year, month, 1);
      const startOffset = firstDay.getDay();
      const days = [];
      for (let i = startOffset - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }
      const lastDay = new Date(year, month + 1, 0);
      for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
      }
      const remaining = 7 - (days.length % 7);
      if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
          days.push(new Date(year, month + 1, d));
        }
      }
      return days;
    },
    [viewYear, viewMonth],
  );

  const handleDaySelect = useCallback((date: Date) => {
    setSelected(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, []);

  const combinedOutfitsData = loggedOutfitsData;


  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconChevronLeft size={24} color="#111827" />
            </TouchableOpacity>

            {/* Title / Date Selector */}
            <TouchableOpacity
              onPress={() => setIsCalendarModalVisible(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <IconCalendar size={20} color="#111827" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#4B5563" }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <IconChevronDown size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Today navigator */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
                  const index = t.getDate() - 1;
                  const offset = Math.max(0, index * 82 - 30);
                  if (dateStripRef.current) {
                    dateStripRef.current.scrollTo({ x: offset, animated: true });
                  }
                }, 100);
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
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
          <Animated.ScrollView
            ref={dateStripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {days.map((d) => {
              const isToday = isSameDay(d, new Date());
              const isSelected = isSameDay(d, selected);
              const dayName = isToday ? "Today" : DAY_LABELS_SHORT[d.getDay()];
              const monthStr = MONTH_NAMES[d.getMonth()].substring(0, 3);
              const dateStr = `${monthStr} ${d.getDate()}`;
              const hasOutfit = !!combinedOutfitsData[d.toDateString()];
              const log = combinedOutfitsData[d.toDateString()];

              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  onPress={() => handleDaySelect(d)}
                  activeOpacity={0.8}
                  style={{ alignItems: "center", width: 76 }}
                >
                  {/* Dot indicator for Today */}
                  <View style={{ height: 8, marginBottom: 4, alignItems: "center", justifyContent: "center" }}>
                    {isToday && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#111827" }} />
                    )}
                  </View>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isToday ? "700" : "500",
                      color: isToday ? "#111827" : "#6B7280",
                      marginBottom: 2,
                    }}
                  >
                    {dayName}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>
                    {dateStr}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 }}>
                    <IconCloudRain size={14} color="#9CA3AF" />
                    <Text style={{ fontSize: 12, color: "#111827", fontWeight: "600" }}>28°</Text>
                    <Text style={{ fontSize: 12, color: "#9CA3AF" }}>26°</Text>
                  </View>

                  {/* Card */}
                  <View
                    style={{
                      width: 76,
                      height: 120,
                      borderRadius: 18,
                      backgroundColor: isToday ? "#FFFFFF" : "#F3F4F6",
                      borderWidth: isToday ? 1 : 0,
                      borderColor: "#E5E7EB",
                      shadowColor: isToday ? "#000" : "transparent",
                      shadowOpacity: isToday ? 0.08 : 0,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: isToday ? 4 : 0,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {hasOutfit && log.imageUri ? (
                      <ExpoImage source={{ uri: log.imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    ) : (
                      <IconCalendarPlus size={26} color="#C4C4C4" strokeWidth={1.5} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.ScrollView>
        </View>

        {/* Empty State Body */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, color: "#000000", fontWeight: "500" }}>
            nothing here!
          </Text>
        </View>

        {/* Calendar Bottom Sheet */}
        <BottomSheet
          visible={isCalendarModalVisible}
          onClose={() => setIsCalendarModalVisible(false)}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}>
                Choose the date of wear
              </Text>
            </View>

            {/* Calendar */}
            <RNCalendar
              current={selected.toISOString().split("T")[0]}
              onDayPress={(day: any) => {
                const newDate = new Date(day.timestamp);
                setSelected(newDate);
                handleDaySelect(newDate);
                setIsCalendarModalVisible(false);
              }}
              theme={{
                todayTextColor: "#1D1A27",
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
              hideExtraDays={true}
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
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}
