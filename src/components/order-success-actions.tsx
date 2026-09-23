"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Copy, Check, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { encodeDownloadCode } from "@/lib/download-token";

interface DownloadItem {
  id: string;
  token: string;
  status: string;
  expiresAt: string | Date;
  downloadCount: number;
  maxDownloads: number;
  product: {
    title: string;
    slug?: string;
  };
}

interface InvoiceInfo {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: string;
}

interface OrderSuccessActionsProps {
  orderNumber: string;
  downloads: DownloadItem[];
  invoice: InvoiceInfo | null;
}

export function OrderSuccessActions({ orderNumber, downloads, invoice }: OrderSuccessActionsProps) {
  const [origin, setOrigin] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleCopyLink = async (downloadId: string, url: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(downloadId);
      toast.success("Download link copied to clipboard!");
      setTimeout(() => {
        setCopiedId((prev) => (prev === downloadId ? null : prev));
      }, 2500);
    } catch {
      toast.error("Failed to copy link. Please manually copy it.");
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Receipt / Invoice Section */}
      {invoice && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Official Receipt / Invoice</p>
              <p className="text-xs text-muted-foreground font-mono">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
            <a
              href={`/invoices/${invoice.id}?orderNumber=${encodeURIComponent(orderNumber)}&autoPrint=1`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4" />
              Download Receipt (PDF)
            </a>
          </Button>
        </div>
      )}

      {/* Downloads Section */}
      {downloads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Your Digital Downloads</h2>
            <span className="text-xs text-muted-foreground">
              {downloads.length} {downloads.length === 1 ? "item" : "items"} available
            </span>
          </div>

          <div className="space-y-3">
            {downloads.map((dl) => {
              const code = encodeDownloadCode(dl.token, orderNumber);
              const fullDownloadUrl = origin ? `${origin}/d/${code}` : `/d/${code}`;
              const isCopied = copiedId === dl.id;
              const remaining = Math.max(0, dl.maxDownloads - dl.downloadCount);

              return (
                <div
                  key={dl.id}
                  className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm leading-tight text-foreground">
                        {dl.product?.title || "Digital Download"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {remaining} of {dl.maxDownloads} downloads remaining
                      </p>
                    </div>

                    <Button asChild size="sm" className="gap-2 shrink-0">
                      <a href={`/d/${code}`}>
                        <Download className="h-4 w-4" />
                        Download File
                      </a>
                    </Button>
                  </div>

                  {/* Copy-paste link box */}
                  <div className="pt-1">
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                      Direct Download Link (Copy & Paste):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          readOnly
                          value={fullDownloadUrl}
                          className="w-full rounded-md border bg-muted/50 px-3 py-1.5 text-xs font-mono text-muted-foreground select-all focus:outline-none focus:ring-1 focus:ring-primary"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                      </div>
                      <Button
                        type="button"
                        variant={isCopied ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleCopyLink(dl.id, fullDownloadUrl)}
                        className="gap-1.5 shrink-0 min-w-[95px] text-xs h-8"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
