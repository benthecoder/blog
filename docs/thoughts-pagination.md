# Thoughts pagination

An HTTP error previously reached the client as an object rather than a page of
thoughts. Its missing `length` made pagination mark the stream finished. Loading
state also recreated the intersection observer, which could immediately repeat
failed requests while the marker remained visible.

The client now checks HTTP status and validates each page before appending it.
Rows must have valid timestamps and strictly decreasing positive IDs below the
requested cursor. A failed request leaves pagination available; scrolling the
marker out of view and back in retries. Successful full pages still continue
loading while the marker is visible. Only one request runs at a time, with a
10-second timeout and cancellation when the page unmounts.

Date and time formatting reuse two `Intl.DateTimeFormat` instances instead of
constructing formatters for every row on every render. The existing locales,
New York time zone, markup, and styling are preserved.

## Verification

- Four regression tests cover HTTP failures, malformed or non-advancing pages,
  invalid cursors, empty final pages, and forwarding cancellation.
- A production browser run through a temporary local fixture returned HTTP 500
  for the first pagination request. The stream stayed open with one request and
  no automatic retry loop. Scrolling away and back appended the next successful
  page and showed the existing end marker: two requests total. The fixture was
  outside the repository and did not write to the database.
- On the merged main base: 279 tests pass; lint, unused-code checks, TypeScript,
  and the Node 24 production build pass.

This change reduces avoidable client work and failed pagination requests. It
does not establish a measured reduction in Vercel usage.
