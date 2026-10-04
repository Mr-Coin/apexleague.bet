import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ChoiceProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
  disabled?: boolean;
}

/** Labelled single-select used throughout the parlay forms. */
export function Choice({ value, onChange, options, label, className, disabled }: ChoiceProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} className={cn("bg-muted/40 border-border text-foreground min-h-11", className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="max-w-[calc(100vw-2rem)]">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="whitespace-normal">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
