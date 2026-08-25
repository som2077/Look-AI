const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

const oldCode = `  try {
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
  }`;

const newCode = `  try {
    const openAiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (openAiKey) {
      console.log("[AI-Scan] Fast-Path: Calling OpenAI directly");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${openAiKey}\`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        console.warn("[AI-Scan] Direct OpenAI call failed", await res.text());
        return null;
      }
      const data = await res.json();
      const choice = data?.choices?.[0];
      if (choice?.finish_reason === "content_filter") {
        return JSON.stringify({ error: "SAFETY_VIOLATION" });
      }
      return choice?.message?.content || null;
    }

    // Fallback to edge function if no local key
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
  }`;

file = file.replace(oldCode, newCode);
fs.writeFileSync('src/features/scanning/api/ai-scan.ts', file);
console.log('Patched ai-scan.ts fast-path');
