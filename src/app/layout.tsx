import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { GlobalSubscriptionBanner } from "@/components/global-subscription-banner";

export const metadata: Metadata = {
  title: { default: "MotionFly", template: "%s | MotionFly" },
  description: "Premium digital products, resources, and tutorials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <GlobalSubscriptionBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
