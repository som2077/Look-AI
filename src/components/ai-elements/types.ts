/**
 * Shared types for AI Elements components.
 */

export type FromRole = "user" | "assistant" | "system";

export type MessageStatus = "streaming" | "ready" | "submitted" | "error";

export type ToolStatus = "pending" | "running" | "completed" | "error";

export type ChainOfThoughtStepStatus = "complete" | "active" | "pending";

export interface IconButtonProps {
  onPress?: () => void;
  label: string; // for accessibility / tooltip
  children: React.ReactNode;
  disabled?: boolean;
}

export interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
