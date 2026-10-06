# Private capture

`POST /api/tweet` requires authentication in production. Local authoring still works without a token. The public `/tweet` page redirects to `/thoughts`; hiding the form is not the API's protection.

For the iOS shortcut:

1. Generate a separate, random `CAPTURE_SECRET` (for example, `openssl rand -hex 32`).
2. Set it as a production environment variable in Vercel and redeploy.
3. In the shortcut's **Get Contents of URL** action, add a header:
   - Name: `Authorization`
   - Value: `Bearer YOUR_CAPTURE_SECRET`
4. Keep the token in your own shortcut. Do not commit or share an exported shortcut containing it. The repository's shortcut artifact and `build.py` do not embed a secret; configure the header after importing.

The capture token only permits adding thoughts/links. It is not an admin API token. The API also accepts the existing owner's admin session/token. Missing, incorrect, or unconfigured credentials fail closed with 401 before any database operation.

Do not deploy the fix until the environment token and shortcut header are ready if uninterrupted shortcut capture matters. Once deployed, the old unauthenticated shortcut receives 401. No thoughts are deleted or migrated by this change.

The server still does not fetch submitted URLs. Missing link titles are resolved by the local draft script.
