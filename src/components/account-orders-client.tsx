"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RotateCcw, 
  AlertCircle, 
  ChevronRight,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils";

export type OrderListItem = {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: "INR" | "USD";
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  items: {
    id: string;
    itemTitle: string;
    price: number;
    quantity: number;
    planId: string | null;
  }[];
  invoice: {
    id: string;
    invoiceNumber: string;
  } | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; className: string; description: string }
> = {
  PAID: {
    label: "Paid & Fulfilled",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Order completed. Access tokens & invoices generated.",
  },
  PENDING: {
    label: "Payment Pending",
    icon: Clock,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    description: "Awaiting payment confirmation from the gateway.",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "Order cancelled by customer or expired before payment.",
  },
  REFUNDED: {
    label: "Refunded",
    icon: RotateCcw,
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    description: "Full or partial refund processed for this order.",
  },
  FAILED: {
    label: "Payment Failed",
    icon: AlertCircle,
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    description: "Transaction was declined or failed at payment gateway.",
  },
};

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  RAZORPAY: "Cards / UPI / NetBanking",
  PAYPAL: "PayPal",
  STRIPE: "Credit / Debit Card",
};

export function AccountOrdersClient({ initialOrders }: { initialOrders: OrderListItem[] }) {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const counts = useMemo(() => {
    return {
      ALL: initialOrders.length,
      PAID: initialOrders.filter((o) => o.status === "PAID").length,
      PENDING: initialOrders.filter((o) => o.status === "PENDING").length,
      CANCELLED: initialOrders.filter((o) => o.status === "CANCELLED").length,
      REFUNDED: initialOrders.filter((o) => o.status === "REFUNDED").length,
      FAILED: initialOrders.filter((o) => o.status === "FAILED").length,
    };
  }, [initialOrders]);

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // Status filter
      if (selectedStatus !== "ALL" && order.status !== selectedStatus) {
        return false;
      }
      // Search query filter (Order number or item title)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = order.orderNumber.toLowerCase().includes(q);
        const matchesItems = order.items.some((i) => i.itemTitle.toLowerCase().includes(q));
        if (!matchesOrder && !matchesItems) return false;
      }
      return true;
    });
  }, [initialOrders, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review all your current and past orders, check order statuses (Paid, Pending, Cancelled, Refunded), and access official receipts.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/60 rounded-xl max-w-fit">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === "ALL"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>All Orders</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono">
                {counts.ALL}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("PAID")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === "PAID"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Paid</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-full font-mono">
                {counts.PAID}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("PENDING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === "PENDING"
                  ? "bg-background text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Pending</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full font-mono">
                {counts.PENDING}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("CANCELLED")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === "CANCELLED"
                  ? "bg-background text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Cancelled</span>
              <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 rounded-full font-mono">
                {counts.CANCELLED}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("REFUNDED")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === "REFUNDED"
                  ? "bg-background text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Refunded</span>
              <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded-full font-mono">
                {counts.REFUNDED}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order or item..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Orders Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">No orders matching criteria</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No orders found for "${searchQuery}". Try a different keyword.`
                : `You currently have no ${selectedStatus.toLowerCase()} orders.`}
            </p>
          </div>
          {selectedStatus !== "ALL" && (
            <Button variant="outline" size="sm" onClick={() => setSelectedStatus("ALL")} className="text-xs">
              View All Orders
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground text-xs">
              <tr>
                <th className="p-3.5 font-medium">Order Details</th>
                <th className="p-3.5 font-medium">Items Ordered</th>
                <th className="p-3.5 font-medium">Billing &amp; Method</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 font-medium">Total</th>
                <th className="p-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredOrders.map((order) => {
                const config = STATUS_CONFIG[order.status] || {
                  label: order.status,
                  icon: AlertCircle,
                  className: "bg-muted text-muted-foreground",
                  description: "",
                };
                const StatusIcon = config.icon;
                const paymentMethod =
                  PAYMENT_METHOD_NAMES[order.paymentMethod || ""] || order.paymentMethod || "Online";

                return (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    {/* Order # and Date */}
                    <td className="p-3.5 align-top">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="font-mono text-xs font-bold text-primary hover:underline block"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        {new Date(order.createdAt).toLocaleDateString()} &bull;{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="p-3.5 align-top max-w-[220px]">
                      <div className="space-y-0.5">
                        {order.items.slice(0, 2).map((item) => (
                          <p key={item.id} className="text-xs font-medium text-foreground truncate" title={item.itemTitle}>
                            {item.itemTitle} {item.quantity > 1 && `× ${item.quantity}`}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-[11px] text-muted-foreground">
                            + {order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 align-top">
                      <span className="text-xs text-muted-foreground font-medium block">
                        {paymentMethod}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 align-top">
                      <Badge className={`gap-1 font-semibold text-[11px] ${config.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{config.label}</span>
                      </Badge>
                      {order.status === "REFUNDED" && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1">
                          Amount credited back
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="p-3.5 align-top">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatMoney(order.total, order.currency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 align-top text-right">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                        {order.invoice && (
                          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground">
                            <Link href={`/invoices/${order.invoice.id}`} target="_blank">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span className="hidden sm:inline">Receipt</span>
                            </Link>
                          </Button>
                        )}

                        <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs font-medium">
                          <Link href={`/account/orders/${order.id}`}>
                            <span>View</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
