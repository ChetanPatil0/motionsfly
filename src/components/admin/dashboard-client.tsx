"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Users,
  DownloadCloud,
  Package,
  GraduationCap,
  Repeat,
  AlertCircle,
  Plus,
  Settings,
  GalleryHorizontal,
  TrendingUp,
} from "lucide-react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { StatCard } from "@/components/admin/stat-card";
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { OrdersChart } from "@/components/admin/orders-chart";
import { TopProductsTable } from "@/components/admin/top-products-table";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { DateRangeKey } from "@/lib/dashboard";

type DashboardResponse = {
  success: boolean;
  message: string;
  data: {
    summary: {
      revenue: { INR: number; USD: number };
      orders: number;
      customers: number;
      downloads: number;
      products: number;
      tutorials: number;
      activeSubscriptions: number;
      pendingOrders: number;
    };
    revenueSeries: { date: string; currency: "INR" | "USD"; total: number }[];
    ordersSeries: { date: string; count: number }[];
    topProducts: { productId: string | null; title: string; unitsSold: number; revenue: number }[];
    subscriptions: {
      active: number;
      newSubscriptions: number;
      cancelled: number;
      monthlyRevenue: number;
      yearlyRevenue: number;
    };
    recentOrders: {
      id: string;
      orderNumber: string;
      customer: string;
      productSummary: string;
      total: number;
      currency: "INR" | "USD";
      paymentStatus: string;
      status: string;
      createdAt: string;
    }[];
  };
};

async function fetchDashboard(range: DateRangeKey): Promise<DashboardResponse> {
  const res = await fetch(`/api/admin/dashboard?range=${range}`);
  if (!res.ok) throw new Error("Failed to load dashboard data");
  return res.json();
}

export function DashboardClient() {
  const [range, setRange] = useState<DateRangeKey>("last30");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-dashboard", range],
    queryFn: () => fetchDashboard(range),
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-12 text-center shadow-sm">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold">Unable to load dashboard data</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Something went wrong while retrieving store statistics.
        </p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  const { summary, revenueSeries, ordersSeries, topProducts, subscriptions, recentOrders } = data.data;

  return (
    <div className={`space-y-8 ${isFetching ? "opacity-75 transition-opacity" : ""}`}>
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. DASHBOARD HEADER & QUICK ACTIONS                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Store Performance &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time financial breakdown, order fulfillment, and membership velocity
          </p>
        </div>

        {/* Quick Action Buttons & Date Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangeFilter value={range} onChange={setRange} />

          <Button size="sm" asChild className="gap-1.5 shadow-sm text-xs font-semibold">
            <Link href="/admin/products">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-medium">
            <Link href="/admin/hero-slides">
              <GalleryHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Promo Slide</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="h-8 w-8" title="Store Settings">
            <Link href="/admin/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. PRIMARY KPI STAT CARDS                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatMoney(summary.revenue.INR, "INR")}
          subvalue={summary.revenue.USD > 0 ? `+ ${formatMoney(summary.revenue.USD, "USD")} USD` : "INR Net Volume"}
          icon={DollarSign}
          accent="emerald"
          trend={{ value: "Paid Only", isPositive: true }}
        />
        <StatCard
          label="Completed Orders"
          value={summary.orders}
          subvalue={summary.pendingOrders > 0 ? `${summary.pendingOrders} pending action` : "All orders cleared"}
          icon={ShoppingCart}
          accent="blue"
        />
        <StatCard
          label="Total Customers"
          value={summary.customers}
          subvalue="Registered store accounts"
          icon={Users}
          accent="purple"
        />
        <StatCard
          label="Asset Downloads"
          value={summary.downloads}
          subvalue="DRM-Free files delivered"
          icon={DownloadCloud}
          accent="amber"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. SECONDARY OPERATIONAL METRICS                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Published Products"
          value={summary.products}
          icon={Package}
          accent="blue"
          className="border-dashed py-1"
        />
        <StatCard
          label="Video Masterclasses"
          value={summary.tutorials}
          icon={GraduationCap}
          accent="purple"
          className="border-dashed py-1"
        />
        <StatCard
          label="Active Subscriptions"
          value={summary.activeSubscriptions}
          icon={Repeat}
          accent="emerald"
          className="border-dashed py-1"
        />
        <StatCard
          label="Pending Checkout"
          value={summary.pendingOrders}
          icon={AlertCircle}
          accent="rose"
          className="border-dashed py-1"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. REVENUE & ORDERS GRAPH CHARTS                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueSeries} />
        <OrdersChart data={ordersSeries} />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. SUBSCRIPTION & RECURRING REVENUE METRICS                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Subscription Growth &amp; Recurring Revenue
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard
            label="Active Members"
            value={subscriptions.active}
            icon={Users}
            accent="emerald"
          />
          <StatCard
            label="New Signups"
            value={subscriptions.newSubscriptions}
            icon={TrendingUp}
            accent="blue"
            trend={{ value: `+${subscriptions.newSubscriptions}`, isPositive: true }}
          />
          <StatCard
            label="Cancellations"
            value={subscriptions.cancelled}
            icon={Users}
            accent="rose"
            trend={subscriptions.cancelled > 0 ? { value: `${subscriptions.cancelled}`, isPositive: false } : undefined}
          />
          <StatCard
            label="Monthly (MRR)"
            value={formatMoney(subscriptions.monthlyRevenue, "INR")}
            icon={DollarSign}
            accent="primary"
          />
          <StatCard
            label="Annual (ARR)"
            value={formatMoney(subscriptions.yearlyRevenue, "INR")}
            icon={DollarSign}
            accent="purple"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. TOP PRODUCTS & RECENT ORDERS TABLES                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <TopProductsTable data={topProducts} />
        <RecentOrdersTable data={recentOrders} />
      </div>
    </div>
  );
}
