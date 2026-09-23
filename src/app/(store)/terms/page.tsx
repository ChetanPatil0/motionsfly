import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updatedAt="August 31, 2026">
      <p>
        These Terms of Service govern your use of MotionFly and any purchase of digital products, tutorials, or
        subscriptions from us. By using the site, you agree to these terms.
      </p>

      <h2>Digital Products &amp; Licenses</h2>
      <p>
        Products purchased on MotionFly are licensed for your personal or commercial use as described on the
        individual product page. Redistribution, resale, or sharing of purchased files without authorization is
        prohibited.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activity
        under your account. Guest checkout is available for one-time purchases; a registered account is required
        for subscriptions.
      </p>

      <h2>Payments</h2>
      <p>
        Prices are shown in INR for customers in India and USD for other supported countries, based on your
        checkout details. All payments are processed by our secure payment methods. We do not store your
        full payment card details.
      </p>

      <h2>Downloads</h2>
      <p>
        Secure download links are provided after successful payment and are subject to an expiry time and a
        maximum number of downloads, both configurable by us and shown in your account.
      </p>

      <h2>Subscriptions</h2>
      <p>
        Subscription plans renew automatically for the selected billing interval unless cancelled. You may cancel
        at any time from your account; access continues until the end of the current billing period.
      </p>

      <h2>Refunds</h2>
      <p>
        Refund eligibility is described in our <a href="/refund-policy">Refund Policy</a>.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        MotionFly is provided "as is" without warranties of any kind. We are not liable for indirect or
        consequential damages arising from use of our products or services.
      </p>

      <h2>Changes to These Terms</h2>
      <p>We may update these terms from time to time. Continued use of the site after changes constitutes acceptance.</p>
    </LegalPageLayout>
  );
}
