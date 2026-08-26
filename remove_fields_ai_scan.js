const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// 1. Remove from LabelAnalysis interface
file = file.replace(/  fabric_composition: {\n    material: string;\n    percentage: number \| null;\n  }\[\];\n/, '');
file = file.replace(/  size: string \| null;\n/, '');

// 2. Remove from LABEL_PROMPT
file = file.replace(/  "fabric_composition": \[\n    {\n      "material": "e.g., Cotton",\n      "percentage": 100\n    }\n  \],\n/, '');
file = file.replace(/  "size": "size if visible, else null",\n/, '');

// 3. Remove from parseJson fallback
file = file.replace(/    fabric_composition: \[\],\n/, '');
file = file.replace(/    size: null,\n/, '');

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Removed fields from ai-scan.ts');
