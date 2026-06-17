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
}

const DayCell = React.memo(function DayCell({
  date,
  dayLabel,
  isActive,
  onPress,
}: DayCellProps) {
  const handlePress = useCallback(() => onPress(date), [onPress, date]);
  return (
    <Pressable
      className="items-center"
      accessibilityRole="button"
      accessibilityLabel={`Select ${date.toDateString()}`}
      onPress={handlePress}
    >
      <Text
        style={{
          fontSize: isActive ? 14 : 12,
          fontFamily: "TikTokSans16pt-Medium",
          color: isActive ? "#000000" : "#868693",
        }}
      >
        {dayLabel}
      </Text>
      <View
        className={`mt-2 items-center justify-center rounded-full  ${isActive ? "h-12 w-12" : "h-10 w-10"}`}
        style={
          isActive
            ? {
                backgroundColor: "#1D1A27",
                // shadowColor: "#000000",
                // shadowOpacity: 0.1,
                // shadowRadius: 3,
                // shadowOffset: { width: 0, height: 1.5 },
                // elevation: 2,
              }
            : {
                borderWidth: 1,
                borderColor: "#E9EBF8",
                backgroundColor: "#F8F9FC",
              }
        }
      >
        <Text
          style={{
            fontSize: isActive ? 15 : 13,
            fontFamily: "TikTokSans16pt-Bold",
            color: isActive ? "#FFFFFF" : "#1D1A27",
          }}
        >
          {date.getDate()}
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

  return (
    <View className="px-[5px] py-1">
      <View className="flex-row items-center justify-between">
        {weekDates.map((date, index) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            dayLabel={DAY_LABELS[index]}
            isActive={isSameDay(date, selectedDate)}
            onPress={handleSelectDate}
          />
        ))}
      </View>
    </View>
  );
}
