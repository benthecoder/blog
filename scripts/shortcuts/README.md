# posting thoughts from anywhere

The writing form is unlisted: bookmark `/tweet` directly. It has no link from the
public thoughts page and is excluded from the sitemap. Sign in with your existing
admin password, configured as
`ADMIN_SECRET`. The browser keeps an HttpOnly session for 30 days; the server
checks its signed expiry. Existing sessions need one fresh sign-in after this
change. A note can contain up to 5,000 characters, with an optional link and
link title.

Production sign-in and publishing require `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. Both fail closed if the rate-limit service is
unavailable. Readers do not need credentials.

For an iOS Shortcut, set a separate random `TWEET_SECRET` in the deployment and
in your local shell, then run `python3 scripts/shortcuts/build.py`. Sign/import
the generated `tweet.unsigned.shortcut` using Shortcuts on your Mac. The
resulting Shortcut sends `Authorization: Bearer <TWEET_SECRET>` to
`POST /api/tweet`. Keep the generated file private; it contains the capture
token and is ignored by git. Existing Shortcuts need this header before the
protected endpoint is deployed.

The capture token only authorizes publishing thoughts. It cannot sign in to
the admin panel or mint browser sessions. Links are stored as links; the
server does not fetch arbitrary URLs to generate previews.
