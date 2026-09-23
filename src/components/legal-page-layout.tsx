export function LegalPageLayout({ title, updatedAt, children }: { title: string; updatedAt?: string; children: React.ReactNode }) {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {updatedAt && <p className="mt-2 text-sm text-muted-foreground">Last updated: {updatedAt}</p>}
      <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
