import { useSupabase } from "@/shared/supabase/use-supabase";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { UpcomingEvents } from "@/shared/ui/UpcomingEvents";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Calendar from "expo-calendar";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";

import {
  IconArrowLeft,
  IconChevronDown,
  IconPlus,
  IconShirt,
} from "@tabler/icons-react-native";

// ─── Constants & Types ────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_GAP = 7;
const PADDING = 20;
const CELL_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CELL_GAP * 6) / 7;

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

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface LoggedOutfit {
  title: string;
  wornTime: string;
  itemsWorn: string;
  itemCount: number;
  score: number;
  description: string;
  weather?: { condition: string; temp: string };
  imageUri?: string;
  isPlanned?: boolean;
}

// Predefined mock outfit logs mapping date string to details

// Helper checks if dates represent same calendar day
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Generates actual Date grids padding previous and next months
function buildCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // Sunday = 0

  const days: Date[] = [];

  // Padding previous month's final days
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Current month days
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Padding next month's starting days
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push(new Date(year, month + 1, d));
    }
  }

  return days;
}

// ─── Main Calendar Screen ─────────────────────────────────────────────────────

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deviceEvents, setDeviceEvents] = useState<Calendar.Event[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

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
      fetchOutfits();
    }

    return () => {
      isMounted = false;
    };
  }, [viewYear, viewMonth, supabase]);

  const plannedOutfits = useUserOutfitsStore((state) => state.outfits);

  const combinedOutfitsData = useMemo(() => {
    const combined = { ...loggedOutfitsData };
    plannedOutfits.forEach((outfit) => {
      if (outfit.scheduledDate) {
        // Find if date exists in combined, otherwise format it
        // The calendar uses JS Date(dateStr).toDateString() keys
        const parts = outfit.scheduledDate.split("-");
        // Create date at noon to avoid timezone shift issues
        const dateKey = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12).toDateString();
        combined[dateKey] = {
          title: outfit.name || "Plan your outfit",
          description: outfit.notes || "",
          wornTime: outfit.scheduledTime || "Anytime",
          itemsWorn: outfit.items?.length + " items",
          itemCount: outfit.items?.length || 0,
          score: 0,
          imageUri: outfit.imageUri,
          isPlanned: true,
        };
      }
    });
    return combined;
  }, [loggedOutfitsData, plannedOutfits]);

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        fetchDeviceEvents();
      }
    })();
  }, [viewYear, viewMonth]);

  const fetchDeviceEvents = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const visibleCalendars = calendars.filter(
        (c) => c.allowsModifications || c.source.type !== "local",
      );
      const calendarIds = visibleCalendars.map((c) => c.id);

      if (calendarIds.length > 0) {
        const startDate = new Date(viewYear, viewMonth, 1);
        const endDate = new Date(viewYear, viewMonth + 1, 0);

        const events = await Calendar.getEventsAsync(
          calendarIds,
          startDate,
          endDate,
        );
        setDeviceEvents(events);
      }
    } catch (e) {
      console.log("Error fetching calendar events:", e);
    }
  };

  const days = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 30 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50) {
            // swipe right -> previous month
            if (viewMonth === 0) {
              setViewMonth(11);
              setViewYear(viewYear - 1);
            } else {
              setViewMonth(viewMonth - 1);
            }
          } else if (gestureState.dx < -50) {
            // swipe left -> next month
            if (viewMonth === 11) {
              setViewMonth(0);
              setViewYear(viewYear + 1);
            } else {
              setViewMonth(viewMonth + 1);
            }
          }
        },
      }),
    [viewMonth, viewYear],
  );

  const handleDaySelect = useCallback((date: Date) => {
    setSelected(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, []);

  const onDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        handleDaySelect(selectedDate);
      }
    },
    [handleDaySelect],
  );

  const selectedLog = useMemo(() => {
    return combinedOutfitsData[selected.toDateString()];
  }, [selected, combinedOutfitsData]);

  const selectedDayEvents = useMemo(() => {
    return deviceEvents.filter((e) =>
      isSameDay(new Date(e.startDate), selected),
    );
  }, [selected, deviceEvents]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <AppGradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <StatusBar style="dark" />

          {/* Unified Top Header Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                // shadowColor: "#000",
                // shadowOpacity: 0.08,
                // shadowRadius: 8,
                // shadowOffset: { width: 0, height: 4 },
                // elevation: 2,
              }}
            >
              <IconArrowLeft size={22} color="#171421" />
            </TouchableOpacity>

            {/* Date Pill Selector */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F7F7F9",
                borderRadius: 30,
                padding: 4,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {/* Inner Calendar Icon Circle */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  // backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                  // shadowColor: "#000",
                  // shadowOpacity: 0.05,
                  // shadowRadius: 4,
                  // shadowOffset: { width: 0, height: 2 },
                  // elevation: 1,
                }}
              >
                <ExpoImage
                  source={{
                    uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
                  }}
                  style={{ width: 21, height: 21 }}
                  contentFit="contain"
                />
              </View>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1D1A27",
                  paddingHorizontal: 10,
                }}
              >
                {MONTH_NAMES[viewMonth]}, {viewYear}
              </Text>

              {/* Inner Chevron Circle */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                }}
              >
                <IconChevronDown size={18} color="#171421" />
              </View>
            </TouchableOpacity>

            {/* Plus Add Button */}
            <TouchableOpacity
              onPress={() => router.push("/(root)/log-outfit/camera" as never)}
              activeOpacity={0.8}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <IconPlus size={22} color="#171421" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
          >
            <Animated.View
              style={{
                paddingTop: 5,
                transform: [{ translateY: scrollY }],
                zIndex: 0,
              }}
            >
              {/* Days of Week Headers */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  marginBottom: CELL_GAP,
                }}
              >
                {DAY_LABELS.map((label, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: CELL_WIDTH,
                      height: CELL_WIDTH,
                      borderRadius: 12,
                      backgroundColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar days cells grid */}
              <View
                {...panResponder.panHandlers}
                style={{ paddingHorizontal: 20 }}
              >
                {Array.from({ length: days.length / 7 }, (_, weekIdx) => (
                  <View
                    key={weekIdx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: CELL_GAP,
                    }}
                  >
                    {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((date) => {
                      const isSelected = isSameDay(date, selected);
                      const isToday = isSameDay(date, today);
                      const isCurrentMonth = date.getMonth() === viewMonth;
                      const hasOutfit =
                        !!combinedOutfitsData[date.toDateString()];

                      const isPastOrToday =
                        new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate(),
                        ).getTime() <=
                        new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          today.getDate(),
                        ).getTime();
                      const isMissingOutfit = isPastOrToday && !hasOutfit;

                      const outfitData = combinedOutfitsData[date.toDateString()];

                      const dayEvents = deviceEvents.filter((e) =>
                        isSameDay(new Date(e.startDate), date),
                      );
                      const hasDeviceEvent = dayEvents.length > 0;

                      if (!isCurrentMonth) {
                        return (
                          <View
                            key={date.toISOString()}
                            style={{ width: CELL_WIDTH, height: CELL_WIDTH }}
                          />
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={date.toISOString()}
                          onPress={() => handleDaySelect(date)}
                          activeOpacity={0.8}
                          style={{
                            width: CELL_WIDTH,
                            height: CELL_WIDTH,
                            borderRadius: 12,
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: isSelected
                              ? "transparent"
                              : isToday
                                ? "#171421"
                                : "#E2E2EA",
                            backgroundColor: isSelected ? "#4C36F5" : "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isCurrentMonth ? 1 : 0.35,
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {hasOutfit && !!outfitData?.imageUri && (
                            <ExpoImage
                              source={{ uri: outfitData.imageUri }}
                              style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                opacity: isSelected ? 0.3 : 0.6,
                              }}
                              contentFit="cover"
                            />
                          )}
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isSelected ? "#FFFFFF" : "#171421",
                              zIndex: 1,
                            }}
                          >
                            {date.getDate()}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 3,
                              position: "absolute",
                              bottom: 5,
                              zIndex: 1,
                            }}
                          >
                            {hasDeviceEvent && (
                              <View
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: isSelected
                                    ? "#E2E2EA"
                                    : "#D97706",
                                }}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Timeline Log Section */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 24,
                paddingBottom: 300,
                backgroundColor: "#F7F7F9",
                minHeight: SCREEN_WIDTH * 1.5,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                zIndex: 10,
              }}
            >
              {selectedLog?.isPlanned ? (
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  {/* Left Column Time indicator */}
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#171421",
                      width: 60,
                      marginRight: 10,
                      marginTop: 6,
                    }}
                  >
                    {selectedLog.wornTime.split(" ")[0]}
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: "#9B9BAF",
                      }}
                    >
                      {" "}
                      {selectedLog.wornTime.split(" ")[1] || ""}
                    </Text>
                  </Text>
                  
                  {/* Right Cards Stack */}
                  <View style={{ flex: 1, gap: 12 }}>
                    <View
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 22,
                        borderWidth: 1,
                        borderColor: "#E2E2EA",
                        padding: 16,
                        shadowColor: "#000",
                        shadowOpacity: 0.01,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 1 },
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        {selectedLog.imageUri ? (
                          <ExpoImage
                            source={{ uri: selectedLog.imageUri }}
                            style={{
                              width: 50,
                              height: 65,
                              borderRadius: 10,
                              backgroundColor: "#F3F4F6",
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: 50,
                              height: 65,
                              borderRadius: 10,
                              backgroundColor: "#E5E7EB",
                            }}
                          />
                        )}
                        <View style={{ flex: 1, justifyContent: "center" }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: "#1D1A27",
                              marginBottom: 4,
                            }}
                          >
                            {selectedLog.title}
                          </Text>
                          {!!selectedLog.description && (
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#6B7280",
                                lineHeight: 18,
                              }}
                              numberOfLines={2}
                            >
                              {selectedLog.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ) : selectedLog ? (
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  {/* Left Column Time indicator */}
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#171421",
                      width: 60,
                      marginRight: 10,
                      marginTop: 6,
                    }}
                  >
                    {selectedLog.wornTime.split(" ")[0]}
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: "#9B9BAF",
                      }}
                    >
                      {" "}
                      {selectedLog.wornTime.split(" ")[1]}
                    </Text>
                  </Text>

                  {/* Right Cards Stack */}
                  <View style={{ flex: 1, gap: 12 }}>
                    {/* 1. Main log card description */}
                    <View
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 22,
                        borderWidth: 1,
                        borderColor: "#E2E2EA",
                        padding: 16,
                        shadowColor: "#000",
                        shadowOpacity: 0.01,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 1 },
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "800",
                              color: "#1D1A27",
                            }}
                          >
                            {selectedLog.title}
                          </Text>
                          {selectedLog.weather && (
                            <View>
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: "600",
                                  color: "#5A5A6A",
                                }}
                              >
                                {selectedLog.weather.condition === "Sunny"
                                  ? "☀️"
                                  : selectedLog.weather.condition === "Cloudy"
                                    ? "☁️"
                                    : "🌤️"}{" "}
                                {selectedLog.weather.temp}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 11,
                          color: "#5A5A6A",
                          marginTop: 4,
                          fontWeight: "500",
                        }}
                      >
                        {selectedLog.itemsWorn}
                      </Text>

                      <Text
                        style={{
                          fontSize: 11,
                          color: "#9B9BAF",
                          marginTop: 8,
                          lineHeight: 15,
                          fontWeight: "500",
                        }}
                      >
                        {selectedLog.description}
                      </Text>
                    </View>

                    {/* 2. Grid-like stats card */}
                    <LinearGradient
                      colors={["#EAE8FF", "#F4F3FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 22,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "#EAE8FF",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* Item count */}
                        <View>
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#9B9BAF",
                              fontWeight: "600",
                            }}
                          >
                            Items Worn
                          </Text>
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: "800",
                              color: "#4C36F5",
                              marginTop: 2,
                            }}
                          >
                            {selectedLog.itemCount}
                          </Text>
                        </View>

                        {/* Usage score */}
                        <View>
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#9B9BAF",
                              fontWeight: "600",
                            }}
                          >
                            Usage Score
                          </Text>
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: "800",
                              color: "#4C36F5",
                              marginTop: 2,
                            }}
                          >
                            {selectedLog.score}%
                          </Text>
                        </View>

                        {/* Small avatar thumbnail bubble */}
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: "#E2E2EA",
                          }}
                        >
                          <IconShirt size={18} color="#4C36F5" />
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              ) : (
                /* Empty logs timeline state */
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#171421",
                      width: 60,
                      marginRight: 10,
                      marginTop: 6,
                    }}
                  >
                    09:00
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: "#9B9BAF",
                      }}
                    >
                      {" "}
                      AM
                    </Text>
                  </Text>

                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      padding: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      height: 140,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#1D1A27",
                        marginBottom: 10,
                      }}
                    >
                      Plan your outfit
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#9B9BAF",
                        textAlign: "center",
                        fontWeight: "500",
                        marginBottom: 16,
                      }}
                    >
                      Get ahead of your schedule. Plan what you'll wear!
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push("/(root)/log-outfit/camera" as never)
                      }
                        style={{
                          backgroundColor: "#4C36F5",
                          paddingHorizontal: 20,
                          paddingVertical: 10,
                          borderRadius: 20,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                      <IconPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Plan Future Outfit
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Upcoming Events Section */}
            {selectedDayEvents.length > 0 && (
              <UpcomingEvents
                date={selected}
                showAISuggestion={true}
                preFetchedEvents={selectedDayEvents}
              />
            )}
          </Animated.ScrollView>
          {showDatePicker && (
            <DateTimePicker
              value={selected}
              mode="date"
              display="calendar"
              onChange={onDateChange}
            />
          )}
        </SafeAreaView>
      </AppGradientBackground>
    </View>
  );
}
