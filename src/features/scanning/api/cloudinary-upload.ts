import CryptoJS from "crypto-js";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY?.trim();
const API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET?.trim();

export interface CloudinaryUploadResult {
  imageUrl: string;
  originalImageUrl: string;
  publicId: string;
}

let currentKeyIndex = 0;

/**
 * Removes background using the remove.bg API and handles multiple keys for fallback.
 */
async function removeBackgroundLocal(fileUri: string): Promise<string> {
  const keysEnv = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEYS?.trim() || "";
  const keys = keysEnv.split(",").map(k => k.trim()).filter(k => k.length > 0);
  
  if (keys.length === 0) {
    throw new Error("No remove.bg API keys found in EXPO_PUBLIC_REMOVE_BG_API_KEYS");
  }

  const formData = new FormData();
  formData.append("image_file", {
    uri: fileUri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as any);
  formData.append("size", "auto");
  formData.append("format", "png");
  formData.append("response_type", "base64");

  let lastError: any = null;

  while (currentKeyIndex < keys.length) {
    const key = keys[currentKeyIndex];
    try {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": key,
          Accept: "application/json",
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const b64 = data.data.result_b64;
        return `data:image/png;base64,${b64}`;
      } else if (response.status === 402 || response.status === 429) {
        // 402 = Payment Required (Out of credits), 429 = Rate limit
        console.warn(`Remove.bg key ${currentKeyIndex + 1} failed or exhausted. Trying next key...`);
        currentKeyIndex++;
      } else {
        const errText = await response.text();
        throw new Error(`Remove.bg API Error (${response.status}): ${errText}`);
      }
    } catch (e) {
      lastError = e;
      if (e instanceof Error && e.message.includes("Remove.bg API Error")) {
        throw e; // Stop trying if it's a hard error (not credit related)
      }
      // If network error, throw it so the user can retry
      throw e;
    }
  }

  throw new Error("All remove.bg API keys are exhausted or failed. Last error: " + (lastError?.message || "Unknown"));
}


export async function uploadToCloudinaryWithBgRemoval(
  fileUri: string,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      "Cloudinary credentials are not properly configured in .env",
    );
  }

  // 1. Remove background locally (fast)
  const transparentImageUri = await removeBackgroundLocal(fileUri);

  // 2. Upload the transparent image to Cloudinary
  const timestamp = Math.round(new Date().getTime() / 1000).toString();

  const paramsToSign = `timestamp=${timestamp}`;
  const signature = CryptoJS.SHA1(paramsToSign + API_SECRET).toString();

  const formData = new FormData();
  formData.append("file", transparentImageUri as any); // Upload the base64 URI directly
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudinary upload failed:", data);
      throw new Error(data.error?.message || "Failed to upload to Cloudinary");
    }

    const publicId = data.public_id;
    const imageUrl = data.secure_url;
    const originalImageUrl = data.secure_url;

    return {
      imageUrl,
      originalImageUrl,
      publicId,
    };
  } catch (error) {
    console.error("Error in uploadToCloudinaryWithBgRemoval:", error);
    throw error;
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes("cloudinary.com")) return null;
    const parts = url.split("/");
    const filename = parts.pop();
    if (!filename) return null;
    return filename.split(".")[0];
  } catch (e) {
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.warn("Cloudinary credentials are not properly configured");
    return false;
  }

  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = CryptoJS.SHA1(paramsToSign + API_SECRET).toString();

  const formData = new FormData();
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("public_id", publicId);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    return data.result === "ok";
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
}
