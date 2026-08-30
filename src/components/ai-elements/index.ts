/**
 * Barrel export for AI Elements components.
 * Re-exports all public components and types.
 */

export { theme, colors, space, radii, font, motion, FONT_FAMILY } from "./theme";
export type { Theme } from "./theme";

export type {
  FromRole,
  MessageStatus,
  ToolStatus,
  ChainOfThoughtStepStatus,
  IconButtonProps,
  CollapsibleProps,
} from "./types";

export { StreamingCursor } from "./StreamingCursor";
export { Badge } from "./Badge";
export { Spinner } from "./Spinner";
export { IconButton } from "./IconButton";
export { Collapsible } from "./Collapsible";

export { Message } from "./Message";
export { MessageResponse } from "./MessageResponse";
export { MessageActions, MessageAction } from "./MessageActions";

export { Reasoning } from "./Reasoning";
export { Sources, Source } from "./Sources";
export { Tool } from "./Tool";
export { ToolHeader } from "./ToolHeader";
export { ToolContent } from "./ToolContent";
export { ToolInput } from "./ToolInput";
export { ToolOutput } from "./ToolOutput";

export { ChainOfThought, ChainOfThoughtStep } from "./ChainOfThought";

export { Loader } from "./Loader";

export { PromptInput } from "./PromptInput";
export { Conversation } from "./Conversation";

export { useScrollToBottom } from "./useScrollToBottom";
export { useStreamingCaret } from "./useStreamingCaret";
