import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconCalendarEvent, IconChevronLeft, IconChevronRight, IconEdit } from "@tabler/icons-react-native";

interface PlannerDateTimeCardProps {
  initialDate?: Date;
  initialTime?: string;
  defaultExpanded?: boolean;
  onConfirm: (date: Date, time: string) => void;
}

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TIME_SLOTS = ["9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // Monday-based: Monday=0 … Sunday=6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ day: number; month: "prev" | "cur" | "next" }> = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: "prev" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: "cur" });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: "next" });
  }
  return cells;
}

export default function PlannerDateTimeCard({
  initialDate,
  initialTime,
  defaultExpanded = true,
  onConfirm,
}: PlannerDateTimeCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(initialTime);
  const [calMonth, setCalMonth] = useState(initialDate?.getMonth() ?? today.getMonth());
  const [calYear, setCalYear] = useState(initialDate?.getFullYear() ?? today.getFullYear());

  const expandAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const timeAnim = useRef(new Animated.Value(selectedDate ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  useEffect(() => {
    Animated.spring(timeAnim, {
      toValue: selectedDate ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [selectedDate]);

  const selectQuickDate = (label: string) => {
    const d = new Date(today);
    if (label === "Today") {
      // stays today
    } else if (label === "Tomorrow") {
      d.setDate(today.getDate() + 1);
    } else if (label === "This weekend") {
      const dow = today.getDay();
      const daysToSat = (6 - dow + 7) % 7 || 7;
      d.setDate(today.getDate() + daysToSat);
    }
    setSelectedDate(d);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
  };

  const selectCalendarDate = (day: number, monthType: "prev" | "cur" | "next") => {
    let m = calMonth;
    let y = calYear;
    if (monthType === "prev") { m--; if (m < 0) { m = 11; y--; } }
    if (monthType === "next") { m++; if (m > 11) { m = 0; y++; } }
    const d = new Date(y, m, day);
    if (d < today) return; // Past — disabled
    setSelectedDate(d);
    if (monthType !== "cur") { setCalMonth(m); setCalYear(y); }
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm(selectedDate, selectedTime);
      setExpanded(false);
    }
  };

  // Collapsed chip
  if (!expanded && selectedDate && selectedTime) {
    const dateLabel = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return (
      <View style={styles.collapsedWrap}>
        <View style={styles.collapsedChip}>
          <IconCalendarEvent size={15} color="#4B5563" />
          <Text style={styles.collapsedText}>{dateLabel} · {selectedTime}</Text>
          <Pressable onPress={() => setExpanded(true)} hitSlop={8}>
            <IconEdit size={15} color="#4F46E5" />
          </Pressable>
        </View>
      </View>
    );
  }

  const cells = buildCalendarDays(calYear, calMonth);
  const maxHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 520] });

  return (
    <Animated.View style={[styles.card, { maxHeight, overflow: "hidden" }]}>
      <Animated.View style={{ opacity: expandAnim }}>
        <Text style={styles.title}>When are you planning for?</Text>

        {/* Quick chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {["Today", "Tomorrow", "This weekend"].map((label) => (
            <Pressable key={label} style={styles.quickChip} onPress={() => selectQuickDate(label)}>
              <Text style={styles.quickChipText}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Calendar header */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={() => {
            let m = calMonth - 1, y = calYear;
            if (m < 0) { m = 11; y--; }
            setCalMonth(m); setCalYear(y);
          }} hitSlop={8}>
            <IconChevronLeft size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={styles.calMonthLabel}>{MONTHS[calMonth]} {calYear}</Text>
          <TouchableOpacity onPress={() => {
            let m = calMonth + 1, y = calYear;
            if (m > 11) { m = 0; y++; }
            setCalMonth(m); setCalYear(y);
          }} hitSlop={8}>
            <IconChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaderRow}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calGrid}>
          {cells.map((cell, i) => {
            const cellDate = new Date(
              cell.month === "prev" ? (calMonth === 0 ? calYear - 1 : calYear) : cell.month === "next" ? (calMonth === 11 ? calYear + 1 : calYear) : calYear,
              cell.month === "prev" ? (calMonth === 0 ? 11 : calMonth - 1) : cell.month === "next" ? (calMonth === 11 ? 0 : calMonth + 1) : calMonth,
              cell.day
            );
            const isPast = cellDate < today;
            const isToday = cellDate.getTime() === today.getTime();
            const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();
            const isFarFuture = (cellDate.getTime() - today.getTime()) > 14 * 86400000;
            const isOtherMonth = cell.month !== "cur";

            return (
              <Pressable
                key={i}
                style={[
                  styles.calCell,
                  isSelected && styles.calCellSelected,
                  isToday && !isSelected && styles.calCellToday,
                ]}
                onPress={() => !isPast && selectCalendarDate(cell.day, cell.month)}
              >
                <Text style={[
                  styles.calCellText,
                  isPast && styles.calCellTextPast,
                  isOtherMonth && styles.calCellTextOther,
                  isSelected && styles.calCellTextSelected,
                  isToday && !isSelected && styles.calCellTextToday,
                ]}>
                  {cell.day}
                </Text>
                {isFarFuture && !isSelected && (
                  <View style={styles.farFutureDot} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Time picker */}
        <Animated.View style={[styles.timePicker, {
          opacity: timeAnim,
          transform: [{ translateY: timeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }]}>
          <Text style={styles.subtitle}>Select Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {TIME_SLOTS.map((t) => (
              <Pressable
                key={t}
                style={[styles.timeChip, selectedTime === t && styles.timeChipSelected]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeChipText, selectedTime === t && styles.timeChipTextSelected]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Far future note */}
        {selectedDate && (selectedDate.getTime() - today.getTime()) > 14 * 86400000 && (
          <Text style={styles.estimateNote}>
            That&apos;s a while out — I&apos;ll give a seasonal estimate for now and refresh closer to the date.
          </Text>
        )}

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedDate || !selectedTime) && styles.confirmBtnDisabled]}
          disabled={!selectedDate || !selectedTime}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Date & Time</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#17181C",
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
  },
  title: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  subtitle: { color: "#9CA3AF", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  chipRow: { flexDirection: "row", marginBottom: 12 },
  quickChip: {
    backgroundColor: "#2D2E38",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
  },
  quickChipText: { color: "#E5E7EB", fontSize: 13, fontWeight: "500" },

  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calMonthLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  dayHeaderRow: { flexDirection: "row", marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: "center", color: "#6B7280", fontSize: 11, fontWeight: "600" },

  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calCellSelected: { backgroundColor: "#0D9488", borderRadius: 20 },
  calCellToday: { borderWidth: 1.5, borderColor: "#0D9488", borderRadius: 20 },
  calCellText: { color: "#E5E7EB", fontSize: 13, fontWeight: "500" },
  calCellTextPast: { color: "#374151" },
  calCellTextOther: { color: "#4B5563" },
  calCellTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  calCellTextToday: { color: "#0D9488", fontWeight: "700" },
  farFutureDot: { position: "absolute", bottom: 3, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#0D9488" },

  timePicker: { marginTop: 8, marginBottom: 4 },
  timeChip: {
    backgroundColor: "#2D2E38",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  timeChipSelected: { backgroundColor: "#0D9488" },
  timeChipText: { color: "#D1D5DB", fontSize: 13, fontWeight: "500" },
  timeChipTextSelected: { color: "#FFFFFF", fontWeight: "700" },

  estimateNote: { color: "#6B7280", fontSize: 11, fontStyle: "italic", marginVertical: 6 },

  confirmBtn: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  confirmBtnDisabled: { backgroundColor: "#1F2937" },
  confirmBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  collapsedWrap: { alignItems: "flex-end", marginVertical: 4 },
  collapsedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  collapsedText: { color: "#111827", fontSize: 13, fontWeight: "600" },
});
