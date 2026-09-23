"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, BookOpen, Crown, User, ShieldCheck, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  navItems: { href: string; label: string }[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  isPremium: boolean;
}

export function MobileNav({ navItems, isLoggedIn, isAdmin, isPremium }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => {
    setOpen(false);
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "products":
        return <ShoppingBag className="h-4 w-4" />;
      case "tutorials":
        return <BookOpen className="h-4 w-4" />;
      case "subscriptions":
        return <Crown className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
        className="h-9 w-9 text-foreground hover:bg-accent"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="fixed inset-0 top-16 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
          <nav className="flex flex-col p-6 space-y-2 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">
              Navigation
            </p>
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-foreground/80 hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  {getIcon(item.label)}
                  {item.label}
                  {item.label.toLowerCase() === "subscriptions" && isPremium && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                Account
              </p>
              {isLoggedIn ? (
                <div className="space-y-1">
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent/50 hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile & Orders
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent/50 hover:text-foreground transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link href="/login" onClick={handleLinkClick}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-center">
                    <Link href="/register" onClick={handleLinkClick}>
                      Create Account
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
