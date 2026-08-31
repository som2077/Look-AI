/**
 * Cloudinary URL transform helper.
 *
 * One function every UI component uses to size a Cloudinary image for its
 * display context. Replaces the previous ad-hoc inline string-replace logic
 * (which had a single w_512/w_768 width and no height/quality control).
 *
 * Contexts are tuned to the actual rendered size in the app:
 *  - "thumbnail" 160x160 cover — small chips, list leading icons
 *  - "card"      512 wide        — wardrobe grid, scan history, outfit cards
 *  - "full"      1024 wide       — detail views, share previews
 *  - "vision"    768 wide        — sent to OpenAI Vision (matches w_768 ceiling
 *                                  OpenAI recommends for outfit/garment images)
 *
 * Every transform applies:
 *  - f_auto  → server picks WebP/AVIF/JPEG based on client
 *  - q_auto  → server picks quality by content (low entropy → lower quality)
 *  - c_limit → never upscale small images
 *
 * Non-Cloudinary URLs (file://, data:, https URLs that aren't cloudinary) are
 * returned untouched. The helper is pure — safe to call inside render.
 */

export type CloudinaryContext = "thumbnail" | "card" | "full" | "vision";

interface Transform {
  width: number;
  height?: number;
  crop: "fill" | "limit" | "scale";
}

const TRANSFORMS: Record<CloudinaryContext, Transform> = {
  thumbnail: { width: 160, height: 160, crop: "fill" },
  card: { width: 512, crop: "limit" },
  full: { width: 1024, crop: "limit" },
  vision: { width: 768, crop: "limit" },
};

function buildTransformString(t: Transform): string {
  const parts: string[] = [
    `w_${t.width}`,
    `c_${t.crop}`,
    "q_auto",
    "f_auto",
  ];
  if (t.height) parts.push(`h_${t.height}`);
  return parts.join(",");
}

const TRANSFORM_STRINGS: Record<CloudinaryContext, string> = Object.fromEntries(
  (Object.keys(TRANSFORMS) as CloudinaryContext[]).map((ctx) => [
    ctx,
    buildTransformString(TRANSFORMS[ctx]),
  ]),
) as Record<CloudinaryContext, string>;

/**
 * Return a Cloudinary URL sized for the given context. Pass-through for any
 * URL that isn't a Cloudinary delivery URL.
 *
 * Idempotent: if the URL already has our transform prefix, it's left alone.
 */
export function cloudinaryUrl(
  url: string | null | undefined,
  ctx: CloudinaryContext = "card",
): string {
  if (!url) return "";
  if (!url.includes("cloudinary.com")) return url;
  if (!url.includes("/upload/")) return url;

  const target = TRANSFORM_STRINGS[ctx];

  // Already transformed? Leave it.
  if (url.includes(`/${target}/`)) return url;

  // Strip any earlier w_/h_/c_/q_/f_ transforms we may have inserted before.
  // Cloudinary transforms live in the segment right after /upload/.
  return url.replace(/\/upload\/[^/]+\//, `/upload/${target}/`);
}

/**
 * Build all standard sizes for a single Cloudinary asset. Use this when you
 * need to set <Image source={[…]} /> for blurhash-style progressive loading
 * or when eager-transforming during upload.
 */
export function cloudinaryUrlSet(
  url: string | null | undefined,
): Record<CloudinaryContext, string> {
  return {
    thumbnail: cloudinaryUrl(url, "thumbnail"),
    card: cloudinaryUrl(url, "card"),
    full: cloudinaryUrl(url, "full"),
    vision: cloudinaryUrl(url, "vision"),
  };
}
