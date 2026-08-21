const fs = require('fs');
let code = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

// 1. Import Prompts
if (!code.includes('import { SYSTEM_PROMPTS }')) {
  code = code.replace(
    'import { supabase } from "@/shared/supabase/client";',
    'import { supabase } from "@/shared/supabase/client";\nimport { SYSTEM_PROMPTS } from "./prompts";'
  );
}

// 2. Update Model
code = code.replace(
  'const MODELS = ["gpt-4o-mini"];',
  'const MODELS = ["gpt-5-nano-2025-08-07"];'
);

// 3. Update callOpenAIVision logic for Fast Path
const callOpenAIVisionRegex = /for \(const model of MODELS\) \{[\s\S]*?console\.warn\(\`\[callOpenAIVision\] Exhausted all models\. Returning null\.\`\);\n  return null;\n\}/;

const newCallOpenAIVisionLogic = `for (const model of MODELS) {
    let textResponse: string | null = null;
    let directSuccess = false;
    const openAiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    // 1. FAST PATH: Direct API
    if (openAiKey) {
      try {
        console.log(\`[callOpenAIVision] Attempting Direct API Fast-Path for model=\${model}\`);
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${openAiKey.trim()}\`,
          },
          body: JSON.stringify(body),
        });
        
        const directData = await res.json();
        
        if (res.ok) {
          const choice = directData.choices?.[0];
          if (choice?.finish_reason === "content_filter") {
            console.warn("[callOpenAIVision] Content filter triggered!");
            return JSON.stringify({ error: "SAFETY_VIOLATION" });
          }
          textResponse = choice?.message?.content || null;
          console.log("[callOpenAIVision] Direct API Fast-Path succeeded, length:", textResponse?.length || 0);
          directSuccess = true;
        } else {
          console.warn("[callOpenAIVision] Direct API Fast-Path failed:", directData);
        }
      } catch (err) {
        console.warn("[callOpenAIVision] Direct API Fast-Path exception:", err);
      }
    }

    // 2. FALLBACK PATH: Edge Function
    if (!directSuccess) {
      console.log(\`[callOpenAIVision] Invoking edge function fallback for model=\${model}\`);
      try {
        const { data, error } = await supabase.functions.invoke("openai-proxy", {
          body: { model, body },
        });

        if (error) {
          console.warn(\`[AI-Scan] Edge function error for \${model} (Fallback):\`, error.message || error);
        } else {
          if (data?.error) {
            console.error(\`[AI-Scan] OpenAI API returned error inside data:\`, data.error);
          }
          const choice = data?.choices?.[0];
          if (choice?.finish_reason === "content_filter") {
            console.warn("[callOpenAIVision] Content filter triggered!");
            return JSON.stringify({ error: "SAFETY_VIOLATION" });
          }
          textResponse = choice?.message?.content || null;
          console.log(\`[callOpenAIVision] Edge function fallback succeeded, length:\`, textResponse?.length || 0);
        }
      } catch (err) {
        console.warn(\`[AI-Scan] Invoke exception for \${model}:\`, err);
      }
    }

    if (textResponse) {
      return textResponse;
    }
  }

  console.warn(\`[callOpenAIVision] Exhausted all models. Returning null.\`);
  return null;
}`;

code = code.replace(callOpenAIVisionRegex, newCallOpenAIVisionLogic);

// 4. Use SYSTEM_PROMPTS.CLOTH_SCAN instead of CLOTH_PROMPT
code = code.replace(
  'const text = await callOpenAIVision(imageUrl, CLOTH_PROMPT, 300, "cloth");',
  'const text = await callOpenAIVision(imageUrl, SYSTEM_PROMPTS.CLOTH_SCAN, 300, "cloth");'
);

// We won't delete CLOTH_PROMPT from the file to avoid regex issues, it's just unused now (can clean up later).
// But we must fix `FullClothingAnalysis` missing `primaryColor` since the UI expects it.
// I will append `primaryColor?: string;` to FullClothingAnalysis interface
code = code.replace(
  /export interface FullClothingAnalysis \{([\s\S]*?)\}/,
  'export interface FullClothingAnalysis {$1  primaryColor?: string;\n}'
);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', code);
