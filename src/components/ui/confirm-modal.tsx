"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
}: ConfirmModalProps) {
  const Icon = variant === "destructive" ? AlertTriangle : variant === "warning" ? AlertCircle : Info;
  const iconColor =
    variant === "destructive"
      ? "text-destructive bg-destructive/10"
      : variant === "warning"
      ? "text-amber-500 bg-amber-500/10"
      : "text-primary bg-primary/10";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <DialogTitle className="text-left text-lg font-bold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-3 gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="text-xs">
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            isLoading={isLoading}
            className="text-xs"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
