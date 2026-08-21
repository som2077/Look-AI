const fs = require('fs');
let code = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// Export DISABLE_AI_SCAN correctly
code = code.replace(/const DISABLE_AI_SCAN = false;/, 'export const DISABLE_AI_SCAN = false;');

// Fix MOCK_FULL_CLOTH
const mockRegex = /const MOCK_FULL_CLOTH: FullClothingAnalysis = \{[\s\S]*?\};\n/;
const newMock = `const MOCK_FULL_CLOTH: FullClothingAnalysis = {
  name: "Graphic Hoodie",
  category: "Top",
  subCategory: "Hoodie",
  color: "Black",
  colorHex: "#000000",
  occasion: ["Casual"],
  season: ["Winter"],
  brand: "Unknown",
  careInstructions: "Machine wash cold",
  notes: "Perfect for relaxed outings.",
};
`;

if (code.match(mockRegex)) {
  code = code.replace(mockRegex, newMock);
}

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', code);
