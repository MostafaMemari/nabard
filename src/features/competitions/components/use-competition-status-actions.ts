import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/http";
import { extendCompetition, updateCompetitionStatus } from "../api";
import type { Competition, ExtendCompetitionInput } from "../types";
import { competitionStatusConfig } from "./competition-status-config";

export function useCompetitionStatusActions({ competition, onChanged }: { competition: Competition; onChanged: () => Promise<unknown> }) {
  const [pendingPublish, setPendingPublish] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [pendingExtend, setPendingExtend] = useState(false);
  const [working, setWorking] = useState(false);

  async function run(action: () => Promise<unknown>, successMessage: string, close: () => void, rethrow = false) {
    setWorking(true);
    try {
      await action();
      toast.success(successMessage);
      await onChanged();
      close();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "انجام نشد. دوباره تلاش کنید");
      if (rethrow) {
        throw error;
      }
    } finally {
      setWorking(false);
    }
  }

  return {
    pendingPublish,
    setPendingPublish,
    pendingCancel,
    setPendingCancel,
    pendingExtend,
    setPendingExtend,
    working,
    publish: () =>
      run(
        () => updateCompetitionStatus(competition.id, "PUBLISHED"),
        competitionStatusConfig.publish.successMessage,
        () => setPendingPublish(false),
      ),
    cancel: (reason: string) =>
      run(
        () => updateCompetitionStatus(competition.id, "CANCELED", { reason }),
        competitionStatusConfig.cancel.successMessage,
        () => setPendingCancel(false),
      ),
    extend: (input: ExtendCompetitionInput) =>
      run(
        () => extendCompetition(competition.id, input),
        "مهلت ثبت نام تمدید شد",
        () => setPendingExtend(false),
        true,
      ),
  };
}
