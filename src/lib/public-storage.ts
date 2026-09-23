import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (file.size <= 0) return "Image is empty.";
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "Image exceeds the 15MB size limit.";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Only PNG, JPEG, WEBP, or GIF images are allowed.";
  return null;
}

/** Saves a public image (thumbnail/gallery) and returns its public URL path. */
export async function savePublicImage(buffer: Buffer, mimeType: string): Promise<string> {
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
      ? "webp"
      : mimeType === "image/gif"
      ? "gif"
      : "jpg";
  const fileName = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(PUBLIC_UPLOADS_DIR, fileName), buffer);
  return `/uploads/${fileName}`;
}

export async function deletePublicImage(publicPath: string): Promise<void> {
  if (!publicPath || typeof publicPath !== "string" || !publicPath.startsWith("/uploads/")) return;
  const fileName = path.basename(publicPath); // strictly take the basename to prevent directory traversal
  const fullPath = path.resolve(PUBLIC_UPLOADS_DIR, fileName);
  if (!fullPath.startsWith(path.resolve(PUBLIC_UPLOADS_DIR))) return;
  await fs.unlink(fullPath).catch(() => {});
}
