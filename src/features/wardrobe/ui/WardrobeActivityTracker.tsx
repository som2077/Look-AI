import { IconChevronDown, IconCircle } from "@tabler/icons-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface WardrobeActivityData {
  weekly: {
    day: string;
    isToday: boolean;
    progress: number;
    color: string;
  }[];
  today: {
    totalWorn: number;
    totalGoal: number;
    wornCount: number;
    wornGoal: number;
    totalClothesCount: number;
    totalClothesGoal: number;
    unwornCount: number;
    unwornGoal: number;
  };
  month?: {
    totalWorn: number;
    totalGoal: number;
    wornCount: number;
    wornGoal: number;
    totalClothesCount: number;
    totalClothesGoal: number;
    unwornCount: number;
    unwornGoal: number;
  };
  year?: {
    totalWorn: number;
    totalGoal: number;
    wornCount: number;
    wornGoal: number;
    totalClothesCount: number;
    totalClothesGoal: number;
    unwornCount: number;
    unwornGoal: number;
  };
  allTime?: {
    totalWorn: number;
    totalGoal: number;
    wornCount: number;
    wornGoal: number;
    totalClothesCount: number;
    totalClothesGoal: number;
    unwornCount: number;
    unwornGoal: number;
  };
}

// Helper to draw the semi-circle gauge
const GaugeArc = ({
  r,
  progress,
  color,
  strokeWidth = 20,
}: {
  r: number;
  progress: number;
  color: string;
  strokeWidth?: number;
}) => {
  const cx = 150;
  const cy = 160;
  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const pathLength = Math.PI * r;
  const offset = pathLength - progress * pathLength;

  return (
    <>
      {/* Background Track */}
      <Path
        d={pathD}
        stroke="#F2F2F7"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Foreground Track */}
      {progress > 0 && (
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${pathLength} ${pathLength}`}
          strokeDashoffset={offset}
        />
      )}
    </>
  );
};

export const WardrobeActivityTracker = ({
  data,
}: {
  data: WardrobeActivityData;
}) => {
  const { weekly, today } = data;
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Past 7 Days");

  const FILTER_OPTIONS = ["Past 7 Days", "This Month", "This Year", "All Time"];
  const selectedStats =
    selectedFilter === "This Month"
      ? (data.month ?? today)
      : selectedFilter === "This Year"
        ? (data.year ?? today)
        : selectedFilter === "All Time"
          ? (data.allTime ?? today)
          : today;

  const topProgress = Math.min(
    selectedStats.wornCount / (selectedStats.wornGoal || 1),
    1,
  );
  const bottomProgress = Math.min(
    selectedStats.totalClothesCount / (selectedStats.totalClothesGoal || 1),
    1,
  );
  const outerProgress = Math.min(
    selectedStats.unwornCount / (selectedStats.unwornGoal || 1),
    1,
  );
  const overallProgress = Math.round(
    (selectedStats.totalWorn / (selectedStats.totalGoal || 1)) * 100,
  );

  return (
    <View style={{ gap: 10 }}>
      {/* ─── Card 2: Today's Activity ─── */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 1,
          marginBottom: 16,
          marginTop: -15,

          zIndex: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 5,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}>
            Today&apos;s Outfits
          </Text>
          <View style={{ zIndex: 10 }}>
            <Pressable
              onPress={() => setDropdownVisible(!isDropdownVisible)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1D1A27" }}
              >
                {selectedFilter}
              </Text>
              <IconChevronDown size={20} color="#1D1A27" />
            </Pressable>

            {isDropdownVisible && (
              <View
                style={{
                  position: "absolute",
                  top: 32,
                  right: 0,
                  width: 150,
                  backgroundColor: "#FFF",
                  borderRadius: 12,
                  padding: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                  zIndex: 100,
                }}
              >
                {FILTER_OPTIONS.map((option, idx) => (
                  <Pressable
                    key={idx}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor:
                        selectedFilter === option ? "#F2F2F7" : "transparent",
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setSelectedFilter(option);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: selectedFilter === option ? "700" : "500",
                        color: "#1D1A27",
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Semi-Circle Gauge Chart */}
        <View style={{ alignItems: "center", height: 180, marginTop: 10 }}>
          <Svg width="100%" height={180} viewBox="0 0 300 180">
            {/* Arcs */}
            <GaugeArc
              r={150}
              progress={topProgress}
              color="#0BB5FF"
              strokeWidth={22}
            />
            <GaugeArc
              r={125}
              progress={bottomProgress}
              color="#9F55FF"
              strokeWidth={22}
            />
            <GaugeArc
              r={100}
              progress={outerProgress}
              color="#FFC043"
              strokeWidth={22}
            />

            {/* Center Text (Inside SVG to position cleanly over arcs) */}
            <View
              style={{
                position: "absolute",
                top: 90,
                left: 0,
                right: 0,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: "800",
                    color: "#1D1A27",
                    letterSpacing: -1,
                  }}
                >
                  {selectedStats.totalWorn}
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: "#8E8E93",
                    marginLeft: 4,
                  }}
                >
                  /{selectedStats.totalGoal}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "500",
                  color: "#1D1A27",
                  marginTop: -1,
                }}
              >
                Usage
              </Text>
            </View>
          </Svg>
        </View>

        {/* Metric Cards */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Worn */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#F7F7F9",
              borderRadius: 16,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                marginBottom: 8,
                justifyContent: "center",
              }}
            >
              <IconCircle size={20} color="#0BB5FF" strokeWidth={3} />
              <Text
                style={{ fontSize: 10, fontWeight: "600", color: "#1D1A27" }}
              >
                Worn Cloths
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                backgroundColor: "#FFFFFF",
                padding: 10,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}
              >
                {selectedStats.wornCount}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#8E8E93" }}
              >
                /{selectedStats.wornGoal}
              </Text>
            </View>
          </View>
          {/* Total Clothes */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#F7F7F9",
              borderRadius: 16,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                marginBottom: 8,
              }}
            >
              <IconCircle size={20} color="#9F55FF" strokeWidth={3} />
              <Text
                style={{ fontSize: 10, fontWeight: "600", color: "#1D1A27" }}
              >
                Total Cloths
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                backgroundColor: "#FFFFFF",
                padding: 10,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}
              >
                {selectedStats.totalClothesCount}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#8E8E93" }}
              >
                /{selectedStats.totalClothesGoal}
              </Text>
            </View>
          </View>
          {/* Unworn */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#F7F7F9",
              borderRadius: 16,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                marginBottom: 8,
                justifyContent: "center",
              }}
            >
              <IconCircle size={20} color="#FFC043" strokeWidth={3} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: "#1D1A27",
                  // marginLeft: ,
                }}
              >
                Unworn Cloths
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                backgroundColor: "#FFFFFF",
                padding: 10,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}
              >
                {selectedStats.unwornCount}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#8E8E93" }}
              >
                /{selectedStats.unwornGoal}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            paddingHorizontal: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: "#8E8E93",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 10, fontWeight: "700", color: "#8E8E93" }}
              >
                i
              </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#1D1A27" }}>
              You&apos;ve hit {overallProgress}% of your goal!
            </Text>
          </View>
          {/* <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#8E8E93" }}>
              Share
            </Text>
            <IconShare size={18} color="#8E8E93" />
          </Pressable> */}
        </View>
      </View>
    </View>
  );
};
