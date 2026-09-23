"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, PackageOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { formatMoney } from "@/lib/utils";

type ProductRow = {
  id: string;
  title: string;
  priceINR: number;
  priceUSD: number;
  isFree: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  category: { name: string } | null;
  _count: { likes: number; reviews: number };
};

export default function AdminProductsPage() {
  const router = useRouter();

  const columns: Column<ProductRow>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (p) => <span className="font-medium">{p.title}</span>,
    },
    { key: "category", label: "Category", render: (p) => p.category?.name ?? "—" },
    {
      key: "priceINR",
      label: "Price",
      sortable: true,
      render: (p) => (p.isFree ? "Free" : `${formatMoney(p.priceINR, "INR")} / ${formatMoney(p.priceUSD, "USD")}`),
    },
    {
      key: "isPublished",
      label: "Status",
      sortable: true,
      render: (p) => (
        <div className="flex gap-1">
          <Badge variant={p.isPublished ? "success" : "secondary"}>{p.isPublished ? "Published" : "Draft"}</Badge>
          {p.isFeatured && <Badge variant="outline">Featured</Badge>}
          {p.isPremium && <Badge variant="outline">Premium</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/products/${p.id}`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      <AdminDataTable<ProductRow>
        queryKey="admin-products"
        fetchUrl={({ page, q, sortBy, sortDir }) =>
          `/api/products?scope=admin&page=${page}&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`
        }
        columns={columns}
        emptyIcon={PackageOpen}
        emptyTitle="No Products Yet"
        emptyDescription="There are no products available right now."
        onRowClick={(row) => router.push(`/admin/products/${row.id}`)}
      />
    </div>
  );
}
