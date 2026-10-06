# Design notes

## Public site

- Follow the existing site: Averia, paper/night surfaces, palette tokens, homemade drawings, open space.
- New sidebar entries need Benedict's drawings. Do not append text navigation or substitute a generic icon.
- Colophon: Fonts, Colors, Icons, Sounds, Tech, Host, Github. Actual hex codes and swatches; short credits. No product copy, invented philosophy, tooling inventory, or sound checkbox.
- Do not write first-person prose for Benedict. Research can suggest structures and collect material; leave the writing to him.
- Dithering and small drawing interactions are part of the intended direction. An unwired experiment is not automatically dead code.
- Guestbook is deferred.

## Editor

- Keep writing central. Save stays visible; secondary actions belong under Tools.
- Templates use one labeled field. Changing one must confirm before replacing unsaved writing.
- Focus hides panels and navigation, has a visible exit, and exits on Escape.
- A photo click previews. Insert is explicit. Dragging retains the text position through crop and upload; moving the cursor later cannot redirect that insertion.
- Support keyboard browsing, native modal focus containment, clear errors, retry after failed upload, and usable narrow layouts.
- A browser recovery copy is not a file save or a cloud save. Label these states accurately.
- Preserve CodeMirror state and undo history while controls and panels change.

References: [UI Skills](https://www.ui-skills.com/), [better-ui](https://www.ui-skills.com/skills/jakubkrehel/better-ui). Apply the guidance to this site's evidence; do not import a different visual style.
