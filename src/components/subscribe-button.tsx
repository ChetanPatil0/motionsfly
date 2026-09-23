"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscribeButton({ planId }: { planId: string }) {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubscribe() {
    if (status !== "authenticated") {
      toast.error("Please sign in or create an account to activate your subscription.");
      router.push(`/login?callbackUrl=${encodeURIComponent(`/subscriptions/checkout?planId=${planId}`)}`);
      return;
    }

    router.push(`/subscriptions/checkout?planId=${planId}`);
  }

  return (
    <Button
      className="w-full gap-2 shadow-sm font-medium"
      isLoading={isLoading}
      loadingText="Preparing checkout..."
      onClick={handleSubscribe}
    >
      <Crown className="h-4 w-4 text-amber-400" />
      Subscribe Now
    </Button>
  );
}
