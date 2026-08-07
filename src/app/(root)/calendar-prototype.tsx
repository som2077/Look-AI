import { IconArrowLeft, IconX } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_EVENT_DURATION = 0.5; // 30 minutes

interface CalendarEvent {
  id: string;
  start: number; // in hours (e.g. 1.5 = 1:30 AM)
  end: number;
  title: string;
}

export default function CalendarPrototypeScreen() {
  const router = useRouter();

  // We'll just manage one draft event for this prototype
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Reanimated shared values for the draft event position and size
  const startY = useSharedValue(0);
  const eventHeight = useSharedValue(0);

  const createEventAtY = (y: number) => {
    // Snap to 30 min intervals
    const snapY = Math.floor(y / (HOUR_HEIGHT / 2)) * (HOUR_HEIGHT / 2);
    const startHour = snapY / HOUR_HEIGHT;

    startY.value = snapY;
    eventHeight.value = HOUR_HEIGHT; // Default 1 hour

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

  // Dragging the whole event body
  const panBody = Gesture.Pan()
    .onBegin(() => {
      runOnJS(setScrollEnabled)(false);
    })
    .onUpdate((e) => {
      const snapY =
        Math.round((startY.value + e.translationY) / (HOUR_HEIGHT / 2)) *
        (HOUR_HEIGHT / 2);
      if (snapY >= 0 && snapY + eventHeight.value <= 24 * HOUR_HEIGHT) {
        startY.value = snapY;
      }
    })
    .onFinalize(() => {
      runOnJS(updateDraftFromShared)();
      runOnJS(setScrollEnabled)(true);
    });

  // Dragging the bottom handle to resize
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

      if (startY.value + snapHeight <= 24 * HOUR_HEIGHT) {
        eventHeight.value = snapHeight;
      }
    })
    .onFinalize(() => {
      runOnJS(updateDraftFromShared)();
      runOnJS(setScrollEnabled)(true);
    });

  // Dragging the top handle to resize
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
        // keep minimum 30 mins
        startY.value = snapY;
        eventHeight.value = endY - snapY;
      }
    })
    .onFinalize(() => {
      runOnJS(updateDraftFromShared)();
      runOnJS(setScrollEnabled)(true);
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

  const animatedEventStyle = useAnimatedStyle(() => {
    return {
      top: startY.value,
      height: eventHeight.value,
    };
  });

  const formatTime = (hourNum: number) => {
    if (hourNum === 0 || hourNum === 24) return "12 AM";
    if (hourNum === 12) return "12 PM";
    const isHalf = hourNum % 1 !== 0;
    const baseHour = Math.floor(hourNum);
    const suffix = baseHour < 12 ? "AM" : "PM";
    const displayHour = baseHour % 12 === 0 ? 12 : baseHour % 12;
    const displayMin = isHalf ? ":30" : "";
    return `${displayHour}${displayMin} ${suffix}`;
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView edges={["top"]} className="bg-white z-10 shadow-sm">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 p-2 rounded-full active:bg-gray-100"
          >
            <IconArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">
            Outfit Calendar
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEnabled={scrollEnabled}
      >
        <View className="flex-row">
          {/* Time Column */}
          <View className="w-16 border-r border-gray-100 items-center pt-3">
            {HOURS.map((hour) => (
              <View
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="w-full pr-2 items-end"
              >
                {hour !== 0 && (
                  <Text className="text-xs text-gray-500 font-medium -mt-2.5">
                    {formatTime(hour)}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Grid Column */}
          <GestureDetector gesture={handleTap}>
            <View className="flex-1 relative bg-transparent">
              {HOURS.map((hour) => (
                <View
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="w-full border-b border-gray-100"
                />
              ))}

              {/* Draft Event Block */}
              {draftEvent && (
                <Animated.View
                  style={[styles.eventBlock, animatedEventStyle]}
                  className="absolute left-1 right-2 bg-blue-50 border border-blue-400 rounded-md shadow-sm"
                >
                  <GestureDetector gesture={panBody}>
                    <Animated.View className="flex-1 px-3 py-2 justify-center">
                      <Text className="text-blue-900 font-bold text-sm">
                        {draftEvent.title}
                      </Text>
                      <Text className="text-blue-700 text-xs mt-0.5">
                        {formatTime(draftEvent.start)} -{" "}
                        {formatTime(draftEvent.end)}
                      </Text>
                    </Animated.View>
                  </GestureDetector>

                  {/* Top Handle */}
                  <GestureDetector gesture={panTopHandle}>
                    <Animated.View style={styles.topHandle}>
                      <View style={styles.handleDot} />
                    </Animated.View>
                  </GestureDetector>

                  {/* Bottom Handle */}
                  <GestureDetector gesture={panBottomHandle}>
                    <Animated.View style={styles.bottomHandle}>
                      <View style={styles.handleDot} />
                    </Animated.View>
                  </GestureDetector>
                </Animated.View>
              )}
            </View>
          </GestureDetector>
        </View>
      </ScrollView>

      {/* Bottom Floating Button */}
      {draftEvent && (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <Pressable
            onPress={() => setModalVisible(true)}
            className="bg-gray-900 px-6 py-4 rounded-full shadow-lg flex-row items-center"
          >
            <Text className="text-white font-bold text-[15px]">
              Create Event
            </Text>
          </Pressable>
        </View>
      )}

      {/* Bottom Sheet Modal (Simplified for Prototype) */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 min-h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold">Add title</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <IconX size={20} color="#111827" />
              </Pressable>
            </View>

            <View className="flex-row gap-2 mb-8">
              <View className="bg-gray-200 px-4 py-2 rounded-lg">
                <Text className="font-medium text-gray-800">Event</Text>
              </View>
              <View className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                <Text className="font-medium text-gray-600">Outfit</Text>
              </View>
            </View>

            {draftEvent && (
              <View className="mb-6">
                <Text className="text-gray-500 mb-1 font-medium text-sm">
                  Time
                </Text>
                <Text className="text-lg font-bold text-gray-900">
                  {formatTime(draftEvent.start)} - {formatTime(draftEvent.end)}
                </Text>
              </View>
            )}

            <Pressable
              className="mt-auto bg-blue-600 py-4 rounded-xl items-center"
              onPress={() => {
                setModalVisible(false);
                setDraftEvent(null);
                // Here we would actually save the event
              }}
            >
              <Text className="text-white font-bold text-lg">Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  eventBlock: {
    zIndex: 10,
    overflow: "visible", // allow handles to overflow
  },
  topHandle: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  bottomHandle: {
    position: "absolute",
    bottom: -10,
    left: 0,
    right: 0,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  handleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6", // blue-500
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});
