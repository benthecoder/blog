---
name: blog-design-system
description: Apply the bneo.xyz design system to new pages, components, and visual changes across the blog and its companion sites. Covers design principles, color tokens, typography, spacing, layout, imagery, reusable UI patterns, and interaction states. Use for UI implementation or design review in the blog repository, not unrelated sites or content-only edits.
---

# Blog design system

A personal publishing site with the character of a notebook: serif type, paper surfaces, colored ink, hand-drawn marks, and generous space. Writing, collections, and artwork provide the substance. Interface elements support browsing and reading without competing with the content.

## Using the system

Use the active blog checkout. The implementation sources are `app/globals.css`, `app/layout.tsx`, `app/providers.tsx`, and the components listed below. Resolve paths relative to the checkout rather than assuming a particular local directory.

Read the relevant component and its rendered context before extending it. Reuse tokens and components before adding a new variant. This document records existing foundations and gives design guidance for new work; it does not imply that every pattern has a shared React component. Page-specific CSS may have local values. Preserve intentional variations and treat newly proposed values as proposals, not established tokens.

## Principles

- **Content leads.** Give the reading, browsing, or viewing task the largest share of attention. Use progressive disclosure for secondary details.
- **Personal character.** Keep the serif typography, bilingual drawn wordmarks, sketches, and illustrated navigation. Prefer these existing assets to generic brand replacements.
- **Quiet hierarchy.** Establish importance through position, type size, weight, and spacing. Use rules and surface changes sparingly; avoid wrapping ordinary content in repeated cards.
- **Consistency by role.** A title, caption, action, or separator should have a consistent treatment across comparable contexts. Different page types can have different compositions.
- **Precise composition.** Align titles, body text, metadata, and controls to common edges. Align inline icons with their text, including the first line of wrapped labels.

## Foundations

### Color and themes

Surfaces stay stable across palettes. The ink colors change with the selected palette. Use semantic CSS variables or their Tailwind utilities instead of copying hex values into components.

| Role | Light token and baseline | Dark token and baseline |
| --- | --- | --- |
| Page surface | `paper` · `#fbfaf5` | `night` · `#1a1a1a` |
| Raised surface | `paper-raised` · `#f8fbfb` | `night-raised` · `#242424` |
| Inset surface | `paper-sunken` · `#f3f3f2` | Use the existing component’s dark surface treatment |
| Rule | `rule` · `#e5e4e6` | `night-rule` · `#333333` |
| Main ink | `ink` · `#3f6d99` | `chalk` · `#9dbedb` |
| Strong ink | `ink-strong` · `#365d82` | `chalk-strong` · `#c4d8e9` |
| Secondary ink | `ink-soft` · `#3f6d99` | `chalk-soft` · `#b1cbe2` |
| Muted ink | `ink-muted` · `#49749e` | `chalk-muted` · `#7790a6` |

Values shown are the steel baseline. Other palettes are indigo, olive, gold, vermillion, and rose. `paper-tint` and `paper-warm` provide additional light surfaces and accents; choose them by the existing component’s usage rather than inventing a dark counterpart.

**Prefer role tokens.** `app/globals.css` defines theme-aware roles that switch between the light and dark tokens above on their own, so one class covers both modes:

| Role | Light → dark | Use |
| --- | --- | --- |
| `primary` | ink-strong → chalk-strong | body copy, titles |
| `accent` | ink → chalk | links, marks, index rows |
| `secondary` | ink-soft → chalk-soft | hover, emphasis |
| `muted` | ink-muted → chalk-muted | dates, captions, meta |
| `surface` / `raised` | paper → night, paper-raised → night-raised | page, cards and overlays |
| `line` | rule → night-rule | rules, borders |
| `danger` | #b23b2e → #e0806f | errors, destructive actions |
| `success` | #4f7a3a → #9cc283 | saved, published, ok |
| `warning` | #9e6510 → #e0b062 | caution, pending |

Status roles are muted print pigments (each >= 4.5:1 on its surface) and do not follow `data-palette`. Never reach for Tailwind's default palette (`red-500`, `gray-200`, `black`, `white`): use a status role, or `night/NN` for a dimming overlay. Text on a filled role takes `text-surface` so it flips with the mode.

**Focus.** Add `focus-ring` to any interactive element for the one house keyboard treatment (2px `accent` outline, 2px offset, `:focus-visible` only).

### Themes

Three themes share one vocabulary. Each sets the same role names (`--role-*`) and font roles (`--font-body`, `--font-display`, `--font-ui`), so role utilities and shared components render correctly in all three:

| Theme | Scope | Look |
| --- | --- | --- |
| notebook (default) | `:root` / `.dark` in `globals.css` | paper, colored ink, serif |
| washi | `.places-explorer` (`/map`) | printed map, sumi ink, own dark toggle |
| darkroom | `.photo-site` (`/photos`) | dark contact sheet, geist sans + mono |

Write `text-primary` / `bg-raised` / `border-line` and a component works in any of them. Theme-only tokens (`--map-cat-*`, `--ph-faint`) stay private to their theme.

Write `text-primary`, not `text-ink-strong dark:text-chalk-strong`. Opacity modifiers work (`text-accent/60`). Plain CSS uses `var(--color-primary)` and so on. Use raw `ink-*`/`chalk-*` pairs only when the two modes intentionally use different roles. For text people need to read, keep opacity at 60% or above; lower values are for decoration and disabled states. Use the `eyebrow` utility for small uppercase section labels.

Theme mode is controlled by `.dark`; palette by `html[data-palette]`. Reuse `Providers`, `ThemeSwitch`, and `PaletteSwitch`. The global light body has a fixed 135° gradient from sunken to paper to raised; dark mode has a flat night background. A dedicated viewing surface can use a flat background.

Global prose defaults to `ink` in light mode and `chalk-strong` in dark mode. Other components intentionally vary text emphasis. Check the component rather than applying one text color everywhere. Selected rows should use a restrained fill or text emphasis; avoid bright blue selection borders. Keyboard focus remains visibly distinct from selection.

### Typography

The primary family is locally hosted **Averia Serif Libre**, exposed through `--font-averia`, `--font-serif`, and `font-serif`. Available font files cover 300, 400, and 700 with italic variants. Small technical labels may use the existing monospace treatment.

| Text role | Existing implementation | Usage |
| --- | --- | --- |
| Body | `text-base`; posts use `leading-relaxed` | Main reading text |
| Post/essay title | `text-2xl md:text-4xl`, bold, tight leading | Title outside the prose body |
| Wiki title | `text-2xl`, bold | Compact reference-page heading |
| In-prose h1 / h2 / h3 | 1.5rem / 1.2rem / 1.1rem in global CSS | Headings inside Markdown content |
| Index row | `text-sm md:text-base` in `PostPreview` | Browsable entry titles |
| Metadata | Usually `text-xs` or `text-sm` | Dates, counts, reading time, captions |
| Small print | `text-caption` 11px, `text-2xs` 10px, `text-3xs` 9px | Chart labels, badges, thumbnails; font-size only, line-height inherits. No arbitrary `text-[Npx]` |

These are contextual roles, not a universal heading ladder. Page titles and headings inside an article are separate treatments. Preserve heading semantics even when visual sizes differ. Lowercase labels and essay/wiki titles are existing conventions; do not mechanically lowercase authored post titles. Reserve wide tracking and uppercase for short utility labels.

### Spacing and layout

Use the existing Tailwind spacing scale. The following is guidance for choosing among its values, not a new set of named CSS tokens.

| Relationship | Useful scale values |
| --- | --- |
| Icon and label, tightly related metadata | 4–8px (`gap-1`–`gap-2`) |
| Related controls or row content | 12–16px (`gap-3`–`gap-4`) |
| Groups within a section | 24–32px (`6`–`8`) |
| Major sections | 40–48px (`10`–`12`) |

Start from the adjacent component’s spacing. Assign page gutters to the layout container; avoid adding padding to the prose that breaks alignment with its title and footer. Related elements should be closer together than separate sections.

The reading shell uses `max-w-xl`, expanding to `xl:max-w-3xl`; posts and essays add a `max-w-[65ch]` reading measure. The sidebar becomes fixed on large screens and flows above the content on smaller screens. Reuse `app/(sidebar)/layout.tsx` for comparable reading pages. Media and interactive canvases can use more width while retaining the type, palette, and control language.

### Shape, elevation, and imagery

Use 1px rules for separation. Keep ordinary text sections on the page surface; add a raised surface when it communicates a distinct object or overlay. Existing article photographs use `--radius-image: 0.5rem`, a mat, a hairline edge, and a soft shadow. Reuse `.photo-frame`, `.photo-plate`, and `.photo-label` through `PostImage` rather than rebuilding their styling. Other media layouts may have local corner sizes.

Reuse `SketchIcon` and the drawn assets in `public/icons`. It uses SVG masks tinted with the active ink. Utility icons can use existing stroke icons; keep their size and stroke consistent within a control group. Give icon-only actions accessible names.

Preserve an image’s aspect ratio in full viewing contexts. Deliberate preview crops are allowed: `PostImage` uses a square plate that opens the full photograph. Captions should remain subordinate to the image. Do not invent image metadata.

### Motion

Use motion to communicate interaction or loading. Existing examples include image previews, artwork rotation, the random-navigation dice, and short color transitions. Prefer the existing durations and easing in the relevant component. Respect reduced-motion preferences when adding transitions; keep movement from shifting the reading layout.

## Components and reusable treatments

| Component or treatment | When to use | Implementation and behavior |
| --- | --- | --- |
| Brand and navigation | Site identity and section discovery | `SideBar`, `SidebarNav`, `SketchIcon`; preserve drawn marks and responsive placement |
| Prose | Articles and text-led pages | `MarkdownContent`, global `.prose`; retain hand-drawn link underlines, quote/list/code treatments |
| Article layout | Dated posts with metadata and navigation | `RenderPost`; aligned title, metadata, optional contents, body, and footer |
| Index row | Archives and other textual collections | `PostPreview` / `PostLinkPreview`; title with quieter date, predictable hover treatment |
| Related content | Connections between entries | `RelatedPosts`, `Backlinks`, `WikiLink`; small links and fine separators rather than large promotional cards |
| Image and caption | Photographs within writing | `PostImage`; framed preview, caption, full-image overlay |
| Appearance controls | Mode and palette selection | `ThemeSwitch`, `PaletteSwitch`, `FloatingControls`; respect the active page shell’s placement |
| Search | Finding existing content | `SearchModal` and search-page components; preserve keyboard navigation, result hierarchy, and loading/empty/error handling |
| `Button` / `ButtonLink` | Any action (`Button`) or link that should look like one (`ButtonLink`) | `components/ui/Button.tsx`. `variant` `quiet` (default, text only), `outline`, `solid`; `size` `sm`/`md`; `tone="danger"` for destructive actions. Defaults to `type="button"`; pass `type="submit"` in forms |
| `IconButton` | A control that is only an icon | `components/ui/IconButton.tsx`. `aria-label` is required by the props type. `size` `sm` (tight, 14px icons) or `md` (44px target) |
| `Chip` | A filter that toggles | `components/ui/Chip.tsx`. `pressed` becomes `aria-pressed`, the selected look keys off it; optional `count`. Used by the map category filter |

The primitives are styled by roles only, carry `focus-ring`, and set `data-ui` so theme CSS (`map.css`, `photos.css`) leaves them alone, so they render correctly in notebook, washi and darkroom. Reach for them before writing a `<button className=...>`; every new button needs a `focus-visible` treatment, and the primitives already have it.

For controls without a shared component, use the nearest existing treatment. A link navigates; a button performs an action. Prefer low-emphasis text or icon actions for secondary tasks. Use an explicit text label when the action’s scope is unclear. Filters should communicate whether one or several values can be selected, show selection clearly, and offer a reset when needed. Do not introduce a new button or chip style for each page.

### Interaction states

Define the states relevant to each new or changed interactive element:

| State | Treatment |
| --- | --- |
| Default | Readable label and clear affordance |
| Hover | Restrained underline, color, or surface change; no layout shift |
| Focus | Visible keyboard indicator with enough contrast |
| Selected / expanded | Persistent treatment plus the appropriate semantic state, such as `aria-pressed` or `aria-expanded` |
| Disabled / loading | Convey availability or progress without losing the action label |
| Empty / error | Explain the state briefly and show a useful recovery action where available |

Hover details must also be reachable by keyboard or tap. Dialogs need an accessible name, predictable focus entry and return, and an accessible close action. Essential labels and controls must remain readable in each palette and color mode; copying an existing low-opacity value is not proof of adequate contrast.

## Page patterns

- **Landing:** drawn identity and artwork with a clear entry into the site; keep the composition spacious.
- **Reading:** title, supporting metadata, constrained prose, and related navigation. Reuse article/essay/wiki structures according to content type.
- **Collection:** compact entries, quiet counts or dates, and filtering or grouping only when it helps browse the content. Use rows for textual collections and image-led layouts for visual collections.
- **Detail:** make the selected content primary and disclose secondary information on demand. Keep a clear route back to its collection.
- **Explorer:** give the canvas or visualization ample space with a compact control area. On narrow screens, reorganize controls without hiding the core task.

These patterns apply across archives, wiki, library, projects, galleries, photographs, and interactive pages. A new page inherits the foundations; its layout follows its task.

## Content and implementation

Use concise, direct UI labels and the blog’s personal voice. Preserve authored titles and descriptions. Show only meaningful metadata; avoid empty placeholders for optional fields.

For a visual change, compare the page with an existing page of the same type. Check narrow and wide layouts, long titles, sparse and dense content, applicable interaction states, and both color modes. Verify the active palette and the composition as a whole. Update only the affected component or pattern; introduce a shared token or component when a repeated need justifies it.

## Checking your work

- `/design` (`app/design/page.tsx`) is the specimen: role swatches, status colors, the type scale, and every primitive in every state, rendered in the notebook, washi (`.places-explorer`) and darkroom (`.photo-site`) themes. Add new primitives there, and screenshot it in design PRs.
- `pnpm lint:design` (`scripts/checkDesignTokens.ts`, also a CI step) fails on hex colors, Tailwind default palette classes and arbitrary `text-[Npx]` sizes in `app/` and `components/`. Fix the hit with a role or size token; only add to its `ALLOW` list, with a reason, for a genuinely intentional exception.
