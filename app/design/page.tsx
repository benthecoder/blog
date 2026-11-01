import type { CSSProperties, ReactNode } from "react";
import { Copy, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
// Theme scopes live next to their routes; the specimen borrows them.
import "@/app/map/map.css";
import "@/app/photos/photos.css";

export const metadata = {
  title: "design",
  robots: { index: false },
};

const roles = [
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["secondary", "bg-secondary"],
  ["muted", "bg-muted"],
  ["surface", "bg-surface"],
  ["raised", "bg-raised"],
  ["line", "bg-line"],
] as const;

const ramp = [
  ["ink-muted", "bg-ink-muted"],
  ["ink-soft", "bg-ink-soft"],
  ["ink", "bg-ink"],
  ["ink-strong", "bg-ink-strong"],
] as const;

const status = [
  ["danger", "bg-danger"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
] as const;

const sizes = [
  ["text-3xs", "3xs", "9px"],
  ["text-2xs", "2xs", "10px"],
  ["text-caption", "caption", "11px"],
  ["text-xs", "xs", "12px"],
  ["text-sm", "sm", "14px"],
  ["text-base", "base", "16px"],
  ["text-lg", "lg", "18px"],
  ["text-xl", "xl", "20px"],
  ["text-2xl", "2xl", "24px"],
  ["text-3xl", "3xl", "30px"],
  ["text-4xl", "4xl", "36px"],
] as const;

// `:focus-visible` cannot be forced from markup, so the focus column draws the
// same outline `.focus-ring` does. Tab through any control to see the real one.
const forcedFocus: CSSProperties = {
  outline: "2px solid var(--role-accent)",
  outlineOffset: "2px",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6 mt-12">
      <h2 className="eyebrow mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Swatches({
  items,
}: {
  items: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {items.map(([name, bg]) => (
        <li key={name} className="flex items-center gap-2 text-xs">
          <span
            className={`size-6 shrink-0 rounded-xs border border-line ${bg}`}
          />
          <span className="text-muted">{name}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-x-4 gap-y-2 py-2.5 sm:grid-cols-[5.5rem_repeat(3,minmax(0,1fr))]">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

const note = "text-caption text-muted";

/** Every primitive in every state. Rendered once per theme. */
function Primitives() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button variant="quiet">quiet</Button>
        <Button variant="outline">outline</Button>
        <Button variant="solid">solid</Button>
        <Button variant="quiet" tone="danger">
          quiet
        </Button>
        <Button variant="outline" tone="danger">
          outline
        </Button>
        <Button variant="solid" tone="danger">
          solid
        </Button>
        <Button size="sm" variant="outline">
          small
        </Button>
        <ButtonLink href="/design" variant="outline">
          link
        </ButtonLink>
      </div>
      <div className="text-sm">
        <Row label="">
          <span className={note}>button</span>
          <span className={note}>icon button</span>
          <span className={note}>chip</span>
        </Row>
        <Row label="default">
          <span>
            <Button variant="outline">outline</Button>
          </span>
          <span>
            <IconButton aria-label="close">
              <X size={16} />
            </IconButton>
          </span>
          <span>
            <Chip pressed={false} count={12}>
              food
            </Chip>
          </span>
        </Row>
        <Row label="hover">
          <span className={note}>border to accent</span>
          <span className={note}>tint, ink to accent</span>
          <span className={note}>border to muted</span>
        </Row>
        <Row label="focus">
          <span>
            <Button variant="outline" style={forcedFocus}>
              outline
            </Button>
          </span>
          <span>
            <IconButton aria-label="copy" style={forcedFocus}>
              <Copy size={16} />
            </IconButton>
          </span>
          <span>
            <Chip pressed={false} count={12} style={forcedFocus}>
              food
            </Chip>
          </span>
        </Row>
        <Row label="pressed">
          <span className={note}>use a chip</span>
          <span className={note}>use a chip</span>
          <span>
            <Chip pressed count={12}>
              food
            </Chip>
          </span>
        </Row>
        <Row label="disabled">
          <span>
            <Button variant="outline" disabled>
              outline
            </Button>
          </span>
          <span>
            <IconButton aria-label="close" disabled>
              <X size={16} />
            </IconButton>
          </span>
          <span>
            <Chip pressed={false} count={12} disabled>
              food
            </Chip>
          </span>
        </Row>
      </div>
    </div>
  );
}

// `.places-explorer` and `.photo-site` are full-page shells (fixed, 100dvh).
// The inline style turns them into ordinary blocks; the data attribute keeps
// the floating mode and palette switchers on screen.
const block: CSSProperties = {
  position: "relative",
  inset: "auto",
  zIndex: "auto",
  display: "block",
  height: "auto",
  minHeight: 0,
  background: "var(--role-surface)",
  color: "var(--role-primary)",
  padding: "1.25rem",
};

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-primary sm:px-6">
      <h1 className="text-2xl font-bold">design</h1>
      <p className="mt-2 text-sm text-muted">
        the roles, sizes and controls every page builds from. mode and palette
        follow the switchers in the corner; run <code>pnpm lint:design</code> to
        check nothing drifts from them.
      </p>

      <Section title="roles">
        <Swatches items={roles} />
        <p className="mt-5 mb-3 text-xs text-muted">
          ink ramp, moves with the palette
        </p>
        <Swatches items={ramp} />
      </Section>

      <Section title="status">
        <Swatches items={status} />
        <p className="mt-3 text-xs text-muted">
          fixed print pigments, they do not follow the palette.
        </p>
      </Section>

      <Section title="type">
        <ul>
          {sizes.map(([cls, name, px]) => (
            <li
              key={name}
              className="grid grid-cols-[4.5rem_1fr] items-baseline gap-x-4 border-b border-line/50 py-1.5"
            >
              <span className="text-xs text-muted">
                {name} <span className="text-caption">{px}</span>
              </span>
              <span className={cls}>the quiet notebook</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="notebook">
        <Primitives />
      </Section>

      <Section title="washi (.places-explorer)">
        <div className="places-explorer" data-specimen style={block}>
          <Primitives />
        </div>
      </Section>

      <Section title="darkroom (.photo-site)">
        <div className="photo-site" data-specimen style={block}>
          <Primitives />
        </div>
      </Section>
    </main>
  );
}
