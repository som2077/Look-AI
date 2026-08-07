import { create } from "zustand";

export interface CalendarPlan {
  images: string[];
  caption: string;
  time: Date;
  occasion: string;
  createdAt: Date;
}

interface CalendarPlanState {
  plannedOutfit: CalendarPlan | null;
  setPlannedOutfit: (plan: CalendarPlan | null) => void;
}

export const useCalendarPlanStore = create<CalendarPlanState>((set) => ({
  plannedOutfit: null,
  setPlannedOutfit: (plan) => set({ plannedOutfit: plan }),
}));
