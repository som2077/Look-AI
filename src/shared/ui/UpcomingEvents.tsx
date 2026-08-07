import * as Calendar from "expo-calendar";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface UpcomingEventsProps {
  date: Date;
  showAISuggestion?: boolean;
  preFetchedEvents?: Calendar.Event[];
}

export function UpcomingEvents({
  date,
  showAISuggestion = false,
  preFetchedEvents,
}: UpcomingEventsProps) {
  const [events, setEvents] = useState<Calendar.Event[]>([]);

  useEffect(() => {
    if (preFetchedEvents) {
      setEvents(preFetchedEvents);
      return;
    }

    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        fetchEventsForDate(date);
      }
    })();
  }, [date, preFetchedEvents]);

  const fetchEventsForDate = async (targetDate: Date) => {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const visibleCalendars = calendars.filter(
        (c) => c.allowsModifications || c.source.type !== "local",
      );
      const calendarIds = visibleCalendars.map((c) => c.id);

      if (calendarIds.length > 0) {
        const startDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
        );
        const endDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate() + 1,
        );

        const fetchedEvents = await Calendar.getEventsAsync(
          calendarIds,
          startDate,
          endDate,
        );

        // Filter events strictly for the target day to handle all-day events correctly
        const dayEvents = fetchedEvents.filter((e) => {
          const eStart = new Date(e.startDate);
          return (
            eStart.getFullYear() === targetDate.getFullYear() &&
            eStart.getMonth() === targetDate.getMonth() &&
            eStart.getDate() === targetDate.getDate()
          );
        });

        setEvents(dayEvents);
      }
    } catch (e) {
      console.log("Error fetching calendar events:", e);
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1D1A27",
          marginBottom: 10,
          marginLeft: 10,
        }}
      >
        Upcoming Events
      </Text>
      {events.map((event, idx) => (
        <View key={event.id} style={{ marginBottom: 8 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E2EA",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#1D1A27",
              }}
            >
              {event.title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#5A5A6A",
                marginTop: 4,
                fontWeight: "500",
              }}
            >
              {`${new Date(event.startDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${new Date(event.endDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
            </Text>
          </View>

          {/* AI Suggestion Box */}
          {showAISuggestion && idx === 0 && (
            <LinearGradient
              colors={["#F8F7FF", "#EAE8FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginTop: -8,
                marginLeft: 16,
                marginRight: 16,
                padding: 16,
                paddingTop: 20,
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                borderWidth: 1,
                borderTopWidth: 0,
                borderColor: "#EAE8FF",
                zIndex: -1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: -9,
                  marginLeft: -9,
                }}
              >
                <ExpoImage
                  source={require("@/assets/images/getStartedLogo.png")}
                  style={{ width: 70, height: 30 }}
                  contentFit="contain"
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: "#4A5568",
                  lineHeight: 18,
                  fontWeight: "500",
                }}
              >
                Based on &quot;{event.title}&quot;, consider a Smart Casual
                approach. A tailored navy blazer over a crisp white tee, paired
                with beige chinos.
              </Text>
            </LinearGradient>
          )}
        </View>
      ))}
    </View>
  );
}
