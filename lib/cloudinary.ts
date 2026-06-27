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

    const fileName = localUri.split("/").pop() || "image.jpg";
    const fileExt = (fileName.split(".").pop() || "jpg").toLowerCase();
    const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";

    const data = new FormData();
    data.append("file", {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);
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
