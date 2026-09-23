"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";

type UserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; subscriptions: number };
};

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (!json.success) {
        toast.error(json.message ?? "Unable to update user.");
        return;
      }
      toast.success(json.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (u) => (
        <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
          {u.name}
        </Link>
      ),
    },
    { key: "email", label: "Email", sortable: true, render: (u) => <span className="text-muted-foreground">{u.email}</span> },
    { key: "orders", label: "Orders", render: (u) => u._count.orders },
    { key: "subscriptions", label: "Subscriptions", render: (u) => u._count.subscriptions },
    {
      key: "isActive",
      label: "Active",
      render: (u) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={u.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: u.id, isActive: v })} />
        </div>
      ),
    },
    { key: "createdAt", label: "Joined", sortable: true, render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <AdminDataTable<UserRow>
        queryKey="admin-users"
        fetchUrl={({ page, q, sortBy, sortDir }) =>
          `/api/admin/users?page=${page}&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`
        }
        columns={columns}
        emptyIcon={UsersIcon}
        emptyTitle="No Users Found"
        emptyDescription="No customers match your search."
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
      />
    </div>
  );
}
