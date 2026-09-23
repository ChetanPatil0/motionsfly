import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-full bg-muted p-3">
        <Compass className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
