"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

type RevenuePoint = { date: string; currency: "INR" | "USD"; total: number };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");

  const series = data
    .filter((d) => d.currency === selectedCurrency)
    .map((d) => ({ date: d.date, total: d.total }));

  const totalInPeriod = series.reduce((acc, curr) => acc + curr.total, 0);
  const hasData = series.length > 0;

  return (
    <Card className="rounded-2xl border shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">Revenue Analytics</CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Daily completed sales volume for paid orders
          </CardDescription>
        </div>

        {/* Currency Switcher & Total Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCurrency("INR")}
              className={cn(
                "rounded-md px-2.5 py-1 font-semibold transition-all",
                selectedCurrency === "INR"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency("USD")}
              className={cn(
                "rounded-md px-2.5 py-1 font-semibold transition-all",
                selectedCurrency === "USD"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              USD ($)
            </button>
          </div>

          <div className="rounded-lg border bg-card px-3 py-1 text-xs font-mono font-bold text-foreground shadow-xs">
            {formatMoney(totalInPeriod, selectedCurrency)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {!hasData || totalInPeriod === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-3">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No {selectedCurrency} sales in this period</p>
            <p className="text-xs max-w-xs">
              When customers complete orders in {selectedCurrency}, your revenue trends will graph here.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    try {
                      return format(new Date(v), "MMM d");
                    } catch {
                      return v;
                    }
                  }}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  tickFormatter={(v) => formatMoney(v, selectedCurrency)}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                  dx={-4}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0]) {
                      return (
                        <div className="rounded-xl border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-semibold text-muted-foreground">
                            {format(new Date(label), "PPP")}
                          </p>
                          <p className="text-base font-black text-primary">
                            {formatMoney((payload[0].value as number) ?? 0, selectedCurrency)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "#ffffff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
