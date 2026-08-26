const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

const OLD_PROMPT = `const LABEL_PROMPT = \`Extract information from this clothing care label.
Translate any foreign text into English.
Return ONLY valid JSON using exactly this format:
{
  "care_symbols": [
    {
      "id": "e.g., wash_30, bleach_no, iron_low",
      "category": "washing | bleaching | drying | ironing | dry_cleaning | wringing",
      "label": "e.g., Machine wash cold",
      "confidence": "high"
    }
  ],
  "brand": "brand name if visible, else null",
  "instructions": "Based on the care symbols and text on the label, generate a clear, comprehensive step-by-step AI guide on how to care for this specific clothing item.",
  "label_standard_guess": "unclear",
  "needs_user_review": false,
  "review_notes": "Any caveats or null"
}\`;`;

const NEW_PROMPT = `const LABEL_PROMPT = \`Extract care label info. Return JSON:
{
  "care_symbols": [{"id": "wash_30","category": "washing","label": "Machine wash cold","confidence": "high"}],
  "brand": "string or null",
  "instructions": "Step-by-step AI care guide based on symbols/text",
  "label_standard_guess": "unclear",
  "needs_user_review": false,
  "review_notes": "null"
}\`;`;

file = file.replace(OLD_PROMPT, NEW_PROMPT);
fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Optimized prompt');
