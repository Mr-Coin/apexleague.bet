import { useState } from "react";
import { pickLabel } from "#shared/parlay/model";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Choice } from "./Choice";
import type { PickRow, Result } from "./types";

const RESULTS: Result[] = ["won", "lost", "push", "void", "review", "pending"];

interface ReviewDialogProps {
  row: PickRow | null;
  onClose: () => void;
  busy: boolean;
  onSave: (id: string, result: Result, reason: string) => Promise<boolean>;
}

/** Commissioner override for a single leg. Remounted per row via `key` by the parent. */
export function ReviewDialog({ row, onClose, busy, onSave }: ReviewDialogProps) {
  const [result, setResult] = useState<Result>(row && row.result !== "pending" ? row.result : "won");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border w-[calc(100%-1.5rem)] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Review settlement</DialogTitle>
          <DialogDescription>{row ? pickLabel(row.pick) : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Choice
            label="Result"
            value={result}
            onChange={(v) => setResult(v as Result)}
            options={RESULTS.map((v) => ({ value: v, label: v }))}
          />
          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Reason / sportsbook result
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required for the audit trail"
              maxLength={200}
            />
          </label>
          <Button
            className="w-full font-semibold"
            disabled={busy || reason.length < 3 || !row}
            onClick={async () => {
              if (row && (await onSave(row.id, result, reason))) onClose();
            }}
          >
            Save reviewed result
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
