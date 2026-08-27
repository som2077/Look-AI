const fs = require('fs');
const path = '/home/som2077/.gemini/antigravity/brain/34ecfdd4-9312-40f2-812e-549e57f9b36c/task.md';
let content = fs.readFileSync(path, 'utf8');

// Simple string replacement to mark as done
content = content.replace(/- `\[ \]` \*\*Phase 1: Backend Setup/g, '- `[x]` **Phase 1: Backend Setup');
content = content.replace(/- `\[ \]` Create a new Edge Function: `supabase\/functions\/chat-stylist\/index.ts`./g, '- `[x]` Used existing `openai-proxy` for efficiency and streaming.');
content = content.replace(/- `\[ \]` Integrate `openai` SDK/g, '- `[x]` Integrated `openai` SDK');
content = content.replace(/- `\[ \]` Define strict JSON schemas/g, '- `[x]` Define strict JSON schemas');
content = content.replace(/- `\[ \]` `get_local_weather/g, '- `[x]` `get_local_weather');
content = content.replace(/- `\[ \]` `search_wardrobe/g, '- `[x]` `search_wardrobe');
content = content.replace(/- `\[ \]` `suggest_affiliate_items/g, '- `[x]` `suggest_affiliate_items');
content = content.replace(/- `\[ \]` Write the backend execution logic/g, '- `[x]` Write the backend execution logic (moved to frontend state for direct local db access)');

content = content.replace(/- `\[ \]` \*\*Phase 2: Frontend State Management\*\*/g, '- `[x]` **Phase 2: Frontend State Management**');
content = content.replace(/- `\[ \]` Create `src\/features\/chat\/model\/chat-store.ts`/g, '- `[x]` Created `useStylistChat.ts`');
content = content.replace(/- `\[ \]` Build the API client to connect/g, '- `[x]` Built the API client');

content = content.replace(/- `\[ \]` \*\*Phase 3: Building the Chat UI/g, '- `[x]` **Phase 3: Building the Chat UI');
content = content.replace(/- `\[ \]` Create the main chat screen: `src\/app\/\(root\)\/\(ai-features\)\/stylist-chat.tsx`./g, '- `[x]` Create the main chat screen: `src/app/(root)/(ai-features)/stylist-chat.tsx`.');
content = content.replace(/- `\[ \]` Build standard UI components:/g, '- `[x]` Build standard UI components:');
content = content.replace(/- `\[ \]` `<UserMessageBubble \/>`/g, '- `[x]` `<UserMessageBubble />`');
content = content.replace(/- `\[ \]` `<AITextBubble \/>`/g, '- `[x]` `<AITextBubble />`');
content = content.replace(/- `\[ \]` Build Custom Generative UI Components/g, '- `[x]` Build Custom Generative UI Components');
content = content.replace(/- `\[ \]` `<OutfitSuggestionCard \/>`/g, '- `[x]` `<OutfitSuggestionCard />`');
content = content.replace(/- `\[ \]` `<ShoppingSuggestionCard \/>`/g, '- `[x]` `<ShoppingSuggestionCard />`');

fs.writeFileSync(path, content);
