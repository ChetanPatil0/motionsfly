"use client";

// import { useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
import { Link2 } from "lucide-react";
// import { UploadCloud } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TutorialVideoUploader({
  tutorialId: _tutorialId,
  contentType: _contentType,
  videoSizeBytes: _videoSizeBytes,
}: {
  tutorialId: string;
  contentType: "EXTERNAL_LINK" | "UPLOADED_VIDEO";
  videoSizeBytes: number | null;
}) {
  /*
  // Direct video uploads commented out to save server storage space.
  // Allowed size capped at 200MB if ever re-enabled:
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow only up to 200MB video file
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video exceeds the 200MB size limit.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tutorials/${_tutorialId}/video`, { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Upload failed.");
        return;
      }
      toast.success("Video uploaded successfully.");
      router.refresh();
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  */

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-foreground">Video Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
          <Link2 className="h-4 w-4 text-primary" />
          <span>Using external link</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Direct video uploads are disabled to save server storage space. Use external video links (YouTube, Vimeo, Bunny.net, or CDN MP4) in the <strong>Video / Content URL</strong> field on the left.
        </p>

        {/* 
        ========================================================================
        Direct video upload disabled — kept commented for future reference:
        ========================================================================
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          isLoading={isUploading}
          loadingText="Uploading..."
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-4 w-4" /> Upload Video File
        </Button>
        <p className="text-xs text-muted-foreground">Max 200MB · MP4, WebM, or MOV. Uploading replaces the external link.</p>
        ========================================================================
        */}
      </CardContent>
    </Card>
  );
}
