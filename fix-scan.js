const fs = require('fs');

// Fix ai-scan.ts
let aiScanContent = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');
aiScanContent = aiScanContent.replace('export const DISABLE_AI_SCAN = false;\n', '');
aiScanContent = aiScanContent.replace('const MODELS = [\n  "gpt-4o-mini"\n];\n', '');

// Replace the callOpenAIVision function
const callVisionReplacement = `async function callOpenAIVision(
  imageUri: string,
  prompt: string,
  mode: "cloth" | "barcode" | "fitcheck" = "cloth",
  maxTokens: number = 350
): Promise<string | null> {
  let url: string;
  try {
    url = await prepareVisionImageUrl(imageUri);
  } catch (err) {
    console.error("[AI-Scan] Error preparing vision image URL:", err);
    return null;
  }

  const detail = mode === "barcode" ? "auto" : "low";

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url,
              detail,
            },
          },
        ],
      },
    ],
  };

  try {
    const { data, error } = await supabase.functions.invoke("openai-proxy", {
      body: { model: "gpt-4o-mini", body },
    });

    if (error) {
      console.warn(\`[AI-Scan] Edge function failed:\`, error);
      return null;
    } 

    const choice = data?.choices?.[0];
    if (choice?.finish_reason === "content_filter") {
      return JSON.stringify({ error: "SAFETY_VIOLATION" });
    }
    return choice?.message?.content || null;
    
  } catch (err) {
    console.warn(\`[AI-Scan] Invoke exception:\`, err);
    return null;
  }
}`;

aiScanContent = aiScanContent.replace(/async function callOpenAIVision\([\s\S]*?return null;\n}/, callVisionReplacement);

// Fix analyzeFitCheck MOCK_AI logic
const mockAiRegex = /const MOCK_AI = true;\s*\/\/\s*SET THIS TO TRUE TO BYPASS AI FOR UI TESTING[\s\S]*?if\s*\(MOCK_AI\)\s*\{\s*\/\/\s*Simulate network delay\s*await new Promise\(\(resolve\) => setTimeout\(resolve, 1500\)\);\s*return mockData;\s*\}/;
aiScanContent = aiScanContent.replace(mockAiRegex, '');

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', aiScanContent, 'utf8');

// Fix ai-vision.ts
let aiVisionContent = fs.readFileSync('src/features/scanning/api/ai-vision.ts', 'utf8');
aiVisionContent = aiVisionContent.replace(/import \{ DISABLE_AI_SCAN \} from "\.\/ai-scan";\n/g, '');
aiVisionContent = aiVisionContent.replace(/\s*if\s*\(DISABLE_AI_SCAN\)\s*\{\s*return getFallbackAnalysis\(\);\s*\}/g, '');
fs.writeFileSync('src/features/scanning/api/ai-vision.ts', aiVisionContent, 'utf8');

