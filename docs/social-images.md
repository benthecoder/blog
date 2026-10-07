# Social image delivery

`/og?title=...` uses Next.js's default Node.js runtime instead of the deprecated Edge runtime. It uses the same JPEG background, TTF font, JSX, styles, dimensions and title input.

The font and background are read from the deployment filesystem once per warm process. The JPEG is inlined as a data URL, removing the render-time request to the site’s own CDN. Its server copy is byte-identical to `public/og-bg.jpg`, whose public URL stays available. Concurrent requests share pending reads, and a failed asset read is retried on the next request. Successful reads remain cached independently. The OG output trace includes `app/og/AveriaSerifLibre-Bold.ttf` and `app/og/og-bg.jpg`. Other routes exclude those server-only assets, and all public assets remain excluded from function traces.

The existing browser cache remains `public, max-age=31536000, immutable`. A separate `Vercel-CDN-Cache-Control` header caches successful PNGs at Vercel for one day and permits stale responses during background revalidation for seven days. The URL query still distinguishes titles. Vercel consumes this header rather than forwarding it to browsers.

The PNG is completely rendered before cacheable success headers are returned. A rendering error therefore rejects the handler, instead of returning a partially streamed cacheable 200.

## Checks — October 7, 2026

- Ten concurrent requests and a later request share one font read. A failed read can retry.
- An image-rendering failure does not return a success response.
- The Node.js 24 production build and its output trace pass.
- Local production HTTP checks cover a short title, a long title with punctuation, and a missing title. Every PNG has the existing 1920×1080 dimensions. Repeated requests produce identical bytes.
- Before/after visual inspection preserves the checked image's appearance. Node and Edge use different renderers, so the PNGs are not pixel-identical: mean absolute channel difference is 0.032 on a 0–255 scale for the sample. The PNG shrank from 1,969,582 to 1,721,660 bytes (12.6%). This is one image, not a general compression guarantee or a measured production cost reduction.

References: [Next.js ImageResponse and custom fonts](https://nextjs.org/docs/app/api-reference/functions/image-response), [Vercel cache header precedence and lifetimes](https://vercel.com/docs/caching/cache-control-headers). The installed Next.js 16.4.0 runtime documentation marks Edge as deprecated and recommends removing the runtime export.

## Local background verification

- Three actual `ImageResponse` renders made three external background fetches before the change and zero afterward. The fetch fixture served the existing JPEG bytes.
- All three PNGs (short, long/punctuated, and empty titles) were byte-identical before and after. Render timing with an immediate fixture response showed no material CPU improvement; network latency and failure exposure are what this removes.
- Concurrent requests share one read per asset. A background failure retries without rereading the font.
- The existing JPEG adds 161,927 bytes to the OG function. Output trace checks verify it is confined to that function and public assets are excluded.

A controlled production build against `main` traced 1,287 OG files totaling 26,829,140 bytes, including all 1,042 posts. Keeping the OG paths within the route reduced this to 243 files totaling 24,560,463 bytes and zero posts. Traced file sizes are uncompressed dependency sizes, not a measurement of deployment ZIP size or cold-start latency.
