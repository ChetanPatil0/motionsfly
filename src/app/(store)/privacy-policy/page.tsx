import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updatedAt="August 31, 2026">
      <p>
        This Privacy Policy explains how MotionFly ("we", "us", "our") collects, uses, and protects your
        information when you use our website and purchase digital products, tutorials, or subscriptions.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Account information: name, email address, and password (stored as a secure hash, never in plain text).</li>
        <li>Order information: billing name, billing address, and purchase history.</li>
        <li>Payment information: processed directly by our secure payment methods (Razorpay, Stripe, PayPal). We never store your card or bank details on our servers.</li>
        <li>Usage information: pages visited, downloads, and general interaction with the site, used to improve the product.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To process orders, subscriptions, and deliver secure downloads.</li>
        <li>To send transactional emails (order confirmations, invoices, download links, subscription updates).</li>
        <li>To provide customer support.</li>
        <li>To maintain the security and integrity of our platform.</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        We share information with payment processors only as necessary to complete a transaction. We do not sell
        your personal information to third parties.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain order and subscription records for as long as necessary to comply with legal, tax, and accounting
        requirements, and to provide ongoing access to your purchases and download history.
      </p>

      <h2>Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by contacting us through our{" "}
        <a href="/contact">Contact page</a>. Note that deleting your account does not remove records required for
        legal or accounting purposes, such as completed orders.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies for authentication, cart persistence (for guest checkout), and theme preference.
        We do not use third-party advertising cookies.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent via our <a href="/contact">Contact page</a>.</p>
    </LegalPageLayout>
  );
}
