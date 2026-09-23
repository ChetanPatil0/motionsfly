"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Download, Heart, MessageSquare, CreditCard, Palette, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "Settings & Profile", icon: Settings },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/downloads", label: "Downloads", icon: Download },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/account/subscription", label: "Subscription", icon: CreditCard },
  { href: "/account/appearance", label: "Appearance", icon: Palette },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
