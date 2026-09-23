import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

const emptyToNull = (val: unknown) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string" && val.trim() === "") return null;
  return val;
};

const nullableString = z.preprocess(emptyToNull, z.string().nullable().optional());

const nullableEmail = z.preprocess(
  emptyToNull,
  z.union([z.string().email("Please enter a valid email address."), z.null()]).optional()
);

const nullableUrl = z.preprocess(
  emptyToNull,
  z.union([z.string().url("Please enter a valid URL (starting with http:// or https://)."), z.null()]).optional()
);

const updateSettingsSchema = z.object({
  storeName: z.string().trim().min(1, "Store name cannot be empty.").optional(),
  storeLogo: nullableString,
  favicon: nullableString,
  storeEmail: nullableEmail,
  supportEmail: nullableEmail,
  defaultCountry: z.string().trim().length(2, "Default country must be a 2-letter ISO code.").optional(),
  timezone: z.string().trim().optional(),
  storeActive: z.boolean().optional(),
  isMaintenance: z.boolean().optional(),
  razorpayEnabled: z.boolean().optional(),
  stripeEnabled: z.boolean().optional(),
  paypalEnabled: z.boolean().optional(),
  subscriptionsEnabled: z.boolean().optional(),
  pointsPerCurrencyUnit: z.coerce.number().int().min(0, "Points cannot be negative.").optional(),
  invoiceTemplateHtml: nullableString,
  downloadExpiryMinutes: z.coerce.number().int().min(1, "Expiry minutes must be at least 1.").optional(),
  maxDownloads: z.coerce.number().int().min(1, "Maximum downloads must be at least 1.").optional(),
  emailSenderName: z.string().trim().optional(),
  emailSenderAddress: nullableEmail,
  orderEmailsEnabled: z.boolean().optional(),
  invoiceEmailsEnabled: z.boolean().optional(),
  downloadEmailsEnabled: z.boolean().optional(),
  subscriptionEmailsEnabled: z.boolean().optional(),
  heroTitle: nullableString,
  heroSubtitle: nullableString,
  footerText: nullableString,
  instagramUrl: nullableUrl,
  twitterUrl: nullableUrl,
  youtubeUrl: nullableUrl,
  facebookUrl: nullableUrl,
  linkedinUrl: nullableUrl,
});

export const GET = withErrorHandling(async () => {
  const admin = await requireAdmin();
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const paypalConfigured = Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());

  if (admin) {
    return apiSuccess({
      ...settings,
      razorpayConfigured,
      stripeConfigured,
      paypalConfigured,
    }, "Settings loaded.");
  }

  const publicSettings = {
    id: settings.id,
    storeName: settings.storeName,
    storeLogo: settings.storeLogo,
    favicon: settings.favicon,
    supportEmail: settings.supportEmail,
    defaultCountry: settings.defaultCountry,
    timezone: settings.timezone,
    storeActive: settings.storeActive,
    isMaintenance: settings.isMaintenance,
    razorpayEnabled: settings.razorpayEnabled,
    stripeEnabled: settings.stripeEnabled,
    paypalEnabled: settings.paypalEnabled,
    razorpayConfigured,
    stripeConfigured,
    paypalConfigured,
    subscriptionsEnabled: settings.subscriptionsEnabled,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    footerText: settings.footerText,
    instagramUrl: settings.instagramUrl,
    twitterUrl: settings.twitterUrl,
    youtubeUrl: settings.youtubeUrl,
    facebookUrl: settings.facebookUrl,
    linkedinUrl: settings.linkedinUrl,
  };

  return apiSuccess(publicSettings, "Settings loaded.");
});

export const PATCH = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  if (!admin) return apiError("You do not have access to this resource.", [], 403);

  const body = await req.json();
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const fieldName = firstIssue?.path?.join(".") ?? "field";
    const msg = firstIssue ? `${firstIssue.message} (${fieldName})` : "Invalid input.";
    return apiError(msg, parsed.error.issues, 422);
  }

  // Filter out undefined keys to only update specified fields
  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
  );

  // Clean up replaced images from disk to avoid storing unused files
  const existingSettings = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  if (existingSettings) {
    if (
      cleanData.storeLogo !== undefined &&
      existingSettings.storeLogo &&
      cleanData.storeLogo !== existingSettings.storeLogo
    ) {
      const { deletePublicImage } = await import("@/lib/public-storage");
      await deletePublicImage(existingSettings.storeLogo);
    }
    if (
      cleanData.favicon !== undefined &&
      existingSettings.favicon &&
      cleanData.favicon !== existingSettings.favicon
    ) {
      const { deletePublicImage } = await import("@/lib/public-storage");
      await deletePublicImage(existingSettings.favicon);
    }
  }

  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: cleanData,
    create: { id: "default", ...cleanData },
  });

  return apiSuccess(settings, "Settings saved successfully.");
});
