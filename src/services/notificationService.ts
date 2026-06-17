import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

// ── Sound ─────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */
const CHIME_ASSET = require("../../assets/sounds/analysis-complete.wav");
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * React hook that returns a function to play the analysis-complete
 * chime + success haptic.
 *
 * The `useAudioPlayer` hook loads the audio source on mount.
 * When the returned function is called, it resets to the beginning
 * and plays the chime.
 *
 * Usage:
 * ```tsx
 * const notifyComplete = useAnalysisCompleteNotification();
 * // later…
 * notifyComplete();
 * ```
 */
export function useAnalysisCompleteNotification() {
  const player = useAudioPlayer(CHIME_ASSET);

  const notify = useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn("[NotificationService] failed to play chime:", err);
    }
  }, [player]);

  return notify;
}
