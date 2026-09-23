"use client";

import { Suspense } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { QueryProvider } from "@/components/query-provider";
import { TopLoader } from "@/components/top-loader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {children}
          <Toaster richColors position="top-center" closeButton />
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
