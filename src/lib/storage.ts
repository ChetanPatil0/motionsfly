import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Root of all private uploads. Deliberately OUTSIDE /public so nothing here
 * is ever served by Next.js's static file server — every read must go
 * through an authorized route handler (see /api/downloads/[token]).
 */
export const STORAGE_ROOT = path.join(process.cwd(), "storage");
export const PRODUCTS_DIR = path.join(STORAGE_ROOT, "products");
export const TMP_DIR = path.join(STORAGE_ROOT, "tmp");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/** Generates a safe, unguessable storage key — never trusts the original filename (Section 81). */
export function generateStorageKey(productId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const randomId = crypto.randomBytes(16).toString("hex");
  return path.posix.join("products", productId, `${randomId}${ext}`);
}

/**
 * Step 1 of the transactional upload flow: write the incoming file to a
 * temp location first. Nothing here is final or DB-referenced yet.
 */
export async function stageTempFile(buffer: Buffer): Promise<string> {
  await ensureDir(TMP_DIR);
  const tempName = `${crypto.randomBytes(16).toString("hex")}.tmp`;
  const tempPath = path.join(TMP_DIR, tempName);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
}

/**
 * Step 2: only called AFTER the Prisma transaction that creates the
 * ProductFile row has committed successfully. Moves the staged temp file
 * into its permanent, safe-keyed location. If the DB transaction fails,
 * the caller should call discardTempFile instead — nothing orphaned ever
 * reaches permanent storage.
 */
export async function commitStagedFile(tempPath: string, storageKey: string): Promise<void> {
  const finalPath = path.join(STORAGE_ROOT, storageKey);
  await ensureDir(path.dirname(finalPath));
  await fs.rename(tempPath, finalPath);
}

/** Cleans up a staged temp file when the surrounding transaction failed. */
export async function discardTempFile(tempPath: string): Promise<void> {
  await fs.unlink(tempPath).catch(() => {
    /* already gone — fine */
  });
}

/** Reads a permanently stored file for an authorized download. */
export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_ROOT, storageKey);
  return fs.readFile(fullPath);
}

/** Deletes a single stored file. Never throws if the file is already gone. */
export async function deleteStoredFile(storageKey: string): Promise<void> {
  const fullPath = path.join(STORAGE_ROOT, storageKey);
  await fs.unlink(fullPath).catch(() => {
    /* already gone — fine */
  });
}

/**
 * Deletes every file belonging to a product (its whole folder). Called
 * whenever a product is permanently deleted, so paid files never become
 * orphaned garbage on disk (per the "clean up related files on delete"
 * requirement).
 */
export async function deleteProductFolder(productId: string): Promise<void> {
  const dir = path.join(PRODUCTS_DIR, productId);
  await fs.rm(dir, { recursive: true, force: true });
}

const ALLOWED_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "application/octet-stream",
  "video/mp4",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/x-photoshop",
  "image/vnd.adobe.photoshop",
]);

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export function validateUploadedFile(file: { type: string; size: number; name: string }): string | null {
  if (file.size <= 0) return "File is empty.";
  if (file.size > MAX_FILE_SIZE_BYTES) return "File exceeds the 500MB size limit.";
  if (!ALLOWED_MIME_TYPES.has(file.type)) return "This file type is not allowed.";
  if (!/^[\w\-. ]+$/.test(file.name)) return "File name contains invalid characters.";
  return null;
}
