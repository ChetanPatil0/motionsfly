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

  if (product.images.length >= 16) {
    return apiError("A product can have at most 16 gallery images or demo GIFs.", [], 422);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicPath = await savePublicImage(buffer, file.type);

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { images: { push: publicPath } },
  });

  return apiSuccess(updated, "Image added to gallery.");
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const imagePath = url.searchParams.get("path");
  if (!imagePath) return apiError("Missing image path.", [], 422);

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return apiError("Product not found.", [], 404);

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { images: product.images.filter((img) => img !== imagePath) },
  });

  await deletePublicImage(imagePath);

  return apiSuccess(updated, "Image removed from gallery.");
});
