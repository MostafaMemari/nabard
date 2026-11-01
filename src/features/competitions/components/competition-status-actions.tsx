"use client";

import { BanIcon, CalendarClockIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/http";
import { extendCompetition, updateCompetitionStatus } from "../api";
import type { Competition, ExtendCompetitionInput } from "../types";
import { CompetitionCancelDialog } from "./competition-cancel-dialog";
import { competitionStatusConfig } from "./competition-status-config";
import { DeadlineExtensionDialog } from "./deadline-extension-dialog";

export function CompetitionStatusActions({ competition, onChanged }: { competition: Competition; onChanged: () => Promise<unknown> }) {
  const [pendingPublish, setPendingPublish] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [pendingExtend, setPendingExtend] = useState(false);
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

  async function extend(input: ExtendCompetitionInput) {
    setWorking(true);
    try {
      await extendCompetition(competition.id, input);
      toast.success("مهلت ثبت نام تمدید شد.");
      await onChanged();
      setPendingExtend(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "انجام نشد. دوباره تلاش کنید.");
      throw error;
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
        <>
          <Button variant="outline" onClick={() => setPendingExtend(true)}>
            <CalendarClockIcon data-icon="inline-start" />
            تمدید مهلت
          </Button>
          <Button variant="outline" className="text-danger" onClick={() => setPendingCancel(true)}>
            <BanIcon data-icon="inline-start" />
            لغو مسابقه
          </Button>
        </>
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
      <DeadlineExtensionDialog
        open={pendingExtend}
        onOpenChange={setPendingExtend}
        competition={competition}
        loading={working}
        onConfirm={(input) => extend(input)}
      />
    </>
  );
}
