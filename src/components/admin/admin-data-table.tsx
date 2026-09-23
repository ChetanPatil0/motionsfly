"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import type { LucideIcon } from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
};

export function AdminDataTable<T extends { id: string }>({
  queryKey,
  fetchUrl,
  columns,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  pageSize = 20,
  onRowClick,
}: {
  queryKey: string;
  fetchUrl: (params: { page: number; q: string; sortBy: string; sortDir: "asc" | "desc" }) => string;
  columns: Column<T>[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState(columns[0]?.key ?? "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [queryKey, page, q, sortBy, sortDir],
    queryFn: async () => {
      const res = await fetch(fetchUrl({ page, q, sortBy, sortDir }));
      return res.json();
    },
  });

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const rows: T[] = data?.data?.items ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <p className="text-sm text-muted-foreground">Unable to load data.</p>
          <Button size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="p-3 font-medium">
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          {col.label}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t ${onRowClick ? "cursor-pointer hover:bg-muted/30" : ""}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-3">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
