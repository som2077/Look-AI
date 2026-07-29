import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";
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
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar as RNCalendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  IconArrowLeft,
  IconCalendarEvent,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconPlus,
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
const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        const dateKey = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          12,
        ).toDateString();
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
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <StatusBar style="dark" />

        {/* Unified Top Header Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            // paddingVertical: 10
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 22,
              backgroundColor: "#F9F9FB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconArrowLeft size={20} color="#111827" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
            Planner
          </Text>

          {/* Plus Add Button / Bookmark Button placeholder per request */}
          {/* Request: "time kya right end ma bookmark ka button lagao is say 3dots ma save ha uska replace hai , working same ho" */}
          {/* We'll add the bookmark button instead of the 3 dots. Wait, the 3 dots was in the Outfit detail. Here in Planner, the user said "time kya right end ma bookmark ka button lagao...". We'll put it here or wherever they meant. The plus button is here now. Let's just keep the Plus button as planner add for now, or use Bookmark if they meant here. */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/(ai-features)/planner-chat" as never)
            }
            activeOpacity={0.8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 22,
              backgroundColor: "#F9F9FB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPlus size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Weekly Date Picker */}
        <View
          style={{
            backgroundColor: "#F9F9FB90",
            borderRadius: 20,
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 10,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            // shadowColor: "#000",
            // shadowOpacity: 0.04,
            // shadowRadius: 8,
            // shadowOffset: { width: 0, height: 4 },
            // elevation: 1,
          }}
        >
          {/* Top Bar: Month/Year & Controls */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              marginBottom: 16,
            }}
          >
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
                style={{ fontSize: 15, fontWeight: "600", color: "#4B5563" }}
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <IconChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
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
                <IconChevronLeft size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  handleDaySelect(today);
                  setTimeout(() => {
                    const index = today.getDate() - 1;
                    const offset = Math.max(0, index * 54 - 30);
                    if (dateStripRef.current) {
                      dateStripRef.current.scrollTo({ x: offset, animated: true });
                    }
                  }, 100);
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#111827",
                  }}
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
                <IconChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Strip */}
          <View>
            <Animated.ScrollView
              ref={dateStripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            >
              {Array.from(
                { length: new Date(viewYear, viewMonth + 1, 0).getDate() },
                (_, i) => new Date(viewYear, viewMonth, i + 1),
              ).map((d) => {
                const isSelected = isSameDay(d, selected);
                return (
                  <TouchableOpacity
                    key={d.toISOString()}
                    onPress={() => handleDaySelect(d)}
                    activeOpacity={0.8}
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 72,
                      borderRadius: 22,
                      backgroundColor: isSelected ? "#000000" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isSelected ? "#FFFFFF" : "#6B7280",
                        marginBottom: 8,
                      }}
                    >
                      {DAY_LABELS_SHORT[d.getDay()]}
                    </Text>
                    {isSelected ? (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "#FFFFFF",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: "#000000",
                          }}
                        >
                          {d.getDate()}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          {d.getDate()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Animated.ScrollView>
          </View>
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
          {/* Timeline Section */}
          <View style={{ paddingRight: 20 }}>
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
              const displayHour = hour % 12 === 0 ? 12 : hour % 12;
              const amPm = hour >= 12 ? "pm" : "am";

              const outfitForThisHour = hour === 8 ? selectedLog : null;

              return (
                <View
                  key={hour}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Left Column Time marker */}
                  <View
                    style={{
                      width: 65,
                      alignItems: "flex-end",
                      paddingRight: 10,
                      marginTop: -3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: "#000000",
                      }}
                    >
                      {displayHour} {amPm}
                    </Text>
                  </View>

                  {/* Hour Slot */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#F9F9FB",
                      borderRadius: 10,
                      height: 70,
                      marginBottom: 2,
                      // borderWidth:0.1
                      // marginTop:10
                    }}
                  >
                    {/* Outfit Card if event exists */}
                    {outfitForThisHour && (
                      <View
                        style={{
                          marginTop: 6,
                          marginHorizontal: 8,
                          backgroundColor: "#F9FAFB",
                          borderRadius: 10,
                          padding: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#F3F4F6",
                        }}
                      >
                        {outfitForThisHour.imageUri ? (
                          <ExpoImage
                            source={{ uri: outfitForThisHour.imageUri }}
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 12,
                              backgroundColor: "#F3F4F6",
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 12,
                              backgroundColor: "#E5E7EB",
                            }}
                          />
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {outfitForThisHour.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6B7280",
                              marginTop: 4,
                            }}
                          >
                            🔥 {outfitForThisHour.score || 0}% •{" "}
                            {outfitForThisHour.itemsWorn}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#F3F4F6",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconEdit size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.ScrollView>

        {/* Custom Calendar Modal */}
        <Modal
          visible={isCalendarModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCalendarModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setIsCalendarModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableWithoutFeedback>
                <View
                  style={{
                    width: "90%",
                    backgroundColor: "#FFF",
                    borderRadius: 20,
                    overflow: "hidden",
                    padding: 16,
                  }}
                >
                  <RNCalendar
                    current={selected.toISOString().split("T")[0]}
                    onDayPress={(day: any) => {
                      const newDate = new Date(day.timestamp);
                      setSelected(newDate);
                      handleDaySelect(newDate);
                      setIsCalendarModalVisible(false);
                    }}
                    theme={{
                      todayTextColor: "#4F46E5",
                      selectedDayBackgroundColor: "#4F46E5",
                      selectedDayTextColor: "#ffffff",
                      arrowColor: "#111827",
                    }}
                    enableSwipeMonths={true}
                    hideExtraDays={true}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
