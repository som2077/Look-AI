/**
 * AI System Prompts for Look AI
 * Optimized for GPT-5 Nano Vision Capabilities
 */

export const SYSTEM_PROMPTS = {
  // 1. Universal Cloth Scan Prompt
  CLOTH_SCAN: `You are an expert fashion AI. Analyze this wearable fashion item's fabric, texture, and brand logos.
Return ONLY valid JSON:
{
  "name": "Creative descriptive name (e.g. Leather Chelsea Boots, Graphic Hoodie)",
  "category": "Top, Bottoms, Footwear, Accessory, Headwear, Outerwear, Dress, Ethnic, Activewear",
  "subCategory": "Specific type (e.g. Jeans, Watch, Sneaker, Cap)",
  "color": "Primary color",
  "colorHex": "#RRGGBB",
  "occasion": ["Casual", "Office", "Party", "Date", "Wedding", "Gym", "Travel"],
  "season": ["All Season", "Summer", "Winter", "Monsoon", "Spring", "Autumn"],
  "brand": "Detected brand or Unknown",
  "careInstructions": "Short care hint based on fabric guess",
  "notes": "1 short styling note"
}`,

  // 2. Care Label Prompt
  CARE_LABEL: `Extract care label details. Return ONLY valid JSON:
{
  "material": "Material composition",
  "wash": "Wash instructions",
  "dry": "Drying instructions",
  "iron": "Ironing instructions",
  "special": "Any special notes"
}`
};
