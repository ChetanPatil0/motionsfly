import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund &amp; Cancellation Policy" updatedAt="August 31, 2026">
      <h2>Digital Products</h2>
      <p>
        Because digital products are delivered instantly and irrevocably (via secure download), we generally do
        not offer refunds once a file has been downloaded. If you experience a technical issue — a corrupted file,
        a broken download link, or a product materially different from its description — contact us within 7 days
        of purchase and we'll investigate.
      </p>

      <h2>Tutorials</h2>
      <p>
        Paid and premium tutorial access is non-refundable once viewed, except in cases of a verified technical
        fault on our end.
      </p>

      <h2>Subscriptions</h2>
      <p>
        You can cancel your subscription at any time from your account. Cancelling stops future renewals, but we
        do not provide partial refunds for the remainder of an already-paid billing period — your premium access
        simply continues until that period ends.
      </p>

      <h2>How to Request a Refund</h2>
      <p>
        Reach out via our <a href="/contact">Contact page</a> with your order number and a description of the
        issue. Approved refunds are returned to your original payment method and may take 5–10 business days to
        appear, depending on your bank or payment provider.
      </p>
    </LegalPageLayout>
  );
}
