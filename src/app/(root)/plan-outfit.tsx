import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconPhoto,
  IconShare,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import DatePicker from "react-native-date-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlanOutfitScreen() {
  const router = useRouter();
  const { imageUri, itemIds, ratio } = useLocalSearchParams<{
    imageUri: string;
    itemIds: string;
    ratio: string;
  }>();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(
    new Date(),
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const bottomSheetSlideAnim = React.useRef(new Animated.Value(400)).current;
  const bottomSheetFadeAnim = React.useRef(new Animated.Value(0)).current;
  const monthPickerSlideAnim = React.useRef(new Animated.Value(400)).current;
  const monthPickerFadeAnim = React.useRef(new Animated.Value(0)).current;

  const MONTH_NAMES = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    [],
  );
  const MONTH_FULL_NAMES = useMemo(
    () => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    [],
  );

  const calendarCurrentDate = useMemo(
    () => `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`,
    [currentYear, currentMonth],
  );

  React.useEffect(() => {
    if (showTimePicker) {
      Animated.parallel([
        Animated.timing(bottomSheetSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomSheetFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bottomSheetSlideAnim, {
          toValue: 400,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bottomSheetFadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showTimePicker]);

  React.useEffect(() => {
    if (showMonthPicker) {
      Animated.parallel([
        Animated.timing(monthPickerSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(monthPickerFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(monthPickerSlideAnim, {
          toValue: 400,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(monthPickerFadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showMonthPicker]);

  const addOutfit = useUserOutfitsStore((state) => state.addOutfit);

  const handleSaveToCalendar = () => {
    if (!selectedDate) {
      Alert.alert("Date Required", "Please select a date on the calendar.");
      return;
    }

    addOutfit({
      id: Date.now().toString(),
      imageUri,
      name: "My Outfit",
      items: itemIds ? itemIds.split(",") : [],
      createdAt: Date.now(),
      scheduledDate: selectedDate,
      scheduledTime: selectedTime
        ? selectedTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
      notes,
    });

    setIsModalVisible(false);

    // Show custom toast before navigating
    setToastMessage("Outfit added to calendar!");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage("");
        router.replace("/");
      });
    }, 1500);
  };

  const handleShare = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(imageUri);
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }
  };

  const handleSaveToGallery = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      try {
        await MediaLibrary.saveToLibraryAsync(imageUri);

        // Show Custom Toast
        setToastMessage("Saved to gallery");
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setToastMessage(""));
        }, 2500);
      } catch {
        Alert.alert("Error", "Failed to save image.");
      }
    } else {
      Alert.alert("Permission required", "Need permission to access gallery.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Toast Notification */}
      {!!toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <View style={styles.toastContent}>
            <View style={styles.toastIconContainer}>
              <IconCheck size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(root)/(tabs)")} style={{ padding: 4 }}>
          <IconArrowLeft size={24} color="#1D1A27" />
        </Pressable>
        <Text style={styles.headerTitle}>Publish Outfit</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Preview */}
        <View
          style={[
            styles.previewContainer,
            { aspectRatio: ratio === "1:1" ? 1 : 3 / 4 },
          ]}
        >
          <ExpoImage
            source={{ uri: imageUri }}
            style={styles.previewImage}
            contentFit="contain"
          />
        </View>

        {/* Primary Action */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            router.navigate({
              pathname: "/(tabs)/explore" as any,
              params: { attachedImage: imageUri },
            });
          }}
        >
          <Text style={styles.primaryButtonText}>Share to Explore</Text>
        </Pressable>

        {/* Secondary Actions */}
        <View style={styles.secondaryActionsGroup}>
          <Pressable
            style={styles.listButton}
            onPress={() => {
              if (imageUri) {
                router.push({
                  pathname: "/(root)/calendar",
                  params: { selectedImages: JSON.stringify([imageUri]) }
                });
              }
            }}
          >
            <View style={styles.listButtonLeft}>
              <IconCalendarEvent size={22} color="#1D1A27" />
              <Text style={styles.listButtonText}>Plan Future Outfit</Text>
            </View>
            <Text style={styles.listButtonSub}>Add to calendar</Text>
          </Pressable>
          <View style={styles.divider} />

          <Pressable style={styles.listButton} onPress={handleShare}>
            <View style={styles.listButtonLeft}>
              <IconShare size={22} color="#1D1A27" />
              <Text style={styles.listButtonText}>Share</Text>
            </View>
            <Text style={styles.listButtonSub}>Post or message</Text>
          </Pressable>
          <View style={styles.divider} />

          <Pressable style={styles.listButton} onPress={handleSaveToGallery}>
            <View style={styles.listButtonLeft}>
              <IconPhoto size={22} color="#1D1A27" />
              <Text style={styles.listButtonText}>Save to Gallery</Text>
            </View>
            <Text style={styles.listButtonSub}>Download to phone</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={"height"}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Plan Future Outfit</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={{ padding: 4 }}
              >
                <IconX size={24} color="#1D1A27" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.calendarWrapper}>
                <Calendar
                  key={calendarKey}
                  current={calendarCurrentDate}
                  onDayPress={(day: any) => setSelectedDate(day.dateString)}
                  onMonthChange={(month: any) => {
                    setCurrentYear(month.year);
                    setCurrentMonth(month.month - 1);
                  }}
                  markedDates={{
                    [selectedDate]: {
                      selected: true,
                      selectedColor: "#1D1A27",
                    },
                  }}
                  customHeaderTitle={
                    <TouchableOpacity
                      onPress={() => {
                        setPickerYear(currentYear);
                        setShowMonthPicker(true);
                      }}
                      style={styles.monthYearHeaderButton}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.monthYearHeaderText}>
                        {MONTH_FULL_NAMES[currentMonth]} {currentYear}
                      </Text>
                      <IconChevronDown size={16} color="#1D1A27" />
                    </TouchableOpacity>
                  }
                  theme={{
                    todayTextColor: "#1D1A27",
                    arrowColor: "#1D1A27",
                    textDayFontWeight: "600",
                    textMonthFontWeight: "800",
                    textDayHeaderFontWeight: "500",
                    textSectionTitleColor: "#9CA3AF",
                    selectedDayBackgroundColor: "#374151",
                    selectedDayTextColor: "#ffffff",
                    dayTextColor: "#1D1A27",
                    monthTextColor: "#1D1A27",
                  }}
                  renderArrow={(direction) => (
                    <View style={styles.calendarArrowContainer}>
                      {direction === "left" ? (
                        <IconChevronLeft size={16} color="#4B5563" />
                      ) : (
                        <IconChevronRight size={16} color="#4B5563" />
                      )}
                    </View>
                  )}
                />
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.sectionTitle}>Time </Text>
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={() => setShowTimePicker(true)}
                >
                  <IconClock size={20} color="#6B7280" />
                  <Text
                    style={
                      selectedTime
                        ? styles.timeText
                        : styles.timeTextPlaceholder
                    }
                  >
                    {selectedTime
                      ? selectedTime.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Add time"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Write some details... (e.g. For Friday's party)"
                  placeholderTextColor="#999"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.planButton}
                onPress={handleSaveToCalendar}
              >
                <Text style={styles.planButtonText}>+ Plan Future Outfit</Text>
              </Pressable>
            </View>

            {/* Custom Bottom Sheet for Time Picker - Absolute Overlay */}
            <Animated.View
              pointerEvents={showTimePicker ? "auto" : "none"}
              style={[
                StyleSheet.absoluteFillObject,
                { zIndex: 9999, elevation: 9999, opacity: bottomSheetFadeAnim },
              ]}
            >
              <View style={styles.bottomSheetOverlay}>
                <TouchableOpacity
                  style={styles.bottomSheetDismissArea}
                  onPress={() => setShowTimePicker(false)}
                  activeOpacity={1}
                />
                <Animated.View
                  style={[
                    styles.bottomSheetContainer,
                    { transform: [{ translateY: bottomSheetSlideAnim }] },
                  ]}
                >
                  <View style={styles.bottomSheetHeader}>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.bottomSheetTitle}>Select Time</Text>
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text style={styles.bottomSheetDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <DatePicker
                    date={selectedTime || new Date()}
                    mode="time"
                    onDateChange={(date) => {
                      setSelectedTime(date);
                    }}
                    // @ts-ignore
                    textColor="#1D1A27"
                    theme="light"
                    locale="en-US"
                    style={{ alignSelf: "center", height: 200, width: 300 }}
                  />
                </Animated.View>
              </View>
            </Animated.View>

            {/* Month/Year Picker Bottom Sheet */}
            <Animated.View
              pointerEvents={showMonthPicker ? "auto" : "none"}
              style={[
                StyleSheet.absoluteFillObject,
                { zIndex: 10000, elevation: 10000, opacity: monthPickerFadeAnim },
              ]}
            >
              <View style={styles.bottomSheetOverlay}>
                <TouchableOpacity
                  style={styles.bottomSheetDismissArea}
                  onPress={() => setShowMonthPicker(false)}
                  activeOpacity={1}
                />
                <Animated.View
                  style={[
                    styles.bottomSheetContainer,
                    { transform: [{ translateY: monthPickerSlideAnim }] },
                  ]}
                >
                  <View style={styles.bottomSheetHeader}>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.bottomSheetTitle}>Select Month</Text>
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <TouchableOpacity
                        onPress={() => setShowMonthPicker(false)}
                      >
                        <Text style={styles.bottomSheetDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Year Row */}
                  <View style={styles.yearRow}>
                    <TouchableOpacity
                      onPress={() => setPickerYear((y) => y - 1)}
                      style={styles.yearArrow}
                    >
                      <IconChevronLeft size={20} color="#4B5563" />
                    </TouchableOpacity>
                    <Text style={styles.yearText}>{pickerYear}</Text>
                    <TouchableOpacity
                      onPress={() => setPickerYear((y) => y + 1)}
                      style={styles.yearArrow}
                    >
                      <IconChevronRight size={20} color="#4B5563" />
                    </TouchableOpacity>
                  </View>

                  {/* Month Grid 4x3 */}
                  <View style={styles.monthGrid}>
                    {MONTH_NAMES.map((name, index) => {
                      const isSelected =
                        index === currentMonth && pickerYear === currentYear;
                      return (
                        <TouchableOpacity
                          key={name}
                          style={[
                            styles.monthCell,
                            isSelected && styles.monthCellSelected,
                          ]}
                          onPress={() => {
                            setCurrentMonth(index);
                            setCurrentYear(pickerYear);
                            setCalendarKey((k) => k + 1);
                            setShowMonthPicker(false);
                          }}
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.monthCellText,
                              isSelected && styles.monthCellTextSelected,
                            ]}
                          >
                            {name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              </View>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
  },
  scrollContent: {
    padding: 20,
  },
  previewContainer: {
    width: "100%",
    // backgroundColor: "#F3F4F6",
    borderRadius: 24,
    marginBottom: 20,
    // padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  primaryButton: {
    backgroundColor: "#1D1A27",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryActionsGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  listButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1A27",
  },
  listButtonSub: {
    fontSize: 13,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    color: "#1D1A27",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  calendarWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  calendarArrowContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  timeSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  timeText: {
    fontSize: 16,
    color: "#1D1A27",
    fontWeight: "500",
  },
  timeTextPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  modalFooter: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  planButton: {
    backgroundColor: "#1D1A27",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  planButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D1A27",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    gap: 12,
  },
  toastIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheetDismissArea: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1A27",
  },
  bottomSheetDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  monthYearHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  monthYearHeaderText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1D1A27",
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 8,
    marginBottom: 8,
  },
  yearArrow: {
    padding: 8,
  },
  yearText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
    minWidth: 60,
    textAlign: "center",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  monthCell: {
    width: "25%",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  monthCellSelected: {
    backgroundColor: "#1D1A27",
  },
  monthCellText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
  },
  monthCellTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
