/**
 * useStreamingCaret — derives `{ lastAssistantId, isLastAssistantStreaming }`
 * from a `messages[]` array and an `isStreaming` flag.
 *
 * `messages` is the array returned by `useChat` from
 * `react-native-gen-ui`. Each entry is either a ReactElement (tool
 * output) or a ChatCompletionMessageParam ({role, content}).
 */
export function useStreamingCaret(
  messages: any[],
  isStreaming: boolean,
): { lastAssistantId: number; isLastAssistantStreaming: boolean } {
  // Find the last message that has role === "assistant".
  let lastAssistantId = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && !isReactNode(m) && m.role === "assistant") {
      lastAssistantId = i;
      break;
    }
  }
  const isLastAssistantStreaming =
    isStreaming && lastAssistantId === messages.length - 1;

  return { lastAssistantId, isLastAssistantStreaming };
}

// Re-exported from `react-native-gen-ui`'s isReactElement. We import
// the lib here so callers can keep using the same helper without
// adding another import.
import { isReactElement as isReactNode } from "react-native-gen-ui";
