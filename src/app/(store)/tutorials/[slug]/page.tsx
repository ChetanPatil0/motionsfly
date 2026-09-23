import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Lock, Play, Crown, ArrowRight, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hasTutorialAccess } from "@/lib/tutorial-access";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tutorial = await prisma.tutorial.findUnique({ where: { slug: params.slug } });
  if (!tutorial) return {};
  return {
    title: tutorial.title,
    description: tutorial.description.slice(0, 160),
    alternates: { canonical: `/tutorials/${tutorial.slug}` },
  };
}

function getEmbedUrl(rawUrl: string): { type: "embed" | "video"; url: string } {
  if (!rawUrl) return { type: "video", url: "" };

  const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { type: "embed", url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0` };
  }

  const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { type: "embed", url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  return { type: "video", url: rawUrl };
}

export default async function TutorialDetailPage({ params }: { params: { slug: string } }) {
  const tutorial = await prisma.tutorial.findUnique({ where: { slug: params.slug }, include: { category: true } });
  if (!tutorial || !tutorial.isPublished || tutorial.deletedAt) notFound();

  const user = await getCurrentUser();
  const [canAccess, relatedTutorials] = await Promise.all([
    hasTutorialAccess(user ? (user as { id: string }).id : null, tutorial),
    prisma.tutorial.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        id: { not: tutorial.id },
        ...(tutorial.categoryId ? { categoryId: tutorial.categoryId } : {}),
      },
      take: 3,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="container max-w-4xl py-12 space-y-12">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {tutorial.category && <Badge variant="outline">{tutorial.category.name}</Badge>}
          <Badge
            variant={
              tutorial.accessType === "FREE"
                ? "success"
                : tutorial.accessType === "PREMIUM"
                ? "default"
                : "secondary"
            }
            className={tutorial.accessType === "PREMIUM" ? "bg-amber-500 text-black font-semibold" : ""}
          >
            {tutorial.accessType === "PREMIUM" ? "PRO EXCLUSIVE" : tutorial.accessType}
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{tutorial.title}</h1>
      </div>

      <div className="rounded-2xl border bg-card/40 p-4 sm:p-6 backdrop-blur shadow-sm">
        {canAccess ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
            {tutorial.contentType === "UPLOADED_VIDEO" && tutorial.videoStorageKey ? (
              <video controls className="h-full w-full" src={`/api/tutorials/${tutorial.id}/stream`} />
            ) : tutorial.contentUrl ? (() => {
              const { type, url } = getEmbedUrl(tutorial.contentUrl);
              if (type === "embed") {
                return (
                  <iframe
                    src={url}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={tutorial.title}
                  />
                );
              }
              return <video controls className="h-full w-full" src={url} />;
            })() : (
              <div className="flex h-full items-center justify-center text-sm text-white/60">
                Content coming soon.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-amber-500/10 p-4 ring-1 ring-amber-500/20 text-amber-500">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="text-lg font-bold text-foreground">
                {tutorial.accessType === "PREMIUM"
                  ? "PRO Subscription Required"
                  : "Purchase Required to Unlock"}
              </p>
              <p className="text-sm text-muted-foreground">
                {tutorial.accessType === "PREMIUM"
                  ? "Unlock this full masterclass plus every other premium course with MotionFly PRO."
                  : "Buy this standalone masterclass to get lifetime streaming and project files."}
              </p>
            </div>
            {tutorial.accessType === "PAID" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {formatMoney(tutorial.priceINR, "INR")} / {formatMoney(tutorial.priceUSD, "USD")}
                </p>
                <AddToCartButton type="TUTORIAL" refId={tutorial.id} />
              </div>
            )}
            {tutorial.accessType === "PREMIUM" && (
              <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-semibold shadow-sm">
                <Link href="/subscriptions">
                  <Crown className="h-4 w-4" />
                  Upgrade to PRO
                </Link>
              </Button>
            )}
          </div>
        )}

        <div className="mt-6 border-t pt-6">
          <h2 className="text-lg font-bold text-foreground mb-2">About this Masterclass</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
            {tutorial.description}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RELATED MASTERCLASSES / MUST WATCH NEXT                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {relatedTutorials.length > 0 && (
        <div className="space-y-6 border-t pt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Must Watch Next
              </h2>
              <p className="text-sm text-muted-foreground">
                Recommended masterclasses to expand your editing and motion skills
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tutorials">All Tutorials &rarr;</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTutorials.map((t) => (
              <Card key={t.id} className="group overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {t.thumbnail ? (
                    <Image
                      src={t.thumbnail}
                      alt={t.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/50 text-muted-foreground">
                      <Play className="h-8 w-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      variant={t.accessType === "FREE" ? "success" : "default"}
                      className={
                        t.accessType === "PREMIUM"
                          ? "bg-amber-500 text-black font-bold text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {t.accessType === "PREMIUM" ? "PRO" : t.accessType}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  {t.category && (
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {t.category.name}
                    </p>
                  )}
                  <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm">
                    {t.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" asChild>
                      <Link href={`/tutorials/${t.slug}`}>
                        <Play className="h-3 w-3" /> Watch Tutorial
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

