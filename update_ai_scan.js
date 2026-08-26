const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// 1. Update LabelAnalysis interface
const interfaceOld = /export interface LabelAnalysis \{[\s\S]*?\n\}/;
const interfaceNew = `export interface LabelAnalysis {
  is_valid_apparel: boolean;
  rejection_reason: string | null;
  care_symbols: {
    id: string;
    category: string;
    label: string;
    confidence: "high" | "medium" | "low";
  }[];
  brand: string | null;
  instructions: string | null;
  label_standard_guess: "iso_ginetex" | "astm" | "unclear";
  needs_user_review: boolean;
  review_notes: string | null;
  error?: string;
}`;
file = file.replace(interfaceOld, interfaceNew);

// 2. Update LABEL_PROMPT
const promptOld = /const LABEL_PROMPT = `[\s\S]*?`;/;
const promptNew = `const LABEL_PROMPT = \`Analyze this image. Check if it is a care/brand label for clothing, footwear, or accessories.
If it is NOT an apparel label (e.g., food, electronics, random object), set "is_valid_apparel" to false, provide a "rejection_reason", and return null for the rest.
If valid, extract care symbols and generate a care guide. Return JSON:
{
  "is_valid_apparel": true or false,
  "rejection_reason": "Explanation if false, else null",
  "care_symbols": [{"id": "wash","category": "washing","label": "Wash cold","confidence": "high"}],
  "brand": "string|null",
  "instructions": "Step-by-step AI care guide based on symbols/text",
  "label_standard_guess": "unclear",
  "needs_user_review": false,
  "review_notes": "null"
}\`;`;
file = file.replace(promptOld, promptNew);

// 3. Update parseJson fallback
const fallbackOld = /return parseJson<LabelAnalysis>\(text, \{[\s\S]*?\}\);/;
const fallbackNew = `return parseJson<LabelAnalysis>(text, {
    is_valid_apparel: false,
    rejection_reason: "Failed to parse the image properly.",
    care_symbols: [],
    brand: null,
    instructions: null,
    label_standard_guess: "unclear",
    needs_user_review: true,
    review_notes: "Parse error.",
  });`;
file = file.replace(fallbackOld, fallbackNew);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Updated ai-scan.ts');
