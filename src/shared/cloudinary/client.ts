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

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("Cloudinary configuration missing in .env file.");
      return null;
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Construct params to sign (must be alphabetical)
    let paramsToSign = "";
    if (folder) {
      paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    } else {
      paramsToSign = `timestamp=${timestamp}`;
    }

    const signature = CryptoJS.SHA1(paramsToSign + apiSecret).toString();

    const fileName = localUri.split("/").pop() || "image.jpg";
    const fileExt = (fileName.split(".").pop() || "jpg").toLowerCase();
    const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";

    const data = new FormData();
    data.append("file", {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);
    data.append("api_key", apiKey);
    data.append("timestamp", timestamp);
    data.append("signature", signature);
    if (folder) {
      data.append("folder", folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      },
    );

    const json = await response.json();

    if (json.secure_url) {
      return json.secure_url;
    } else {
      console.error("Cloudinary upload failed:", json);
      return null;
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};
