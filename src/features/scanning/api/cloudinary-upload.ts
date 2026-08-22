import { supabase } from "@/shared/supabase/client";
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY?.trim();
const API_SECRET =
  process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET?.trim() || "";

export interface CloudinaryUploadResult {
  imageUrl: string;
  originalImageUrl: string;
  publicId: string;
}

/**
 * Converts any URI (file://, content://, ph://, http, data:) into clean base64 string
 */
async function uriToBase64(uri: string): Promise<string> {
  if (!uri) return "";

  if (uri.startsWith("data:image")) {
    return uri.split(",")[1] || "";
  }

  // Handle local filesystem URI (Expo on Android/iOS)
  if (
    uri.startsWith("file://") ||
    uri.startsWith("/") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
  ) {
    try {
      const file = new File(uri);
      const base64 = await file.base64();
      if (base64 && base64.length > 0) {
        return base64;
      }
    } catch (fsErr) {
      console.warn("[BG-Removal] FileSystem read failed, attempting fetch fallback:", fsErr);
    }
  }

  // Fallback for remote / blob / web URIs
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (fetchErr) {
    console.error("[BG-Removal] uriToBase64 failed:", fetchErr);
    throw fetchErr;
  }
}

/**
 * Removes background using Supabase Edge Function with direct remove.bg client fallback.
 */
async function removeBackgroundLocal(fileUri: string): Promise<string> {
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
            console.log(`[BG-Removal] Fast-Path: Successfully removed background via direct remove.bg key #${i + 1}`);
            const file = new File(Paths.cache, `bg_removed_${Date.now()}.png`);
            file.write(b64, { encoding: "base64" });
            return file.uri;
          }
        }
      } catch (apiErr) {
        console.warn(`[BG-Removal] Fast-Path: Key #${i + 1} network error:`, apiErr);
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
      const file = new File(Paths.cache, `bg_removed_${Date.now()}.png`);
      file.write(data.result_b64, { encoding: "base64" });
      return file.uri;
    }
    console.warn("[BG-Removal] Edge Function returned error/no-result:", error || data?.error);
  } catch (edgeErr) {
    console.warn("[BG-Removal] Edge function invocation error:", edgeErr);
  }

  throw new Error("Failed to remove background via all available methods");
}

export async function uploadToCloudinaryWithBgRemoval(
  fileUri: string,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !API_KEY) {
    console.warn("[Cloudinary] Credentials missing, returning local URI");
    return {
      imageUrl: fileUri,
      originalImageUrl: fileUri,
      publicId: `local_${Date.now()}`,
    };
  }

  // 1. Try removing background
  let uploadUri = fileUri;
  let bgRemovedSuccess = false;
  try {
    uploadUri = await removeBackgroundLocal(fileUri);
    bgRemovedSuccess = true;
  } catch (bgErr) {
    console.warn(
      "[BG-Removal] Background removal failed, uploading original image:",
      bgErr,
    );
    uploadUri = fileUri;
  }

  // 2. Upload to Cloudinary
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const paramsToSign = `timestamp=${timestamp}`;

    let signature = "";
    if (API_SECRET) {
      // 2a. Fast Path signature
      signature = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, paramsToSign + API_SECRET);
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
    }

    if (!signature) {
      console.warn("[Cloudinary] Could not generate signature, returning local URI");
      return {
        imageUrl: uploadUri,
        originalImageUrl: fileUri,
        publicId: `local_${Date.now()}`,
      };
    }

    const formData = new FormData();
    let fileToUpload: any;
    if (uploadUri.startsWith("data:")) {
      fileToUpload = await (await fetch(uploadUri)).blob();
    } else {
      const fileName = uploadUri.split("/").pop() || "image.jpg";
      fileToUpload = { uri: uploadUri, name: fileName, type: "image/jpeg" };
    }
    formData.append("file", fileToUpload);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      console.warn("[Cloudinary] Upload response not ok:", data);
      return {
        imageUrl: uploadUri,
        originalImageUrl: fileUri,
        publicId: `local_${Date.now()}`,
      };
    }

    return {
      imageUrl: data.secure_url,
      originalImageUrl: bgRemovedSuccess ? fileUri : data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error("[Cloudinary] Error in uploadToCloudinaryWithBgRemoval:", error);
    return {
      imageUrl: uploadUri,
      originalImageUrl: fileUri,
      publicId: `local_${Date.now()}`,
    };
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes("cloudinary.com")) return null;
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + 8);
    if (pathAfterUpload.match(/^v\d+\//)) {
      pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");
    }

    const lastDotIndex = pathAfterUpload.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }
    return pathAfterUpload;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUD_NAME || !API_KEY) {
    console.warn("Cloudinary credentials are not properly configured");
    return false;
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;

    let signature = "";

    try {
      const { data: sigData, error: sigError } =
        await supabase.functions.invoke("cloudinary-signature", {
          body: { paramsToSign },
        });
      if (!sigError && sigData?.signature) {
        signature = sigData.signature;
      }
    } catch {
      // ignore
    }

    if (!signature && API_SECRET) {
      signature = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, paramsToSign + API_SECRET);
    }

    if (!signature) {
      console.error("Failed to generate delete signature");
      return false;
    }

    const formData = new FormData();
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("public_id", publicId);

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;
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
