"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileArchive, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProductFile = { id: string; fileName: string; sizeBytes: number; mimeType: string };

export function ProductFilesManager({ productId, initialFiles }: { productId: string; initialFiles: ProductFile[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/products/${productId}/files`, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Upload failed.");
        return;
      }
      setFiles((prev) => [json.data, ...prev]);
      toast.success("File uploaded successfully.");
      router.refresh();
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    try {
      const res = await fetch(`/api/products/${productId}/files/${fileId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to delete file.");
        return;
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted successfully.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-foreground">Digital Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input ref={inputRef} type="file" onChange={handleUpload} className="hidden" id="file-upload" />
          <Button
            type="button"
            variant="outline"
            isLoading={isUploading}
            loadingText="Uploading..."
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" /> Upload File
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Files are stored privately and are only ever released via a secure, authorized download link.
          </p>
        </div>

        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileArchive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{f.fileName}</span>
                  <span className="text-xs text-muted-foreground">{(f.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  isLoading={deletingId === f.id}
                  onClick={() => handleDelete(f.id)}
                  aria-label="Delete file"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
