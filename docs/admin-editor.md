# Admin editor design

The local writing desk at `/admin/edit/[slug]`. Public-site notes live in [design.md](design.md).

## Layout and controls

- Keep writing central. Save stays visible; publishing belongs to the draft/live status control. Format sits beside the word count. Do not add an expanding Tools row.
- Templates use a quiet text trigger and a short typographic list, without a boxed native select. Changing one must confirm before replacing unsaved writing.
- Focus hides panels and navigation, has a visible exit, and exits on Escape.
- A photo click previews. Insert is explicit. Dragging retains the text position through crop and upload; moving the cursor later cannot redirect that insertion.
- Support keyboard browsing, native modal focus containment, clear errors, retry after failed upload, and usable narrow layouts.
- A browser recovery copy is not a file save or a cloud save. Label these states accurately.
- Preserve CodeMirror state and undo history while controls and panels change.

## Voice and details

- Control labels are lowercase (`save`, `focus`, `insert`, `photos · oct 5, 2026`); full sentences keep normal capitalisation.
- Confirm dialogs name the action on both buttons (`keep` / `delete`, `not now` / `restore`), never "Cancel / Confirm".
- Save is solid only when there is something to save. Status text appears only when there is something to say.
- The editor header and photo panel header share one height so their rules line up.
- Scrollbars stay faint at rest and strengthen on hover.
- Crop defaults to square because post images render as square plates; the crop shown is the framing readers see.
- On touch, controls stay visible; hover-only reveals are for fine pointers.

References: [UI Skills](https://www.ui-skills.com/), [better-ui](https://www.ui-skills.com/skills/jakubkrehel/better-ui). Apply the guidance to this site's evidence; do not import a different visual style.
