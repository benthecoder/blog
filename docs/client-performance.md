# Client performance checks

The clock reuses its `Intl.DateTimeFormat` instance. It still renders New York time, updates once per second, and renders nothing on the server.

The knowledge map uses squared distances and direct coordinate scaling for hit testing. It keeps the existing mouse/touch radii, strict radius boundary, first-node tie behavior, and unclamped coordinates. Clicking an already selected article uses Next.js navigation instead of reloading the document.

The table of contents resolves heading elements when its items change, rather than on every scroll frame. It still measures their current positions each frame, so images changing the layout do not leave stale offsets. Its pending animation frame is cancelled on cleanup.

## Measurement

Local Node.js diagnostic, median of five runs on October 7, 2026:

| Operation | Before | After |
| --- | ---: | ---: |
| 10,000 hit tests across 1,022 map nodes | 278.7 ms | 26.3 ms |
| 5,000 clock reads | 157.4 ms | 4.1 ms |

These are isolated CPU measurements, not a claim about total page speed. The clock benchmark verified identical strings across 5,000 dates spanning daylight-saving changes. Map tests compare the new implementation against the previous D3/square-root algorithm across the committed map, portrait and wide viewports, and mouse/touch radii.

Production Vercel usage should be compared after deployment at the project level. Team totals do not establish which application or route incurred the usage.
