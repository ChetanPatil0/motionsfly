import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  generateStorageKey,
  stageTempFile,
  commitStagedFile,
  discardTempFile,
  validateUploadedFile,
} from "@/lib/storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return apiError("Product not found.", [], 404);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("No file provided.", [], 422);

  const validationError = validateUploadedFile({ type: file.type, size: file.size, name: file.name });
  if (validationError) return apiError(validationError, [], 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = generateStorageKey(product.id, file.name);

  // Step 1: write to temp — nothing durable/referenced yet.
  const tempPath = await stageTempFile(buffer);

  try {
    // Step 2: create the DB row inside a transaction. The file is NOT moved
    // to its permanent location until this transaction has actually committed.
    const productFile = await prisma.$transaction(async (tx) => {
      return tx.productFile.create({
        data: {
          productId: product.id,
          storageKey,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
    });

    // Step 3: transaction succeeded — now, and only now, commit the file to
    // permanent storage.
    await commitStagedFile(tempPath, storageKey);

    return apiSuccess(productFile, "File uploaded successfully.", 201);
  } catch (err) {
    // DB transaction failed (or commit step threw) — discard the temp file
    // so nothing orphaned is left on disk.
    await discardTempFile(tempPath);
    throw err;
  }
});

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const files = await prisma.productFile.findMany({ where: { productId: params.id }, orderBy: { createdAt: "desc" } });
  return apiSuccess(files, "Files loaded.");
});
