import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  subvalue?: string | React.ReactNode;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accent?: "primary" | "emerald" | "blue" | "purple" | "amber" | "rose";
  className?: string;
}

const ACCENT_STYLES = {
  primary: {
    bg: "bg-primary/10 text-primary border-primary/20",
    glow: "group-hover:border-primary/40",
  },
  emerald: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    glow: "group-hover:border-emerald-500/40",
  },
  blue: {
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    glow: "group-hover:border-blue-500/40",
  },
  purple: {
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    glow: "group-hover:border-purple-500/40",
  },
  amber: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    glow: "group-hover:border-amber-500/40",
  },
  rose: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    glow: "group-hover:border-rose-500/40",
  },
};

export function StatCard({
  label,
  value,
  subvalue,
  icon: Icon,
  trend,
  accent = "primary",
  className,
}: StatCardProps) {
  const accentCfg = ACCENT_STYLES[accent] || ACCENT_STYLES.primary;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md",
        accentCfg.glow,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={cn("rounded-xl border p-2.5 transition-transform duration-300 group-hover:scale-110", accentCfg.bg)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5 pt-1">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{value}</div>

        {(subvalue || trend) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {subvalue && (
              <div className="text-xs text-muted-foreground font-medium truncate max-w-full">
                {subvalue}
              </div>
            )}
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  trend.isPositive !== false
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.isPositive !== false ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}</span>
                {trend.label && <span className="opacity-80 font-normal">{trend.label}</span>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
