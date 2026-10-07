# Social image delivery

`/og?title=...` uses Next.js's default Node.js runtime instead of the deprecated Edge runtime. It retains the same background URL, TTF font, JSX, styles, dimensions and title input.

The font is read from the deployment filesystem once per warm process. Concurrent requests share the pending read, and a failed read is retried on the next request. Next.js's output trace includes `app/og/AveriaSerifLibre-Bold.ttf`; it is not excluded with public assets.

The existing browser cache remains `public, max-age=31536000, immutable`. A separate `Vercel-CDN-Cache-Control` header caches successful PNGs at Vercel for one day and permits stale responses during background revalidation for seven days. The URL query still distinguishes titles. Vercel consumes this header rather than forwarding it to browsers.

The PNG is completely rendered before cacheable success headers are returned. A rendering error therefore rejects the handler, instead of returning a partially streamed cacheable 200.

## Checks — October 7, 2026

- Ten concurrent requests and a later request share one font read. A failed read can retry.
- An image-rendering failure does not return a success response.
- The Node.js 24 production build and its output trace pass.
- Local production HTTP checks cover a short title, a long title with punctuation, and a missing title. Every PNG has the existing 1920×1080 dimensions. Repeated requests produce identical bytes.
- Before/after visual inspection preserves the checked image's appearance. Node and Edge use different renderers, so the PNGs are not pixel-identical: mean absolute channel difference is 0.032 on a 0–255 scale for the sample. The PNG shrank from 1,969,582 to 1,721,660 bytes (12.6%). This is one image, not a general compression guarantee or a measured production cost reduction.

References: [Next.js ImageResponse and custom fonts](https://nextjs.org/docs/app/api-reference/functions/image-response), [Vercel cache header precedence and lifetimes](https://vercel.com/docs/caching/cache-control-headers). The installed Next.js 16.3.6 runtime documentation marks Edge as deprecated and recommends removing the runtime export.
