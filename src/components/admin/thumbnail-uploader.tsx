"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThumbnailUploader({ productId, currentThumbnail }: { productId: string; currentThumbnail: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentThumbnail);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/products/${productId}/image`, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Upload failed.");
        return;
      }
      setPreview(json.data.thumbnail);
      toast.success("Thumbnail updated successfully.");
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Product thumbnail" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No thumbnail
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleUpload} className="hidden" />
      <Button type="button" variant="outline" size="sm" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
        <ImagePlus className="h-4 w-4" /> {preview ? "Replace Thumbnail / GIF" : "Upload Thumbnail / GIF"}
      </Button>
    </div>
  );
}
