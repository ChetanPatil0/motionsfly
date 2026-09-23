import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { DEFAULT_INVOICE_TEMPLATE, renderInvoiceHtml } from "@/lib/invoice-template";
import { formatMoney } from "@/lib/utils";
import { parseLogo } from "@/lib/logo-helper";
import Script from "next/script";

export const metadata = { title: "Invoice Receipt" };

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { orderNumber?: string; autoPrint?: string };
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { order: { include: { items: true } } },
  });

  if (!invoice) notFound();

  const user = await getCurrentUser();
  const isOwner = user && invoice.userId === (user as { id: string }).id;
  const isAdmin = user && (user as { role?: string }).role === "ADMIN";
  const isOrderAuthorized = searchParams.orderNumber && invoice.order.orderNumber === searchParams.orderNumber;

  if (!isOwner && !isAdmin && !isOrderAuthorized) {
    return (
      <div style={{ fontFamily: "sans-serif", textAlign: "center", padding: "60px 20px" }}>
        <h2>Access Denied</h2>
        <p style={{ color: "#666" }}>You do not have access to view this invoice.</p>
      </div>
    );
  }

  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const template = settings.invoiceTemplateHtml || DEFAULT_INVOICE_TEMPLATE;
  const logoConfig = parseLogo(settings.storeLogo);
  const logoUrl = logoConfig.light || logoConfig.dark || "";

  const itemsHtml = invoice.order.items.length > 0
    ? `<table style="width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 14px; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; text-align: left;">
            <th style="padding: 8px 4px;">Item Description</th>
            <th style="padding: 8px 4px; text-align: center;">Qty</th>
            <th style="padding: 8px 4px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.order.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 4px; font-weight: 500;">${item.itemTitle}</td>
              <td style="padding: 10px 4px; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px 4px; text-align: right; font-family: monospace;">${formatMoney(item.price * item.quantity, item.currency)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`
    : "";

  const renderedHtml = renderInvoiceHtml(template, {
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

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-8 px-4 font-sans text-foreground">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        strategy="lazyOnload"
      />

      {/* Action Toolbar (Hidden when printing or saving as PDF) */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 print:hidden">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Receipt #{invoice.invoiceNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="download-pdf-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow hover:opacity-90 transition-opacity"
          >
            Download PDF
          </button>
          <button
            type="button"
            id="print-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium border hover:bg-muted transition-colors"
          >
            Save as PDF / Print
          </button>
        </div>
      </div>

      {/* Invoice Document Card */}
      <div
        id="invoice-document"
        className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:m-0 print:w-full print:max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Print and PDF generation script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });

            document.getElementById('download-pdf-btn')?.addEventListener('click', function() {
              const el = document.getElementById('invoice-document');
              if (window.html2pdf && el) {
                const opt = {
                  margin: 10,
                  filename: 'invoice-${invoice.invoiceNumber}.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                window.html2pdf().from(el).set(opt).save();
              } else {
                window.print();
              }
            });

            ${searchParams.autoPrint === "1" ? `
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 400);
            });
            ` : ""}
          `,
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            @media print {
              body {
                background: #ffffff !important;
                padding: 0 !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              #invoice-document {
                border: none !important;
                box-shadow: none !important;
                max-width: 100% !important;
                padding: 0 !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
