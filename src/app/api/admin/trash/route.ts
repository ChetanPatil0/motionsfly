import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { deletePublicImage } from "@/lib/public-storage";

export const GET = withErrorHandling(async () => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const [products, tutorials] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        priceINR: true,
        priceUSD: true,
        deletedAt: true,
      },
    }),
    prisma.tutorial.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        accessType: true,
        deletedAt: true,
      },
    }),
  ]);

  return apiSuccess({ products, tutorials }, "Trash loaded.");
});

const deleteTrashSchema = z.object({
  type: z.enum(["PRODUCT", "TUTORIAL"]),
  id: z.string().uuid(),
});

export const DELETE = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = deleteTrashSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input.", parsed.error.issues, 422);

  const { type, id } = parsed.data;

  if (type === "PRODUCT") {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (product) {
      if (product.thumbnail) await deletePublicImage(product.thumbnail);
      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (typeof img === "string" && img) await deletePublicImage(img);
        }
      }
      const { deleteProductFolder } = await import("@/lib/storage");
      await deleteProductFolder(product.id).catch(() => {});
      await prisma.product.delete({ where: { id } });
    }
  } else {
    const tutorial = await prisma.tutorial.findUnique({ where: { id } });
    if (tutorial) {
      if (tutorial.thumbnail) await deletePublicImage(tutorial.thumbnail);
      if (tutorial.videoStorageKey) {
        const { deleteStoredFile } = await import("@/lib/storage");
        await deleteStoredFile(tutorial.videoStorageKey).catch(() => {});
      }
      await prisma.tutorial.delete({ where: { id } });
    }
  }

  return apiSuccess(null, "Item permanently deleted from database and storage.");
});
