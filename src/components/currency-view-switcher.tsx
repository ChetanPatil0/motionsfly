"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CurrencyViewSwitcher({ initial }: { initial: "INR" | "USD" }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  async function handleChange(next: "INR" | "USD") {
    setValue(next);
    await fetch("/api/settings/currency-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next }),
    });
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[80px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="INR">INR ₹</SelectItem>
        <SelectItem value="USD">USD $</SelectItem>
      </SelectContent>
    </Select>
  );
}
