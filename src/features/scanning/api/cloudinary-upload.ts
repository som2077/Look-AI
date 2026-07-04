import CryptoJS from "crypto-js";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY?.trim();
const API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET?.trim();

export interface CloudinaryUploadResult {
  imageUrl: string;
  originalImageUrl: string;
  publicId: string;
}

export async function uploadToCloudinaryWithBgRemoval(
  fileUri: string,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      "Cloudinary credentials are not properly configured in .env",
    );
  }

  const timestamp = Math.round(new Date().getTime() / 1000).toString();

  const paramsToSign = `background_removal=cloudinary_ai&timestamp=${timestamp}`;
  const signature = CryptoJS.SHA1(paramsToSign + API_SECRET).toString();

  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    type: "image/jpeg",
    name: `upload_${timestamp}.jpg`,
  } as any);

  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("background_removal", "cloudinary_ai");

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
    const version = data.version;

    const originalImageUrl = data.secure_url;
    const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/e_background_removal/v${version}/${publicId}.png`;

    // We won't poll here anymore to allow parallel processing.
    // The background removal happens asynchronously on Cloudinary.
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

/**
 * Polls the given Cloudinary image URL until it returns a 200 OK status,
 * meaning the asynchronous background removal has completed.
 */
export async function waitForCloudinaryImage(
  imageUrl: string,
  maxAttempts = 15,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const checkResponse = await fetch(imageUrl, { method: "HEAD" });
      if (checkResponse.ok || checkResponse.status === 200) {
        return true;
      }
    } catch (e) {
      // Ignore fetch errors during polling
    }
    // Wait 1 second before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.warn("Background removal took too long or failed.");
  return false;
}
