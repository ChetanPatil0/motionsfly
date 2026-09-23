import Link from "next/link";
import { Wrench, ShieldAlert, Settings, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function StoreStatusBanner() {
  const [settings, user] = await Promise.all([
    prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
    getCurrentUser(),
  ]);

  const isAdmin = (user as { role?: string } | null)?.role === "ADMIN";

  // If store is active and not in maintenance mode, show nothing
  if (settings.storeActive && !settings.isMaintenance) {
    return null;
  }

  // Maintenance Mode takes precedence
  if (settings.isMaintenance) {
    return (
      <div className="relative z-50 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 backdrop-blur-md px-4 py-2.5 text-amber-950 dark:text-amber-200">
        <div className="container flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              Maintenance Mode
            </span>
            <span className="font-medium">
              We are currently performing scheduled maintenance. Browsing is open, but checkout and purchases are temporarily paused.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs">
            {settings.supportEmail && (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="hidden font-medium text-amber-800 dark:text-amber-300 underline hover:opacity-80 md:inline"
              >
                Contact Support
              </a>
            )}
            {isAdmin && (
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-500/30 transition-colors"
              >
                <Settings className="h-3 w-3" />
                Admin Settings
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Store Inactive Mode
  return (
    <div className="relative z-50 border-b border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-500/15 backdrop-blur-md px-4 py-2.5 text-rose-950 dark:text-rose-200">
      <div className="container flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            Store Inactive
          </span>
          <span className="font-medium">
            MotionFly is currently not accepting new orders. Please check back soon or reach out for inquiries.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          {settings.supportEmail && (
            <a
              href={`mailto:${settings.supportEmail}`}
              className="hidden font-medium text-rose-800 dark:text-rose-300 underline hover:opacity-80 md:inline"
            >
              Contact Support
            </a>
          )}
          {isAdmin && (
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 font-semibold text-rose-900 dark:text-rose-200 hover:bg-rose-500/30 transition-colors"
            >
              <Settings className="h-3 w-3" />
              Re-activate Store
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
