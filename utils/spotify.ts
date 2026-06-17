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

async function getAccessToken(): Promise<{ access_token: string }> {
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

  return response.json();
}

export async function getRecentlyPlayed(limit = 5) {
  const { access_token } = await getAccessToken();

  const response = await fetch(`${RECENTLY_PLAYED_ENDPOINT}?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
  });

  if (response.status > 400) {
    return { tracks: [] };
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
