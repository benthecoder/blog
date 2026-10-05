import { PERIOD_LABELS, type PeriodKind } from "@/utils/digest/schedule";

type Choice = PeriodKind | "blank";

const CHOICES: Choice[] = ["blank", "weekly", "monthly", "quarterly"];

export function TemplatePicker({
  value,
  loading,
  suggested,
  onChange,
}: {
  value: Choice;
  loading: boolean;
  /** Templates that fit this date, shown with a dot. */
  suggested: PeriodKind[];
  onChange: (choice: Choice) => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 text-xs ${loading ? "opacity-60" : ""}`}
    >
      {CHOICES.map((c) => (
        <button
          key={c}
          type="button"
          disabled={loading}
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={`px-2 py-0.5 transition-colors ${
            value === c
              ? "bg-ink text-paper dark:bg-chalk dark:text-night"
              : "text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
          }`}
        >
          {c === "blank" ? "daily" : PERIOD_LABELS[c]}
          {c !== "blank" && suggested.includes(c) && value !== c ? " •" : ""}
        </button>
      ))}
    </div>
  );
}
