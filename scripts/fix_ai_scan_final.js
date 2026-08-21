const fs = require('fs');
let code = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// 1. Add DISABLE_AI_SCAN
if (!code.includes('export const DISABLE_AI_SCAN')) {
  code = code.replace(
    'import { SYSTEM_PROMPTS } from "./prompts";',
    'import { SYSTEM_PROMPTS } from "./prompts";\nexport const DISABLE_AI_SCAN = false;'
  );
}

// 2. Fix inline mock inside analyzeClothingFull
const regex = /return parseJson<FullClothingAnalysis>\(text, \{[\s\S]*?confidence: 0\.8,\n  \}\);/;
const newInlineMock = `return parseJson<FullClothingAnalysis>(text, {
    name: "Fashion Item",
    category: "Top",
    subCategory: "T-shirt",
    color: "White",
    primaryColor: "White",
    colorHex: "#FFFFFF",
    occasion: ["Casual"],
    season: ["All Season"],
    brand: "Unknown",
    careInstructions: "Machine wash cold",
    notes: "A casual staple item",
  });`;

code = code.replace(regex, newInlineMock);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', code);
