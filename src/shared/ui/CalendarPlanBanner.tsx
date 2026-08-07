import {
  CalendarPlan,
  useCalendarPlanStore,
} from "@/features/calendar/model/calendar-plan-store";
import { getOccasionIcon } from "@/shared/constants/occasions";
import {
  IconClock,
  IconDots,
  IconEdit,
  IconTag,
  IconTrash,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function CalendarPlanBanner({
  onEdit,
  onRemove,
  title,
  plan,
}: {
  onEdit?: () => void;
  onRemove?: () => void;
  title?: string;
  plan: CalendarPlan;
}) {
  const [isPlanDropdownVisible, setIsPlanDropdownVisible] = useState(false);
  const setPlannedOutfit = useCalendarPlanStore((s) => s.setPlannedOutfit);

  if (!plan) return null;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        marginTop: title ? 20 : 0,
        marginBottom: 9,
      }}
    >
      {title && (
        <Text
          style={{
            fontSize: 19,
            fontWeight: "700",
            color: "#1D1A27",
            marginBottom: 10,
            marginLeft: 25,
          }}
        >
          {title}
        </Text>
      )}
      <View style={{ paddingHorizontal: title ? 10 : 0 }}>
        <View
          style={{
            backgroundColor: "#F8F8FA",
            borderRadius: 24,
            padding: 16,
            flexDirection: "row",
            position: "relative",
          }}
        >
          {/* Left Big Circle */}
          <View
            style={{
              marginRight: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getOccasionIcon(
                plan.occasion?.split(",")[0].trim() || "Occasion",
                "#111827",
                32,
              ) || <IconTag size={32} color="#111827" />}
            </View>
          </View>

          {/* Content Column */}
          <View style={{ flex: 1, paddingRight: 4 }}>
            {/* Row 1: Title + Pill + Dots */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 7,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#111827",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {plan.caption || "Hangout with friends..."}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {plan.createdAt
                      ? new Date(plan.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                      : "12:42 PM"}
                  </Text>
                </View>
                <View style={{ position: "relative", zIndex: 50 }}>
                  <TouchableOpacity
                    onPress={() =>
                      setIsPlanDropdownVisible(!isPlanDropdownVisible)
                    }
                  >
                    <IconDots size={20} color="#111827" />
                  </TouchableOpacity>
                  {isPlanDropdownVisible && (
                    <View
                      style={{
                        position: "absolute",
                        top: 25,
                        right: 0,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 8,
                        padding: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        zIndex: 50,
                        width: 130,
                      }}
                    >
                      {onEdit && (
                        <>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                            }}
                            onPress={() => {
                              setIsPlanDropdownVisible(false);
                              onEdit();
                            }}
                          >
                            <IconEdit size={18} color="#4B5563" />
                            <Text
                              style={{
                                marginLeft: 8,
                                fontSize: 14,
                                color: "#4B5563",
                                fontWeight: "500",
                              }}
                            >
                              Edit
                            </Text>
                          </TouchableOpacity>
                          <View
                            style={{
                              height: 1,
                              backgroundColor: "#F3F4F6",
                              marginVertical: 2,
                            }}
                          />
                        </>
                      )}
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 8,
                          paddingHorizontal: 8,
                        }}
                        onPress={() => {
                          setIsPlanDropdownVisible(false);
                          if (onRemove) {
                            onRemove();
                          } else {
                            setPlannedOutfit(null);
                          }
                        }}
                      >
                        <IconTrash size={18} color="#EF4444" />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 14,
                            color: "#EF4444",
                            fontWeight: "500",
                          }}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Row 2: Occasion */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <IconTag size={16} color="#111827" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#111827",
                  marginLeft: 6,
                }}
              >
                {plan.occasion || "Occasion"}
              </Text>
            </View>

            {/* Row 3: Date/Time + Cluster */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ExpoImage
                  source={{
                    uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
                  }}
                  style={{ width: 15, height: 15 }}
                  contentFit="contain"
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: "#111827",
                    marginLeft: 4,
                    marginRight: 12,
                  }}
                >
                  {new Date(plan.time).toLocaleDateString("en-GB")}
                </Text>

                <IconClock size={16} color="#111827" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                    marginLeft: 4,
                  }}
                >
                  {plan.time
                    ? new Date(plan.time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : "3:00 AM"}
                </Text>
              </View>

              {/* Cluster */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {plan.images && plan.images.length > 0 ? (
                  plan.images.slice(0, 5).map((uri: string, index: number) => (
                    <ExpoImage
                      key={index}
                      source={{ uri }}
                      contentFit="cover"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: "#F3F4F6",
                        marginLeft: index === 0 ? 0 : -15,
                        zIndex: 10 - index,
                        backgroundColor: "#D1D5DB",
                      }}
                    />
                  ))
                ) : (
                  <View style={{ flexDirection: "row" }}>
                    {[1, 2, 3, 4, 5].map((_, index) => (
                      <View
                        key={index}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: "#F3F4F6",
                          marginLeft: index === 0 ? 0 : -12,
                          zIndex: 10 - index,
                          backgroundColor: "#D1D5DB",
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
