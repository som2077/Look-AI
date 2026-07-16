import { useStreakStore } from "@/shared/store/useStreakStore";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface WeeklyCalendarStripProps {
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
}

const DAY_LABELS: readonly string[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const getStartOfWeek = (date: Date) => {
  const reference = new Date(date);
  reference.setHours(0, 0, 0, 0);

  const dayOfWeek = reference.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  reference.setDate(reference.getDate() + offset);

  return reference;
};

interface DayCellProps {
  date: Date;
  dayLabel: string;
  isActive: boolean;
  onPress: (date: Date) => void;
  streakStatus: "streak" | "missed" | "future";
}

const DayCell = React.memo(function DayCell({
  date,
  dayLabel,
  isActive,
  onPress,
  streakStatus,
}: DayCellProps) {
  const handlePress = useCallback(() => onPress(date), [onPress, date]);

  let borderColor = "#E9EBF8";
  if (streakStatus === "future") borderColor = "#000000";
  else if (streakStatus === "streak")
    borderColor = "#22c55e"; // green-500
  else if (streakStatus === "missed") borderColor = "#ef4444"; // red-500

  return (
    <Pressable
      style={{ alignItems: "center" }}
      accessibilityRole="button"
      accessibilityLabel={`Select ${date.toDateString()}`}
      onPress={handlePress}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: "TikTokSans16pt-Bold",
          color: isActive ? "#000000" : "#868693",
        }}
      >
        {dayLabel}
      </Text>
      {/* Fixed 48×48 container — no layout shift on selection */}
      <View
        style={{
          marginTop: 6,
          width: 40,
          height: 40,
          borderRadius: 100,
          alignItems: "center",
          justifyContent: "center",
          ...(isActive
            ? { backgroundColor: "#1D1A27" }
            : {
                borderWidth: 1.4,
                borderStyle: "dashed",
                borderColor,
                backgroundColor: "#FFFFFF",
              }),
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: "TikTokSans16pt-Bold",
            color: isActive ? "#FFFFFF" : "#1D1A27",
          }}
        >
          {String(date.getDate()).padStart(2, "0")}
        </Text>
      </View>
    </Pressable>
  );
});

export function WeeklyCalendarStrip({
  initialDate,
  onDateChange,
}: WeeklyCalendarStripProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ?? new Date(),
  );

  const currentStreak = useStreakStore((state) => state.currentStreak);

  const weekDates = useMemo(() => {
    const startOfWeek = getStartOfWeek(selectedDate);
    return Array.from({ length: DAY_LABELS.length }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });
  }, [selectedDate]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateChange?.(date);
    },
    [onDateChange],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <View className="px-[5px] py-1 mt-3">
      <View className="flex-row items-center justify-between">
        {weekDates.map((date, index) => {
          const dateAtMidnight = new Date(date);
          dateAtMidnight.setHours(0, 0, 0, 0);

          const diffTime = dateAtMidnight.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          let streakStatus: "streak" | "missed" | "future";
          if (diffDays > 0) {
            streakStatus = "future";
          } else if (-diffDays < currentStreak) {
            streakStatus = "streak";
          } else {
            streakStatus = "missed";
          }

          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              dayLabel={DAY_LABELS[index]}
              isActive={isSameDay(date, selectedDate)}
              onPress={handleSelectDate}
              streakStatus={streakStatus}
            />
          );
        })}
      </View>
    </View>
  );
}
