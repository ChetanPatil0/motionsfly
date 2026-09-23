"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, GraduationCap, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";

type TutorialRow = {
  id: string;
  title: string;
  accessType: "FREE" | "PAID" | "PREMIUM";
  isPublished: boolean;
  category: { name: string } | null;
};

export default function AdminTutorialsPage() {
  const router = useRouter();

  const columns: Column<TutorialRow>[] = [
    { key: "title", label: "Title", sortable: true, render: (t) => <span className="font-medium">{t.title}</span> },
    { key: "category", label: "Category", render: (t) => t.category?.name ?? "—" },
    { key: "accessType", label: "Access", sortable: true, render: (t) => <Badge variant="outline">{t.accessType}</Badge> },
    {
      key: "isPublished",
      label: "Status",
      sortable: true,
      render: (t) => <Badge variant={t.isPublished ? "success" : "secondary"}>{t.isPublished ? "Published" : "Draft"}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (t) => (
        <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/tutorials/${t.id}`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tutorials</h1>
        <Button asChild>
          <Link href="/admin/tutorials/new">
            <Plus className="h-4 w-4" /> Add Tutorial
          </Link>
        </Button>
      </div>

      <AdminDataTable<TutorialRow>
        queryKey="admin-tutorials"
        fetchUrl={({ page, q, sortBy, sortDir }) =>
          `/api/tutorials?scope=admin&page=${page}&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`
        }
        columns={columns}
        emptyIcon={GraduationCap}
        emptyTitle="No Tutorials Yet"
        emptyDescription="There are no tutorials created right now."
        onRowClick={(row) => router.push(`/admin/tutorials/${row.id}`)}
      />
    </div>
  );
}
