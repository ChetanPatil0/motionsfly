"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global_error]", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-muted p-3">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            We hit an unexpected error. Please try again.
          </p>
          <Button onClick={() => reset()} className="mt-2">
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
