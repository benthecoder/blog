import { PERIOD_LABELS, type PeriodKind } from "@/utils/digest/schedule";
import { EditorPopover } from "@/components/admin/EditorPopover";

type Choice = PeriodKind | "blank";
const CHOICES: Choice[] = ["blank", "weekly", "monthly", "quarterly"];
const spans: Record<Choice, string> = {
  blank: "day",
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
};
const title = (choice: Choice) =>
  choice === "blank" ? "daily" : PERIOD_LABELS[choice];

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
    <EditorPopover
      label={loading ? "loading…" : title(value)}
      name="Choose post template"
      disabled={loading}
    >
      {(close) => (
        <>
          <p className="px-2 pb-2 text-[11px] text-muted">start with</p>
          <div
            role="group"
            aria-label="Post template"
            className="divide-y divide-line"
          >
            {CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={value === choice}
                onClick={() => {
                  close();
                  onChange(choice);
                }}
                className="w-full py-3 px-2 flex items-baseline justify-between gap-3 text-left hover:bg-paper-sunken dark:hover:bg-night focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className={value === choice ? "italic text-primary" : ""}>
                  {title(choice)}
                </span>
                <span className="text-[10px] text-muted">
                  {choice !== "blank" && suggested.includes(choice)
                    ? "today · "
                    : ""}
                  {spans[choice]}
                  {value === choice ? " ✓" : ""}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </EditorPopover>
  );
}
