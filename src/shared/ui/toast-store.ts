import { create } from "zustand";

// ─── Toast store — lightweight app-wide notification surface ─────────────────
// Replaces the hand-rolled toasts in plan-outfit.tsx / outfit.tsx and the
// Alert.alert error surfacing. No native dependency; pure zustand + a provider.

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  /** Push a toast and return its id. Keeps only the 3 most recent. */
  push: (type: ToastType, message: string) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = nextToastId++;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, type, message }],
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/**
 * Convenience fire-and-forget: show a toast and auto-dismiss after `durationMs`.
 * Safe to call from hooks, stores, and event handlers (uses getState, not hooks).
 */
export function showToast(
  type: ToastType,
  message: string,
  durationMs = 3200,
): number {
  const id = useToastStore.getState().push(type, message);
  setTimeout(() => useToastStore.getState().dismiss(id), durationMs);
  return id;
}
