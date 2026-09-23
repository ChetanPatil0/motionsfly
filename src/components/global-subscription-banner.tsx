"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Clock, AlertTriangle, ArrowRight, X } from "lucide-react";

interface BannerData {
  type: "EXPIRING_SOON" | "EXPIRED";
  subscriptionId: string;
  planName: string;
  daysLeft?: number;
  expiresOn?: string;
  expiredOn?: string;
  cancelling?: boolean;
  cycleKey: string;
}

export function GlobalSubscriptionBanner() {
  const { status } = useSession();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isDismissed, setIsDismissed] = useState(true); // Default true to prevent flash before check
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkSubscription() {
      try {
        const res = await fetch("/api/account/subscription-status");
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data?.banner as BannerData | null;

        if (isMounted && data) {
          const storageKey = `mf_sub_banner_dismiss_${data.subscriptionId}_${data.cycleKey}_${data.type}`;
          const dismissedInSession =
            sessionStorage.getItem(storageKey) === "true" ||
            localStorage.getItem(storageKey) === "true";

          setBanner(data);
          setIsDismissed(dismissedInSession);
        }
      } catch (err) {
        console.error("Failed to check subscription status for banner:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, [status]);

  if (isLoading || isDismissed || !banner) {
    return null;
  }

  const storageKey = `mf_sub_banner_dismiss_${banner.subscriptionId}_${banner.cycleKey}_${banner.type}`;

  const handleClose = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "true");
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  if (banner.type === "EXPIRING_SOON") {
    return (
      <aside
        aria-label="Subscription Expiry Notice"
        className="relative z-50 border-b border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 backdrop-blur-md px-4 py-2 text-amber-950 dark:text-amber-100 transition-all duration-300 shadow-sm"
      >
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/25 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
              <Clock className="h-3.5 w-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
              Expiring Soon
            </span>
            <span className="font-medium text-amber-950 dark:text-amber-200 truncate sm:whitespace-normal">
              Your <strong className="font-bold text-amber-900 dark:text-amber-100">{banner.planName}</strong> plan ends in{" "}
              <strong className="underline decoration-amber-500 decoration-2 font-bold">
                {banner.daysLeft} {banner.daysLeft === 1 ? "day" : "days"}
              </strong>{" "}
              ({banner.expiresOn}).{" "}
              <span className="hidden md:inline">
                {banner.cancelling
                  ? "Automatic renewal is cancelled."
                  : "Keep your payment details up to date to maintain uninterrupted access."}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-xs">
            <Link
              href="/account/subscription"
              className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1 font-bold text-black shadow-sm hover:bg-amber-400 transition-all"
            >
              Manage Billing
              <ArrowRight className="h-3 w-3" />
            </Link>

            <button
              onClick={handleClose}
              type="button"
              className="rounded-md p-1 text-amber-900/70 hover:text-amber-950 dark:text-amber-300/70 dark:hover:text-amber-100 hover:bg-amber-500/20 transition-colors"
              title="Close notification"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // EXPIRED state
  return (
    <aside
      aria-label="Subscription Expired Notice"
      className="relative z-50 border-b border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-500/15 backdrop-blur-md px-4 py-2 text-rose-950 dark:text-rose-100 transition-all duration-300 shadow-sm"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 border border-rose-500/30 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            PRO Expired
          </span>
          <span className="font-medium text-rose-950 dark:text-rose-200 truncate sm:whitespace-normal">
            Your <strong className="font-bold text-rose-900 dark:text-rose-100">{banner.planName}</strong> membership expired on {banner.expiredOn}.{" "}
            <span className="hidden md:inline">
              Your unlimited free downloads and PRO masterclasses are currently paused.
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 text-xs">
          <Link
            href="/subscriptions"
            className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1 font-bold text-white shadow-sm hover:bg-rose-500 transition-all"
          >
            Reactivate PRO
            <ArrowRight className="h-3 w-3" />
          </Link>

          <button
            onClick={handleClose}
            type="button"
            className="rounded-md p-1 text-rose-900/70 hover:text-rose-950 dark:text-rose-300/70 dark:hover:text-rose-100 hover:bg-rose-500/20 transition-colors"
            title="Close notification"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
