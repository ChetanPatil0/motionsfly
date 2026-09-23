import Link from "next/link";
import { Wrench, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminTopbar({
  userName,
  isMaintenance = false,
  storeActive = true,
}: {
  userName: string;
  isMaintenance?: boolean;
  storeActive?: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        {isMaintenance && (
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Store in Maintenance Mode</span>
          </Link>
        )}
        {!storeActive && !isMaintenance && (
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Store Inactive</span>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {userName}
        </Link>
      </div>
    </header>
  );
}
