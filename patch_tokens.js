const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

const oldFastPath = `      const data = await res.json();
      const choice = data?.choices?.[0];`;

const newFastPath = `      const data = await res.json();
      
      // Print token usage to console
      if (data.usage) {
        console.log(\`[AI-Scan] Token Usage -> Input: \${data.usage.prompt_tokens} | Output: \${data.usage.completion_tokens} | Total: \${data.usage.total_tokens}\`);
      }
      
      const choice = data?.choices?.[0];`;

file = file.replace(oldFastPath, newFastPath);

const oldEdgePath = `    const choice = data?.choices?.[0];
    if (choice?.finish_reason === "content_filter") {`;

const newEdgePath = `    // Print token usage to console
    if (data && data.usage) {
      console.log(\`[AI-Scan] Token Usage (Edge) -> Input: \${data.usage.prompt_tokens} | Output: \${data.usage.completion_tokens} | Total: \${data.usage.total_tokens}\`);
    }
    
    const choice = data?.choices?.[0];
    if (choice?.finish_reason === "content_filter") {`;

file = file.replace(oldEdgePath, newEdgePath);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Patched token logging in ai-scan.ts');
