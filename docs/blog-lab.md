# A notebook with room to experiment

Research and implementation direction, October 6, 2026. This is a working proposal, not a claim that every experiment below has shipped.

## What the site already says about you

The useful starting point is your work, rather than a personality label. Your request explicitly names “create more than I consume” as the purpose of the blog. Your existing writing gives that purpose several practical forms:

- **Small observations:** `posts/noise.md` starts with an everyday question about car horns and music and follows it into John Cage. This works because of the question and connection, rather than a complicated publishing format.
- **Useful questions:** `posts/papers.md` records five questions for understanding ML papers. Those are an excellent starting template for your own paper notes.
- **Low-friction capture:** `posts/donelist.md` describes struggling with oversized daily goals and finding a Raycast daily-note command useful. Writing tools should help you begin and remember what you did, without turning each entry into another ambitious task.
- **An unfinished, personal surface:** drawings, Averia Serif Libre, six ink palettes, little sounds, daily photos, and links between notes already give this site a recognizable character.

These observations suggest a notebook and workshop: an easy writing desk, connected reference notes, and small interactive things you actually use. Avoid making every interest into a dashboard, a streak, or a score.

## What I inspected

Current `main` was `ed76f31`, with the wiki editor, security, linting, artwork, and period-template work already merged. I inspected the app, editor, data paths, package scripts, roadmap, and the earlier Desloppify review. I fetched the **360 most recent public Curius bookmarks**, not your entire archive. Most recent saves are technical; that sample is too small to equate every bookmarked site with an admired design.

Two saved examples worth learning from are [Andrew Gallant's blog](https://burntsushi.net/), where substantial projects and explanatory writing live together, and [(Basic) Bookmarks](https://bmrks.com/), which gives collecting links a focused home. From your existing inspiration list, [Rishi Kothari](https://www.rishi.cx/) gives individual projects room within a personal introduction, and [Linus Rogge](https://linusrogge.com/) currently uses a very spare introduction and a few outward links. These are different approaches, so I would borrow specific interactions rather than imitate one site's whole surface. Some older inspiration URLs could not be fetched; I have not treated old roadmap descriptions as proof of their current behavior.

## Technology choices

**Keep Next.js, Tailwind, and Markdown as the core.** Your site mixes static journal content with server routes, databases, a local authoring application, and interactive visualizations. The current architecture already supports those needs. [Tailwind v4](https://tailwindcss.com/blog/tailwindcss-v4) uses a CSS-first approach and fits your existing palette variables. [StyleX](https://stylexjs.com/docs/learn/thinking-in-stylex/) is a different styling model; a migration would touch most components without giving the writing system a specific new capability. Trying it in a future isolated experiment would teach more with less disruption.

**Keep Prettier, ESLint, and oxlint; add Knip.** The first three check formatting and code correctness. [Knip](https://knip.dev/overview/getting-started) checks reachability of files, exports, and dependencies. Its findings need review: command-line utilities and Next.js entry points are often used without imports. Register the actual entry points, then make `pnpm check:unused` a CI check. Don't optimize Desloppify's raw score; the earlier report had unassessed subjective dimensions and many heuristic findings.

**Give Rust or Go a real job.** Rust could build a small offline search index or Markdown link checker, with a measured TypeScript baseline before adding WebAssembly. [wasm-bindgen](https://rustwasm.github.io/docs/wasm-bindgen/) provides the JavaScript/WebAssembly interface when a browser experiment warrants it. Go is a good possible home for a small local device bridge or backup verifier; its [official HTTP service tutorial](https://go.dev/doc/tutorial/web-service-gin) shows the basic server shape. Neither language needs to replace the blog framework to become part of the project.

## Experiments that connect to your life

| Experiment | Small, useful first version | Technology to explore | What would make it worth keeping? |
|---|---|---|---|
| Jazz notebook | A chord voicing beside a short recording and a note about what you heard; optional play button | Native Web Audio first; [Tone.js](https://tonejs.github.io/) for musical timing, synths, or sampled instruments | You return to it while practicing |
| MIDI practice sketch | Highlight played notes or record a short phrase, with ordinary keyboard controls as a fallback | [Web MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API); browser support is limited and permission is required | It helps you hear or recognize something you are learning |
| AI paper notes | Citation, the five questions from your existing paper post, your explanation, limitations, and related wiki links | Existing Markdown/wiki; optional [Zotero API](https://www.zotero.org/support/dev/web_api/v3/basics) for citation metadata later | A note helps you explain a paper weeks after reading it |
| Reading shelf | One passage, one question, and one thing you tried from a book, linked to existing library entries | Existing Markdown and links | Reading leaves a small artifact, without a burdensome tracking system |
| Table tennis field notes | One clip or diagram and a short observation after a session | Local photo/video capture, simple drawing/canvas annotation | You can find and act on an earlier observation |
| Training notes | A private log of what you practiced and noticed; publish only what you deliberately choose | Local Markdown first | It supports consistency without making health information public by default |
| Physical “made something” button | An ESP32 button queues a timestamped local capture; show only a deliberately published count or note | [ESPHome REST/event APIs](https://esphome.io/web-api/) and a local bridge, possibly Go | It reduces the friction of recording something you made |
| Personal spending reflection | Import a deliberately selected CSV locally, categorize it, and publish a manually reviewed aggregate if useful | A local Go/Rust CSV tool; a separate private data directory | It helps you ask a useful question without connecting raw accounts to the public blog |
| Guestbook, later | Moderated text entries, accessible form, clear retention, and rate limiting | Existing server/database stack | Visitors leave worthwhile notes and upkeep stays manageable |

The hardware and financial ideas are proposals. No devices, bank accounts, private training records, or external accounts have been connected. The first hardware experiment should use a local service; don't expose the device or a financial endpoint publicly to make a demo convenient.

## The writing desk

The important change is reducing the number of decisions between “I noticed something” and “I wrote it down.”

1. Make the document the center of the editor. Keep save, preview, and exit visible. Templates use a quiet text trigger, Format sits beside the word count, and publication actions sit under draft/live status. No expanding Tools row. Focus mode can be exited with the keyboard.
2. Show a quiet word count and reading estimate; use these for orientation, not a target. Metadata and Markdown syntax should not inflate the count.
3. Offer optional prompts, not automatic prose: “What happened?”, “What did I notice?”, “What changed my mind?”, or the five ML-paper questions. Templates should be explicitly chosen, preserve existing text, and never silently overwrite a draft.
4. Make recovery trustworthy. Catch malformed saved drafts, report failed persistence, keep stale-save protections, and make the difference between a browser recovery copy and a Markdown file on disk explicit.
5. Use AI for retrieval, organizing links, finding missing citations, or proposing questions. Preserve your existing rule: the AI collects and formats; you write the takes.

## First implementation pass

PR #45 adds a concise colophon with real color swatches, plus Knip with deliberate script entry points. No generic navigation icons, text footer links, or sound checkbox were retained. It removes the unused wiki tree builder and the undocumented one-off table-drop script, removes an unused direct CodeMirror dependency, and declares the `server-only` marker explicitly. The shared wiki address validator remains exported because the writing-check endpoint uses it.

Reliability fixes cover JSON-LD closing-tag escaping and optional preference storage. Search validation and stale-request handling live in #48. Archive/RSS payload reductions and deployed metadata reuse live in #45. Its `pnpm image` command consolidates three old image scripts, with optional dithering and explicit output paths that preserve originals.

The writing desk is implemented in #47, including preview-before-insert photos, drag insertion, recovery, cancellation, and a bounded photo-day cache. Wiki paper/reading-note prompts and local writing checks live in #50; production capture authentication lives in #46. These are review branches, not claims that everything is deployed. The garden prototype (#49) is paused after feedback. The guestbook remains later work. No framework migration has been performed.

## Design direction clarified during the preview

Keep the sidebar entirely illustrated: no text footer and no generic icon additions.
You will draw new wiki/colophon navigation marks. Dithering, scanned drawings,
and tactile interactions are central. The peony was too complicated for the
garden; wait for the intended flower drawings and interaction direction rather
than treating that prototype as accepted. Projects now include the blog,
drawings/photos, and the existing Nativity sketch alongside apps. Eight additional
timeline entries are grounded in journal accounts, with dates linked to their
source posts and three existing image previews. Further life events need the
same source/date checks. The palette control works for now; a more expressive
treatment comes after its visual language is settled.
