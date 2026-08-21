import CryptoJS from "crypto-js";

/**
 * Uploads an image to Cloudinary using signed upload.
 * Make sure to set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_API_KEY, and EXPO_PUBLIC_CLOUDINARY_API_SECRET
 * in your .env file.
 */
export const uploadToCloudinary = async (
  localUri: string,
  folder?: string,
): Promise<string | null> => {
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET?.trim();
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

    if (!cloudName) {
      console.warn("Cloudinary cloud name missing in configuration.");
      return null;
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();

    const fileName = localUri.split("/").pop() || "image.jpg";
    const fileExt = (fileName.split(".").pop() || "jpg").toLowerCase();
    const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";

    const data = new FormData();
    data.append("file", {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);

    if (apiSecret && apiKey) {
      let paramsToSign = folder ? `folder=${folder}&timestamp=${timestamp}` : `timestamp=${timestamp}`;
      const signature = CryptoJS.SHA1(paramsToSign + apiSecret).toString();
      data.append("api_key", apiKey);
      data.append("timestamp", timestamp);
      data.append("signature", signature);
    } else if (uploadPreset) {
      data.append("upload_preset", uploadPreset);
    } else {
      console.warn("Cloudinary upload requires either signed keys or EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      return null;
    }
    if (folder) {
      data.append("folder", folder);
    }

    // FormData multipart upload — not JSON, so keep the raw fetch but bound the
    // request so a hung upload can't spin the scanner forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: data,
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        },
      );

      const json = await response.json();

      if (json.secure_url) {
        return json.secure_url;
      } else {
        console.error("Cloudinary upload failed:", json);
        return null;
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};
