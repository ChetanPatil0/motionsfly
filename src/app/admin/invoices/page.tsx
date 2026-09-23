"use client";

import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { formatMoney } from "@/lib/utils";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: "INR" | "USD";
  billingName: string;
  issuedAt: string;
  orderId: string;
  order: { orderNumber: string };
};

export default function AdminInvoicesPage() {
  const columns: Column<InvoiceRow>[] = [
    { key: "invoiceNumber", label: "Invoice #", sortable: true, render: (inv) => <span className="font-mono text-xs">{inv.invoiceNumber}</span> },
    {
      key: "order",
      label: "Order",
      render: (inv) => (
        <Link href={`/admin/orders/${inv.orderId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
          {inv.order.orderNumber}
        </Link>
      ),
    },
    { key: "billingName", label: "Billing Name", render: (inv) => inv.billingName },
    { key: "total", label: "Total", sortable: true, render: (inv) => formatMoney(inv.total, inv.currency) },
    { key: "issuedAt", label: "Date", sortable: true, render: (inv) => new Date(inv.issuedAt).toLocaleDateString() },
    {
      key: "actions",
      label: "Actions",
      render: (inv) => (
        <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
          <a href={`/api/invoices/${inv.id}/download`} download>
            <Download className="h-4 w-4" /> Download
          </a>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
      <AdminDataTable<InvoiceRow>
        queryKey="admin-invoices"
        fetchUrl={({ page, q, sortBy, sortDir }) =>
          `/api/admin/invoices?page=${page}&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`
        }
        columns={columns}
        emptyIcon={FileText}
        emptyTitle="No Invoices Yet"
        emptyDescription="Invoices are generated automatically after a successful payment."
      />
    </div>
  );
}
