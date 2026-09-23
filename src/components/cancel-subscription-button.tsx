"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to cancel subscription.");
        return;
      }
      toast.success(json.message);
      setShowModal(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
        Cancel Subscription
      </Button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        title="Cancel Your Subscription?"
        description="Are you sure you want to cancel your active subscription? You will maintain full access until the end of your current billing period, after which it will not renew."
        confirmText="Confirm Cancellation"
        variant="warning"
      />
    </>
  );
}
