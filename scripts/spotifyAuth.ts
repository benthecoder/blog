/**
 * One-time helper to mint a new SPOTIFY_REFRESH_TOKEN.
 *
 * Refresh tokens get revoked when the Spotify password changes, when access is
 * removed from the account's "Apps" page, or when the app's settings change.
 * When that happens /now goes quiet, because the token exchange fails.
 *
 * This is a LOCAL developer tool — it is not part of the site and visitors
 * never run anything like it. The running site only ever does the server-side
 * refresh in utils/spotify.ts, using credentials that stay on the server.
 *
 *   1. In the Spotify dashboard (https://developer.spotify.com/dashboard),
 *      open your app → Settings → Redirect URIs, and add exactly:
 *          http://127.0.0.1:8888/callback
 *   2. pnpm spotify-auth
 *   3. Approve in the browser window that opens.
 *
 * The new refresh token is written straight into .env — it is never printed.
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { exec } from "node:child_process";

const ENV_PATH = ".env";
const SCOPE = "user-read-recently-played";

// Spotify compares the redirect URI byte-for-byte against the dashboard entry:
// scheme, host, port and path must all match, and a trailing slash counts.
// Note they require the loopback IP (127.0.0.1) — "localhost" is rejected.
// Set SPOTIFY_REDIRECT_URI in .env to match one you already have registered.
const DEFAULT_REDIRECT_URI = "http://127.0.0.1:8888/callback";

function readEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(ENV_PATH, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

/** Rewrites a single key in .env, preserving every other line as-is. */
function writeEnvValue(key: string, value: string) {
  const lines = readFileSync(ENV_PATH, "utf8").split("\n");
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (idx === -1) lines.push(`${key}=${value}`);
  else lines[idx] = `${key}=${value}`;
  writeFileSync(ENV_PATH, lines.join("\n"));
}

const env = readEnv();
const clientId = env.SPOTIFY_CLIENT_ID;
const clientSecret = env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing from .env");
  process.exit(1);
}

const REDIRECT_URI = env.SPOTIFY_REDIRECT_URI || DEFAULT_REDIRECT_URI;
const PORT = Number(new URL(REDIRECT_URI).port || 80);

console.log(`
────────────────────────────────────────────────────────────
Before continuing, the app whose client id is

    ${clientId}

must list this EXACT string under Settings → Redirect URIs
(then press Add, then Save):

    ${REDIRECT_URI}

"redirect_uri: Not matching configuration" means this string
and the dashboard entry differ, or Save wasn't pressed, or the
client id above belongs to a different app than the one edited.
────────────────────────────────────────────────────────────
`);

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error || !code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Authorization failed: ${error ?? "no code returned"}`);
    console.error(`\nAuthorization failed: ${error ?? "no code returned"}`);
    server.close();
    process.exit(1);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await tokenRes.json();

  if (!tokenRes.ok || !data.refresh_token) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Token exchange failed — check the terminal.");
    console.error(
      `\nToken exchange failed (${tokenRes.status}): ${data.error ?? ""} ${data.error_description ?? ""}`
    );
    server.close();
    process.exit(1);
  }

  writeEnvValue("SPOTIFY_REFRESH_TOKEN", data.refresh_token);

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<p>Done — new refresh token saved to .env. You can close this.</p>");
  console.log(
    `\nSaved a new SPOTIFY_REFRESH_TOKEN to .env (${data.refresh_token.length} chars).` +
      `\nRestart the dev server, then redeploy with the same value set in your host's env vars.`
  );
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(
    `Opening Spotify authorization…\nIf nothing opens, visit:\n${authUrl}\n`
  );
  const open =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${open} "${authUrl}"`);
});
