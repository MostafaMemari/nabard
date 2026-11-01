"use client";

import { BanIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { updateCompetitionStatus } from "../api";
import type { Competition } from "../types";
import { CompetitionCancelDialog } from "./competition-cancel-dialog";
import { competitionStatusConfig } from "./competition-status-config";

export function CompetitionStatusActions({ competition, onChanged }: { competition: Competition; onChanged: () => Promise<unknown> }) {
  const [pendingPublish, setPendingPublish] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [working, setWorking] = useState(false);

  async function publish() {
    setWorking(true);
    try {
      await updateCompetitionStatus(competition.id, "PUBLISHED");
      toast.success(competitionStatusConfig.publish.successMessage);
      await onChanged();
      setPendingPublish(false);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  async function cancel(reason: string) {
    setWorking(true);
    try {
      await updateCompetitionStatus(competition.id, "CANCELED", { reason });
      toast.success(competitionStatusConfig.cancel.successMessage);
      await onChanged();
      setPendingCancel(false);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      {competition.status === "DRAFT" ? (
        <Button onClick={() => setPendingPublish(true)}>
          <SendIcon data-icon="inline-start" />
          انتشار
        </Button>
      ) : null}
      {competition.status === "PUBLISHED" ? (
        <Button variant="outline" className="text-danger" onClick={() => setPendingCancel(true)}>
          <BanIcon data-icon="inline-start" />
          لغو مسابقه
        </Button>
      ) : null}
      <ConfirmDialog
        open={pendingPublish}
        onOpenChange={setPendingPublish}
        title={competitionStatusConfig.publish.title}
        description={competitionStatusConfig.publish.description}
        confirmLabel={competitionStatusConfig.publish.confirmLabel}
        loading={working}
        onConfirm={() => void publish()}
      />
      <CompetitionCancelDialog
        open={pendingCancel}
        onOpenChange={setPendingCancel}
        loading={working}
        onConfirm={(reason) => cancel(reason)}
      />
    </>
  );
}
