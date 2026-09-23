import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { savePublicImage, validateImageFile, deletePublicImage } from "@/lib/public-storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return apiError("Product not found.", [], 404);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("No image provided.", [], 422);

  const validationError = validateImageFile({ type: file.type, size: file.size });
  if (validationError) return apiError(validationError, [], 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicPath = await savePublicImage(buffer, file.type);

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { thumbnail: publicPath },
  });

  // Clean up the previous thumbnail only after the DB row is safely updated.
  if (product.thumbnail && product.thumbnail !== publicPath) {
    await deletePublicImage(product.thumbnail);
  }

  return apiSuccess(updated, "Thumbnail updated successfully.");
});
