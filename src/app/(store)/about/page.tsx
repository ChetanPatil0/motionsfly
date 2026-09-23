import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <LegalPageLayout title="About MotionFly">
      <p>
        MotionFly is a single-owner marketplace for digital products, resources, and tutorials — built for
        motion designers, video editors, and content creators who want tools that just work.
      </p>
      <p>
        We sell templates, presets, plugins, LUTs, and project files alongside in-depth tutorials, with a
        premium subscription for unlimited access to our full tutorial library.
      </p>
      <h2>What We Believe</h2>
      <ul>
        <li>Digital products should be delivered instantly and securely, without friction.</li>
        <li>Pricing should be transparent, in your local currency, with no hidden fees.</li>
        <li>Support should come from real people who understand the tools we sell.</li>
      </ul>
      <p>
        Have a question or want to work with us? Visit our <a href="/contact">Contact page</a>.
      </p>
    </LegalPageLayout>
  );
}
