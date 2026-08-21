const fs = require('fs');
let code = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// Export DISABLE_AI_SCAN
if (!code.includes('export const DISABLE_AI_SCAN')) {
  code = code.replace(
    /const DISABLE_AI_SCAN = false;/,
    'export const DISABLE_AI_SCAN = false;'
  );
}

// Replace old FullClothingAnalysis completely
const oldInterfaceRegex = /export interface FullClothingAnalysis \{[\s\S]*?primaryColor\?: string;\n\}/;
const newInterface = `export interface FullClothingAnalysis {
  name: string;
  category: string;
  subCategory: string;
  color: string;
  primaryColor?: string; // For backward compatibility
  colorHex: string;
  occasion: string[];
  season: string[];
  brand: string;
  careInstructions: string;
  notes: string;
}`;

code = code.replace(oldInterfaceRegex, newInterface);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', code);
