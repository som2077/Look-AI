import { useSupabase } from "@/shared/supabase/use-supabase";
// import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { useFocusEffect } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import * as Calendar from "expo-calendar";
import * as Haptics from "expo-haptics";
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
  InteractionManager,
  Modal,
  PanResponder,
  Pressable,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar as RNCalendar } from "react-native-calendars";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  IconCalendar,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCloudRain,
  IconPlus,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CELL_GAP = 7;
const PADDING = 20;
const CELL_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CELL_GAP * 6) / 7;

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
          backgroundColor,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
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

  useFocusEffect(
    useCallback(() => {
      const t = new Date();
      setSelected(t);
      setViewYear(t.getFullYear());
      setViewMonth(t.getMonth());
      setTimeout(() => {
        const index = t.getDate() - 1 + 5; // +5 for buffer days
        const offset = Math.max(0, index * 84);
        if (dateStripRef.current) {
          dateStripRef.current.scrollTo({
            x: offset,
            animated: false,
          });
        }
      }, 50);
    }, []),
  );

  // Drag and drop logic
  const HOUR_HEIGHT = 72;
  const [draftEvent, setDraftEvent] = useState<{
    id: string;
    start: number;
    end: number;
    title: string;
  } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const startY = useSharedValue(0);
  const eventHeight = useSharedValue(0);

  const createEventAtY = (y: number) => {
    const snapY = Math.floor(y / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2);
    const startHour = snapY / HOUR_HEIGHT;
    startY.value = snapY;
    eventHeight.value = Math.max(HOUR_HEIGHT, HOUR_HEIGHT);
    setDraftEvent({
      id: "draft",
      start: startHour,
      end: startHour + 1,
      title: "(No title)",
    });
  };

  const handleTap = Gesture.Tap().onEnd((e) => {
    runOnJS(createEventAtY)(e.y);
  });

  const updateDraftFromShared = () => {
    if (draftEvent) {
      setDraftEvent({
        ...draftEvent,
        start: startY.value / HOUR_HEIGHT,
        end: (startY.value + eventHeight.value) / HOUR_HEIGHT,
      });
    }
  };

  const panBody = Gesture.Pan()
    .onBegin(() => {
      runOnJS(setScrollEnabled)(false);
    })
    .onUpdate((e) => {
      const snapY =
        Math.round((startY.value + e.translationY) / (HOUR_HEIGHT / 2)) *
        (HOUR_HEIGHT / 2);
      if (snapY >= 0 && snapY + eventHeight.value <= 24 * HOUR_HEIGHT)
        startY.value = snapY;
    })
    .onFinalize(() => {
      runOnJS(updateDraftFromShared)();
      runOnJS(setScrollEnabled)(true);
    });

  const panBottomHandle = Gesture.Pan()
    .onBegin(() => {
      runOnJS(setScrollEnabled)(false);
    })
    .onUpdate((e) => {
      const newHeight = eventHeight.value + e.translationY;
      const snapHeight = Math.max(
        HOUR_HEIGHT / 2,
        Math.round(newHeight / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2),
      );
      if (startY.value + snapHeight <= 24 * HOUR_HEIGHT)
        eventHeight.value = snapHeight;
    })
    .onFinalize(() => {
      runOnJS(updateDraftFromShared)();
      runOnJS(setScrollEnabled)(true);
    });

  const panTopHandle = Gesture.Pan()
    .onBegin(() => {
      runOnJS(setScrollEnabled)(false);
    })
    .onUpdate((e) => {
      const newY = startY.value + e.translationY;
      const snapY = Math.max(
        0,
        Math.round(newY / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2),
      );
      const endY = startY.value + eventHeight.value;
      if (snapY < endY - HOUR_HEIGHT / 2 + 1) {
        startY.value = snapY;
        eventHeight.value = endY - snapY;
      }
    })
    .onFinalize(() => {
      runOnJS(updateDraftFromShared)();
      runOnJS(setScrollEnabled)(true);
    });

  const animatedEventStyle = useAnimatedStyle(() => ({
    top: startY.value,
    height: eventHeight.value,
  }));

  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isAddOutfitModalVisible, setIsAddOutfitModalVisible] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [caption, setCaption] = useState("");
  const [deviceEvents, setDeviceEvents] = useState<Calendar.Event[]>([]);
  const dateStripRef = useRef<any>(null); // Type as any or ScrollView to fix TS error
  const dateStripScrollX = useRef(new Animated.Value(0)).current;

  const lastHapticIndex = useRef(-1);
  useEffect(() => {
    const listenerId = dateStripScrollX.addListener(({ value }) => {
      const index = Math.round(value / 84); // 84 is ITEM_PITCH
      if (index !== lastHapticIndex.current && index >= 0) {
        lastHapticIndex.current = index;
        Haptics.selectionAsync();
      }
    });
    return () => {
      dateStripScrollX.removeListener(listenerId);
    };
  }, [dateStripScrollX]);
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
                  const offset = Math.max(0, index * 84);
                  if (dateStripRef.current) {
                    dateStripRef.current.scrollTo({
                      x: offset,
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
          <Animated.ScrollView
            ref={dateStripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Dimensions.get("window").width / 2 - 42,
              alignItems: "flex-end",
            }}
            snapToInterval={84}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: dateStripScrollX } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
          >
            {days.map((d, index) => {
              const isToday = isSameDay(d, new Date());
              const isSelected = isSameDay(d, selected);
              const dayName = isToday ? "Today" : DAY_LABELS_SHORT[d.getDay()];
              const monthStr = MONTH_NAMES[d.getMonth()].substring(0, 3);
              const dateStr = `${monthStr} ${d.getDate()}`;
              const hasOutfit = !!combinedOutfitsData[d.toDateString()];
              const log = combinedOutfitsData[d.toDateString()];

              const ITEM_PITCH = 84;
              const inputRange = [
                (index - 2) * ITEM_PITCH,
                (index - 1) * ITEM_PITCH,
                index * ITEM_PITCH,
                (index + 1) * ITEM_PITCH,
                (index + 2) * ITEM_PITCH,
              ];

              const scale = dateStripScrollX.interpolate({
                inputRange,
                outputRange: [1, 1, 1.15, 1, 1],
                extrapolate: "clamp",
              });

              const translateX = dateStripScrollX.interpolate({
                inputRange,
                outputRange: [5.7, 5.7, 0, -5.7, -5.7],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={d.toISOString()}
                  style={{
                    alignItems: "center",
                    width: 78,
                    marginHorizontal: 3,
                    marginTop: 20,
                    // alignItems: "center",
                    justifyContent: "center",
                    transform: [{ translateX }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      handleDaySelect(d);
                      dateStripRef.current?.scrollTo({
                        x: index * ITEM_PITCH,
                        animated: true,
                      });
                      if (!hasOutfit) {
                        setIsAddOutfitModalVisible(true);
                      }
                    }}
                    activeOpacity={0.8}
                    style={{ alignItems: "center", width: 78 }}
                  >
                    {/* Dot indicator for Today */}
                    <View
                      style={{
                        height: 8,
                        // marginBottom: 4,
                        alignItems: "center",
                        justifyContent: "center",
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
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#9CA3AF",
                        marginBottom: 8,
                      }}
                    >
                      {dateStr}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginBottom: 10,
                      }}
                    >
                      <IconCloudRain
                        size={14}
                        color={isToday ? "#111827" : "#9CA3AF"}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#111827",
                          fontWeight: "600",
                        }}
                      >
                        29°
                      </Text>
                      <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                        26°
                      </Text>
                    </View>

                    {/* Card */}
                    <Animated.View
                      style={{
                        width: 80,
                        height: 120,
                        marginTop: 4,
                        borderRadius: 13,
                        backgroundColor: isToday ? "#FFFFFF" : "#F8F8FA",
                        borderWidth: isToday ? 0.5 : 0,
                        borderColor: "#E5E7EB",
                        shadowColor: isToday ? "#000" : "transparent",
                        shadowOpacity: isToday ? 0.08 : 0,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: isToday ? 2 : 0,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        marginBottom: 20,
                        transform: [{ scale }],
                      }}
                    >
                      {hasOutfit && log.imageUri ? (
                        <ExpoImage
                          source={{ uri: log.imageUri }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <IconCalendarPlus
                          size={26}
                          color="#00000080"
                          strokeWidth={1.5}
                        />
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        </View>

        {/* Empty State Body */}
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
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: "#666666",
              fontWeight: "400",
              marginTop: -45,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            No plans yet. {`\n`} Tap a date to style your day.
          </Text>
        </View>

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
          backgroundColor="#F3F4F6"
        >
          <View style={{ paddingHorizontal: 24 }}>
            {/* Header: Date and Weather */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                }}
              >
                <IconCalendar
                  size={18}
                  color="#111827"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    marginRight: 4,
                  }}
                >
                  {MONTH_NAMES[selected.getMonth()]} {selected.getFullYear()}
                </Text>
                <IconChevronDown size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                }}
              >
                <IconCloudRain
                  size={18}
                  color="#111827"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#111827",
                    marginRight: 4,
                  }}
                >
                  28°
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#9CA3AF" }}
                >
                  26°
                </Text>
              </View>
            </View>

            {/* Image Placeholder */}
            <TouchableOpacity
              style={{
                width: 110,
                height: 110,
                backgroundColor: "#E5E7EB",
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 2,
                  letterSpacing: 2,
                }}
              >
                ...
              </Text>
              <IconPlus size={26} color="#111827" strokeWidth={2} />
            </TouchableOpacity>

            {/* Caption Input */}
            <TextInput
              placeholder="add caption..."
              placeholderTextColor="#111827"
              value={caption}
              onChangeText={setCaption}
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 16,
                padding: 0,
              }}
            />

            {/* Occasion Pill */}
            <TouchableOpacity
              style={{
                backgroundColor: "#E5E7EB",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 100,
                alignSelf: "flex-start",
                marginBottom: 32,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}
              >
                occasion
              </Text>
            </TouchableOpacity>

            {/* Date and Time Dark Card */}
            <View
              style={{
                backgroundColor: "#1C1C1E",
                borderRadius: 24,
                padding: 20,
                flexDirection: "row",
                marginBottom: 28,
              }}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <IconCalendar
                    size={14}
                    color="#34C759"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: "#8E8E93",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Date
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    dd/mm/yy
                  </Text>
                  <IconChevronDown size={18} color="#636366" />
                </View>
              </View>

              <View
                style={{
                  width: 1,
                  backgroundColor: "#3A3A3C",
                  marginVertical: 4,
                }}
              />

              <View style={{ flex: 1, paddingLeft: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <IconClock
                    size={14}
                    color="#34C759"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: "#8E8E93",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Time
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    hh:mm
                  </Text>
                  <IconChevronDown size={18} color="#636366" />
                </View>
              </View>
            </View>

            {/* Notification Toggle */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
              >
                notification
              </Text>
              <Switch
                value={isNotificationEnabled}
                onValueChange={setIsNotificationEnabled}
                trackColor={{ false: "#D1D5DB", true: "#000000" }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                fontWeight: "500",
                paddingRight: 40,
                lineHeight: 20,
              }}
            >
              message show ho likho ki planner notifi kerdeyga 20min pehlay he
            </Text>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}
