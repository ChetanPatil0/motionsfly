"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

/**
 * Wraps next-themes' setTheme so that logged-in users also get their
 * preference persisted to the database (UserPreference), while guests
 * keep working purely off localStorage (next-themes default behavior).
 */
export function useThemeSync() {
  const { theme, setTheme: setLocalTheme, systemTheme } = useTheme();
  const { status } = useSession();

  const setTheme = useCallback(
    async (next: "light" | "dark" | "system") => {
      setLocalTheme(next);

      if (status === "authenticated") {
        try {
          await fetch("/api/settings/theme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: next.toUpperCase() }),
          });
        } catch {
          // Non-fatal — local theme still applied. Silent per Section 71 guidance
          // (don't spam users for a low-stakes background sync failure).
        }
      }
    },
    [setLocalTheme, status]
  );

  return { theme, systemTheme, setTheme };
}
