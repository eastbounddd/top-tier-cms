import sharp from "sharp";

export const coverWidth = 1600;
export const coverHeight = 900;
export const coverUploadLimit = 15 * 1024 * 1024;

export function coverCrop(input: Buffer) {
  return sharp(input, { limitInputPixels: 40_000_000 })
    .autoOrient()
    .resize(coverWidth, coverHeight, { fit: "cover", position: "centre" });
}

export async function normalizeArticleCover(input: Buffer) {
  const image = coverCrop(input);
  const { format, autoOrient: { width, height } } = await image.metadata();
  if (format !== "jpeg" && format !== "png" && format !== "webp") {
    throw new Error("Choose a JPEG, PNG, or WebP cover image.");
  }
  return {
    bytes: await image.webp({ quality: 85 }).toBuffer(),
    originalWidth: width,
    upscaled: width < coverWidth || height < coverHeight,
  };
}
