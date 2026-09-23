import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { AdminLayoutShell } from "@/components/layout/admin-layout-shell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, settings] = await Promise.all([
    requireAdmin(),
    prisma.storeSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } }),
  ]);
  if (!admin) redirect("/login");

  return (
    <AdminLayoutShell
      logo={settings.storeLogo}
      storeName={settings.storeName}
      userName={admin.name ?? "Admin"}
      userEmail={admin.email}
      isMaintenance={settings.isMaintenance}
      storeActive={settings.storeActive}
    >
      {children}
    </AdminLayoutShell>
  );
}
