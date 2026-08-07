import * as Notifications from "expo-notifications";

export async function scheduleOutfitPlanReminder(
  date: Date,
  _timeStr: string,
  outfitId: string,
  occasion: string,
) {
  // Parse timeStr (e.g., "9 AM", "12 PM") and date to get the exact Date object
  // For now, this is a placeholder stub
  const trigger = new Date(date);
  trigger.setHours(8, 0, 0, 0); // Morning of, at 8 AM

  if (trigger.getTime() < Date.now()) {
    return; // Already past
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Outfit Plan Reminder 👕",
      body: `You planned an outfit for ${occasion} today. Tap to confirm the weather and outfit!`,
      data: { outfitId, type: "planner_reminder" },
    },
    trigger: { date: trigger, type: Notifications.SchedulableTriggerInputTypes.DATE } as any,
  });

  // Day before reminder at 8 PM
  const dayBefore = new Date(trigger);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(20, 0, 0, 0);

  if (dayBefore.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Get ready for tomorrow!",
        body: `You have an outfit planned for ${occasion}.`,
        data: { outfitId, type: "planner_reminder" },
      },
      trigger: { date: dayBefore, type: Notifications.SchedulableTriggerInputTypes.DATE } as any,
    });
  }
}
