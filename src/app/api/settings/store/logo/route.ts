import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { savePublicImage, validateImageFile, deletePublicImage } from "@/lib/public-storage";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { parseLogo, serializeLogo } from "@/lib/logo-helper";

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const formData = await req.formData();
  const file = formData.get("file");
  const variant = (formData.get("variant")?.toString() || "light").toLowerCase();

  if (!(file instanceof File)) return apiError("No image provided.", [], 422);

  const validationError = validateImageFile({ type: file.type, size: file.size });
  if (validationError) return apiError(validationError, [], 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicPath = await savePublicImage(buffer, file.type);

  const current = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  const logoConfig = parseLogo(current?.storeLogo);
  const oldPath = variant === "dark" ? logoConfig.dark : logoConfig.light;

  if (variant === "dark") {
    logoConfig.dark = publicPath;
    if (!logoConfig.light) logoConfig.light = publicPath;
  } else {
    logoConfig.light = publicPath;
    if (!logoConfig.dark) logoConfig.dark = publicPath;
  }

  const serialized = serializeLogo(logoConfig);
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: { storeLogo: serialized },
    create: { id: "default", storeLogo: serialized },
  });

  if (oldPath && oldPath !== publicPath && oldPath !== logoConfig.light && oldPath !== logoConfig.dark) {
    await deletePublicImage(oldPath);
  }

  return apiSuccess({ ...settings, logos: logoConfig }, "Logo updated successfully.");
});
