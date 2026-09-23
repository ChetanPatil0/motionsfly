"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12 });

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept in-app link clicks to start the bar immediately (App Router
    // has no native transition events, so we hook navigations manually).
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || target.target === "_blank") return;
      const isInternal = href.startsWith("/") || href.startsWith(window.location.origin);
      if (isInternal) NProgress.start();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
