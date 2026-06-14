const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  name: string;
  images: { url: string }[];
  release_date?: string;
  total_tracks: number;
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
  duration_ms: number;
  track_number: number;
  popularity: number;
}

interface SpotifyRecentItem {
  track: SpotifyTrack;
  played_at: string;
}

async function getAccessToken() {
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

export async function getNowPlaying() {
  const { access_token } = await getAccessToken();

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
  });

  if (response.status === 204 || response.status > 400) {
    return { isPlaying: false };
  }

  const song = await response.json();

  if (!song.item) {
    return { isPlaying: false };
  }

  const item: SpotifyTrack = song.item;
  const isPlaying: boolean = song.is_playing;
  const progressPercent = Math.round(
    (song.progress_ms / item.duration_ms) * 100
  );

  return {
    isPlaying,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    albumImageUrl: item.album.images[0]?.url,
    songUrl: item.external_urls.spotify,
    duration_ms: item.duration_ms,
    progress_ms: song.progress_ms as number,
    progressPercent,
    releaseYear: item.album.release_date?.split("-")[0] ?? null,
    trackNumber: item.track_number,
    totalTracks: item.album.total_tracks,
    popularity: item.popularity,
  };
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
    album: item.track.album.name,
    albumImageUrl:
      item.track.album.images[1]?.url || item.track.album.images[0]?.url,
    songUrl: item.track.external_urls.spotify,
    playedAt: item.played_at,
  }));

  return { tracks };
}
