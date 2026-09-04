import { useStylistRuntime } from '@/features/chat/model/useStylistRuntime';
import { CalendarCard, OutfitCard } from '@/features/chat/ui/GenerativeCards';
import { StylistThread } from '@/features/chat/ui/StylistThread';
import { useUserWardrobeStore } from '@/features/wardrobe/model/user-wardrobe-store';
import { AssistantRuntimeProvider, makeAssistantTool } from '@assistant-ui/react-native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { z } from 'zod';

const WardrobeSearchTool = makeAssistantTool({
  toolName: "search_wardrobe",
  description: "Search the user's digital wardrobe for matching clothing items.",
  parameters: z.object({
    category: z.string().default("").describe("e.g., Top, Bottom, Outerwear, Footwear"),
    color: z.string().default("").describe("e.g., Black, White, Navy"),
    occasion: z.string().default("").describe("e.g., Casual, Formal, Workout, Date Night")
  }),
  execute: async (args) => {
    // Note: since this is executed out of band, we'll need to fetch store data directly
    const items = useUserWardrobeStore.getState().items;

    const matches = items.filter((item: any) => {
      let match = true;
      if (args.category && !item.category?.toLowerCase().includes(args.category.toLowerCase())) match = false;
      if (args.color && !item.primaryColor?.toLowerCase().includes(args.color.toLowerCase())) match = false;
      if (args.occasion && !item.occasion?.some((o: string) => o.toLowerCase().includes(args.occasion!.toLowerCase()))) match = false;
      return match;
    });

    const finalMatches = matches.slice(0, 4);
    return finalMatches;
  },
  render: ({ result }) => {
    if (!result) return null;
    return <OutfitCard items={result as any[]} />;
  }
});

const ScheduleEventTool = makeAssistantTool({
  toolName: "schedule_outfit_event",
  description: "Schedule an outfit for a specific date and time.",
  parameters: z.object({
    date: z.string(),
    time: z.string(),
    occasion: z.string(),
    outfit_id: z.string()
  }),
  execute: async (args) => {
    return args;
  },
  render: ({ args, result }) => {
    if (!result) return null;
    return <CalendarCard data={args} />;
  }
});

export default function StylistChatScreen() {
  const runtime = useStylistRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <StatusBar style="dark" />
      <StylistThread runtime={runtime} />
      <WardrobeSearchTool />
      <ScheduleEventTool />
    </AssistantRuntimeProvider>
  );
}
