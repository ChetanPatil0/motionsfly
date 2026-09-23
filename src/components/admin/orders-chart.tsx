"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type OrderPoint = { date: string; count: number };

export function OrdersChart({ data }: { data: OrderPoint[] }) {
  const totalOrders = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="rounded-2xl border shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-500">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">Orders Velocity</CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Total checkout orders placed per day
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="rounded-lg border bg-card px-3 py-1 text-xs font-mono font-bold text-foreground shadow-xs">
            {totalOrders} {totalOrders === 1 ? "Order" : "Orders"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {data.length === 0 || totalOrders === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-3">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No orders in this period</p>
            <p className="text-xs max-w-xs">
              As customers purchase items, order distribution will graph here automatically.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
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
                  allowDecimals={false}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  dx={-4}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-semibold text-muted-foreground">
                            {format(new Date(label), "PPP")}
                          </p>
                          <p className="text-base font-black text-blue-500">
                            {payload[0].value} {payload[0].value === 1 ? "Order" : "Orders"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#ordersGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
