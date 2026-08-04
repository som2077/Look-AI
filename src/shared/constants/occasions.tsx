import React from "react";
import {
  IconHanger,
  IconRun,
  IconBeach,
  IconMoon,
  IconBuilding,
  IconDiamond,
} from "@tabler/icons-react-native";

export type Occasion =
  | "Casual"
  | "Smart Casual"
  | "Business Casual"
  | "Formal"
  | "Office"
  | "College"
  | "Party"
  | "Wedding"
  | "Festive"
  | "Traditional"
  | "Date Night"
  | "Travel"
  | "Beach"
  | "Gym"
  | "Sports"
  | "Outdoor"
  | "Lounge"
  | "Sleepwear"
  | "Interview"
  | "All Occasion";

export const OCCASIONS: Occasion[] = [
  "Casual",
  "Smart Casual",
  "Business Casual",
  "Formal",
  "Office",
  "College",
  "Party",
  "Wedding",
  "Festive",
  "Traditional",
  "Date Night",
  "Travel",
  "Beach",
  "Gym",
  "Sports",
  "Outdoor",
  "Lounge",
  "Sleepwear",
  "Interview",
  "All Occasion",
];

export const getOccasionIcon = (label: string, color: string, size: number = 16) => {
  switch (label.toLowerCase()) {
    case "all occasions":
    case "all occasion":
      return <IconHanger size={size} color={color} />;
    case "gym":
    case "sports":
    case "outdoor":
      return <IconRun size={size} color={color} />;
    case "beach":
    case "travel":
      return <IconBeach size={size} color={color} />;
    case "sleepwear":
    case "lounge":
      return <IconMoon size={size} color={color} />;
    case "office":
    case "interview":
    case "business casual":
      return <IconBuilding size={size} color={color} />;
    case "party":
    case "wedding":
    case "date night":
    case "festive":
      return <IconDiamond size={size} color={color} />;
    default:
      return null;
  }
};
