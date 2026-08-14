# Look AI — Edge Functions API Reference

> **Status:** Living reference · **Last updated:** 2026-08-14

This document describes all Supabase Edge Functions used by the Look AI app, including their purpose, inputs, outputs, rate limits, and usage patterns.

---

## Table of Contents

- [Overview](#overview)
- [Common Patterns](#common-patterns)
- [Function Reference](#function-reference)
  - [gemini-proxy](#gemini-proxy)
  - [planner-agent](#planner-agent)
  - [analyze-cloth-item](#analyze-cloth-item)
  - [cloth-label-scan](#cloth-label-scan)
  - [remove-bg](#remove-bg)
  - [virtual-try-on](#virtual-try-on)
  - [cloudinary-signature](#cloudinary-signature)
- [Rate Limiting](#rate-limiting)
- [Calling from the App](#calling-from-the-app)
- [Local Development](#local-development)

---

## Overview

Edge functions are Deno-based serverless functions deployed on Supabase. They act as a secure proxy layer between the app and external services (Gemini, remove.bg, fal.ai, Cloudinary), and implement rate limiting via Upstash Redis.

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   App       │────▶│  Supabase Edge       │────▶│  External API    │
│  (Expo)     │     │  Function (Deno)     │     │  (Gemini, etc.)  │
└─────────────┘     └──────────────────────┘     └──────────────────┘
                            │
                      ┌─────▼─────┐
                      │ Upstash   │
                      │ Redis     │
                      │ (Rate     │
                      │  Limit)   │
                      └───────────┘
```

All functions are deployed with:

```bash
supabase functions deploy <function-name>
```

And secrets are set with:

```bash
supabase secrets set KEY1=val1 KEY2=val2
```

---

## Common Patterns

### JWT Verification

Functions can be configured to verify the incoming JWT:

```toml
# supabase/functions/<name>/config.toml
[functions.<name>]
  verify_jwt = true   # Requires valid JWT from the caller
```

When `verify_jwt = true`, the function receives the decoded JWT claims in `request.auth`.

### CORS Configuration

```toml
# supabase/functions/<name>/config.toml
[functions.<name>.cors]
  allow_origins = ["*"]   # Or specific origins
```

### Function Invocation

From the app (using Supabase JS client):

```typescript
const { data, error } = await supabase.functions.invoke('gemini-proxy', {
  body: {
    prompt: 'Analyze this clothing item...',
    image_url: 'https://res.cloudinary.com/...',
  },
});
```

Or via raw fetch:

```typescript
const response = await fetch(
  `https://<project>.supabase.co/functions/v1/gemini-proxy`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
     Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ prompt, image_url }),
  }
);
```

---

## Function Reference

### gemini-proxy

**Purpose**: Proxies requests to Google Gemini `generateContent` API. Provides a server-side proxy so the API key is never exposed to the client.

**Path**: `supabase/functions/gemini-proxy/index.ts`

**Rate Limit**: 30 requests / minute / user

**Config**:
```toml
# config.toml
verify_jwt = false
```

**Input** (POST body):
```typescript
interface GeminiProxyInput {
  prompt: string;           // The text prompt to send to Gemini
  image_url?: string;       // Optional image URL for vision models
  model?: string;           // Gemini model name (default: 'gemini-2.0-flash')
  maxTokens?: number;       // Max response tokens
}
```

**Output**:
```typescript
interface GeminiProxyOutput {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
```

**Usage example**:
```typescript
const { data, error } = await supabase.functions.invoke('gemini-proxy', {
  body: {
    prompt: 'Describe this outfit in 3 sentences.',
    image_url: 'https://res.cloudinary.com/demo/image/upload/wardrobe/shirt.jpg',
    model: 'gemini-2.0-flash',
  },
});

if (error) {
  console.error('Gemini proxy error:', error);
} else {
  console.log('Gemini response:', data.candidates[0].content.parts[0].text);
}
```

---

### planner-agent

**Purpose**: Gemini-powered outfit planning chat. Takes user context (style preferences, body type, occasion, weather) and returns a structured outfit plan in JSON mode.

**Path**: `supabase/functions/planner-agent/index.ts`

**Rate Limit**: 30 requests / minute / user

**Config**:
```toml
# config.toml
verify_jwt = false
```

**Input** (POST body):
```typescript
interface PlannerAgentInput {
  userId: string;                  // Clerk user ID (for context)
  stylePreferences: string[];      // User's style preferences
  bodyType?: string;               // Body type
  occasion?: string;               // Occasion for the outfit
  weatherContext?: {               // Weather data from Open-Meteo
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
  };
  wardrobeContext?: string[];      // Available wardrobe items (category/name)
  conversationHistory?: string[];  // Previous messages in the chat
}
```

**Output** (JSON mode — structured outfit plan):
```typescript
interface PlannerAgentOutput {
  outfit: {
    top: { category: string; reason: string };
    bottom: { category: string; reason: string };
    footwear: { category: string; reason: string };
    accessory?: { category: string; reason: string };
  };
  styleAdvice: string;        // General style advice for the occasion
  confidence: number;         // 0-100 confidence in the recommendation
  reasoning: string;          // Explanation of why this outfit works
}
```

**Notes**:
- The planner does **not** persist recommendations to the database (see `ai_recommendations` table — currently not written by any edge function)
- Returns structured JSON for easy parsing on the client

**Usage example**:
```typescript
const { data, error } = await supabase.functions.invoke('planner-agent', {
  body: {
    userId: 'user_2xxxxxxxxxx',
    stylePreferences: ['casual', 'minimalist', 'streetwear'],
    bodyType: 'athletic',
    occasion: 'date_night',
    weatherContext: { temperature: 22, humidity: 45, windSpeed: 5, weatherCode: 0 },
    wardrobeContext: ['cotton shirt', 'denim jeans', 'white sneakers', 'leather jacket'],
  },
});

if (error) throw error;

console.log('Recommended outfit:', data.outfit);
console.log('Style advice:', data.styleAdvice);
```

---

### analyze-cloth-item

**Purpose**: Analyzes a clothing item from an image. Performs a multi-step process: Cloudinary upload → Gemini vision analysis → remove.bg background removal. Returns structured metadata about the clothing item.

**Path**: `supabase/functions/analyze-cloth-item/index.ts`

**Rate Limit**: 5 requests / minute / user

**Config**:
```toml
# config.toml
verify_jwt = false
```

**Why the low rate limit?** This function makes up to 4 Gemini API calls + 1 remove.bg call per invocation, making it expensive. The 5/min limit prevents abuse.

**Input** (POST body):
```typescript
interface AnalyzeClothItemInput {
  imageBase64: string;        // Base64-encoded image data
  customName?: string;        // Optional user-provided name
}
```

**Process**:
1. Upload the image to Cloudinary (signed upload via `cloudinary-signature`)
2. Send the Cloudinary URL to Gemini for clothing analysis (category, colors, fabric, fit, style)
3. Send the image to remove.bg for background removal (optional, based on config)
4. Return structured metadata

**Output**:
```typescript
interface AnalyzeClothItemOutput {
  category: string;           // e.g. 'top', 'bottoms', 'footwear'
  subCategory?: string;       // e.g. 'shirt', 'pants', 'sneakers'
  primaryColor: string;       // Dominant color name
  colorHex?: string;          // Hex code of dominant color
  secondaryColors?: string[];// Additional colors detected
  pattern?: string;           // e.g. 'solid', 'striped', 'plaid'
  fabricGuess?: string;       // e.g. 'cotton', 'polyester', 'denim'
  fit?: string;               // e.g. 'slim', 'regular', 'oversized'
  sleeveType?: string;        // e.g. 'short', 'long', 'sleeveless'
  neckType?: string;          // e.g. 'round', 'v-neck', 'collared'
  style?: string[];           // Style tags
  occasion?: string[];        // Suggested occasions
  formalityScore?: number;    // 1-10 formality estimate
  confidence: number;         // AI confidence 0-100
  imageUrl: string;           // Cloudinary URL of the analyzed image
  bgRemovedUrl?: string;      // Cloudinary URL with background removed (if processed)
}
```

**Usage example**:
```typescript
// From the app's scanning flow
const { data, error } = await supabase.functions.invoke('analyze-cloth-item', {
  body: {
    imageBase64: base64EncodedImage,
    customName: 'My favorite shirt',
  },
});

if (error) throw error;

// data contains structured clothing metadata ready for wardrobe insertion
```

---

### cloth-label-scan

**Purpose**: OCR scanning of clothing care labels. Uses Gemini to extract text from care label images and parse care instructions, brand, size, and fabric composition.

**Path**: `supabase/functions/cloth-label-scan/index.ts`

**Rate Limit**: 10 requests / minute / user

**Config**:
```toml
# config.toml
verify_jwt = false
```

**Input** (POST body):
```typescript
interface ClothLabelScanInput {
  imageBase64: string;        // Base64-encoded care label image
}
```

**Output**:
```typescript
interface ClothLabelScanOutput {
  brand?: string;              // Brand name extracted from label
  size?: string;               // Size text (e.g. 'M', '42 EU')
  fabricComposition?: {        // Fabric breakdown
    material: string;
    percentage: number;
  }[];
  careSymbols?: string[];      // Care symbol descriptions
  washInstruction?: string;    // Washing instructions
  dryInstruction?: string;     // Drying instructions
  ironInstruction?: string;    // Ironing instructions
  bleachInstruction?: string;  // Bleach instructions
  dryCleanInstruction?: string;// Dry cleaning instructions
  originalText?: string;       // Raw extracted text from the label
  translatedText?: string;     // Translated text (if multilingual)
  labelStandardGuess?: string; // e.g. 'ISO 3758', 'GINETEX'
}
```

**Usage example**:
```typescript
const { data, error } = await supabase.functions.invoke('cloth-label-scan', {
  body: {
    imageBase64: scannedLabelBase64,
  },
});

// Save to saved_labels table via the app's API layer
```

---

### remove-bg

**Purpose**: Background removal proxy for remove.bg API. Accepts an image, sends it to remove.bg, and returns the processed image URL.

**Path**: `supabase/functions/remove-bg/index.ts`

**Rate Limit**: 10 requests / minute / user

**Each request = 1 remove.bg credit** (charged to the account linked in the API key).

**Config**:
```toml
# config.toml
verify_jwt = false
```

**Input** (POST body):
```typescript
interface RemoveBgInput {
  imageBase64: string;         // Base64-encoded image
  size?: 'preview' | 'regular' | 'hd';  // Output size (default: 'regular')
}
```

**Output**:
```typescript
interface RemoveBgOutput {
  resultImageUrl: string;      // Cloudinary URL of the bg-removed image
  status: 'success' | 'failed';
  error?: string;              // If status is 'failed'
}
```

**Process**:
1. Image is uploaded to Cloudinary (temporary)
2. remove.bg API is called with the image
3. Result is uploaded back to Cloudinary
4. Return the Cloudinary URL

**Usage example**:
```typescript
const { data, error } = await supabase.functions.invoke('remove-bg', {
  body: {
    imageBase64: imageBase64,
    size: 'regular',
  },
});

// data.resultImageUrl can be stored in wardrobe_items.image_url
```

---

### virtual-try-on

**Purpose**: Virtual try-on using fal.ai's try-on model. Takes a garment image and a model image, generates a composite showing the garment on the model.

**Path**: `supabase/functions/virtual-try-on/index.ts`

**Rate Limit**: 5 requests / minute / user

**Config**:
```toml
# config.toml
verify_jwt = true    # Requires valid Clerk JWT — more strictly protected
```

**Why the low rate limit?** fal.ai is a paid service, and each call consumes credits. 5/min is a conservative limit to prevent runaway bills.

**Input** (POST body):
```typescript
interface VirtualTryOnInput {
  garmentImageBase64: string;  // Garment image (clothing item)
  modelImageBase64: string;    // Model/pose image (person to try on)
  poseType?: 'standing_front' | 'standing_side' | 'sitting';  // Default: 'standing_front'
}
```

**Output**:
```typescript
interface VirtualTryOnOutput {
  resultImageUrl?: string;     // Cloudinary URL of the try-on result (if successful)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;       // If status is 'failed'
  jobId?: string;              // fal.ai job ID for tracking
}
```

**Process**:
1. Garment and model images are uploaded to Cloudinary
2. fal.ai try-on API is called
3. Result is uploaded to Cloudinary
4. A row is inserted into `virtual_try_on_generations` table
5. Return the result URL

**Database write**: This function writes to `virtual_try_on_generations`:
```sql
INSERT INTO virtual_try_on_generations (user_id, garment_item_id, garment_image_url, model_image_url, result_image_url, status)
VALUES (..., ..., ..., ..., ..., 'completed')
```

**Usage example**:
```typescript
const { data, error } = await supabase.functions.invoke('virtual-try-on', {
  body: {
    garmentImageBase64: shirtBase64,
    modelImageBase64: modelBase64,
    poseType: 'standing_front',
  },
});

// data.status will be 'completed' when the try-on is done
// data.resultImageUrl holds the Cloudinary URL
```

---

### cloudinary-signature

**Purpose**: Generates signed upload parameters for Cloudinary. Cloudinary requires signed uploads to prevent unauthorized uploads; this function keeps the API secret server-side.

**Path**: `supabase/functions/cloudinary-signature/index.ts`

**Rate Limit**: Not rate-limited (low-cost, stateless)

**Config**:
```toml
# config.toml
verify_jwt = false
```

**Input** (POST body):
```typescript
interface CloudinarySignatureInput {
  folder?: string;        // Cloudinary folder for the upload
  transformation?: string; // Optional transformation string
}
```

**Output**:
```typescript
interface CloudinarySignatureOutput {
  signature: string;      // Cloudinary signature
  timestamp: number;      // Unix timestamp
  cloudName: string;      // Cloud name (public)
  apiKey: string;         // API key (public)
}
```

**Usage example**:
```typescript
// The app uses these params to construct a signed upload URL
const { data, error } = await supabase.functions.invoke('cloudinary-signature', {
  body: { folder: 'lookai/wardrobe' },
});

// Then use data.signature + data.timestamp with Cloudinary's upload API
```

---

## Rate Limiting

All functions (except `cloudinary-signature`) use a shared rate-limiting helper at `supabase/functions/_shared/rate-limit.ts`.

### Rate Limit Table

| Function | Rate Limit (per user/min) | Notes |
|----------|--------------------------|-------|
| `gemini-proxy` | 30 | Standard Gemini call |
| `planner-agent` | 30 | Chat context makes multiple calls |
| `analyze-cloth-item` | 5 | Multi-step: up to 4 Gemini + 1 remove.bg |
| `cloth-label-scan` | 10 | Single OCR call |
| `remove-bg` | 10 | Each call = 1 remove.bg credit |
| `virtual-try-on` | 5 | fal.ai paid service |

### Rate Limit Mechanism

```typescript
// Conceptual implementation (supabase/functions/_shared/rate-limit.ts)
import { createClient } from 'https://redis.js.org';

const redis = createClient({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

export async function checkRateLimit(
  functionName: string,
  jwtSub: string,
  limit: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const key = `rl::${functionName}::${jwtSub}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    // First request in window — set expiry
    await redis.expire(key, 60);
  }
  
  if (count > limit) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl };
  }
  
  return { allowed: true, retryAfter: 0 };
}
```

### Fail-Open Design

The rate limiter is **fail-open**: if Upstash Redis is unavailable or misconfigured, requests are allowed through. This ensures the rate limiter never becomes a single point of failure that blocks all function calls.

```typescript
try {
  const result = await checkRateLimit(fnName, jwtSub, limit);
  if (!result.allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': result.retryAfter.toString() },
    });
  }
} catch (error) {
  // Upstash unavailable — fail open, allow the request
  console.warn('Rate limit check failed, allowing request:', error);
}
```

---

## Calling from the App

### Recommended Pattern

Use `supabase.functions.invoke()` for type-safe, clean function calls:

```typescript
// In features/scanning/api/analyzeItem.ts
import { supabase } from '../../../shared/supabase/client';

interface AnalyzeResult {
  category: string;
  primaryColor: string;
  imageUrl: string;
  // ... etc
}

export async function analyzeClothingItem(
  imageBase64: string,
  customName?: string
): Promise<AnalyzeResult> {
  const { data, error } = await supabase.functions.invoke('analyze-cloth-item', {
    body: { imageBase64, customName },
  });

  if (error) {
    throw new Error(`Analyze failed: ${error.message}`);
  }

  return data as AnalyzeResult;
}
```

### Error Handling

Edge function errors come in the Supabase error format:

```typescript
try {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { prompt: 'test' },
  });

  if (error) {
    // error.message contains the function's error response
    // error.status contains the HTTP status code
    console.error(`Function error ${error.status}: ${error.message}`);
  }
} catch (err) {
  // Network errors, timeout, etc.
  console.error('Function call failed:', err);
}
```

### Rate Limit Handling

When a function returns 429, the `Retry-After` header indicates when to retry:

```typescript
if (error?.status === 429) {
  const retryAfter = parseInt(error.headers['retry-after'] ?? '60');
  console.warn(`Rate limited. Retry after ${retryAfter}s.`);
  // Implement backoff in the app
}
```

---

## Local Development

### Serving a Function Locally

```bash
# Start the function locally with hot reload
supabase functions serve gemini-proxy

# Test with curl
curl -X POST http://localhost:54321/functions/v1/gemini-proxy \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "image_url": "https://example.com/image.jpg"}'
```

### Running All Functions Locally

```bash
# Serve all functions
supabase functions serve
```

This starts a local server for each function. They're available at `http://localhost:54321/functions/v1/<function-name>`.

### Testing with the App Locally

1. Start Supabase local: `supabase start`
2. Serve functions: `supabase functions serve`
3. Point the app to the local Supabase instance (set `EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321` in `.env`)
4. The app will call the locally-served functions

### Debugging

Add `console.log` statements in the function code — they appear in the `supabase functions serve` terminal output:

```typescript
// In supabase/functions/gemini-proxy/index.ts
console.log('Received prompt:', request.body.prompt);
console.log('JWT sub:', request.user?.sub);
```

For production debugging, use the Supabase dashboard → Functions → Logs.

---

## Deprecation Notes

### Removed Functions

The following functions were **removed** and should not be called:

| Function | Reason | Removed |
|----------|--------|---------|
| `verify-purchase` | Replaced by RevenueCat | 2026-08-08 |
| `billing-webhook` | Replaced by RevenueCat | 2026-08-08 |

If your code still references these, remove the calls. They will return 404.

---

## Security Considerations

1. **Never expose API keys in the client**: All external API calls (Gemini, remove.bg, fal.ai) go through edge functions so keys stay server-side.

2. **JWT verification**: Functions that modify user data (`virtual-try-on`) have `verify_jwt = true`. This ensures the caller is authenticated.

3. **Input validation**: All functions should validate inputs before processing. Large images, unexpected fields, and malformed data should be rejected.

4. **Rate limiting**: All expensive functions are rate-limited to prevent abuse and runaway bills.

5. **CORS**: Configure `config.toml` CORS settings appropriately. Don't use `allow_origins = ["*"]` for functions that require authentication.
