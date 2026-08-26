const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

file = file.replace(
  /    model: "gpt-4o-mini",/,
  '    model: mode === "label" ? "gpt-4o" : "gpt-4o-mini",' // Use gpt-4o for label to force 85-token detail:low
);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Updated model to gpt-4o for label mode');
