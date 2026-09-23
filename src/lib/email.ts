import { prisma } from "@/lib/prisma";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

// Singleton transporter instance
let transporter: any = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host && !user) {
    return null;
  }

  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.createTransport({
      host: host || "smtp.gmail.com",
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
    return transporter;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email:nodemailer:init_error]", err);
    return null;
  }
}

async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const mailer = await getTransporter();
  if (!mailer) {
    // No SMTP transporter configured — log cleanly instead of failing the calling flow.
    // eslint-disable-next-line no-console
    console.log("[email:skip:no-smtp-configured]", { to: params.to, subject: params.subject });
    return false;
  }

  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const fromName = settings.emailSenderName || "MotionFly";
  const fromAddress = settings.emailSenderAddress || process.env.EMAIL_FROM || "noreply@motionfly.example";

  try {
    await mailer.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (err) {
    // Email is always best-effort — never let a delivery failure break
    // order fulfillment, checkout, or auth flows.
    // eslint-disable-next-line no-console
    console.error("[email:error]", err);
    return false;
  }
}

function wrapTemplate(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1f2b;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #71717a;">— MotionFly</p>
    </div>
  `;
}

async function categoryEnabled(category: "order" | "invoice" | "download" | "subscription"): Promise<boolean> {
  const settings = await prisma.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  switch (category) {
    case "order":
      return settings.orderEmailsEnabled;
    case "invoice":
      return settings.invoiceEmailsEnabled;
    case "download":
      return settings.downloadEmailsEnabled;
    case "subscription":
      return settings.subscriptionEmailsEnabled;
  }
}

export async function sendOrderConfirmationEmail(params: { to: string; orderNumber: string; total: string }) {
  if (!(await categoryEnabled("order"))) return;
  await sendEmail({
    to: params.to,
    subject: `Order Confirmed — ${params.orderNumber}`,
    html: wrapTemplate(
      "Order Confirmed",
      `<p>Thanks for your order! Your order <strong>${params.orderNumber}</strong> for ${params.total} has been confirmed.</p>`
    ),
  });
}

export async function sendInvoiceEmail(params: { to: string; invoiceNumber: string; orderNumber: string; total: string }) {
  if (!(await categoryEnabled("invoice"))) return;
  await sendEmail({
    to: params.to,
    subject: `Invoice ${params.invoiceNumber}`,
    html: wrapTemplate(
      "Your Invoice",
      `<p>Invoice <strong>${params.invoiceNumber}</strong> for order ${params.orderNumber} (${params.total}) is ready. You can view it from your account at any time.</p>`
    ),
  });
}

export async function sendDownloadLinkEmail(params: { to: string; productTitle: string; downloadUrl: string }) {
  if (!(await categoryEnabled("download"))) return;
  await sendEmail({
    to: params.to,
    subject: `Your download: ${params.productTitle}`,
    html: wrapTemplate(
      "Your Download Is Ready",
      `<p><strong>${params.productTitle}</strong> is ready to download.</p>
       <p><a href="${params.downloadUrl}" style="display:inline-block;background:#1a1f2b;color:#f4f6f8;padding:10px 16px;border-radius:6px;text-decoration:none;">Download Now</a></p>
       <p style="font-size:12px;color:#5b6472;">This link may expire or have a limited number of uses — check your account for details.</p>`
    ),
  });
}

export async function sendSubscriptionStartedEmail(params: { to: string; planName: string }) {
  if (!(await categoryEnabled("subscription"))) return;
  await sendEmail({
    to: params.to,
    subject: `Welcome to ${params.planName}`,
    html: wrapTemplate("Subscription Started", `<p>Your <strong>${params.planName}</strong> subscription is now active. Enjoy full access to premium content.</p>`),
  });
}

export async function sendSubscriptionRenewedEmail(params: { to: string; planName: string; nextRenewal: string }) {
  if (!(await categoryEnabled("subscription"))) return;
  await sendEmail({
    to: params.to,
    subject: `Your ${params.planName} subscription renewed`,
    html: wrapTemplate(
      "Subscription Renewed",
      `<p>Your <strong>${params.planName}</strong> subscription has been renewed. Your next renewal is on ${params.nextRenewal}.</p>`
    ),
  });
}

export async function sendSubscriptionCancelledEmail(params: { to: string; planName: string; accessUntil: string }) {
  if (!(await categoryEnabled("subscription"))) return;
  await sendEmail({
    to: params.to,
    subject: `Your ${params.planName} subscription was cancelled`,
    html: wrapTemplate(
      "Subscription Cancelled",
      `<p>Your <strong>${params.planName}</strong> subscription has been cancelled. You'll retain premium access until ${params.accessUntil}.</p>`
    ),
  });
}

export async function sendSubscriptionExpiringEmail(params: {
  to: string;
  planName: string;
  expiresOn: string;
  daysLeft: number;
}) {
  if (!(await categoryEnabled("subscription"))) return;
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendEmail({
    to: params.to,
    subject: `Notice: Your ${params.planName} subscription expires in ${params.daysLeft} days`,
    html: wrapTemplate(
      "PRO Subscription Expiring Soon",
      `<p>Your <strong>${params.planName}</strong> subscription is scheduled to end on <strong>${params.expiresOn}</strong> (${params.daysLeft} days remaining).</p>
       <p>To ensure uninterrupted access to all video masterclasses, project files, and creative plugins, please review your billing method or renew your plan.</p>
       <p style="margin-top:20px;"><a href="${appUrl}/account/subscription" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;padding:11px 20px;border-radius:6px;text-decoration:none;">Manage Subscription &amp; Billing</a></p>`
    ),
  });
}

export async function sendSubscriptionExpiredEmail(params: {
  to: string;
  planName: string;
  expiredOn: string;
}) {
  if (!(await categoryEnabled("subscription"))) return;
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendEmail({
    to: params.to,
    subject: `Your ${params.planName} subscription has expired`,
    html: wrapTemplate(
      "PRO Subscription Expired",
      `<p>Your <strong>${params.planName}</strong> subscription expired on <strong>${params.expiredOn}</strong>.</p>
       <p>Your unlimited zero-cost downloads and 4K streaming access have been temporarily paused. You can easily reactivate your membership at any time.</p>
       <p style="margin-top:20px;"><a href="${appUrl}/subscriptions" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;padding:11px 20px;border-radius:6px;text-decoration:none;">Reactivate PRO Membership</a></p>`
    ),
  });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  await sendEmail({
    to: params.to,
    subject: "Reset your MotionFly password",
    html: wrapTemplate(
      "Reset Your Password",
      `<p>We received a request to reset your password. This link expires in 30 minutes.</p>
       <p><a href="${params.resetUrl}" style="display:inline-block;background:#1a1f2b;color:#f4f6f8;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
       <p style="font-size:12px;color:#5b6472;">If you didn't request this, you can safely ignore this email.</p>`
    ),
  });
}

export async function sendContactFormEmail(params: { to: string; fromName: string; fromEmail: string; message: string }) {
  await sendEmail({
    to: params.to,
    subject: `New contact form message from ${params.fromName}`,
    html: wrapTemplate(
      "New Contact Message",
      `<p><strong>From:</strong> ${params.fromName} (${params.fromEmail})</p><p>${params.message}</p>`
    ),
  });
}

export async function sendOtpEmail(params: { to: string; code: string }) {
  await sendEmail({
    to: params.to,
    subject: "Your MotionFly verification code",
    html: wrapTemplate("Verify Your Email", `<p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${params.code}</p>`),
  });
}
