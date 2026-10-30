"use client";

import useSWR from "swr";

interface RecentlyPlayedData {
  tracks: {
    title: string;
    artist: string;
    songUrl: string;
    playedAt: string;
  }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ago(iso: string) {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - Date.parse(iso)) / 60000)
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// Same endpoint as /now, so SWR shares the cached response between them.
export default function LastPlayed({ profileUrl }: { profileUrl: string }) {
  const { data } = useSWR<RecentlyPlayedData>(
    "/api/spotify/recently-played",
    fetcher
  );
  const track = data?.tracks?.[0];

  if (!track) return <a href={profileUrl}>profile</a>;

  return (
    <span>
      <a href={track.songUrl}>
        &ldquo;{track.title}&rdquo; by {track.artist}
      </a>{" "}
      <span className="text-muted">{ago(track.playedAt)}</span>
    </span>
  );
}
