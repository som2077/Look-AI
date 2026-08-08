import { supabase } from "@/shared/supabase/client";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY?.trim();

export interface CloudinaryUploadResult {
  imageUrl: string;
  originalImageUrl: string;
  publicId: string;
}

async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Removes background using the remove-bg edge function.
 */
async function removeBackgroundLocal(fileUri: string): Promise<string> {
  const base64Image = await uriToBase64(fileUri);

  const { data, error } = await supabase.functions.invoke("remove-bg", {
    body: { base64Image },
  });

  if (error || !data?.result_b64) {
    console.warn("Remove.bg edge function error:", error || data?.error);
    throw new Error("Failed to remove background via edge function");
  }

  return `data:image/png;base64,${data.result_b64}`;
}

export async function uploadToCloudinaryWithBgRemoval(
  fileUri: string,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !API_KEY) {
    console.warn("Cloudinary credentials missing, returning local URI");
    return {
      imageUrl: fileUri,
      originalImageUrl: fileUri,
      publicId: `local_${Date.now()}`,
    };
  }

  // 1. Try removing background, fallback to original if failed
  let uploadUri = fileUri;
  try {
    uploadUri = await removeBackgroundLocal(fileUri);
  } catch (bgErr) {
    console.warn("Background removal failed, uploading original image:", bgErr);
    uploadUri = fileUri;
  }

  // 2. Upload to Cloudinary
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const paramsToSign = `timestamp=${timestamp}`;
    const { data: sigData, error: sigError } = await supabase.functions.invoke(
      "cloudinary-signature",
      {
        body: { paramsToSign },
      },
    );

    if (sigError || !sigData?.signature) {
      console.warn("Cloudinary signature generation failed:", sigError);
      return {
        imageUrl: uploadUri,
        originalImageUrl: fileUri,
        publicId: `local_${Date.now()}`,
      };
    }

    const signature = sigData.signature;
    const formData = new FormData();
    formData.append("file", uploadUri as any);
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
      console.warn("Cloudinary upload response not ok:", data);
      return {
        imageUrl: uploadUri,
        originalImageUrl: fileUri,
        publicId: `local_${Date.now()}`,
      };
    }

    return {
      imageUrl: data.secure_url,
      originalImageUrl: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error("Error in uploadToCloudinaryWithBgRemoval:", error);
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
    const parts = url.split("/");
    const filename = parts.pop();
    if (!filename) return null;
    return filename.split(".")[0];
  } catch (e) {
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

    const { data: sigData, error: sigError } = await supabase.functions.invoke(
      "cloudinary-signature",
      {
        body: { paramsToSign },
      },
    );

    if (sigError || !sigData?.signature) {
      console.error("Failed to generate delete signature via edge function");
      return false;
    }

    const signature = sigData.signature;

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
