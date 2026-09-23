"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderPendingPoller({ orderNumber }: { orderNumber?: string }) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (retryCount >= 6) return;

    const timer = setTimeout(() => {
      setRetryCount((prev) => prev + 1);
      router.refresh();
    }, 2500);

    return () => clearTimeout(timer);
  }, [retryCount, router]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>Checking payment status automatically...</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setRetryCount(0);
          router.refresh();
        }}
      >
        Refresh Now
      </Button>
    </div>
  );
}
