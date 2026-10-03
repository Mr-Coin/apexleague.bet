import { cn } from "@/lib/utils";
import { resultTone } from "./format";
import type { Result } from "./types";

export function ResultPill({ result, className }: { result: Result; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap",
        resultTone(result),
        className,
      )}
    >
      {result}
    </span>
  );
}
