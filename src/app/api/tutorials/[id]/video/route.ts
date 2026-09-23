import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { stageTempFile, commitStagedFile, discardTempFile, deleteStoredFile } from "@/lib/storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200MB max

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const tutorial = await prisma.tutorial.findUnique({ where: { id: params.id } });
  if (!tutorial) return apiError("Tutorial not found.", [], 404);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("No file provided.", [], 422);

  if (!ALLOWED_VIDEO_TYPES.has(file.type)) return apiError("Only MP4, WebM, or MOV videos are allowed.", [], 422);
  if (file.size > MAX_VIDEO_SIZE_BYTES) return apiError("Video exceeds the 200MB size limit.", [], 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "") || ".mp4";
  const storageKey = path.posix.join("tutorials", tutorial.id, `${crypto.randomBytes(16).toString("hex")}${ext}`);

  const tempPath = await stageTempFile(buffer);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      return tx.tutorial.update({
        where: { id: tutorial.id },
        data: { contentType: "UPLOADED_VIDEO", videoStorageKey: storageKey, videoSizeBytes: file.size },
      });
    });

    await commitStagedFile(tempPath, storageKey);

    // Clean up the previous video file, if any, now that the new one is committed.
    if (tutorial.videoStorageKey && tutorial.videoStorageKey !== storageKey) {
      await deleteStoredFile(tutorial.videoStorageKey);
    }

    return apiSuccess(updated, "Video uploaded successfully.");
  } catch (err) {
    await discardTempFile(tempPath);
    throw err;
  }
});
