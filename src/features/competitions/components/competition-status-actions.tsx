"use client";

import { BanIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { updateCompetitionStatus } from "../api";
import type { Competition } from "../types";
import { type CompetitionPendingAction, competitionStatusConfig } from "./competition-status-config";

export function CompetitionStatusActions({ competition, onChanged }: { competition: Competition; onChanged: () => Promise<unknown> }) {
  const [pendingAction, setPendingAction] = useState<CompetitionPendingAction | null>(null);
  const [working, setWorking] = useState(false);

  async function confirmAction() {
    if (!pendingAction) {
      return;
    }

    setWorking(true);
    try {
      const config = competitionStatusConfig[pendingAction];
      await updateCompetitionStatus(competition.id, config.status);
      toast.success(config.successMessage);
      await onChanged();
      setPendingAction(null);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  const config = pendingAction ? competitionStatusConfig[pendingAction] : null;

  return (
    <>
      {competition.status === "DRAFT" ? (
        <Button onClick={() => setPendingAction("publish")}>
          <SendIcon data-icon="inline-start" />
          انتشار
        </Button>
      ) : null}
      {competition.status === "PUBLISHED" ? (
        <Button variant="outline" className="text-danger" onClick={() => setPendingAction("cancel")}>
          <BanIcon data-icon="inline-start" />
          لغو مسابقه
        </Button>
      ) : null}
      <ConfirmDialog
        open={config !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        title={config?.title ?? ""}
        description={config?.description ?? ""}
        confirmLabel={config?.confirmLabel ?? ""}
        destructive={config?.destructive}
        loading={working}
        onConfirm={() => void confirmAction()}
      />
    </>
  );
}
