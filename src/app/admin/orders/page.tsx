"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { formatMoney } from "@/lib/utils";

type OrderRow = {
  id: string;
  orderNumber: string;
  total: number;
  currency: "INR" | "USD";
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { name: string; email: string } | null;
  guestEmail: string | null;
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const columns: Column<OrderRow>[] = [
    { key: "orderNumber", label: "Order #", sortable: true, render: (o) => <span className="font-mono text-xs">{o.orderNumber}</span> },
    { key: "customer", label: "Customer", render: (o) => o.user?.name ?? o.guestEmail ?? "Guest" },
    { key: "total", label: "Total", sortable: true, render: (o) => formatMoney(o.total, o.currency) },
    { key: "paymentStatus", label: "Payment", render: (o) => <Badge variant={o.paymentStatus === "SUCCESS" ? "success" : "secondary"}>{o.paymentStatus}</Badge> },
    { key: "status", label: "Status", sortable: true, render: (o) => <Badge variant={o.status === "PAID" ? "success" : "secondary"}>{o.status}</Badge> },
    { key: "createdAt", label: "Date", sortable: true, render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <AdminDataTable<OrderRow>
        queryKey="admin-orders"
        fetchUrl={({ page, q, sortBy, sortDir }) =>
          `/api/admin/orders?page=${page}&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`
        }
        columns={columns}
        emptyIcon={ShoppingCart}
        emptyTitle="No Orders Yet"
        emptyDescription="Orders will appear here when customers make purchases."
        onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
      />
    </div>
  );
}
