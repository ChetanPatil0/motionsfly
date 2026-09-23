import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { StoreHeader } from "@/components/layout/store-header";
import { AccountNav } from "@/components/layout/account-nav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <div className="container grid flex-1 gap-8 py-10 md:grid-cols-[220px_1fr]">
        <AccountNav />
        <main>{children}</main>
      </div>
    </div>
  );
}
