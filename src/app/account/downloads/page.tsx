import { DownloadCloud } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DownloadsPage() {
  const user = await getCurrentUser();
  const downloads = await prisma.download.findMany({
    where: { userId: (user as { id: string }).id },
    include: { product: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Downloads</h1>
      {downloads.length === 0 ? (
        <EmptyState
          icon={DownloadCloud}
          title="No Downloads Yet"
          description="Purchased files will appear here for secure download."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {downloads.map((d) => {
            const isExpired = d.expiresAt < new Date() || d.status === "EXPIRED";
            const isLimitReached = d.downloadCount >= d.maxDownloads;
            const disabled = isExpired || isLimitReached;
            return (
              <li key={d.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <span className="font-medium">{d.product.title}</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {d.downloadCount}/{d.maxDownloads} used
                    </span>
                    {isExpired && <Badge variant="destructive">Expired</Badge>}
                    {isLimitReached && !isExpired && <Badge variant="secondary">Limit reached</Badge>}
                  </div>
                </div>
                <Button size="sm" disabled={disabled} asChild={!disabled}>
                  {disabled ? <span>Unavailable</span> : <a href={`/api/downloads/${d.token}`}>Download</a>}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
