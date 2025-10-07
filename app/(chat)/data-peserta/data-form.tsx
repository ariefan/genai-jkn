"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/toast";
import { formatInstructionTimestamp } from "@/lib/date-format";
import { saveBillingData } from "./actions";

type DataPesertaFormProps = {
  initialValue: string;
  lastUpdatedAt?: string;
  lastUpdatedLabel?: string;
};

export function DataPesertaForm(props: DataPesertaFormProps) {
  const { initialValue, lastUpdatedAt, lastUpdatedLabel } = props;

  const [baselineValue, setBaselineValue] = useState(initialValue);
  const [value, setValue] = useState(initialValue);
  const [lastSavedAt, setLastSavedAt] = useState(lastUpdatedAt);
  const [lastSavedLabel, setLastSavedLabel] = useState(lastUpdatedLabel);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => value !== baselineValue,
    [baselineValue, value]
  );

  const timestampLabel = useMemo(() => {
    if (lastSavedLabel) {
      return lastSavedLabel;
    }

    if (lastSavedAt) {
      const formatted = formatInstructionTimestamp(lastSavedAt);
      return formatted ?? lastSavedAt;
    }

    return undefined;
  }, [lastSavedAt, lastSavedLabel]);

  return (
    <form
      className="flex h-full w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const result = await saveBillingData({ content: value });

          if (result.success) {
            setBaselineValue(result.content);
            setValue(result.content);
            if (result.updatedAt) {
              setLastSavedAt(result.updatedAt);
              setLastSavedLabel(
                formatInstructionTimestamp(result.updatedAt) ??
                  result.updatedAt
              );
            }

            toast({
              type: "success",
              description: "Data peserta berhasil disimpan.",
            });
            return;
          }

          toast({
            type: "error",
            description: result.error ?? "Data peserta gagal disimpan.",
          });
        });
      }}
    >
      <div className="flex flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="font-medium">billing-data.json</span>
        {timestampLabel ? (
          <span>Terakhir diperbarui {timestampLabel}</span>
        ) : (
          <span>Belum ada informasi pembaruan</span>
        )}
      </div>

      <Textarea
        className="flex-1 font-mono text-sm"
        name="data-peserta-content"
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        value={value}
      />

      <div className="flex flex-row justify-end gap-2">
        <Button disabled={!isDirty || isPending} type="submit">
          {isPending ? "Menyimpan..." : "Simpan Data"}
        </Button>
      </div>
    </form>
  );
}

