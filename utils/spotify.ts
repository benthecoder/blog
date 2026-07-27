const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  images: { url: string }[];
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
}

interface SpotifyRecentItem {
  track: SpotifyTrack;
  played_at: string;
}

// Access tokens last an hour, so they're held in module memory and reused
// across requests. Without this every visitor to /now would trigger its own
// refresh call against Spotify. Refreshing is server-side only — the client
// id/secret/refresh token never leave the server, and visitors never see an
// OAuth flow.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<{ access_token: string }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { access_token: cachedToken.value };
  }

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
  });

  const data = await response.json();

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

  return data;
}

export async function getRecentlyPlayed(limit = 5) {
  const { access_token } = await getAccessToken();

  const response = await fetch(`${RECENTLY_PLAYED_ENDPOINT}?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Spotify recently-played failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const tracks = (data.items as SpotifyRecentItem[]).map((item) => ({
    title: item.track.name,
    artist: item.track.artists.map((a) => a.name).join(", "),
    albumImageUrl:
      item.track.album.images[1]?.url || item.track.album.images[0]?.url,
    songUrl: item.track.external_urls.spotify,
    playedAt: item.played_at,
  }));

  return { tracks };
}
