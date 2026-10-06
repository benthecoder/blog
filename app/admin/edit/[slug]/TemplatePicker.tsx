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
  suggested: PeriodKind[];
  onChange: (choice: Choice) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-ink-soft dark:text-chalk-muted">
      <span>Template</span>
      <select
        value={value}
        disabled={loading}
        onChange={(event) => onChange(event.target.value as Choice)}
        className="min-h-11 sm:min-h-9 max-w-40 bg-paper dark:bg-night text-ink dark:text-chalk border border-rule dark:border-night-rule rounded-xs px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
      >
        {CHOICES.map((choice) => (
          <option key={choice} value={choice}>
            {choice === "blank" ? "daily" : PERIOD_LABELS[choice]}
            {choice !== "blank" && suggested.includes(choice)
              ? " · suggested"
              : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
