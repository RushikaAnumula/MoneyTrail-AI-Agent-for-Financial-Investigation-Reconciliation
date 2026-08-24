import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pill = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-secondary text-secondary-foreground",
        success: "border-success/30 bg-success/12 text-success",
        warning: "border-warning/30 bg-warning/12 text-warning",
        danger: "border-destructive/35 bg-destructive/12 text-destructive",
        info: "border-info/30 bg-info/12 text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type Tone = NonNullable<VariantProps<typeof pill>["tone"]>;

const toneMap: Record<string, Tone> = {
  captured: "success",
  authorized: "info",
  failed: "danger",
  refunded: "warning",
  settled: "success",
  pending: "warning",
  partial: "warning",
  unsettled: "danger",
  reconciled: "success",
  exception: "danger",
  in_review: "info",
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
  open: "danger",
  investigating: "warning",
  resolved: "success",
};

const labels: Record<string, string> = {
  in_review: "In review",
};

export function StatusPill({ value, dot = true, className }: { value: string; dot?: boolean; className?: string }) {
  const tone = toneMap[value] ?? "neutral";
  const label = labels[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span className={cn(pill({ tone }), className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
