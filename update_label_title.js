const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// Add title to LabelAnalysis interface
file = file.replace(/  instructions: string \| null;\n/, '  title: string | null;\n  instructions: string | null;\n');

// Replace LABEL_PROMPT
const oldPrompt = /const LABEL_PROMPT = `[\s\S]*?`;/;
const newPrompt = `const LABEL_PROMPT = \`Analyze this image. Check if it is a care/brand label for clothing, footwear, or accessories.
If it is NOT an apparel label (e.g., food, electronics, random object), set "is_valid_apparel" to false, provide a "rejection_reason", and return null for the rest.
If valid, extract care symbols and generate a care guide. Return JSON:
{
  "is_valid_apparel": true or false,
  "rejection_reason": "Explanation if false, else null",
  "care_symbols": [{"id": "wash","category": "washing","label": "Wash cold","confidence": "high"}],
  "title": "A short, descriptive title related to the item (e.g., Cotton T-Shirt Care Guide, Denim Washing Instructions)",
  "instructions": "Write a short, friendly, and conversational paragraph explaining how to care for this item. Do NOT use numbered lists or bullet points. Speak naturally like a human giving helpful advice.",
  "label_standard_guess": "unclear",
  "needs_user_review": false,
  "review_notes": "null"
}\`;`;
file = file.replace(oldPrompt, newPrompt);

// Add title to parseJson fallback
file = file.replace(/    instructions: null,\n/, '    title: null,\n    instructions: null,\n');

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Updated ai-scan.ts');
