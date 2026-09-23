"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to delete product.");
        return;
      }
      toast.success("Product moved to Trash.");
      setShowModal(false);
      router.push("/admin/products");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setShowModal(true)}>
        <Trash2 className="h-4 w-4" /> Delete Product
      </Button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        title="Move Product to Trash?"
        description="This product will be unpublished immediately and moved to Trash. It will not be visible in the store but can be restored from the Trash section within 15 days."
        confirmText="Move to Trash"
        variant="destructive"
      />
    </>
  );
}
