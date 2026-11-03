"use client";

import { BanIcon, CalendarClockIcon, SendIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Competition } from "../types";
import { CompetitionCancelDialog } from "./competition-cancel-dialog";
import { competitionStatusConfig } from "./competition-status-config";
import { DeadlineExtensionDialog } from "./deadline-extension-dialog";
import { useCompetitionStatusActions } from "./use-competition-status-actions";

export function CompetitionStatusActions({ competition, onChanged }: { competition: Competition; onChanged: () => Promise<unknown> }) {
  const actions = useCompetitionStatusActions({ competition, onChanged });
  const publishConfig = competitionStatusConfig.publish;

  return (
    <>
      {competition.status === "DRAFT" ? (
        <Button onClick={() => actions.setPendingPublish(true)}>
          <SendIcon data-icon="inline-start" />
          انتشار
        </Button>
      ) : null}
      {competition.status === "PUBLISHED" ? (
        <>
          <Button variant="outline" onClick={() => actions.setPendingExtend(true)}>
            <CalendarClockIcon data-icon="inline-start" />
            تمدید مهلت
          </Button>
          <Button variant="outline" className="text-danger" onClick={() => actions.setPendingCancel(true)}>
            <BanIcon data-icon="inline-start" />
            لغو مسابقه
          </Button>
        </>
      ) : null}
      <ConfirmDialog
        open={actions.pendingPublish}
        onOpenChange={actions.setPendingPublish}
        title={publishConfig.title}
        description={publishConfig.description}
        confirmLabel={publishConfig.confirmLabel}
        loading={actions.working}
        onConfirm={() => void actions.publish()}
      />
      <CompetitionCancelDialog
        open={actions.pendingCancel}
        onOpenChange={actions.setPendingCancel}
        loading={actions.working}
        onConfirm={(reason) => actions.cancel(reason)}
      />
      <DeadlineExtensionDialog
        open={actions.pendingExtend}
        onOpenChange={actions.setPendingExtend}
        competition={competition}
        loading={actions.working}
        onConfirm={(input) => actions.extend(input)}
      />
    </>
  );
}
