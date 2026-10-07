# Blog delivery and build measurements

Measured locally on October 7, 2026, against main `4b846b6`. These are local checks, not measurements of production Vercel usage or promised billing savings. No layout, styling, editorial content, image quality, or original images changed.

## Changes and evidence

| Area | Change | Verification |
| --- | --- | --- |
| Spotify | Share concurrent token refreshes and track requests; cache tracks for five minutes. Successful CDN responses expire with the cached result rather than starting another five-minute window. Failures return 502 with no-store. | Twenty concurrent calls require one token request and one track request. Tests cover expiration, different limits, retry after failure, and remaining cache lifetime. Live requests returned ten tracks with decreasing cache age. |
| Post previews | Generate and cache previews on first request rather than prebuilding every preview. Read the requested article directly. | All 1,042 articles remain prebuilt. Prebuilt preview routes fell from 1,042 to zero; total generation tasks fell from 2,218 to 1,175. A live preview matched the baseline JSON exactly, repeated requests returned 200, and a missing post returned 404. |
| Link graph | Reuse a metadata-only index and derived graph within an immutable Vercel production deployment. Keep local editing fresh. | Ten graph calls fell from 10,420 Markdown reads to 1,042 reads. Local benchmark time fell from 591ms to 213ms. Tests check both deployment reuse and local edits, link precedence, backlinks, and omission of bodies from the public index. |
| Related posts | Retain the top four recommendations per article, instead of all ranked candidates. Larger explicit limits are computed when requested. | Retained recommendation records fell from 60,502 to 3,757. Recommendations and their ordering match the previous algorithm across the entire current map. Record counts are not heap-memory measurements. |
| Post images | Use native lazy-image `sizes="auto"` with the existing viewport fallback. | A previously uncached 3840×2160 photo selected a 1200px source at a 569px displayed width and 1.6 device pixel ratio. The AVIF response was 11,732 bytes versus 21,584 bytes at 1920px, both at quality 75. A repeat request was a cache HIT. Savings vary by source and browser; some small originals produce identical bytes at both widths. |
| Knowledge map | Deliver nodes initially and fetch the content-addressed edge asset on first interaction. Preserve the complete server map for recommendations. | Initial JSON is 213,014 bytes instead of the complete 685,469-byte map. Tests verify matching nodes, edges, labels, and stable asset hashes. Current labels were preserved; embedding and label generation were not rerun. |

Native image `auto` sizing applies to lazy-loaded images and uses their actual layout size. Browsers without support use the existing fallback. See [MDN's image sizes documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#sizes). Fullscreen originals and gallery image sizing are unchanged.

## Build timing

The baseline static-generation phase took 48 seconds. Removing eager previews alone left it at 45 seconds; adding the deployed link snapshot brought it to 14.7 seconds. The final production build completed successfully with 1,175 generation tasks and all 1,042 articles prebuilt.

Compiler caches and machine load differ between runs, so overall build wall time is not a controlled comparison. The graph scan count and route counts are stronger evidence than a single timing run. Preview generation moves work to the first preview request; that request may be slower than a prebuilt preview.

## Checks

- 254 tests across 36 files passed.
- ESLint and oxlint passed with five existing warnings.
- Knip reported no unused items.
- TypeScript and the production build passed.
- Live production-mode checks covered previews, Spotify, and image source selection and cache responses.

Reproduce the normal checks with `pnpm test`, `pnpm lint`, `pnpm check:unused`, and `VERCEL=1 pnpm build`. Deployment snapshots are enabled only when both `NODE_ENV=production` and `VERCEL=1`; development and standalone local editing retain fresh filesystem reads.

After deployment, compare project-specific Vercel origin transfer, ISR usage, image transformations and build duration over comparable traffic periods. The team-wide usage dashboard alone cannot attribute those costs to this blog.

## Public feed caching follow-up

The thoughts page previously combined the Edge runtime with `revalidate = 3600`. That combination cannot use ISR. It now uses Node's default runtime and explicitly prerenders with the same hourly interval. The production prerender manifest confirms `/thoughts` has `initialRevalidateSeconds: 3600`. New thoughts may take up to an hour to appear in this initial snapshot, followed by regeneration on the next visit; this preserves the interval originally declared by the page.

The public pagination API returns successful reads with `max-age=0, s-maxage=60, stale-while-revalidate=60`. Invalid cursors are rejected before querying; database failures use `no-store`. The Curius proxy explicitly caches successful public responses for one hour at the CDN, bounds upstream requests with a ten-second timeout, and returns uncached generic 502 responses for HTTP, network, or JSON failures. Neither route caches authenticated content.

This follows [Next.js's existing caching model](https://nextjs.org/docs/app/guides/caching-without-cache-components) and [Vercel's response cache rules](https://vercel.com/docs/caching/cache-control-headers). The application has not enabled Cache Components; enabling it would require a separate migration of existing segment configuration.

Follow-up validation: 259 tests across 37 files passed, lint passed with the same five existing warnings, and the full production build passed. Unit checks cover query bounds, invalid cursors, response shape, cache headers and upstream failures. Local Next response checks can verify headers and ISR output; CDN hit rates and reduced invocation counts require deployment measurements.

A live Curius response contained 3,117 links and was 2,788,081 bytes uncompressed. Keeping every link's `id`, `title`, `link` and `createdDate`, in the same order, reduces the response to 542,899 bytes (80.5% smaller). Unused snippets and crawler metadata are omitted. The page's fetcher now rejects HTTP failures so its existing error handling runs. This does not change the list's rendering. Compressed transfer and production cache statistics still need measurement.
