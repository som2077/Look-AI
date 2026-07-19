export interface CareSymbol {
  id: string;
  category:
    | "washing"
    | "bleaching"
    | "drying"
    | "ironing"
    | "professional_care"
    | "wringing";
  label: string;
  description: string;
}

export const CARE_SYMBOLS: CareSymbol[] = [
  // Washing
  {
    id: "wash_normal",
    category: "washing",
    label: "Machine Wash (normal)",
    description:
      "Garment can be washed using hot water, detergent, agitation, and any machine designed for garment washing.",
  },
  {
    id: "wash_cold_30",
    category: "washing",
    label: "Machine Wash (cold)",
    description: "Rinsing normal, spinning reduced. (max 30°C / 85°F)",
  },
  {
    id: "wash_warm_40",
    category: "washing",
    label: "Machine Wash (warm)",
    description: "Rinsing normal, spinning normal. (max 40°C / 100°F)",
  },
  {
    id: "wash_hot_50",
    category: "washing",
    label: "Machine Wash (hot)",
    description: "Rinsing normal, spinning normal. (max 50°C / 120°F)",
  },
  {
    id: "wash_hot_60",
    category: "washing",
    label: "Machine Wash (hot)",
    description: "Rinsing normal, spinning normal. (max 60°C / 140°F)",
  },
  {
    id: "wash_hot_70",
    category: "washing",
    label: "Machine Wash (hot)",
    description: "Rinsing normal, spinning normal. (max 70°C / 160°F)",
  },
  {
    id: "wash_hot_95",
    category: "washing",
    label: "Machine Wash (hot)",
    description: "Rinsing normal, spinning normal. (max 95°C / 200°F)",
  },
  {
    id: "wash_permanent_press",
    category: "washing",
    label: "Machine Wash (permanent press)",
    description:
      "Machine washed only on the setting designed to preserve permanent press, with cold rinse prior to reduced spin. [1 bar underneath]",
  },
  {
    id: "wash_gentle",
    category: "washing",
    label: "Machine Wash (gentle or delicate)",
    description:
      "Machine washed only on the setting designed for gentle agitation and reduced time for delicate items. [2 bars underneath]",
  },
  {
    id: "wash_hand",
    category: "washing",
    label: "Hand Wash",
    description:
      "Washed through the use of water, detergent, and hand manipulation only.",
  },
  {
    id: "wash_do_not",
    category: "washing",
    label: "Do Not Wash",
    description:
      "Garment can't be safely washed by any process; professional cleaning applies instead.",
  },

  // Bleaching
  {
    id: "bleach_allowed",
    category: "bleaching",
    label: "Bleaching is allowed",
    description:
      "Any commercially available bleaching agent can be used. Plain triangle.",
  },
  {
    id: "bleach_chlorine_only",
    category: "bleaching",
    label: "Only chlorine bleaching is allowed",
    description:
      "Only chlorine bleaching agent can be used. Triangle with 'Cl'.",
  },
  {
    id: "bleach_non_chlorine_only",
    category: "bleaching",
    label: "Only non-chlorine bleaching is allowed",
    description:
      "Only non-chlorine, color-safe bleaching agent can be used. Triangle with two diagonal lines inside.",
  },
  {
    id: "bleach_not_allowed",
    category: "bleaching",
    label: "Bleaching is not allowed",
    description:
      "Bleaching agent can't be used — garment is not colorfast or structurally able to withstand bleach. Filled/crossed triangle.",
  },

  // Drying
  {
    id: "dry_tumble_normal",
    category: "drying",
    label: "Tumble dry (normal)",
    description:
      "Machine dryer used at the hottest available temperature setting. Circle inside a square, no dots.",
  },
  {
    id: "dry_tumble_low",
    category: "drying",
    label: "Tumble dry (normal, low heat)",
    description: "Machine dryer used at a low heat setting. [1 dot]",
  },
  {
    id: "dry_tumble_medium",
    category: "drying",
    label: "Tumble dry (normal, medium heat)",
    description: "Machine dryer used at a medium heat setting. [2 dots]",
  },
  {
    id: "dry_tumble_high",
    category: "drying",
    label: "Tumble dry (normal, high heat)",
    description: "Machine dryer used at a high heat setting. [3 dots]",
  },
  {
    id: "dry_tumble_no_heat",
    category: "drying",
    label: "Tumble dry (normal, no heat)",
    description:
      "Machine dryer used at no heat / air-only setting. Solid filled circle.",
  },
  {
    id: "dry_tumble_permanent_press",
    category: "drying",
    label: "Tumble dry (permanent press)",
    description:
      "Machine dryer used at the permanent press setting. [1 bar underneath]",
  },
  {
    id: "dry_tumble_gentle",
    category: "drying",
    label: "Tumble dry (gentle)",
    description:
      "Machine dryer used at the gentle setting. [2 bars underneath]",
  },
  {
    id: "dry_no_tumble",
    category: "drying",
    label: "Do not tumble dry",
    description:
      "Machine dryer not used. Usually accompanied by an alternate drying method symbol.",
  },
  {
    id: "dry_do_not",
    category: "drying",
    label: "Do not dry",
    description:
      "No drying method at all. Usually accompanied by an alternate care instruction.",
  },
  {
    id: "dry_line",
    category: "drying",
    label: "Line dry",
    description:
      "Hang wet garment from a bar/line, indoors or outdoors, to air dry.",
  },
  {
    id: "dry_drip",
    category: "drying",
    label: "Drip dry",
    description:
      "Hang dripping-wet garment from a bar, indoors or outdoors, without hand shaping or smoothing.",
  },
  {
    id: "dry_flat",
    category: "drying",
    label: "Dry flat",
    description: "Lay garment out horizontally for drying.",
  },
  {
    id: "dry_shade",
    category: "drying",
    label: "Dry in shade",
    description: "Can't dry in direct sunlight.",
  },

  // Ironing
  {
    id: "iron_any",
    category: "ironing",
    label: "Iron (any temperature, steam or dry)",
    description:
      "Ironing required, can be performed at any available temperature with or without steam.",
  },
  {
    id: "iron_low",
    category: "ironing",
    label: "Iron (low)",
    description:
      "Regular ironing, steam or dry, at low setting. (max 110°C / 230°F) [1 dot]",
  },
  {
    id: "iron_medium",
    category: "ironing",
    label: "Iron (medium)",
    description:
      "Regular ironing, steam or dry, at medium setting. (max 150°C / 300°F) [2 dots]",
  },
  {
    id: "iron_high",
    category: "ironing",
    label: "Iron (high)",
    description:
      "Regular ironing, steam or dry, at high setting. (max 200°C / 390°F) [3 dots]",
  },
  {
    id: "iron_no_steam",
    category: "ironing",
    label: "Do not steam",
    description:
      "Steam ironing will harm the garment, but regular dry ironing at the indicated setting is acceptable.",
  },
  {
    id: "iron_do_not",
    category: "ironing",
    label: "Do not iron",
    description:
      "Ironing not allowed — garment can't be smoothed or finished with an iron.",
  },

  // Professional Care
  {
    id: "dryclean_any",
    category: "professional_care",
    label: "Dry clean",
    description:
      "Dry cleaning in any solvent, any cycle, any moisture, any heat. Plain circle.",
  },
  {
    id: "dryclean_A",
    category: "professional_care",
    label: "Dry clean (any solvent)",
    description:
      "Dry cleaning in any solvent. Usually paired with other restriction symbols. Circle with 'A'.",
  },
  {
    id: "dryclean_P",
    category: "professional_care",
    label: "Dry clean (any solvent except trichloroethylene)",
    description:
      "Any dry cleaning solvent except trichloroethylene can be used — typically perchloroethylene, white spirit, or Solvent-113. Circle with 'P'.",
  },
  {
    id: "dryclean_P_gentle",
    category: "professional_care",
    label: "Dry clean, gentle (P solvent)",
    description:
      "Gentle dry cleaning process using P-restricted solvent. [1 bar underneath]",
  },
  {
    id: "dryclean_F",
    category: "professional_care",
    label: "Dry clean (petroleum solvent)",
    description:
      "Dry cleaning done using only petroleum solvent, usually with other restrictions. Circle with 'F'.",
  },
  {
    id: "dryclean_F_gentle",
    category: "professional_care",
    label: "Dry clean, gentle (F solvent)",
    description:
      "Gentle dry cleaning process using F-restricted (petroleum) solvent. [1 bar underneath]",
  },
  {
    id: "dryclean_reduced_moisture",
    category: "professional_care",
    label: "Dry clean (reduced moisture)",
    description:
      "Used together with A/P/F solvent restriction to indicate reduced moisture during the process.",
  },
  {
    id: "dryclean_short_cycle",
    category: "professional_care",
    label: "Dry clean (short cycle)",
    description:
      "Used together with A/P/F solvent restriction to indicate a shortened cleaning cycle.",
  },
  {
    id: "dryclean_no_steam",
    category: "professional_care",
    label: "Dry clean (no steam)",
    description:
      "Used together with A/P/F solvent restriction to indicate steam finishing must be skipped.",
  },
  {
    id: "dryclean_low_heat",
    category: "professional_care",
    label: "Dry clean (low heat)",
    description:
      "Used together with A/P/F solvent restriction to indicate a reduced-heat process.",
  },
  {
    id: "dryclean_do_not",
    category: "professional_care",
    label: "Do not dry clean",
    description: "Dry cleaning is not allowed. Crossed-out circle.",
  },
  {
    id: "wetclean_normal",
    category: "professional_care",
    label: "Professional wet cleaning",
    description:
      "Professional wet cleaning process using water-based technique under controlled conditions. Circle with 'W'.",
  },
  {
    id: "wetclean_gentle",
    category: "professional_care",
    label: "Professional wet cleaning, gentle",
    description: "Gentle professional wet cleaning process. [1 bar underneath]",
  },
  {
    id: "wetclean_very_gentle",
    category: "professional_care",
    label: "Professional wet cleaning, very gentle",
    description:
      "Very gentle professional wet cleaning process, minimal mechanical action. [2 bars underneath]",
  },
  {
    id: "wetclean_do_not",
    category: "professional_care",
    label: "Do not wet clean",
    description:
      "Professional wet cleaning is not allowed. Crossed-out circle with 'W'.",
  },

  // Wringing
  {
    id: "wring_do_not",
    category: "wringing",
    label: "Do not wring",
    description: "Wringing is not allowed.",
  },
];

export function serializeCareSymbolsForPrompt(): string {
  let output = "";
  let currentCategory = "";

  for (const symbol of CARE_SYMBOLS) {
    if (symbol.category !== currentCategory) {
      output += `## ${symbol.category}\n`;
      currentCategory = symbol.category;
    }
    output += `- ${symbol.id}: ${symbol.label} — ${symbol.description}\n`;
  }

  return output;
}
