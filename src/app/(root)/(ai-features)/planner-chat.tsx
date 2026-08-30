import OccasionStrip from "@/features/ai-styling/ui/OccasionStrip";
import PlannerDateTimeCard from "@/features/ai-styling/ui/PlannerDateTimeCard";
import PlannerOutfitCard, { SuggestedItem } from "@/features/ai-styling/ui/PlannerOutfitCard";
import WeatherCard, { WeatherData } from "@/features/ai-styling/ui/WeatherCard";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { trackAiUsage } from "@/shared/telemetry/ai-usage";
import { useUser } from "@clerk/clerk-expo";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IconArrowLeft, IconSend } from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────
type PlannerStep =
  | "date_picker"
  | "weather"
  | "occasion"
  | "wardrobe_loading"
  | "outfit"
  | "no_match"
  | "saved";

type PlannerContext = {
  date?: Date;
  time?: string;
  weather?: WeatherData;
  occasion?: string;
  clothes?: any[];
  suggestedItems?: SuggestedItem[];
};

type Message = {
  id: string;
  role: "user" | "model";
  text?: string;
  card?: "date_picker" | "weather" | "outfit" | "no_match";
  weather?: WeatherData;
  items?: SuggestedItem[];
  outfitReasoning?: string;
};

// ─── Loading labels per step ──────────────────────────────────────────────────
const LOADING_LABELS: Record<PlannerStep, string> = {
  date_picker: "",
  weather: "Checking the weather...",
  occasion: "",
  wardrobe_loading: "Checking your wardrobe...",
  outfit: "",
  no_match: "",
  saved: "",
};

// ─── Mock weather generator ───────────────────────────────────────────────────
function getMockWeather(date: Date): WeatherData {
  const m = date.getMonth();
  const isSummer = m >= 4 && m <= 9;
  const conditions = isSummer
    ? ["Sunny", "Partly Cloudy"]
    : ["Cloudy", "Rainy"];
  return {
    date: date.toDateString(),
    tempC: isSummer ? 28 + Math.floor(Math.random() * 8) : 14 + Math.floor(Math.random() * 8),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    rainPct: isSummer ? 15 + Math.floor(Math.random() * 25) : 45 + Math.floor(Math.random() * 40),
    windKmh: 6 + Math.floor(Math.random() * 18),
    stormPct: isSummer ? 8 + Math.floor(Math.random() * 18) : 20 + Math.floor(Math.random() * 30),
  };
}

// ─── API call to edge function ────────────────────────────────────────────────
// Goes through supabase.functions.invoke() so the Clerk "supabase" JWT is sent.
// planner-agent has verify_jwt = true — a raw ANON-key fetch would now 401.
async function callPlanner(
  supabase: SupabaseClient,
  step: string,
  context: any,
  user_message = "",
) {
  const { data, error } = await supabase.functions.invoke("planner-agent", {
    body: { step, context, user_message },
  });
  if (error) {
    const body = (error as any)?.context;
    const msg =
      body?.error ??
      (typeof body === "string" ? body : null) ??
      error.message ??
      "Failed to reach the styling assistant";
    throw new Error(msg);
  }
  if (!data?.success) throw new Error((data as any)?.error ?? "Unknown error");
  return data;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PlannerChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { supabase } = useSupabase();
  const { user } = useUser();
  const wardrobeItems = useUserWardrobeStore((state) => state.items);

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<PlannerStep>("date_picker");
  const [context, setContext] = useState<PlannerContext>({});
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const contextRef = useRef<PlannerContext>({});

  const pushCtx = (update: Partial<PlannerContext>) => {
    contextRef.current = { ...contextRef.current, ...update };
    setContext(contextRef.current);
  };

  const addMsg = (msg: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { id: Date.now().toString() + Math.random(), ...msg }]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages, isLoading]);

  // ── Boot ──
  useEffect(() => {
    if (params.date) {
      // Entry via "Plan Future Outfit" — date already known
      const preDate = new Date(params.date as string);
      const preTime = (params.time as string) ?? "9 AM";
      pushCtx({ date: preDate, time: preTime });
      addMsg({
        role: "model",
        card: "date_picker",
      });
      // Auto-trigger weather step
      setTimeout(() => runWeatherStep(preDate, preTime), 300);
    } else {
      // Entry via "+" — show date picker
      addMsg({
        role: "model",
        text: "Hey! What's the plan? Please select a date and time.",
      });
      addMsg({ role: "model", card: "date_picker" });
    }
  }, []);

  // ── Step: Weather ──────────────────────────────────────────────────────────
  const runWeatherStep = async (date: Date, time: string) => {
    setStep("weather");
    setIsLoading(true);
    const weather = getMockWeather(date);
    pushCtx({ weather });

    // Show weather card immediately
    addMsg({ role: "model", card: "weather", weather });

    try {
      const { text } = await callPlanner(supabase, "weather_text", {
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
        time,
        weather,
      });
      addMsg({ role: "model", text });
    } catch {
      addMsg({ role: "model", text: "Got the weather! Where are you heading to?" });
    } finally {
      setIsLoading(false);
      // Move to occasion step
      setTimeout(() => runOccasionStep(), 600);
    }
  };

  // ── Step: Occasion ─────────────────────────────────────────────────────────
  const runOccasionStep = async () => {
    setStep("occasion");
    setIsLoading(true);
    try {
      const ctx = contextRef.current;
      const { text } = await callPlanner(supabase, "ask_occasion", {
        date: ctx.date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        time: ctx.time,
        weather: ctx.weather,
      });
      addMsg({ role: "model", text });
    } catch {
      addMsg({ role: "model", text: "What's the occasion? Let me know so I can find the perfect outfit! 👇" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step: Wardrobe + Outfit ────────────────────────────────────────────────
  const runWardrobeStep = async (occasion: string) => {
    setStep("wardrobe_loading");
    setIsLoading(true);
    try {
      // Query wardrobe from local store instead of Supabase
      const clothes = wardrobeItems.slice(0, 20);

      pushCtx({ clothes });

      if (!clothes || clothes.length === 0) {
        // No items at all
        await runNoMatchStep(occasion, []);
        return;
      }

      // Pick top 2-4 items
      const suggested = clothes.slice(0, 4).map((c) => ({
        id: c.id,
        category: c.category,
        primaryColor: c.primaryColor ?? c.colorHex,
        imageUrl: c.imageUrl ?? c.originalImageUrl,
        brand: c.brand,
      }));

      pushCtx({ suggestedItems: suggested, occasion });

      const ctx = contextRef.current;
      const { text } = await callPlanner(supabase, "suggest_outfit", {
        date: ctx.date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
        time: ctx.time,
        occasion,
        weather: ctx.weather,
        clothes,
      });

      addMsg({
        role: "model",
        text,
        card: "outfit",
        items: suggested,
        outfitReasoning: text,
      });
      setStep("outfit");
    } catch (err: any) {
      console.error(err);
      addMsg({ role: "model", text: `Something went wrong: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const runNoMatchStep = async (occasion: string, _clothes: any[]) => {
    const ctx = contextRef.current;
    try {
      const { text } = await callPlanner(supabase, "no_wardrobe", { occasion, weather: ctx.weather });
      addMsg({ role: "model", text, card: "no_match" });
    } catch {
      addMsg({
        role: "model",
        text: "I couldn't find a perfect match in your wardrobe. Scan a new item and I'll suggest an outfit instantly!",
        card: "no_match",
      });
    } finally {
      setStep("no_match");
      setIsLoading(false);
    }
  };

  // ── Save Plan ──────────────────────────────────────────────────────────────
  const handleSavePlan = async () => {
    if (!supabase || !user) return;
    setIsSaving(true);
    const ctx = contextRef.current;
    try {
      await supabase.from("planned_events").insert({
        user_id: user.id,
        event_date: ctx.date?.toISOString().split("T")[0],
        event_time: ctx.time,
        occasion_label: ctx.occasion ?? "Casual",
        weather_snapshot: { type: "mock", ...ctx.weather },
        suggested_outfit_id: ctx.suggestedItems?.[0]?.id ?? null,
        status: "confirmed",
      });

      setStep("saved");
      const dateLabel = ctx.date?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      try {
        const { text } = await callPlanner(supabase, "plan_saved", {
          date: dateLabel,
          time: ctx.time,
          occasion: ctx.occasion,
        });
        addMsg({ role: "model", text });
      } catch {
        addMsg({ role: "model", text: "Plan saved! I'll send you a reminder the day before. 🎉" });
      }

      // Track AI usage for the profile section (fire-and-forget).
      void trackAiUsage("planner_chat", {
        occasion: ctx.occasion ?? null,
        date: ctx.date?.toISOString().split("T")[0] ?? null,
      });

      // Go back to calendar after 2.5 s
      setTimeout(() => router.back(), 2500);
    } catch (err: any) {
      addMsg({ role: "model", text: `Couldn't save: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  // ── User sends text ────────────────────────────────────────────────────────
  const handleSend = async () => {
    const txt = inputText.trim();
    if (!txt || isLoading) return;
    setInputText("");
    addMsg({ role: "user", text: txt });

    if (step === "occasion") {
      // Parse occasion from free text
      setIsLoading(true);
      try {
        const { occasion } = await callPlanner(supabase, "parse_occasion", {}, txt);
        const resolved = occasion ?? "Casual";
        pushCtx({ occasion: resolved });
        await runWardrobeStep(resolved);
      } catch {
        pushCtx({ occasion: "Casual" });
        await runWardrobeStep("Casual");
      }
    }
  };

  const handleOccasionChip = (occasion: string) => {
    addMsg({ role: "user", text: occasion });
    pushCtx({ occasion });
    runWardrobeStep(occasion);
  };

  const handleDateConfirm = (date: Date, time: string) => {
    pushCtx({ date, time });
    runWeatherStep(date, time);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconArrowLeft size={24} color="#1D1A27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Future Outfit</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat area */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            // ── Date Picker card ──
            if (msg.card === "date_picker") {
              return (
                <View key={msg.id} style={styles.aiBubbleWrap}>
                  <PlannerDateTimeCard
                    initialDate={context.date}
                    initialTime={context.time}
                    defaultExpanded={!context.date}
                    onConfirm={handleDateConfirm}
                  />
                </View>
              );
            }

            // ── Weather card ──
            if (msg.card === "weather" && msg.weather) {
              return (
                <View key={msg.id} style={styles.aiBubbleWrap}>
                  <WeatherCard weather={msg.weather} />
                </View>
              );
            }

            // ── Outfit card ──
            if (msg.card === "outfit") {
              return (
                <View key={msg.id} style={styles.aiBubbleWrap}>
                  <PlannerOutfitCard
                    items={msg.items ?? []}
                    reasoning={msg.outfitReasoning ?? ""}
                    onSave={handleSavePlan}
                    onRegenerate={() => {
                      const occ = contextRef.current.occasion ?? "Casual";
                      runWardrobeStep(occ);
                    }}
                    saving={isSaving}
                  />
                </View>
              );
            }

            // ── No-match CTA ──
            if (msg.card === "no_match") {
              return (
                <View key={msg.id} style={styles.aiBubbleWrap}>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiBubbleText}>{msg.text}</Text>
                  </View>
                  <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/(root)/(tabs)/scan" as any)}>
                    <Text style={styles.scanBtnText}>+ Scan Clothes</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            // ── AI text bubble ──
            if (msg.role === "model") {
              if (!msg.text) return null;
              return (
                <View key={msg.id} style={styles.aiBubbleWrap}>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiBubbleText}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            // ── User bubble ──
            return (
              <View key={msg.id} style={styles.userBubbleWrap}>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{msg.text}</Text>
                </View>
              </View>
            );
          })}

          {/* Loading indicator with contextual label */}
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0D9488" />
              {LOADING_LABELS[step] ? (
                <Text style={styles.loadingLabel}>{LOADING_LABELS[step]}</Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Occasion suggestion strip (docked above input) */}
        <OccasionStrip
          visible={step === "occasion" && !isLoading}
          onSelect={handleOccasionChip}
        />

        {/* Input bar */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder={step === "occasion" ? "Ya type karo..." : "Type a message..."}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isLoading && (step === "occasion")}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <IconSend size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 24 },

  aiBubbleWrap: { alignSelf: "flex-start", maxWidth: "90%", marginVertical: 4 },
  aiBubble: {
    backgroundColor: "#17181C",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aiBubbleText: { color: "#E5E7EB", fontSize: 14, lineHeight: 22 },

  userBubbleWrap: { alignSelf: "flex-end", maxWidth: "80%", marginVertical: 4 },
  userBubble: {
    backgroundColor: "#0D9488",
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubbleText: { color: "#FFFFFF", fontSize: 14, lineHeight: 22 },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginVertical: 8,
    marginLeft: 4,
    gap: 8,
  },
  loadingLabel: { color: "#6B7280", fontSize: 13, fontStyle: "italic" },

  scanBtn: {
    marginTop: 8,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  scanBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  inputArea: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#111827",
  },
  sendBtn: {
    backgroundColor: "#0D9488",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  sendBtnDisabled: { backgroundColor: "#D1FAE5" },
});
