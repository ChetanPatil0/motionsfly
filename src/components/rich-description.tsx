"use client";

export function RichDescription({ content }: { content: string }) {
  if (!content) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    return (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
        {content}
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed
        [&>h2]:text-foreground [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3
        [&>h3]:text-foreground [&>h3]:text-base [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2
        [&>p]:mb-3 [&>p]:leading-relaxed
        [&>ul]:my-3 [&>ul]:space-y-1.5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:marker:text-primary
        [&>ol]:my-3 [&>ol]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5
        [&>blockquote]:border-l-2 [&>blockquote]:border-primary/60 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground/90
        [&_strong]:text-foreground [&_strong]:font-semibold
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-80"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
