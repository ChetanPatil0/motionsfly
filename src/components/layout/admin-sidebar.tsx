"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  GraduationCap,
  Users,
  ShoppingCart,
  Repeat,
  Star,
  Ticket,
  Percent,
  Settings,
  FileText,
  Receipt,
  GalleryHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/tutorials", label: "Tutorials", icon: GraduationCap },
  { href: "/admin/hero-slides", label: "Promo Slider & CTA", icon: GalleryHorizontal },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/payments", label: "Payments", icon: Receipt },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/offers", label: "Offers", icon: Percent },
  { href: "/admin/trash", label: "Trash", icon: Trash2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

import { StoreLogo } from "@/components/store-logo";

export function AdminSidebar({ logo, storeName }: { logo?: string | null; storeName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-muted/20 md:block">
      <div className="flex h-16 items-center border-b px-6 font-semibold tracking-tight">
        <StoreLogo logo={logo} storeName={storeName ? `${storeName} Admin` : "MotionFly Admin"} />
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
