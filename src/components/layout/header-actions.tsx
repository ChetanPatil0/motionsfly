"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import {
  Heart,
  ShoppingCart,
  LogOut,
  User as UserIcon,
  Crown,
  LayoutDashboard,
  Package,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function fetchCartCount() {
  const res = await fetch("/api/cart");
  const json = await res.json();
  return json?.data?.lines?.length ?? 0;
}

async function fetchWishlistCount() {
  const res = await fetch("/api/wishlist/count");
  const json = await res.json();
  return json?.data?.count ?? 0;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-semibold text-signal-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function HeaderActions({
  isAdmin,
  isLoggedIn,
  isPremium = false,
  user,
}: {
  isAdmin: boolean;
  isLoggedIn: boolean;
  isPremium?: boolean;
  user?: { name?: string | null; email?: string | null } | null;
}) {
  const { data: sessionData, status } = useSession();

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count"],
    queryFn: fetchCartCount,
    staleTime: 60000,
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ["wishlist-count"],
    queryFn: fetchWishlistCount,
    enabled: status === "authenticated",
    staleTime: 60000,
  });

  const displayName = user?.name || sessionData?.user?.name || "My Account";
  const displayEmail = user?.email || sessionData?.user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle compact />

      {isLoggedIn && !isAdmin && (
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/account/wishlist" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            <CountBadge count={wishlistCount} />
          </Link>
        </Button>
      )}

      {!isAdmin && (
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/cart" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            <CountBadge count={cartCount} />
          </Link>
        </Button>
      )}

      {isLoggedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-tight transition-all duration-300 focus:outline-none ${
                isPremium
                  ? "ring-2 ring-amber-400 border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.65)] bg-gradient-to-tr from-amber-500/25 via-yellow-500/20 to-amber-400/20 text-amber-500 hover:scale-105"
                  : "border border-border bg-muted/70 text-foreground hover:border-primary/50 hover:bg-muted"
              }`}
              aria-label="User menu"
            >
              {initials}
              {isPremium && (
                <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-1 text-[8px] font-black text-black shadow-sm ring-1 ring-background">
                  PRO
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl">
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
                  {isPremium ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-500">
                      <Crown className="h-2.5 w-2.5" /> PRO
                    </span>
                  ) : isAdmin ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                      Admin
                    </span>
                  ) : null}
                </div>
                {displayEmail && (
                  <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="flex items-center gap-2 cursor-pointer font-medium text-primary">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/account/orders" className="flex items-center gap-2 cursor-pointer">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Orders &amp; Receipts</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/account/downloads" className="flex items-center gap-2 cursor-pointer">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>My Downloads</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/account/subscription" className="flex items-center gap-2 cursor-pointer">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Membership &amp; PRO</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/account/wishlist" className="flex items-center gap-2 cursor-pointer">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span>Wishlist</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Sign up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
