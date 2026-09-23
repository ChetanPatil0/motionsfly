import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { savePublicImage, validateImageFile, deletePublicImage } from "@/lib/public-storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("No image provided.", [], 422);

  const validationError = validateImageFile({ type: file.type, size: file.size });
  if (validationError) return apiError(validationError, [], 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicPath = await savePublicImage(buffer, file.type);

  const current = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: { favicon: publicPath },
    create: { id: "default", favicon: publicPath },
  });

  if (current?.favicon) await deletePublicImage(current.favicon);

  return apiSuccess(settings, "Favicon updated successfully.");
});
