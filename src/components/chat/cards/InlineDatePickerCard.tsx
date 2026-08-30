// InlineDatePickerCard — calendar + time picker for the user to pick a
// date+time for an event, then auto-advance the chat to the next step.
//
// The AI tool passes `prompt_label` (e.g. "When is your date?") and
// `occasion` (e.g. "date night"). On confirm, we call onConfirm with
// `YYYY-MM-DD HH:MM`. The style-chat screen wires that into a follow-up
// "Maine <date> at <time> choose kiya" turn that the AI then answers.
//
// Date is selected via a horizontal week-strip (current week, Mon–Sun);
// time via the project's existing `react-native-date-picker` (mode="time").

import DatePicker from "react-native-date-picker";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function InlineDatePickerCard({
  data,
  onConfirm,
}: {
  data: any;
  onConfirm: (date: string, time?: string) => void;
}) {
  const { prompt_label, occasion } = data;

  // Anchor to today, 19:00. Real selection happens via the strip + picker.
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    return d;
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  // Build the 7-day strip anchored to the current week (Mon → Sun).
  const weekDays = useMemo(() => {
    const monday = new Date(today);
    const dow = (today.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    monday.setDate(today.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [today]);

  // Header label — the month/year of the selected date.
  const headerLabel = selectedDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleConfirm = () => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");
    const date = `${yyyy}-${mm}-${dd}`;
    const time = `${String(selectedTime.getHours()).padStart(2, "0")}:${String(
      selectedTime.getMinutes()
    ).padStart(2, "0")}`;
    onConfirm(date, time);
  };

  const formattedTime = selectedTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top bar — back / title / menu */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Text style={styles.iconGlyph}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Schedule</Text>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Text style={styles.iconGlyph}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Prompt + occasion (kept from the previous layout) */}
        {prompt_label ? <Text style={styles.promptText}>{prompt_label}</Text> : null}
        {occasion ? <Text style={styles.occasion}>For: {occasion}</Text> : null}

        {/* Month / year row with sparkle icon */}
        <View style={styles.monthRow}>
          <Text style={styles.monthText}>{headerLabel}</Text>
          <Text style={styles.sparkle}>✦</Text>
        </View>

        {/* Horizontal week strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((d, i) => {
            const isSelected =
              d.getFullYear() === selectedDate.getFullYear() &&
              d.getMonth() === selectedDate.getMonth() &&
              d.getDate() === selectedDate.getDate();
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                  ]}
                >
                  {DAY_LABELS[i]}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time row — tap to open the native time picker */}
        <TouchableOpacity
          style={styles.timeRow}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.timeLabel}>Time</Text>
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>🕒 {formattedTime}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Date & Time</Text>
        </TouchableOpacity>

        {pickerOpen && (
          <DatePicker
            date={selectedTime}
            onDateChange={(d) => {
              setSelectedTime(d);
              setPickerOpen(false);
            }}
            mode="time"
            theme="light"
            locale="en-US"
            is24hourSource="locale"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 12 },
  card: {
    backgroundColor: "#F0EFEC",
    borderRadius: 28,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: { fontSize: 16, color: "#1F1F1F", lineHeight: 18 },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F1F1F",
  },
  promptText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1F1F1F",
  },
  occasion: { fontSize: 12, color: "#6B7280", marginBottom: 10 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    marginRight: 6,
  },
  sparkle: { fontSize: 12, color: "#1F1F1F" },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayCell: {
    width: 40,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dayCellSelected: {
    backgroundColor: "#FFFFFF",
  },
  dayLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 6,
    fontWeight: "500",
  },
  dayLabelSelected: {
    color: "#1F1F1F",
  },
  dayNumber: {
    fontSize: 16,
    color: "#1F1F1F",
    fontWeight: "600",
  },
  dayNumberSelected: {
    color: "#1F1F1F",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  timeLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  timePill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timePillText: { fontSize: 14, color: "#111827", fontWeight: "600" },
  confirmBtn: {
    marginTop: 16,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
