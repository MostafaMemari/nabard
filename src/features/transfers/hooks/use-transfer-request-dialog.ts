import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type CreateTransferRequestInput, createTransferRequestSchema } from "../schemas";
import { useTransferLookup, useTransferRequestCreate } from "./use-transfers";

export function useTransferRequestDialog({
  onOpenChange,
  onRequested,
}: {
  onOpenChange: (open: boolean) => void;
  onRequested: () => void;
}) {
  const { lookup } = useTransferLookup();
  const { request } = useTransferRequestCreate(onRequested);
  const [result, setResult] = useState<{ maskedName: string; currentCoachName: string } | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreateTransferRequestInput>({
    resolver: zodResolver(createTransferRequestSchema),
    defaultValues: { nationalCode: "" },
  });

  function close() {
    form.reset({ nationalCode: "" });
    setResult(null);
    setError(null);
    onOpenChange(false);
  }

  async function check() {
    const valid = await form.trigger();
    if (!valid) return;

    setWorking(true);
    setError(null);
    const response = await lookup(form.getValues("nationalCode"));
    setWorking(false);
    if (response.ok) {
      setResult(response.data);
    } else {
      setResult(null);
      setError(response.error);
    }
  }

  async function confirm() {
    if (!result) return;

    setWorking(true);
    const done = await request(form.getValues("nationalCode"));
    setWorking(false);
    if (done) {
      close();
    }
  }

  return { form, result, working, error, close, submit: () => (result ? confirm() : check()) };
}
