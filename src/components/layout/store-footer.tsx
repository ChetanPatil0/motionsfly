import Link from "next/link";
import { Instagram, Twitter, Youtube, Facebook, Linkedin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StoreLogo } from "@/components/store-logo";

export async function StoreFooter() {
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const socialLinks = [
    { url: settings.instagramUrl, icon: Instagram, label: "Instagram" },
    { url: settings.twitterUrl, icon: Twitter, label: "Twitter / X" },
    { url: settings.youtubeUrl, icon: Youtube, label: "YouTube" },
    { url: settings.facebookUrl, icon: Facebook, label: "Facebook" },
    { url: settings.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => s.url);

  return (
    <footer className="border-t">
      <div className="container grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Shop</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-foreground transition-colors">Products</Link></li>
            <li><Link href="/tutorials" className="hover:text-foreground transition-colors">Tutorials</Link></li>
            <li><Link href="/subscriptions" className="hover:text-foreground transition-colors">Subscriptions</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Legal</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            <li><Link href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
        {socialLinks.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold">Follow Us</h3>
            <div className="flex gap-3">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="container border-t py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <StoreLogo logo={settings.storeLogo} storeName={settings.storeName} imgClassName="h-6 w-auto max-h-6 max-w-[130px] object-contain" />
        <div>{settings.footerText || `\u00a9 ${new Date().getFullYear()} ${settings.storeName || "MotionFly"}. All rights reserved.`}</div>
      </div>
    </footer>
  );
}
