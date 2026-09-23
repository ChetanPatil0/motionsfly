import Image from "next/image";
import { Film } from "lucide-react";
import { parseLogo, LogoConfig } from "@/lib/logo-helper";

interface StoreLogoProps {
  logo?: LogoConfig | string | null;
  storeName?: string;
  className?: string;
  imgClassName?: string;
  showTextWithLogo?: boolean;
}

export function StoreLogo({
  logo,
  storeName = "MotionFly",
  className = "",
  imgClassName = "h-8 w-auto max-h-8 max-w-[160px] object-contain",
  showTextWithLogo = false,
}: StoreLogoProps) {
  const parsed = typeof logo === "object" && logo !== null && "light" in logo
    ? (logo as LogoConfig)
    : parseLogo(typeof logo === "string" ? logo : null);

  const hasLight = !!parsed.light;
  const hasDark = !!parsed.dark;

  if (!hasLight && !hasDark) {
    return (
      <span className={`inline-flex items-center gap-2 font-bold tracking-tight text-foreground ${className}`}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Film className="h-4 w-4" />
        </div>
        <span>{storeName}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      {/* Light Mode Logo (visible in light mode, hidden in dark mode) */}
      {hasLight && (
        <img
          src={parsed.light!}
          alt={storeName}
          className={`${imgClassName} ${hasDark ? "dark:hidden" : ""}`}
        />
      )}

      {/* Dark Mode Logo (hidden in light mode, visible in dark mode) */}
      {hasDark && (
        <img
          src={parsed.dark!}
          alt={storeName}
          className={`${imgClassName} ${hasLight ? "hidden dark:block" : ""}`}
        />
      )}

      {showTextWithLogo && (
        <span className="text-foreground tracking-tight">{storeName}</span>
      )}
    </span>
  );
}
