import Link from "next/link";
import { StoreLogo } from "@/components/store-logo";
import { prisma } from "@/lib/prisma";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let settings = {
    storeLogo: null as string | null,
    storeName: "MotionFly",
  };

  try {
    const dbSettings = await prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    if (dbSettings) {
      settings = dbSettings;
    }
  } catch {
    // Graceful fallback if database is not available during build
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-16">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <StoreLogo logo={settings.storeLogo} storeName={settings.storeName} />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
