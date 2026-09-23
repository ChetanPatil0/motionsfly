import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { ProductFilesManager } from "@/components/admin/product-files-manager";
import { ThumbnailUploader } from "@/components/admin/thumbnail-uploader";
import { GalleryUploader } from "@/components/admin/gallery-uploader";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { BackLink } from "@/components/back-link";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id }, include: { files: true } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <BackLink href="/admin/products" label="Back to Products" />
        <DeleteProductButton productId={product.id} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
        <ProductForm
          productId={product.id}
          categories={categories}
          defaultValues={{
            title: product.title,
            description: product.description,
            shortDescription: product.shortDescription ?? "",
            type: product.type,
            categoryId: product.categoryId,
            priceINR: product.priceINR,
            priceUSD: product.priceUSD,
            isFree: product.isFree,
            isPremium: product.isPremium,
            isPublished: product.isPublished,
            isFeatured: product.isFeatured,
          }}
        />
      </div>
      <div className="space-y-6">
        <ThumbnailUploader productId={product.id} currentThumbnail={product.thumbnail} />
        <GalleryUploader productId={product.id} images={product.images} />
        <ProductFilesManager productId={product.id} initialFiles={product.files} />
      </div>
      </div>
    </div>
  );
}
