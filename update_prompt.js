const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

file = file.replace(
  /"instructions": "Extract and summarize any care instructions or text on the label into plain English",/,
  '"instructions": "Based on the care symbols and text on the label, generate a clear, comprehensive step-by-step AI guide on how to care for this specific clothing item.",'
);

// Also fixing that `}`;;` typo I saw on line 337
file = file.replace(/}\`;;/g, '}`;');

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Updated AI prompt');
