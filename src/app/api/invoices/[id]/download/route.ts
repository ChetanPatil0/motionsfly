import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { DEFAULT_INVOICE_TEMPLATE, renderInvoiceHtml } from "@/lib/invoice-template";
import { formatMoney } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { order: { include: { items: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });
  }

  const user = await getCurrentUser();
  const isOwner = user && invoice.userId === (user as { id: string }).id;
  const isAdmin = user && (user as { role?: string }).role === "ADMIN";

  const url = new URL(_req.url);
  const orderNumberParam = url.searchParams.get("orderNumber");
  const isOrderAuthorized = orderNumberParam && invoice.order.orderNumber === orderNumberParam;

  if (!isOwner && !isAdmin && !isOrderAuthorized) {
    return NextResponse.json({ success: false, message: "You do not have access to this invoice." }, { status: 403 });
  }

  const settings = await prisma.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const template = settings.invoiceTemplateHtml || DEFAULT_INVOICE_TEMPLATE;

  const { parseLogo } = await import("@/lib/logo-helper");
  const logoConfig = parseLogo(settings.storeLogo);
  const logoUrl = logoConfig.light || logoConfig.dark || "";

  const itemsHtml = invoice.order.items.length > 0
    ? `<table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; text-align: left;">
            <th style="padding: 8px 4px;">Item</th>
            <th style="padding: 8px 4px; text-align: center;">Qty</th>
            <th style="padding: 8px 4px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.order.items
            .map(
              (item) => {
                const safeTitle = item.itemTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 4px;">${safeTitle}</td>
              <td style="padding: 10px 4px; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px 4px; text-align: right;">${formatMoney(item.price * item.quantity, item.currency)}</td>
            </tr>`;
              }
            )
            .join("")}
        </tbody>
      </table>`
    : "";

  const html = renderInvoiceHtml(template, {
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: invoice.order.orderNumber,
    date: invoice.issuedAt.toLocaleDateString(),
    billingName: invoice.billingName,
    billingEmail: invoice.billingEmail,
    subtotal: formatMoney(invoice.subtotal, invoice.currency),
    discount: formatMoney(invoice.discount, invoice.currency),
    total: formatMoney(invoice.total, invoice.currency),
    paymentMethod: invoice.paymentMethod ?? "—",
    storeName: settings.storeName,
    storeLogo: logoUrl,
    storeEmail: settings.storeEmail ?? "",
    supportEmail: settings.supportEmail ?? "",
    itemsTable: itemsHtml,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
