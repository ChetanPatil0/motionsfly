"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GalleryUploader({ productId, images }: { productId: string; images: string[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [removingPath, setRemovingPath] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/products/${productId}/gallery`, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Upload failed.");
        return;
      }
      toast.success("Image added to gallery.");
      router.refresh();
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(imagePath: string) {
    setRemovingPath(imagePath);
    try {
      const res = await fetch(`/api/products/${productId}/gallery?path=${encodeURIComponent(imagePath)}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to remove image.");
        return;
      }
      toast.success("Image removed.");
      router.refresh();
    } finally {
      setRemovingPath(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-foreground">Gallery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => {
              const isGif = img.toLowerCase().endsWith(".gif");
              return (
                <div key={img} className="group relative aspect-video overflow-hidden rounded-md border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Gallery item" className="h-full w-full object-cover" />
                  {isGif && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      GIF
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(img)}
                    disabled={removingPath === img}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100 shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleUpload} className="hidden" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isUploading}
          onClick={() => inputRef.current?.click()}
          disabled={images.length >= 16}
        >
          <ImagePlus className="h-4 w-4" /> Add Demo Image / GIF
        </Button>
        <p className="text-xs text-muted-foreground">
          Max 15MB per file &middot; PNG, JPG, WEBP, or animated GIF &middot; up to 16 items ({images.length}/16 used)
        </p>
      </CardContent>
    </Card>
  );
}
