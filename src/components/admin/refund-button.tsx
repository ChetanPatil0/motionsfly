"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function RefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to refund order.");
        return;
      }
      toast.success("Order refunded successfully.");
      setShowModal(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setShowModal(true)}>
        Refund Order
      </Button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        title="Refund Order & Revoke Downloads?"
        description="Are you sure you want to refund this order? Customer download tokens will be permanently revoked immediately. This action cannot be undone."
        confirmText="Yes, Refund Order"
        variant="destructive"
      />
    </>
  );
}
