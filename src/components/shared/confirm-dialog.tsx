"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, onOpenChange } = props;
  const snapshotRef = useRef(props);
  if (open) {
    snapshotRef.current = props;
  }
  const view = snapshotRef.current;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{view.title}</DialogTitle>
          {view.description ? <DialogDescription>{view.description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {view.cancelLabel ?? "انصراف"}
          </Button>
          <Button type="button" variant={view.destructive ? "destructive" : "default"} disabled={view.loading} onClick={props.onConfirm}>
            {view.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
