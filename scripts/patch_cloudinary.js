const fs = require('fs');
let code = fs.readFileSync('src/features/scanning/api/cloudinary-upload.ts', 'utf8');

// Replace removeBackgroundLocal
code = code.replace(
  /async function removeBackgroundLocal\(fileUri: string\): Promise<string> \{[\s\S]*?throw new Error\("Failed to remove background via all available methods"\);\n\}/,
  `async function removeBackgroundLocal(fileUri: string): Promise<string> {
  const base64Image = await uriToBase64(fileUri);
  if (!base64Image) {
    throw new Error("Could not read image data for background removal");
  }

  const rawEnvKeys = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEYS || process.env.REMOVEBG_API_KEY || "";
  const keys = rawEnvKeys.split(",").map((k) => k.trim()).filter((k) => k.length > 0);

  // 1. FAST PATH: Direct API
  if (keys.length > 0) {
    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        const formData = new FormData();
        formData.append("image_file_b64", base64Image);
        formData.append("size", "auto");
        formData.append("format", "png");
        formData.append("response_type", "base64");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": apiKey,
            Accept: "application/json",
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const b64 = data.data?.result_b64;
          if (b64) {
            console.log(\`[BG-Removal] Fast-Path: Successfully removed background via direct remove.bg key #\${i + 1}\`);
            const file = new File(Paths.cache, \`bg_removed_\${Date.now()}.png\`);
            file.write(b64, { encoding: "base64" });
            return file.uri;
          }
        }
      } catch (apiErr) {
        console.warn(\`[BG-Removal] Fast-Path: Key #\${i + 1} network error:\`, apiErr);
      }
    }
  }

  // 2. FALLBACK PATH: Supabase Edge Function
  try {
    console.log("[BG-Removal] Attempting Edge Function fallback...");
    const { data, error } = await supabase.functions.invoke("remove-bg", {
      body: { base64Image },
    });

    if (!error && data?.result_b64) {
      console.log("[BG-Removal] Successfully removed background via Edge Function");
      const file = new File(Paths.cache, \`bg_removed_\${Date.now()}.png\`);
      file.write(data.result_b64, { encoding: "base64" });
      return file.uri;
    }
    console.warn("[BG-Removal] Edge Function returned error/no-result:", error || data?.error);
  } catch (edgeErr) {
    console.warn("[BG-Removal] Edge function invocation error:", edgeErr);
  }

  throw new Error("Failed to remove background via all available methods");
}`
);

// Replace Signature logic
code = code.replace(
  /let signature = "";[\s\S]*?if \(!signature && API_SECRET\) \{[\s\S]*?signature = CryptoJS\.SHA1\(paramsToSign \+ API_SECRET\)\.toString\(\);\n    \}/,
  `let signature = "";
    if (API_SECRET) {
      // 2a. Fast Path signature
      signature = CryptoJS.SHA1(paramsToSign + API_SECRET).toString();
      console.log("[Cloudinary] Fast-Path: Used direct local SHA1 signature");
    } else {
      // 2b. Fallback edge function
      try {
        const { data: sigData, error: sigError } = await supabase.functions.invoke("cloudinary-signature", {
          body: { paramsToSign },
        });
        if (!sigError && sigData?.signature) {
          signature = sigData.signature;
        }
      } catch (sigErr) {
        console.warn("[Cloudinary] Edge function signature failed:", sigErr);
      }
    }`
);

fs.writeFileSync('src/features/scanning/api/cloudinary-upload.ts', code);
