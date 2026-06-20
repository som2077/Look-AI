import * as FileSystem from "expo-file-system";

/**
 * Uploads an image to Cloudinary using unsigned upload.
 * Make sure to set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 * in your .env file.
 */
export const uploadToCloudinary = async (
  localUri: string,
  folder?: string,
): Promise<string | null> => {
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn("Cloudinary configuration missing in .env file.");
      return null;
    }

    // Convert local file to base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: "base64",
    });

    const fileExt = localUri.split(".").pop() || "jpg";
    const dataUri = `data:image/${fileExt};base64,${base64}`;

    const data = new FormData();
    data.append("file", dataUri);
    data.append("upload_preset", uploadPreset);
    if (folder) {
      data.append("folder", folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
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
