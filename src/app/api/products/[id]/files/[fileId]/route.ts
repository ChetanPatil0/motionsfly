import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { deleteStoredFile } from "@/lib/storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const DELETE = withErrorHandling(
  async (_req: Request, { params }: { params: { id: string; fileId: string } }) => {
    const admin = await requireAdmin();
    if (!admin) return apiError("You do not have access to this resource.", [], 403);

    const file = await prisma.productFile.findUnique({ where: { id: params.fileId } });
    if (!file || file.productId !== params.id) return apiError("File not found.", [], 404);

    // DB row removed first. Disk cleanup only happens after that succeeds,
    // so a failed delete never leaves the DB pointing at a missing file.
    await prisma.productFile.delete({ where: { id: params.fileId } });
    await deleteStoredFile(file.storageKey);

    return apiSuccess(null, "File deleted successfully.");
  }
);
