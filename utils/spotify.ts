const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

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

  const isPlaying = song.is_playing;
  const title = song.item.name;
  const artist = song.item.artists
    .map((artist: { name: string }) => artist.name)
    .join(", ");
  const album = song.item.album.name;
  const albumImageUrl = song.item.album.images[0]?.url;
  const songUrl = song.item.external_urls.spotify;
  const duration_ms = song.item.duration_ms;
  const progress_ms = song.progress_ms;
  const releaseYear = song.item.album.release_date
    ? song.item.album.release_date.split("-")[0]
    : null;
  const trackNumber = song.item.track_number;
  const totalTracks = song.item.album.total_tracks;
  const popularity = song.item.popularity;

  // Calculate progress percentage
  const progressPercent = Math.round((progress_ms / duration_ms) * 100);

  return {
    isPlaying,
    title,
    artist,
    album,
    albumImageUrl,
    songUrl,
    duration_ms,
    progress_ms,
    progressPercent,
    releaseYear,
    trackNumber,
    totalTracks,
    popularity,
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

  const tracks = data.items.map((item: any) => ({
    title: item.track.name,
    artist: item.track.artists
      .map((artist: { name: string }) => artist.name)
      .join(", "),
    album: item.track.album.name,
    albumImageUrl:
      item.track.album.images[1]?.url || item.track.album.images[0]?.url, // Medium or large image
    songUrl: item.track.external_urls.spotify,
    playedAt: item.played_at,
  }));

  return { tracks };
}

export async function getTopTracks(timeRange = "short_term", limit = 5) {
  const { access_token } = await getAccessToken();

  const response = await fetch(
    `${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: "no-store",
    }
  );

  if (response.status > 400) {
    return { tracks: [] };
  }

  const data = await response.json();

  const tracks = data.items.map((track: any) => ({
    title: track.name,
    artist: track.artists
      .map((artist: { name: string }) => artist.name)
      .join(", "),
    album: track.album.name,
    albumImageUrl: track.album.images[2]?.url,
    songUrl: track.external_urls.spotify,
  }));

  return { tracks };
}
