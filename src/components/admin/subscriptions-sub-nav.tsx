"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/subscriptions/plans", label: "Plans" },
  { href: "/admin/subscriptions/users", label: "User Subscriptions" },
];

export function SubscriptionsSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === t.href ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
