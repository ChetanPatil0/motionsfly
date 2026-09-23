import { prisma } from "@/lib/prisma";
import { TutorialForm } from "@/components/admin/tutorial-form";

export default async function NewTutorialPage() {
  const categories = await prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add Tutorial</h1>
      <TutorialForm categories={categories} />
    </div>
  );
}
