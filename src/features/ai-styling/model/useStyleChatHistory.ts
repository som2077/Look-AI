import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { namespacedAsyncStorage } from '@/shared/storage/namespacedStorage';

export interface SerializedMessage {
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  content: string;
  name?: string;
}

interface StyleChatHistoryState {
  messages: SerializedMessage[];
  lastUpdated: number;
  saveMessages: (messages: any[]) => void;
  getValidMessages: () => SerializedMessage[];
  clear: () => void;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const useStyleChatHistory = create<StyleChatHistoryState>()(
  persist(
    (set, get) => ({
      messages: [],
      lastUpdated: 0,
      saveMessages: (rawMessages) => {
        // Only save serializable messages (ignore live React elements, system prompts)
        const serializable = rawMessages
          .filter((m) => !m.$$typeof && m.role !== 'system' && typeof m.content === 'string')
          .map((m) => ({ role: m.role, content: m.content, name: m.name } as SerializedMessage));
        
        set({
          messages: serializable,
          lastUpdated: Date.now(),
        });
      },
      getValidMessages: () => {
        const { messages, lastUpdated } = get();
        if (Date.now() - lastUpdated > TWENTY_FOUR_HOURS_MS) {
          return [];
        }
        return messages;
      },
      clear: () => set({ messages: [], lastUpdated: 0 }),
    }),
    {
      name: 'look-ai-style-chat-history',
      storage: createJSONStorage(() => namespacedAsyncStorage),
    }
  )
);
