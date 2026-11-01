import "server-only";
import { z } from "zod";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;

// Only the fields /now reads. z.object drops the rest, so new fields Spotify
// adds never break parsing; a missing or renamed one fails loudly here.
const tokenResponseSchema = z.object({
  access_token: z.string().optional(),
  expires_in: z.number().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

const recentlyPlayedSchema = z.object({
  items: z.array(
    z.object({
      track: z.object({
        name: z.string(),
        artists: z.array(z.object({ name: z.string() })),
        album: z.object({ images: z.array(z.object({ url: z.string() })) }),
        external_urls: z.object({ spotify: z.string() }),
      }),
      played_at: z.string(),
    })
  ),
});

// Access tokens last an hour, so they're held in module memory and reused
// across requests. Without this every visitor to /now would trigger its own
// refresh call against Spotify. Refreshing is server-side only — the client
// id/secret/refresh token never leave the server, and visitors never see an
// OAuth flow.
let cachedToken: { value: string; expiresAt: number } | null = null;
let tokenRefresh: Promise<{ access_token: string }> | null = null;

async function getAccessToken(): Promise<{ access_token: string }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { access_token: cachedToken.value };
  }
  tokenRefresh ??= refreshAccessToken().finally(() => {
    tokenRefresh = null;
  });
  return tokenRefresh;
}

async function refreshAccessToken(): Promise<{ access_token: string }> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const data = tokenResponseSchema.parse(await response.json());

  // A revoked or expired refresh token comes back as 400 invalid_grant. Left
  // unchecked it yields `Bearer undefined` on the next call, which fails as a
  // generic 401 and hides the real cause — so surface it here instead.
  if (!response.ok || !data.access_token) {
    throw new Error(
      `Spotify token refresh failed (${response.status} ${data.error ?? "unknown"}): ${data.error_description ?? "no description"}`
    );
  }

  // Expire a minute early so an in-flight request can't use a stale token.
  const ttl = (data.expires_in ?? 3600) * 1000;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + ttl - 60_000,
  };

  return { access_token: data.access_token };
}

async function fetchRecentlyPlayed(limit: number) {
  const { access_token } = await getAccessToken();

  const response = await fetch(`${RECENTLY_PLAYED_ENDPOINT}?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `Spotify recently-played failed: ${response.status} ${response.statusText}`
    );
  }

  const data = recentlyPlayedSchema.parse(await response.json());

  const tracks = data.items.map((item) => ({
    title: item.track.name,
    artist: item.track.artists.map((a) => a.name).join(", "),
    albumImageUrl:
      item.track.album.images[1]?.url || item.track.album.images[0]?.url,
    songUrl: item.track.external_urls.spotify,
    playedAt: item.played_at,
  }));

  return { tracks };
}

const TRACK_TTL_MS = 5 * 60 * 1000;
type RecentTracks = Awaited<ReturnType<typeof fetchRecentlyPlayed>>;
const trackCache = new Map<
  number,
  { value: RecentTracks; expiresAt: number }
>();
const trackRequests = new Map<number, Promise<RecentTracks>>();

// Edge caching must expire with the stored response, rather than extending
// a nearly five-minute-old result by another full five minutes.
export function getRecentlyPlayedCacheSeconds(limit: number): number {
  return Math.max(
    0,
    Math.floor(((trackCache.get(limit)?.expiresAt ?? 0) - Date.now()) / 1000)
  );
}

export function getRecentlyPlayed(limit = 5): Promise<RecentTracks> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return Promise.reject(new Error("Invalid Spotify track limit"));
  }
  const cached = trackCache.get(limit);
  if (cached && Date.now() < cached.expiresAt)
    return Promise.resolve(cached.value);
  const pending = trackRequests.get(limit);
  if (pending) return pending;
  const request = fetchRecentlyPlayed(limit)
    .then((value) => {
      trackCache.set(limit, { value, expiresAt: Date.now() + TRACK_TTL_MS });
      return value;
    })
    .finally(() => trackRequests.delete(limit));
  trackRequests.set(limit, request);
  return request;
}
