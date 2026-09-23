"use client";

import { useState } from "react";
import { DownloadCloud, Crown, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductDownloadActionProps {
  productId: string;
  isPremium: boolean;
  isFree: boolean;
  isSubscribed: boolean;
  hasPurchased: boolean;
  isLoggedIn: boolean;
}

export function ProductDownloadAction({
  productId,
  isPremium,
  isFree,
  isSubscribed,
  hasPurchased,
  isLoggedIn,
}: ProductDownloadActionProps) {
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canDirectDownload = (isPremium && isSubscribed) || hasPurchased || (isFree && isLoggedIn);

  if (!canDirectDownload) {
    return null;
  }

  const handleDownload = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/products/${productId}/download-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate download link.");
      }

      setDownloadSuccess(true);
      // Initiate secure download
      window.location.href = data.data.downloadUrl;

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (loading) return "Preparing file...";
    if (downloadSuccess) return "Starting download...";
    if (hasPurchased) return "Download Purchased Asset";
    if (isPremium && isSubscribed) return "Download with PRO";
    return "Download Free Asset";
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleDownload}
          disabled={loading}
          size="lg"
          className={`w-full font-semibold shadow-md transition-all ${
            isPremium && isSubscribed
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : downloadSuccess ? (
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-300" />
          ) : isPremium && isSubscribed ? (
            <Crown className="h-5 w-5 mr-2" />
          ) : (
            <DownloadCloud className="h-5 w-5 mr-2" />
          )}
          {getLabel()}
        </Button>

        {isPremium && isSubscribed && (
          <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-medium">
            Unlocked with your active PRO membership
          </p>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-destructive text-center">{errorMsg}</p>
      )}
    </div>
  );
}
