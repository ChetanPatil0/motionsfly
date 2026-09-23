import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TutorialsCatalogClient } from "@/components/tutorials-catalog-client";

export const metadata = { title: "Masterclass Tutorials | MotionFly" };

export default async function TutorialsPage() {
  const user = await getCurrentUser();

  const [tutorials, categories, activeSub] = await Promise.all([
    prisma.tutorial.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true, slug: true } } },
      take: 120,
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    user && (user as { id?: string }).id
      ? prisma.subscription.findFirst({
          where: {
            userId: (user as { id: string }).id,
            status: "ACTIVE",
            currentPeriodEnd: { gt: new Date() },
          },
        })
      : null,
  ]);

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Masterclass Video Tutorials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step-by-step masterclasses, advanced editing techniques, color grading breakdowns, and sound design workflows.
        </p>
      </div>

      <TutorialsCatalogClient
        initialTutorials={tutorials as any}
        categories={categories}
        isPremiumUser={!!activeSub}
      />
    </div>
  );
}

