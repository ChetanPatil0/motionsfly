import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { HeaderActions } from "@/components/layout/header-actions";
import { CurrencyViewSwitcher } from "@/components/currency-view-switcher";
import { StoreLogo } from "@/components/store-logo";
import { prisma } from "@/lib/prisma";

import { MobileNav } from "@/components/layout/mobile-nav";

const NAV = [
  { href: "/products", label: "Products" },
  { href: "/tutorials", label: "Tutorials" },
  { href: "/subscriptions", label: "Subscriptions" },
];

export async function StoreHeader() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    prisma.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } }),
  ]);

  const isAdmin = (user as { role?: string } | null)?.role === "ADMIN";
  const currencyView = (cookies().get("mf_currency_view")?.value as "INR" | "USD" | undefined) ?? "INR";

  let isPremium = false;
  if (user && (user as { id?: string }).id) {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId: (user as { id: string }).id,
        status: "ACTIVE",
        currentPeriodEnd: { gt: new Date() },
      },
    });
    isPremium = !!sub;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <MobileNav
            navItems={NAV}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
            isPremium={isPremium}
          />
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <StoreLogo logo={settings.storeLogo} storeName={settings.storeName} />
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isAdmin && <CurrencyViewSwitcher initial={currencyView} />}
          <HeaderActions
            isAdmin={isAdmin}
            isLoggedIn={!!user}
            isPremium={isPremium}
            user={
              user
                ? {
                    name: (user as { name?: string | null }).name ?? "Account",
                    email: (user as { email?: string | null }).email ?? "",
                  }
                : null
            }
          />
        </div>
      </div>
    </header>
  );
}
