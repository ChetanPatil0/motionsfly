import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { productSchema } from "@/schemas/product";
import { deleteProductFolder } from "@/lib/storage";
import { deletePublicImage } from "@/lib/public-storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { files: true, category: true },
  });
  if (!product) return apiError("Product not found.", [], 404);
  return apiSuccess(product, "Product loaded.");
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
  return apiSuccess(product, "Product updated successfully.");
});

/**
 * Permanent delete requires explicit admin confirmation (handled client-side
 * with a confirm dialog before this is ever called). Cleans up every file on
 * disk belonging to the product — both the private ProductFiles and any
 * public thumbnail/gallery images — so nothing is left as orphaned garbage.
 */
export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const url = new URL(req.url);
  const hard = url.searchParams.get("hard") === "true";

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return apiError("Product not found.", [], 404);

  if (!hard) {
    await prisma.product.update({ where: { id: params.id }, data: { deletedAt: new Date(), isPublished: false } });
    return apiSuccess(null, "Product moved to trash.");
  }

  // Hard delete: DB row(s) first, inside a transaction; only clean up disk
  // files after the transaction commits, so a failed DB delete never leaves
  // the product referencing files that no longer exist.
  await prisma.$transaction(async (tx) => {
    await tx.productFile.deleteMany({ where: { productId: params.id } });
    await tx.product.delete({ where: { id: params.id } });
  });

  await deleteProductFolder(params.id);
  if (product.thumbnail) await deletePublicImage(product.thumbnail);
  for (const img of product.images) await deletePublicImage(img);

  return apiSuccess(null, "Product permanently deleted.");
});
