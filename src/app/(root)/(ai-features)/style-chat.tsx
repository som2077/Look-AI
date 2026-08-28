import { IconArrowNarrowUp } from "@tabler/icons-react-native";
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { OpenAI, isReactElement, useChat } from 'react-native-gen-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

// UI Components
import { AIBubble } from '@/components/chat/AIBubble';
import { QuickChipRow } from '@/components/chat/QuickChipRow';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { UserBubble } from '@/components/chat/UserBubble';

// Cards & Skeletons
import { CalendarDateCard } from '@/components/chat/cards/CalendarDateCard';
import { InlineDatePickerCard } from '@/components/chat/cards/InlineDatePickerCard';
import { OutfitSuggestionCard } from '@/components/chat/cards/OutfitSuggestionCard';
import { WeatherCard } from '@/components/chat/cards/WeatherCard';
import { CalendarSavingIndicator } from '@/components/chat/skeletons/CalendarSavingIndicator';
import { OutfitLoadingSkeleton } from '@/components/chat/skeletons/OutfitLoadingSkeleton';

const openAi = new OpenAI({
  apiKey: 'dummy-not-used', // Securely handled in Edge Function
  model: 'gpt-4o',
  basePath: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/style-chat`,
});

const systemPrompt = `
You are StyleAI — Look AI ka Hinglish fashion assistant.
Rules:
- Hinglish mein baat karo (Roman script).
- You MUST ALWAYS use the suggest_outfit tool to suggest outfits. DO NOT output outfit images or text as markdown in the chat bubble. Always call the tool.
- Organize suggestions logically by Top, Bottom, Footwear, Accessories.
- If you need to show weather or dates, call the 'show_weather' and 'show_date_picker' tools SEPARATELY. NEVER combine their names into a single call (e.g. do not invent "show_date_pickershow_weather").
`;

// Tracks live keyboard height so we can push the input bar above it reliably (Android + iOS)
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

export default function StyleChatScreen() {
  const flatListRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const { input, onInputChange, messages, isLoading, isStreaming, handleSubmit } = useChat({
    openAi,
    initialMessages: [{ role: 'system', content: systemPrompt }],
    tools: {
      show_weather: {
        description: 'Display current weather as a UI card.',
        parameters: z.object({
          city: z.string(),
          temperature: z.number(),
          condition: z.enum(['sunny','cloudy','rainy','humid','cold','windy','hazy','clear']),
          ai_tip: z.string().describe('One-line Hinglish styling tip'),
        }),
        render: (args) => ({
          data: args,
          component: <WeatherCard data={args} />,
        }),
      },
      suggest_outfit: {
        description: 'Suggest 1-3 outfit combinations logically organized by Top, Bottom, Footwear, Accessories from wardrobe.',
        parameters: z.object({
          occasion: z.string(),
          outfits: z.array(z.object({
            label: z.string(),
            items: z.array(z.object({
              name: z.string(),
              category: z.string(),
              image_url: z.string(),
            })),
            style_note: z.string(),
          })),
        }),
        render: async function* (args) {
          yield <OutfitLoadingSkeleton />;
          await new Promise(r => setTimeout(r, 1500));
          return {
            data: args,
            component: <OutfitSuggestionCard data={args} />,
          };
        },
      },
      show_date_picker: {
        description: 'Show inline calendar date picker so user can select a date.',
        parameters: z.object({
          prompt_label: z.string(),
          occasion: z.string().optional(),
        }),
        render: (args) => ({
          data: args,
          component: (
            <InlineDatePickerCard
              data={args}
              onConfirm={(date, time) => {
                handleSubmit(`Maine ${date} at ${time} choose kiya. Occasion: ${args.occasion || 'event'}`);
              }}
            />
          ),
        }),
      },
      show_calendar_date: {
        description: 'Show confirmed event date and save to calendar.',
        parameters: z.object({
          date: z.string(),
          time: z.string().optional(),
          title: z.string(),
          month_label: z.string(),
          day_number: z.number(),
          day_label: z.string(),
        }),
        render: async function* (args) {
          yield <CalendarSavingIndicator />;
          await new Promise(r => setTimeout(r, 1000));
          return {
            data: args,
            component: <CalendarDateCard data={args} />,
          };
        },
      },
    },
  });

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    if (isReactElement(item)) {
      return item;
    }

    if (item.role === 'user') {
      return <UserBubble key={index} text={item.content?.toString() || ''} />;
    }
    if (item.role === 'assistant' && item.content) {
      return <AIBubble key={index} text={item.content?.toString()} />;
    }
    return null;
  };

  const visibleMessages = messages.filter(m => isReactElement(m) || m.role !== 'system');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
        <FlatList
          style={{ flex: 1 }}
          ref={flatListRef}
          data={visibleMessages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isStreaming ? <TypingIndicator /> : null}
        />

        <QuickChipRow onSelect={(msg) => handleSubmit(msg)} />

        <View style={[
          styles.inputOuterContainer,
          { paddingBottom: Math.max(insets.bottom, 12) }
        ]}>
          <View style={styles.inputInnerContainer}>
            {/* <TouchableOpacity style={styles.plusBtn}>
              <IconPlusFilled size={18} color="#FFFFFF" />
            </TouchableOpacity> */}

            <TextInput
              style={styles.input}
              placeholder="Ask StyleAI..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={onInputChange}
              onSubmitEditing={() => handleSubmit(input)}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() ? '#1D1A27' : '#E5E7EB' }
              ]}
              onPress={() => handleSubmit(input)}
              disabled={!input.trim()}
            >
              <IconArrowNarrowUp
                strokeWidth={2.5}
                size={18}
                color={input.trim() ? '#FFFFFF' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { paddingVertical: 16 },
  inputOuterContainer: {
    paddingHorizontal: 25,
    // paddingTop: 5,
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
  },
  inputInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minHeight: 48,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1D1A27',
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});