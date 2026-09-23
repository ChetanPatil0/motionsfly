export const DEFAULT_INVOICE_TEMPLATE = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 40px 32px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
  <!-- Header with Logo and Store Details -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
    <tr>
      <td style="vertical-align: top;">
        {{storeLogo}}
        <h2 style="font-size: 20px; font-weight: 700; margin: 6px 0 0 0; color: #0f172a;">{{storeName}}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">{{storeEmail}}</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Support: {{supportEmail}}</p>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <span style="display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #4f46e5; background: #eef2ff; padding: 4px 10px; border-radius: 6px;">Receipt / Invoice</span>
        <h1 style="font-size: 18px; font-weight: 700; margin: 8px 0 2px 0; color: #0f172a;">{{invoiceNumber}}</h1>
        <p style="color: #64748b; font-size: 12px; margin: 0;">Order #{{orderNumber}} &middot; {{date}}</p>
      </td>
    </tr>
  </table>

  <!-- Billed To -->
  <div style="margin-bottom: 24px; padding: 14px 18px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
    <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #94a3b8;">Billed To</p>
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">{{billingName}}</p>
    <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">{{billingEmail}}</p>
  </div>

  <!-- Items Table -->
  {{itemsTable}}

  <!-- Calculation Summary -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
    <tr>
      <td style="width: 60%;"></td>
      <td style="padding: 6px 0; color: #64748b;">Subtotal</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 500;">{{subtotal}}</td>
    </tr>
    <tr>
      <td></td>
      <td style="padding: 6px 0; color: #64748b;">Discount</td>
      <td style="padding: 6px 0; text-align: right; color: #16a34a;">-{{discount}}</td>
    </tr>
    <tr style="border-top: 2px solid #e2e8f0; font-size: 15px; font-weight: 700;">
      <td></td>
      <td style="padding: 10px 0; color: #0f172a;">Total Paid</td>
      <td style="padding: 10px 0; text-align: right; color: #0f172a;">{{total}}</td>
    </tr>
  </table>

  <!-- Footer -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
    <tr>
      <td style="padding-top: 12px;">Payment Method: <strong>{{paymentMethod}}</strong></td>
      <td style="padding-top: 12px; text-align: right;">Need help? <strong>{{supportEmail}}</strong></td>
    </tr>
  </table>
</div>`;

export type InvoiceTemplateData = {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  billingName: string;
  billingEmail: string;
  subtotal: string;
  discount: string;
  total: string;
  paymentMethod: string;
  storeName?: string;
  storeLogo?: string;
  storeEmail?: string;
  supportEmail?: string;
  itemsTable?: string;
};

function escapeHtml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderInvoiceHtml(template: string, data: InvoiceTemplateData): string {
  let output = template;

  // Format logo if available
  const safeStoreLogo = data.storeLogo && /^https?:\/\//i.test(data.storeLogo) ? encodeURI(data.storeLogo) : "";
  const logoHtml = safeStoreLogo
    ? `<img src="${safeStoreLogo}" alt="${escapeHtml(data.storeName ?? "Store Logo")}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block; margin-bottom: 6px;" />`
    : "";

  const mergedData: Record<string, string> = {
    invoiceNumber: escapeHtml(data.invoiceNumber),
    orderNumber: escapeHtml(data.orderNumber),
    date: escapeHtml(data.date),
    billingName: escapeHtml(data.billingName),
    billingEmail: escapeHtml(data.billingEmail),
    subtotal: escapeHtml(data.subtotal),
    discount: escapeHtml(data.discount),
    total: escapeHtml(data.total),
    paymentMethod: escapeHtml(data.paymentMethod),
    storeName: escapeHtml(data.storeName || "MotionFly"),
    storeLogo: logoHtml,
    storeEmail: escapeHtml(data.storeEmail || "store@motionfly.dev"),
    supportEmail: escapeHtml(data.supportEmail || "support@motionfly.dev"),
    itemsTable: data.itemsTable || "",
  };

  for (const [key, value] of Object.entries(mergedData)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }

  return output;
}

export const SAMPLE_INVOICE_DATA: InvoiceTemplateData = {
  invoiceNumber: "INV-000001",
  orderNumber: "260101-000001",
  date: new Date().toLocaleDateString(),
  billingName: "Jordan Casey",
  billingEmail: "demo@motionfly.dev",
  subtotal: "₹2,498.00",
  discount: "₹0.00",
  total: "₹2,498.00",
  paymentMethod: "PAYPAL",
  storeName: "MotionFly",
  storeLogo: "",
  storeEmail: "store@motionfly.dev",
  supportEmail: "support@motionfly.dev",
  itemsTable: `
  <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; font-size: 13px;">
    <thead>
      <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; text-align: left;">
        <th style="padding: 8px 4px;">Item</th>
        <th style="padding: 8px 4px; text-align: center;">Qty</th>
        <th style="padding: 8px 4px; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 4px;">Cyberpunk Neon Presets Pack</td>
        <td style="padding: 10px 4px; text-align: center;">1</td>
        <td style="padding: 10px 4px; text-align: right;">₹1,499.00</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 4px;">Cinematic LUTs Vol. 2</td>
        <td style="padding: 10px 4px; text-align: center;">1</td>
        <td style="padding: 10px 4px; text-align: right;">₹999.00</td>
      </tr>
    </tbody>
  </table>`,
};
