import { useWeeklyActivity } from "@/features/streaks/api/useWeeklyActivity";
import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import {
  getStartOfWeek,
  startOfDay,
  toLocalDateString,
} from "@/shared/utils/date";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

const DAY_LABELS: readonly string[] = ["M", "T", "W", "T", "F", "S", "S"];

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

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

  const isFuture = streakStatus === "future";

  let borderColor = "#C4C4C4";
  if (isFuture) borderColor = "transparent";
  else if (isActive) borderColor = "#1D1A27";
  else if (streakStatus === "streak") borderColor = "#22c55e90";
  else if (streakStatus === "missed") borderColor = "#ef444490";

  return (
    <Pressable
      style={{ alignItems: "center", gap: 6, width: 40 }}
      accessibilityRole="button"
      accessibilityLabel={`Select ${date.toDateString()}`}
      onPress={handlePress}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: isActive
            ? "TikTokSans16pt-Bold"
            : "TikTokSans16pt-Medium",
          color: isActive ? "#1D1A27" : isFuture ? "#00000090" : "#555555",
        }}
      >
        {String(date.getDate())}
      </Text>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 30,
          backgroundColor: isActive ? "#1D1A27" : "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: isActive || isFuture ? 0 : 1.5,
          borderStyle: isFuture ? "solid" : "dashed",
          borderColor,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: isActive
              ? "TikTokSans16pt-Bold"
              : "TikTokSans16pt-Medium",
            color: isActive ? "#FFFFFF" : isFuture ? "#00000090" : "#555555",
          }}
        >
          {dayLabel}
        </Text>
      </View>
    </Pressable>
  );
});

export function WeeklyCalendarStrip() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Real DB data: Set of "YYYY-MM-DD" strings for days app was opened
  const { activeDates } = useWeeklyActivity();
  // Local instant state
  const lastActiveDate = useStreakStore((state) => state.lastActiveDate);

  const weekDates = useMemo(() => {
    const startOfWeek = getStartOfWeek(selectedDate);
    return Array.from({ length: DAY_LABELS.length }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });
  }, [selectedDate]);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const today = useMemo(() => startOfDay(new Date()), []);

  return (
    <View className="px-[5px] py-1 mt-3">
      <View className="flex-row items-center justify-between">
        {weekDates.map((date, index) => {
          const dateAtMidnight = startOfDay(date);

          const diffTime = dateAtMidnight.getTime() - today.getTime();
          const diffDaysFromToday = Math.round(
            diffTime / (1000 * 60 * 60 * 24),
          );

          // Logic: check real DB data instead of estimating from streak count
          let streakStatus: "streak" | "missed" | "future";
          if (diffDaysFromToday > 0) {
            // Future day — not yet arrived
            streakStatus = "future";
          } else {
            // Past or today: check if user actually opened the app that day
            const dateStr = toLocalDateString(dateAtMidnight);
            streakStatus = (activeDates.has(dateStr) || lastActiveDate === dateStr) ? "streak" : "missed";
          }

          return (
            <DayCell
              key={toLocalDateString(date)}
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
