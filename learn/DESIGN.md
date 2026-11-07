# Design proposal (no UI in this PR)

Nothing below has been built. No route, nav item, or projects file was
changed. This is the write-up to approve against before any interface work.

## `/learn`

Goal: a quiet page that answers "what should I do next?" and "what evidence
do we actually have?" — not a dashboard of vanity counts.

### Layout (low chrome, same compact spirit as the sheets)

1. **Next action** in plain language, one sentence. Example: "Open today's
   math sheet and try the first problem before reading the explainer." The
   sentence is computed from issued-today / activity, never from assumed
   mastery.
2. **Current concepts**, each linked to its source (curriculum step URL,
   a post, a paper). These are things on the table, not badges.
3. **Evidence, named honestly**
   - Issued sheets (printed and uploaded — not attempts).
   - Activity: which of those sheets later showed ink (`present`), were found
     blank (`none`), or were not scannable (`unknown`). Unknown stays unknown.
   - Assessments performed (checked) and demonstrated items (correct, with
     provenance, matching a printed item).
4. **No fake mastery.** Do not show FSRS "mean recall" while display is still
   counted as Good. Do not treat curriculum step 31 as proof that step 30 was
   learned. Do not turn sheet-level ink into per-item checkmarks.
5. If an activity strip appears later, use only the allowlisted `{date,
   sheet, issued, activity}` fields, with unknown as an empty/distinct state
   rather than a red zero. The earlier heatmap mockup's sample-data section
   must not ship.

Counts belong in a short legend, not a hero header. The rejected sheet
redesign taught that large labels crowd out the work.

### Data the page would read

`learn export`'s allowlisted JSON, and only after an explicit visibility
opt-in to place that file on the public site (or a private preview). Until
then the page should not exist.

## Projects list

The live `/projects` page
([bneo.xyz/projects](https://bneo.xyz/projects)) is a short leftover list
(scribesystem, aha, deeptalks, two ideas) linked from the sidebar. The
markdown and route can stay so old URLs do not break.

**Recommended option:** unlist it. Remove `{ path: "/projects", text: "projects" }`
from `components/layout/SidebarNav.tsx` only. Keep
`app/(sidebar)/projects/page.tsx` and `projects.md`. No deletion of the apps
or the copy.

### Examples to choose among (still no build)

1. **Unlisted but kept** (recommended). Many writer sites simply omit a
   projects item from chrome. `/colophon` already covers this site.
2. **Narrated artifacts**, closer to [Kartik Agaram's code
   notebook](https://akkartik.name/code) or Alicia Guo's artifacts gallery
   (one of the inspirations already linked from `projects.md`): work as
   objects with stories, not a "done?" resume.
3. **Jaclyn-style "Top of Mind"**
   ([straightupjac.xyz/projects](https://www.straightupjac.xyz/projects)) —
   only if there is current work he actually wants to feature. The present
   three apps do not read that way.
4. **Do not do** a visual redesign that still leads with the same three
   links.

If `/projects` is later unlisted from the sidebar, also drop any future home
"app icon" or `/start` link that points there. That is still a later change.
