import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { savePublicImage, validateImageFile, deletePublicImage } from "@/lib/public-storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const slide = await prisma.heroSlide.findUnique({ where: { id: params.id } });
  if (!slide) return apiError("Slide not found.", [], 404);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("No image provided.", [], 422);

  const validationError = validateImageFile({ type: file.type, size: file.size });
  if (validationError) return apiError(validationError, [], 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicPath = await savePublicImage(buffer, file.type);

  const updated = await prisma.heroSlide.update({ where: { id: params.id }, data: { imageUrl: publicPath } });

  if (slide.imageUrl) await deletePublicImage(slide.imageUrl);

  return apiSuccess(updated, "Slide image updated successfully.");
});
