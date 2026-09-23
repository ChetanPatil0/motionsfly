"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Wrench,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { StoreLogo } from "@/components/store-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface AdminLayoutShellProps {
  children: React.ReactNode;
  logo?: string | null;
  storeName?: string;
  userName: string;
  userEmail?: string | null;
  isMaintenance?: boolean;
  storeActive?: boolean;
}

export function AdminLayoutShell({
  children,
  logo,
  storeName,
  userName,
  userEmail,
  isMaintenance = false,
  storeActive = true,
}: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock document/body overflow strictly to prevent whole-page scrolling
  useEffect(() => {
    document.documentElement.classList.add("admin-viewport-lock");
    document.body.classList.add("admin-viewport-lock");
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.classList.remove("admin-viewport-lock");
      document.body.classList.remove("admin-viewport-lock");
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      {/* Strict inline style tag to eliminate whole-page scrolling instantly */}
      <style>{`
        html.admin-viewport-lock,
        body.admin-viewport-lock {
          height: 100% !important;
          max-height: 100% !important;
          max-height: 100dvh !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
        }
      `}</style>

      <div className="fixed inset-0 z-20 flex h-full max-h-full h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-background">
        {/* ───────────────────────────────────────────────────────── */}
        {/* MOBILE OVERLAY BACKDROP                                  */}
        {/* ───────────────────────────────────────────────────────── */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in-50 duration-200"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* SIDEBAR (Desktop Fixed + Mobile Slide-over Drawer)       */}
        {/* ───────────────────────────────────────────────────────── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full max-h-full max-h-[100dvh] flex-col border-r bg-card/95 shadow-xl md:shadow-none backdrop-blur-xl md:static md:z-auto transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
            // Width variations
            isCollapsed ? "md:w-[72px]" : "md:w-64",
            // Mobile slide transform
            isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
          )}
        >
          {/* Top Logo & Branding Header (Fixed) */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <StoreLogo logo={logo} storeName={storeName ? `${storeName} Admin` : "MotionFly Admin"} />
              </div>
            ) : (
              <div className="mx-auto">
                <StoreLogo logo={logo} storeName="Admin" />
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Items (Only this area scrolls internally) */}
          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-1 scrollbar-thin">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-10 w-10 mx-auto items-center justify-center rounded-xl text-sm font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Pinned Footer (Fixed User Profile & Logout) */}
          <div className="shrink-0 border-t bg-muted/20 p-3 space-y-2">
            {!isCollapsed ? (
              <div className="space-y-2">
                {/* User Pill */}
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-card border shadow-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">{userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">{userEmail || "Administrator"}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full justify-center gap-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-9"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs cursor-default">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">{userName}</p>
                    <p className="text-[10px] text-muted-foreground">{userEmail || "Admin"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Log Out</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Log Out</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </aside>

        {/* ───────────────────────────────────────────────────────── */}
        {/* MAIN COLUMN (Fixed Topbar + Scrollable Main Content)       */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col h-full max-h-full max-h-[100dvh] min-h-0 min-w-0 overflow-hidden">
          {/* Topbar Header (Fixed) */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-card/60 backdrop-blur-md z-20">
            {/* Left: Mobile hamburger + Status Badges */}
            <div className="flex items-center gap-3">
              {/* Hamburger Button for Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Maintenance Mode Warning */}
              {isMaintenance && (
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors shadow-xs"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Store in Maintenance Mode</span>
                  <span className="sm:hidden">Maintenance</span>
                </Link>
              )}

              {/* Store Inactive Warning */}
              {!storeActive && !isMaintenance && (
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors shadow-xs"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Store Offline / Inactive</span>
                  <span className="sm:hidden">Offline</span>
                </Link>
              )}
            </div>

            {/* Right: Quick Store View, Theme Toggle, User Indicator */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Link href="/" target="_blank" rel="noopener noreferrer">
                  <span>View Store</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <ThemeToggle />

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-foreground max-w-[120px] truncate">{userName}</span>
              </div>
            </div>
          </header>

          {/* Main Content Area (ONLY THIS SCROLLS!) */}
          <main className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 bg-muted/10">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
