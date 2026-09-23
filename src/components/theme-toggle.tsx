"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeSync } from "@/hooks/use-theme-sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useThemeSync();

  if (compact) {
    // Single icon that cycles light -> dark -> system -> light. Works for
    // guests too (falls back to localStorage) and logged-in users (also
    // persisted to their account) — theme control isn't gated by login.
    const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
    const nextIndex = (OPTIONS.findIndex((o) => o.value === theme) + 1) % OPTIONS.length;
    const Icon = current.icon;
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Theme: ${current.label}. Click to change.`}
        onClick={() => setTheme(OPTIONS[nextIndex].value)}
      >
        <Icon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-1">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
