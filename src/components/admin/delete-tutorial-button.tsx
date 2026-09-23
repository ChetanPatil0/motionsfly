"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DeleteTutorialButton({ tutorialId }: { tutorialId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tutorials/${tutorialId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message ?? "Unable to delete tutorial.");
        return;
      }
      toast.success("Tutorial moved to Trash.");
      setShowModal(false);
      router.push("/admin/tutorials");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setShowModal(true)}>
        <Trash2 className="h-4 w-4" /> Delete Tutorial
      </Button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        title="Move Tutorial to Trash?"
        description="This tutorial will be unpublished immediately and moved to Trash. It can be restored from the Trash section within 15 days."
        confirmText="Move to Trash"
        variant="destructive"
      />
    </>
  );
}
