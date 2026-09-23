import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TutorialForm } from "@/components/admin/tutorial-form";
import { TutorialVideoUploader } from "@/components/admin/tutorial-video-uploader";
import { DeleteTutorialButton } from "@/components/admin/delete-tutorial-button";
import { BackLink } from "@/components/back-link";

export default async function EditTutorialPage({ params }: { params: { id: string } }) {
  const [tutorial, categories] = await Promise.all([
    prisma.tutorial.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  if (!tutorial) notFound();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <BackLink href="/admin/tutorials" label="Back to Tutorials" />
        <DeleteTutorialButton tutorialId={tutorial.id} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Tutorial</h1>
          <TutorialForm
            tutorialId={tutorial.id}
            categories={categories}
            defaultValues={{
              title: tutorial.title,
              description: tutorial.description,
              contentUrl: tutorial.contentUrl ?? "",
              categoryId: tutorial.categoryId,
              accessType: tutorial.accessType,
              priceINR: tutorial.priceINR,
              priceUSD: tutorial.priceUSD,
              isPublished: tutorial.isPublished,
              isFeatured: tutorial.isFeatured,
            }}
          />
        </div>
        <div>
          <TutorialVideoUploader
            tutorialId={tutorial.id}
            contentType={tutorial.contentType}
            videoSizeBytes={tutorial.videoSizeBytes}
          />
        </div>
      </div>
    </div>
  );
}
